import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

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

ΕΙΚΟΝΕΣ ΜΕ ΕΛΛΗΝΙΚΕΣ ΕΤΙΚΕΤΕΣ:
Αν ο μαθητής ζητάει εικόνα/διάγραμμα/σχήμα:
1. Πρώτα εξήγησε τι θα δείξει η εικόνα
2. Τελείωσε με το ειδικό tag που περιέχει:
   - Περιγραφή εικόνας στα ΑΓΓΛΙΚΑ (χωρίς κείμενο στην εικόνα)
   - Ελληνικές ετικέτες με θέσεις (x%, y%)

ΜΟΡΦΗ TAG:
[ΕΙΚΟΝΑ]
prompt: English description of image WITHOUT ANY TEXT. Clean diagram with arrows and visual elements only.
labels:
- text: "Ήλιος" | x: 15 | y: 10
- text: "Νερό" | x: 50 | y: 85
- text: "CO₂" | x: 20 | y: 40
- text: "O₂" | x: 80 | y: 40
[/ΕΙΚΟΝΑ]

Σημαντικό: Οι θέσεις είναι ποσοστά (0-100) από αριστερά (x) και πάνω (y).

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
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'generating_image' })}\n\n`));
              
              // Generate clean image with DALL-E (NO TEXT)
              const safePrompt = `Educational illustration for children. ${imagePrompt}. 
CRITICAL: NO TEXT, NO LABELS, NO WORDS, NO LETTERS, NO NUMBERS anywhere in the image.
Use only visual elements: arrows, icons, symbols, colors, shapes.
Clean, simple, colorful, child-friendly style suitable for elementary school students.
White or light background for clarity.`;

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
                // Send image URL with labels for frontend overlay
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'image_with_labels', 
                  imageUrl,
                  labels 
                })}\n\n`));
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
