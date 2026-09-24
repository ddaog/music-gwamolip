import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText } from '../src/text-analyzer.js';
import { analyzeSyntax } from '../src/syntax.js';
import { addMeaningLinks } from '../src/meaning-links.js';
import { createStrudelCode, createArrangement } from '../src/music-engine.js';
import { createGuestbookEntry, validateSnapshot, GuestbookStore } from '../src/guestbook-store.js';

function snapshot(text = '바다는 흐른다. 별은 빛난다.') {
  const analysis = analyzeText(text);
  analysis.syntax = addMeaningLinks(analyzeSyntax(text));
  const beat = {mode:'auto',intensity:.55};
  const arrangement = createArrangement(analysis, beat);
  analysis.bpm = arrangement.bpm; analysis.scale = arrangement.scale;
  return {text, analysis, beat, variation:0, code:createStrudelCode(analysis, beat)};
}
test('guestbook captures independent text, music and settings snapshots', () => {
  const original = snapshot();
  const entry = createGuestbookEntry(original, '  독자  ', 'test-id', '2026-09-24T00:00:00.000Z');
  assert.equal(entry.author, '독자');
  assert.equal(entry.snapshot.code, original.code);
  original.analysis.root = 'C'; original.text = '다른 글';
  assert.notEqual(entry.snapshot.text, original.text);
  assert.ok(validateSnapshot(entry.snapshot));
  assert.equal(createGuestbookEntry(snapshot(), '', 'anon').author, '이름 없는 독자');
});
test('blank or tampered executable code cannot be saved or replayed', () => {
  assert.equal(validateSnapshot(snapshot('')), false);
  const code = snapshot(); code.code += '\nalert(1)';
  assert.equal(validateSnapshot(code), false);
  const root = snapshot(); root.analysis.root = 'C\");alert(1);//';
  assert.equal(validateSnapshot(root), false);
  assert.equal(validateSnapshot({}), false);
});
test('unavailable local storage reports failure rather than claiming to save', async () => {
  const store = new GuestbookStore(null);
  await assert.rejects(store.list(), /로컬 저장/u);
  await assert.rejects(store.save(createGuestbookEntry(snapshot(), '', 'test')), /로컬 저장/u);
});
