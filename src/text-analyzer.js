import { CONCEPTS, FAR_CUES, NEAR_CUES, STOPWORDS } from './lexicon.js';

const FAR_CONCEPTS = new Set(CONCEPTS.filter((item) => item.layer === 'far').map((item) => item.id));
const NEAR_CONCEPTS = new Set(CONCEPTS.filter((item) => item.layer === 'near').map((item) => item.id));

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function tokenize(text) {
  return (text.toLowerCase().match(/[가-힣a-z0-9]+/g) ?? []).filter((token) => token && !STOPWORDS.has(token));
}

function normalizedToken(token) {
  if (/^[a-z]+$/.test(token)) {
    if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
    if (token.endsWith('ing') && token.length > 5) return token.slice(0, -3).replace(/(.)\1$/u, '$1');
    if (token.endsWith('ed') && token.length > 4) return token.slice(0, -2).replace(/(.)\1$/u, '$1');
    if (/(?:ches|shes|xes|zes|oes)$/u.test(token) && token.length > 5) return token.slice(0, -2);
    if (token.endsWith('s') && token.length > 3 && !token.endsWith('ss')) return token.slice(0, -1);
  }
  return token;
}

function tokenForms(token) {
  const forms = new Set([token, normalizedToken(token)]);
  if (/^[a-z]+$/u.test(token)) {
    if (/(?:ing|ed)$/u.test(token)) {
      const stem = token.replace(/(?:ing|ed)$/u, '');
      forms.add(stem);
      forms.add(`${stem}e`);
      if (stem.endsWith('i')) forms.add(`${stem.slice(0, -1)}y`);
    }
    if (token.endsWith('ly')) {
      const stem = token.slice(0, -2);
      forms.add(stem);
      if (stem.endsWith('i')) forms.add(`${stem.slice(0, -1)}y`);
    }
    if (token.endsWith('ness')) {
      const stem = token.slice(0, -4);
      forms.add(stem);
      if (stem.endsWith('i')) forms.add(`${stem.slice(0, -1)}y`);
    }
    for (const suffix of ['ful', 'less', 'able', 'er', 'est']) {
      if (token.endsWith(suffix) && token.length > suffix.length + 3) forms.add(token.slice(0, -suffix.length));
    }
  } else {
    const endings = [
      '으로부터', '에게서는', '에서부터', '에게서', '한테서', '으로써', '이라도', '더라도', '에서', '에게', '한테',
      '으로', '처럼', '까지', '부터', '보다', '마다', '하고', '이며', '지만', '는데', '은데', '으면', '아서', '어서',
      '았다', '었다', '였다', '한다', '된다', '진다', '는다', 'ㄴ다', '으며', '면서', '거나', '려고', '겠', '네요',
      '어요', '아요', '여요', '하게', '히', '게', '들', '은', '는', '이', '가', '을', '를', '의', '와', '과', '도', '로', '랑', '야', '다',
    ];
    let stem = token;
    for (let pass = 0; pass < 2; pass += 1) {
      const ending = endings.find((suffix) => stem.length > suffix.length + 1 && stem.endsWith(suffix));
      if (!ending) break;
      stem = stem.slice(0, -ending.length);
      forms.add(stem);
      if (stem.endsWith('워') || stem.endsWith('운')) forms.add(toBieupStem(stem.slice(0, -1)));
    }
  }
  return [...forms].filter((form) => form.length > 1);
}

function toBieupStem(stem) {
  const syllable = stem.at(-1);
  const code = syllable?.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return stem;
  const onset = Math.floor(code / 588);
  const vowel = Math.floor((code % 588) / 28);
  return `${stem.slice(0, -1)}${String.fromCharCode(0xac00 + onset * 588 + vowel * 28 + 17)}`;
}

function cueMatches(token, cue) {
  if (/^[가-힣]$/u.test(cue)) {
    return token === cue || [`${cue}는`, `${cue}가`, `${cue}를`, `${cue}의`, `${cue}와`].some((form) => token.startsWith(form));
  }
  if (/^[a-z]$/u.test(cue)) return token === cue;
  return token === cue || token.includes(cue);
}

function conceptWordMatches(token, word) {
  const tokenIsLatin = /^[a-z]+$/u.test(token);
  const wordIsLatin = /^[a-z]+$/u.test(word);
  if (tokenIsLatin && wordIsLatin) {
    return token === normalizedToken(word) || normalizedToken(token) === normalizedToken(word);
  }
  if (word.length === 1) {
    if (token === word) return true;
    const suffix = token.slice(word.length);
    return token.startsWith(word) && /^[은는이가을를의와과도만에로야랑께부터까지처럼보다]+$/u.test(suffix);
  }
  return token.startsWith(word) || token.includes(word);
}

function phoneticImpression(token) {
  const result = { warmth: 0, motion: 0, light: 0, space: 0, softness: 0, tension: 0 };
  if (/^[가-힣]+$/u.test(token)) {
    let bright = 0;
    let deep = 0;
    for (const character of token) {
      const code = character.charCodeAt(0) - 0xac00;
      const vowel = Math.floor((code % 588) / 28);
      if ([0, 1, 8, 9, 10, 11, 12].includes(vowel)) bright += 1;
      if ([4, 5, 6, 7, 13, 14, 17, 18].includes(vowel)) deep += 1;
    }
    const total = Math.max(1, token.length);
    result.light += (bright - deep) / total * 0.14;
    result.warmth += (bright - deep) / total * 0.11;
    result.softness += Math.min(0.1, (token.match(/[ㄴㄹㅁㅇ]/gu) ?? []).length * 0.025);
    result.tension += Math.min(0.12, (token.match(/[ㄲㄸㅃㅆㅉㅋㅌㅍㅎ]/gu) ?? []).length * 0.035);
    result.space += Math.min(0.08, (token.match(/[ㅗㅜㅡ]/gu) ?? []).length * 0.025);
  } else {
    const length = Math.max(1, token.length);
    const bright = (token.match(/[ei]/g) ?? []).length;
    const deep = (token.match(/[ou]/g) ?? []).length;
    const soft = (token.match(/[lmnswh]/g) ?? []).length;
    const hard = (token.match(/[ktpxz]/g) ?? []).length;
    result.light += (bright - deep) / length * 0.14;
    result.softness += (soft - hard) / length * 0.11;
    result.tension += hard / length * 0.12;
    result.space += Math.min(0.08, (token.match(/[ou]/gu) ?? []).length / length * 0.08);
  }
  result.motion += clamp((token.length - 3) / 18, -0.08, 0.16);
  return result;
}

export function analyzeText(rawText, variation = 0) {
  const text = rawText.trim() || '고요한 빛이 천천히 흐른다.';
  const tokens = tokenize(text);
  const conceptScores = new Map();
  const tokenConcepts = new Map(tokens.map((token) => [token, new Set()]));
  const axes = {
    warmth: 0.5,
    motion: 0.42,
    light: 0.5,
    space: 0.5,
    softness: 0.55,
    tension: 0.18,
  };

  const impact = 0.78 / Math.sqrt(Math.max(1, tokens.length / 5));
  for (const token of tokens) {
    const normalized = normalizedToken(token);
    const forms = tokenForms(token);
    let matchCount = 0;
    for (const concept of CONCEPTS) {
      const vocabulary = /^[a-z]+$/u.test(normalized) ? concept.words.en : concept.words.ko;
      const match = forms.some((form) => vocabulary.some((word) => conceptWordMatches(form, word)));
      if (!match) continue;
      matchCount += 1;
      conceptScores.set(concept.id, (conceptScores.get(concept.id) ?? 0) + 1);
      tokenConcepts.get(token)?.add(concept.id);
      for (const [axis, delta] of Object.entries(concept.axes)) {
        axes[axis] += delta * impact;
      }
    }
    if (!matchCount) {
      const impression = phoneticImpression(normalized);
      for (const [axis, delta] of Object.entries(impression)) axes[axis] += delta;
    }
  }

  const punctuation = (text.match(/[,.!?;:，。！？…]/g) ?? []).length;
  const averageLength = tokens.length
    ? tokens.reduce((sum, token) => sum + token.length, 0) / tokens.length
    : 3;
  axes.space += clamp(punctuation / 8, 0, 0.2);
  axes.motion += clamp((tokens.length - 5) / 40, -0.08, 0.14);
  axes.softness += clamp((4 - averageLength) / 20, -0.06, 0.08);

  for (const key of Object.keys(axes)) axes[key] = clamp(axes[key]);

  const concepts = [...conceptScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, score]) => ({
      ...CONCEPTS.find((concept) => concept.id === id),
      score,
    }));

  if (!concepts.length) {
    concepts.push({ id: 'unique', label: '고유한 리듬', score: 1, axes: {} });
  }

  // Anchor tonality to the opening word so later words layer onto the same musical scene.
  const tonalAnchor = tokens[0] ?? text;
  const seed = (hashString(tonalAnchor.normalize('NFC')) + variation * 2654435761) >>> 0;
  const roots = ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'];
  const root = roots[seed % roots.length];
  let scale = axes.tension > 0.5 ? 'minor:pentatonic' : axes.light > 0.67 ? 'major:pentatonic' : 'dorian';
  if (conceptScores.has('moon') || conceptScores.has('darkness') || conceptScores.has('dream')) scale = 'minor:pentatonic';
  if (conceptScores.has('playful') || conceptScores.has('joy')) scale = 'major:pentatonic';

  const bpm = Math.round(68 + axes.motion * 58 + axes.tension * 12);
  const farTokens = [];
  const nearTokens = [];
  (tokens.length ? tokens : ['formyiru']).forEach((token, index) => {
    const normalized = normalizedToken(token);
    const ids = tokenConcepts.get(token) ?? new Set();
    let farScore = FAR_CUES.some((cue) => cueMatches(normalized, cue)) ? 2 : 0;
    let nearScore = NEAR_CUES.some((cue) => cueMatches(normalized, cue)) ? 2 : 0;
    for (const id of ids) {
      if (FAR_CONCEPTS.has(id)) farScore += 1;
      if (NEAR_CONCEPTS.has(id)) nearScore += 1;
    }
    if (farScore === nearScore) {
      const tokenHash = hashString(`${token}:${index}:${seed}`);
      if (tokenHash % 2 === 0) farScore += 1;
      else nearScore += 1;
    }
    (farScore > nearScore ? farTokens : nearTokens).push(token);
  });

  if (!farTokens.length && nearTokens.length > 1) farTokens.push(nearTokens.shift());
  if (!nearTokens.length && farTokens.length > 1) nearTokens.push(farTokens.pop());

  const buildDegrees = (layerTokens, salt, allowRests) => {
    const source = layerTokens.length ? layerTokens : ['formyiru'];
    return source.slice(0, 12).map((token, index) => {
      const tokenSeed = hashString(`${token}:${seed}:${salt}:${index}`);
      const degree = tokenSeed % 9;
      const shouldRest = allowRests && index > 1 && ((tokenSeed >>> 7) % 7 === 0 || (axes.space > 0.72 && index % 4 === 3));
      return shouldRest ? '~' : String(degree);
    });
  };

  const nearDegrees = buildDegrees(nearTokens, 'near', true);
  const farDegrees = buildDegrees(farTokens, 'far', false);
  const degrees = [...nearDegrees];
  const tokenSeeds = (tokens.length ? tokens : ['formyiru']).map((token, index) => hashString(`${token}:${seed}:${index}`));
  tokenSeeds.slice(nearDegrees.length, 12).forEach((tokenSeed, index) => {
    const degree = tokenSeed % 9;
    const shouldRest = index > 1 && (tokenSeed >>> 7) % 7 === 0;
    degrees.push(shouldRest ? '~' : String(degree));
  });

  while (degrees.length < 8) {
    degrees.push(String((seed >>> degrees.length) % 8));
  }

  const density = clamp(tokens.length / 14, 0.28, 1);
  const colorHue = Math.round(18 + axes.warmth * 100 + axes.light * 22);
  const tokenMeanings = (tokens.length ? tokens : ['formyiru']).map((token, index) => {
    const ids = [...(tokenConcepts.get(token) ?? [])];
    const fallbackLayer = hashString(`${token}:${seed}:layer`) % 2 ? 'near' : 'far';
    const layer = ids.some((id) => NEAR_CONCEPTS.has(id))
      ? 'near'
      : ids.some((id) => FAR_CONCEPTS.has(id)) ? 'far' : fallbackLayer;
    const matchedConcepts = ids.map((id) => CONCEPTS.find((item) => item.id === id)).filter(Boolean);
    const phoneticTraits = matchedConcepts.length ? {} : phoneticImpression(token);
    const traits = Object.fromEntries(['warmth', 'motion', 'light', 'space', 'softness', 'tension'].map((axis) => [
      axis,
      matchedConcepts.length
        ? matchedConcepts.reduce((sum, item) => sum + (item.axes[axis] ?? 0), 0) / matchedConcepts.length
        : clamp(0.5 + (phoneticTraits[axis] ?? 0) * 3.5),
    ]));
    return {
      token,
      conceptIds: ids,
      primaryConcept: ids[0] ?? 'unique',
      layer,
      traits,
      seed: hashString(`${token}:${seed}:${index}:visual`),
    };
  });

  return {
    text,
    tokens,
    concepts,
    axes,
    seed,
    variation,
    root,
    scale,
    bpm,
    degrees,
    density,
    colorHue,
    punctuation,
    tokenMeanings,
    layers: {
      farTokens,
      nearTokens,
      farDegrees,
      nearDegrees,
    },
  };
}

export function describeAnalysis(analysis) {
  const phrases = [];
  if (analysis.axes.motion < 0.42) phrases.push(`고요한 움직임이 ${analysis.bpm} BPM의 느슨한 호흡을 만들고`);
  else if (analysis.axes.motion > 0.68) phrases.push(`빠른 움직임이 ${analysis.bpm} BPM의 촘촘한 맥박을 만들고`);
  else phrases.push(`문장의 걸음이 ${analysis.bpm} BPM의 차분한 맥박이 되고`);

  if (analysis.axes.light > 0.64) phrases.push('밝은 심상은 높은 음역의 반짝임으로 번역됩니다.');
  else if (analysis.axes.tension > 0.46) phrases.push('긴장된 심상은 낮은 필터와 짧은 잔향으로 남습니다.');
  else phrases.push('단어 사이의 여백은 부드러운 잔향으로 이어집니다.');

  const far = analysis.layers.farTokens.slice(0, 3).join('·');
  const near = analysis.layers.nearTokens.slice(0, 3).join('·');
  return `원경의 ${far}는 낮은 배경과 베이스로, 근경의 ${near}는 멜로디와 톱라인으로 놓였습니다. ${phrases.join(', ')}`;
}
