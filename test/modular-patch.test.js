import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText } from '../src/text-analyzer.js';
import { analyzeSyntax } from '../src/syntax.js';
import { addMeaningLinks } from '../src/meaning-links.js';
import { createModularPatch, compileModularVoices } from '../src/modular-patch.js';
import { createStrudelCode } from '../src/music-engine.js';
import { visiblePatternCode } from '../src/live-code.js';
const analyze = (text) => ({...analyzeText(text), syntax:addMeaningLinks(analyzeSyntax(text))});
test('sentences create bounded modules and normalled directional CV cables', () => {
  const patch = createModularPatch(analyze('바다는 흐른다. 별은 빛난다. 새는 춤춘다.'));
  assert.equal(patch.modules.length, 3);
  assert.ok(patch.cables.length >= 2);
  assert.ok(patch.cables.every((c) => c.source < c.target));
  assert.equal(new Set(patch.cables.map((c) => `${c.target}:${c.kind}`)).size, patch.cables.length);
  assert.equal(createModularPatch(analyze('바다. '.repeat(20))).modules.length, 8);
});
test('unplugging changes target filter, not source voice', () => {
  const patch = createModularPatch(analyze('바다는 흐른다. 별은 빛난다.'));
  const config = {chords:[0,5,3,4], root:'C', scale:'major'};
  const connected = compileModularVoices(patch, config);
  const disconnected = compileModularVoices({...patch,cables:[]}, config);
  assert.equal(connected[0], disconnected[0]);
  assert.notEqual(connected[1], disconnected[1]);
  assert.match(connected[1], /lpf\(sine.slow/u);
  assert.doesNotMatch(disconnected[1], /lpf\(sine/u);
});
test('gate and pitch inputs take their source sequence and retain gain headroom', () => {
  const patch = createModularPatch(analyze('바다. 빛 별 춤 바람.'));
  patch.modules[0].gate = [true,false,false,false,false,false,false,false];
  patch.modules[0].pitch = Array(8).fill(6);
  patch.cables = [{source:0,target:1,kind:'gate'}, {source:0,target:1,kind:'pitch'}];
  const voices = compileModularVoices(patch, {chords:[0],root:'C',scale:'major'});
  assert.match(voices[1], /n\("<\[6 ~ ~ ~ ~ ~ ~ ~\]>"\)/u);
  assert.match(voices[1], /gain\(0.081\)/u);
});
test('visible patch instructions correspond to compiled modulation, hiding parameters', () => {
  const code = createStrudelCode(analyze('바다는 흐른다. 별은 빛난다.'));
  assert.match(code, /M1.LFO → M2.VCF/u);
  assert.match(code, /sine.slow/u);
  const visible = visiblePatternCode(code).join('\n');
  assert.match(visible, /PATCH/u);
  assert.doesNotMatch(visible, /\.lpf|\.gain/u);
});
