import { execSync } from 'child_process'
import type { Data, Reminder } from './types'
import {
  cleanReminderContent,
  getData,
  getObsidianAdvancedUriBlockLink,
  reminderExistInCache,
  saveData,
  validateDateReminder,
  validateStringReminder,
} from './utils'
import { REDIRECTION_PAGE_URL, REMINDER_ID_KEY, REMINDER_KEY, REMINDER_REGEXP } from './consts'
import { logger } from './logger'
import { VAULT_NAMES } from './consts'

const handleNewReminders = (
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

/** Compares reminder ids from obsidian to cached ones in `data.json` if exist in `json` but not in obsidian it means reminder was deleted */
const handleDelete = (
  cachedReminders: Reminder<string>[],
  remindersFromObsidian: Reminder<Date>[],
  data: Data
) => {
  if (remindersFromObsidian.length === 0) return

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

const handleEdit = (
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

/** fetches reminders form Obsidian vaults via new Obsidian CLI */
const getObsidianReminders = () => {
  const vaultReminderLines = VAULT_NAMES.map((vaultName): [string, string[]] => {
    const searchResult = execSync(
      `obsidian vault="${vaultName}" search:context query="/${REMINDER_KEY}/"`,
      { encoding: 'utf-8' }
    ).trim()
    const reminderLines = searchResult.split('\n')
    return [vaultName, reminderLines]
  })

  return vaultReminderLines.reduce((acc, [vaultName, lines]) => {
    const vaultLines = lines
      .map(line => {
        const reminderMatch = line.match(REMINDER_REGEXP)
        const reminderTime = reminderMatch?.[1]
        const reminderId = reminderMatch?.[2] ? `${REMINDER_ID_KEY}${reminderMatch[2]}` : undefined

        if (!reminderTime || !reminderId) return null

        return {
          vaultName,
          id: reminderId,
          filePath: line.split(':')[0], // file name is before the first colon
          content: line,
          dateTime: new Date(reminderTime),
          sent: false,
          deleted: false,
        }
      })
      .filter(Boolean) as Reminder[]

    return [...acc, ...vaultLines]
  }, [] as Reminder[])
}

/** It checks md files and update cache of the reminders to handle new, edited, deleted reminders */
export const watchLogic = () => {
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

const sentDiscordWebhook = async ({ vaultName, filePath, id, content }: Reminder<string>) => {
  if (!id) throw new Error('Reminder id is missing')
  const obsidianLink = getObsidianAdvancedUriBlockLink(vaultName, filePath, id)

  try {
    const response = await fetch(process.env.DISCORD_WEBHOOK_URL || '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: `🔔 Reminder: ${cleanReminderContent(content)}`,
            url: `${REDIRECTION_PAGE_URL}?deeplink=${encodeURIComponent(obsidianLink)}`,
            footer: { text: `${filePath} | Click the link above to open Obsidian` },
            color: 0x7e48e7,
          },
        ],
      }),
    })
    if (response.ok) logger.info(`Sent webhook for reminder with id ${id}`)
  } catch (err) {
    logger.error(`Failed to send webhook for reminder with id ${id}: ${(err as Error).message}`)
  }
}

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
