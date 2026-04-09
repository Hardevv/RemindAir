import webpush, { type PushSubscription } from 'web-push'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { PUSH_SUBSCRIPTIONS_PATH, REDIRECTION_PAGE_URL, VAPID_KEYS_PATH } from '../consts'
import { logger } from '../logger'
import type { Reminder, VapidKeys } from '../types'
import {
  cleanReminderContent,
  getFeatureFlags,
  getObsidianAdvancedUriBlockLink,
  writeSubscriptionsFile,
} from '../utils'

const { sentReminderContent, sendObsidianLink } = getFeatureFlags()

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
  const pwaUrl = `${isDev ? 'http://localhost:5500/notifications' : process.env.PWA_URL}?pubKey=${vapidKeys.publicKey}`

  //TODO: investigate what to do whit that emial thing
  webpush.setVapidDetails('mailto:you@example.com', vapidKeys.publicKey, vapidKeys.privateKey)
  logger.info(
    `All configured. Now open this link on each device you'd like to receive notifications on and accept notifications receiving: ${pwaUrl}`
  )
}

const parseSubscriptionsFile = (): PushSubscription[] => {
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

export const sendWebPush = async ({ vaultName, filePath, id, content }: Reminder<string>) => {
  if (!id) throw new Error('Reminder id is missing')

  const subscriptions = parseSubscriptionsFile()
  if (subscriptions.length === 0) return

  const obsidianLink = sendObsidianLink
    ? getObsidianAdvancedUriBlockLink(vaultName, filePath, id)
    : null

  const redirectionBase =
    process.env.ENV === 'dev' ? 'http://localhost:5500/redirection' : REDIRECTION_PAGE_URL

  // TODO: it should not have redirection page url if it's send to PWA, pwa should just redirect
  const url = obsidianLink
    ? `${redirectionBase}?deeplink=${encodeURIComponent(obsidianLink)}`
    : undefined

  const payload = {
    title: sentReminderContent
      ? `🔔 Reminder: ${cleanReminderContent(content)}`
      : '🔔 You have a reminder',
    body: `${filePath}`,
    url,
  }

  // keep dead endpoints to remove them from the file. It happens when user uninstall PWA, etc.
  const deadEndpoint = new Set<string>()

  await Promise.all(
    subscriptions.map(async subscription => {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload))
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          deadEndpoint.add(subscription.endpoint)
          return
        }

        logger.error(`Failed to send web push for reminder ${id}: ${(error as Error).message}`)
      }
    })
  )

  if (deadEndpoint.size > 0) {
    const filtered = subscriptions.filter(subscription => !deadEndpoint.has(subscription.endpoint))
    writeSubscriptionsFile(filtered)
    logger.info(
      `Removed ${deadEndpoint.size} stale push subscription(s) from ${PUSH_SUBSCRIPTIONS_PATH}`
    )
  }
}
