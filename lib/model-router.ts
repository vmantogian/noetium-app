/**
 * Central model selection + prompt-caching helpers.
 * Change model strings HERE only - never hardcode them in routes.
 *
 * NOTE: Greek literals are written as \u escapes deliberately so this file
 * is encoding-safe across tooling. \u03BB\u03CD\u03BA\u03B5\u03B9\u03BF === "lykeio", etc.
 */

export const MODELS = {
  /** Deep reasoning, exam prep, vision, anything accuracy-critical. */
  SONNET: 'claude-sonnet-5',
  /** Short conversational turns, encouragement, simple follow-ups. */
  HAIKU: 'claude-haiku-4-5-20251001',
} as const;

export type ModelChoice = (typeof MODELS)[keyof typeof MODELS];

export interface RouteInput {
  message: string;
  grade?: string;
  subject?: string;
  hasMedia?: boolean;
}

/** Subjects where a wrong answer is expensive. Always Sonnet. */
const HIGH_STAKES_SUBJECTS = [
  'mathematics', 'math', 'physics', 'chemistry', 'biology',
  '\u03BC\u03B1\u03B8\u03B7\u03BC\u03B1\u03C4\u03B9\u03BA\u03AC',
  '\u03C6\u03C5\u03C3\u03B9\u03BA\u03AE',
  '\u03C7\u03B7\u03BC\u03B5\u03AF\u03B1',
  '\u03B2\u03B9\u03BF\u03BB\u03BF\u03B3\u03AF\u03B1',
];

/** Lyceum grades - exam-track students. Always Sonnet. */
const HIGH_STAKES_GRADES = [
  'lykeio', 'lyceum',
  '\u03BB\u03CD\u03BA\u03B5\u03B9\u03BF',
];

/** Turns that are clearly conversational rather than instructional. */
const TRIVIAL_PATTERNS: RegExp[] = [
  /^(hi|hello|hey|ok|okay|thanks|thank you)\b/i,
  /^(\u03B3\u03B5\u03B9\u03B1|\u03BA\u03B1\u03BB\u03B7\u03BC\u03AD\u03C1\u03B1|\u03BA\u03B1\u03BB\u03B7\u03C3\u03C0\u03AD\u03C1\u03B1)\b/i,
  /^(\u03B5\u03C5\u03C7\u03B1\u03C1\u03B9\u03C3\u03C4\u03CE|\u03B5\u03BD\u03C4\u03AC\u03BE\u03B5\u03B9|\u03BD\u03B1\u03B9|\u03BF\u03BA)\b/i,
];

/**
 * Heuristic router. Deliberately conservative: defaults to Sonnet.
 * Haiku only for short, clearly-trivial turns outside high-stakes contexts.
 * No LLM classifier call - that would add latency and cost more than it saves.
 */
export function routeModel(input: RouteInput): ModelChoice {
  const { message, grade = '', subject = '', hasMedia = false } = input;

  // Vision and document understanding always go to Sonnet.
  if (hasMedia) return MODELS.SONNET;

  const g = grade.toLowerCase();
  const s = subject.toLowerCase();

  if (HIGH_STAKES_GRADES.some((x) => g.includes(x))) return MODELS.SONNET;
  if (HIGH_STAKES_SUBJECTS.some((x) => s.includes(x))) return MODELS.SONNET;

  const trimmed = (message || '').trim();
  if (TRIVIAL_PATTERNS.some((re) => re.test(trimmed))) return MODELS.HAIKU;

  // Short turns with no question mark (Greek ";" or Latin "?") and no digits
  // are almost always conversational filler rather than a real problem.
  const hasQuestion = /[;?]/.test(trimmed);
  const hasDigits = /\d/.test(trimmed);
  if (trimmed.length < 40 && !hasQuestion && !hasDigits) return MODELS.HAIKU;

  return MODELS.SONNET;
}

/**
 * Build a cacheable system prompt.
 *
 * The static block (persona, grade config, Socratic rules) is identical
 * across every request for a given grade+subject, so it gets a cache
 * breakpoint. RAG context changes per query and MUST come after the
 * breakpoint - putting it before invalidates the cache on every turn.
 *
 * Cache reads bill at roughly 10% of the normal input rate.
 * Minimum cacheable prefix is 1024 tokens; Greek tokenizes less densely
 * than English, so the static prompt should clear this comfortably.
 */
export function buildCachedSystem(staticPrompt: string, dynamicContext: string) {
  const blocks: Array<{
    type: 'text';
    text: string;
    cache_control?: { type: 'ephemeral' };
  }> = [
    { type: 'text', text: staticPrompt, cache_control: { type: 'ephemeral' } },
  ];

  if (dynamicContext && dynamicContext.trim().length > 0) {
    blocks.push({ type: 'text', text: dynamicContext });
  }

  return blocks;
}