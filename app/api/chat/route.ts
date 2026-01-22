import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { searchEducationalContent, buildRAGContext } from '@/lib/rag';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
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

    const { message, subject, conversationHistory } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const subjectContext = subjectPrompts[subject] || subjectPrompts.general;
    const dbSubject = subjectMapping[subject] || undefined;

    // RAG: Search educational content (run in parallel preparation)
    let ragContext = '';
    let sources: any[] = [];
    
    try {
      const searchResults = await searchEducationalContent(message, {
        matchThreshold: 0.4,
        matchCount: 3, // Reduced from 5 for speed
        filterSubject: dbSubject,
      });

      if (searchResults.length > 0) {
        ragContext = buildRAGContext(searchResults);
        sources = searchResults.map(r => ({
          title: r.sourceTitle,
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

${ragContext}

Απάντησε ΜΟΝΟ στα Ελληνικά.`;

    const messages: Anthropic.MessageParam[] = conversationHistory?.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })) || [];

    messages.push({ role: 'user', content: message });

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages,
    });

    // Create a ReadableStream for the response
    const encoder = new TextEncoder();
    
    const readableStream = new ReadableStream({
      async start(controller) {
        // First, send sources if available
        if (sources.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`));
        }

        // Stream the text
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`));
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
            metadata: { subject, usedRAG: sources.length > 0, sourceCount: sources.length }
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
