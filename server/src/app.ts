import express from 'express'
import cors from 'cors'
import pinoHttp from 'pino-http'
import logger from './lib/logger.js'
import motorcyclesRouter from './routes/motorcycles.js'
import userMotorcyclesRouter from './routes/userMotorcycles.js'
import ticketsRouter from './routes/tickets.js'

export const app = express()

app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json())
app.use(pinoHttp({ logger }))

app.use('/api/v1/motorcycles', motorcyclesRouter)
app.use('/api/v1/user-motorcycles', userMotorcyclesRouter)
app.use('/api/v1/tickets', ticketsRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})
