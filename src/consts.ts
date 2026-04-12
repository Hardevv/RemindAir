import type { Data } from './types'

export const DEBOUNCE_DELAY = 1000 // milliseconds
export const INTERVAL_DELAY = 5_000
export const MAX_PAST_MS = 5 * 60 * 1000 // 5 minutes
export const REMINDER_KEY = '🔔'
export const REMINDER_ID_KEY = '^r-'
export const REMINDER_ID_KEY_REGEXP = /\^r-\d+/
export const REMINDER_REGEXP = /🔔\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})\s+\^r-(\d+-[0-9a-zA-Z])/
export const OBSIDIAN_EMBED_REGEXP = /!\[\[([^\]]+)\]\]/g // ![[file.png]], ![[file.pdf]]
export const MD_LINK_REGEXP = /\[([^\]]+)\]\(([^)]+)\)/g // [lin title](url)
export const WIKILINK_REGEXP = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g // [[Page|Alias]], [[Page]]

/** Matches every type of the checkbox - [#] where `#` means any character, it also matches checkbox that starts with * [ ] */
export const CHECKBOX_REGEX = /(?:[-*]\s*\[[^\]]\]\s*)?/

export const DATA_PATH = `${process.cwd()}/data.json`
export const VAPID_KEYS_PATH = './vapid-keys.json'
export const PUSH_SUBSCRIPTIONS_PATH = `${process.cwd()}/push-subscriptions.json`
export const VAULT_NAMES = process.env.VAULTS
  ? process.env.VAULTS.split(',').map(v => v.trim())
  : []
if (VAULT_NAMES.length === 0) throw new Error('VAULTS environment variable is not set or empty')

export const INIT_DATA: Data = { reminders: [], pluginSettings: null }
