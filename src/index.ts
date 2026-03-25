import 'dotenv/config'
import { watch } from 'fs'
import { initializeDataFile } from './utils'
import { checkPastRemindersAndSend, markPastRemindersAsSent, watchLogic } from './core'
import { DEBOUNCE_DELAY, INTERVAL_DELAY, VAULT_NAMES } from './consts'
import { startApi } from './api'

const API_PORT = process.env.API_PORT || '3000'
const ROOT_PATH = process.env.ROOT_PATH

if (!ROOT_PATH) throw new Error('ROOT_PATH environment variable is not set')

initializeDataFile()
watchLogic() // Run once on start
markPastRemindersAsSent()
startApi(API_PORT)

setInterval(async () => {
  await checkPastRemindersAndSend()
}, INTERVAL_DELAY)

let debounceTimer: ReturnType<typeof setTimeout>
watch(ROOT_PATH, { recursive: true }, (event, filename) => {
  if (!VAULT_NAMES.includes(filename?.split('/')[0].trim() || '')) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(watchLogic, DEBOUNCE_DELAY)
})
