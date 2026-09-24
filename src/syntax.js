// Local, bounded linguistic heuristics. Provisional edges are explicitly marked.
const set = (text) => new Set(text.split(' '));
const verbs = set('be have do feel love like see hear hold dance shine flow run walk sing breathe fall rise glow drift touch wait move open close eat watch listen read write draw play make take give go come look speak think know want sleep sit stand fly cross grow carry stop swim help smile laugh work live leave meet dream drink learn follow remember turn bring');
const irregular = { is:'be', are:'be', am:'be', was:'be', were:'be', been:'be', has:'have', had:'have', does:'do', did:'do', done:'do', went:'go', gone:'go', saw:'see', seen:'see', ate:'eat', eaten:'eat', ran:'run', sang:'sing', sung:'sing', flew:'fly', flown:'fly', drew:'draw', drawn:'draw', wrote:'write', written:'write', made:'make', took:'take', taken:'take', held:'hold', felt:'feel', came:'come', heard:'hear', slept:'sleep', thought:'think', brought:'bring', left:'leave' };
const auxiliaries = set('am is are was were be been being has have had do does did can could will would shall should may might must');
const adjectives = set('작은 큰 고요한 따스한 따뜻한 차가운 붉은 푸른 밝은 어두운 깊은 높은 느린 빠른 아름다운 부드러운 조용한 귀여운 예쁜 새로운 오래된 넓은 좁은 맑은 흐린 슬픈 기쁜 행복한 외로운 그리운 따뜻해 warm cold tiny small big little quiet bright dark soft gentle red blue green golden beautiful silver happy sad lonely calm peaceful long short new old warmest coldest softer brighter');
const determiners = set('a an the this that these those my your our their his her its');
const prepositions = set('to of in on at by for from with through above below under over beyond beside into behind');
const conjunctions = set('and or but 그리고 그러나 하지만 또는');
const koNouns = set('바다 고양이 강아지 나비 바람 나무 하늘 그림 이야기 사고 최고 뒤 아래 위 앞 옆 사이');
const koVerbStem = /^(?:듣|들었|먹|마시|마셨|보|봐|봤|바라보|바라봤|바라본|좋아|싫어|사랑|그리|그렸|그린|그려|걷|걸|달리|달려|뛰|날아|흐르|흘러|움직|비추|비춰|비춘|만나|만났|기다|웃|울|노래|춤|빛나|반짝|불|분|피|자|잠|읽|쓰|써|건너|건넌|그치|그친|내리|내린|내려|오르|올라|가|오|떠나|멈추|생각|느끼|알|모르|배우|살|죽|잡|놓|만들|되|돼)/u;
function englishVerb(word) {
  if (verbs.has(word) || irregular[word]) return true;
  const forms = [word.replace(/ies$/u, 'y'), word.replace(/(?:es|s)$/u, ''), word.replace(/s$/u, '')];
  if (/(?:ing|ed)$/u.test(word)) {
    const stem = word.replace(/(?:ing|ed)$/u, '');
    forms.push(stem, stem + 'e', stem.replace(/(.)\1$/u, '$1'), stem.replace(/i$/u, 'y'));
  }
  return forms.some((form) => verbs.has(form));
}
function roleFor(token) {
  if (/^(?:좋은|무슨|어떤)$/u.test(token)) return 'adjective';
  if (/^(?:늘|항상|이렇게|그렇게|저렇게)$/u.test(token)) return 'adverb';
  // Conversational endings must be checked before -게 (adverb) / -에 (place).
  if (/^(?:하|해|했|되|됐)(?:고|며|면서|지만|는데|니|지|게|겠어|어요)$/u.test(token)
    || /(?:다고|라고)$/u.test(token)) return 'predicate';
  if (conjunctions.has(token)) return 'conjunction';
  if (determiners.has(token)) return 'determiner';
  if (prepositions.has(token)) return 'preposition';
  if (auxiliaries.has(token)) return 'auxiliary';
  if (adjectives.has(token)) return 'adjective';
  if (/^[a-z]+$/u.test(token)) {
    if (englishVerb(token)) return 'predicate';
    if (/ly$/u.test(token)) return 'adverb';
    return 'word';
  }
  if (koNouns.has(token)) return 'word';
  if (/(?:하게|히|하게끔)$/u.test(token) || /^(?:빨리|멀리|가만히|매우|아주|살짝)$/u.test(token)) return 'adverb';
  if (/게$/u.test(token) && !/에게$/u.test(token)) return 'adverb';
  if (/(?:에서|에게|한테|으로|에)$/u.test(token)) return 'place';
  if (/[을를]$/u.test(token)) return 'object';
  if (koVerbStem.test(token) && /(?:는|던|진|친|린|춘|본)$/u.test(token)) return 'participle';
  if (/(?:다|어요|아요|해요|했어|었어|았어|할게|네요|습니다|습니까|죠)$/u.test(token)
    || /^(?:주|받|주었|받았)(?:지|고|며|어|아)$/u.test(token)
    || (koVerbStem.test(token) && /(?:고|며|면서|지만|어|아|해|줘|돼|봐|자|지)$/u.test(token))) return 'predicate';
  if (/[은는이가]$/u.test(token)) return 'subject';
  return 'word';
}

export function analyzeSyntax(text) {
  let clause = 0;
  let sentence = 0;
  let previousEnd = 0;
  let previousRole = '';
  const words = [...text.matchAll(/[가-힣a-z0-9]+/giu)].map((match, index) => {
    const gap = text.slice(previousEnd, match.index);
    const token = match[0].toLowerCase();
    const role = roleFor(token);
    const lineBoundary = /\n/u.test(gap) && (role === 'subject' || previousRole === 'predicate');
    if (/[,.!?;]/u.test(gap) || lineBoundary) clause += 1;
    if (/[.!?]/u.test(gap) || lineBoundary) sentence += 1;
    const continues = role === 'predicate' && /(?:고|며|면서|지만|는데)$/u.test(token);
    previousRole = continues ? 'connective' : role;
    previousEnd = match.index + match[0].length;
    const word = { token, index, clause, sentence, role };
    if (continues && /[가-힣]/u.test(token)) clause += 1;
    return word;
  });
  // Split coordinating clauses only when both sides contain a verb.
  for (const connector of words.filter((word) => word.role === 'conjunction')) {
    const group = words.filter((word) => word.clause === connector.clause);
    if (group.some((word) => word.index < connector.index && word.role === 'predicate')
      && group.some((word) => word.index > connector.index && word.role === 'predicate')) {
      for (const word of words) if (word.index > connector.index) word.clause += 1;
    }
  }
  const edges = [];
  const add = (from, to, type, provisional = false) => {
    if (from !== to && !edges.some((edge) => edge.from === from && edge.to === to))
      edges.push({ from, to, type, provisional });
  };
  const nounRoles = ['word', 'subject', 'object', 'place'];
  for (const clauseId of new Set(words.map((word) => word.clause))) {
    const group = words.filter((word) => word.clause === clauseId);
    const predicates = group.filter((word) => word.role === 'predicate');
    const heads = predicates.length ? predicates : group.filter((word) => word.role === 'auxiliary');
    const nearest = (word, items) => [...items].sort((a, b) => Math.abs(a.index - word.index) - Math.abs(b.index - word.index))[0];
    for (const word of group) {
      const predicate = nearest(word, heads);
      if (['adjective', 'participle', 'determiner'].includes(word.role)) {
        const noun = group.find((other) => other.index > word.index && nounRoles.includes(other.role));
        if (noun) add(word.index, noun.index, word.role === 'determiner' ? 'determiner' : 'modifier');
        if (word.role === 'participle') {
          const subject = [...group].reverse().find((other) => other.index < word.index && other.role === 'subject');
          if (subject) add(subject.index, word.index, 'subject');
        }
      } else if (word.role === 'preposition') {
        const noun = group.find((other) => other.index > word.index && nounRoles.includes(other.role));
        if (noun) add(word.index, noun.index, 'place');
      } else if (word.role === 'auxiliary' && predicate && word !== predicate) {
        add(word.index, predicate.index, 'auxiliary');
      } else if (word.role === 'adverb') {
        if (predicate) add(word.index, predicate.index, 'modifier');
        else {
          const head = nearest(word, group.filter((other) => nounRoles.includes(other.role)));
          if (head) add(word.index, head.index, 'provisional', true);
        }
      } else if (predicate && nounRoles.includes(word.role)) {
        // A relative-clause subject already belongs to its participle.
        if (edges.some((edge) => edge.from === word.index && words[edge.to].role === 'participle')) continue;
        const role = word.role === 'word' ? (word.index < predicate.index ? 'subject' : 'object') : word.role;
        add(word.index, predicate.index, role);
      }
    }
    if (!heads.length) {
      const nouns = group.filter((word) => nounRoles.includes(word.role));
      for (let i = 1; i < nouns.length; i += 1) {
        if (!edges.some((edge) => edge.from === nouns[i - 1].index))
          add(nouns[i - 1].index, nouns[i].index, 'provisional', true);
      }
    }
  }
  // Keep the two sides of a compound sentence connected through their verbs.
  const predicates = words.filter((word) => word.role === 'predicate');
  for (let i = 1; i < predicates.length; i += 1) {
    const a = predicates[i - 1], b = predicates[i];
    if (a.sentence === b.sentence && a.clause !== b.clause) add(a.index, b.index, 'continuation');
  }
  // Carry an explicit subject through connected predicates, but never across
  // sentence punctuation or a replacement subject. Reported clauses temporarily
  // own their inner subject (생각이 난다고), then return to the outer subject.
  let activeSubject = null;
  for (const clauseId of new Set(words.map((word) => word.clause))) {
    const group = words.filter((word) => word.clause === clauseId);
    if (activeSubject?.sentence !== group[0].sentence) activeSubject = null;
    const heads = group.filter((word) => word.role === 'predicate');
    const explicit = group.find((word) => word.role === 'subject')
      ?? group.find((word) => /^[a-z]+$/u.test(word.token) && edges.some((edge) => edge.from === word.index && edge.type === 'subject'));
    const owner = explicit ?? activeSubject;
    if (owner) {
      for (const head of heads) {
        if (owner.index < head.index) add(owner.index, head.index, 'shared-subject');
      }
    }
    const reported = heads.some((head) => /(?:다고|라고)$/u.test(head.token));
    if (explicit && !(reported && activeSubject)) activeSubject = explicit;
  }
  // Repeated explicit subjects also form a hub across sentences.
  const subjectHubs = new Map();
  for (const word of words) {
    const subjectEdge = edges.find((edge) => edge.from === word.index && edge.type === 'subject');
    if (word.role !== 'subject' && !subjectEdge) continue;
    const key = /^[가-힣]+$/u.test(word.token) ? word.token.replace(/[은는이가]$/u, '') : word.token;
    if (!key) continue;
    const hub = subjectHubs.get(key);
    if (!hub) { subjectHubs.set(key, word); continue; }
    if (hub.clause === word.clause) continue;
    const local = words.filter((other) => other.clause === word.clause && other.index > word.index);
    const target = subjectEdge ? words[subjectEdge.to] : local.filter((other) => nounRoles.includes(other.role)).at(-1);
    if (target) add(hub.index, target.index, 'shared-subject', !subjectEdge);
  }
  const counts = words.reduce((result, word) => ({ ...result, [word.role]: (result[word.role] ?? 0) + 1 }), {});
  return { words, edges, ...counts };
}
