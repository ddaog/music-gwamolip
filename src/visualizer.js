const TAU = Math.PI * 2;
const COLORS = {
  red: '#ef5b53',
  green: '#63c53e',
  blue: '#4b8cde',
  ink: '#e6e7e3',
  paper: '#4f5355',
  grid: 'rgba(54, 58, 60, 0.17)',
};

const VISUAL_PROFILES = {
  light:     { color: '#ffd76a', accent: '#fff2bd', effect: 'spark', shape: 'diamond' },
  darkness:  { color: '#69627f', accent: '#a29ab8', effect: 'veil', shape: 'circle' },
  sun:       { color: '#ff9e42', accent: '#ffe071', effect: 'ray', shape: 'diamond' },
  moon:      { color: '#9db8ff', accent: '#e1e8ff', effect: 'orbit', shape: 'circle' },
  dawn:      { color: '#ee87a7', accent: '#ffc28a', effect: 'haze', shape: 'circle' },
  water:     { color: '#39bfc7', accent: '#8ce8df', effect: 'ripple', shape: 'circle' },
  rain:      { color: '#668ad8', accent: '#a9c7ff', effect: 'rain', shape: 'dash' },
  ice:       { color: '#b8edff', accent: '#f0fbff', effect: 'snow', shape: 'diamond' },
  sky:       { color: '#64a8ec', accent: '#b9ddff', effect: 'haze', shape: 'circle' },
  wind:      { color: '#9edbc9', accent: '#d7f5e9', effect: 'wind', shape: 'dash' },
  forest:    { color: '#55b85b', accent: '#a7dc77', effect: 'leaf', shape: 'leaf' },
  flower:    { color: '#ec79ad', accent: '#ffc1d9', effect: 'bloom', shape: 'petal' },
  earth:     { color: '#a77b54', accent: '#d1aa75', effect: 'grain', shape: 'square' },
  fire:      { color: '#f06045', accent: '#ffb340', effect: 'ember', shape: 'triangle' },
  animal:    { color: '#d7bc55', accent: '#f6e597', effect: 'flutter', shape: 'triangle' },
  voice:     { color: '#ac83df', accent: '#d8bfff', effect: 'wave', shape: 'dash' },
  silence:   { color: '#7c8290', accent: '#b8bcc5', effect: 'veil', shape: 'circle' },
  calm:      { color: '#71c8ad', accent: '#b4ead5', effect: 'ripple', shape: 'circle' },
  joy:       { color: '#ffd34f', accent: '#fff09a', effect: 'spark', shape: 'diamond' },
  love:      { color: '#ef777c', accent: '#ffc0b1', effect: 'bloom', shape: 'petal' },
  sadness:   { color: '#6577b7', accent: '#9da9d8', effect: 'rain', shape: 'dash' },
  fear:      { color: '#7752a2', accent: '#b38bd2', effect: 'jitter', shape: 'triangle' },
  anger:     { color: '#ed4e3f', accent: '#ff9369', effect: 'jitter', shape: 'triangle' },
  wonder:    { color: '#a676ee', accent: '#6ce2dc', effect: 'orbit', shape: 'diamond' },
  dream:     { color: '#8e84cc', accent: '#c6b9f1', effect: 'haze', shape: 'circle' },
  playful:   { color: '#7ed957', accent: '#ff7f6e', effect: 'bounce', shape: 'circle' },
  motion:    { color: '#42c7a9', accent: '#77e6cd', effect: 'wave', shape: 'dash' },
  stillness: { color: '#8da09a', accent: '#c4d1ca', effect: 'veil', shape: 'square' },
  touch:     { color: '#e7a68f', accent: '#f5d1bf', effect: 'bloom', shape: 'petal' },
  body:      { color: '#df786d', accent: '#f0b09e', effect: 'pulse', shape: 'circle' },
  time:      { color: '#b39b69', accent: '#e4d3a2', effect: 'orbit', shape: 'dash' },
  city:      { color: '#ec5d9a', accent: '#53a7e8', effect: 'grid', shape: 'square' },
  machine:   { color: '#4e9cc5', accent: '#a1d9ed', effect: 'grid', shape: 'square' },
  color:     { color: '#ef5b53', accent: '#4b8cde', effect: 'prism', shape: 'diamond' },
  taste:     { color: '#e99b55', accent: '#f2d178', effect: 'bloom', shape: 'circle' },
  unique:    { color: '#63c53e', accent: '#a7e784', effect: 'orbit', shape: 'circle' },
};

export function visualProfileFor(id) {
  return VISUAL_PROFILES[id] ?? VISUAL_PROFILES.unique;
}

export function visualProfileForToken(id, token = '', traits = {}) {
  const base = visualProfileFor(id);
  // Place names keep their signature even after semantic analysis changes.
  const place = PLACE_COLORS.find(({ word }) => token.normalize('NFC').startsWith(word)
    && /^(?:(?:에서|으로|부터|까지|처럼|보다|에게|이랑|하고|은|는|이|가|을|를|의|와|과|도|만|에|로|랑|요)|[ㄱ-ㅎㅏ-ㅣ])*$/u.test(token.normalize('NFC').slice(word.length)));
  if (place) return { ...base, color: place.colors[0], accent: place.colors.at(-1), gradient: `linear-gradient(100deg, ${place.colors.join(', ')})` };
  if (id === 'unique' && token) {
    const hash = [...token].reduce((value, character, index) => Math.imul(value ^ character.codePointAt(0), 16777619) + index, 2166136261) >>> 0;
    const light = Math.max(0, Math.min(1, traits.light ?? 0.5));
    const softness = Math.max(0, Math.min(1, traits.softness ?? 0.5));
    const motion = Math.max(0, Math.min(1, traits.motion ?? 0.5));
    const tension = Math.max(0, Math.min(1, traits.tension ?? 0.5));
    const hue = hash % 360;
    const saturation = Math.round(48 + (1 - softness) * 24 + tension * 9);
    const luminance = Math.round(42 + light * 25);
    const effect = tension > 0.64 ? 'jitter' : motion > 0.64 ? 'wave' : light > 0.62 ? 'spark' : softness > 0.58 ? 'haze' : 'orbit';
    return {
      color: `hsl(${hue} ${saturation}% ${luminance}%)`,
      accent: `hsl(${(hue + 34) % 360} ${Math.min(90, saturation + 10)}% ${Math.min(84, luminance + 18)}%)`,
      effect,
      shape: 'circle',
    };
  }
  if (id !== 'color') return base;
  const text = token.toLowerCase();
  const shades = [
    { words: ['빨강', '붉', '빨간', 'red', 'crimson'], color: '#ef5b53', accent: '#ffc0b1' },
    { words: ['주황', 'orange'], color: '#ef9955', accent: '#ffe071' },
    { words: ['노랑', '금빛', 'yellow', 'gold'], color: '#f2cf55', accent: '#fff09a' },
    { words: ['초록', '연두', 'green', 'lime'], color: '#63c53e', accent: '#a7dc77' },
    { words: ['파랑', '푸른', 'blue', 'azure', 'navy'], color: '#4b8cde', accent: '#b9ddff' },
    { words: ['보라', 'purple', 'violet'], color: '#a676ee', accent: '#d8bfff' },
    { words: ['분홍', 'pink'], color: '#ec79ad', accent: '#ffc1d9' },
    { words: ['하양', '흰', 'white'], color: '#d8dce7', accent: '#ffffff' },
    { words: ['검정', '까만', 'black'], color: '#817b8f', accent: '#bab2ca' },
  ];
  return shades.find((shade) => shade.words.some((word) => text.includes(word))) ?? base;
}

const PLACE_COLORS = [
  { word: '공간과몰입', colors: ['#ff0000', '#ffdd00', '#0047ff'] },
  { word: '낙산공원', colors: ['#297849', '#79ad48', '#348563'] },
  { word: '혜화', colors: ['#66b8dd', '#3166c7'] },
  { word: '오쏘파스타', colors: ['#bb8534', '#e2bc67', '#c89542'] },
];

function withAlpha(hex, alpha) {
  const value = hex.replace('#', '');
  const number = Number.parseInt(value, 16);
  return `rgba(${number >> 16}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export class Visualizer {
  constructor(canvas, analysis) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.analysis = analysis;
    this.playing = false;
    this.startedAt = performance.now();
    this.pointer = { x: 0.5, y: 0.5, active: false };
    this.ripples = [];
    this.particles = [];
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.bindPointer();
    this.setAnalysis(analysis);
    this.resize();
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  bindPointer() {
    this.canvas.addEventListener('pointermove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = (event.clientX - rect.left) / rect.width;
      this.pointer.y = (event.clientY - rect.top) / rect.height;
      this.pointer.active = true;
    });
    this.canvas.addEventListener('pointerleave', () => {
      this.pointer.active = false;
    });
    this.canvas.addEventListener('pointerdown', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.ripples.push({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        born: performance.now(),
      });
    });
  }

  setAnalysis(analysis) {
    this.analysis = analysis;
    const random = seeded(analysis.seed);
    this.profiles = analysis.concepts.slice(0, 3).map((item) => visualProfileFor(item.id));
    while (this.profiles.length < 3) this.profiles.push([VISUAL_PROFILES.unique, VISUAL_PROFILES.water, VISUAL_PROFILES.light][this.profiles.length]);
    this.palette = this.profiles.map((item) => item.color);
    this.motifs = analysis.concepts.slice(0, 3).map((item, index) => ({
      ...visualProfileFor(item.id),
      id: item.id,
      seed: analysis.seed + index * 997,
    }));
    this.particles = Array.from({ length: Math.min(28, Math.max(12, analysis.tokens.length * 3)) }, (_, index) => ({
      ...visualProfileForToken(
        analysis.tokenMeanings[index % analysis.tokenMeanings.length]?.primaryConcept,
        analysis.tokenMeanings[index % analysis.tokenMeanings.length]?.token,
        analysis.tokenMeanings[index % analysis.tokenMeanings.length]?.traits,
      ),
      token: analysis.tokenMeanings[index % analysis.tokenMeanings.length]?.token,
      angle: random() * TAU,
      orbit: 0.54 + random() * 0.9,
      size: 1.2 + random() * 3.2,
      speed: (0.12 + random() * 0.38) * (index % 2 ? 1 : -1),
      offset: random(),
    }));
  }

  setPlaying(playing) {
    this.playing = playing;
    if (playing) this.startedAt = performance.now();
  }

  getCycle(now) {
    if (!this.playing) return 0;
    const secondsPerCycle = 240 / this.analysis.bpm;
    return ((now - this.startedAt) / 1000 / secondsPerCycle) % 1;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  clear() {
    const { context: ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);
  }

  drawStrings(time, cycle) {
    const { context: ctx, width } = this;
    const left = width * 0.08;
    const right = width * 0.92;
    const top = Math.max(34, width * 0.08);
    const colors = this.palette;
    const steps = 22;

    ctx.save();
    ctx.lineWidth = 1;
    for (let row = 0; row < 3; row += 1) {
      const y = top + row * 28;
      ctx.strokeStyle = 'rgba(64, 68, 70, 0.13)';
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();

      for (let index = 0; index < steps; index += 1) {
        const x = left + ((right - left) * index) / (steps - 1);
        const activeDistance = Math.abs(index / (steps - 1) - cycle);
        const pulse = this.playing ? Math.max(0, 1 - activeDistance * 18) : 0;
        const fade = 0.24 + (1 - index / steps) * 0.54;
        ctx.globalAlpha = fade + pulse * 0.45;
        ctx.shadowColor = colors[row];
        ctx.shadowBlur = pulse * 14;
        ctx.fillStyle = colors[row];
        ctx.beginPath();
        ctx.arc(x, y + Math.sin(time * 0.0018 + index * 0.3 + row) * (0.8 + row * 0.2), 5.5 + pulse * 2.5, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawOrbit(time, cycle) {
    const { context: ctx, width, height, analysis } = this;
    const centerX = width / 2;
    const graphHeight = height < 180 ? 58 : height < 300 ? 78 : 110;
    const baseRadius = Math.max(20, Math.min(width * 0.19, (height - graphHeight - 28) / 2));
    const centerY = baseRadius + 8;
    ctx.save();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, TAU);
    ctx.moveTo(centerX + baseRadius * 0.62, centerY);
    ctx.arc(centerX, centerY, baseRadius * 0.62, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(232, 102, 61, .72)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, -Math.PI / 2, -Math.PI / 2 + cycle * TAU);
    ctx.stroke();
    const words = analysis.tokenMeanings.slice(0, 12);
    words.forEach((meaning, index) => {
      const angle = -Math.PI / 2 + (index / Math.max(1, words.length)) * TAU + (this.playing ? cycle * .12 : 0);
      const radius = meaning.layer === 'far' ? baseRadius * .8 : baseRadius * .5;
      const profile = visualProfileForToken(meaning.primaryConcept, meaning.token, meaning.traits);
      ctx.fillStyle = profile.color;
      ctx.beginPath();
      ctx.arc(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, meaning.layer === 'far' ? 2.6 : 3.4, 0, TAU);
      ctx.fill();
    });
    ctx.fillStyle = '#e8663d';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawParticle(ctx, particle, x, y, size, angle) {
    ctx.beginPath();
    if (particle.shape === 'square') {
      ctx.rect(x - size, y - size, size * 2, size * 2);
    } else if (particle.shape === 'diamond') {
      ctx.moveTo(x, y - size * 1.35); ctx.lineTo(x + size, y); ctx.lineTo(x, y + size * 1.35); ctx.lineTo(x - size, y); ctx.closePath();
    } else if (particle.shape === 'triangle') {
      ctx.moveTo(x, y - size * 1.25); ctx.lineTo(x + size * 1.12, y + size); ctx.lineTo(x - size * 1.12, y + size); ctx.closePath();
    } else if (particle.shape === 'dash') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.rect(-size * 1.7, -size * .35, size * 3.4, size * .7); ctx.restore();
    } else if (particle.shape === 'leaf' || particle.shape === 'petal') {
      ctx.ellipse(x, y, size * .68, size * 1.45, angle, 0, TAU);
    } else {
      ctx.arc(x, y, size, 0, TAU);
    }
    ctx.fill();
  }

  drawMotifs(time, centerX, centerY, radius) {
    const { context: ctx } = this;
    this.motifs.forEach((motif, motifIndex) => {
      const random = seeded(motif.seed);
      const alpha = motifIndex === 0 ? 0.22 : 0.12;
      ctx.save();
      ctx.strokeStyle = withAlpha(motif.color, alpha);
      ctx.fillStyle = withAlpha(motif.accent, alpha * 0.9);
      ctx.lineWidth = 1;
      if (motif.effect === 'rain') {
        for (let index = 0; index < 18; index += 1) {
          const x = centerX - radius * 1.45 + random() * radius * 2.9;
          const y = centerY - radius + ((random() + time * .00008) % 1) * radius * 2;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 14 + random() * 14); ctx.stroke();
        }
      } else if (motif.effect === 'wind' || motif.effect === 'wave') {
        for (let line = 0; line < 3; line += 1) {
          ctx.beginPath();
          for (let index = 0; index <= 32; index += 1) {
            const progress = index / 32;
            const x = centerX - radius * 1.2 + progress * radius * 2.4;
            const y = centerY + (line - 1) * 24 + Math.sin(progress * TAU * (1.2 + line * .2) + time * .00035) * 12;
            if (!index) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (motif.effect === 'grid') {
        for (let index = -3; index <= 3; index += 1) {
          const offset = index * radius * .22;
          ctx.beginPath(); ctx.moveTo(centerX + offset, centerY - radius); ctx.lineTo(centerX + offset, centerY + radius); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(centerX - radius, centerY + offset); ctx.lineTo(centerX + radius, centerY + offset); ctx.stroke();
        }
      } else if (motif.effect === 'spark' || motif.effect === 'ember' || motif.effect === 'snow' || motif.effect === 'grain') {
        for (let index = 0; index < 22; index += 1) {
          const angle = random() * TAU;
          const distance = radius * (.18 + random() * 1.22);
          const drift = motif.effect === 'ember' ? -((time * .012 + index * 7) % 35) : 0;
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance + drift;
          const size = motif.effect === 'snow' ? 1.8 + random() * 2 : .8 + random() * 1.5;
          ctx.beginPath(); ctx.arc(x, y, size, 0, TAU); ctx.fill();
        }
      } else if (motif.effect === 'ray' || motif.effect === 'prism') {
        for (let index = 0; index < 12; index += 1) {
          const angle = index / 12 * TAU + time * .00005;
          ctx.beginPath(); ctx.moveTo(centerX + Math.cos(angle) * radius * .55, centerY + Math.sin(angle) * radius * .55);
          ctx.lineTo(centerX + Math.cos(angle) * radius * 1.25, centerY + Math.sin(angle) * radius * 1.25); ctx.stroke();
        }
      } else if (motif.effect === 'leaf' || motif.effect === 'bloom' || motif.effect === 'flutter') {
        for (let index = 0; index < 13; index += 1) {
          const angle = random() * TAU + time * .00003 * (index % 2 ? 1 : -1);
          const distance = radius * (.45 + random() * .82);
          ctx.beginPath();
          ctx.ellipse(centerX + Math.cos(angle) * distance, centerY + Math.sin(angle) * distance, 2 + random() * 3, 5 + random() * 5, angle, 0, TAU);
          ctx.fill();
        }
      } else {
        for (let ring = 1; ring <= 3; ring += 1) {
          const pulse = Math.sin(time * .0006 + ring) * 4;
          ctx.beginPath(); ctx.arc(centerX, centerY, radius * (.38 + ring * .23) + pulse, 0, TAU); ctx.stroke();
        }
      }
      ctx.restore();
    });
  }

  drawCore(time, x, y, baseRadius) {
    const { context: ctx, analysis } = this;
    const radius = baseRadius * (0.16 + analysis.axes.warmth * 0.09);
    const points = 36;
    const wobble = this.reducedMotion ? 0 : time * 0.001;
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.32, radius * 0.08, x, y, radius * 1.4);
    const primary = this.profiles[0];
    const secondary = this.profiles[1];
    gradient.addColorStop(0, withAlpha(primary.accent, 0.98));
    gradient.addColorStop(0.64, withAlpha(primary.color, 0.92));
    gradient.addColorStop(1, withAlpha(secondary.color, 0.2));

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.shadowColor = withAlpha(primary.color, 0.74);
    ctx.shadowBlur = 30;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    for (let index = 0; index <= points; index += 1) {
      const angle = (index / points) * TAU;
      const noise = Math.sin(angle * 3 + wobble * 1.7) * 0.08 + Math.sin(angle * 5 - wobble) * 0.04;
      const breathing = this.playing ? Math.sin(wobble * 2.2) * 0.04 : 0;
      const currentRadius = radius * (1 + noise + breathing);
      const px = x + Math.cos(angle) * currentRadius;
      const py = y + Math.sin(angle) * currentRadius;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawLabels(centerX, centerY, baseRadius) {
    const { context: ctx, analysis } = this;
    ctx.save();
    ctx.font = '500 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    const drawToken = (token, index, layer) => {
      const meaning = analysis.tokenMeanings.find((item) => item.token === token);
      const profile = visualProfileForToken(meaning?.primaryConcept, token, meaning?.traits);
      const angle = -Math.PI * 0.9 + index * 0.6;
      const layerAngle = layer === 'far' ? angle : Math.PI * 0.28 + index * 0.72;
      const radius = layer === 'far' ? baseRadius * (0.78 + (index % 2) * 0.12) : baseRadius * 0.34;
      const x = centerX + Math.cos(layerAngle) * radius;
      const y = centerY + Math.sin(layerAngle) * radius;
      const focused = token === this.focusToken;
      ctx.globalAlpha = focused ? 1 : layer === 'far' ? 0.72 : 0.88;
      ctx.fillStyle = profile.color;
      ctx.shadowColor = profile.color;
      ctx.shadowBlur = focused ? 14 : 5;
      ctx.fillText(token, x, y);
      ctx.shadowBlur = 0;
    };
    analysis.layers.farTokens.slice(0, 4).forEach((token, index) => drawToken(token, index, 'far'));
    analysis.layers.nearTokens.slice(0, 3).forEach((token, index) => drawToken(token, index, 'near'));
    ctx.restore();
  }

  drawGraphs(time) {
    const { context: ctx, width, height, analysis } = this;
    this.graphAxes ??= { ...analysis.axes };
    for (const axis of Object.keys(analysis.axes)) {
      this.graphAxes[axis] += (analysis.axes[axis] - this.graphAxes[axis]) * (this.reducedMotion ? 1 : .08);
    }
    const axes = this.graphAxes;
    const stacked = false;
    const margin = 4, gap = 10, panelHeight = height < 180 ? 58 : height < 300 ? 78 : 110;
    const panelWidth = stacked ? width - margin * 2 : (width - margin * 2 - gap) / 2;
    const top = height - panelHeight - 4;
    for (let panel = 0; panel < 2; panel += 1) {
      const x = margin + (stacked ? 0 : panel * (panelWidth + gap));
      const y = top + (stacked ? panel * (panelHeight + gap) : 0);
      const ink = panel ? '#c97855' : '#668c86';
      const gains = panel
        ? [.15 + axes.tension * .15, .35 + axes.motion * .28, .4 + axes.light * .3]
        : [.5 + axes.warmth * .25, .23 + axes.space * .25, .1 + axes.light * .16];
      const left = x + 10, right = x + panelWidth - 10;
      const plotTop = y + 26, bottom = y + panelHeight - 16;
      const response = (t) => clamp(gains.reduce((sum, value, i) => {
        const distance = (t - [.13, .5, .87][i]) / .22;
        return sum + value * Math.exp(-.5 * distance * distance);
      }, .04), .02, .96);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, panelWidth, panelHeight, 10);
      ctx.fillStyle = '#eff1ed'; ctx.fill();
      ctx.strokeStyle = '#d0d5ce'; ctx.lineWidth = .8; ctx.stroke();
      ctx.textAlign = 'left';
      ctx.font = '500 9px ui-monospace, monospace';
      ctx.fillStyle = ink;
      ctx.fillText(panel ? '근경 / MELODY' : '원경 / BASS', left, y + 16);
      ctx.textAlign = 'right'; ctx.font = '8px ui-monospace, monospace';
      ctx.fillStyle = '#929b92'; if (panelWidth > 220) ctx.fillText('TONE', right, y + 16);
      for (let i = 0; i < 3; i += 1) {
        const px = left + (right - left) * (i / 2);
        ctx.strokeStyle = '#dde2d9'; ctx.lineWidth = .7;
        ctx.beginPath(); ctx.moveTo(px, plotTop); ctx.lineTo(px, bottom); ctx.stroke();
        ctx.textAlign = i === 0 ? 'left' : i === 2 ? 'right' : 'center';
        ctx.fillStyle = '#9aa296'; ctx.fillText(['LOW', 'MID', 'AIR'][i], px, bottom + 11);
      }
      const points = Array.from({ length: 65 }, (_, i) => [
        left + (right - left) * i / 64,
        bottom - response(i / 64) * (bottom - plotTop),
      ]);
      const wash = ctx.createLinearGradient(0, plotTop, 0, bottom);
      wash.addColorStop(0, withAlpha(ink, .17)); wash.addColorStop(1, withAlpha(ink, .01));
      ctx.beginPath(); ctx.moveTo(left, bottom);
      points.forEach(([px, py]) => ctx.lineTo(px, py));
      ctx.lineTo(right, bottom); ctx.closePath(); ctx.fillStyle = wash; ctx.fill();
      ctx.beginPath(); points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
      ctx.strokeStyle = ink; ctx.lineWidth = 1.7; ctx.stroke();
      if (this.playing) {
        const t = this.getCycle(time);
        const px = left + (right - left) * t, py = bottom - response(t) * (bottom - plotTop);
        ctx.beginPath(); ctx.arc(px, py, 3, 0, TAU); ctx.fillStyle = ink; ctx.fill();
      }
      ctx.restore();
    }
  }

  drawRipples(now) {
    const { context: ctx } = this;
    this.ripples = this.ripples.filter((ripple) => now - ripple.born < 1100);
    for (const ripple of this.ripples) {
      const progress = (now - ripple.born) / 1100;
      ctx.save();
      ctx.strokeStyle = withAlpha(this.palette[0], 0.48 * (1 - progress));
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, 8 + progress * 90, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  frame(now) {
    if (!this.width || !this.height) {
      requestAnimationFrame(this.frame);
      return;
    }
    const cycle = this.getCycle(now);
    this.clear();
    this.drawOrbit(now, cycle);
    this.drawGraphs(now);
    this.drawRipples(now);
    window.dispatchEvent(new CustomEvent('formyiru:cycle', { detail: cycle }));
    requestAnimationFrame(this.frame);
  }
}
