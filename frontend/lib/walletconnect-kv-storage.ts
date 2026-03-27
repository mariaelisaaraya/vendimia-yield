import type { IKeyValueStorage } from "@walletconnect/keyvaluestorage";
import { safeJsonParse, safeJsonStringify } from "@walletconnect/safe-json";

function createMemoryStorage() {
  const mem = new Map<string, unknown>();
  return {
    getKeys: async () => [...mem.keys()],
    getEntries: async () => [...mem.entries()],
    getItem: async (key: string) => mem.get(key),
    setItem: async (key: string, value: unknown) => {
      mem.set(key, value);
    },
    removeItem: async (key: string) => {
      mem.delete(key);
    },
  } as IKeyValueStorage;
}

function createBrowserLocalStorage() {
  return {
    getKeys: async () => Object.keys(localStorage),
    getEntries: async () =>
      Object.entries(localStorage).map(([k, v]) => [k, safeJsonParse(v)]),
    getItem: async (key: string) => {
      const raw = localStorage.getItem(key);
      if (raw === null) return undefined;
      return safeJsonParse(raw);
    },
    setItem: async (key: string, value: unknown) => {
      localStorage.setItem(key, safeJsonStringify(value));
    },
    removeItem: async (key: string) => {
      localStorage.removeItem(key);
    },
  } as IKeyValueStorage;
}

/**
 * WalletConnect’s default storage migrates to IndexedDB. For SSR (Node) and to
 * avoid IndexedDB entirely, we use in-memory on the server and localStorage in the browser.
 */
export const walletConnectKeyValueStorage: IKeyValueStorage =
  typeof window === "undefined"
    ? createMemoryStorage()
    : createBrowserLocalStorage();
