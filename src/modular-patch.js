// A bounded, feed-forward control patch. Audio stays VCO -> VCF -> VCA -> mixer.
// Pitch/gate sequences are clocked CV equivalents, not a voltage simulator.
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export function createModularPatch(analysis) {
  const words = analysis.syntax?.words ?? [];
  const groups = [...new Set(words.map((word) => word.sentence))].slice(0, 8);
  const modules = groups.map((sentence, id) => {
    const members = words.filter((word) => word.sentence === sentence);
    const meanings = members.map((word) => analysis.tokenMeanings.find((item) => item.token === word.token)).filter(Boolean);
    const axis = (name) => meanings.reduce((sum, word) => sum + (word.traits?.[name] ?? .5), 0) / Math.max(1, meanings.length);
    const seed = members.reduce((sum, word) => [...word.token].reduce((n, char) => n + char.codePointAt(0), sum), 0);
    const density = Math.min(6, 2 + Math.floor(members.length / 2));
    return { id, sentence, first:members[0].index, last:members.at(-1).index,
      cutoff:Math.round(clamp(600 + axis('light') * 1600, 350, 3200)),
      attack:clamp(.02 + axis('softness') * .1, .008, .15),
      period:axis('motion') > .55 ? 2 : axis('motion') > .25 ? 4 : 8,
      gate:Array.from({length:8}, (_, step) => ((step * 5 + seed % 2) % 8) < density),
      pitch:Array.from({length:8}, (_, step) => [0, 2, 4, 6][(step + seed) % 4]),
      oscillator:meanings.some((word) => word.conceptIds.some((id) => ['fear', 'anger'].includes(id))) ? 'sawtooth' : 'triangle',
    };
  });
  const cables = [];
  for (const edge of analysis.syntax?.edges ?? []) {
    const left = modules.find((module) => words[edge.from]?.sentence === module.sentence);
    const right = modules.find((module) => words[edge.to]?.sentence === module.sentence);
    if (!left || !right || left.id === right.id) continue;
    const source = left.id < right.id ? left : right;
    const target = left.id < right.id ? right : left;
    const kind = edge.type === 'repetition' ? 'gate' : edge.type === 'shared-subject' ? 'pitch' : 'cutoff';
    if (cables.some((cable) => cable.target === target.id && cable.kind === kind)) continue;
    cables.push({ source:source.id, target:target.id, kind, from:left === source ? edge.from : edge.to,
      to:left === source ? edge.to : edge.from, normalled:false, depth:kind === 'cutoff' ? .32 : 1 });
  }
  // Normalled patch: each new phrase gets a gentle upstream LFO unless an
  // explicit semantic cable has already taken that input (one source per jack).
  modules.slice(1).forEach((target) => {
    if (!cables.some((cable) => cable.target === target.id && cable.kind === 'cutoff')) {
      const source = modules[target.id - 1];
      cables.push({source:source.id, target:target.id, kind:'cutoff', from:source.last, to:target.first, normalled:true, depth:.16});
    }
  });
  return { modules, cables };
}

export function compileModularVoices(patch, { chords, root, scale }) {
  const alternate = (bars) => '<' + bars.map((bar) => '[' + bar + ']').join(' ') + '>';
  return patch.modules.map((module) => {
    const input = (kind) => patch.cables.find((cable) => cable.target === module.id && cable.kind === kind);
    const gate = patch.modules[input('gate')?.source] ?? module;
    const pitch = patch.modules[input('pitch')?.source] ?? module;
    const modulation = input('cutoff');
    const cutoff = modulation
      ? `sine.slow(${patch.modules[modulation.source].period}).range(${Math.round(module.cutoff * (1 - modulation.depth))},${Math.round(module.cutoff * (1 + modulation.depth))})`
      : String(module.cutoff);
    const notes = alternate(chords.map((chord) => gate.gate.map((open, step) => open ? chord + pitch.pitch[step] : '~').join(' ')));
    // Bounded mixer headroom; patching a control cannot raise the gain ceiling.
    const gain = (.115 / Math.sqrt(patch.modules.length)).toFixed(3);
    return `n("${notes}").scale("${root}4:${scale}").s("${module.oscillator}").lpf(${cutoff}).attack(${module.attack.toFixed(3)}).decay(.18).sustain(.12).release(.22).room(.2).gain(${gain}) /* M${module.id + 1}: VCO > VCF > VCA */`;
  });
}

export function patchDescriptions(patch) {
  return patch.cables.map((cable) => `M${cable.source + 1}.${cable.kind === 'gate' ? 'GATE' : cable.kind === 'pitch' ? 'SEQ' : 'LFO'} → M${cable.target + 1}.${cable.kind === 'gate' ? 'ENV' : cable.kind === 'pitch' ? 'PITCH' : 'VCF'}${cable.normalled ? ' · NORMAL' : ''}`);
}
