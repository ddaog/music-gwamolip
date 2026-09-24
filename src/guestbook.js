import { GuestbookStore, createGuestbookEntry, validateSnapshot } from './guestbook-store.js';
import { visiblePatternCode } from './live-code.js';

export function setupGuestbook({capture, load, playback, togglePlayback}) {
  const store = new GuestbookStore();
  const $ = (selector) => document.querySelector(selector);
  const gallery = $('#guest-gallery');
  const saving = $('#guest-save-dialog');
  let pending, lastSaved = '', galleryRevision = 0, backupUrl;
  const fingerprint = (snapshot) => JSON.stringify([snapshot.text, snapshot.code]);
  const hasUnsavedWork = () => {
    const snapshot = capture();
    return snapshot.text.trim() && fingerprint(snapshot) !== lastSaved;
  };
  const status = (text) => { $('#guest-status').textContent = text; };
  const syncPlayback = () => {
    const state = playback();
    $('#gallery-playback').textContent = state.playing ? 'Ⅱ 소리 멈추기' : '▶ 문장 재생';
    $('#gallery-playing').textContent = state.playing ? `지금 흐르는 문장 · ${state.text}` : '연주가 멈춰 있어요';
  };
  window.addEventListener('formyiru:playback', syncPlayback);
  $('#gallery-playback').addEventListener('click', async () => { await togglePlayback(); syncPlayback(); });
  $('#guest-save').addEventListener('click', () => {
    try {
      pending = capture();
      if (!pending.text.trim()) { status('먼저 이곳에 남길 문장을 적어주세요.'); $('#sentence').focus(); return; }
      if (!validateSnapshot(pending)) throw new Error('입력을 마친 뒤 다시 눌러주세요.');
      $('#guest-save-preview').textContent = pending.text;
      $('#guest-save-error').textContent = '';
      saving.showModal();
    } catch (error) { status(error.message); }
  });
  $('#guest-save-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = $('#guest-save-confirm'); button.disabled = true;
    try {
      const key = fingerprint(pending);
      if (key === lastSaved) { saving.close(); status('이미 남긴 문장입니다. 갤러리에서 만나보세요.'); return; }
      const entry = createGuestbookEntry(pending, $('#guest-author').value);
      await store.save(entry);
      lastSaved = key;
      saving.close(); $('#guest-author').value = '';
      status('이 컴퓨터에 문장과 음악 코드를 남겼습니다. 갤러리에서 다시 들을 수 있어요.');
    } catch { $('#guest-save-error').textContent = '저장하지 못했어요. 브라우저 저장 공간·권한을 확인하고 다시 시도해주세요. 문장은 그대로 남아 있습니다.'; }
    finally { button.disabled = false; }
  });
  $('#guest-save-cancel').addEventListener('click', () => saving.close());
  const showGallery = async () => {
    if (!gallery.open) gallery.showModal();
    syncPlayback();
    const revision = ++galleryRevision;
    $('#gallery-message').textContent = '문장들을 불러오는 중';
    $('#gallery-list').replaceChildren();
    try {
      const entries = await store.list();
      if (revision !== galleryRevision) return;
      $('#gallery-count').textContent = `${entries.length}개의 문장`;
      $('#gallery-message').textContent = entries.length ? '' : '아직 남겨진 문장이 없어요. 첫 번째 소리를 남겨주세요.';
      for (const entry of entries) {
        const card = document.createElement('article'); card.className = 'guest-card';
        const valid = entry.version === 1 && validateSnapshot(entry.snapshot);
        const meta = document.createElement('p'); meta.className = 'guest-card-meta';
        const date = new Date(entry.createdAt);
        meta.textContent = `${entry.author || '이름 없는 독자'} · ${Number.isNaN(date.getTime()) ? '날짜 미상' : date.toLocaleDateString('ko-KR')}`;
        const poem = document.createElement('p'); poem.className = 'guest-card-text'; poem.textContent = entry.snapshot?.text || '읽을 수 없는 문장';
        const label = document.createElement('small'); label.textContent = valid ? `${entry.snapshot.analysis.root} ${entry.snapshot.analysis.scale} / ${entry.snapshot.analysis.bpm} BPM` : '다른 버전 또는 손상된 작품 · 재생할 수 없어요';
        const details = document.createElement('details'), summary = document.createElement('summary'), pre = document.createElement('pre');
        summary.textContent = '남겨진 코드'; pre.textContent = valid ? visiblePatternCode(entry.snapshot.code).join('\n') : String(entry.snapshot?.code ?? '');
        details.append(summary, pre);
        const button = document.createElement('button'); button.type = 'button'; button.textContent = '이 문장 불러와 듣기 ↗'; button.disabled = !valid;
        button.addEventListener('click', async () => {
          if (hasUnsavedWork() && !confirm('작성 중인 문장은 저장되지 않았어요. 선택한 작품을 불러올까요?')) return;
          button.disabled = true;
          try { await load(structuredClone(entry.snapshot)); lastSaved = fingerprint(entry.snapshot); gallery.close(); status(`${entry.author}의 문장을 불러왔어요. 수정해도 원본은 그대로 남습니다.`); }
          catch { $('#gallery-message').textContent = '작품을 불러오지 못했어요. 다시 시도해주세요.'; }
          finally { button.disabled = !valid; }
        });
        card.append(meta, poem, label, details, button); $('#gallery-list').append(card);
      }
    } catch { $('#gallery-message').textContent = '저장된 문장을 읽지 못했어요. 브라우저 저장 권한을 확인하고 다시 열어주세요.'; }
  };
  $('#guest-gallery-open').addEventListener('click', showGallery);
  $('#gallery-close').addEventListener('click', () => gallery.close());
  $('#gallery-refresh').addEventListener('click', showGallery);
  $('#gallery-export').addEventListener('click', async () => {
    try {
      const entries = await store.list();
      if (backupUrl) URL.revokeObjectURL(backupUrl);
      backupUrl = URL.createObjectURL(new Blob([JSON.stringify({format:'music-gwamolip',version:1,entries}, null, 2)], {type:'application/json'}));
      const link = $('#gallery-download'); link.href = backupUrl; link.download = `음악과몰입-${new Date().toISOString().slice(0,10)}.json`; link.hidden = false;
    } catch { $('#gallery-message').textContent = '백업 파일을 만들지 못했어요. 다시 시도해주세요.'; }
  });
  for (const dialog of [gallery, saving]) dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
}
