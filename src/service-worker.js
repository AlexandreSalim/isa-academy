const CACHE_NAME = 'isa-academy-v1';
const RUNTIME = 'runtime';

// on install: cache minimal shell if you want
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// on activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// runtime caching: try cache first, then network and update cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // ignore chrome devtools requests
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // don't cache opaque responses (cross-origin without CORS)
          if (!response || response.status !== 200 || response.type === 'opaque') return response;
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => {
          // optional: return fallback page/image for navigation or images
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
