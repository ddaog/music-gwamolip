let previous = [];
export function renderLiveCode(host, source) {
  const lines = source ? source.replace(/\)\./g, ')\n    .').split('\n') : ['// 한 문장이 음악이 되는 과정'];
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
