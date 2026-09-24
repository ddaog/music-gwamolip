import './styles.css';
import { SemanticClient } from './semantic-client.js';
import { addMeaningLinks } from './meaning-links.js';
import { editorFontSize } from './editor-layout.js';
import { analyzeSyntax } from './syntax.js';
import { renderLiveCode } from './live-code.js';
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
const semanticClient = new SemanticClient({
  onResult(text, result) {
    if (composing || text !== elements.sentence.value) return;
    semanticState = { text, ...result };
    analyzeCurrentText({ keepVariation: true, refreshSemantics: false });
    if (autoPlayEnabled && engine.playing) applyLatestAudio();
  },
  onStatus(status, progress) {
    document.querySelector('#semantic-status').textContent = status === 'ready' ? '의미 연결 준비됨'
      : status === 'loading' ? `모델 준비 중${progress === undefined ? '' : ` · ${progress}%`}`
      : status === 'error' ? '모델 사용 불가 · 사전 모드로 계속' : '사전 모드';
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
  input.parentElement.style.setProperty('--editor-font-size', `${editorFontSize(input.value, window.innerWidth, compact)}px`);
  const previousScroll = input.scrollTop;
  input.style.height = '0px';
  const style = getComputedStyle(input);
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
  const labels = elements.sentence.value.trim() ? analysis.concepts.slice(0, 3).map((concept) => concept.label) : [];
  elements.visualTitle.textContent = labels.join(' · ') || '—';
  elements.keywordList.innerHTML = '';

  for (const [index, concept] of analysis.concepts.entries()) {
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
    parts.value.textContent = String(value).padStart(2, '0');
    parts.bar.style.width = `${value}%`;
  }

  for (const [axis, parts] of Object.entries(elements.dials)) {
    const value = metricNumber(analysis.axes[axis]);
    parts.value.textContent = String(value).padStart(2, '0');
    parts.knob.style.setProperty('--dial-angle', `${-135 + value * 2.7}deg`);
  }

  elements.translationNote.textContent = describeAnalysis(analysis);
  elements.farWords.textContent = analysis.layers.farTokens.join(' · ');
  elements.nearWords.textContent = analysis.layers.nearTokens.join(' · ');
  elements.code.textContent = code;
  renderLiveCode(document.querySelector('#live-code'), elements.sentence.value.trim() ? code : '');
  document.querySelector('#code-state').textContent = elements.sentence.value.trim() ? (autoPlayEnabled ? '입력 반영 중' : '코드 준비됨') : '대기';
  renderWordHighlight();
  visualizer.setAnalysis(analysis);
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
  const sources = analysis.syntax.edges;
  for (const { from, to, provisional, type } of sources) {
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

document.querySelector('#semantic-enabled').addEventListener('change', (event) => {
  if (event.target.checked) semanticClient.enable();
  else {
    semanticClient.disable();
    semanticState = { text: '', meanings: {}, similarities: [] };
  }
  analyzeCurrentText({ keepVariation: true });
  if (autoPlayEnabled && engine.playing) applyLatestAudio();
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

window.addEventListener('pagehide', () => { engine.stop(); semanticClient.disable(); });

elements.charCount.textContent = elements.sentence.value.length;
elements.lexiconStats.textContent = `${LEXICON_STATS.concepts} imagery groups · ${(LEXICON_STATS.korean + LEXICON_STATS.english).toLocaleString()} ko/en words`;
renderAnalysis();
