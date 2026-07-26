/**
 * Noetium RAG (Retrieval-Augmented Generation) Utilities
 * ======================================================
 * Searches Greek educational content and augments AI responses.
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Types
export interface SearchResult {
  id: string;
  content: string;
  source: string;
  sourceTitle: string;
  sourceUrl: string;
  similarity: number;
  metadata: Record<string, any>;
}

export interface RAGContext {
  results: SearchResult[];
  query: string;
  totalResults: number;
}

/**
 * Generate embedding for a query
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Search educational content using vector similarity
 */
export async function searchEducationalContent(
  query: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
    filterSource?: string;
    filterSubject?: string;
    filterGrade?: string;
  } = {}
): Promise<SearchResult[]> {
  const {
    matchThreshold = 0.5,
    matchCount = 5,
    filterSource,
    filterSubject,
    filterGrade,
  } = options;

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Search using Supabase RPC function
    const { data, error } = await supabase.rpc('search_educational_content', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_source: filterSource || null,
      filter_subject: filterSubject || null,
      filter_grade: filterGrade || null,
    });

    if (error) {
      console.error('Search error:', error);
      return [];
    }

    // Increment usage count for retrieved content
    if (data && data.length > 0) {
      const ids = data.map((r: any) => r.id);
      // Fire and forget - don't await
      Promise.all(
        ids.map((id: string) =>
          supabase.rpc('increment_content_usage', { content_id: id })
        )
      ).catch(console.error);
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      content: r.content,
      source: r.source,
      sourceTitle: r.source_title,
      sourceUrl: r.source_url,
      similarity: r.similarity,
      metadata: r.metadata,
    }));
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

/**
 * Build context string from search results for the AI prompt
 */
export function buildRAGContext(results: SearchResult[]): string {
  if (results.length === 0) return '';

  const contextParts = results.map((r, i) => {
    return `[Πηγή ${i + 1}: ${r.sourceTitle || r.source}]
${r.content}`;
  });

  return `
Σχετικές πληροφορίες από την ελληνική εκπαιδευτική βάση δεδομένων:

${contextParts.join('\n\n---\n\n')}

Χρησιμοποίησε αυτές τις πληροφορίες για να απαντήσεις στον μαθητή, αλλά μην αναφέρεις ρητά τις πηγές εκτός αν σε ρωτήσει.
`;
}

/**
 * Get relevant context for a student question
 */
export async function getRAGContextForQuestion(
  question: string,
  studentContext: {
    grade?: string;
    subject?: string;
  }
): Promise<RAGContext> {
  const results = await searchEducationalContent(question, {
    matchCount: 5,
    matchThreshold: 0.4,
    filterGrade: studentContext.grade,
    filterSubject: studentContext.subject,
  });

  return {
    results,
    query: question,
    totalResults: results.length,
  };
}

/**
 * Enhanced AI tutor response with RAG
 */
export async function generateTutorResponseWithRAG(
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  studentContext: {
    grade: string;
    subject?: string;
    interests?: string[];
  }
): Promise<{ response: string; sources: SearchResult[] }> {
  // Get relevant context
  const ragContext = await getRAGContextForQuestion(userMessage, studentContext);

  // Build the enhanced prompt
  const systemPrompt = `Είσαι ο Σωκράτης, ένας φιλικός AI δάσκαλος για Έλληνες μαθητές ${studentContext.grade}.

Χρησιμοποιείς τη Σωκρατική μέθοδο: κάνεις ερωτήσεις για να οδηγήσεις τον μαθητή στην κατανόηση.
Προσαρμόζεις τη γλώσσα στην ηλικία του μαθητή.
Χρησιμοποιείς παραδείγματα από την ελληνική καθημερινότητα.

${ragContext.results.length > 0 ? buildRAGContext(ragContext.results) : ''}`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory,
    { role: 'user' as const, content: userMessage },
  ];

  // Call Claude (or OpenAI)
  // Using Anthropic since that's what Noetium uses
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system: systemPrompt,
    messages: conversationHistory.concat([{ role: 'user', content: userMessage }]),
  });

  const assistantMessage =
    response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    response: assistantMessage,
    sources: ragContext.results,
  };
}

// Export for use in API routes
export default {
  searchEducationalContent,
  generateEmbedding,
  buildRAGContext,
  getRAGContextForQuestion,
  generateTutorResponseWithRAG,
};
