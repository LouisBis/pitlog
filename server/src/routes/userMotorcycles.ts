import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { userMotorcycles, motorcycles, kmHistory } from '../db/schema/index.js'
import { validateBody } from '../middleware/validate.js'
import { computeVelocity } from '../lib/velocity.js'
import logger from '../lib/logger.js'

const router = Router()

const idSchema = z.coerce.number().int().positive()

const createSchema = z.object({
  motorcycleId: z.number().int().positive(),
  currentKm: z.number().int().min(0),
  acquiredAt: z.coerce.date(),
})

const updateKmSchema = z.object({
  km: z.number().int().positive(),
})

router.get('/', (_req, res) => {
  const result = db
    .select({
      id: userMotorcycles.id,
      currentKm: userMotorcycles.currentKm,
      acquiredAt: userMotorcycles.acquiredAt,
      motorcycleId: motorcycles.id,
      brand: motorcycles.brand,
      model: motorcycles.model,
      year: motorcycles.year,
      isCustom: motorcycles.isCustom,
    })
    .from(userMotorcycles)
    .innerJoin(motorcycles, eq(userMotorcycles.motorcycleId, motorcycles.id))
    .all()

  res.json(result)
})

router.post('/', validateBody(createSchema), (req, res) => {
  const { motorcycleId, currentKm, acquiredAt } = res.locals.body as z.infer<typeof createSchema>

  const motorcycle = db
    .select()
    .from(motorcycles)
    .where(eq(motorcycles.id, motorcycleId))
    .get()

  if (!motorcycle) {
    logger.warn({ motorcycleId }, 'Motorcycle not found in catalogue')
    res.status(404).json({ error: 'Motorcycle not found in catalogue' })
    return
  }

  const [created] = db
    .insert(userMotorcycles)
    .values({ motorcycleId, currentKm, acquiredAt })
    .returning()
    .all()

  db.insert(kmHistory)
    .values({ userMotorcycleId: created.id, km: currentKm, recordedAt: new Date() })
    .run()

  res.status(201).json({ ...created, brand: motorcycle.brand, model: motorcycle.model, year: motorcycle.year })
})

router.get('/:id/velocity', (req, res) => {
  const parsedId = idSchema.safeParse(req.params.id)
  if (!parsedId.success) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }

  const userMoto = db
    .select()
    .from(userMotorcycles)
    .where(eq(userMotorcycles.id, parsedId.data))
    .get()

  if (!userMoto) {
    res.status(404).json({ error: 'User motorcycle not found' })
    return
  }

  const entries = db
    .select({ km: kmHistory.km, recordedAt: kmHistory.recordedAt })
    .from(kmHistory)
    .where(eq(kmHistory.userMotorcycleId, parsedId.data))
    .all()

  const result = computeVelocity(entries)
  res.json(result)
})

router.patch('/:id/km', validateBody(updateKmSchema), (req, res) => {
  const parsedId = idSchema.safeParse(req.params.id)
  if (!parsedId.success) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }

  const { km } = res.locals.body as z.infer<typeof updateKmSchema>

  const userMoto = db
    .select()
    .from(userMotorcycles)
    .where(eq(userMotorcycles.id, parsedId.data))
    .get()

  if (!userMoto) {
    res.status(404).json({ error: 'User motorcycle not found' })
    return
  }

  if (km <= userMoto.currentKm) {
    logger.warn({ userMotoId: parsedId.data, currentKm: userMoto.currentKm, attempted: km }, 'Km update rejected')
    res.status(422).json({ error: `New km (${km}) must be greater than current km (${userMoto.currentKm})` })
    return
  }

  db.update(userMotorcycles)
    .set({ currentKm: km })
    .where(eq(userMotorcycles.id, parsedId.data))
    .run()

  db.insert(kmHistory)
    .values({ userMotorcycleId: parsedId.data, km, recordedAt: new Date() })
    .run()

  res.json({ id: parsedId.data, currentKm: km })
})

export default router
