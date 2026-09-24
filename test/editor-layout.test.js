import test from 'node:test';
import assert from 'node:assert/strict';
import { editorFontSize } from '../src/editor-layout.js';

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
