import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";

// Vitest 4 on Node 22+ exposes an experimental global `localStorage` (active via
// `--localstorage-file`) whose methods throw without a backing file. This
// shadows jsdom's storage for code reading the *bare* global — notably persisted
// Zustand stores, whose default `createJSONStorage(() => localStorage)` captures
// the storage eagerly at store-module load. Install a deterministic in-memory
// Web Storage implementation on both `window` and `globalThis` so persistence
// works regardless of how the reference is resolved. Tests that replace
// `window.localStorage` themselves still override this.
function createMemoryStorage(): Storage {
  let store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store = new Map();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  } as Storage;
}

for (const target of [globalThis, globalThis.window]) {
  if (!target) continue;
  for (const name of ["localStorage", "sessionStorage"] as const) {
    Object.defineProperty(target, name, {
      configurable: true,
      writable: true,
      value: createMemoryStorage(),
    });
  }
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
