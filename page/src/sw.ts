import { precacheAndRoute } from 'workbox-precaching'

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void
}
interface FetchEvent extends ExtendableEvent {
  readonly request: Request
  respondWith(response: Promise<Response> | Response): void
}
interface PushMessageData {
  json(): unknown
  text(): string
}
interface PushEvent extends ExtendableEvent {
  readonly data?: PushMessageData
}
interface NotificationEvent extends ExtendableEvent {
  readonly notification: Notification
}
interface WindowClient {
  url: string
  focus(): Promise<unknown>
  postMessage(message: unknown): void
}
interface Clients {
  matchAll(options?: {
    type?: string
    includeUncontrolled?: boolean
  }): Promise<readonly WindowClient[]>
  claim(): Promise<void>
  openWindow(url: string): Promise<WindowClient | null>
}
interface ServiceWorkerGlobalScope {
  addEventListener(type: string, listener: (event: Event) => void): void
  skipWaiting(): void
  clients: Clients
  registration: ServiceWorkerRegistration
  __WB_MANIFEST: unknown
}

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision?: string | null }>
}

const sw = self as unknown as ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

const APP_CACHE = 'obsidian-notifier-v6'
const BASE = '/RemindAir'
const APP_SHELL = [`${BASE}/`, `${BASE}/manifest.webmanifest`]

sw.addEventListener('install', event => {
  const installEvent = event as ExtendableEvent
  installEvent.waitUntil(caches.open(APP_CACHE).then((cache: Cache) => cache.addAll(APP_SHELL)))
  sw.skipWaiting()
})

sw.addEventListener('activate', event => {
  const activateEvent = event as ExtendableEvent

  activateEvent.waitUntil(
    caches
      .keys()
      .then((keys: string[]) =>
        Promise.all(keys.filter(key => key !== APP_CACHE).map(key => caches.delete(key)))
      )
  )
  sw.clients.claim()
})

sw.addEventListener('fetch', event => {
  const fetchEvent = event as FetchEvent
  if (fetchEvent.request.method !== 'GET') return

  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then((cachedResponse: Response | undefined) => {
      if (cachedResponse) return cachedResponse
      return fetch(fetchEvent.request)
    })
  )
})

sw.addEventListener('push', event => {
  const pushEvent = event as PushEvent
  let payload: Record<string, unknown> = {}

  try {
    const parsed = pushEvent.data ? pushEvent.data.json() : {}
    if (parsed && typeof parsed === 'object') payload = parsed as Record<string, unknown>
  } catch {
    payload = { body: pushEvent.data?.text() || 'New reminder' }
  }

  const title = typeof payload.title === 'string' ? payload.title : 'Reminder'
  const body =
    typeof payload.body === 'string'
      ? payload.body
      : "New reminder, maybe it's something important? ;)"
  const url = typeof payload.url === 'string' ? payload.url : `${BASE}/`

  pushEvent.waitUntil(
    (async () => {
      try {
        await sw.registration.showNotification(title, {
          body,
          data: { url },
          // icon: `${BASE}/check.jpg`,
          // badge: `${BASE}/check.jpg`,
        })
      } catch (err) {
        console.error('showNotification failed:', err)
      }

      try {
        const clients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
        clients.forEach(client => {
          client.postMessage({ type: 'PUSH_RECEIVED', title, body, url })
        })
      } catch {
        // intentionally ignore - notification is already shown
      }
    })()
  )
})

// sw.addEventListener('push', event => {
//   const pushEvent = event as PushEvent
//   let payload: Record<string, unknown> = {}

//   try {
//     const parsed = pushEvent.data ? pushEvent.data.json() : {}
//     if (parsed && typeof parsed === 'object') payload = parsed as Record<string, unknown>
//   } catch {
//     payload = { body: pushEvent.data?.text() || 'New reminder' }
//   }

//   const title = typeof payload.title === 'string' ? payload.title : 'Reminder'
//   const body =
//     typeof payload.body === 'string'
//       ? payload.body
//       : "New reminder, maybe it's something important? ;)"
//   // Should be a deeplink to Obsidian
//   const url = typeof payload.url === 'string' ? payload.url : `${BASE}/`

//   pushEvent.waitUntil(
//     Promise.all([
//       sw.registration.showNotification(title, {
//         body,
//         data: { url },
//         icon: `${BASE}/check.jpg`,
//         badge: `${BASE}/check.jpg`,
//       }),
//       sw.clients
//         .matchAll({ type: 'window', includeUncontrolled: true })
//         .then((clients: readonly WindowClient[]) => {
//           clients.forEach((client: WindowClient) => {
//             client.postMessage({ type: 'PUSH_RECEIVED', title, body, url })
//           })
//         }),
//     ])
//   )
// })

sw.addEventListener('notificationclick', event => {
  const notificationEvent = event as NotificationEvent
  notificationEvent.notification.close()

  const notificationData = notificationEvent.notification?.data as { url?: unknown } | undefined
  const targetUrl = typeof notificationData?.url === 'string' ? notificationData.url : `${BASE}/`

  notificationEvent.waitUntil(
    sw.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients: readonly WindowClient[]) => {
        for (const client of clients) {
          const clientUrl = new URL(client.url)
          if (clientUrl.pathname.startsWith(BASE) && 'focus' in client) return client.focus()
        }

        if (sw.clients.openWindow) return sw.clients.openWindow(targetUrl)

        return undefined
      })
  )
})
