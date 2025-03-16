const cacheName = 'tc-coin-v1';
const assetsToCache = [
  '/tc-coin/',
  '/tc-coin/index.html',
  '/tc-coin/app.js',
  '/tc-coin/manifest.json',
  '/tc-coin/images/coin-tc-blockchain-512x512.webp',
  '/tc-coin/images/coin-tc-blockchain-192x192.webp',
  '/tc-coin/images/qr-bg-tc-blockchain-300x300.webp'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName)
      .then((cache) => {
        console.log('[ServiceWorker] Caching assets:', assetsToCache);
        return cache.addAll(assetsToCache);
      })
      .then(() => self.skipWaiting())
      .catch((error) => console.error('[ServiceWorker] Cache install failed:', error))
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== cacheName) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return; // Only cache GET requests

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone and cache valid response
            const responseClone = networkResponse.clone();
            caches.open(cacheName).then((cache) => {
              cache.put(event.request, responseClone);
            });

            return networkResponse;
          });
      })
      .catch(() => caches.match('/tc-coin/index.html')) // Offline fallback
  );
});
