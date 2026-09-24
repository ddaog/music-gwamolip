// Eight-bar deterministic grooves. The opening word anchors the family; extra
// words add subdivisions without replacing the foundational hits.
export function createRhythm(analysis, richness, tension = 0) {
  const seed = analysis.seed >>> 0;
  const family = seed % 4;
  const kicks = [[0, 8], [0, 6, 10], [0, 4, 8, 12], [0, 7, 10]][family];
  const snares = family === 3 ? [8] : [4, 12];
  const hash = (bar, step, voice) => {
    let value = (seed ^ Math.imul(bar + 1, 374761393) ^ Math.imul(step + 1, 668265263) ^ voice) >>> 0;
    value = Math.imul(value ^ (value >>> 13), 1274126177) >>> 0;
    return (value >>> 0) / 4294967296;
  };
  const result = { family, kick: [], snare: [], hat: [], accents: [] };
  for (let bar = 0; bar < 8; bar++) {
    const fill = bar === 3 || bar === 7;
    const kick = [], snare = [], hat = [], accents = [];
    for (let step = 0; step < 16; step++) {
      kick.push(kicks.includes(step) || (step % 2 === 0 && hash(bar, step, 1) < richness * .15) ? 'c1' : '~');
      snare.push(snares.includes(step) || (fill && step > 12 && hash(bar, step, 2) < richness * .65 + tension * .15) ? 'white' : '~');
      const hit = step % 4 === 2 || (step % 2 === 0 && hash(bar, step, 3) < richness * .8)
        || (step % 2 === 1 && hash(bar, step, 4) < richness * (.12 + tension * .18));
      hat.push(hit ? 'white' : '~');
      accents.push((step % 4 === 2 ? .85 : .35 + hash(bar, step, 5) * .3).toFixed(2));
    }
    result.kick.push(kick.join(' ')); result.snare.push(snare.join(' '));
    result.hat.push(hat.join(' ')); result.accents.push(accents.join(' '));
  }
  return result;
}
