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

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheName)
            .then((cache) => {
                console.log('Caching assets:', assetsToCache);
                return cache.addAll(assetsToCache);
            })
            .then(() => self.skipWaiting())
            .catch((error) => console.error('Cache install failed:', error))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== cacheName) {
                    console.log('Removing old cache:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) return response;
                return fetch(event.request)
                    .then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200 || event.request.method !== 'GET') return networkResponse;
                        const responseToCache = networkResponse.clone();
                        caches.open(cacheName).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                        return networkResponse;
                    })
                    .catch(() => caches.match('/tc-coin/index.html')) // Fallback to index.html for offline
            })
            .catch((error) => console.error('Fetch error:', error))
    );
});
