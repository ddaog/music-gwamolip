import test from 'node:test';
import assert from 'node:assert/strict';
import { MusicEngine } from '../src/music-engine.js';

function fixture(evaluate = async () => {}) {
  const repl = {
    scheduler: { started: false }, state: {}, evaluate,
    async start() { this.scheduler.started = true; },
    stop() { this.scheduler.started = false; },
  };
  return { repl, engine: new MusicEngine(async () => ({ initStrudel: async () => repl })) };
}
test('stop controls the owned transport, not the overwritten global hush', async () => {
  const { engine, repl } = fixture();
  await engine.play('test');
  assert.equal(repl.scheduler.started, true);
  engine.stop();
  assert.equal(repl.scheduler.started, false);
  assert.equal(engine.playing, false);
  await engine.play('restart');
  assert.equal(repl.scheduler.started, true);
});
test('stop during code evaluation cannot restart audio', async () => {
  let resolve;
  const { engine, repl } = fixture(() => new Promise((done) => { resolve = done; }));
  await engine.init();
  const pending = engine.play('pending');
  await Promise.resolve();
  engine.stop();
  resolve();
  await pending;
  assert.equal(repl.scheduler.started, false);
  assert.equal(engine.playing, false);
});
test('stop during initialization cancels playback', async () => {
  let resolve;
  const { repl } = fixture();
  const engine = new MusicEngine(async () => ({ initStrudel: () => new Promise((done) => { resolve = done; }) }));
  const pending = engine.play('pending');
  await Promise.resolve();
  engine.stop();
  resolve(repl);
  await pending;
  assert.equal(repl.scheduler.started, false);
});
