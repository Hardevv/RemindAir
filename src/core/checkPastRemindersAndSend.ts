import { logger } from '../logger'
import { getData, getFeatureFlags, saveData, validateStringReminder } from '../utils'
import { sentDiscordWebhook } from './sendDiscordWebhook'
import { sendWebPush } from './sendWebPush'

const { pwaNotifications, discordNotifications } = getFeatureFlags()

export const checkPastRemindersAndSend = async () => {
  const now = new Date()
  const data = getData()

  for (const [index, reminder] of data.reminders.entries()) {
    if (!validateStringReminder(reminder)) {
      logger.error({ reminder }, 'Invalid reminder format')
      continue
    }
    const diff = now.getTime() - new Date(reminder.dateTime).getTime()

    if (diff >= 0 && !reminder.sent && reminder.id && !reminder.deleted) {
      try {
        const sendPromises = [
          discordNotifications ? sentDiscordWebhook(reminder) : Promise.resolve(),
          pwaNotifications ? sendWebPush(reminder) : Promise.resolve(),
        ]
        await Promise.all(sendPromises)
        data.reminders[index].sent = true
        saveData(data)
      } catch {
        logger.error(`Failed to send reminder with id ${reminder.id}`)
      }
    }
  }
}
