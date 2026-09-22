const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function take(values, count) {
  const result = [];
  for (let index = 0; index < count; index += 1) result.push(values[index % values.length]);
  return result;
}

function melodyNotation(analysis) {
  const notes = take(analysis.layers.nearDegrees, 8);
  if (analysis.density > 0.72) {
    notes[2] = `[${notes[2]} ${analysis.degrees[8] ?? '4'}]`;
    notes[6] = `[${notes[6]} ${analysis.degrees[9] ?? '2'}]`;
  }
  return notes.join(' ');
}

function bassNotation(analysis) {
  const usable = analysis.layers.farDegrees.filter((degree) => degree !== '~');
  const first = usable[0] ?? '0';
  const second = usable[2] ?? '3';
  const third = usable[4] ?? '4';
  return `${first} ~ ${first} ~ ${second} ~ ${third} ~`;
}

export function createStrudelCode(analysis) {
  const scale = `${analysis.root}4:${analysis.scale}`;
  const bassScale = `${analysis.root}2:${analysis.scale}`;
  const melody = melodyNotation(analysis);
  const bass = bassNotation(analysis);
  const farNotes = take(analysis.layers.farDegrees, 4).map((degree) => Number(degree) || 0);
  const pad = farNotes.map((degree) => `[${degree},${degree + 2},${degree + 4}]`).join(' ');
  const cpm = (analysis.bpm / 4).toFixed(2);
  const cutoff = Math.round(700 + analysis.axes.light * 2600 + analysis.axes.motion * 500);
  const room = clamp(0.2 + analysis.axes.space * 0.5, 0.2, 0.72).toFixed(2);
  const delay = clamp(0.08 + analysis.axes.softness * 0.24, 0.08, 0.34).toFixed(2);
  const attack = clamp(0.01 + analysis.axes.softness * 0.12, 0.01, 0.14).toFixed(2);
  const conceptIds = new Set(analysis.concepts.map((concept) => concept.id));
  const melodySound = conceptIds.has('city') || conceptIds.has('machine')
    ? 'square'
    : conceptIds.has('fire') || conceptIds.has('anger')
      ? 'sawtooth'
    : analysis.axes.softness > 0.62
      ? 'sine'
      : 'triangle';
  const padSound = analysis.axes.tension > 0.48 ? 'sawtooth' : 'triangle';
  const sparkleGain = clamp(0.05 + analysis.axes.light * 0.08, 0.05, 0.13).toFixed(2);
  const hatPattern = analysis.axes.motion > 0.66 ? 'white*8' : 'white ~ white ~';
  const words = analysis.tokens.length;
  const syntax = analysis.syntax ?? {};
  const ramp = (start, span) => {
    const progress = clamp((words - start) / span, 0, 1);
    return (progress * progress * (3 - 2 * progress)).toFixed(2);
  };
  const padGain = (0.025 + Number(ramp(1, 6)) * 0.13 + Math.min(syntax.adjective ?? 0, 3) * 0.008).toFixed(2);
  const bassGain = (0.035 + Number(ramp(2, 6)) * 0.245 + Math.min(syntax.object ?? 0, 3) * 0.012).toFixed(2);
  const sparkleGainLayer = (Number(sparkleGain) * Number(ramp(2, 7))).toFixed(2);
  const rhythmGain = (0.012 + Number(ramp(3, 8)) * 0.055 + Math.min(syntax.adverb ?? 0, 3) * 0.006).toFixed(2);
  const melodyGain = (0.18 + Number(ramp(1, 8)) * 0.2 + Math.min(syntax.predicate ?? 0, 2) * 0.018).toFixed(2);

  return `setcpm(${cpm})

stack(
  n("${melody}")
    .scale("${scale}")
    .s("${melodySound}")
    .lpf(${cutoff})
    .attack(${attack}).decay(.24).sustain(.18).release(.42)
    .room(${room}).delay(${delay}).delaytime(.25).delayfeedback(.28)
    .gain(${melodyGain}),

  n("<${pad}>")
    .scale("${scale}")
    .s("${padSound}")
    .lpf(${Math.round(cutoff * 0.46)})
    .attack(.38).decay(.5).sustain(.36).release(.9)
    .room(${Math.min(0.8, Number(room) + 0.12).toFixed(2)})
    .gain(${padGain}),

  n("${bass}")
    .scale("${bassScale}")
    .s("sine")
    .lpf(520).attack(.03).decay(.32).sustain(.08).release(.2)
    .gain(${bassGain}),

  n("<${take(analysis.layers.nearDegrees, 4).join(' ~ ')} ~>")
    .scale("${scale}")
    .s("sine")
    .attack(.01).decay(.12).sustain(0).release(.18)
    .room(.68).delay(.22).gain(${sparkleGainLayer}),

  note("${analysis.root}1 ~ ~ ${analysis.root}1")
    .s("sine")
    .penv(22).pdecay(.07)
    .decay(.16).sustain(0).gain(${(0.025 + Number(ramp(4, 8)) * 0.19).toFixed(2)}),

  s("${hatPattern}")
    .hpf(${Math.round(4700 + analysis.axes.light * 2500)})
    .decay(.035).sustain(0).room(.12).gain(${rhythmGain})
)`;
}

export class MusicEngine {
  constructor() {
    this.ready = false;
    this.initializing = null;
    this.playing = false;
    this.module = import('@strudel/web');
  }

  async init() {
    if (this.ready) return;
    if (!this.initializing) {
      this.initializing = this.module
        .then(({ initStrudel }) => initStrudel())
        .then(() => {
          this.ready = true;
        });
    }
    await this.initializing;
  }

  async play(code) {
    await this.init();
    if (typeof globalThis.evaluate !== 'function') {
      throw new Error('Strudel evaluate 함수를 불러오지 못했습니다.');
    }
    await globalThis.evaluate(code);
    this.playing = true;
  }

  stop() {
    if (typeof globalThis.hush === 'function') globalThis.hush();
    this.playing = false;
  }
}
