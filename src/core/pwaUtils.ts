import { existsSync, readFileSync, writeFileSync } from 'fs'
import webpush, { type PushSubscription } from 'web-push'
import { PUSH_SUBSCRIPTIONS_PATH, VAPID_KEYS_PATH } from '../consts'
import { logger } from '../logger'
import type { VapidKeys } from '../types'

const generateVapidKeys = () => {
  const keys = webpush.generateVAPIDKeys()
  writeFileSync(VAPID_KEYS_PATH, JSON.stringify(keys, null, 2))
  return keys
}

const getVapidKeys = () => {
  if (!existsSync(VAPID_KEYS_PATH)) {
    logger.error('VAPID keys file not found')
    return null
  }

  try {
    const vapidKeys = readFileSync(VAPID_KEYS_PATH, 'utf-8')
    return JSON.parse(vapidKeys) as VapidKeys
  } catch (error) {
    logger.error(`Failed to parse VAPID keys: ${(error as Error).message}`)
    return null
  }
}

export const initVapidKeys = () => {
  let vapidKeys
  if (existsSync(VAPID_KEYS_PATH)) {
    const vk = getVapidKeys()
    if (vk) vapidKeys = vk
  } else {
    const vk = generateVapidKeys()
    if (vk) vapidKeys = vk
  }

  if (!vapidKeys) return
  const isDev = process.env.ENV === 'dev'
  // port from package.json
  const pwaUrl = `${isDev ? 'http://localhost:5500/notifications' : process.env.PWA_URL}/notifications?pubKey=${vapidKeys.publicKey}`

  webpush.setVapidDetails(
    'https://hardevv.github.io/RemindAir',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  )
  logger.info(
    `All configured. Now open this link on each device you'd like to receive notifications on and accept notifications receiving: ${pwaUrl}`
  )
}

export const parseSubscriptionsFile = (): PushSubscription[] => {
  try {
    const pushSubscriptions = readFileSync(PUSH_SUBSCRIPTIONS_PATH, 'utf-8')
    if (!pushSubscriptions.trim()) return []

    const parsed = JSON.parse(pushSubscriptions) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter(subscription => {
      return (
        !!subscription &&
        typeof subscription === 'object' &&
        'endpoint' in subscription &&
        typeof (subscription as { endpoint: unknown }).endpoint === 'string'
      )
    }) as PushSubscription[]
  } catch (error) {
    logger.error(`Failed to parse ${PUSH_SUBSCRIPTIONS_PATH}: ${(error as Error).message}`)
    return []
  }
}
