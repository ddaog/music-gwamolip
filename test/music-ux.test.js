import test from 'node:test';
import assert from 'node:assert/strict';
import { configurePlaybackSession } from '../src/audio-session.js';
import { MusicRecorder } from '../src/music-recorder.js';
import { musicInsights } from '../src/music-insights.js';
import { analyzeText } from '../src/text-analyzer.js';
import { formatFullCode } from '../src/live-code.js';
import { fitCodeFont } from '../src/code-fit.js';

test('code fits at the largest readable size, never below 11px', () => {
  assert.equal(fitCodeFont((size) => size * 10, 140), 13);
  assert.equal(fitCodeFont((size) => size * 10, 120), 12);
  assert.equal(fitCodeFont((size) => size * 10, 20), 11);
});

test('playback session is a safe capability-gated hint', () => {
  const nav = { audioSession:{type:'auto'} };
  assert.equal(configurePlaybackSession(nav), true);
  assert.equal(nav.audioSession.type, 'playback');
  assert.equal(configurePlaybackSession({}), false);
  assert.equal(configurePlaybackSession({get audioSession() { throw Error('unsupported'); }}), false);
});
test('music explanation follows actual arrangement including fear and beat off', () => {
  const rows = musicInsights(analyzeText('무서움 바다 빛'), {mode:'off'});
  assert.match(rows[0][0], /minor/u);
  assert.match(rows[0][1], /무서움/u);
  assert.match(rows[1][1], /베이스/u);
  assert.doesNotMatch(rows[1][1], /비트/u);
});
test('full code formatting preserves decimal values and puts controls on separate lines', () => {
  assert.equal(formatFullCode('stack(\n  n("0 2").lpf(sine.slow(4).range(300,900)).gain(0.123)\n)'), 'stack(\n  n("0 2")\n    .lpf(sine.slow(4).range(300,900))\n    .gain(0.123)\n)');
});
test('recorder taps and disconnects only its own output, saves supported format', () => {
  class Recorder {
    static isTypeSupported(type) { return type === 'audio/mp4'; }
    constructor(stream, options) { this.mimeType = options.mimeType; this.state = 'inactive'; }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; this.ondataavailable({data:new Blob(['audio'])}); this.onstop(); }
  }
  let saved, stopped = false;
  const destination = {stream:{getTracks:() => [{stop() {stopped = true;}}]}};
  const calls = [];
  const output = {connect(node) {calls.push(['connect',node]);}, disconnect(node) {calls.push(['disconnect',node]);}};
  const recorder = new MusicRecorder((blob, ext) => {saved = {blob,ext};}, () => {}, Recorder);
  recorder.start({createMediaStreamDestination:() => destination}, output);
  assert.equal(recorder.active, true);
  recorder.connect(output);
  assert.equal(calls.length, 1);
  const secondOutput = {connect(node) {calls.push(['reconnect',node]);}, disconnect(node) {calls.push(['disconnect-new',node]);}};
  recorder.connect(secondOutput);
  assert.equal(calls[1][0], 'disconnect');
  assert.equal(calls[2][0], 'reconnect');
  recorder.stop();
  assert.equal(saved.ext, 'm4a');
  assert.ok(saved.blob.size > 0);
  assert.equal(calls[1][1], destination);
  assert.equal(stopped, true);
});
