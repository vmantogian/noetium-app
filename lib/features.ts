export type FeatureName =
  | 'art'
  | 'csAi'
  | 'debate'
  | 'enrichment'
  | 'financial'
  | 'mindfulness'
  | 'portfolio';

// Anything other than an explicit opt-in is treated as OFF, so a missing or
// misspelled env var hides the feature instead of exposing it.
function enabled(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export const features: Readonly<Record<FeatureName, boolean>> = Object.freeze({
  art: enabled(process.env.FEATURE_ART),
  csAi: enabled(process.env.FEATURE_CS_AI),
  debate: enabled(process.env.FEATURE_DEBATE),
  enrichment: enabled(process.env.FEATURE_ENRICHMENT),
  financial: enabled(process.env.FEATURE_FINANCIAL),
  mindfulness: enabled(process.env.FEATURE_MINDFULNESS),
  portfolio: enabled(process.env.FEATURE_PORTFOLIO),
});

export function isFeatureEnabled(name: FeatureName): boolean {
  return features[name];
}

// Route handlers should look indistinguishable from a non-existent endpoint
// when their feature is off, so callers cannot probe for disabled surface area.
export function featureDisabledResponse(): Response {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'content-type': 'application/json' },
  });
}
