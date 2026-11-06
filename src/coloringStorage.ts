import {
  LEGACY_STORAGE_KEY,
  parseLegacyArtwork,
  type LegacyArtwork,
} from "./legacyColoring";
export type Progress = {
  id: string;
  colors: string[];
  revision: string;
  updated: number;
};
const DB = "rybka-coloring-v3";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 2);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("pages"))
        req.result.createObjectStore("pages", { keyPath: "id" });
      if (!req.result.objectStoreNames.contains("legacy"))
        req.result.createObjectStore("legacy", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function request<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
  storeName = "pages",
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    let tx: IDBTransaction, req: IDBRequest<T>;
    try {
      tx = db.transaction(storeName, mode);
      req = run(tx.objectStore(storeName));
    } catch (error) {
      db.close();
      reject(error);
      return;
    }
    let result: T;
    req.onsuccess = () => {
      result = req.result;
    };
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export const readProgress = (id: string) =>
  request<Progress | undefined>("readonly", (s) => s.get(id));
export const listProgress = () =>
  request<IDBValidKey[]>("readonly", (s) => s.getAllKeys());
export const writeProgress = (entry: Progress) =>
  request<IDBValidKey>("readwrite", (s) => s.put(entry));

type StoredLegacyArtwork = {
  id: string;
  bytes?: ArrayBuffer;
  image?: Blob;
  updated: number;
};
export async function readLegacyArtwork(
  id: string,
): Promise<LegacyArtwork | undefined> {
  const entry = await request<StoredLegacyArtwork | undefined>(
    "readonly",
    (s) => s.get(id),
    "legacy",
  );
  if (!entry) return undefined;
  const image =
    entry.bytes instanceof ArrayBuffer
      ? new Blob([entry.bytes], { type: "image/png" })
      : entry.image;
  return image instanceof Blob
    ? { id: entry.id, image, updated: entry.updated }
    : undefined;
}
export const listLegacyArtwork = () =>
  request<IDBValidKey[]>("readonly", (s) => s.getAllKeys(), "legacy");
/** Copy originals before converting them. Never delete or overwrite the old storage. */
export async function importLegacyArtwork(
  onError?: (id: string) => void,
): Promise<string[]> {
  const existing = (await listLegacyArtwork()).map(String);
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return existing;
  }
  const entries = parseLegacyArtwork(raw);
  for (const entry of entries)
    if (!existing.includes(entry.id)) {
      try {
        // Typed bytes also work in WebKit implementations that cannot persist Blob handles.
        const stored = {
          id: entry.id,
          updated: entry.updated,
          bytes: await entry.image.arrayBuffer(),
        };
        await request<IDBValidKey>(
          "readwrite",
          (store) => store.put(stored),
          "legacy",
        );
        existing.push(entry.id);
      } catch {
        onError?.(entry.id);
      }
    }
  return existing;
}

export function restoreColors(
  progress: unknown,
  revision: string,
  count: number,
): string[] | null {
  if (!progress || typeof progress !== "object") return null;
  const saved = progress as Partial<Progress>;
  if (
    saved.revision !== revision ||
    !Array.isArray(saved.colors) ||
    saved.colors.length !== count ||
    !saved.colors.every(
      (color) => typeof color === "string" && /^#[\da-f]{6}$/i.test(color),
    )
  )
    return null;
  return saved.colors;
}
