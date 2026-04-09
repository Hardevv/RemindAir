export interface Reminder<T = Date> {
  vaultName: string
  id: string | null
  /** Relative path to vault (vault is root for that path) */
  filePath: string
  content: string
  dateTime: T
  /** Cached value */
  sent: boolean
  /** Cached value */
  deleted: boolean
}

/** Plugin repo should have the same interface under interface called `PluginSettings` */
export interface PluginSettings {
  idCounter: number
  inlineActions: boolean
  timeFormat: '24h' | '12h'
  startWeekFrom: 'monday' | 'sunday'
  /** date .getTime()*/
  lastSafetyCleanup: number | null
}

type VaultName = string

export interface Data {
  reminders: Reminder<string>[]
  pluginSettings: Record<VaultName, PluginSettings> | null
}

export interface VapidKeys {
  publicKey: string
  privateKey: string
}
