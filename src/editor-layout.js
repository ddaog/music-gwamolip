export function editorFontSize(text, viewportWidth, compact = false) {
  const base = viewportWidth <= 600 ? (compact ? 20 : 22) : Math.min(32, Math.max(22, viewportWidth * .028));
  const weight = [...text].length + (text.match(/\n/g)?.length ?? 0) * 18;
  const density = Math.min(1, Math.max(0, (weight - 40) / 140));
  return Math.max(18, base * (1 - density * .25));
}

// Measure actual wrapping (including Enter and trailing blank lines), not just
// character count. Binary search keeps layout reads bounded during typing.
export function fitEditorFont(startSize, availableHeight, measureHeight) {
  let low = 36, high = Math.floor(startSize * 2), best = 36;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (measureHeight(middle / 2) <= availableHeight + 1) {
      best = middle; low = middle + 1;
    } else high = middle - 1;
  }
  return best / 2;
}
