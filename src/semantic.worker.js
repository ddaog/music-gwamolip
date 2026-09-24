import { pipeline, env } from '@huggingface/transformers';
import { CONCEPTS } from './lexicon.js';
import { SEMANTIC_MODEL, SEMANTIC_REVISION, semanticNeighbors, emotionProjection, cosineSimilarity, meanVector, centerVector } from './semantic-math.js';

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
const descriptions = [
  ['warmth', ['따뜻한 다정한 사랑', 'warm loving kind'], ['차가운 냉담한 외로움', 'cold distant lonely']],
  ['motion', ['빠르게 달리는 활발한 움직임', 'fast energetic movement'], ['느리게 멈춘 고요함', 'slow still motionless']],
  ['light', ['밝은 환한 희망', 'bright radiant hopeful'], ['어두운 희미한 그늘', 'dark dim shadow']],
  ['space', ['넓은 멀리 열린 공간', 'vast distant open space'], ['좁은 가까운 밀폐 공간', 'tight close confined space']],
  ['softness', ['부드러운 포근한 편안함', 'soft gentle comforting'], ['거친 날카로운 딱딱함', 'rough sharp hard']],
  ['tension', ['무서운 두려운 위험 불안', 'fear danger anxiety tension'], ['안전한 평온한 안심', 'safe peaceful relaxed']],
];
let extractor, anchors, poles, centers, pending, running = false;
const language = (text) => /[가-힣]/u.test(text) ? 'ko' : 'en';
const cache = new Map(); // Word vectors stay in worker memory only, never localStorage.
async function embed(texts) {
  const output = await extractor(texts, { pooling: 'mean', normalize: true });
  return output.tolist();
}
async function initialize() {
  if (extractor) return;
  extractor = await pipeline('feature-extraction', SEMANTIC_MODEL, {
    revision: SEMANTIC_REVISION, dtype: 'q8', device: 'wasm',
    progress_callback: (event) => {
      if (event.status === 'progress') self.postMessage({ type: 'status', status: 'loading', progress: Math.round(event.progress ?? 0) });
    },
  });
  anchors = [];
  for (const concept of CONCEPTS) {
    const representatives = [...concept.words.ko.slice(0, 4), ...concept.words.en.slice(0, 4)];
    const vectors = [];
    for (let offset = 0; offset < representatives.length; offset += 4) {
      vectors.push(...await embed(representatives.slice(offset, offset + 4)));
    }
    anchors.push({ id: concept.id, vectors });
  }
  // Remove the common language component before cosine comparisons; otherwise
  // unrelated short Korean words can look close merely because of their script.
  centers = {
    ko: meanVector(anchors.flatMap((anchor) => anchor.vectors.slice(0, 4))),
    en: meanVector(anchors.flatMap((anchor) => anchor.vectors.slice(4))),
  };
  anchors = anchors.map((anchor) => ({ ...anchor, vectors: anchor.vectors.map((vector, i) => centerVector(vector, centers[i < 4 ? 'ko' : 'en'])) }));
  poles = [];
  for (const [axis, positive, negative] of descriptions) {
    const centered = async (texts) => (await embed(texts)).map((vector, i) => centerVector(vector, centers[language(texts[i])]));
    poles.push({ axis, positive: await centered(positive), negative: await centered(negative) });
  }
  self.postMessage({ type: 'status', status: 'ready' });
}

self.onmessage = ({ data }) => {
  pending = data; // Coalesce typing bursts; never build an unbounded inference queue.
  if (!running) processQueue();
};
async function processQueue() {
  running = true;
  try {
    await initialize();
    while (pending) {
      const request = pending;
      pending = null;
      const result = {};
      for (const token of [...new Set(request.tokens)].slice(0, 48)) {
        if (pending) break;
        let meaning = cache.get(token);
        if (meaning) { cache.delete(token); cache.set(token, meaning); }
        if (!meaning) {
          const [raw] = await embed([token]);
          const vector = centerVector(raw, centers[language(token)]);
          meaning = { vector, matches: semanticNeighbors(vector, anchors), axes: emotionProjection(vector, poles) };
          if (cache.size >= 512) cache.delete(cache.keys().next().value);
          cache.set(token, meaning);
        }
        result[token] = { matches: meaning.matches, axes: meaning.axes };
      }
      if (!pending) {
        const tokens = Object.keys(result), similarities = [];
        for (let i = 0; i < tokens.length; i++) {
          for (let j = i + 1; j < tokens.length; j++) {
            const score = cosineSimilarity(cache.get(tokens[i]).vector, cache.get(tokens[j]).vector);
            if (score >= .72) similarities.push({ a: tokens[i], b: tokens[j], score });
          }
        }
        self.postMessage({ type: 'result', id: request.id, text: request.text, result: { meanings: result, similarities } });
      }
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error?.message ?? error) });
    extractor = null;
    pending = null;
  } finally { running = false; }
}
