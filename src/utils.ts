import { writeFileSync, readFileSync } from 'fs'
import { Data, Reminder } from './types'
import { logger } from './logger'
import {
  DATA_PATH,
  MD_LINK_REGEXP,
  OBSIDIAN_EMBED_REGEXP,
  REMINDER_KEY,
  WIKILINK_REGEXP,
} from './consts'

const INIT_DATA: Data = { reminders: [] }

export const initializeDataFile = () => {
  try {
    readFileSync(DATA_PATH, 'utf-8')
  } catch {
    writeFileSync(DATA_PATH, JSON.stringify(INIT_DATA, null, 2))
    logger.info('Data file not found, created new one')
  }
}

export const getData = (): Data => JSON.parse(readFileSync(DATA_PATH, 'utf-8'))
export const saveData = (data: Data) => writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))

/** Removes path part, list & checkbox indicators, reminder part at the end */
export const cleanReminderContent = (content: string) => {
  const firstColonIndex = content.indexOf(':')
  const secondColonIndex = content.indexOf(':', firstColonIndex + 1)
  let cleanedContent = content.slice(secondColonIndex + 1).trimStart()

  if (cleanedContent.startsWith('- [') || cleanedContent.startsWith('* ['))
    cleanedContent = cleanedContent.slice(5) // remove any checkbox "- [ ] ", * [ ]
  else if (cleanedContent.startsWith('- ') || cleanedContent.startsWith('* '))
    cleanedContent = cleanedContent.slice(2) // remove list indicator - or *

  // remove links & embeds
  cleanedContent = cleanedContent
    .replace(OBSIDIAN_EMBED_REGEXP, '[$1]')
    .replace(MD_LINK_REGEXP, '[$1]')
    .replace(WIKILINK_REGEXP, '[$1]')
    .trim()

  const indexOfReminderKey = cleanedContent.indexOf(REMINDER_KEY)
  if (indexOfReminderKey !== -1)
    cleanedContent = cleanedContent.slice(0, indexOfReminderKey).trimEnd() // remove reminder key and anything after it

  return cleanedContent
}

export const getObsidianAdvancedUriBlockLink = (
  vaultName: string,
  filePath: string,
  blockId: string
) => `obsidian://open?vault=${vaultName}&file=${filePath}#^${blockId}`

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const validateDateReminder = (reminder: unknown): reminder is Reminder<Date> => {
  if (!isObject(reminder)) return false

  try {
    return !!(
      reminder.id &&
      reminder.filePath &&
      reminder.dateTime &&
      reminder.dateTime instanceof Date &&
      reminder.dateTime.toISOString()
    )
  } catch {
    return false
  }
}

export const validateStringReminder = (reminder: unknown): reminder is Reminder<string> => {
  if (!isObject(reminder)) return false

  try {
    return !!(
      reminder.id &&
      reminder.filePath &&
      reminder.dateTime &&
      typeof reminder.dateTime === 'string'
    )
  } catch {
    return false
  }
}

/** Lets you find if reminder exist in cache by ID and VaultName */
export const reminderExistInCache = (
  cachedReminder: Reminder<string>,
  reminderFromObsidian: Reminder<string | Date>
) =>
  cachedReminder.id === reminderFromObsidian.id &&
  cachedReminder.vaultName === reminderFromObsidian.vaultName
