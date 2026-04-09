import { logger } from '../logger'
import { getData, saveData, validateStringReminder } from '../utils'
import { sentDiscordWebhook } from './sendDiscordWebhook'
import { sendWebPush } from './sendWebPush'

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
        // TODO: create flag to turn off one method of sending if user doesn't want both
        await Promise.all([sentDiscordWebhook(reminder), sendWebPush(reminder)])
        data.reminders[index].sent = true
        saveData(data)
      } catch {
        logger.error(`Failed to send reminder with id ${reminder.id}`)
      }
    }
  }
}
