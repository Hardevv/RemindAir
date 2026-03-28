import { logger } from '../logger'
import { getData, saveData, validateStringReminder } from '../utils'
import { sentDiscordWebhook } from './sendDiscordWebhook'

export const checkPastRemindersAndSend = async () => {
  const now = new Date()
  const data = getData()

  for (const reminder of data.reminders) {
    if (!validateStringReminder(reminder)) {
      logger.error({ reminder }, 'Invalid reminder format')
      continue
    }
    const diff = now.getTime() - new Date(reminder.dateTime).getTime()

    if (diff >= 0 && !reminder.sent && reminder.id && !reminder.deleted) {
      const index = data.reminders.findIndex(r => r.id === reminder.id)
      try {
        await sentDiscordWebhook(reminder)
        data.reminders[index].sent = true
        saveData(data)
      } catch {
        logger.error(`Failed to send reminder with id ${reminder.id}`)
      }
    }
  }
}
