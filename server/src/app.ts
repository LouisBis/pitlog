import express from 'express'
import cors from 'cors'
import motorcyclesRouter from './routes/motorcycles.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/v1/motorcycles', motorcyclesRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})
