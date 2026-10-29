import Storage from 'expo-sqlite/kv-store';

export function readItem(key: string) {
  try {
    return Storage.getItemSync(key);
  } catch {
    return null;
  }
}

export function writeItem(key: string, value: string) {
  Storage.setItem(key, value).catch(() => {});
}
