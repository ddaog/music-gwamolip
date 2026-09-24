import test from 'node:test';
import assert from 'node:assert/strict';
import { cosineSimilarity, semanticNeighbors, emotionProjection, negatedTokens } from '../src/semantic-math.js';
import { analyzeText } from '../src/text-analyzer.js';
import { analyzeSyntax } from '../src/syntax.js';
import { addMeaningLinks } from '../src/meaning-links.js';
import { createArrangement, createStrudelCode } from '../src/music-engine.js';
import { SemanticClient } from '../src/semantic-client.js';

test('cosine and confidence gating reject unrelated vectors', () => {
  assert.equal(cosineSimilarity([1,0], [2,0]), 1);
  assert.equal(cosineSimilarity([1,0], [0,1]), 0);
  assert.equal(cosineSimilarity([0,0], [1,1]), 0);
  assert.equal(cosineSimilarity([1], [1,2]), 0);
  assert.deepEqual(semanticNeighbors([1,0], [{ id:'forest', vectors:[[0,1]] }]), []);
  const neighbors = semanticNeighbors([1,0], [{ id:'forest', vectors:[[1,0]] }, { id:'flower', vectors:[[.99,.1]] }]);
  assert.ok(Math.abs(neighbors.reduce((sum, item) => sum + item.weight, 0) - 1) < 1e-6);
  assert.equal(neighbors[0].id, 'forest');
  assert.ok(emotionProjection([1,0], [{ axis:'tension', positive:[[1,0]], negative:[[0,1]] }]).tension > .15);
});

test('unknown words blend semantic traits while dictionary matches remain authoritative', () => {
  const inferred = { matches:[{id:'forest',weight:.8,score:.8},{id:'flower',weight:.2,score:.75}], axes:{warmth:.1} };
  const result = analyzeText('zorbella', 0, { zorbella:inferred });
  assert.equal(result.tokenMeanings[0].meaningSource, 'embedding');
  assert.equal(result.tokenMeanings[0].primaryConcept, 'forest');
  assert.ok(result.tokenMeanings[0].traits.warmth > 0);
  assert.deepEqual(analyzeText('바다', 0, { 바다:inferred }).tokenMeanings, analyzeText('바다').tokenMeanings);
});

test('local negation prevents fear vocabulary from forcing minor mode', () => {
  for (const text of ['안 무서워', '무섭지 않아', 'not afraid']) {
    assert.ok(negatedTokens(text).size > 0);
    assert.ok(analyzeText(text).tokenMeanings.every((word) => !word.conceptIds.includes('fear')));
  }
  assert.equal(negatedTokens('안. 무서워').size, 0);
});

test('repeated non-subjects and similar words connect with bounded edge counts', () => {
  const syntax = analyzeSyntax('별을 본다. 별이 빛난다. 바다와 대양');
  const linked = addMeaningLinks(syntax, [{a:'바다와',b:'대양',score:.9}]);
  assert.ok(linked.edges.some((edge) => edge.type === 'repetition' && edge.from === 0 && edge.to === 2));
  assert.ok(linked.edges.some((edge) => edge.type === 'semantic'));
  assert.ok(addMeaningLinks(analyzeSyntax('별 '.repeat(100))).edges.filter((edge) => edge.type === 'repetition').length <= 4);
  assert.ok(!addMeaningLinks(syntax, [{a:'바다와',b:'대양',score:.4}]).edges.some((edge) => edge.type === 'semantic'));
});

test('meaning connections change an actual response voice without shifting root', () => {
  const base = analyzeText('별을 본다. 별이 빛난다.');
  base.syntax = analyzeSyntax(base.text);
  const linked = { ...base, syntax:addMeaningLinks(base.syntax) };
  assert.equal(linked.root, base.root);
  assert.ok(createArrangement(linked).relationGain > 0);
  assert.notEqual(createStrudelCode(linked), createStrudelCode(base));
  assert.match(createStrudelCode(linked), /\.pan\(\.65\)/u);
});

test('semantic client ignores stale results and terminates on disable', async () => {
  let worker, results = [], statuses = [];
  const client = new SemanticClient({ delay:0, onResult:(...args) => results.push(args), onStatus:(state) => statuses.push(state),
    createWorker:() => (worker = { postMessage(data) { this.sent = data; }, terminate() { this.terminated = true; } }) });
  client.enable(); client.request('old', ['old']);
  await new Promise((done) => setTimeout(done, 10));
  const old = worker.sent;
  client.request('new', ['new']);
  worker.onmessage({data:{type:'result', id:old.id, text:'old', result:{}}});
  assert.equal(results.length, 0);
  await new Promise((done) => setTimeout(done, 10));
  worker.onmessage({data:{type:'result', ...worker.sent, result:{meanings:{},similarities:[]}}});
  assert.equal(results[0][0], 'new');
  client.disable(); assert.equal(worker.terminated, true);
  worker.onmessage({data:{type:'result', ...worker.sent, result:{}}});
  assert.equal(results.length, 1);
});
