import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText } from '../src/text-analyzer.js';
import { createStrudelCode } from '../src/music-engine.js';
import { LEXICON_STATS } from '../src/lexicon.js';
import { visualProfileForToken } from '../src/visualizer.js';

test('bilingual lexicon contains broad Korean and English coverage', () => {
  assert.ok(LEXICON_STATS.concepts >= 30);
  assert.ok(LEXICON_STATS.korean + LEXICON_STATS.english >= 1000);
});

test('Korean imagery becomes meaningful far and near layers', () => {
  const analysis = analyzeText('먼 바다 위 작은 불빛이 천천히 흔들린다.');
  assert.ok(analysis.concepts.some((item) => item.id === 'water'));
  assert.ok(analysis.concepts.some((item) => item.id === 'light'));
  assert.ok(analysis.layers.farTokens.length > 0);
  assert.ok(analysis.layers.nearTokens.length > 0);
});

test('English inflections are recognized', () => {
  const analysis = analyzeText('Tiny red birds danced through warm winds.');
  const ids = new Set(analysis.concepts.map((item) => item.id));
  assert.ok(ids.has('animal'));
  assert.ok(ids.has('color'));
  assert.ok(ids.has('love'));
  assert.ok(ids.has('wind'));
});

test('Korean compounds and color words carry individual visual traits', () => {
  const analysis = analyzeText('바닷속 푸른 고래가 천천히 춤춘다.');
  const ids = new Set(analysis.concepts.map((item) => item.id));
  assert.ok(ids.has('water'));
  assert.ok(ids.has('joy'));
  const blueWord = analysis.tokenMeanings.find((item) => item.token === '푸른');
  assert.equal(visualProfileForToken(blueWord.primaryConcept, blueWord.token).color, '#4b8cde');
  assert.ok(analysis.tokenMeanings.find((item) => item.token === '천천히').traits.softness > 0.2);
});

test('same sentence and variation stay deterministic', () => {
  const first = analyzeText('고요한 달과 파도', 2);
  const second = analyzeText('고요한 달과 파도', 2);
  assert.deepEqual(first.layers, second.layers);
  assert.equal(first.root, second.root);
  assert.equal(first.bpm, second.bpm);
});

test('generated Strudel code is playable structure without raw prose', () => {
  const sentence = 'A bright moon waits beyond the forest.';
  const code = createStrudelCode(analyzeText(sentence));
  assert.match(code, /^setcpm\(/);
  assert.match(code, /stack\(/);
  assert.doesNotMatch(code, /bright moon waits/i);
});
