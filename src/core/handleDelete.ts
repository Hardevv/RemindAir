import { logger } from '../logger'
import type { Data, Reminder } from '../types'
import { reminderExistInCache, saveData } from '../utils'

/** Compares reminder ids from obsidian to cached ones in `data.json` if exist in `json` but not in obsidian it means reminder was deleted */
export const handleDelete = (
  cachedReminders: Reminder<string>[],
  remindersFromObsidian: Reminder<Date>[],
  data: Data
) => {
  const deletedReminders = cachedReminders
    .map(cachedReminder => {
      if (remindersFromObsidian.find(r => reminderExistInCache(cachedReminder, r))) return null
      return cachedReminder
    })
    .filter(Boolean) as Reminder<string>[]
  if (deletedReminders.length > 0) {
    deletedReminders.forEach(deletedReminder => {
      const index = cachedReminders.findIndex((r: Reminder<string>) =>
        reminderExistInCache(r, deletedReminder)
      )
      if (index === -1) return
      data.reminders[index].deleted = true
      logger.info(`Reminder with id ${data.reminders[index].id} marked as deleted`)
    })
    saveData(data)
  }
}
