import { logger } from '../logger'
import { getData } from '../utils'
import {
  getObsidianReminders,
  handleNewReminders,
  handleDelete,
  handleEdit,
  safetyCleanup,
} from './index'

/** It checks md files and update cache of the reminders to handle new, edited, deleted reminders */
export const watchLogic = () => {
  safetyCleanup()

  const remindersFromObsidian = getObsidianReminders()
  const data = getData()
  const cachedReminders = data.reminders || []
  const times = []

  let t = Date.now()
  handleNewReminders(cachedReminders, remindersFromObsidian, data)
  times.push(`handle new reminders - ${new Date().getTime() - t} ms`)

  t = Date.now()
  handleDelete(cachedReminders, remindersFromObsidian, data)
  times.push(`handle deleted reminders - ${new Date().getTime() - t} ms`)

  t = Date.now()
  handleEdit(cachedReminders, remindersFromObsidian, data)
  times.push(`handle edited reminders - ${new Date().getTime() - t} ms`)

  logger.info(`Performance of functions: 
  ${times.join('\n  ')}
  `)
}
