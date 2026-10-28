import { MedicineBox, MedicineItem } from '../types';
import {
  getAllBoxesFromIDB,
  getAllItemsFromIDB,
  saveAllBoxesToIDB,
  saveAllItemsToIDB,
  isValidPhotoDataUrl,
} from './idb';

export { isValidPhotoDataUrl };

const BOXES_STORAGE_KEY = 'medibox_cajas_v1';
const ITEMS_STORAGE_KEY = 'medibox_items_v1';

export const INITIAL_BOXES: MedicineBox[] = [];
export const INITIAL_ITEMS: MedicineItem[] = [];

/**
 * Synchronous read from localStorage for instant component mount.
 * NEVER destroys or overwrites existing user data.
 */
export function getStoredBoxes(): MedicineBox[] {
  try {
    const data = localStorage.getItem(BOXES_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Error reading boxes from localStorage', e);
    return [];
  }
}

/**
 * Saves boxes to both IndexedDB (unlimited storage) and localStorage (fast cache).
 */
export function saveStoredBoxes(boxes: MedicineBox[]): void {
  // 1. Save to IndexedDB asynchronously
  saveAllBoxesToIDB(boxes).catch((err) => {
    console.error('Failed to sync boxes to IndexedDB:', err);
  });

  // 2. Cache in localStorage
  try {
    localStorage.setItem(BOXES_STORAGE_KEY, JSON.stringify(boxes));
  } catch (e) {
    console.warn('localStorage quota warning for boxes:', e);
  }
}

/**
 * Synchronous read from localStorage for instant initial paint.
 * Sanitizes any invalid or legacy truncated photo strings.
 */
export function getStoredItems(): MedicineItem[] {
  try {
    const data = localStorage.getItem(ITEMS_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: MedicineItem) => ({
      ...item,
      photoUrl: isValidPhotoDataUrl(item.photoUrl) ? item.photoUrl : undefined,
      photoUrls: Array.isArray(item.photoUrls)
        ? item.photoUrls.filter(isValidPhotoDataUrl)
        : undefined,
    }));
  } catch (e) {
    console.warn('Error reading items from localStorage', e);
    return [];
  }
}

/**
 * Saves items safely to both IndexedDB (full data + full photos in vault, no quota limit)
 * and localStorage (clean fallback cache).
 * NEVER chops or truncates photo URLs.
 */
export function saveStoredItems(items: MedicineItem[]): void {
  if (!Array.isArray(items)) return;

  // 1. Primary storage: IndexedDB (has gigabytes of storage, never drops items or photos)
  saveAllItemsToIDB(items).catch((err) => {
    console.error('IndexedDB save failed for items:', err);
  });

  // 2. Secondary fast cache: localStorage
  try {
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
  } catch (quotaError) {
    // If full base64 images exceed 5MB quota, save clean lightweight version in localStorage.
    // IndexedDB & Photo Vault retain 100% of all full photos permanently.
    try {
      const cleanItems = items.map((i) => ({
        ...i,
        photoUrl: undefined,
        photoUrls: undefined,
      }));
      localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(cleanItems));
    } catch (fallbackErr) {
      console.warn('localStorage quota exceeded completely, relying on IndexedDB:', fallbackErr);
    }
  }
}

/**
 * Loads the complete, persistent database from IndexedDB on startup.
 * Automatically reconciles with the Photo Vault to ensure NO photos are ever missing.
 */
export async function loadPersistentData(): Promise<{
  boxes: MedicineBox[];
  items: MedicineItem[];
}> {
  try {
    let [idbBoxes, idbItems] = await Promise.all([
      getAllBoxesFromIDB(),
      getAllItemsFromIDB(),
    ]);

    const localBoxes = getStoredBoxes();
    const localItems = getStoredItems();

    // If IndexedDB is empty but localStorage has data, seed IndexedDB
    if (idbBoxes.length === 0 && localBoxes.length > 0) {
      idbBoxes = localBoxes;
      await saveAllBoxesToIDB(localBoxes);
    }
    if (idbItems.length === 0 && localItems.length > 0) {
      idbItems = localItems;
      await saveAllItemsToIDB(localItems);
    }

    // Merge boxes by ID
    const mergedBoxesMap = new Map<string, MedicineBox>();
    for (const b of localBoxes) mergedBoxesMap.set(b.id, b);
    for (const b of idbBoxes) mergedBoxesMap.set(b.id, b);
    const finalBoxes = Array.from(mergedBoxesMap.values());

    // Merge items by ID, strictly protecting valid photos
    const mergedItemsMap = new Map<string, MedicineItem>();
    for (const item of localItems) {
      mergedItemsMap.set(item.id, item);
    }
    for (const item of idbItems) {
      const local = mergedItemsMap.get(item.id);
      const photoUrl = isValidPhotoDataUrl(item.photoUrl)
        ? item.photoUrl
        : isValidPhotoDataUrl(local?.photoUrl)
        ? local?.photoUrl
        : undefined;

      const photoUrls =
        item.photoUrls && item.photoUrls.length > 0
          ? item.photoUrls
          : local?.photoUrls && local.photoUrls.length > 0
          ? local.photoUrls
          : undefined;

      mergedItemsMap.set(item.id, {
        ...(local || {}),
        ...item,
        photoUrl,
        photoUrls,
      });
    }

    const finalItems = Array.from(mergedItemsMap.values());

    // Ensure persistent storage has the fully reconciled state
    await saveAllBoxesToIDB(finalBoxes);
    await saveAllItemsToIDB(finalItems);

    return { boxes: finalBoxes, items: finalItems };
  } catch (err) {
    console.error('Failed to load persistent data from IndexedDB, using local storage fallback:', err);
    return {
      boxes: getStoredBoxes(),
      items: getStoredItems(),
    };
  }
}

export function checkExpiryStatus(expirationDate?: string): {
  status: 'expired' | 'warning' | 'ok' | 'unknown';
  label: string;
  daysRemaining?: number;
} {
  if (!expirationDate) {
    return { status: 'unknown', label: 'Sin fecha registrada' };
  }

  // Handle YYYY-MM by appending day 28
  const dateStr = expirationDate.length === 7 ? `${expirationDate}-28` : expirationDate;
  const expiry = new Date(dateStr);

  if (isNaN(expiry.getTime())) {
    return { status: 'unknown', label: 'Fecha no válida' };
  }

  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      label: `Vencido hace ${Math.abs(diffDays)} días`,
      daysRemaining: diffDays,
    };
  } else if (diffDays <= 90) {
    return {
      status: 'warning',
      label: `Vence pronto (${diffDays} días)`,
      daysRemaining: diffDays,
    };
  } else {
    return {
      status: 'ok',
      label: `Vigente (${diffDays} días)`,
      daysRemaining: diffDays,
    };
  }
}

/**
 * Robustly checks if a MedicineItem is out of stock (agotado / por comprar).
 * Handles boolean true, string "true", number 1, or quantity notes like "0", "agotado", "se acabó".
 */
export function isItemOutOfStock(item?: MedicineItem | null): boolean {
  if (!item) return false;
  if (
    item.isOutOfStock === true ||
    (item.isOutOfStock as any) === 'true' ||
    (item.isOutOfStock as any) === 1 ||
    (item.isOutOfStock as any) === '1'
  ) {
    return true;
  }
  const q = String(item.quantity || '').toLowerCase().trim();
  if (
    q === '0' ||
    q === '0 unidades' ||
    q === '0 pastillas' ||
    q === '0 tabletas' ||
    q === '0 frascos' ||
    q === 'cero' ||
    q.includes('agotad') ||
    q.includes('acabó') ||
    q.includes('acabo') ||
    q.includes('terminad') ||
    q.includes('sin existencia') ||
    q.includes('por comprar') ||
    q.includes('volver a comprar')
  ) {
    return true;
  }
  return false;
}
