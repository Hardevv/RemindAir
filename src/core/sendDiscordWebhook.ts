import { REDIRECTION_PAGE_URL } from '../consts'
import { logger } from '../logger'
import type { Reminder } from '../types'
import { cleanReminderContent, getFeatureFlags, getObsidianAdvancedUriBlockLink } from '../utils'

const { sentReminderContent, sendObsidianLink } = getFeatureFlags()

export const sentDiscordWebhook = async ({
  vaultName,
  filePath,
  id,
  content,
}: Reminder<string>) => {
  if (!id) throw new Error('Reminder id is missing')
  const obsidianLink = getObsidianAdvancedUriBlockLink(vaultName, filePath, id)
  const title = sentReminderContent
    ? `🔔 Reminder: ${cleanReminderContent(content)}`
    : '🔔 You have a reminder'
  const url = sendObsidianLink
    ? `${REDIRECTION_PAGE_URL}?deeplink=${encodeURIComponent(obsidianLink)}`
    : undefined

  try {
    const response = await fetch(process.env.DISCORD_WEBHOOK_URL || '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title,
            url,
            footer: { text: `${filePath} | Click the link above to open Obsidian` },
            color: 0x7e48e7,
          },
        ],
      }),
    })
    if (response.ok) logger.info(`Sent webhook for reminder with id ${id}`)
  } catch (err) {
    logger.error(`Failed to send webhook for reminder with id ${id}: ${(err as Error).message}`)
  }
}
