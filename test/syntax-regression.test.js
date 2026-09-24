import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSyntax } from '../src/syntax.js';

test('repeated subjects branch to poetic complements without merging different subjects', () => {
  const parsed = analyzeSyntax('나는 이렇게 산단다.\n너는 기쁨\n너는 사랑\n너는 우물가의 물.');
  const branches = parsed.edges.filter((edge) => edge.type === 'shared-subject');
  assert.deepEqual(branches.map(({ from, to }) => [from, parsed.words[to].token]), [[3, '사랑'], [3, '물']]);
  assert.ok(branches.every((edge) => edge.provisional));
  assert.equal(analyzeSyntax('나는 노래한다. 너는 춤춘다.').edges.filter((edge) => edge.type === 'shared-subject').length, 0);
});

test('repeated English subjects share their predicate branches', () => {
  const parsed = analyzeSyntax('You sing. You dance.');
  assert.ok(parsed.edges.some((edge) => edge.type === 'shared-subject' && edge.from === 0 && parsed.words[edge.to].token === 'dance'));
});

const cases = [
  ['너는 늘\n나에게\n기쁨을 주지', ['너는→주지', '나에게→주지', '기쁨을→주지']],
  ['You\ngive me\njoy', ['you→give', 'joy→give']],
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
