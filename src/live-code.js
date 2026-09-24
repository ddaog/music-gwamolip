let previous = [];
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
    .map((line) => line.match(/^\s*((?:n|note|s)\("[^"\n]*"\))/u)?.[1]).filter(Boolean);
  return patterns.length ? ['stack(', ...patterns.map((pattern, index) => `  ${pattern}${index < patterns.length - 1 ? ',' : ''}`), ')'] : ['// 첫 단어를 기다리는 중'];
}
export function renderLiveCode(host, source) {
  const layers = codeLayers(source);
  const lines = visiblePatternCode(source);
  host.closest('.live-code-panel')?.style.setProperty('--pattern-rows', lines.length);
  const count = document.querySelector('#layer-count');
  if (count) count.textContent = `${layers.length} LAYERS`;
  const fragment = document.createDocumentFragment();
  lines.forEach((line, index) => {
    const row = document.createElement('span');
    row.className = 'code-line';
    row.dataset.line = String(index + 1).padStart(2, '0');
    if (previous.length && previous[index] !== line) row.classList.add('is-updated');
    const pattern = /"[^"\n]*"|\b\d+(?:\.\d+)?\b|\b[a-zA-Z]+(?=\()/g;
    let cursor = 0;
    for (const match of line.matchAll(pattern)) {
      row.append(document.createTextNode(line.slice(cursor, match.index)));
      const token = document.createElement('span');
      token.className = match[0][0] === '"' ? 'code-string' : /^\d/.test(match[0]) ? 'code-number' : 'code-function';
      token.textContent = match[0];
      row.append(token);
      cursor = match.index + match[0].length;
    }
    row.append(document.createTextNode(line.slice(cursor) || ' '));
    fragment.append(row);
  });
  host.replaceChildren(fragment);
  previous = lines;
}
