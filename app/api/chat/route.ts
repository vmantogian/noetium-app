import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const subjectMapping: Record<string, string> = {
  math: 'Μαθηματικά',
  physics: 'Φυσική',
  chemistry: 'Χημεία',
  biology: 'Βιολογία',
  history: 'Ιστορία',
  greek: 'Νεοελληνική Γλώσσα',
  geography: 'Γεωγραφία',
  general: '',
};

const subjectPrompts: Record<string, string> = {
  math: 'Είσαι ειδικός στα Μαθηματικά. Χρησιμοποίησε παραδείγματα με αριθμούς και σχήματα.',
  physics: 'Είσαι ειδικός στη Φυσική. Εξήγησε με πειράματα και παραδείγματα από την καθημερινότητα.',
  chemistry: 'Είσαι ειδικός στη Χημεία. Χρησιμοποίησε μοριακά μοντέλα και αντιδράσεις.',
  biology: 'Είσαι ειδικός στη Βιολογία. Εξήγησε με αναφορές σε ζωντανούς οργανισμούς.',
  history: 'Είσαι ειδικός στην Ιστορία. Χρησιμοποίησε ιστορίες και χρονολογίες.',
  greek: 'Είσαι ειδικός στα Ελληνικά. Βοήθα με γραμματική, συντακτικό και λογοτεχνία.',
  geography: 'Είσαι ειδικός στη Γεωγραφία. Χρησιμοποίησε χάρτες και τοποθεσίες.',
  general: 'Είσαι γενικός δάσκαλος. Βοήθα με οποιοδήποτε θέμα.',
};

// Search for existing textbook images
async function searchTextbookImages(
  supabase: any,
  query: string,
  subject?: string
): Promise<{ content: string; source_title: string } | null> {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const embedding = embeddingResponse.data[0].embedding;

    // Search for image descriptions in educational content
    const { data, error } = await supabase.rpc('search_educational_content', {
      query_embedding: embedding,
      match_threshold: 0.65,  // Higher threshold for better matches
      match_count: 1,
      filter_subject: subject || null
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    // Check if this is an image description
    const result = data[0];
    const isImageContent = result.metadata?.content_type === 'image_description' ||
                          result.content?.toLowerCase().includes('εικόνα') ||
                          result.content?.toLowerCase().includes('διάγραμμα') ||
                          result.content?.toLowerCase().includes('σχήμα');

    if (isImageContent && result.similarity > 0.7) {
      return {
        content: result.content,
        source_title: result.source_title || result.source
      };
    }

    return null;
  } catch (error) {
    console.error('Textbook image search error:', error);
    return null;
  }
}

// RAG search function
async function searchEducationalContent(
  supabase: any,
  query: string,
  options: { matchThreshold?: number; matchCount?: number; filterSubject?: string }
) {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const embedding = embeddingResponse.data[0].embedding;

    const { data, error } = await supabase.rpc('search_educational_content', {
      query_embedding: embedding,
      match_threshold: options.matchThreshold || 0.4,
      match_count: options.matchCount || 3,
      filter_subject: options.filterSubject || null
    });

    if (error) {
      console.error('RAG search error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('RAG search error:', error);
    return [];
  }
}

function buildRAGContext(results: any[]): string {
  if (results.length === 0) return '';

  const context = results.map((r, i) => 
    `[Πηγή ${i + 1}: ${r.source_title || r.source}]\n${r.content}`
  ).join('\n\n');

  return `
ΣΧΕΤΙΚΟ ΥΛΙΚΟ ΑΠΟ ΣΧΟΛΙΚΑ ΒΙΒΛΙΑ:
${context}

Χρησιμοποίησε αυτό το υλικό για να βοηθήσεις τον μαθητή, αλλά μην το αντιγράφεις αυτολεξεί.
`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { message, subject, conversationHistory, imageBase64 } = await request.json();

    if (!message && !imageBase64) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const subjectContext = subjectPrompts[subject] || subjectPrompts.general;
    const dbSubject = subjectMapping[subject] || undefined;

    // RAG: Search educational content
    let ragContext = '';
    let sources: any[] = [];
    
    try {
      const searchResults = await searchEducationalContent(supabase, message, {
        matchThreshold: 0.4,
        matchCount: 3,
        filterSubject: dbSubject,
      });

      if (searchResults.length > 0) {
        ragContext = buildRAGContext(searchResults);
        sources = searchResults.map((r: any) => ({
          title: r.source_title,
          source: r.source,
          similarity: r.similarity
        }));
      }
    } catch (ragError) {
      console.error('RAG search error:', ragError);
    }

    const systemPrompt = `Είσαι ο Noetia, ένας φιλικός AI δάσκαλος για Έλληνες μαθητές Δημοτικού, Γυμνασίου και Λυκείου.

${subjectContext}

ΚΑΝΟΝΕΣ ΣΩΚΡΑΤΙΚΗΣ ΜΕΘΟΔΟΥ:
1. ΠΟΤΕ μη δίνεις απευθείας απαντήσεις σε ασκήσεις
2. Κάνε ερωτήσεις που οδηγούν τον μαθητή στη σωστή κατεύθυνση
3. Δώσε hints αντί για λύσεις
4. Ενθάρρυνε τον μαθητή όταν κάνει πρόοδο
5. Χρησιμοποίησε απλή γλώσσα κατάλληλη για μαθητές

ΣΤΥΛ:
- Φιλικός και ενθαρρυντικός τόνος
- Χρησιμοποίησε emoji με μέτρο 
- Κράτα τις απαντήσεις σύντομες (2-3 παράγραφοι max)
- Κάνε μία ερώτηση τη φορά

ΕΙΚΟΝΕΣ:
Αν ο μαθητής ζητάει εικόνα/διάγραμμα/σχήμα:
1. Πρώτα εξήγησε ΣΥΝΤΟΜΑ τι θα δείξει η εικόνα (1-2 προτάσεις)
2. ΜΗΝ περιγράφεις τις ετικέτες στο κείμενο
3. Τελείωσε με το ειδικό tag:

[ΕΙΚΟΝΑ]
prompt: Simple educational diagram showing [concept]. Flat vector style, white background, use arrows and simple shapes. NO TEXT, NO NUMBERS, NO AXES WITH MARKINGS. If axes needed, use only plain arrows.
labels:
- text: "Ετικέτα" | x: 50 | y: 15
- text: "x" | x: 95 | y: 52
- text: "y" | x: 52 | y: 5
[/ΕΙΚΟΝΑ]

ΚΑΝΟΝΕΣ ΕΙΚΟΝΑΣ:
- prompt στα ΑΓΓΛΙΚΑ, ζήτα ΠΑΝΤΑ: "NO TEXT, NO NUMBERS, NO AXES WITH MARKINGS"
- labels στα ΕΛΛΗΝΙΚΑ (ή σύμβολα όπως x, y, r, θ, ω)
- Αν χρειάζονται άξονες, πρόσθεσε ετικέτες "x", "y", "0" κτλ στα labels
- Θέσεις x,y είναι ποσοστά (0-100%)
- Μέχρι 8 ετικέτες max

${ragContext}

Απάντησε ΜΟΝΟ στα Ελληνικά.`;

    // Build messages array
    const messages: Anthropic.MessageParam[] = conversationHistory?.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })) || [];

    // If image is provided, add it to the message
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            type: 'text',
            text: message || 'Τι βλέπεις σε αυτή την εικόνα; Μπορείς να με βοηθήσεις να την καταλάβω;',
          },
        ],
      });
    } else {
      messages.push({ role: 'user', content: message });
    }

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: messages,
    });

    const encoder = new TextEncoder();
    let fullResponse = '';
    
    const readableStream = new ReadableStream({
      async start(controller) {
        // Send sources if available
        if (sources.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`));
        }

        // Stream the text
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullResponse += event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`));
          }
        }

        // Check if AI wants to generate an image with labels
        const imageMatch = fullResponse.match(/\[ΕΙΚΟΝΑ\]([\s\S]*?)\[\/ΕΙΚΟΝΑ\]/);
        if (imageMatch) {
          const imageBlock = imageMatch[1];
          
          // Parse prompt
          const promptMatch = imageBlock.match(/prompt:\s*(.+?)(?=\nlabels:|$)/s);
          const imagePrompt = promptMatch ? promptMatch[1].trim() : '';
          
          // Parse labels
          const labels: { text: string; x: number; y: number }[] = [];
          const labelMatches = imageBlock.matchAll(/- text:\s*"(.+?)"\s*\|\s*x:\s*(\d+)\s*\|\s*y:\s*(\d+)/g);
          for (const match of labelMatches) {
            labels.push({
              text: match[1],
              x: parseInt(match[2]),
              y: parseInt(match[3])
            });
          }
          
          if (imagePrompt) {
            try {
              // STEP 1: Search for existing textbook image first
              const textbookImage = await searchTextbookImages(supabase, imagePrompt, dbSubject);
              
              if (textbookImage) {
                // Found textbook image - send description instead of generating
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'textbook_image', 
                  description: textbookImage.content,
                  source: textbookImage.source_title
                })}\n\n`));
              } else {
                // STEP 2: Generate with DALL-E if no textbook image
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'generating_image' })}\n\n`));
                
                // Clean, minimal prompt for better visuals
                const safePrompt = `Educational illustration for children. ${imagePrompt}
CRITICAL STYLE REQUIREMENTS:
- Flat design, minimal and clean, vector illustration style
- Solid white or very light solid color background
- ABSOLUTELY NO TEXT, NO LABELS, NO WORDS, NO LETTERS, NO NUMBERS anywhere
- NO coordinate axes with numbers or tick marks
- If showing axes, use only simple arrows without any markings
- NO rulers, NO scales, NO measurement markings
- Simple geometric shapes, arrows, and icons only
- Bright, friendly, saturated colors
- Child-safe, educational content
- Clean, uncluttered composition`;

                const imageResponse = await openai.images.generate({
                  model: 'dall-e-3',
                  prompt: safePrompt,
                  n: 1,
                  size: '1024x1024',
                  quality: 'standard',
                  style: 'vivid',
                });

                const imageUrl = imageResponse.data?.[0]?.url;
                if (imageUrl) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    type: 'image_with_labels', 
                    imageUrl,
                    labels 
                  })}\n\n`));
                }
              }
            } catch (imgError) {
              console.error('Image generation error:', imgError);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'image_error', error: 'Δεν μπόρεσα να δημιουργήσω εικόνα' })}\n\n`));
            }
          }
        }

        // Send done signal
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();

        // Save progress in background
        try {
          await supabase.from('user_progress').insert({
            user_id: user.id,
            feature: 'chat',
            activity_type: 'conversation',
            activity_id: subject,
            completed: true,
            metadata: { 
              subject, 
              usedRAG: sources.length > 0, 
              sourceCount: sources.length,
              hadImage: !!imageBase64,
              generatedImage: !!imageMatch
            }
          });
        } catch (e) {
          console.error('Progress save error:', e);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
