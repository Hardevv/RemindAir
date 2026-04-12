import webpush from 'web-push'
import { PUSH_SUBSCRIPTIONS_PATH } from '../consts'
import { logger } from '../logger'
import type { Reminder } from '../types'
import {
  cleanReminderContent,
  getFeatureFlags,
  getObsidianAdvancedUriBlockLink,
  writeSubscriptionsFile,
} from '../utils'
import { parseSubscriptionsFile } from './pwaUtils'

const { sentReminderContent, sendObsidianLink } = getFeatureFlags()

export const sendWebPush = async ({ vaultName, filePath, id, content }: Reminder<string>) => {
  if (!id) throw new Error('Reminder id is missing')

  const subscriptions = parseSubscriptionsFile()
  if (subscriptions.length === 0) return

  const obsidianLink = sendObsidianLink
    ? getObsidianAdvancedUriBlockLink(vaultName, filePath, id)
    : null

  const redirectionBase =
    process.env.ENV === 'dev'
      ? 'http://localhost:5500/redirection'
      : `${process.env.PWA_URL}/redirection`

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
        logger.error(`Failed to send web push for reminder ${id}: ${(error as Error).message}`)

        if (statusCode === 404 || statusCode === 410) {
          deadEndpoint.add(subscription.endpoint)
          return
        }
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
