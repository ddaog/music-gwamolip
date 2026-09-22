const TAU = Math.PI * 2;
const COLORS = {
  red: '#ef5b53',
  green: '#63c53e',
  blue: '#4b8cde',
  ink: '#17161d',
  paper: '#e9e5dc',
  grid: 'rgba(232, 229, 220, 0.18)',
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

export function visualProfileForToken(id, token = '') {
  const base = visualProfileFor(id);
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
    const gradient = ctx.createRadialGradient(width * 0.48, height * 0.36, 0, width * 0.5, height * 0.45, width * 0.72);
    gradient.addColorStop(0, withAlpha(this.palette[0], 0.11));
    gradient.addColorStop(0.5, 'rgba(25, 24, 31, 0.35)');
    gradient.addColorStop(1, withAlpha(this.palette[1], 0.015));
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
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
      ctx.strokeStyle = 'rgba(235, 232, 224, 0.13)';
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
    const graphHeight = Math.min(155, height * 0.24);
    const availableHeight = height - graphHeight - 110;
    const centerX = width * (width > 640 ? 0.54 : 0.5);
    const centerY = 116 + availableHeight * 0.53;
    const baseRadius = Math.min(width * 0.32, availableHeight * 0.42);
    const pointerPullX = this.pointer.active ? (this.pointer.x - 0.5) * 18 : 0;
    const pointerPullY = this.pointer.active ? (this.pointer.y - 0.5) * 14 : 0;

    this.drawMotifs(time, centerX, centerY, baseRadius);
    ctx.save();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1.2;
    for (let ring = 1; ring <= 4; ring += 1) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (baseRadius * ring) / 4, 0, TAU);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(centerX - baseRadius, centerY);
    ctx.lineTo(centerX + baseRadius, centerY);
    ctx.moveTo(centerX, centerY - baseRadius);
    ctx.lineTo(centerX, centerY + baseRadius);
    ctx.stroke();

    const playAngle = -Math.PI / 2 + cycle * TAU;
    ctx.strokeStyle = 'rgba(241, 238, 231, 0.82)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(playAngle) * baseRadius, centerY + Math.sin(playAngle) * baseRadius);
    ctx.stroke();
    ctx.fillStyle = COLORS.paper;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3.5, 0, TAU);
    ctx.fill();

    for (const particle of this.particles) {
      const motion = this.reducedMotion ? 0 : time * 0.0002 * particle.speed * (0.4 + analysis.axes.motion);
      const angle = particle.angle + motion;
      const radius = baseRadius * particle.orbit * 0.76;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const pulse = particle.token === this.focusToken ? 1 : this.playing ? 0.5 + Math.sin((cycle + particle.offset) * TAU * 2) * 0.5 : 0.25;
      ctx.globalAlpha = 0.2 + pulse * 0.45;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 4 + pulse * 10;
      this.drawParticle(ctx, particle, x, y, particle.size + pulse * 1.6, angle);
    }
    ctx.restore();

    this.drawCore(time, centerX + pointerPullX, centerY + pointerPullY, baseRadius);
    this.drawLabels(centerX, centerY, baseRadius);
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
      const profile = visualProfileForToken(meaning?.primaryConcept, token);
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
    const gap = 22;
    const margin = width * 0.08;
    const panelWidth = (width - margin * 2 - gap) / 2;
    const panelHeight = Math.min(112, height * 0.18);
    const y = height - panelHeight - 30;
    const profiles = [this.profiles[0], this.profiles[2]];
    const labels = ['원경 EQ · BASS', '근경 EQ · TOPLINE'];
    const bandNames = ['LOW', 'MID', 'AIR'];
    const bandCenters = [0.16, 0.5, 0.84];

    for (let panel = 0; panel < 2; panel += 1) {
      const x = margin + panel * (panelWidth + gap);
      const profile = profiles[panel];
      const traits = panel === 0
        ? [0.62 + analysis.axes.warmth * 0.25, 0.28 + analysis.axes.space * 0.25, 0.13 + analysis.axes.light * 0.14]
        : [0.18 + analysis.axes.tension * 0.16, 0.43 + analysis.axes.motion * 0.28, 0.52 + analysis.axes.light * 0.28];
      const plotTop = y + 17;
      const plotBottom = y + panelHeight - 22;
      const plotHeight = plotBottom - plotTop;
      ctx.save();
      ctx.fillStyle = 'rgba(12, 11, 16, .34)';
      ctx.fillRect(x, y, panelWidth, panelHeight);
      ctx.strokeStyle = 'rgba(235, 232, 224, 0.32)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x, y, panelWidth, panelHeight);
      for (let band = 0; band < 3; band += 1) {
        const bandX = x + (panelWidth * band) / 3;
        const bandWidth = panelWidth / 3;
        ctx.fillStyle = withAlpha(profile.color, 0.025 + traits[band] * 0.025);
        ctx.fillRect(bandX, plotTop, bandWidth, plotHeight);
        if (band > 0) {
          ctx.strokeStyle = 'rgba(235, 232, 224, .13)';
          ctx.beginPath(); ctx.moveTo(bandX, plotTop); ctx.lineTo(bandX, plotBottom); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(235, 232, 224, .36)';
        ctx.font = '7px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(bandNames[band], bandX + bandWidth / 2, y + 11);
      }
      ctx.strokeStyle = withAlpha(profile.color, .9);
      ctx.lineWidth = 1.8;
      ctx.shadowColor = profile.color;
      ctx.shadowBlur = 8;
      const responseAt = (progress) => {
        const animated = this.playing && !this.reducedMotion ? Math.sin(time * .003 + progress * 4) * .025 : 0;
        const response = traits.reduce((sum, gain, index) => {
          const distance = (progress - bandCenters[index]) / (index === 1 ? .2 : .16);
          return sum + gain * Math.exp(-.5 * distance * distance);
        }, .06) + animated;
        return clamp(response, .04, 1);
      };
      const points = 64;
      ctx.beginPath();
      for (let index = 0; index <= points; index += 1) {
        const progress = index / points;
        const px = x + progress * panelWidth;
        const py = plotBottom - responseAt(progress) * plotHeight;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      const playX = x + this.getCycle(time) * panelWidth;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = withAlpha(profile.accent, .65);
      ctx.beginPath(); ctx.moveTo(playX, plotTop); ctx.lineTo(playX, plotBottom); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = profile.accent;
      ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(labels[panel], x + 10, y + panelHeight - 11);
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
    this.drawStrings(now, cycle);
    this.drawOrbit(now, cycle);
    this.drawGraphs(now);
    this.drawRipples(now);
    window.dispatchEvent(new CustomEvent('formyiru:cycle', { detail: cycle }));
    requestAnimationFrame(this.frame);
  }
}
