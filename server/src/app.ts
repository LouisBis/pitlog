import express from 'express'
import cors from 'cors'
import pinoHttp from 'pino-http'
import logger from './lib/logger.js'
import motorcyclesRouter from './routes/motorcycles.js'
import userMotorcyclesRouter from './routes/userMotorcycles.js'
import ticketsRouter from './routes/tickets.js'
import catalogRouter from './routes/catalog.js'

export const app = express()

app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json({ limit: '4mb' }))
app.use(pinoHttp({ logger }))

app.use('/api/v1/motorcycles', motorcyclesRouter)
app.use('/api/v1/user-motorcycles', userMotorcyclesRouter)
app.use('/api/v1/tickets', ticketsRouter)
app.use('/api/v1/catalog', catalogRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.too.large') {
    logger.warn('Request body exceeded size limit')
    res.status(413).json({ error: 'Payload too large' })
    return
  }
  next(err)
})
