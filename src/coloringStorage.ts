export type Progress = {
  id: string;
  colors: string[];
  revision: string;
  updated: number;
};
const DB = "rybka-coloring-v3";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("pages", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function request<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pages", mode),
      req = run(tx.objectStore("pages"));
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
