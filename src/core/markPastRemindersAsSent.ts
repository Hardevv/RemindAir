import { logger } from '../logger'
import type { Reminder } from '../types'
import { getData, getFeatureFlags, saveData, validateStringReminder } from '../utils'

const { initPastDatesAsSent } = getFeatureFlags()

/** Run once at start - find all reminders with past date and `sent: false`, and mark them as sent to avoid mass old reminders sent at start.
 * Can be disabled via `FEATURE_INIT_PAST_DATES_AS_SENT` env variable */
export const markPastRemindersAsSent = () => {
  if (!initPastDatesAsSent) return
  const now = new Date()
  const data = getData()
  const changed: Reminder<string>[] = []

  const mappedReminders = data.reminders.map(reminder => {
    if (!validateStringReminder(reminder)) return
    const diff = now.getTime() - new Date(reminder.dateTime).getTime()

    if (diff >= 0 && !reminder.sent) {
      changed.push(reminder)
      return { ...reminder, sent: true }
    }
    return reminder
  })

  if (changed.length === 0) return

  data.reminders = mappedReminders.filter(Boolean) as Reminder<string>[]
  saveData(data)

  logger.info(
    `Marked ${changed.length} past reminders as sent on startup to avoid sending notifications for them.
Marked reminders:
${changed.map((r, i) => `${i} -> ${r.content}`).join('\n')} 
    `
  )
}
