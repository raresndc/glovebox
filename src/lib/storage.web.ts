// expo-sqlite on web needs wasm + cross-origin isolation headers; localStorage is enough here.
export function readItem(key: string) {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage full or blocked (private mode); keep working in memory.
  }
}
