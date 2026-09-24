export function editorFontSize(text, viewportWidth, compact = false) {
  const base = viewportWidth <= 600 ? (compact ? 20 : 22) : Math.min(32, Math.max(22, viewportWidth * .028));
  const weight = [...text].length + (text.match(/\n/g)?.length ?? 0) * 18;
  const density = Math.min(1, Math.max(0, (weight - 40) / 140));
  return Math.max(18, base * (1 - density * .25));
}
