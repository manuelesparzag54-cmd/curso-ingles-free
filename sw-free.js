// Service Worker for Inglés Básico Gratis (index-free.html)
// Cache name — bump the version string to force a cache refresh on update
const CACHE_NAME = 'curso-ingles-free-v2';

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

// ── Fetch: navigation-first for page requests, cache-first for assets ────────
self.addEventListener('fetch', event => {
  // Only handle GET requests; skip non-http(s) schemes (chrome-extension, etc.)
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // For full-page navigations, try network first then fall back to cached shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/').then(r => r || caches.match('/index.html'))
      )
    );
    return;
  }

  // For all other requests (CSS, JS, images, fonts): cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Not in cache — fetch from network and cache for next time
      return fetch(event.request)
        .then(response => {
          // Only cache valid responses (status 200, basic/cors)
          if (
            response.ok &&
            (response.type === 'basic' || response.type === 'cors')
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
    })
  );
});
