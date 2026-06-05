import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import logger from './lib/logger.js'

const app = express()
const port = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
})
