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

// ============================================================================
// SUBJECT & GRADE MAPPINGS
// ============================================================================

const subjectMapping: Record<string, string> = {
  math: 'Μαθηματικά',
  physics: 'Φυσική',
  chemistry: 'Χημεία',
  biology: 'Βιολογία',
  history: 'Ιστορία',
  greek: 'Νεοελληνική Γλώσσα',
  geography: 'Γεωγραφία',
  literature: 'Λογοτεχνία',
  it: 'Πληροφορική',
  english: 'Αγγλικά',
  general: '',
};

const subjectPrompts: Record<string, string> = {
  math: 'Είσαι ειδικός στα Μαθηματικά. Χρησιμοποίησε παραδείγματα με αριθμούς, σχήματα και βήμα-βήμα λύσεις.',
  physics: 'Είσαι ειδικός στη Φυσική. Εξήγησε με πειράματα και παραδείγματα από την καθημερινότητα.',
  chemistry: 'Είσαι ειδικός στη Χημεία. Χρησιμοποίησε μοριακά μοντέλα, αντιδράσεις και εξισώσεις.',
  biology: 'Είσαι ειδικός στη Βιολογία. Εξήγησε με αναφορές σε ζωντανούς οργανισμούς και διαγράμματα.',
  history: 'Είσαι ειδικός στην Ιστορία. Χρησιμοποίησε αφηγήσεις, χρονολογίες και ιστορικά πλαίσια.',
  greek: 'Είσαι ειδικός στα Ελληνικά. Βοήθα με γραμματική, συντακτικό, λογοτεχνία και κείμενα.',
  geography: 'Είσαι ειδικός στη Γεωγραφία. Χρησιμοποίησε χάρτες, τοποθεσίες και γεωγραφικά δεδομένα.',
  literature: 'Είσαι ειδικός στη Λογοτεχνία. Αναλύεις κείμενα, ποιήματα και λογοτεχνικά ρεύματα.',
  it: 'Είσαι ειδικός στην Πληροφορική. Εξηγείς αλγόριθμους, κώδικα και τεχνολογικές έννοιες.',
  english: 'Είσαι ειδικός στα Αγγλικά. Βοήθα με grammar, vocabulary και comprehension.',
  general: 'Είσαι γενικός δάσκαλος. Βοήθα με οποιοδήποτε θέμα.',
};

// Grade-level persona adjustments
interface GradeConfig {
  level: 'dimotiko' | 'gymnasio' | 'lykeio';
  maxTokens: number;
  tone: string;
  complexity: string;
  visualBias: string;
}

function getGradeConfig(grade?: string): GradeConfig {
  if (!grade) return getGradeConfig('gymnasio_a');

  const g = grade.toLowerCase();

  // Δημοτικό: Γ'-ΣΤ' (ages 8-12)
  if (g.includes('dimotiko') || g.includes('δημοτικ') || ['c_dim', 'd_dim', 'e_dim', 'st_dim', '3', '4', '5', '6'].some(x => g.includes(x))) {
    return {
      level: 'dimotiko',
      maxTokens: 800,
      tone: `ΤΟΝΟΣ ΓΙΑ ΔΗΜΟΤΙΚΟ:
- Πολύ φιλικός, ζεστός τόνος σαν αγαπημένος δάσκαλος
- Απλές, κοντές προτάσεις (μέγιστο 15 λέξεις)
- Χρησιμοποίησε 1-2 emoji ανά απάντηση
- Παραδείγματα από καθημερινά πράγματα (παιχνίδια, ζώα, φαγητό)
- Μέγιστο 2 μικρές παράγραφοι ανά απάντηση
- Επιβράβευσε κάθε σωστή σκέψη ("Μπράβο!", "Σωστά σκέφτεσαι!")
- Χρησιμοποίησε αναλογίες από τον κόσμο του παιδιού`,
      complexity: 'Πολύ απλή γλώσσα. Μόνο βασικές έννοιες. Βήμα-βήμα.',
      visualBias: 'ΠΡΟΤΕΙΝΕ ΕΙΚΟΝΑ σχεδόν πάντα - τα παιδιά μαθαίνουν οπτικά.',
    };
  }

  // Γυμνάσιο: Α'-Γ' (ages 12-15)
  if (g.includes('gymnasio') || g.includes('γυμνάσι') || ['a_gym', 'b_gym', 'c_gym', '7', '8', '9'].some(x => g.includes(x))) {
    return {
      level: 'gymnasio',
      maxTokens: 1200,
      tone: `ΤΟΝΟΣ ΓΙΑ ΓΥΜΝΑΣΙΟ:
- Φιλικός αλλά πιο ώριμος τόνος
- Ενθαρρυντικός χωρίς να είναι παιδικός
- Μέτρια πολυπλοκότητα στη γλώσσα
- 2-3 παράγραφοι ανά απάντηση
- Χρησιμοποίησε σύγχρονα παραδείγματα (τεχνολογία, αθλητισμός, μουσική)
- Ενθάρρυνε κριτική σκέψη`,
      complexity: 'Μέτρια πολυπλοκότητα. Εισαγωγή εξειδικευμένης ορολογίας με εξήγηση.',
      visualBias: 'Πρότεινε εικόνα για οπτικά θέματα (γεωμετρία, βιολογία, φυσική, γεωγραφία).',
    };
  }

  // Λύκειο: Α'-Γ' (ages 15-18)
  if (g.includes('lykeio') || g.includes('λύκει') || ['a_lyk', 'b_lyk', 'c_lyk', '10', '11', '12'].some(x => g.includes(x))) {
    return {
      level: 'lykeio',
      maxTokens: 1500,
      tone: `ΤΟΝΟΣ ΓΙΑ ΛΥΚΕΙΟ:
- Επαγγελματικός, σοβαρός αλλά υποστηρικτικός τόνος
- Εστίαση στην εξεταστική ετοιμασία και τις Πανελλήνιες
- Ακριβής ορολογία και βιβλιογραφικές αναφορές
- 2-4 παράγραφοι ανά απάντηση
- Ανάλυση σε βάθος, κριτική σκέψη, συσχετισμοί
- Αν ρωτήσει για εξετάσεις, δώσε στρατηγική απάντησης`,
      complexity: 'Υψηλή πολυπλοκότητα. Πλήρης ορολογία. Σύνδεση με εξεταστέα ύλη.',
      visualBias: 'Πρότεινε εικόνα μόνο αν βοηθά πραγματικά (διαγράμματα, γραφήματα, σχήματα).',
    };
  }

  // Default to gymnasio
  return getGradeConfig('gymnasio_a');
}

// ============================================================================
// TEXTBOOK IMAGE SEARCH
// ============================================================================

interface TextbookImage {
  imageUrl: string;
  description: string;
  source: string;
  bookTitle: string;
  chapter?: string;
  similarity: number;
}

async function searchTextbookImages(
  supabase: any,
  query: string,
  subject?: string,
  matchCount: number = 5
): Promise<TextbookImage | null> {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const embedding = embeddingResponse.data[0].embedding;

    const { data, error } = await supabase.rpc('search_educational_content', {
      query_embedding: embedding,
      match_threshold: 0.45,
      match_count: matchCount,
      filter_subject: subject || null,
    });

    if (error || !data || data.length === 0) return null;

    // Prioritize textbook images by similarity and source quality
    for (const result of data) {
      const imageUrl = result.metadata?.image_url;
      const isImage =
        result.metadata?.content_type === 'textbook_image' ||
        result.metadata?.has_image === true ||
        (imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0);

      if (isImage && imageUrl && result.similarity > 0.45) {
        return {
          imageUrl,
          description: result.content?.substring(0, 200) || '',
          source: result.source || '',
          bookTitle: result.source_title || result.metadata?.book_title || result.source || 'Σχολικό βιβλίο',
          chapter: result.metadata?.chapter || undefined,
          similarity: result.similarity,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Textbook image search error:', error);
    return null;
  }
}

// ============================================================================
// AI IMAGE GENERATION (GPT-4o → DALL-E 3 fallback)
// ============================================================================

interface GeneratedImage {
  url: string;
  provider: string;
}

async function generateImage(
  prompt: string,
  greekLabels: string[] = [],
  gradeLevel: 'dimotiko' | 'gymnasio' | 'lykeio' = 'gymnasio'
): Promise<GeneratedImage | null> {
  const styleByGrade: Record<string, string> = {
    dimotiko: 'Colorful, cartoonish, child-friendly. Large clear shapes. Bright primary colors. Fun and engaging.',
    gymnasio: 'Clean, flat, modern illustration. Friendly colors. Clear arrows and annotations. Suitable for teenagers.',
    lykeio: 'Scientific, precise diagram. Clean lines. Professional academic style. Subtle colors. Detailed.',
  };

  const baseStyle = styleByGrade[gradeLevel] || styleByGrade.gymnasio;

  let fullPrompt = `Educational diagram: ${prompt}\n\nStyle: ${baseStyle} White background. Vector illustration style.`;

  if (greekLabels.length > 0) {
    fullPrompt += `\n\nInclude these labels clearly in the image:\n${greekLabels.map((l) => `- ${l}`).join('\n')}`;
  } else {
    fullPrompt += `\n\nIMPORTANT: Do NOT include any text or labels in the image. Keep it clean and simple.`;
  }

  // Try GPT-4o first (better text handling)
  try {
    const response = await openai.images.generate({
      model: 'gpt-4o',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
    });

    const url = response.data?.[0]?.url;
    if (url) return { url, provider: 'GPT-4o' };
  } catch (error: any) {
    console.error('GPT-4o image error:', error?.message);
  }

  // Fallback to DALL-E 3
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Educational illustration: ${prompt}. ${baseStyle} White background. NO TEXT, NO LABELS, NO NUMBERS.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const url = response.data?.[0]?.url;
    if (url) return { url, provider: 'DALL-E 3' };
  } catch (error) {
    console.error('DALL-E 3 fallback error:', error);
  }

  return null;
}

// ============================================================================
// RAG SEARCH
// ============================================================================

interface RAGResult {
  content: string;
  source: string;
  source_title: string;
  similarity: number;
  metadata?: Record<string, any>;
}

async function searchEducationalContent(
  supabase: any,
  query: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
    filterSubject?: string;
  }
): Promise<RAGResult[]> {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const embedding = embeddingResponse.data[0].embedding;

    const { data, error } = await supabase.rpc('search_educational_content', {
      query_embedding: embedding,
      match_threshold: options.matchThreshold || 0.4,
      match_count: options.matchCount || 5,
      filter_subject: options.filterSubject || null,
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

function buildRAGContext(results: RAGResult[]): string {
  if (results.length === 0) return '';

  const context = results
    .map((r, i) => {
      const bookName = r.source_title || r.metadata?.book_title || r.source;
      const chapter = r.metadata?.chapter ? `, ${r.metadata.chapter}` : '';
      return `[Πηγή ${i + 1}: ${bookName}${chapter}]\n${r.content}`;
    })
    .join('\n\n');

  return `
ΣΧΕΤΙΚΟ ΥΛΙΚΟ ΑΠΟ ΣΧΟΛΙΚΑ ΒΙΒΛΙΑ:
${context}

ΟΔΗΓΙΕΣ ΠΗΓΩΝ:
- Χρησιμοποίησε αυτό το υλικό για να βοηθήσεις τον μαθητή
- Αν η απάντησή σου βασίζεται σε σχολικό βιβλίο, ανάφερε ΤΟ ΟΝΟΜΑ ΤΟΥ ΒΙΒΛΙΟΥ στο τέλος
- Αν η απάντηση είναι γενική γνώση, μην αναφέρεις πηγή
`;
}

function formatSources(results: RAGResult[]) {
  return results.map((r) => ({
    title: r.source_title || r.metadata?.book_title || r.source,
    source: r.source,
    chapter: r.metadata?.chapter || null,
    similarity: r.similarity,
    displayName: formatBookName(r),
  }));
}

function formatBookName(r: RAGResult): string {
  const title = r.source_title || r.metadata?.book_title || r.source || 'Σχολικό βιβλίο';
  const chapter = r.metadata?.chapter ? `, ${r.metadata.chapter}` : '';
  // Clean up filename-style titles
  return title
    .replace(/\.pdf$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    + chapter;
}

// ============================================================================
// FILE HANDLING UTILITIES
// ============================================================================

function buildContentBlocks(
  message: string,
  imageBase64?: string,
  fileBase64?: string,
  fileType?: string
): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  // Handle image input
  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mediaType = imageBase64.includes('image/png')
      ? 'image/png'
      : imageBase64.includes('image/webp')
        ? 'image/webp'
        : imageBase64.includes('image/gif')
          ? 'image/gif'
          : 'image/jpeg';

    blocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
        data: cleanBase64,
      },
    });
  }

  // Handle PDF input
  if (fileBase64 && fileType === 'application/pdf') {
    const cleanBase64 = fileBase64.replace(/^data:application\/pdf;base64,/, '');
    blocks.push({
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: cleanBase64,
      },
    });
  }

  // Always add text
  const textContent = message || (imageBase64 ? 'Εξέτασε αυτή την εικόνα. Τι βλέπεις; Αν είναι άσκηση, καθοδήγησέ με στη λύση.' : 'Τι βλέπεις σε αυτό το αρχείο;');
  blocks.push({ type: 'text', text: textContent });

  return blocks;
}

// ============================================================================
// SYSTEM PROMPT BUILDER
// ============================================================================

function buildSystemPrompt(
  subject: string,
  gradeConfig: GradeConfig,
  ragContext: string,
  grade?: string
): string {
  const subjectContext = subjectPrompts[subject] || subjectPrompts.general;
  const gradeLabel = grade || 'Γυμνάσιο';

  return `Είσαι ο noetium AI, ένας φιλικός AI δάσκαλος για Έλληνες μαθητές.
Επίπεδο μαθητή: ${gradeLabel}

${subjectContext}

${gradeConfig.tone}

ΠΟΛΥΠΛΟΚΟΤΗΤΑ: ${gradeConfig.complexity}

ΣΩΚΡΑΤΙΚΗ ΜΕΘΟΔΟΣ:
- ΠΟΤΕ μη δίνεις απευθείας απαντήσεις σε ασκήσεις
- Κάνε ερωτήσεις που καθοδηγούν τη σκέψη
- Δώσε hints και υποδείξεις, όχι λύσεις
- Ενθάρρυνε κάθε βήμα προόδου
- Αν ο μαθητής κολλήσει, δώσε πιο συγκεκριμένο hint

ΑΡΧΕΙΑ & ΕΙΚΟΝΕΣ ΜΑΘΗΤΗ:
- Αν ο μαθητής στείλει φωτογραφία ΑΣΚΗΣΗΣ: Διάβασέ την προσεκτικά, αναγνώρισε τι ζητάει, και καθοδήγησε βήμα-βήμα
- Αν στείλει φωτογραφία ΣΗΜΕΙΩΣΕΩΝ: Σχολίασε, εξήγησε ή διόρθωσε
- Αν στείλει PDF: Κατανόησε το περιεχόμενο και βοήθησε ανάλογα
- Πάντα αναφέρου στο ΣΥΓΚΕΚΡΙΜΕΝΟ περιεχόμενο που βλέπεις

ΕΙΚΟΝΕΣ & ΟΠΤΙΚΑ:
${gradeConfig.visualBias}
- Αν ο μαθητής ζητάει εικόνα/διάγραμμα, ή αν πιστεύεις ότι μια εικόνα θα βοηθούσε:
  1. Εξήγησε σύντομα τι θα δείξει (1 πρόταση)
  2. Βάλε το tag:

[ΕΙΚΟΝΑ]
prompt: Simple flat educational diagram showing [concept in English]. White background, arrows, shapes. NO TEXT NO NUMBERS.
labels:
- text: "Ελληνική ετικέτα" | x: 50 | y: 20
[/ΕΙΚΟΝΑ]

- Για μαθηματικά: σχήματα, γραφικές παραστάσεις
- Για βιολογία: κύτταρα, οργανισμοί, κύκλοι ζωής
- Για φυσική: δυνάμεις, κυκλώματα, κίνηση
- Για γεωγραφία: τοπία, χάρτες
- Για ιστορία: σκηνές, χρονολόγια

ΠΗΓΕΣ:
- Αν η απάντησή σου βασίζεται σε σχολικό βιβλίο, ανάφερε: "📖 [Όνομα Βιβλίου], [Κεφάλαιο]"
- Αν είναι γενική γνώση, μην αναφέρεις πηγή

${ragContext}

ΣΤΥΛ ΑΠΑΝΤΗΣΗΣ:
- Μία ερώτηση τη φορά στο τέλος
- Φιλικός, ενθαρρυντικός τόνος
- Απάντησε ΜΟΝΟ στα Ελληνικά (εκτός αν πρόκειται για Αγγλικά/ξένη γλώσσα)`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const {
      message,
      subject = 'general',
      conversationHistory,
      imageBase64,
      fileBase64,
      fileType,
      grade,
    } = body;

    if (!message && !imageBase64 && !fileBase64) {
      return new Response(JSON.stringify({ error: 'No message provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Grade configuration
    const gradeConfig = getGradeConfig(grade);
    const dbSubject = subjectMapping[subject] || undefined;

    // RAG search (single embedding call serves both text and image search)
    let ragContext = '';
    let sources: ReturnType<typeof formatSources> = [];
    let ragResults: RAGResult[] = [];

    if (message) {
      try {
        ragResults = await searchEducationalContent(supabase, message, {
          matchThreshold: 0.4,
          matchCount: 5,
          filterSubject: dbSubject,
        });

        if (ragResults.length > 0) {
          ragContext = buildRAGContext(ragResults);
          sources = formatSources(ragResults);
        }
      } catch (ragError) {
        console.error('RAG search error:', ragError);
      }
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(subject, gradeConfig, ragContext, grade);

    // Build messages array
    const messages: Anthropic.MessageParam[] =
      conversationHistory?.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })) || [];

    // Build content blocks for the current message (handles images, PDFs, text)
    const hasMedia = imageBase64 || fileBase64;
    if (hasMedia) {
      messages.push({
        role: 'user',
        content: buildContentBlocks(message, imageBase64, fileBase64, fileType),
      });
    } else {
      messages.push({ role: 'user', content: message });
    }

    // Stream response from Claude
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: gradeConfig.maxTokens,
      system: systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        // Send sources immediately
        if (sources.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
          );
        }

        // Stream text tokens
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullResponse += event.delta.text;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`
              )
            );
          }
        }

        // After streaming: check for image generation request
        const imageMatch = fullResponse.match(/\[ΕΙΚΟΝΑ\]([\s\S]*?)\[\/ΕΙΚΟΝΑ\]/);
        if (imageMatch) {
          const imageBlock = imageMatch[1];
          const promptMatch = imageBlock.match(/prompt:\s*(.+?)(?=\nlabels:|$)/s);
          const imagePrompt = promptMatch ? promptMatch[1].trim() : '';

          // Extract labels
          const labels: { text: string; x: number; y: number }[] = [];
          const labelMatches = imageBlock.matchAll(
            /- text:\s*"(.+?)"\s*\|\s*x:\s*(\d+)\s*\|\s*y:\s*(\d+)/g
          );
          for (const match of labelMatches) {
            labels.push({ text: match[1], x: parseInt(match[2]), y: parseInt(match[3]) });
          }

          if (imagePrompt) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'generating_image' })}\n\n`)
              );

              // STEP 1: Check RAG results for existing textbook images (no extra API call)
              let foundTextbookImage: TextbookImage | null = null;
              for (const r of ragResults) {
                const imgUrl = r.metadata?.image_url;
                const isImg =
                  r.metadata?.content_type === 'textbook_image' ||
                  r.metadata?.has_image === true;
                if (isImg && imgUrl && r.similarity > 0.5) {
                  foundTextbookImage = {
                    imageUrl: imgUrl,
                    description: r.content?.substring(0, 200) || '',
                    source: r.source,
                    bookTitle: formatBookName(r),
                    similarity: r.similarity,
                  };
                  break;
                }
              }

              // STEP 2: If no image in RAG results, do a dedicated image search
              if (!foundTextbookImage) {
                foundTextbookImage = await searchTextbookImages(supabase, imagePrompt, dbSubject);
              }

              if (foundTextbookImage) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'image_with_labels',
                      imageUrl: foundTextbookImage.imageUrl,
                      labels: [],
                      source: foundTextbookImage.bookTitle,
                      isTextbook: true,
                    })}\n\n`
                  )
                );
              } else {
                // STEP 3: Generate with AI
                const greekLabelTexts = labels.map((l) => l.text);
                const generated = await generateImage(imagePrompt, greekLabelTexts, gradeConfig.level);

                if (generated) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'image_with_labels',
                        imageUrl: generated.url,
                        labels,
                        provider: generated.provider,
                        isTextbook: false,
                      })}\n\n`
                    )
                  );
                } else {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'image_error',
                        error: 'Δεν μπόρεσα να δημιουργήσω εικόνα',
                      })}\n\n`
                    )
                  );
                }
              }
            } catch (imgError) {
              console.error('Image error:', imgError);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'image_error' })}\n\n`)
              );
            }
          }
        }

        // Done
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();

        // Save progress (fire and forget)
        try {
          await supabase.from('user_progress').insert({
            user_id: user.id,
            feature: 'chat',
            activity_type: 'conversation',
            activity_id: subject,
            completed: true,
            metadata: {
              subject,
              grade,
              gradeLevel: gradeConfig.level,
              usedRAG: sources.length > 0,
              generatedImage: !!imageMatch,
              hadFile: !!fileBase64,
              hadImage: !!imageBase64,
            },
          });
        } catch (_) {}
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
