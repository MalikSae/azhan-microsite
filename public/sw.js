/* eslint-disable no-restricted-globals */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `azhan-microsite-${self.location.hostname}-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add('/'))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(`azhan-microsite-${self.location.hostname}-`) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Navigasi memakai network-first agar data paket dan status brand tetap baru.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  // Asset statis boleh cache-first. API dan endpoint brand tidak ikut dicache.
  const destination = request.destination;
  if (!['script', 'style', 'font', 'image'].includes(destination)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const update = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
      return cached || update;
    }),
  );
});
