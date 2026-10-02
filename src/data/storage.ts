const memoryStore = new Map<string, string>();

export class LocalStorageClient {
  private static isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  static get<T>(key: string, defaultValue: T): T {
    try {
      let item: string | null = null;
      if (this.isAvailable()) {
        item = window.localStorage.getItem(key);
      } else {
        item = memoryStore.get(key) ?? null;
      }
      if (item === null || item === undefined) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      if (this.isAvailable()) {
        window.localStorage.setItem(key, serialized);
      }
      memoryStore.set(key, serialized);
    } catch (e) {
      console.error(`[LocalStorageClient] Failed to write key: ${key}`, e);
    }
  }

  static remove(key: string): void {
    try {
      if (this.isAvailable()) {
        window.localStorage.removeItem(key);
      }
      memoryStore.delete(key);
    } catch (e) {
      console.error(`[LocalStorageClient] Failed to remove key: ${key}`, e);
    }
  }

  static clear(): void {
    try {
      if (this.isAvailable()) {
        window.localStorage.clear();
      }
      memoryStore.clear();
    } catch {}
  }
}
