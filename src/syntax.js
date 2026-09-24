// Lightweight bilingual heuristics: relationships are suggestions, not a full parser.
const verbs = /^(?:am|is|are|was|were|be|feel|feels|love|loves|see|sees|hear|hears|hold|holds|dance|dances|shine|shines|flow|flows|run|runs|walk|walks|sing|sings|breathe|breathes|fall|falls|rise|rises|glow|glows|drift|drifts|touch|touches|wait|waits|move|moves|open|opens|close|closes)$/u;
const adjectives = /^(?:작은|큰|고요한|따뜻한|차가운|붉은|푸른|밝은|어두운|깊은|높은|느린|빠른|아름다운|부드러운|조용한|warm|cold|tiny|small|big|little|quiet|bright|dark|soft|gentle|red|blue|green|golden|beautiful|silver)$/u;
const functional = /^(?:a|an|the|and|or|but|to|of|in|on|at|by|for|from|with|through|above|below|under|over|그리고|그러나|또는)$/u;

export function analyzeSyntax(text) {
  let clause = 0;
  let previousEnd = 0;
  const words = [...text.matchAll(/[가-힣a-z0-9]+/giu)].map((match, index) => {
    if (/[,.!?;\n]/u.test(text.slice(previousEnd, match.index))) clause += 1;
    const token = match[0].toLowerCase();
    let role = 'word';
    if (functional.test(token)) role = 'function';
    else if (adjectives.test(token)) role = 'adjective';
    else if (/ly$|(?:게|히)$/u.test(token)) role = 'adverb';
    else if (verbs.test(token) || /(?:ing|ed)$/u.test(token) || /(?:다|어요|아요|해요|하고|이고|으며|면서)$/u.test(token)) role = 'predicate';
    else if (/[을를]$/u.test(token)) role = 'object';
    else if (/[은는이가]$/u.test(token) && /[가-힣]/u.test(token)) role = 'subject';
    else if (/(?:에서|에게|으로|에)$/u.test(token)) role = 'place';
    previousEnd = match.index + match[0].length;
    const result = { token, index, clause, role };
    if (/[가-힣]/u.test(token) && /(?:하고|이고|으며|면서)$/u.test(token)) clause += 1;
    return result;
  });
  const edges = [];
  const add = (from, to, type) => {
    if (from !== to && !edges.some((edge) => edge.from === from && edge.to === to)) edges.push({ from, to, type });
  };
  for (const word of words) {
    const group = words.filter((other) => other.clause === word.clause);
    const nearest = (items) => items.sort((a, b) => Math.abs(a.index - word.index) - Math.abs(b.index - word.index))[0];
    const predicate = nearest(group.filter((other) => other.role === 'predicate'));
    if (word.role === 'adjective') {
      const noun = group.find((other) => other.index > word.index && ['word', 'subject', 'object'].includes(other.role));
      if (noun) add(word.index, noun.index, 'modifier');
    } else if (word.role === 'adverb') {
      if (predicate) add(word.index, predicate.index, 'modifier');
    } else if (predicate && ['word', 'subject', 'object', 'place'].includes(word.role)) {
      if (word.role === 'word') word.role = word.index < predicate.index ? 'subject' : 'object';
      add(word.index, predicate.index, word.role);
    }
  }
  const counts = words.reduce((result, word) => ({ ...result, [word.role]: (result[word.role] ?? 0) + 1 }), {});
  return { words, edges, ...counts };
}
