import express from 'express'
import cors from 'cors'
import motorcyclesRouter from './routes/motorcycles.js'
import userMotorcyclesRouter from './routes/userMotorcycles.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/v1/motorcycles', motorcyclesRouter)
app.use('/api/v1/user-motorcycles', userMotorcyclesRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})
