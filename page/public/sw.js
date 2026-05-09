/* eslint-disable no-undef */
// Service Worker with custom push notification handling
const APP_CACHE = 'obsidian-notifier-v8'
const BASE = '/'
const APP_SHELL = [`${BASE}`, `${BASE}manifest.webmanifest`]

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter(key => key !== APP_CACHE).map(key => caches.delete(key)))
      )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse
      return fetch(event.request)
    })
  )
})

self.addEventListener('push', event => {
  let payload = {}

  try {
    const parsed = event.data ? event.data.json() : {}
    if (parsed && typeof parsed === 'object') payload = parsed
  } catch {
    payload = { body: event.data?.text() || 'New reminder' }
  }

  const title = typeof payload.title === 'string' ? payload.title : 'Reminder'
  const body =
    typeof payload.body === 'string'
      ? payload.body
      : "New reminder, maybe it's something important? ;)"
  const url = typeof payload.url === 'string' ? payload.url : `${BASE}`

  event.waitUntil(
    (async () => {
      try {
        await self.registration.showNotification(title, {
          body,
          data: { url },
          icon: `${BASE}check.jpg`,
          badge: `${BASE}check.jpg`,
        })
      } catch (err) {
        console.error('showNotification failed:', err)
      }

      try {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        clients.forEach(client => {
          client.postMessage({ type: 'PUSH_RECEIVED', title, body, url })
        })
      } catch {
        console.error('Failed to send message to clients about received push')
      }
    })()
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const notificationData = event.notification?.data
  const targetUrl = typeof notificationData?.url === 'string' ? notificationData.url : `${BASE}`

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          const clientUrl = new URL(client.url)
          if (clientUrl.pathname.startsWith(BASE) && 'focus' in client) return client.focus()
        }

        if (self.clients.openWindow) return self.clients.openWindow(targetUrl)

        return undefined
      })
  )
})
