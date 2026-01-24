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

// ============================================================================
// IMAGE SEARCH: Find textbook descriptions for curriculum-accurate generation
// ============================================================================

async function searchTextbookImageDescriptions(
  supabase: any,
  query: string,
  subject?: string
): Promise<{ description: string; source: string; labels: string[] } | null> {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const embedding = embeddingResponse.data[0].embedding;

    // Search for textbook image descriptions
    const { data, error } = await supabase.rpc('search_educational_content', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 3,
      filter_subject: subject || null
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    // Find best textbook image match
    for (const result of data) {
      const isTextbookImage = result.metadata?.content_type === 'textbook_image';
      
      if (isTextbookImage && result.similarity > 0.55) {
        // Extract potential labels from description (Greek terms)
        const greekTerms = result.content.match(/«[^»]+»|"[^"]+"/g) || [];
        const labels = greekTerms.map((t: string) => t.replace(/[«»""]/g, ''));
        
        return {
          description: result.content,
          source: result.source_title || result.source,
          labels: labels.slice(0, 6) // Max 6 labels
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Textbook description search error:', error);
    return null;
  }
}

// ============================================================================
// IMAGE GENERATION: GPT-4o (better text/Greek handling)
// ============================================================================

interface GeneratedImage {
  url: string;
  provider: string;
}

async function generateWithGPT4o(prompt: string, greekLabels: string[] = []): Promise<string | null> {
  try {
    // Include Greek labels in the prompt for GPT-4o (it handles text better)
    let fullPrompt = `Educational diagram: ${prompt}

Style: Clean, flat, vector illustration. White background. Bright, friendly colors. Child-safe, appropriate for school textbooks.`;

    // If we have Greek labels, ask GPT-4o to include them
    if (greekLabels.length > 0) {
      fullPrompt += `

Include these labels clearly in the image:
${greekLabels.map(l => `- ${l}`).join('\n')}`;
    } else {
      fullPrompt += `

IMPORTANT: Do NOT include any text or labels in the image. Keep it clean and simple.`;
    }

    const response = await openai.images.generate({
      model: 'gpt-4o', // GPT-4o image generation
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
    });
    
    return response.data?.[0]?.url || null;
  } catch (error: any) {
    console.error('GPT-4o image error:', error?.message || error);
    
    // Fallback to DALL-E 3 if GPT-4o fails
    try {
      console.log('Falling back to DALL-E 3...');
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `Educational illustration: ${prompt}. Clean flat design, white background, NO TEXT, NO LABELS.`,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });
      return response.data?.[0]?.url || null;
    } catch (fallbackError) {
      console.error('DALL-E fallback error:', fallbackError);
      return null;
    }
  }
}

async function generateImage(prompt: string, greekLabels: string[] = []): Promise<GeneratedImage | null> {
  const url = await generateWithGPT4o(prompt, greekLabels);
  if (url) {
    return { url, provider: 'GPT-4o' };
  }
  return null;
}

// ============================================================================
// RAG SEARCH
// ============================================================================

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

Χρησιμοποίησε αυτό το υλικό για να βοηθήσεις τον μαθητή.
`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

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

ΣΩΚΡΑΤΙΚΗ ΜΕΘΟΔΟΣ:
- ΠΟΤΕ μη δίνεις απευθείας απαντήσεις
- Κάνε ερωτήσεις που καθοδηγούν
- Δώσε hints, όχι λύσεις
- Ενθάρρυνε την πρόοδο

ΣΤΥΛ:
- Φιλικός τόνος, λίγα emoji
- Σύντομες απαντήσεις (2-3 παράγραφοι)
- Μία ερώτηση τη φορά

ΕΙΚΟΝΕΣ:
Αν ο μαθητής ζητάει εικόνα/διάγραμμα:
1. Εξήγησε σύντομα τι θα δείξει (1 πρόταση)
2. Βάλε το tag χωρίς άλλη εξήγηση:

[ΕΙΚΟΝΑ]
prompt: Simple flat educational diagram showing [concept in English]. White background, arrows, shapes. NO TEXT NO NUMBERS.
labels:
- text: "Ελληνική ετικέτα" | x: 50 | y: 20
- text: "x" | x: 95 | y: 50
[/ΕΙΚΟΝΑ]

${ragContext}

Απάντησε ΜΟΝΟ στα Ελληνικά.`;

    // Build messages
    const messages: Anthropic.MessageParam[] = conversationHistory?.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })) || [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: cleanBase64 },
          },
          { type: 'text', text: message || 'Τι βλέπεις σε αυτή την εικόνα;' },
        ],
      });
    } else {
      messages.push({ role: 'user', content: message });
    }

    // Stream response
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
        if (sources.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`));
        }

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullResponse += event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`));
          }
        }

        // Handle image request
        const imageMatch = fullResponse.match(/\[ΕΙΚΟΝΑ\]([\s\S]*?)\[\/ΕΙΚΟΝΑ\]/);
        if (imageMatch) {
          const imageBlock = imageMatch[1];
          
          const promptMatch = imageBlock.match(/prompt:\s*(.+?)(?=\nlabels:|$)/s);
          const imagePrompt = promptMatch ? promptMatch[1].trim() : '';
          
          // Extract labels from Claude's response
          const labels: { text: string; x: number; y: number }[] = [];
          const labelMatches = imageBlock.matchAll(/- text:\s*"(.+?)"\s*\|\s*x:\s*(\d+)\s*\|\s*y:\s*(\d+)/g);
          for (const match of labelMatches) {
            labels.push({ text: match[1], x: parseInt(match[2]), y: parseInt(match[3]) });
          }
          
          // Extract just the Greek label texts for GPT-4o
          const greekLabelTexts = labels.map(l => l.text);
          
          if (imagePrompt) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'generating_image' })}\n\n`));
              
              // STEP 1: Search for curriculum-accurate textbook description
              const textbookMatch = await searchTextbookImageDescriptions(supabase, imagePrompt, dbSubject);
              
              // STEP 2: Generate clean image with GPT-4o
              // Use textbook description if found, otherwise use Claude's prompt
              const generationPrompt = textbookMatch 
                ? `${textbookMatch.description}. ${imagePrompt}`
                : imagePrompt;
              
              // Combine labels from textbook and Claude's response
              const allLabels = textbookMatch 
                ? [...new Set([...textbookMatch.labels, ...greekLabelTexts])]
                : greekLabelTexts;
              
              const generated = await generateImage(generationPrompt, allLabels);
              
              if (generated) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'image_with_labels', 
                  imageUrl: generated.url,
                  labels: labels, // Keep position labels for overlay fallback
                  provider: generated.provider,
                  source: textbookMatch?.source || null,
                  isTextbook: false,
                  curriculumBased: !!textbookMatch
                })}\n\n`));
              } else {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'image_error', 
                  error: 'Δεν μπόρεσα να δημιουργήσω εικόνα' 
                })}\n\n`));
              }
            } catch (imgError) {
              console.error('Image error:', imgError);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'image_error' })}\n\n`));
            }
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();

        // Save progress
        try {
          await supabase.from('user_progress').insert({
            user_id: user.id,
            feature: 'chat',
            activity_type: 'conversation',
            activity_id: subject,
            completed: true,
            metadata: { subject, usedRAG: sources.length > 0, generatedImage: !!imageMatch }
          });
        } catch (e) {}
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
