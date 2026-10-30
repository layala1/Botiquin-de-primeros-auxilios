const CACHE_NAME = 'botiquin-cache-v2';
const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_PRECACHE).catch((err) => {
        console.warn('PWA Precache warning (non-fatal):', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Deleting outdated cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper: fetch with timeout so slow/sleeping server doesn't freeze the page
function fetchWithTimeout(request, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('Network timeout'));
    }, timeoutMs);

    fetch(request, { signal: controller.signal })
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Offline-First and Stale-While-Revalidate Fetch Handler
self.addEventListener('fetch', (event) => {
  // Pass non-GET and AI API calls directly to live network
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    // For page navigation: try network with quick 2s timeout.
    // If server is sleeping (Cloud Run scale-to-zero) or offline, serve cached page instantly!
    event.respondWith(
      fetchWithTimeout(event.request, 2000)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return caches.match('/').then((rootCached) => {
              if (rootCached) return rootCached;
              return caches.match('/index.html');
            });
          });
        })
    );
    return;
  }

  // For all scripts, styles, modules, and assets: Stale-While-Revalidate
  // Return cached asset immediately for zero latency; update cache in background when network is available.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch((err) => {
          // If offline and not in cache, let caller handle or return fallback
          if (!cachedResponse) {
            console.warn('Network failed and asset not in cache:', event.request.url, err);
          }
        });

      // If already cached, return immediately from local storage (0ms startup on phone!)
      // If not yet in cache, wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
