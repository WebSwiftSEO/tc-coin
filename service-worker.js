const cacheName = 'tc-coin-v1';
const assets = [
    '/Tc-Coin/',
    '/Tc-Coin/index.html',
    '/Tc-Coin/images/coin-tc-blockchain-512x512.webp',
    '/Tc-Coin/images/qr-bg-tc-blockchain-300x300.webp'
];
self.addEventListener('install', e => {
    e.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)));
});
self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
