import { execSync } from 'node:child_process'
import { REMINDER_ID_KEY, REMINDER_KEY, REMINDER_REGEXP, VAULT_NAMES } from '../consts'
import type { Reminder } from '../types'

/** fetches reminders form Obsidian vaults via new Obsidian CLI */
export const getObsidianReminders = () => {
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
