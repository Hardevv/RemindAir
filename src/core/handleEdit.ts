import { logger } from '../logger'
import type { Data, Reminder } from '../types'
import { reminderExistInCache, saveData, validateDateReminder } from '../utils'

export const handleEdit = (
  cachedReminders: Reminder<string>[],
  remindersFromObsidian: Reminder<Date>[],
  data: Data
) => {
  let hasEdits = false

  cachedReminders.forEach(cachedReminder => {
    const editedReminder = remindersFromObsidian.find(
      rfo =>
        reminderExistInCache(cachedReminder, rfo) &&
        (rfo.filePath !== cachedReminder.filePath ||
          rfo.content !== cachedReminder.content ||
          rfo.dateTime.toISOString() !== cachedReminder.dateTime)
    )

    if (editedReminder?.id === cachedReminder?.id) {
      const index = cachedReminders.findIndex((r: Reminder<string>) =>
        reminderExistInCache(r, editedReminder)
      )
      if (!validateDateReminder(editedReminder) || index === -1) return
      const hasDateChanged = editedReminder.dateTime.toISOString() !== cachedReminder.dateTime
      data.reminders[index] = {
        ...editedReminder,
        dateTime: editedReminder.dateTime.toISOString(),
        sent: hasDateChanged ? false : cachedReminder.sent,
        deleted: false,
      }
      hasEdits = true
      logger.info(`Reminder with id ${editedReminder.id} was edited, updated cache`)
    }

    return cachedReminder
  })

  if (hasEdits) saveData(data)
}
