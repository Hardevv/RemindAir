import 'dotenv/config'
import { watch } from 'fs'
import { initializeDataFile, initSubscriptionsFile } from './utils'
import { checkPastRemindersAndSend, markPastRemindersAsSent, watchLogic } from './core'
import { DEBOUNCE_DELAY, INTERVAL_DELAY, VAULT_NAMES } from './consts'
import { initVapidKeys } from './core/sendWebPush'

const ROOT_PATH = process.env.ROOT_PATH

if (!ROOT_PATH) throw new Error('ROOT_PATH environment variable is not set')

initializeDataFile()
initSubscriptionsFile()
watchLogic() // Run once on start
markPastRemindersAsSent()
initVapidKeys()

setInterval(async () => {
  await checkPastRemindersAndSend()
}, INTERVAL_DELAY)

let debounceTimer: ReturnType<typeof setTimeout>
watch(ROOT_PATH, { recursive: true }, (event, filename) => {
  if (!VAULT_NAMES.includes(filename?.split('/')[0].trim() || '')) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(watchLogic, DEBOUNCE_DELAY)
})
