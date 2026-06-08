import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import logger from './lib/logger.js'
import motorcyclesRouter from './routes/motorcycles.js'

const app = express()
const port = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.use('/api/v1/motorcycles', motorcyclesRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
})
