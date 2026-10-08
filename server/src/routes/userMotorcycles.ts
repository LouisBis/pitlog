import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { userMotorcycles, motorcycles, kmHistory, tickets, ticketParts, customIntervals } from '../db/schema/index.js'
import { validateBody } from '../middleware/validate.js'
import { computeVelocity } from '../lib/velocity.js'
import { loadCatalogEntry, loadAllCatalogEntries } from '../lib/catalog.js'
import type { CatalogInterval } from '../lib/catalog.js'
import logger from '../lib/logger.js'
import { parseId } from '../lib/parseId.js'
import { regenerateIfDue } from '../lib/ticketRegeneration.js'

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

const historyEntrySchema = z
  .object({
    operation: z.string().min(1),
    doneAt: z.coerce.date(),
    doneKm: z.number().int().min(0),
    catalogSlug: z.string().optional(),
    intervalSlug: z.string().optional(),
    customIntervalId: z.number().int().positive().optional(),
    photoBase64: z
      .string()
      .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/)
      .optional(),
  })
  .refine((e) => !(e.customIntervalId && (e.catalogSlug || e.intervalSlug)), {
    message: 'catalogSlug/intervalSlug and customIntervalId are mutually exclusive',
  })
  .refine((e) => Boolean(e.catalogSlug) === Boolean(e.intervalSlug), {
    message: 'catalogSlug and intervalSlug must be provided together',
  })

const importHistorySchema = z.object({
  entries: z.array(historyEntrySchema).min(1).max(2000),
})

/** Groups done tickets by their recurring-interval key (catalog slug+interval, or custom interval id).
 *  Entries with no interval link are excluded — they're one-off, nothing to regenerate. */
function groupByLatestPerInterval(created: (typeof tickets.$inferSelect)[]): (typeof tickets.$inferSelect)[] {
  const groups = new Map<string, (typeof tickets.$inferSelect)>()
  for (const t of created) {
    const key = t.catalogSlug && t.intervalSlug ? `catalog:${t.catalogSlug}:${t.intervalSlug}` : t.customIntervalId ? `custom:${t.customIntervalId}` : null
    if (!key || t.doneAt === null || t.doneKm === null) continue

    const current = groups.get(key)
    const isLater =
      !current ||
      current.doneAt === null ||
      current.doneKm === null ||
      t.doneAt.getTime() > current.doneAt.getTime() ||
      (t.doneAt.getTime() === current.doneAt.getTime() && t.doneKm > current.doneKm)
    if (isLater) groups.set(key, t)
  }
  return [...groups.values()]
}

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

  const catalogEntry = loadAllCatalogEntries().find(
    (e) =>
      e.brand.toLowerCase() === brand.toLowerCase() &&
      e.model.toLowerCase() === model.toLowerCase() &&
      e.year_start <= year && (e.year_end == null || year <= e.year_end),
  )
  const isCustom = !catalogEntry
  const catalogSlug = catalogEntry?.slug ?? null

  const existing = db
    .select()
    .from(motorcycles)
    .where(and(eq(motorcycles.brand, brand), eq(motorcycles.model, model), eq(motorcycles.year, year)))
    .get()

  const motorcycle =
    existing ??
    db.insert(motorcycles).values({ brand, model, year, isCustom, catalogSlug }).returning().get()

  if (!existing) {
    logger.info({ motorcycleId: motorcycle.id, brand, model, year, isCustom, catalogSlug }, 'Motorcycle created')
  }

  const [userMoto] = db
    .insert(userMotorcycles)
    .values({ motorcycleId: motorcycle.id, currentKm, acquiredAt: new Date() })
    .returning()
    .all()

  db.insert(kmHistory).values({ userMotorcycleId: userMoto.id, km: currentKm, recordedAt: new Date() }).run()

  const effectiveSlug = isCustom ? 'generic-standard' : catalogSlug
  if (effectiveSlug) {
    const entry = loadCatalogEntry(effectiveSlug)
    if (entry) seedCatalogTickets(userMoto.id, currentKm, effectiveSlug, entry.categories.flatMap((c) => c.intervals))
  }

  if (isCustom) {
    logger.info({ userMotorcycleId: userMoto.id }, 'Custom motorcycle seeded with generic intervals')
  }

  res.status(201).json({ ...userMoto, brand, model, year, isCustom, catalogSlug })
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
  const allIntervals = entry ? entry.categories.flatMap((c) => c.intervals) : []
  if (!entry || allIntervals.length === 0) {
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

  const toCreate = allIntervals.filter((i) => !coveredSlugs.has(i.slug))
  seedCatalogTickets(id, userMoto.currentKm, motorcycle.catalogSlug, toCreate)
  logger.info(
    { userMotorcycleId: id, created: toCreate.length, skipped: allIntervals.length - toCreate.length },
    'Intervals imported',
  )
  res.json({ created: toCreate.length })
})

router.post('/:id/history/import', validateBody(importHistorySchema), (req, res) => {
  const id = parseId(req.params.id, res)
  if (id === null) return

  const { entries } = res.locals.body as z.infer<typeof importHistorySchema>

  const userMoto = db.select().from(userMotorcycles).where(eq(userMotorcycles.id, id)).get()
  if (!userMoto) {
    logger.warn({ userMotorcycleId: id }, 'User motorcycle not found for history import')
    res.status(404).json({ error: 'User motorcycle not found' })
    return
  }

  const motorcycle = db.select().from(motorcycles).where(eq(motorcycles.id, userMoto.motorcycleId)).get()

  for (const e of entries) {
    if (e.catalogSlug && e.catalogSlug !== motorcycle?.catalogSlug) {
      logger.warn(
        { userMotorcycleId: id, catalogSlug: e.catalogSlug },
        'History import rejected: catalogSlug does not belong to this motorcycle',
      )
      res.status(400).json({ error: 'catalogSlug does not belong to this motorcycle' })
      return
    }
    if (e.customIntervalId) {
      const custom = db.select().from(customIntervals).where(eq(customIntervals.id, e.customIntervalId)).get()
      if (!custom || custom.motorcycleId !== userMoto.motorcycleId) {
        logger.warn(
          { userMotorcycleId: id, customIntervalId: e.customIntervalId },
          'History import rejected: customIntervalId does not belong to this motorcycle',
        )
        res.status(400).json({ error: 'customIntervalId does not belong to this motorcycle' })
        return
      }
    }
  }

  const created = db
    .insert(tickets)
    .values(
      entries.map((e) => ({
        userMotorcycleId: id,
        operation: e.operation,
        status: 'done' as const,
        doneAt: e.doneAt,
        doneKm: e.doneKm,
        catalogSlug: e.catalogSlug ?? null,
        intervalSlug: e.intervalSlug ?? null,
        customIntervalId: e.customIntervalId ?? null,
        photoBase64: e.photoBase64 ?? null,
      })),
    )
    .returning()
    .all()

  let regenerated = 0
  for (const latest of groupByLatestPerInterval(created)) {
    if (regenerateIfDue(id, latest)) regenerated++
  }

  logger.info({ userMotorcycleId: id, created: created.length, regenerated }, 'History imported')
  res.status(201).json({ created: created.length, regenerated })
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
