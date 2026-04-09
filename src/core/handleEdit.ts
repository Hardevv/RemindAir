import { logger } from '../logger'
import type { Data, Reminder } from '../types'
import { reminderExistInCache, saveData, validateDateReminder } from '../utils'

const gedUndoDeletedReminderIndex = (
  remindersFromObsidian: Reminder[],
  cachedReminder: Reminder<string>,
  editedReminder?: Reminder,
  index: number = -1
) => {
  const undoDeleted = remindersFromObsidian.find(
    rfo => reminderExistInCache(cachedReminder, rfo) && editedReminder === undefined
  )

  if (!undoDeleted) return -1
  if (!validateDateReminder(undoDeleted) || index === -1) return -1
  return index
}

export const handleEdit = (
  cachedReminders: Reminder<string>[],
  remindersFromObsidian: Reminder<Date>[],
  data: Data
) => {
  let hasEdits = false

  cachedReminders.forEach((cachedReminder, index) => {
    const editedReminder = remindersFromObsidian.find(
      rfo =>
        reminderExistInCache(cachedReminder, rfo) &&
        (rfo.filePath !== cachedReminder.filePath ||
          rfo.content !== cachedReminder.content ||
          rfo.dateTime.toISOString() !== cachedReminder.dateTime)
    )

    // handle cmd+z
    const undoDeletedIndex = gedUndoDeletedReminderIndex(
      remindersFromObsidian,
      cachedReminder,
      editedReminder,
      index
    )
    if (undoDeletedIndex !== -1) {
      data.reminders[undoDeletedIndex].deleted = false
      hasEdits = true
    }

    if (editedReminder && validateDateReminder(editedReminder)) {
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
