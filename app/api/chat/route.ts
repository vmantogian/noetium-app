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
    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const embedding = embeddingResponse.data[0].embedding;

    // Search educational content
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

// Build RAG context from search results
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

    const systemPrompt = `Είσαι ο Noetia, ένας φιλικός AI δάσκαλος για Έλληνες μαθητές.

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
- Αν ο μαθητής ζητάει εικόνα/διάγραμμα/σχήμα, περιέγραψε τι θα ήταν χρήσιμο να δει
- Τελείωσε με: [ΘΕΛΩ_ΕΙΚΟΝΑ: περιγραφή της εικόνας στα αγγλικά]
- Παράδειγμα: [ΘΕΛΩ_ΕΙΚΟΝΑ: simple diagram showing the water cycle with arrows]

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
      max_tokens: 1000,
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

        // Check if AI wants to generate an image
        const imageMatch = fullResponse.match(/\[ΘΕΛΩ_ΕΙΚΟΝΑ:\s*(.+?)\]/);
        if (imageMatch) {
          const imagePrompt = imageMatch[1];
          
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'generating_image' })}\n\n`));
            
            const imageResponse = await openai.images.generate({
              model: 'dall-e-3',
              prompt: `Educational illustration for Greek students. ${imagePrompt}. Safe for children, clear and simple, no text.`,
              n: 1,
              size: '1024x1024',
              quality: 'standard',
            });

            // Safely access the image URL
            const imageUrl = imageResponse.data?.[0]?.url;
            if (imageUrl) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'image', imageUrl })}\n\n`));
            }
          } catch (imgError) {
            console.error('Image generation error:', imgError);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'image_error', error: 'Δεν μπόρεσα να δημιουργήσω εικόνα' })}\n\n`));
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
