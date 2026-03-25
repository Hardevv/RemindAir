import { createServer } from 'http'
import { getData, saveData } from './utils'
import { logger } from './logger'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const startApi = (port: string) => {
  const server = createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders)
      res.end()
      return
    }

    if (req.method === 'DELETE' && req.url === '/reminders') {
      const data = getData()
      const count = data.reminders.length
      data.reminders = []
      saveData(data)

      logger.info(`Deleted all reminders requested from Obsidian client (${count})`)

      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: `Deleted ${count} reminders` }))
      return
    }

    res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  })

  server.listen(port, () => {
    logger.info(`API server listening on port ${port}`)
  })
}
