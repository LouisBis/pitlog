import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { userMotorcycles, motorcycles, kmHistory, tickets, ticketParts } from '../db/schema/index.js'
import { validateBody } from '../middleware/validate.js'
import { computeVelocity } from '../lib/velocity.js'
import { loadCatalogEntry } from '../lib/catalog.js'
import type { CatalogInterval } from '../lib/catalog.js'
import logger from '../lib/logger.js'
import { parseId } from '../lib/parseId.js'

const router = Router()

function seedCatalogTickets(
  userMotorcycleId: number,
  currentKm: number,
  catalogSlug: string,
  intervals: CatalogInterval[],
) {
  if (intervals.length === 0) return
  const now = new Date()
  db.insert(tickets)
    .values(
      intervals.map((interval) => ({
        userMotorcycleId,
        catalogSlug,
        intervalSlug: interval.slug,
        operation: interval.operation,
        status: 'todo' as const,
        targetKm: interval.km != null ? currentKm + interval.km : null,
        targetDate: interval.days != null ? new Date(now.getTime() + interval.days * 24 * 60 * 60 * 1000) : null,
      })),
    )
    .run()
  logger.info({ userMotorcycleId, count: intervals.length, catalogSlug }, 'Tickets seeded from catalogue')
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
      catalogSlug: motorcycles.catalogSlug,
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

  db.insert(kmHistory).values({ userMotorcycleId: userMoto.id, km: currentKm, recordedAt: new Date() }).run()

  const effectiveSlug = motorcycle.isCustom ? 'generic-standard' : motorcycle.catalogSlug
  if (effectiveSlug) {
    const entry = loadCatalogEntry(effectiveSlug)
    if (entry) seedCatalogTickets(userMoto.id, currentKm, effectiveSlug, entry.intervals)
  }

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

  if (!motorcycle.catalogSlug) {
    res.status(422).json({ error: 'No catalogue intervals for this motorcycle' })
    return
  }

  const entry = loadCatalogEntry(motorcycle.catalogSlug)
  if (!entry || entry.intervals.length === 0) {
    res.status(422).json({ error: 'No catalogue intervals for this motorcycle' })
    return
  }

  const coveredSlugs = new Set(
    db
      .select()
      .from(tickets)
      .where(eq(tickets.userMotorcycleId, id))
      .all()
      .filter((t) => t.intervalSlug !== null && t.status !== 'done')
      .map((t) => t.intervalSlug as string),
  )

  const toCreate = entry.intervals.filter((i) => !coveredSlugs.has(i.slug))
  seedCatalogTickets(id, userMoto.currentKm, motorcycle.catalogSlug, toCreate)
  logger.info(
    { userMotorcycleId: id, created: toCreate.length, skipped: entry.intervals.length - toCreate.length },
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
