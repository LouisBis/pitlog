import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import {
  userMotorcycles,
  motorcycles,
  kmHistory,
  intervals,
  tickets,
  motorcycleIntervals,
  ticketParts,
} from '../db/schema/index.js'
import { validateBody } from '../middleware/validate.js'
import { computeVelocity } from '../lib/velocity.js'
import logger from '../lib/logger.js'
import { parseId } from '../lib/parseId.js'

const router = Router()

function findCatalogueIntervals(motorcycleId: number) {
  return db.select().from(intervals).where(eq(intervals.motorcycleId, motorcycleId)).all()
}

const GENERIC_INTERVAL_DEFAULTS = [
  { operation: 'Engine oil change', intervalKm: 5000, intervalDays: 365 },
  {
    operation: 'Air filter inspection',
    intervalKm: 10000,
    intervalDays: null as null,
  },
  {
    operation: 'Spark plugs replacement',
    intervalKm: 10000,
    intervalDays: null as null,
  },
  {
    operation: 'Drive chain lubrication',
    intervalKm: 500,
    intervalDays: null as null,
  },
  {
    operation: 'Drive chain tension',
    intervalKm: 1000,
    intervalDays: null as null,
  },
  {
    operation: 'Brake fluid replacement',
    intervalKm: null as null,
    intervalDays: 730,
  },
]

function findGenericIntervals() {
  const existing =
    db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.brand, 'Generic'))
      .all()
      .find((m) => m.model === 'Standard') ?? null

  if (existing) return findCatalogueIntervals(existing.id)

  const [generic] = db
    .insert(motorcycles)
    .values({ brand: 'Generic', model: 'Standard', year: 0, isCustom: false })
    .returning()
    .all()

  db.insert(intervals)
    .values(
      GENERIC_INTERVAL_DEFAULTS.map((i) => ({
        motorcycleId: generic.id,
        ...i,
      })),
    )
    .run()

  logger.info({ motorcycleId: generic.id }, 'Generic/Standard motorcycle created on demand')
  return findCatalogueIntervals(generic.id)
}

function seedTickets(
  userMotorcycleId: number,
  currentKm: number,
  catalogueIntervals: ReturnType<typeof findCatalogueIntervals>,
) {
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
        targetDate:
          interval.intervalDays != null ? new Date(now.getTime() + interval.intervalDays * 24 * 60 * 60 * 1000) : null,
      })),
    )
    .run()
  logger.info({ userMotorcycleId, count: catalogueIntervals.length }, 'Tickets seeded from catalogue')
}

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

  let motorcycle =
    db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.brand, brand))
      .all()
      .find((m) => m.model === model && m.year === year) ?? null

  if (!motorcycle) {
    const [created] = db.insert(motorcycles).values({ brand, model, year, isCustom: true }).returning().all()
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
    .values({
      userMotorcycleId: userMoto.id,
      km: currentKm,
      recordedAt: new Date(),
    })
    .run()

  const intervalsToSeed = motorcycle.isCustom ? findGenericIntervals() : findCatalogueIntervals(motorcycle.id)
  seedTickets(userMoto.id, currentKm, intervalsToSeed)
  if (motorcycle.isCustom) {
    logger.info({ userMotorcycleId: userMoto.id }, 'Custom motorcycle seeded with generic intervals')
  }

  res.status(201).json({ ...userMoto, brand, model, year, isCustom: motorcycle.isCustom })
})

router.post('/:id/import-intervals', (req, res) => {
  const id = parseId(req.params.id, res)
  if (id === null) return

  const userMoto = db.select().from(userMotorcycles).where(eq(userMotorcycles.id, id)).get()

  if (!userMoto) {
    res.status(404).json({ error: 'User motorcycle not found' })
    return
  }

  const motorcycle = db.select().from(motorcycles).where(eq(motorcycles.id, userMoto.motorcycleId)).get()

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
      .where(eq(tickets.userMotorcycleId, id))
      .all()
      .filter((t) => t.intervalId !== null && t.status !== 'done')
      .map((t) => t.intervalId as number),
  )

  const toCreate = motorcycleIntervals.filter((i) => !coveredIntervalIds.has(i.id))
  seedTickets(id, userMoto.currentKm, toCreate)
  logger.info(
    {
      userMotorcycleId: id,
      created: toCreate.length,
      skipped: motorcycleIntervals.length - toCreate.length,
    },
    'Intervals imported',
  )
  res.json({ created: toCreate.length })
})

router.get('/:id/velocity', (req, res) => {
  const id = parseId(req.params.id, res)
  if (id === null) return

  const userMoto = db.select().from(userMotorcycles).where(eq(userMotorcycles.id, id)).get()

  if (!userMoto) {
    res.status(404).json({ error: 'User motorcycle not found' })
    return
  }

  const entries = db
    .select({ km: kmHistory.km, recordedAt: kmHistory.recordedAt })
    .from(kmHistory)
    .where(eq(kmHistory.userMotorcycleId, id))
    .all()

  const result = computeVelocity(entries)
  res.json(result)
})

router.patch('/:id/km', validateBody(updateKmSchema), (req, res) => {
  const id = parseId(req.params.id, res)
  if (id === null) return

  const { km } = res.locals.body as z.infer<typeof updateKmSchema>

  const userMoto = db.select().from(userMotorcycles).where(eq(userMotorcycles.id, id)).get()

  if (!userMoto) {
    res.status(404).json({ error: 'User motorcycle not found' })
    return
  }

  if (km <= userMoto.currentKm) {
    logger.warn({ userMotoId: id, currentKm: userMoto.currentKm, attempted: km }, 'Km update rejected')
    res.status(422).json({
      error: `New km (${km}) must be greater than current km (${userMoto.currentKm})`,
    })
    return
  }

  db.update(userMotorcycles).set({ currentKm: km }).where(eq(userMotorcycles.id, id)).run()

  db.insert(kmHistory).values({ userMotorcycleId: id, km, recordedAt: new Date() }).run()

  res.json({ id, currentKm: km })
})

router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id, res)
  if (id === null) return

  const userMoto = db.select().from(userMotorcycles).where(eq(userMotorcycles.id, id)).get()
  if (!userMoto) {
    logger.warn({ userMotorcycleId: id }, 'User motorcycle not found for deletion')
    res.status(404).json({ error: 'User motorcycle not found' })
    return
  }

  db.delete(motorcycleIntervals).where(eq(motorcycleIntervals.userMotorcycleId, id)).run()

  const motoTickets = db.select({ id: tickets.id }).from(tickets).where(eq(tickets.userMotorcycleId, id)).all()
  for (const t of motoTickets) {
    db.delete(ticketParts).where(eq(ticketParts.ticketId, t.id)).run()
  }

  db.delete(tickets).where(eq(tickets.userMotorcycleId, id)).run()
  db.delete(kmHistory).where(eq(kmHistory.userMotorcycleId, id)).run()
  db.delete(userMotorcycles).where(eq(userMotorcycles.id, id)).run()

  logger.info({ userMotorcycleId: id }, 'User motorcycle and associated data deleted')
  res.status(204).send()
})

export default router
