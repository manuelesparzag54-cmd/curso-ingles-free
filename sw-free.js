// Service Worker for Inglés Básico Gratis (index-free.html)
// Cache name — bump the version string to force a cache refresh on update
const CACHE_NAME = 'curso-ingles-free-v3';

// Core assets to pre-cache on install
// NOTE: Vercel serves index-free.html as the root index, so we cache both
// '/' and '/index.html' so offline navigation always has a valid shell to fall back to.
const ASSETS = [
  '/',
  '/index.html',
  '/manifest-free.json'
];

// ── Install: pre-cache core assets ──────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// ── Activate: delete any old caches from previous versions ──────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ── Fetch: network-first with cache fallback ────────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('/')))
  );
});
