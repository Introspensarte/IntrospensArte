
const CACHE_NAME = 'introspensarte-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const API_CACHE = 'api-v2';

const urlsToCache = [
  '/',
  '/portal',
  '/dashboard',
  '/activities',
  '/rankings',
  '/news',
  '/announcements',
  '/notifications',
  '/profile',
  '/upload',
  '/admin',
  '/offline',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// Network-first strategy for API calls
const API_URLS = [
  '/api/',
  '/api/auth/',
  '/api/activities',
  '/api/users',
  '/api/rankings',
  '/api/news',
  '/api/announcements',
  '/api/notifications'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(urlsToCache);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // API requests - Network first with cache fallback
  if (API_URLS.some(apiUrl => url.pathname.startsWith(apiUrl))) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Static resources - Cache first
  if (urlsToCache.includes(url.pathname) || 
      url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Other requests - Network first with cache fallback
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Network-first strategy
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline') || new Response('Offline', { 
        status: 503, 
        statusText: 'Service Unavailable' 
      });
    }
    
    return new Response('Network error', { 
      status: 408, 
      statusText: 'Request Timeout' 
    });
  }
}

// Cache-first strategy
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network and cache failed:', error);
    return new Response('Resource not available', { 
      status: 404, 
      statusText: 'Not Found' 
    });
  }
}

// Background Sync - for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'upload-activity':
      event.waitUntil(syncUploadActivity());
      break;
    case 'sync-notifications':
      event.waitUntil(syncNotifications());
      break;
    case 'sync-user-data':
      event.waitUntil(syncUserData());
      break;
    case 'submit-comment':
      event.waitUntil(syncComments());
      break;
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

// Periodic Background Sync - for regular updates
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'update-content':
      event.waitUntil(periodicContentUpdate());
      break;
    case 'sync-rankings':
      event.waitUntil(periodicRankingsSync());
      break;
    case 'cleanup-cache':
      event.waitUntil(periodicCacheCleanup());
      break;
    default:
      console.log('Unknown periodic sync tag:', event.tag);
  }
});

// Background sync functions
async function syncUploadActivity() {
  try {
    const pendingUploads = await getStoredData('pendingUploads');
    
    for (const upload of pendingUploads || []) {
      try {
        const response = await fetch('/api/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(upload.data)
        });
        
        if (response.ok) {
          await removeStoredData('pendingUploads', upload.id);
          console.log('Activity uploaded successfully:', upload.id);
        }
      } catch (error) {
        console.error('Failed to sync activity:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function syncNotifications() {
  try {
    const user = await getStoredData('currentUser');
    if (!user) return;
    
    const response = await fetch(`/api/notifications/${user.id}`);
    if (response.ok) {
      const notifications = await response.json();
      await storeData('notifications', notifications);
      console.log('Notifications synced');
    }
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}

async function syncUserData() {
  try {
    const user = await getStoredData('currentUser');
    if (!user) return;
    
    const response = await fetch(`/api/users/${user.id}/refresh-stats`, {
      method: 'POST'
    });
    
    if (response.ok) {
      const userData = await response.json();
      await storeData('currentUser', userData);
      console.log('User data synced');
    }
  } catch (error) {
    console.error('Failed to sync user data:', error);
  }
}

async function syncComments() {
  try {
    const pendingComments = await getStoredData('pendingComments');
    
    for (const comment of pendingComments || []) {
      try {
        const response = await fetch('/api/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(comment.data)
        });
        
        if (response.ok) {
          await removeStoredData('pendingComments', comment.id);
          console.log('Comment synced successfully:', comment.id);
        }
      } catch (error) {
        console.error('Failed to sync comment:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync comments:', error);
  }
}

// Periodic sync functions
async function periodicContentUpdate() {
  try {
    // Update news
    const newsResponse = await fetch('/api/news');
    if (newsResponse.ok) {
      const news = await newsResponse.json();
      await storeData('news', news);
    }
    
    // Update announcements
    const announcementsResponse = await fetch('/api/announcements');
    if (announcementsResponse.ok) {
      const announcements = await announcementsResponse.json();
      await storeData('announcements', announcements);
    }
    
    console.log('Content updated periodically');
  } catch (error) {
    console.error('Periodic content update failed:', error);
  }
}

async function periodicRankingsSync() {
  try {
    const [tracesResponse, wordsResponse] = await Promise.all([
      fetch('/api/rankings/traces'),
      fetch('/api/rankings/words')
    ]);
    
    if (tracesResponse.ok) {
      const tracesRanking = await tracesResponse.json();
      await storeData('tracesRanking', tracesRanking);
    }
    
    if (wordsResponse.ok) {
      const wordsRanking = await wordsResponse.json();
      await storeData('wordsRanking', wordsRanking);
    }
    
    console.log('Rankings synced periodically');
  } catch (error) {
    console.error('Periodic rankings sync failed:', error);
  }
}

async function periodicCacheCleanup() {
  try {
    const cacheNames = await caches.keys();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    for (const cacheName of cacheNames) {
      if (cacheName === DYNAMIC_CACHE || cacheName === API_CACHE) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          const dateHeader = response?.headers.get('date');
          
          if (dateHeader) {
            const responseDate = new Date(dateHeader);
            if (Date.now() - responseDate.getTime() > maxAge) {
              await cache.delete(request);
            }
          }
        }
      }
    }
    
    console.log('Cache cleanup completed');
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  let notificationData = {
    title: 'IntrospensArte',
    body: 'Nueva notificación',
    type: 'general',
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    image: notificationData.image,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    silent: false,
    data: {
      dateOfArrival: Date.now(),
      type: notificationData.type,
      url: notificationData.url || '/notifications',
      actionUrl: notificationData.actionUrl
    },
    actions: [
      {
        action: 'view', 
        title: 'Ver',
        icon: '/icon-192.png'
      },
      {
        action: 'close', 
        title: 'Cerrar',
        icon: '/icon-192.png'
      }
    ],
    tag: notificationData.type || 'general',
    renotify: true,
    timestamp: Date.now()
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notificationData.title, options),
      // Store notification for offline access
      storeData('lastNotification', {
        ...notificationData,
        timestamp: Date.now()
      })
    ])
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  event.notification.close();
  
  const notificationData = event.notification.data;
  let urlToOpen = notificationData.url || '/notifications';
  
  if (event.action === 'view' || !event.action) {
    if (notificationData.actionUrl) {
      urlToOpen = notificationData.actionUrl;
    }
    
    event.waitUntil(
      clients.matchAll({ 
        type: 'window',
        includeUncontrolled: true 
      }).then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
  
  // Track notification interaction
  event.waitUntil(
    fetch('/api/notifications/interaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: event.action || 'click',
        type: notificationData.type,
        timestamp: Date.now()
      })
    }).catch(error => console.error('Failed to track notification interaction:', error))
  );
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
    case 'STORE_DATA':
      storeData(data.key, data.value);
      break;
    case 'REGISTER_BACKGROUND_SYNC':
      self.registration.sync.register(data.tag);
      break;
    case 'REQUEST_PERIODIC_SYNC':
      requestPeriodicSync(data.tag, data.minInterval);
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// IndexedDB helper functions
async function storeData(key, data) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    await store.put({ key, data, timestamp: Date.now() });
  } catch (error) {
    console.error('Failed to store data:', error);
  }
}

async function getStoredData(key) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');
    const result = await store.get(key);
    return result?.data;
  } catch (error) {
    console.error('Failed to get stored data:', error);
    return null;
  }
}

async function removeStoredData(key, id) {
  try {
    const data = await getStoredData(key);
    if (data && Array.isArray(data)) {
      const updated = data.filter(item => item.id !== id);
      await storeData(key, updated);
    }
  } catch (error) {
    console.error('Failed to remove stored data:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('IntrospensArteDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data', { keyPath: 'key' });
      }
    };
  });
}

// Request periodic sync (requires user permission)
async function requestPeriodicSync(tag, minInterval = 24 * 60 * 60 * 1000) {
  try {
    const status = await self.registration.periodicSync.register(tag, {
      minInterval: minInterval
    });
    console.log('Periodic sync registered:', tag);
  } catch (error) {
    console.error('Periodic sync registration failed:', error);
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker loaded successfully');
