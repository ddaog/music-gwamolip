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
  const lines = visiblePatternCode(source);
  host.closest('.live-code-panel')?.style.setProperty('--pattern-rows', lines.length);
  const count = document.querySelector('#layer-count');
  if (count) count.textContent = `${layers.length} LAYERS`;
  const fragment = document.createDocumentFragment();
  lines.forEach((line, index) => {
    const row = document.createElement('span');
    row.className = 'code-line'; row.dataset.line = String(index + 1).padStart(2, '0');
    let cursor = 0;
    for (const match of line.matchAll(/\/\/.*$|\/\*.*?\*\/|"[^"\n]*"|\b[a-zA-Z]+(?=\()/gu)) {
      row.append(document.createTextNode(line.slice(cursor, match.index)));
      const token = document.createElement('span');
      token.className = match[0].startsWith('/') ? 'code-comment' : match[0].startsWith('"') ? 'code-string' : 'code-function';
      token.textContent = match[0]; row.append(token);
      cursor = match.index + match[0].length;
    }
    row.append(document.createTextNode(line.slice(cursor)));
    fragment.append(row);
    if (index < lines.length - 1) fragment.append(document.createTextNode('\n'));
  });
  host.replaceChildren(fragment);
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
