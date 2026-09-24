import { createStrudelCode } from './music-engine.js';

export const GUESTBOOK_DB = 'music-gwamolip-guestbook';
export const GUESTBOOK_VERSION = 1;

// Only replay snapshots our compiler can reproduce. Never evaluate arbitrary
// stored JavaScript (e.g. a modified browser database or a future import).
export function validateSnapshot(snapshot) {
  try {
    if (!snapshot || typeof snapshot.text !== 'string' || !snapshot.text.trim() || snapshot.text.length > 180) return false;
    const a = snapshot.analysis;
    if (!a || a.text !== snapshot.text.trim() || !/^[A-G](?:#|b)?$/u.test(a.root)) return false;
    if (!['major', 'minor'].includes(a.scale) || !Number.isFinite(a.seed) || !Number.isFinite(a.bpm)) return false;
    if (!Number.isInteger(snapshot.variation) || snapshot.variation < 0) return false;
    if (!['auto', 'on', 'off'].includes(snapshot.beat?.mode) || !Number.isFinite(snapshot.beat.intensity) || snapshot.beat.intensity < 0 || snapshot.beat.intensity > 1) return false;
    if (!Array.isArray(a.tokens) || a.tokens.length > 180 || !a.tokens.every((word) => typeof word === 'string')) return false;
    if (!Array.isArray(a.tokenMeanings) || a.tokenMeanings.length > 180 || !Array.isArray(a.concepts)) return false;
    if (!['warmth','motion','light','space','softness','tension'].every((axis) => Number.isFinite(a.axes?.[axis]))) return false;
    if (!Array.isArray(a.syntax?.words) || !Array.isArray(a.syntax?.edges) || a.syntax.words.length > 180 || a.syntax.edges.length > 1000) return false;
    if (!a.tokenMeanings.every((word) => typeof word.token === 'string' && Array.isArray(word.conceptIds) && word.traits)) return false;
    if (!Array.isArray(a.layers?.farTokens) || !Array.isArray(a.layers?.nearTokens)) return false;
    if (JSON.stringify(snapshot).length > 500000) return false;
    return typeof snapshot.code === 'string' && snapshot.code === createStrudelCode(a, snapshot.beat);
  } catch { return false; }
}

export function createGuestbookEntry(snapshot, author, id = crypto.randomUUID(), createdAt = new Date().toISOString()) {
  if (!validateSnapshot(snapshot)) throw new Error('문장을 다 입력한 뒤 다시 저장해주세요.');
  return {id, version:GUESTBOOK_VERSION, createdAt, author:author.trim().slice(0, 32) || '이름 없는 독자', snapshot:structuredClone(snapshot)};
}

export class GuestbookStore {
  constructor(indexedDB = globalThis.indexedDB) { this.indexedDB = indexedDB; }
  open() {
    if (!this.database) {
      this.database = new Promise((resolve, reject) => {
        if (!this.indexedDB) { reject(new Error('이 브라우저에서 로컬 저장을 사용할 수 없어요.')); return; }
        const request = this.indexedDB.open(GUESTBOOK_DB, 1);
        request.onupgradeneeded = () => request.result.createObjectStore('entries', {keyPath:'id'});
        request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); this.database = null; }; resolve(request.result); };
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('다른 방명록 탭을 닫고 다시 시도해주세요.'));
      }).catch((error) => { this.database = null; throw error; });
    }
    return this.database;
  }
  async save(entry) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('entries', 'readwrite');
      tx.objectStore('entries').add(entry); // Append only: never overwrite a visitor's work.
      tx.oncomplete = () => resolve(entry);
      tx.onabort = tx.onerror = () => reject(tx.error || new Error('저장 공간을 확인해주세요.'));
    });
  }
  async list() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('entries', 'readonly');
      const request = tx.objectStore('entries').getAll();
      tx.oncomplete = () => resolve(request.result.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
      tx.onabort = tx.onerror = () => reject(tx.error);
    });
  }
}
