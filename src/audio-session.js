// A playback-only website: do not request a microphone or select a capture route.
// This is a compatibility hint, not control over iOS system screen recording.
export function configurePlaybackSession(navigatorLike = globalThis.navigator) {
  try {
    if (!navigatorLike?.audioSession) return false;
    navigatorLike.audioSession.type = 'playback';
    return true;
  } catch { return false; }
}
