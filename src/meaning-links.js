import { CONCEPTS, STOPWORDS } from './lexicon.js';
const known = new Set(CONCEPTS.flatMap((concept) => concept.words.ko));
export function relationKey(token) {
  if (known.has(token)) return token;
  if (/^[가-힣]+$/u.test(token)) {
    const base = token.replace(/(?:에게서|에서는|에서도|에게|에서|으로|은|는|이|가|을|를|의|도|만|에|와|과|랑)$/u, '');
    return base.length >= 2 || known.has(base) ? base : token;
  }
  return token.length > 4 && !token.endsWith('ss') ? token.replace(/s$/u, '') : token;
}

export function addMeaningLinks(syntax, similarities = []) {
  const edges = [...syntax.edges];
  const hubs = new Map(), degree = new Map();
  let added = 0;
  const add = (a, b, type) => {
    if (added >= 24 || (degree.get(a) ?? 0) >= 4 || (degree.get(b) ?? 0) >= 4) return;
    const existing = edges.findIndex(({ from, to }) => (from === a && to === b) || (from === b && to === a));
    if (existing >= 0 && edges[existing].type !== 'provisional') return;
    const edge = { from: a, to: b, type, provisional: type === 'semantic' };
    if (existing >= 0) edges[existing] = edge;
    else edges.push(edge);
    degree.set(a, (degree.get(a) ?? 0) + 1); degree.set(b, (degree.get(b) ?? 0) + 1); added++;
  };
  const words = syntax.words.filter((word) => !STOPWORDS.has(word.token) && !['conjunction', 'determiner', 'preposition', 'auxiliary'].includes(word.role));
  for (const word of words) {
    const key = relationKey(word.token), hub = hubs.get(key);
    if (hub !== undefined) add(hub, word.index, 'repetition');
    else hubs.set(key, word.index);
  }
  for (const pair of [...similarities].filter((pair) => pair.score >= .72).sort((a, b) => b.score - a.score)) {
    if (relationKey(pair.a) === relationKey(pair.b)) continue;
    const a = words.find((word) => word.token === pair.a), b = words.find((word) => word.token === pair.b);
    if (a && b) add(a.index, b.index, 'semantic');
  }
  return { ...syntax, edges };
}
