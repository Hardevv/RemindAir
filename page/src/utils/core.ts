import { LOCAL_STORAGE_VAPID_KEY } from '../consts'

const waitForSwReady = (timeoutMs = 8000) =>
  Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Service Worker ready timeout')), timeoutMs)
    ),
  ])

/** It registers or returns already registered sw registration, it also do update check */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator))
    throw new Error('Service workers are not supported in this browser.')

  const swRegistration = await navigator.serviceWorker.register('sw.js', {
    scope: '/',
  })
  await waitForSwReady()

  return swRegistration
}

export const getExistingSubscription = async (swRegistration: ServiceWorkerRegistration | null) => {
  if (!swRegistration) return null
  return swRegistration.pushManager.getSubscription()
}

export const unsubscribeFromPush = async (
  swRegistration: ServiceWorkerRegistration
): Promise<boolean> => {
  const subscription = await swRegistration.pushManager.getSubscription()
  if (!subscription) return false

  await subscription.unsubscribe()
  return true
}

export const requestNotificationPermission = async () => {
  const result = await Notification.requestPermission()
  if (result !== 'granted') throw new Error('Notification permission was not granted.')
}

export const removeSavedVAPIDKey = (
  setPubVapidKey: (key: string | null) => void,
  swRegistration: ServiceWorkerRegistration | null
) => {
  localStorage.removeItem(LOCAL_STORAGE_VAPID_KEY)
  setPubVapidKey(null)
  if (swRegistration) unsubscribeFromPush(swRegistration)
  window.location.replace(window.location.href.split('?')[0])
}

export const urlBase64ToUint8Array = (base64String: string): Uint8Array<ArrayBuffer> => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i)

  return outputArray
}
