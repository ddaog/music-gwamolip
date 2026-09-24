import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText } from '../src/text-analyzer.js';
import { createArrangement, createStrudelCode } from '../src/music-engine.js';
import { createRhythm } from '../src/rhythm.js';
import { codeLayers, visiblePatternCode } from '../src/live-code.js';
import { CONCEPTS } from '../src/lexicon.js';

test('Korean imagery has over 2000 distinct entries and recognizes everyday inflections', () => {
  assert.ok(new Set(CONCEPTS.flatMap((item) => item.words.ko)).size > 2000);
  for (const [text, id] of [['반딧불이가','light'], ['소꿉놀이를','playful'], ['바이올린으로','voice'], ['무서웠다','fear'], ['서랍에서','home'], ['소나무는','forest'], ['반가워','joy'], ['들으며','voice']]) {
    assert.ok(analyzeText(text).tokenMeanings[0].conceptIds.includes(id), text);
  }
});
test('fear later in a sentence changes harmony and timbre, not only the opening word', () => {
  const calm = analyzeText('나는 고요한 바다를 바라본다');
  const fear = analyzeText('나는 무서움과 두려움을 느껴');
  assert.equal(createArrangement(calm).scale, 'major');
  assert.equal(createArrangement(fear).scale, 'minor');
  assert.ok(createArrangement(fear).tension > .6);
  assert.match(createStrudelCode(fear), /s\("sawtooth"\)/u);
  assert.doesNotMatch(createStrudelCode(calm), /s\("sawtooth"\)/u);
});
test('grooves are repeatable, multi-bar, varied, and preserve foundational hits as words grow', () => {
  const analysis = analyzeText('바람 숲 빛 춤 별 파도 나무 달');
  const sparse = createRhythm(analysis, 0);
  const dense = createRhythm(analysis, 1, .8);
  assert.deepEqual(dense, createRhythm(analysis, 1, .8));
  assert.ok(new Set(dense.hat).size > 1);
  assert.ok(new Set(Array.from({ length: 20 }, (_, seed) => JSON.stringify(createRhythm({ seed }, .8)))).size >= 16);
  for (const voice of ['kick', 'snare', 'hat']) {
    for (let bar = 0; bar < 8; bar++) {
      const expanded = dense[voice][bar].split(' ');
      assert.equal(expanded.length, 16);
      sparse[voice][bar].split(' ').forEach((hit, i) => { if (hit !== '~') assert.notEqual(expanded[i], '~'); });
    }
  }
});
test('summary exposes actual growing voices while hiding detailed parameters', () => {
  const counts = [1, 2, 3, 6].map((count) => {
    const source = createStrudelCode(analyzeText('빛 '.repeat(count)), { mode: 'off' });
    const layers = codeLayers(source);
    assert.ok(layers.every((line) => !/gain|lpf|attack|\d/u.test(line)));
    return layers.length;
  });
  assert.deepEqual(counts, [1, 2, 3, 4]);
  assert.equal(codeLayers(createStrudelCode(analyzeText('빛'), { mode: 'on' })).length, 4);
  const visible = visiblePatternCode(createStrudelCode(analyzeText('빛 별 바람'))).join('\n');
  assert.match(visible, /stack\(/u);
  assert.match(visible, /n\("/u);
  assert.doesNotMatch(visible, /\.(scale|s|lpf|attack|decay|sustain|release|room|delay|gain)\(/u);
});
