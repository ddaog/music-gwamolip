import test from 'node:test';
import assert from 'node:assert/strict';
import { visualProfileForToken } from '../src/visualizer.js';

test('bookstore and neighborhood easter eggs use their signature gradients', () => {
  const cases = [
    ['공간과몰입', '#df493b, #d5ac20, #3479cf'],
    ['낙산공원', '#297849, #79ad48, #348563'],
    ['혜화', '#66b8dd, #3166c7'],
    ['오쏘파스타', '#bb8534, #e2bc67, #c89542'],
  ];
  for (const [word, colors] of cases) {
    for (const suffix of ['', '에서', '에서는', '으로', '도', '의', 'ㄴ']) {
      for (const concept of ['unique', 'city', 'taste']) {
        assert.equal(visualProfileForToken(concept, word + suffix).gradient, `linear-gradient(100deg, ${colors})`);
      }
    }
  }
});

test('unrelated words and partial names retain ordinary visuals', () => {
  for (const word of ['혜', '공간과몰', '혜화로운', '신혜화', '낙산공원장', '파스타']) {
    assert.equal(visualProfileForToken('unique', word).gradient, undefined);
  }
});
