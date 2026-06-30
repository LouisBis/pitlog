import { Router } from 'express'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '../db/index.js'
import { motorcycles } from '../db/schema/index.js'
import { parseId } from '../lib/parseId.js'

const router = Router()

router.get('/', (_req, res) => {
  const result = db
    .select()
    .from(motorcycles)
    .where(and(eq(motorcycles.isCustom, false), ne(motorcycles.brand, 'Generic')))
    .all()
  res.json(result)
})

router.get('/:id', (req, res) => {
  const id = parseId(req.params.id, res)
  if (id === null) return

  const motorcycle = db.select().from(motorcycles).where(eq(motorcycles.id, id)).get()

  if (!motorcycle) {
    res.status(404).json({ error: 'Motorcycle not found' })
    return
  }

  res.json(motorcycle)
})

export default router
