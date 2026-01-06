const CACHE_NAME = 'collectr-v3';

// Dateien die immer gecacht werden
const STATIC_ASSETS = [
  '/',
  '/collections',
  '/offline',
];

// Install: Static Assets cachen
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Push Notification empfangen
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.data?.tag || 'default',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CollectR', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Prüfe ob App schon offen ist
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Neues Fenster öffnen
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Activate: Alte Caches löschen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Background Sync für Offline-Änderungen
const SYNC_TAG = 'collectr-sync';
const PENDING_REQUESTS_KEY = 'collectr-pending-requests';

// Speichere fehlgeschlagene POST/PUT/DELETE Requests für später
async function saveFailedRequest(request) {
  try {
    const clonedRequest = request.clone();
    const body = await clonedRequest.text();

    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now()
    };

    // In IndexedDB speichern
    const db = await openSyncDB();
    const tx = db.transaction('pending', 'readwrite');
    await tx.store.add(requestData);
    await tx.done;

    // Background Sync registrieren
    if ('sync' in self.registration) {
      await self.registration.sync.register(SYNC_TAG);
    }
  } catch (e) {
    console.error('Error saving failed request:', e);
  }
}

// IndexedDB für Pending Requests
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('collectr-sync-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Background Sync Handler
self.addEventListener('sync', async (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(processPendingRequests());
  }
});

// Verarbeite gespeicherte Requests
async function processPendingRequests() {
  try {
    const db = await openSyncDB();
    const tx = db.transaction('pending', 'readonly');
    const requests = await tx.store.getAll();
    await tx.done;

    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.method !== 'GET' ? requestData.body : undefined
        });

        if (response.ok) {
          // Erfolg - Request aus DB löschen
          const deleteTx = db.transaction('pending', 'readwrite');
          await deleteTx.store.delete(requestData.id);
          await deleteTx.done;
        }
      } catch (e) {
        console.log('Sync failed for request, will retry:', requestData.url);
      }
    }
  } catch (e) {
    console.error('Error processing pending requests:', e);
  }
}

// Fetch: Network-first mit Cache-Fallback und Offline-Queue
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // POST/PUT/DELETE Requests: Bei Offline speichern für später
  if (request.method !== 'GET' && url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request.clone())
        .catch(async (error) => {
          // Offline - Request für Background Sync speichern
          await saveFailedRequest(request);

          // Optimistische Response zurückgeben
          return new Response(
            JSON.stringify({
              offline: true,
              message: 'Änderung wird synchronisiert sobald du wieder online bist'
            }),
            {
              status: 202,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Nur GET-Requests cachen
  if (request.method !== 'GET') return;

  // API-Calls nicht cachen (Supabase)
  if (url.hostname.includes('supabase')) return;

  // Statische Assets: Cache-first
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        });
      })
    );
    return;
  }

  // HTML-Seiten: Network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Erfolgreiche Antwort cachen
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone);
        });
        return response;
      })
      .catch(() => {
        // Offline: Aus Cache oder Offline-Seite
        return caches.match(request).then((cached) => {
          return cached || caches.match('/offline');
        });
      })
  );
});
