import { MedicineBox, MedicineItem } from '../types';

const DB_NAME = 'MediboxPersistentDB';
const DB_VERSION = 2;
const STORE_ITEMS = 'items';
const STORE_BOXES = 'boxes';
const STORE_PHOTOS = 'photos';

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Checks if a string is a genuine, uncorrupted base64 image data URL.
 * Detects and rejects truncated strings (e.g. "..."), empty strings, or non-image data.
 */
export function isValidPhotoDataUrl(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  if (!str.startsWith('data:image/')) return false;
  if (str.endsWith('...')) return false;
  if (str.length < 500) return false; // Any valid medicine photo is at least a few kilobytes
  return true;
}

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
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'itemId' });
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

/**
 * Fetches all photos saved in the dedicated photo vault.
 */
export async function getPhotosFromVault(): Promise<
  Map<string, { photoUrl?: string; photoUrls?: string[] }>
> {
  const photoMap = new Map<string, { photoUrl?: string; photoUrls?: string[] }>();
  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
      return photoMap;
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result || []) as Array<{
          itemId: string;
          photoUrl?: string;
          photoUrls?: string[];
        }>;
        for (const r of records) {
          if (r && r.itemId) {
            const validMain = isValidPhotoDataUrl(r.photoUrl) ? r.photoUrl : undefined;
            const validList = Array.isArray(r.photoUrls)
              ? r.photoUrls.filter(isValidPhotoDataUrl)
              : undefined;
            if (validMain || (validList && validList.length > 0)) {
              photoMap.set(r.itemId, {
                photoUrl: validMain || (validList ? validList[0] : undefined),
                photoUrls: validList,
              });
            }
          }
        }
        resolve(photoMap);
      };

      req.onerror = () => {
        console.warn('Could not read from photo vault:', req.error);
        resolve(photoMap);
      };
    });
  } catch (err) {
    console.warn('Error accessing photo vault:', err);
    return photoMap;
  }
}

/**
 * Saves photos directly to the permanent photo vault store.
 */
export async function savePhotosToVault(
  records: Array<{ itemId: string; photoUrl?: string; photoUrls?: string[] }>
): Promise<void> {
  if (!records || records.length === 0) return;
  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(STORE_PHOTOS)) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORE_PHOTOS);

      for (const r of records) {
        if (!r.itemId) continue;
        const validMain = isValidPhotoDataUrl(r.photoUrl) ? r.photoUrl : undefined;
        const validList = Array.isArray(r.photoUrls)
          ? r.photoUrls.filter(isValidPhotoDataUrl)
          : undefined;

        if (validMain || (validList && validList.length > 0)) {
          store.put({
            itemId: r.itemId,
            photoUrl: validMain || (validList ? validList[0] : undefined),
            photoUrls: validList,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.warn('Error in photo vault transaction:', tx.error);
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('Failed to save to photo vault:', err);
  }
}

/**
 * Retrieves all medicines from IndexedDB with photos fully restored from the photo vault.
 */
export async function getAllItemsFromIDB(): Promise<MedicineItem[]> {
  try {
    const db = await openDatabase();
    const [rawItems, photoVault] = await Promise.all([
      new Promise<MedicineItem[]>((resolve) => {
        const tx = db.transaction(STORE_ITEMS, 'readonly');
        const store = tx.objectStore(STORE_ITEMS);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => {
          console.error('Error fetching items from IDB:', req.error);
          resolve([]);
        };
      }),
      getPhotosFromVault(),
    ]);

    // Reconcile items with the permanent photo vault
    const completeItems: MedicineItem[] = rawItems.map((item) => {
      let finalPhotoUrl = isValidPhotoDataUrl(item.photoUrl) ? item.photoUrl : undefined;
      let finalPhotoUrls = Array.isArray(item.photoUrls)
        ? item.photoUrls.filter(isValidPhotoDataUrl)
        : undefined;

      const vaulted = photoVault.get(item.id);
      if (vaulted) {
        if (!finalPhotoUrl && vaulted.photoUrl) {
          finalPhotoUrl = vaulted.photoUrl;
        }
        if ((!finalPhotoUrls || finalPhotoUrls.length === 0) && vaulted.photoUrls) {
          finalPhotoUrls = vaulted.photoUrls;
        }
      }

      if (!finalPhotoUrl && finalPhotoUrls && finalPhotoUrls.length > 0) {
        finalPhotoUrl = finalPhotoUrls[0];
      }

      return {
        ...item,
        photoUrl: finalPhotoUrl,
        photoUrls: finalPhotoUrls && finalPhotoUrls.length > 0 ? finalPhotoUrls : undefined,
      };
    });

    return completeItems;
  } catch (err) {
    console.error('IndexedDB open error in getAllItemsFromIDB:', err);
    return [];
  }
}

/**
 * Saves all medicine items safely to IndexedDB.
 * NEVER strips or overwrites existing photos with empty/corrupted strings.
 * Stores photos in both the item record and the dedicated photo vault.
 */
export async function saveAllItemsToIDB(items: MedicineItem[]): Promise<void> {
  if (!Array.isArray(items)) return;

  try {
    const db = await openDatabase();

    // 1. Gather existing photos so we never overwrite an existing photo with blank/undefined
    const existingVault = await getPhotosFromVault();

    // 2. Prepare items with safeguarded photos
    const photosToVault: Array<{ itemId: string; photoUrl?: string; photoUrls?: string[] }> = [];
    const sanitizedItems: MedicineItem[] = [];

    for (const item of items) {
      if (!item || !item.id) continue;

      let photoUrl = isValidPhotoDataUrl(item.photoUrl) ? item.photoUrl : undefined;
      let photoUrls = Array.isArray(item.photoUrls)
        ? item.photoUrls.filter(isValidPhotoDataUrl)
        : undefined;

      const existing = existingVault.get(item.id);

      // If incoming photo was lost or truncated, restore from vault
      if (!photoUrl && existing?.photoUrl) {
        photoUrl = existing.photoUrl;
      }
      if ((!photoUrls || photoUrls.length === 0) && existing?.photoUrls) {
        photoUrls = existing.photoUrls;
      }

      if (!photoUrl && photoUrls && photoUrls.length > 0) {
        photoUrl = photoUrls[0];
      }

      if (photoUrl || (photoUrls && photoUrls.length > 0)) {
        photosToVault.push({
          itemId: item.id,
          photoUrl,
          photoUrls,
        });
      }

      sanitizedItems.push({
        ...item,
        photoUrl,
        photoUrls: photoUrls && photoUrls.length > 0 ? photoUrls : undefined,
      });
    }

    // 3. Save to photo vault first (immutable photo storage)
    if (photosToVault.length > 0) {
      await savePhotosToVault(photosToVault);
    }

    // 4. Save items to items store
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);

      // Clear old items list and write current items list
      store.clear();

      for (const item of sanitizedItems) {
        store.put(item);
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
    return new Promise<MedicineBox[]>((resolve) => {
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
  if (!Array.isArray(boxes)) return;

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
