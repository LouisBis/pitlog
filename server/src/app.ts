import express from 'express'
import cors from 'cors'
import motorcyclesRouter from './routes/motorcycles.js'
import userMotorcyclesRouter from './routes/userMotorcycles.js'
import ticketsRouter from './routes/tickets.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/v1/motorcycles', motorcyclesRouter)
app.use('/api/v1/user-motorcycles', userMotorcyclesRouter)
app.use('/api/v1/tickets', ticketsRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})
