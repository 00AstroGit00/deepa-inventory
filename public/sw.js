// Service Worker for Deepa Inventory PWA
const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `deepa-inventory-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const OFFLINE_URL = '/offline.html';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// Maximum size for dynamic cache (50 items)
const MAX_DYNAMIC_CACHE_SIZE = 50;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('deepa-inventory-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: trim dynamic cache
async function trimDynamicCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const keys = await cache.keys();
  if (keys.length > MAX_DYNAMIC_CACHE_SIZE) {
    await cache.delete(keys[0]);
    return trimDynamicCache();
  }
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network-first with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache successful GET API responses for offline viewing
          if (networkResponse.ok && request.method === 'GET') {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
              trimDynamicCache();
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Try cache for offline support
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              // Add offline header
              const response = cachedResponse.clone();
              const headers = new Headers(response.headers);
              headers.set('X-Deepa-Offline', 'true');
              return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
              });
            }
            // Return offline error for API
            return new Response(
              JSON.stringify({ error: 'Offline - API unavailable', offline: true }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // Static assets and navigation - cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached, update in background (stale-while-revalidate)
        event.waitUntil(
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, networkResponse.clone());
                });
              }
            })
            .catch(() => {}) // Ignore background update errors
        );
        return cachedResponse;
      }

      // Not in cache - fetch from network
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            // Cache static assets
            if (request.mode === 'navigate' || url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            } else {
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
                trimDynamicCache();
              });
            }
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          // For other resources, return a basic offline response
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [200, 100, 200],
      tag: 'deepa-notification',
      renotify: true,
    });
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background sync for offline mutations (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'deepa-sync') {
    event.waitUntil(syncOfflineMutations());
  }
});

async function syncOfflineMutations() {
  // Placeholder for future offline mutation sync
  console.log('[SW] Background sync triggered');
}

// Handle message from clients (e.g., skip waiting)
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'getVersion') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});