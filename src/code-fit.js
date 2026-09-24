// Try readable sizes in half-pixel steps; overflowing content remains scrollable.
export function fitCodeFont(measureHeight, availableHeight) {
  for (const size of [13, 12.5, 12, 11.5, 11]) {
    if (measureHeight(size) <= availableHeight + 1 || size === 11) return size;
  }
}

const layouts = new WeakMap();
export function scheduleCodeFit(host) {
  const viewport = host.closest('.live-code-scroll');
  if (!viewport) return;
  if (!layouts.has(host)) {
    let frame;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!viewport.clientWidth || !viewport.clientHeight) return;
        const scroll = viewport.scrollTop;
        const style = getComputedStyle(viewport);
        const available = viewport.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        fitCodeFont((size) => {
          viewport.style.setProperty('--code-font-size', `${size}px`);
          return host.getBoundingClientRect().height;
        }, available);
        viewport.scrollTop = scroll;
      });
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    document.fonts?.ready.then(schedule);
    layouts.set(host, schedule);
  }
  layouts.get(host)();
}
