const CACHE_NAME = 'slr-water-pwa-v3';
const ASSETS = [
  './',
  './index.html',
  './mobile.css',
  './manifest.webmanifest'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const dest = req.destination;
  const isNav = req.mode === 'navigate' || dest === 'document';
  const isCritical = dest === 'style' || dest === 'script';

  if (isNav || isCritical) {
    // Network-first for HTML and CSS/JS to avoid stale UI/CSS
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
  } else {
    // Cache-first for other assets (icons, images, etc.)
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
