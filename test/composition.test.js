import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSyntax } from '../src/syntax.js';
import { analyzeText } from '../src/text-analyzer.js';
import { createArrangement, createStrudelCode } from '../src/music-engine.js';

test('modifiers attach to nouns and verbs within their own clause', () => {
  const syntax = analyzeSyntax('A tiny red bird dances softly. The moon shines quietly.');
  const pairs = syntax.edges.map(({ from, to }) => [syntax.words[from].token, syntax.words[to].token]);
  assert.ok(pairs.some(([a, b]) => a === 'tiny' && b === 'bird'));
  assert.ok(pairs.some(([a, b]) => a === 'red' && b === 'bird'));
  assert.ok(pairs.some(([a, b]) => a === 'softly' && b === 'dances'));
  assert.ok(pairs.some(([a, b]) => a === 'quietly' && b === 'shines'));
  assert.ok(syntax.edges.every(({ from, to }) => syntax.words[from].clause === syntax.words[to].clause));
});

test('Korean subjects, objects and adverbs find their clause predicate', () => {
  const syntax = analyzeSyntax('작은 빛이 천천히 숲을 건넌다, 파도가 빠르게 흐른다.');
  const pairs = syntax.edges.map(({ from, to }) => [syntax.words[from].token, syntax.words[to].token].join('→'));
  for (const pair of ['작은→빛이', '빛이→건넌다', '천천히→건넌다', '숲을→건넌다', '빠르게→흐른다']) assert.ok(pairs.includes(pair));
});

test('melody uses shared chord tones and additions preserve its opening notes', () => {
  const short = createArrangement(analyzeText('moon'));
  const long = createArrangement(analyzeText('moon dances softly above silver waves and quiet stars'));
  assert.equal(short.scale, long.scale);
  short.melody.forEach((bar, i) => {
    const notes = bar.split(' ');
    const expanded = long.melody[i].split(' ');
    notes.forEach((note, j) => { if (note !== '~') assert.equal(note, expanded[j]); });
    for (const note of long.melody[i].split(' ').filter((n) => n !== '~')) assert.ok([0, 2, 4, 6].includes(Number(note) - long.chords[i]));
  });
});

test('beat switch overrides automatic growth and off removes all drum voices', () => {
  const analysis = analyzeText('moon');
  assert.equal(createArrangement(analysis).drums, 0);
  assert.ok(createArrangement(analysis, { mode: 'on', intensity: .5 }).drums > 0);
  assert.doesNotMatch(createStrudelCode(analysis, { mode: 'off' }), /white|penv/);
  assert.match(createStrudelCode(analysis, { mode: 'on' }), /white/);
  assert.doesNotMatch(createStrudelCode(analysis, { mode: 'on', intensity: 0 }), /white|penv/);
});
