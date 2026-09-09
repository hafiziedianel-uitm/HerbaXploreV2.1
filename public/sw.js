const CACHE_NAME = 'herba-xplorer-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/uitm-logo.png',
  '/arabic-acid-2d.svg',
  '/sterculia-polysaccharide-2d.svg',
  'https://3Dmol.org/build/3Dmol-min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell...');
      // Use toAll or allow failures gracefully for dynamic things
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[Service Worker] Shell caching warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip POST and third-party scripts that might fail to cache or need bypass
  if (event.request.method !== 'GET') return;
  
  // We handle molecular structures, standard API proxies, and local files
  const shouldCache = 
    requestUrl.origin === self.location.origin ||
    requestUrl.hostname.includes('files.rcsb.org') ||
    requestUrl.hostname.includes('pubchem.ncbi.nlm.nih.gov') ||
    requestUrl.hostname.includes('3Dmol.org') ||
    requestUrl.hostname.includes('picsum.photos');

  if (!shouldCache) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and refresh in background (stale-while-revalidate pattern for fast layout)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Network failure is expected when offline, enjoy cached asset
          });
        return cachedResponse;
      }

      // Network first
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
            return networkResponse;
          }

          // Cache valid resources
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch((error) => {
          console.warn('[Service Worker] Network request failed and no cache hit for:', event.request.url);
          // Return offline fallback if it's a page or molecule model
          return caches.match('/');
        });
    })
  );
});
