import './styles.css';
import './reading.css';
import './code-layout.css';
import { MusicRecorder } from './music-recorder.js';
import { SemanticClient } from './semantic-client.js';
import { addMeaningLinks } from './meaning-links.js';
import { createModularPatch, patchDescriptions } from './modular-patch.js';
import { editorFontSize, fitEditorFont } from './editor-layout.js';
import { analyzeSyntax } from './syntax.js';
import { renderLiveCode, formatFullCode } from './live-code.js';
import { musicInsights } from './music-insights.js';
import { analyzeText, describeAnalysis } from './text-analyzer.js';
import { LEXICON_STATS } from './lexicon.js';
import { createArrangement, createStrudelCode, MusicEngine } from './music-engine.js';
import { Visualizer, visualProfileFor, visualProfileForToken } from './visualizer.js';

const elements = {
  sentence: document.querySelector('#sentence'),
  sentenceHighlight: document.querySelector('#sentence-highlight'),
  relationLines: document.querySelector('#relation-lines'),
  charCount: document.querySelector('#char-count'),
  playButton: document.querySelector('#play-button'),
  actionLabel: document.querySelector('.action-label'),
  variationButton: document.querySelector('#variation-button'),
  status: document.querySelector('#status-line'),
  engineLabel: document.querySelector('#engine-label'),
  visualTitle: document.querySelector('#visual-title'),
  cycleValue: document.querySelector('#cycle-value'),
  keywordList: document.querySelector('#keyword-list'),
  lexiconStats: document.querySelector('#lexicon-stats'),
  farWords: document.querySelector('#far-words'),
  nearWords: document.querySelector('#near-words'),
  translationNote: document.querySelector('#translation-note'),
  code: document.querySelector('#strudel-code'),
  copyCode: document.querySelector('#copy-code'),
  readingDialog: document.querySelector('#reading-dialog'),
  readingTrigger: document.querySelector('#reading-trigger'),
  readingClose: document.querySelector('#reading-close'),
  canvas: document.querySelector('#visualizer'),
  dials: {
    warmth: { knob: document.querySelector('#dial-warmth'), value: document.querySelector('#dial-warmth-value') },
    motion: { knob: document.querySelector('#dial-motion'), value: document.querySelector('#dial-motion-value') },
    space: { knob: document.querySelector('#dial-space'), value: document.querySelector('#dial-space-value') },
    light: { knob: document.querySelector('#dial-light'), value: document.querySelector('#dial-light-value') },
  },
  metrics: {
    warmth: { value: document.querySelector('#warmth-value'), bar: document.querySelector('#warmth-bar') },
    motion: { value: document.querySelector('#motion-value'), bar: document.querySelector('#motion-bar') },
    light: { value: document.querySelector('#light-value'), bar: document.querySelector('#light-bar') },
    space: { value: document.querySelector('#space-value'), bar: document.querySelector('#space-bar') },
  },
};

const engine = new MusicEngine();
let recordingUrl;
const recording = new MusicRecorder((blob, extension) => {
  if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  recordingUrl = URL.createObjectURL(blob);
  const link = document.querySelector('#record-save');
  link.href = recordingUrl;
  link.download = `textusic-${Date.now()}.${extension}`;
  link.hidden = false;
  document.querySelector('#record-status').textContent = '녹음 완료 · 파일 저장을 눌러주세요';
  document.querySelector('#record-button').textContent = '● 음악 녹음';
}, (status) => {
  document.querySelector('#record-status').textContent = status;
  document.querySelector('#record-button').textContent = recording.active ? '■ 녹음 끝내기' : '● 음악 녹음';
});
engine.onOutput = (output) => recording.connect(output);
let variation = 0;
let analysis = analyzeText(elements.sentence.value, variation);
analysis.syntax = addMeaningLinks(analyzeSyntax(elements.sentence.value));
const beat = { mode: 'auto', intensity: 0.55 };
const initialArrangement = createArrangement(analysis, beat);
analysis.bpm = initialArrangement.bpm;
analysis.scale = initialArrangement.scale;
let code = createStrudelCode(analysis, beat);
const visualizer = new Visualizer(elements.canvas, analysis);
let updateTimer;
let audioTask = null;
let audioRevision = 0;
let autoPlayEnabled = true;
let relationFrame;
let composing = false;
let semanticState = { text: '', meanings: {}, similarities: [] };
let semanticReady = false;
function updateSemanticSummary() {
  if (!semanticReady) return;
  const words = analysis.tokenMeanings.filter((word) => word.meaningSource === 'embedding').length;
  const links = analysis.syntax.edges.filter((edge) => edge.type === 'semantic').length;
  document.querySelector('#semantic-summary').textContent = words || links
    ? `AI 해석 · ${words}단어 · ${links}연결` : 'AI 단어 해석 켜짐';
}
const semanticClient = new SemanticClient({
  onResult(text, result) {
    if (composing || text !== elements.sentence.value) return;
    semanticState = { text, ...result };
    analyzeCurrentText({ keepVariation: true, refreshSemantics: false });
    if (autoPlayEnabled && engine.playing) applyLatestAudio();
  },
  onStatus(status, progress) {
    const indicator = document.querySelector('#semantic-indicator');
    const justReady = status === 'ready' && !semanticReady;
    semanticReady = status === 'ready';
    indicator.dataset.state = status;
    document.querySelector('#semantic-enabled').checked = semanticReady;
    document.querySelector('#semantic-enabled').indeterminate = status === 'loading';
    document.querySelector('#semantic-summary').textContent = status === 'loading' ? 'AI 단어 해석 · 준비 중'
      : status === 'error' ? 'AI 해석 재시도' : 'AI 단어 해석';
    updateSemanticSummary();
    if (justReady && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      indicator.animate([{ boxShadow: '0 0 0 0 #779b8555' }, { boxShadow: '0 0 0 9px #779b8500' }], { duration: 1100 });
    }
    document.querySelector('#semantic-status').textContent = status === 'ready' ? 'AI 단어 해석 사용 중 · 이 기기에서 처리'
      : status === 'loading' ? '모델 다운로드 · 기기 내 준비 중'
      : status === 'error' ? '모델 사용 불가 · 사전 모드로 계속' : '사전 모드';
    renderSemanticDetails();
    if (status === 'error') {
      document.querySelector('#semantic-enabled').checked = false;
      semanticState = { text: '', meanings: {}, similarities: [] };
      if (!composing) {
        analyzeCurrentText({ keepVariation: true, refreshSemantics: false });
        if (autoPlayEnabled && engine.playing) applyLatestAudio();
      }
    }
  },
});

function syncEditorLayout() {
  const input = elements.sentence;
  const compact = document.documentElement.classList.contains('compact-viewport');
  const preferred = editorFontSize(input.value, window.innerWidth, compact);
  const previousScroll = input.scrollTop;
  input.style.height = '0px';
  const style = getComputedStyle(input);
  const size = fitEditorFont(preferred, parseFloat(style.maxHeight), (candidate) => {
    input.parentElement.style.setProperty('--editor-font-size', `${candidate}px`);
    return input.scrollHeight;
  });
  input.parentElement.style.setProperty('--editor-font-size', `${size}px`);
  input.style.height = `${Math.min(parseFloat(style.maxHeight), Math.max(parseFloat(style.minHeight), input.scrollHeight))}px`;
  input.style.overflowY = input.scrollHeight > input.clientHeight ? 'auto' : 'hidden';
  input.scrollTop = previousScroll;
  const mirror = elements.sentenceHighlight;
  mirror.style.width = `${input.clientWidth}px`;
  mirror.style.height = `${input.clientHeight}px`;
  mirror.style.left = `${input.offsetLeft}px`;
  mirror.style.top = `${input.offsetTop}px`;
  mirror.scrollTop = input.scrollTop;
  mirror.scrollLeft = input.scrollLeft;
}

function scheduleRelations() {
  cancelAnimationFrame(relationFrame);
  relationFrame = requestAnimationFrame(() => {
    elements.sentenceHighlight.scrollTop = elements.sentence.scrollTop;
    renderRelations([...elements.sentenceHighlight.querySelectorAll('.word-token')]);
  });
}

function metricNumber(value) {
  return Math.round(value * 100);
}

function renderAnalysis() {
  const hasText = Boolean(elements.sentence.value.trim());
  const patch = createModularPatch(analysis);
  document.querySelector('#reading-sentence').textContent = hasText ? elements.sentence.value : '아직 발견한 문장이 없어요.';
  document.querySelector('#reading-meta').textContent = hasText ? `${analysis.tokens.length} WORDS · ${patch.modules.length} MODULES · ${analysis.bpm} BPM` : '문장을 입력하면 소리의 구성이 여기에 나타납니다.';
  const patches = document.querySelector('#reading-patches');
  patches.replaceChildren();
  const descriptions = hasText ? patchDescriptions(patch) : [];
  for (const label of descriptions.length ? descriptions : ['문장이 이어지면 모듈 사이의 연결이 나타납니다.']) {
    const row = document.createElement('p');
    row.className = descriptions.length ? 'reading-patch-row' : 'reading-empty';
    row.textContent = label;
    patches.append(row);
  }
  const labels = elements.sentence.value.trim() ? analysis.concepts.slice(0, 3).map((concept) => concept.label) : [];
  elements.visualTitle.textContent = labels.join(' · ') || '—';
  elements.keywordList.innerHTML = '';

  for (const [index, concept] of (hasText ? analysis.concepts : []).entries()) {
    const profile = visualProfileFor(concept.id);
    const item = document.createElement('span');
    item.className = 'keyword';
    item.style.setProperty('--delay', `${index * 45}ms`);
    item.style.setProperty('--keyword-color', profile.color);
    item.style.setProperty('--keyword-accent', profile.accent);
    item.textContent = concept.label;
    elements.keywordList.appendChild(item);
  }

  const semanticProfiles = analysis.concepts.slice(0, 3).map((item) => visualProfileFor(item.id));
  if (semanticProfiles[0]) elements.canvas.parentElement.style.setProperty('--semantic-primary', semanticProfiles[0].color);
  if (semanticProfiles[1]) elements.canvas.parentElement.style.setProperty('--semantic-secondary', semanticProfiles[1].color);

  for (const [axis, parts] of Object.entries(elements.metrics)) {
    const value = metricNumber(analysis.axes[axis]);
    parts.value.textContent = hasText ? String(value).padStart(2, '0') : '—';
    parts.bar.style.width = `${hasText ? value : 0}%`;
  }

  for (const [axis, parts] of Object.entries(elements.dials)) {
    const value = metricNumber(analysis.axes[axis]);
    parts.value.textContent = String(value).padStart(2, '0');
    parts.knob.style.setProperty('--dial-angle', `${-135 + value * 2.7}deg`);
  }

  elements.translationNote.textContent = hasText ? describeAnalysis(analysis) : '입력한 단어의 심상과 관계를 음악으로 해석합니다.';
  elements.farWords.textContent = hasText ? analysis.layers.farTokens.join(' · ') || '—' : '—';
  elements.nearWords.textContent = hasText ? analysis.layers.nearTokens.join(' · ') || '—' : '—';
  elements.code.textContent = hasText ? formatFullCode(code) : '// 문장을 기다리는 중';
  renderLiveCode(document.querySelector('#live-code'), elements.sentence.value.trim() ? code : '');
  document.querySelector('#code-state').textContent = elements.sentence.value.trim() ? (autoPlayEnabled ? '입력 반영 중' : '코드 준비됨') : '대기';
  renderWordHighlight();
  updateSemanticSummary();
  renderSemanticDetails();
  visualizer.setAnalysis(analysis);
}

function renderSemanticDetails() {
  const state = document.querySelector('#semantic-indicator').dataset.state;
  const hasText = Boolean(elements.sentence.value.trim());
  const unavailable = state === 'loading' ? 'AI 준비가 끝나면 이 문장의 해석을 보여드릴게요.' : 'AI 단어 해석을 켜면 추가 해석과 유사어 연결을 확인할 수 있어요.';
  document.querySelector('#semantic-detail-status').textContent = state === 'loading'
    ? 'AI 모델 준비 중 · 기본 음악은 계속 사용할 수 있어요.'
    : state === 'error' ? '준비하지 못했어요. 기본 사전으로 연주합니다.'
    : semanticReady ? 'AI 해석 사용 중' : '기본 사전으로 연주 중';
  document.querySelector('#semantic-toggle').textContent = state === 'loading' ? '준비 취소' : semanticReady ? 'AI 해석 끄기' : 'AI 해석 켜기';
  const render = (selector, rows, empty) => {
    const host = document.querySelector(selector);
    host.replaceChildren();
    if (!rows.length) { const p = document.createElement('p'); p.className = 'reading-empty'; p.textContent = empty; host.append(p); }
    for (const [title, detail] of rows) {
      const row = document.createElement('div'); row.className = 'semantic-result';
      const heading = document.createElement('strong'); heading.textContent = title;
      const description = document.createElement('p'); description.textContent = detail;
      row.append(heading, description); host.append(row);
    }
  };
  render('#semantic-words', hasText ? musicInsights(analysis, beat) : [], '문장을 입력하면 분위기·악기·연결이 어떻게 정해졌는지 알려드릴게요.');
  const patch = createModularPatch(analysis);
  const links = hasText && semanticReady ? analysis.syntax.edges.filter((edge) => edge.type === 'semantic') : [];
  render('#semantic-links', links.map((edge) => {
    const a = analysis.syntax.words[edge.from]?.token, b = analysis.syntax.words[edge.to]?.token;
    const cable = patch.cables.find((item) => !item.normalled && ((item.from === edge.from && item.to === edge.to) || (item.to === edge.from && item.from === edge.to)));
    const similarity = semanticState.similarities.find((item) => (item.a === a && item.b === b) || (item.a === b && item.b === a));
    const score = similarity ? `유사도 ${similarity.score.toFixed(2)} · ` : '';
    return [`${a} ↔ ${b}`, score + (cable ? `M${cable.source + 1}의 LFO가 M${cable.target + 1}의 필터를 움직입니다.` : '관계 밀도에 반영되며, 응답 선율의 연결 후보로 사용됩니다.')];
  }), !hasText ? '바다 ocean처럼 비슷한 뜻의 단어를 함께 써보세요.' : !semanticReady ? unavailable : '아직 추가된 유사어 연결이 없어요. 반복어·문법 연결은 별도로 동작합니다.');
}

function renderWordHighlight() {
  const host = elements.sentenceHighlight;
  const text = elements.sentence.value;
  const tokenRegex = /[가-힣ㄱ-ㅎㅏ-ㅣ\u1100-\u11ffa-z0-9]+/giu;
  const tokens = new Map(analysis.tokenMeanings.map((meaning) => [meaning.token, meaning]));
  host.replaceChildren();
  let cursor = 0;
  let tokenIndex = 0;
  for (const match of text.matchAll(tokenRegex)) {
    const start = match.index;
    if (start > cursor) host.append(document.createTextNode(text.slice(cursor, start)));
    const word = document.createElement('span');
    const rawToken = match[0].toLowerCase();
    // Keep the last committed word's visual identity while the IME builds syllables.
    const committed = composing ? analysis.tokenMeanings[tokenIndex] : null;
    const meaning = tokens.get(rawToken) ?? committed ?? { token: rawToken, primaryConcept: 'unique', layer: 'near', traits: {} };
    const profile = visualProfileForToken(meaning?.primaryConcept, meaning?.token ?? match[0], meaning?.traits);
    word.className = 'word-token';
    word.dataset.meaningSource = meaning.meaningSource ?? 'phonetic';
    word.dataset.effect = profile.effect;
    word.dataset.layer = meaning?.layer ?? 'near';
    word.dataset.token = meaning.token;
    const role = analysis.syntax.words[tokenIndex]?.role ?? 'word';
    word.dataset.role = role;
    word.style.setProperty('--word-color', profile.color);
    word.style.setProperty('--word-accent', profile.accent);
    word.style.setProperty('--word-glow', `${Math.round(5 + ((meaning.traits.light ?? 0) + 0.4) * 18)}px`);
    word.style.setProperty('--word-speed', `${(2.9 - Math.max(0, meaning.traits.motion ?? 0) * 2.1).toFixed(2)}s`);
    word.style.setProperty('--word-delay', `${-(tokenIndex % 7) * 0.23}s`);
    word.textContent = match[0];
    host.append(word);
    cursor = start + match[0].length;
    tokenIndex += 1;
  }
  if (cursor < text.length) host.append(document.createTextNode(text.slice(cursor)));
  if (!text || text.endsWith('\n')) host.append(document.createTextNode('\u200b'));
  syncEditorLayout();
  scheduleRelations();
}


function renderRelations(wordNodes) {
  const svg = elements.relationLines;
  const rect = svg.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  svg.replaceChildren();
  if (wordNodes.length < 2) return;
  const patch = createModularPatch(analysis);
  const sources = [...analysis.syntax.edges.filter((edge) => analysis.syntax.words[edge.from]?.sentence === analysis.syntax.words[edge.to]?.sentence),
    ...patch.cables.map((cable) => ({ ...cable, type:'patch', provisional:cable.normalled }))];
  for (const { from, to, provisional, type, kind, source, target } of sources) {
    if (!wordNodes[from]?.isConnected || !wordNodes[to]?.isConnected) continue;
    const a = wordNodes[from].getClientRects()[0] ?? wordNodes[from].getBoundingClientRect();
    const b = wordNodes[to].getClientRects()[0] ?? wordNodes[to].getBoundingClientRect();
    const x1 = a.left + a.width / 2 - rect.left;
    const x2 = b.left + b.width / 2 - rect.left;
    const y1 = a.top + a.height / 2 - rect.top;
    const y2 = b.top + b.height / 2 - rect.top;
    const distance = Math.abs(x2 - x1);
    const lift = Math.max(8, Math.min(y1, y2) - Math.min(18, 7 + distance * .035));
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${lift} ${x2} ${y2}`);
    if (type === 'shared-subject' && Math.abs(y2 - y1) > 20) {
      const bend = Math.max(8, Math.min(x1, x2) - 24 - (to % 3) * 7);
      path.setAttribute('d', `M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}`);
    }
    path.setAttribute('class', 'relation-path');
    if (type === 'patch') {
      path.classList.add('is-patch');
      path.dataset.signal = kind;
      path.dataset.source = `M${source + 1}`;
      path.dataset.target = `M${target + 1}`;
      const bend = Math.max(5, Math.min(x1, x2) - 16 - (target % 3) * 6);
      if (Math.abs(y2 - y1) > 20) path.setAttribute('d', `M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}`);
    }
    if (type === 'semantic' || type === 'repetition') path.classList.add(`is-${type}`);
    if (type === 'shared-subject') path.classList.add('is-shared');
    if (provisional) path.classList.add('is-provisional');
    svg.append(path);
    for (const [x, y] of [[x1, y1], [x2, y2]]) {
      const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      point.setAttribute('cx', x);
      point.setAttribute('cy', y);
      point.setAttribute('r', '1.6');
      point.setAttribute('class', 'relation-point');
      svg.append(point);
    }
  }
}

function analyzeCurrentText({ keepVariation = false, refreshSemantics = true } = {}) {
  if (!keepVariation) variation = 0;
  const text = elements.sentence.value;
  analysis = analyzeText(text, variation, semanticClient.enabled ? semanticState.meanings : {});
  analysis.syntax = addMeaningLinks(analyzeSyntax(text), semanticClient.enabled && semanticState.text === text ? semanticState.similarities : []);
  const arrangement = createArrangement(analysis, beat);
  analysis.bpm = arrangement.bpm;
  analysis.scale = arrangement.scale;
  code = createStrudelCode(analysis, beat);
  renderAnalysis();
  if (refreshSemantics) semanticClient.request(text, analysis.tokens);
}

function updatePlaybackStatus() {
  elements.playButton.classList.toggle('is-playing', engine.playing);
  elements.actionLabel.textContent = engine.playing ? '소리 멈추기' : '문장을 연주하기';
  elements.engineLabel.textContent = engine.playing ? 'sound awake' : 'sound asleep';
  document.querySelector('#code-state').textContent = engine.playing ? '연주 중' : '대기';
}

function stopPlayback(message = '연주를 멈췄어요. 문장을 바꾸거나 다시 시작해보세요.') {
  window.clearTimeout(updateTimer);
  autoPlayEnabled = false;
  audioRevision += 1;
  engine.stop();
  recording.stop();
  visualizer.setPlaying(false);
  updatePlaybackStatus();
  elements.status.textContent = message;
}

async function applyLatestAudio() {
  if (!elements.sentence.value.trim()) return;
  if (audioTask) return audioTask;
  const revision = audioRevision;
  let appliedCode = '';
  audioTask = (async () => {
    do {
      appliedCode = code;
      await engine.play(appliedCode);
      if (revision !== audioRevision || !autoPlayEnabled) return;
    } while (appliedCode !== code);
    if (!visualizer.playing) visualizer.setPlaying(true);
    updatePlaybackStatus();
    elements.status.textContent = `${analysis.root} ${analysis.scale.replace(':', ' ')} · ${analysis.bpm} BPM · 단어의 결을 따라 연주 중`;
  })()
    .catch((error) => {
      console.error(error);
      if (revision === audioRevision) {
        autoPlayEnabled = false;
        elements.status.textContent = '소리가 준비되지 않았어요. 문장을 한 번 더 눌러 시작해보세요.';
        engine.stop();
      }
    })
    .finally(() => {
      audioTask = null;
      updatePlaybackStatus();
      if (autoPlayEnabled && appliedCode !== code && !engine.playing) applyLatestAudio();
    });
  return audioTask;
}

async function playCurrent() {
  if (!elements.sentence.value.trim()) { elements.sentence.focus(); return; }
  if (engine.playing || audioTask) {
    stopPlayback();
    return;
  }

  autoPlayEnabled = true;
  audioRevision += 1;
  analyzeCurrentText({ keepVariation: true });
  elements.actionLabel.textContent = '소리 멈추기';
  elements.status.textContent = '문장의 첫 소리를 찾고 있어요…';
  await applyLatestAudio();
}

async function createVariation() {
  variation += 1;
  analyzeCurrentText({ keepVariation: true });
  elements.status.textContent = `같은 문장에서 ${variation + 1}번째 우연을 발견했어요.`;
  if (engine.playing) {
    await applyLatestAudio();
  }
}

elements.sentence.addEventListener('focus', () => {
  if (elements.sentence.value.trim() && autoPlayEnabled && !engine.playing && !audioTask) playCurrent();
});

elements.sentence.addEventListener('input', (event) => {
  elements.charCount.textContent = elements.sentence.value.length;
  if (event.isComposing || composing) { renderWordHighlight(); return; }
  analyzeCurrentText();
  if (!elements.sentence.value.trim()) {
    window.clearTimeout(updateTimer);
    stopPlayback('문장을 입력하세요.');
    autoPlayEnabled = true;
    return;
  }
  if (autoPlayEnabled && !engine.playing && !audioTask) playCurrent();
  window.clearTimeout(updateTimer);
  updateTimer = window.setTimeout(() => {
    if (autoPlayEnabled) applyLatestAudio();
  }, 560);
});

elements.sentence.addEventListener('compositionstart', () => {
  semanticClient.invalidate();
  composing = true;
  window.clearTimeout(updateTimer);
  elements.sentence.parentElement.classList.add('is-composing');
});
elements.sentence.addEventListener('compositionend', () => {
  composing = false;
  elements.sentence.parentElement.classList.remove('is-composing');
  elements.sentence.dispatchEvent(new Event('input'));
});

elements.sentence.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    playCurrent();
  }
});

elements.sentence.addEventListener('scroll', () => {
  elements.sentenceHighlight.scrollTop = elements.sentence.scrollTop;
  renderRelations([...elements.sentenceHighlight.querySelectorAll('.word-token')]);
});

elements.playButton.addEventListener('click', playCurrent);
elements.variationButton.addEventListener('click', createVariation);

document.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', () => {
    autoPlayEnabled = true;
    elements.sentence.value = button.dataset.prompt;
    elements.charCount.textContent = elements.sentence.value.length;
    analyzeCurrentText();
    if (engine.playing) applyLatestAudio();
    else playCurrent();
    elements.sentence.focus({ preventScroll: true });
  });
});

document.querySelector('#beat-mode').addEventListener('change', (event) => {
  beat.mode = event.target.value;
  analyzeCurrentText({ keepVariation: true });
  if (engine.playing) applyLatestAudio();
});

document.querySelector('#record-button').addEventListener('click', async (event) => {
  if (recording.active) { recording.stop(); return; }
  if (!elements.sentence.value.trim()) { elements.sentence.focus(); document.querySelector('#record-status').textContent = '먼저 문장을 입력해주세요'; return; }
  event.currentTarget.disabled = true;
  try {
    if (audioTask) await audioTask;
    if (!engine.playing) await playCurrent();
    if (!engine.playing) throw new Error('재생을 시작한 뒤 녹음해주세요.');
    const module = await engine.module;
    recording.start(module.getAudioContext(), module.getSuperdoughAudioController().output.destinationGain);
    document.querySelector('#record-save').hidden = true;
  } catch (error) { document.querySelector('#record-status').textContent = error.message; }
  finally { document.querySelector('#record-button').disabled = false; }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) recording.stop(); });

function setSemanticEnabled(enabled) {
  clearTimeout(semanticStartup);
  try { localStorage.setItem('textusic-semantic-auto', String(enabled)); } catch { /* Storage can be unavailable. */ }
  if (enabled) semanticClient.preload();
  else {
    semanticClient.disable();
    semanticState = { text: '', meanings: {}, similarities: [] };
  }
  analyzeCurrentText({ keepVariation: true });
  if (autoPlayEnabled && engine.playing) applyLatestAudio();
}
document.querySelector('#semantic-enabled').addEventListener('change', (event) => {
  // A pending checkbox represents a cancellable download, not an active model.
  setSemanticEnabled(semanticClient.enabled ? false : event.target.checked);
});
document.querySelector('#semantic-indicator').addEventListener('click', () => {
  renderSemanticDetails();
  document.querySelector('#semantic-dialog').showModal();
});
document.querySelector('#semantic-toggle').addEventListener('click', () => setSemanticEnabled(!semanticClient.enabled));
document.querySelector('#semantic-close').addEventListener('click', () => document.querySelector('#semantic-dialog').close());
document.querySelector('#semantic-dialog').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
document.querySelector('#beat-intensity').addEventListener('input', (event) => {
  beat.intensity = Number(event.target.value) / 100;
  document.querySelector('#beat-value').value = `${event.target.value}%`;
  analyzeCurrentText({ keepVariation: true });
  window.clearTimeout(updateTimer);
  updateTimer = window.setTimeout(() => { if (engine.playing) applyLatestAudio(); }, 100);
});

elements.readingTrigger.addEventListener('click', () => elements.readingDialog.showModal());
document.querySelector('#code-details').addEventListener('click', () => {
  document.querySelector('.code-drawer').open = true;
  elements.readingDialog.showModal();
  elements.code.scrollIntoView({ block: 'center' });
});
elements.readingClose.addEventListener('click', () => elements.readingDialog.close());
elements.readingDialog.addEventListener('click', (event) => {
  if (event.target === elements.readingDialog) elements.readingDialog.close();
});

elements.copyCode.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(code);
    elements.copyCode.textContent = '복사했어요';
    window.setTimeout(() => { elements.copyCode.textContent = '코드 복사'; }, 1300);
  } catch {
    elements.copyCode.textContent = '복사할 수 없어요';
  }
});

window.addEventListener('formyiru:cycle', (event) => {
  elements.cycleValue.textContent = event.detail.toFixed(2).padStart(5, '0');
});

let editorWidth = 0;
new ResizeObserver(([entry]) => {
  if (Math.abs(entry.contentRect.width - editorWidth) < .5) return;
  editorWidth = entry.contentRect.width;
  syncEditorLayout();
  scheduleRelations();
}).observe(elements.sentence.parentElement);
document.fonts.ready.then(() => { syncEditorLayout(); scheduleRelations(); });

// Use the visible viewport, including the space left above a mobile keyboard.
function syncViewport() {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.classList.toggle('compact-viewport', height < 540);
  syncEditorLayout();
  scheduleRelations();
}
window.visualViewport?.addEventListener('resize', syncViewport);
window.addEventListener('resize', syncViewport);
syncViewport();

window.addEventListener('pagehide', () => { clearTimeout(semanticStartup); recording.stop(); engine.stop(); semanticClient.disable(); });

elements.charCount.textContent = elements.sentence.value.length;
elements.lexiconStats.textContent = `${LEXICON_STATS.concepts} imagery groups · ${(LEXICON_STATS.korean + LEXICON_STATS.english).toLocaleString()} ko/en words`;
renderAnalysis();

// Leave the first paint free; inference and model preparation run in a worker.
const semanticStartup = setTimeout(() => {
  let preference;
  try { preference = localStorage.getItem('textusic-semantic-auto'); } catch { /* Use default. */ }
  const connection = navigator.connection;
  if (preference === 'false') return;
  if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) {
    document.querySelector('#semantic-summary').textContent = 'AI 단어 해석 · 다운로드';
    document.querySelector('#semantic-status').textContent = '데이터 절약 중 · 직접 켜서 다운로드';
    return;
  }
  semanticClient.preload();
  if (elements.sentence.value.trim() && !composing) semanticClient.request(elements.sentence.value, analysis.tokens);
}, 1200);
