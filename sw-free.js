const CACHE_NAME = 'curso-ingles-free-v4';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest-free.json'
];

// Install: cache assets individually so one failure doesn't abort the whole install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url, err))
        )
      )
    )
  );
  self.skipWaiting();
});

// Activate: delete all old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first, fall back to cache, fall back to root
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          // For navigation requests, return the cached root shell
          if (event.request.mode === 'navigate') {
            return caches.match('/') || caches.match('/index.html');
          }
        })
      )
  );
});
