const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const ramp = (value) => { const x = clamp(value, 0, 1); return x * x * (3 - 2 * x); };

// All voices share this four-bar harmony; adding words keeps the motif and key.
export function createArrangement(analysis, beat = {}) {
  const count = analysis.tokens.length;
  const richness = ramp((count - 1) / 10);
  const anchor = analysis.tokenMeanings[0]?.conceptIds ?? [];
  const minor = anchor.some((id) => ['moon', 'darkness', 'dream', 'sadness', 'fear'].includes(id));
  const scale = minor ? 'minor' : 'major';
  const chords = [0, 5, 3, 4];
  const contour = [0, 2, 4, 2, 6, 4, 2, 0];
  const rotation = analysis.seed % 3;
  const modifiers = analysis.syntax?.edges?.filter((edge) => edge.type === 'modifier').length ?? 0;
  const active = count < 3 ? [0, 4] : count < 6 ? [0, 2, 4, 6] : [0, 1, 2, 4, 5, 6];
  const melody = chords.map((root) => contour.map((_, step) => {
    if (!active.includes(step)) return '~';
    if (analysis.punctuation > 1 && step === 6) return '~';
    const tone = contour[(step + rotation * 2) % contour.length];
    return String(root + tone);
  }).join(' '));
  const mode = beat.mode ?? 'auto';
  const intensity = clamp(beat.intensity ?? 0.55, 0, 1);
  const drums = mode === 'off' ? 0 : intensity * (mode === 'on' ? 1 : ramp((count - 2) / 8));
  return {
    scale, chords, melody, richness, drums,
    bpm: Math.round(clamp(76 + analysis.axes.motion * 30, 76, 108) / 2) * 2,
    padGain: 0.012 + richness * 0.06,
    bassGain: 0.02 + richness * 0.15,
    melodyGain: 0.13 + richness * 0.05,
    sparkleGain: richness * (0.012 + Math.min(modifiers, 4) * 0.004),
  };
}

export function createStrudelCode(analysis, beat = {}) {
  const arrangement = createArrangement(analysis, beat);
  const { chords, melody, richness, drums } = arrangement;
  const scale = analysis.root + '4:' + arrangement.scale;
  const bassScale = analysis.root + '2:' + arrangement.scale;
  const padScale = analysis.root + '3:' + arrangement.scale;
  const alternate = (bars) => '<' + bars.map((bar) => '[' + bar + ']').join(' ') + '>';
  const cutoff = Math.round(850 + analysis.axes.light * 1500);
  const room = (0.24 + analysis.axes.space * 0.28).toFixed(2);
  const attack = (0.025 + analysis.axes.softness * 0.09).toFixed(3);
  const gain = (value) => value.toFixed(3);
  const chordPattern = '<' + chords.map((root) => '[' + [root, root + 2, root + 4, root + 6].join(',') + ']').join(' ') + '>';
  const bass = alternate(chords.map((root) => root + ' ~ ~ ~ ' + root + ' ~ ' + (richness > 0.65 ? root + 4 : '~') + ' ~'));
  const parts = [
    'n("' + alternate(melody) + '").scale("' + scale + '").s("triangle").lpf(' + cutoff + ').attack(' + attack + ').decay(.22).sustain(.12).release(.35).room(' + room + ').delay(.12).delaytime(.375).delayfeedback(.22).gain(' + gain(arrangement.melodyGain) + ')',
    'n("' + chordPattern + '").scale("' + padScale + '").s("triangle").lpf(950).attack(.5).decay(.4).sustain(.28).release(.65).room(' + room + ').gain(' + gain(arrangement.padGain) + ')',
    'n("' + bass + '").scale("' + bassScale + '").s("sine").lpf(430).attack(.015).decay(.24).sustain(.1).release(.12).gain(' + gain(arrangement.bassGain) + ')',
    'n("' + alternate(chords.map((root) => '~ ~ ' + (root + 11) + ' ~ ~ ~ ' + (root + 9) + ' ~')) + '").scale("' + scale + '").s("sine").attack(.01).decay(.1).sustain(0).release(.18).room(.4).gain(' + gain(arrangement.sparkleGain) + ')',
  ];
  if (drums > 0) {
    parts.push(
      'note("c1 ~ ~ ~ c1 ~ ~ ~").s("sine").penv(28).pdecay(.045).attack(.002).decay(.14).sustain(0).release(.035).gain(' + gain(drums * .34) + ')',
      's("~ ~ white ~ ~ ~ white ~").hpf(1300).lpf(6500).attack(.002).decay(.095).sustain(0).release(.025).room(.08).gain(' + gain(drums * .095) + ')',
      's("' + (richness > .65 ? 'white*8' : '~ white ~ white ~ white ~ white') + '").hpf(7200).attack(.001).decay(.025).sustain(0).release(.015).gain(' + gain(drums * .038) + ')',
    );
  }
  return 'setcpm(' + (arrangement.bpm / 4).toFixed(2) + ')\n\nstack(\n  ' + parts.join(',\n  ') + '\n)';
}

export class MusicEngine {
  constructor() {
    this.ready = false;
    this.initializing = null;
    this.playing = false;
    this.revision = 0;
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
    const revision = ++this.revision;
    await this.init();
    if (revision !== this.revision) return;
    if (typeof globalThis.evaluate !== 'function') {
      throw new Error('Strudel evaluate 함수를 불러오지 못했습니다.');
    }
    await globalThis.evaluate(code);
    if (revision !== this.revision) { this.stop(); return; }
    this.playing = true;
  }

  stop() {
    this.revision += 1;
    if (typeof globalThis.hush === 'function') globalThis.hush();
    this.playing = false;
  }
}
