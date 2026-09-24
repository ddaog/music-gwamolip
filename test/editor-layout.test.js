import test from 'node:test';
import assert from 'node:assert/strict';
import { editorFontSize, fitEditorFont } from '../src/editor-layout.js';

test('actual wrapped height reduces editor text but preserves an 18px floor', () => {
  assert.equal(fitEditorFont(32, 180, (size) => size * 4), 32);
  assert.equal(fitEditorFont(32, 180, (size) => size * 8), 22.5);
  assert.equal(fitEditorFont(22, 96, (size) => size * 20), 18);
  let reads = 0;
  fitEditorFont(32, 180, (size) => { reads++; return size * 9; });
  assert.ok(reads <= 5);
});

test('longer text gently shrinks without exceeding readability limits', () => {
  for (const width of [320, 390, 600, 1280]) {
    let previous = editorFontSize('', width);
    for (let length = 0; length <= 180; length++) {
      const size = editorFontSize('가'.repeat(length), width);
      assert.ok(size <= previous && size >= 18);
      previous = size;
    }
  }
  assert.equal(editorFontSize('짧은 문장', 1280), 32);
  assert.equal(editorFontSize('가'.repeat(180), 1280), 24);
  assert.equal(editorFontSize('가'.repeat(180), 390), 18);
  assert.ok(editorFontSize('가\n'.repeat(10), 390) < editorFontSize('가'.repeat(20), 390));
});
