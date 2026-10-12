const memory = new Map<string, string>();

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      const s = getStorage();
      if (s) return s.getItem(key);
    } catch {
      /* fall through to memory */
    }
    return memory.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    memory.set(key, value);
    try {
      getStorage()?.setItem(key, value);
    } catch {
      /* quota / blocked — memory copy still works for this session */
    }
  },
  removeItem(key: string): void {
    memory.delete(key);
    try {
      getStorage()?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
