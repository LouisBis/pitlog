import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { motorcycles, intervals } from '../db/schema/index.js'

const router = Router()

const idSchema = z.coerce.number().int().positive()

router.get('/', (_req, res) => {
  const result = db.select().from(motorcycles).all()
  res.json(result)
})

router.get('/:id', (req, res) => {
  const parsed = idSchema.safeParse(req.params.id)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid motorcycle id' })
    return
  }

  const motorcycle = db
    .select()
    .from(motorcycles)
    .where(eq(motorcycles.id, parsed.data))
    .get()

  if (!motorcycle) {
    res.status(404).json({ error: 'Motorcycle not found' })
    return
  }

  const motorcycleIntervals = db
    .select()
    .from(intervals)
    .where(eq(intervals.motorcycleId, parsed.data))
    .all()

  res.json({ ...motorcycle, intervals: motorcycleIntervals })
})

export default router
