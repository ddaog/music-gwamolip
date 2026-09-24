export function codeLayers(source) {
  return source.split('\n').filter((line) => /^\s+(?:n|note|s)\(/u.test(line)).map((line) => {
    const label = line.includes('.pan(.65)') ? 'RELATION' : line.includes('.penv(') ? 'KICK' : line.includes('.hpf(7200)') ? 'HI-HAT'
      : line.includes('.hpf(') ? 'SNARE' : /2:(?:major|minor)/u.test(line) ? 'BASS'
      : /3:(?:major|minor)/u.test(line) ? 'CHORDS' : line.includes('.s("sine")') ? 'SPARKLE' : 'MELODY';
    const sound = line.match(/\.s\("([a-z]+)"\)/u)?.[1] ?? 'noise';
    return `${label}  →  ${sound}`;
  });
}
export function visiblePatternCode(source) {
  const patterns = source.split('\n').filter((line) => /^\s+(?:n|note|s)\(/u.test(line))
    .map((line) => {
      const pattern = line.match(/^\s*((?:n|note|s)\("[^"\n]*"\))/u)?.[1];
      const module = line.match(/\/\* (M\d+):/u)?.[1];
      return pattern ? `${module ? `/* ${module} */ ` : ''}${pattern}` : null;
    }).filter(Boolean);
  const patches = source.split('\n').filter((line) => line.startsWith('// PATCH '));
  return patterns.length ? [...patches, 'stack(', ...patterns.map((pattern, index) => `  ${pattern}${index < patterns.length - 1 ? ',' : ''}`), ')'] : ['// 첫 단어를 기다리는 중'];
}
export function renderLiveCode(host, source) {
  const layers = codeLayers(source);
  const lines = source.split('\n').filter((line) => /^\s+(?:n|note|s)\(/u.test(line));
  const openKeys = new Set([...host.querySelectorAll('details[open]')].map((item) => item.dataset.key));
  const focusedKey = host.contains(document.activeElement) ? document.activeElement.closest('details')?.dataset.key : null;
  host.closest('.live-code-panel')?.style.setProperty('--pattern-rows', Math.max(4, lines.length * 3));
  const count = document.querySelector('#layer-count');
  if (count) count.textContent = `${layers.length} LAYERS`;
  const fragment = document.createDocumentFragment();
  const patches = source.split('\n').filter((line) => line.startsWith('// PATCH '));
  if (patches.length) {
    const box = document.createElement('details'); box.className = 'code-patches'; box.dataset.key = 'patches'; box.open = openKeys.has('patches');
    const summary = document.createElement('summary'); summary.textContent = `PATCH · ${patches.length}개 연결`; box.append(summary);
    for (const line of patches) { const p = document.createElement('p'); p.textContent = line.slice(9); box.append(p); }
    fragment.append(box);
  }
  const names = { MELODY:'선율', CHORDS:'화음', BASS:'베이스', SPARKLE:'보조 선율', RELATION:'응답 선율', KICK:'킥', SNARE:'스네어', 'HI-HAT':'하이햇' };
  lines.forEach((line, index) => {
    const label = layers[index].split('  →')[0];
    const module = line.match(/\/\* (M\d+):/u)?.[1];
    const pattern = line.match(/(?:n|note|s)\("([^"\n]*)"\)/u)?.[1] ?? '';
    const bars = [...pattern.matchAll(/\[([^\]]+)\]/gu)].map((match) => match[1]);
    if (!bars.length) bars.push(pattern);
    const row = document.createElement('details'); row.className = 'code-voice';
    row.dataset.key = module ?? label; row.open = openKeys.has(row.dataset.key);
    const summary = document.createElement('summary');
    const title = document.createElement('span'); title.textContent = module ? `${module} · 문장 선율` : names[label] ?? label;
    const meta = document.createElement('small'); meta.textContent = `${bars.length}마디`;
    const operation = line.match(/^\s*(n|note|s)\(/u)?.[1] ?? 'n';
    const preview = document.createElement('code'); preview.textContent = `${operation}("[${bars[0]}]")`;
    summary.append(title, meta, preview); row.append(summary);
    bars.forEach((bar, i) => {
      const barRow = document.createElement('div'); barRow.className = 'code-bar';
      const number = document.createElement('span'); number.textContent = String(i + 1).padStart(2, '0');
      const notes = document.createElement('code'); notes.textContent = bar;
      barRow.append(number, notes); row.append(barRow);
    });
    fragment.append(row);
  });
  if (!lines.length) { const empty = document.createElement('p'); empty.className = 'code-empty'; empty.textContent = '// 첫 단어를 기다리는 중'; fragment.append(empty); }
  host.replaceChildren(fragment);
  if (focusedKey) [...host.querySelectorAll('details')].find((item) => item.dataset.key === focusedKey)?.querySelector('summary').focus({preventScroll:true});
}

export function formatFullCode(source) {
  return source.split('\n').map((line) => {
    if (!/^\s+(?:n|note|s)\(/u.test(line)) return line;
    let depth = 0, quoted = false, output = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i - 1] !== '\\') quoted = !quoted;
      if (!quoted) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (char === '.' && depth === 0 && /[a-z]/iu.test(line[i + 1] ?? '')) output += '\n    ';
      }
      output += char;
    }
    return output;
  }).join('\n');
}
