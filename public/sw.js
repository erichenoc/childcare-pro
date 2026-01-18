// ChildCare Pro - Service Worker for Push Notifications
// Version: 1.0.0

const CACHE_NAME = 'childcare-pro-v1'
const OFFLINE_URL = '/offline.html'

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  // Take control of all clients immediately
  self.clients.claim()
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  let notificationData = {
    title: 'ChildCare Pro',
    body: 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'default',
    data: { url: '/dashboard/notifications' },
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || payload.type || 'default',
        data: {
          url: payload.url || payload.data?.url || '/dashboard/notifications',
          ...payload.data,
        },
        // Additional options
        requireInteraction: payload.priority === 'urgent' || payload.priority === 'high',
        vibrate: payload.vibrate || [200, 100, 200],
        actions: payload.actions || getDefaultActions(payload.type),
      }
    } catch (e) {
      console.error('[SW] Error parsing push data:', e)
      notificationData.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
      actions: notificationData.actions,
    })
  )
})

// Get default actions based on notification type
function getDefaultActions(type) {
  switch (type) {
    case 'attendance':
      return [
        { action: 'view', title: 'Ver Asistencia', icon: '/icons/view.png' },
        { action: 'dismiss', title: 'Cerrar', icon: '/icons/close.png' },
      ]
    case 'incident':
      return [
        { action: 'view', title: 'Ver Reporte', icon: '/icons/view.png' },
        { action: 'sign', title: 'Firmar', icon: '/icons/sign.png' },
      ]
    case 'billing':
      return [
        { action: 'pay', title: 'Pagar Ahora', icon: '/icons/pay.png' },
        { action: 'view', title: 'Ver Factura', icon: '/icons/view.png' },
      ]
    case 'emergency':
      return [
        { action: 'call', title: 'Llamar', icon: '/icons/phone.png' },
        { action: 'view', title: 'Ver Detalles', icon: '/icons/view.png' },
      ]
    default:
      return [
        { action: 'view', title: 'Ver', icon: '/icons/view.png' },
        { action: 'dismiss', title: 'Cerrar', icon: '/icons/close.png' },
      ]
  }
}

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag)
  event.notification.close()

  const notificationData = event.notification.data || {}
  let targetUrl = notificationData.url || '/dashboard/notifications'

  // Handle action clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
        // Use the URL from notification data
        break
      case 'pay':
        targetUrl = '/dashboard/billing'
        break
      case 'sign':
        if (notificationData.incidentId) {
          targetUrl = `/dashboard/incidents/${notificationData.incidentId}`
        }
        break
      case 'call':
        if (notificationData.phone) {
          targetUrl = `tel:${notificationData.phone}`
        }
        break
      case 'dismiss':
        return // Just close the notification
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag)
  // Could send analytics here
})

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return

  // Skip API requests
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response for caching
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })
        return response
      })
      .catch(() => {
        // Return from cache if network fails
        return caches.match(event.request).then((response) => {
          if (response) {
            return response
          }
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        })
      })
  )
})

// Sync event - for background sync (future use)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications())
  }
})

async function syncNotifications() {
  // Future: sync offline notification reads
  console.log('[SW] Syncing notifications...')
}

// Message event - handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME)
  }
})

console.log('[SW] Service worker loaded')
