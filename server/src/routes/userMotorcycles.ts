import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { userMotorcycles, motorcycles, kmHistory, intervals, tickets } from '../db/schema/index.js'
import { validateBody } from '../middleware/validate.js'
import { computeVelocity } from '../lib/velocity.js'
import logger from '../lib/logger.js'

const router = Router()

function findCatalogueIntervals(motorcycleId: number) {
  return db
    .select()
    .from(intervals)
    .where(eq(intervals.motorcycleId, motorcycleId))
    .all()
}

function seedTickets(userMotorcycleId: number, currentKm: number, catalogueIntervals: ReturnType<typeof findCatalogueIntervals>) {
  if (catalogueIntervals.length === 0) return
  const now = new Date()
  db.insert(tickets)
    .values(
      catalogueIntervals.map((interval) => ({
        userMotorcycleId,
        intervalId: interval.id,
        operation: interval.operation,
        status: 'todo' as const,
        targetKm: interval.intervalKm != null ? currentKm + interval.intervalKm : null,
        targetDate: interval.intervalDays != null
          ? new Date(now.getTime() + interval.intervalDays * 24 * 60 * 60 * 1000)
          : null,
      }))
    )
    .run()
  logger.info({ userMotorcycleId, count: catalogueIntervals.length }, 'Tickets seeded from catalogue')
}

const idSchema = z.coerce.number().int().positive()

const createSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  currentKm: z.number().int().min(0),
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
  const { brand, model, year, currentKm } = res.locals.body as z.infer<typeof createSchema>

  let motorcycle = db
    .select()
    .from(motorcycles)
    .where(eq(motorcycles.brand, brand))
    .all()
    .find((m) => m.model === model && m.year === year) ?? null

  if (!motorcycle) {
    const [created] = db
      .insert(motorcycles)
      .values({ brand, model, year, isCustom: true })
      .returning()
      .all()
    motorcycle = created
    logger.info({ brand, model, year }, 'Custom motorcycle created')
  } else {
    logger.info({ motorcycleId: motorcycle.id, brand, model, year }, 'Catalogue motorcycle matched')
  }

  const [userMoto] = db
    .insert(userMotorcycles)
    .values({ motorcycleId: motorcycle.id, currentKm, acquiredAt: new Date() })
    .returning()
    .all()

  db.insert(kmHistory)
    .values({ userMotorcycleId: userMoto.id, km: currentKm, recordedAt: new Date() })
    .run()

  if (!motorcycle.isCustom) {
    seedTickets(userMoto.id, currentKm, findCatalogueIntervals(motorcycle.id))
  }

  res.status(201).json({ ...userMoto, brand, model, year, isCustom: motorcycle.isCustom })
})

router.post('/:id/import-intervals', (req, res) => {
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

  const motorcycle = db
    .select()
    .from(motorcycles)
    .where(eq(motorcycles.id, userMoto.motorcycleId))
    .get()

  if (!motorcycle) {
    res.status(404).json({ error: 'Motorcycle not found' })
    return
  }

  const motorcycleIntervals = findCatalogueIntervals(motorcycle.id)
  if (motorcycleIntervals.length === 0) {
    res.status(422).json({ error: 'No catalogue intervals for this motorcycle' })
    return
  }

  const coveredIntervalIds = new Set(
    db
      .select()
      .from(tickets)
      .where(eq(tickets.userMotorcycleId, parsedId.data))
      .all()
      .filter((t) => t.intervalId !== null && t.status !== 'done')
      .map((t) => t.intervalId as number)
  )

  const toCreate = motorcycleIntervals.filter((i) => !coveredIntervalIds.has(i.id))
  seedTickets(parsedId.data, userMoto.currentKm, toCreate)
  logger.info({ userMotorcycleId: parsedId.data, created: toCreate.length, skipped: motorcycleIntervals.length - toCreate.length }, 'Intervals imported')
  res.json({ created: toCreate.length })
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
