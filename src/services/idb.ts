import { MedicineBox, MedicineItem } from '../types';

const DB_NAME = 'MediboxPersistentDB';
const DB_VERSION = 1;
const STORE_ITEMS = 'items';
const STORE_BOXES = 'boxes';

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BOXES)) {
        db.createObjectStore(STORE_BOXES, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Failed to open IndexedDB:', (event.target as IDBOpenDBRequest).error);
      dbPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

export async function getAllItemsFromIDB(): Promise<MedicineItem[]> {
  try {
    const db = await openDatabase();
    return new Promise<MedicineItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readonly');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.getAll();

      req.onsuccess = () => {
        const result = req.result || [];
        resolve(result);
      };

      req.onerror = () => {
        console.error('Error fetching items from IDB:', req.error);
        resolve([]);
      };
    });
  } catch (err) {
    console.error('IndexedDB open error in getAllItemsFromIDB:', err);
    return [];
  }
}

export async function saveAllItemsToIDB(items: MedicineItem[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);

      // Clear existing and rewrite clean full set to avoid ghost items
      store.clear();

      for (const item of items) {
        if (item && item.id) {
          store.put(item);
        }
      }

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        console.error('Error in saveAllItemsToIDB transaction:', tx.error);
        reject(tx.error);
      };
    });
  } catch (err) {
    console.error('Failed to save items to IndexedDB:', err);
  }
}

export async function getAllBoxesFromIDB(): Promise<MedicineBox[]> {
  try {
    const db = await openDatabase();
    return new Promise<MedicineBox[]>((resolve, reject) => {
      const tx = db.transaction(STORE_BOXES, 'readonly');
      const store = tx.objectStore(STORE_BOXES);
      const req = store.getAll();

      req.onsuccess = () => {
        resolve(req.result || []);
      };

      req.onerror = () => {
        console.error('Error fetching boxes from IDB:', req.error);
        resolve([]);
      };
    });
  } catch (err) {
    console.error('IndexedDB open error in getAllBoxesFromIDB:', err);
    return [];
  }
}

export async function saveAllBoxesToIDB(boxes: MedicineBox[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_BOXES, 'readwrite');
      const store = tx.objectStore(STORE_BOXES);

      store.clear();
      for (const box of boxes) {
        if (box && box.id) {
          store.put(box);
        }
      }

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        console.error('Error in saveAllBoxesToIDB transaction:', tx.error);
        reject(tx.error);
      };
    });
  } catch (err) {
    console.error('Failed to save boxes to IndexedDB:', err);
  }
}
