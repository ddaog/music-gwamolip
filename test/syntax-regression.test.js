import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSyntax } from '../src/syntax.js';

const cases = [
  ['나는 너를 좋아해', ['나는→좋아해', '너를→좋아해']],
  ['나는 음악을 듣고 너는 그림을 그린다.', ['나는→듣고', '음악을→듣고', '너는→그린다', '그림을→그린다']],
  ['새가 날아가고 바람이 분다.', ['새가→날아가고', '바람이→분다']],
  ['따스한 햇살 아래 작은 고양이', ['따스한→햇살', '작은→고양이']],
  ['비가 그친 뒤, 작은 빛이 천천히 숲을 건넌다.', ['비가→그친', '그친→뒤', '빛이→건넌다']],
  ['The bird eats seeds and the cat watches it.', ['bird→eats', 'seeds→eats', 'cat→watches', 'it→watches']],
  ['A bird is flying above the sea.', ['bird→flying', 'is→flying']],
  ['She wrote a letter.', ['she→wrote', 'letter→wrote']],
];
for (const [text, expected] of cases) {
  test(`relationships: ${text}`, () => {
    const result = analyzeSyntax(text);
    const pairs = result.edges.map(({ from, to }) => `${result.words[from].token}→${result.words[to].token}`);
    for (const pair of expected) assert.ok(pairs.includes(pair), `${pair} missing from ${pairs}`);
    assert.ok(result.edges.every(({ from, to }) => from !== to && result.words[from] && result.words[to]));
  });
}
test('unfinished phrases expose provisional edges and complete sentences replace them', () => {
  assert.ok(analyzeSyntax('나는 음악을').edges.some((edge) => edge.provisional));
  assert.ok(analyzeSyntax('나는 음악을 듣는다').edges.every((edge) => !edge.provisional));
  assert.equal(analyzeSyntax('').edges.length, 0);
  const parsed = analyzeSyntax('나는 음악을 듣고 너는 그림을 그린다.');
  assert.ok(!parsed.edges.some(({ from, to }) => parsed.words[from].token === '음악을' && parsed.words[to].token === '그린다'));
});
