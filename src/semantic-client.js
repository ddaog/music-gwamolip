export class SemanticClient {
  constructor({ onResult, onStatus, delay = 650, createWorker = () => new Worker(new URL('./semantic.worker.js', import.meta.url), { type: 'module' }) }) {
    Object.assign(this, { onResult, onStatus, createWorker, delay });
    this.revision = 0;
    this.enabled = false;
  }
  enable() { this.enabled = true; }
  preload() { this.enable(); this.request('', []); }
  disable() {
    this.enabled = false;
    this.revision++;
    clearTimeout(this.timer); clearTimeout(this.watchdog);
    this.worker?.terminate(); this.worker = null;
    this.onStatus('off');
  }
  request(text, tokens) {
    const id = ++this.revision;
    clearTimeout(this.timer);
    clearTimeout(this.watchdog);
    if (!this.enabled) return;
    this.timer = setTimeout(() => {
      if (!this.worker) {
        this.onStatus('loading');
        try { this.worker = this.createWorker(); } catch { this.fail(); return; }
        this.worker.onmessage = ({ data }) => {
          if (!this.enabled) return;
          if (data.type === 'status') {
            if (data.status === 'ready') clearTimeout(this.watchdog);
            this.onStatus(data.status, data.progress);
          }
          if (data.type === 'error') this.fail();
          if (data.type === 'result' && data.id === this.revision) {
            clearTimeout(this.watchdog);
            this.onStatus('ready');
            this.onResult(data.text, data.result);
          }
        };
        this.worker.onerror = () => this.fail();
      }
      clearTimeout(this.watchdog);
      this.watchdog = setTimeout(() => this.fail(), 180000);
      this.worker.postMessage({ id, text, tokens });
    }, this.delay);
  }
  invalidate() { this.revision++; clearTimeout(this.timer); clearTimeout(this.watchdog); }
  fail() { this.disable(); this.onStatus('error'); }
}
