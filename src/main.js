import './styles.css';
import { analyzeText, describeAnalysis } from './text-analyzer.js';
import { LEXICON_STATS } from './lexicon.js';
import { createStrudelCode, MusicEngine } from './music-engine.js';
import { Visualizer, visualProfileFor, visualProfileForToken } from './visualizer.js';

const elements = {
  sentence: document.querySelector('#sentence'),
  sentenceHighlight: document.querySelector('#sentence-highlight'),
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
let code = createStrudelCode(analysis);
const visualizer = new Visualizer(elements.canvas, analysis);
let updateTimer;
let audioTask = null;
let audioRevision = 0;
let autoPlayEnabled = true;

function metricNumber(value) {
  return Math.round(value * 100);
}

function renderAnalysis() {
  const labels = analysis.concepts.slice(0, 3).map((concept) => concept.label);
  elements.visualTitle.textContent = labels.join(' · ');
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
  renderWordHighlight();
  visualizer.setAnalysis(analysis);
}

function renderWordHighlight() {
  const host = elements.sentenceHighlight;
  const text = elements.sentence.value;
  const tokenRegex = /[가-힣a-z0-9]+/giu;
  const tokens = new Map(analysis.tokenMeanings.map((meaning) => [meaning.token, meaning]));
  host.replaceChildren();
  let cursor = 0;
  let tokenIndex = 0;
  for (const match of text.matchAll(tokenRegex)) {
    const start = match.index;
    if (start > cursor) host.append(document.createTextNode(text.slice(cursor, start)));
    const word = document.createElement('span');
    const rawToken = match[0].toLowerCase();
    const meaning = tokens.get(rawToken) ?? { token: rawToken, primaryConcept: 'unique', layer: 'near', traits: {} };
    const profile = visualProfileForToken(meaning?.primaryConcept, meaning?.token ?? match[0]);
    word.className = 'word-token';
    word.dataset.effect = profile.effect;
    word.dataset.layer = meaning?.layer ?? 'near';
    word.dataset.token = meaning.token;
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
  if (!text) host.append(document.createTextNode(' '));
}

function analyzeCurrentText({ keepVariation = false } = {}) {
  if (!keepVariation) variation = 0;
  analysis = analyzeText(elements.sentence.value, variation);
  code = createStrudelCode(analysis);
  renderAnalysis();
}

function updatePlaybackStatus() {
  elements.playButton.classList.toggle('is-playing', engine.playing);
  elements.actionLabel.textContent = engine.playing ? '소리 멈추기' : '문장을 연주하기';
  elements.engineLabel.textContent = engine.playing ? 'sound awake' : 'sound asleep';
}

function stopPlayback(message = '연주를 멈췄어요. 문장을 바꾸거나 다시 시작해보세요.') {
  autoPlayEnabled = false;
  audioRevision += 1;
  engine.stop();
  visualizer.setPlaying(false);
  updatePlaybackStatus();
  elements.status.textContent = message;
}

async function applyLatestAudio() {
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
  if (engine.playing || audioTask) {
    stopPlayback();
    return;
  }

  autoPlayEnabled = true;
  audioRevision += 1;
  analyzeCurrentText({ keepVariation: true });
  elements.playButton.disabled = true;
  elements.status.textContent = '문장의 첫 소리를 찾고 있어요…';
  await applyLatestAudio();
  elements.playButton.disabled = false;
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
  if (autoPlayEnabled && !engine.playing && !audioTask) playCurrent();
});

elements.sentence.addEventListener('input', () => {
  elements.charCount.textContent = elements.sentence.value.length;
  analyzeCurrentText();
  if (autoPlayEnabled && !engine.playing && !audioTask) playCurrent();
  window.clearTimeout(updateTimer);
  updateTimer = window.setTimeout(() => {
    if (autoPlayEnabled) applyLatestAudio();
  }, 140);
});

elements.sentence.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    playCurrent();
  }
});

elements.playButton.addEventListener('click', playCurrent);
elements.variationButton.addEventListener('click', createVariation);

document.querySelectorAll('.prompt-chip').forEach((button) => {
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

elements.readingTrigger.addEventListener('click', () => elements.readingDialog.showModal());
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

window.addEventListener('pagehide', () => engine.stop());

elements.charCount.textContent = elements.sentence.value.length;
elements.lexiconStats.textContent = `${LEXICON_STATS.concepts} imagery groups · ${(LEXICON_STATS.korean + LEXICON_STATS.english).toLocaleString()} ko/en words`;
renderAnalysis();
