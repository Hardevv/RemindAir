import { logger } from '../logger'
import type { Data, Reminder } from '../types'
import { reminderExistInCache, saveData, validateDateReminder } from '../utils'

export const handleNewReminders = (
  cachedReminders: Reminder<string>[],
  remindersFromObsidian: Reminder<Date>[],
  data: Data
) => {
  const newReminders: Reminder<string>[] = []

  for (const rfo of remindersFromObsidian) {
    if (!rfo.id) continue
    if (!validateDateReminder(rfo)) continue
    const existsInCache = cachedReminders.some(cachedReminder =>
      reminderExistInCache(cachedReminder, rfo)
    )
    if (existsInCache) continue
    newReminders.push({ ...rfo, dateTime: rfo.dateTime.toISOString() })
  }

  logger.info(`Found ${newReminders.length} new reminders`)

  if (newReminders.length === 0) return

  data.reminders = [...cachedReminders, ...newReminders]
  saveData(data)
}
