import { getData, getPluginSettingsPath, saveData } from './utils'
import { logger } from './logger'
import { VAULT_NAMES } from './consts'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { PluginSettings } from './types'

/** It takes .json file from the plugin and checks if user requested cleanup */
export const safetyCleanup = () => {
  const data = getData()
  const changedSettings: string[] = []

  const pluginSettings = VAULT_NAMES.map(vaultName => {
    try {
      const pluginSettingsPath = getPluginSettingsPath(vaultName)

      if (!existsSync(pluginSettingsPath)) {
        logger.error(`Missing file: ${pluginSettingsPath}`)
        return null
      }

      let pluginSettings: PluginSettings
      try {
        pluginSettings = JSON.parse(readFileSync(pluginSettingsPath, 'utf-8'))
      } catch (error) {
        logger.error(
          `Failed to parse plugin settings. vault ${vaultName}: ${(error as Error).message}`
        )
        return null
      }

      if (!pluginSettings.lastSafetyCleanup) return
      if (pluginSettings.lastSafetyCleanup < Date.now()) {
        data.reminders = data.reminders.filter(r => r.vaultName !== vaultName)
        pluginSettings.lastSafetyCleanup = null
        changedSettings.push(vaultName)
      }

      return [vaultName, pluginSettings] as [string, PluginSettings]
    } catch (error) {
      logger.error(`Failed to clear reminders for vault ${vaultName}: ${(error as Error).message}`)
    }
  })

  data.pluginSettings = Object.fromEntries(
    pluginSettings.filter((entry): entry is [string, PluginSettings] => !!entry)
  )

  if (changedSettings.length === 0) return
  saveData(data)
  // Overwrite plugin settings inside the vault so lastSafetyCleanup is set to null and it won't trigger cleanup again on the next run
  changedSettings.forEach(vaultName => {
    writeFileSync(getPluginSettingsPath(vaultName), JSON.stringify(data.pluginSettings, null, 2))
  })
}
