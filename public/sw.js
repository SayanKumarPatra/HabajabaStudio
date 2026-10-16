// Habajaba Studio LIVE — High-Performance Service Worker with Cache-First Image & Metadata Strategy
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `habajaba-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `habajaba-images-cache-${CACHE_VERSION}`;
const METADATA_CACHE = `habajaba-metadata-cache-${CACHE_VERSION}`;

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/banner-hero.svg',
  '/banner-default.svg',
  '/youtube-official-logo.svg',
  '/youtube-full-logo.svg'
];

// Offline fallback image SVG
const OFFLINE_IMAGE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="100%" height="100%" fill="#1E1E24"/>
  <circle cx="200" cy="180" r="60" fill="#2E2E38"/>
  <path d="M185 155 L225 180 L185 205 Z" fill="#ED1025"/>
  <text x="200" y="275" font-family="sans-serif" font-weight="bold" font-size="16" fill="#FFFFFF" text-anchor="middle">Habajaba Studio Offline</text>
  <text x="200" y="300" font-family="sans-serif" font-size="12" fill="#8E8E98" text-anchor="middle">Cached Media Ready</text>
</svg>
`;

// 1. Install Event — Pre-cache critical application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Some precache assets failed:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event — Clean up stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, IMAGE_CACHE, METADATA_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Deleting legacy cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Check if a request is for an image
function isImageRequest(request, url) {
  if (request.destination === 'image') return true;
  const path = url.pathname.toLowerCase();
  const isImageExt = /\.(png|jpg|jpeg|svg|webp|gif|ico|avif)(\?.*)?$/.test(path);
  const isImageHost = url.hostname.includes('unsplash.com') ||
                      url.hostname.includes('firebasestorage.googleapis.com') ||
                      url.hostname.includes('googleusercontent.com') ||
                      url.hostname.includes('dropboxusercontent.com');
  return isImageExt || isImageHost;
}

// 3. Fetch Event — Cache-First for Images, Stale-While-Revalidate for Assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET and chrome-extension / internal requests
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // A. CACHE-FIRST Strategy for Artist Images, Album Artwork & Banners
  if (isImageRequest(request, url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        // 1. Check Image Cache first
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Optional: Revalidate in background if online
          if (navigator.onLine) {
            fetch(request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
            }).catch(() => {/* ignore background revalidation errors */});
          }
          return cachedResponse;
        }

        // 2. Cache Miss: Fetch from network and store for offline
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (fetchErr) {
          console.warn('[SW] Offline image fallback triggered for:', request.url);
          // 3. Fallback to offline SVG for images when disconnected
          return new Response(OFFLINE_IMAGE_SVG, {
            headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' }
          });
        }
      })
    );
    return;
  }

  // B. Navigation Requests (HTML / App Shell) — Network First with Offline Fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cachedIndex = await cache.match('/index.html') || await cache.match('/');
        return cachedIndex || new Response('Offline - Habajaba Studio LIVE', {
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }

  // C. Static Scripts, Styles & Fonts — Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheName = url.origin === location.origin ? STATIC_CACHE : METADATA_CACHE;
          caches.open(cacheName).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, return cached response if present
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
