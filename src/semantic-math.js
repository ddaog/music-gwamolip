export const SEMANTIC_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
export const SEMANTIC_REVISION = '2c4055b12046f11709e9df2c122e59ffbdc2f900';
export const EMOTION_IDS = new Set(['joy', 'love', 'sadness', 'fear', 'anger', 'calm']);

export function meanVector(vectors) {
  if (!vectors.length) return [];
  return vectors[0].map((_, i) => vectors.reduce((sum, vector) => sum + vector[i], 0) / vectors.length);
}
export function centerVector(vector, center) { return vector.map((value, i) => value - center[i]); }

export function cosineSimilarity(a, b) {
  if (!a?.length || a.length !== b?.length) return 0;
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  return aa && bb ? Math.max(-1, Math.min(1, dot / Math.sqrt(aa * bb))) : 0;
}

// Cosine scores are similarities, not probabilities. Reject weak matches and
// blend only neighbors close to the strongest one, instead of assigning every word.
export function semanticNeighbors(vector, anchors) {
  const ranked = anchors.map(({ id, vectors }) => ({ id, score: Math.max(...vectors.map((anchor) => cosineSimilarity(vector, anchor))) }))
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < .65) return [];
  if (ranked.length > 4 && ranked[0].score - ranked[4].score < .035) return [];
  const selected = ranked.filter((item) => item.score >= (EMOTION_IDS.has(item.id) ? .68 : .65) && item.score >= ranked[0].score - .065).slice(0, 3);
  const weights = selected.map((item) => Math.exp((item.score - ranked[0].score) / .07));
  const sum = weights.reduce((a, b) => a + b, 0);
  return selected.map((item, i) => ({ ...item, weight: weights[i] / sum }));
}

export function emotionProjection(vector, poles) {
  return Object.fromEntries(poles.map(({ axis, positive, negative }) => {
    const score = (items) => Math.max(...items.map((item) => cosineSimilarity(vector, item)));
    return [axis, Math.tanh((score(positive) - score(negative)) * 3) * .18];
  }));
}

// Deliberately local negation scope; not a claim of full sentiment parsing.
export function negatedTokens(text) {
  const raw = [...text.toLowerCase().matchAll(/[가-힣a-z0-9]+/gu)];
  const result = new Set();
  raw.forEach((match, i) => {
    const previous = raw[i - 1], next = raw[i + 1];
    const boundary = (a, b) => /[.!?;,\n]/u.test(text.slice(a.index + a[0].length, b.index));
    if ((previous && /^(?:안|못|not|never|no)$/u.test(previous[0]) && !boundary(previous, match))
      || (next && /지$/u.test(match[0]) && /^(?:않|못)/u.test(next[0]) && !boundary(match, next))) result.add(match[0]);
  });
  return result;
}
