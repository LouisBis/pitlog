import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { tickets, userMotorcycles, intervals, motorcycleIntervals, motorcycles, TICKET_STATUSES } from '../db/schema/index.js'
import { validateBody } from '../middleware/validate.js'
import logger from '../lib/logger.js'

const router = Router()

const idSchema = z.coerce.number().int().positive()

const createSchema = z.object({
  userMotorcycleId: z.number().int().positive(),
  operation: z.string().min(1),
  intervalId: z.number().int().positive().optional(),
  targetKm: z.number().int().min(0).optional(),
  targetDate: z.coerce.date().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES),
})

const updateIntervalSchema = z.object({
  customKm: z.number().int().positive().nullable().optional(),
  customDays: z.number().int().positive().nullable().optional(),
  operation: z.string().min(1).optional(),
})

function resolveInterval(userMotorcycleId: number, intervalId: number) {
  const override = db
    .select()
    .from(motorcycleIntervals)
    .where(
      and(
        eq(motorcycleIntervals.userMotorcycleId, userMotorcycleId),
        eq(motorcycleIntervals.intervalId, intervalId)
      )
    )
    .get()

  const base = db.select().from(intervals).where(eq(intervals.id, intervalId)).get()
  if (!base) return null

  return {
    intervalKm: override?.customKm ?? base.intervalKm,
    intervalDays: override?.customDays ?? base.intervalDays,
  }
}

router.get('/', (req, res) => {
  const parsed = idSchema.safeParse(req.query.userMotorcycleId)
  if (!parsed.success) {
    res.status(400).json({ error: 'Missing or invalid userMotorcycleId query param' })
    return
  }

  const result = db
    .select()
    .from(tickets)
    .where(eq(tickets.userMotorcycleId, parsed.data))
    .all()

  res.json(result)
})

router.post('/', validateBody(createSchema), (req, res) => {
  const body = res.locals.body as z.infer<typeof createSchema>

  const userMoto = db
    .select()
    .from(userMotorcycles)
    .where(eq(userMotorcycles.id, body.userMotorcycleId))
    .get()

  if (!userMoto) {
    logger.warn({ userMotorcycleId: body.userMotorcycleId }, 'User motorcycle not found')
    res.status(404).json({ error: 'User motorcycle not found' })
    return
  }

  const [created] = db
    .insert(tickets)
    .values(body)
    .returning()
    .all()

  logger.info({ ticketId: created.id, operation: created.operation, userMotorcycleId: body.userMotorcycleId }, 'Ticket created')
  res.status(201).json(created)
})

router.patch('/:id/status', validateBody(updateStatusSchema), (req, res) => {
  const parsedId = idSchema.safeParse(req.params.id)
  if (!parsedId.success) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }

  const { status } = res.locals.body as z.infer<typeof updateStatusSchema>

  const ticket = db
    .select()
    .from(tickets)
    .where(eq(tickets.id, parsedId.data))
    .get()

  if (!ticket) {
    logger.warn({ ticketId: parsedId.data }, 'Ticket not found')
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  const updates: Partial<typeof ticket> =
    status === 'done'
      ? {
          status,
          doneAt: new Date(),
          doneKm: db.select().from(userMotorcycles).where(eq(userMotorcycles.id, ticket.userMotorcycleId)).get()!.currentKm,
        }
      : { status, doneAt: null, doneKm: null }

  const [updated] = db
    .update(tickets)
    .set(updates)
    .where(eq(tickets.id, parsedId.data))
    .returning()
    .all()

  if (status === 'done' && ticket.intervalId && updated.doneKm !== null && updated.doneAt !== null) {
    const effective = resolveInterval(ticket.userMotorcycleId, ticket.intervalId)
    if (effective) {
      const nextTargetKm = effective.intervalKm !== null ? updated.doneKm + effective.intervalKm : null
      const nextTargetDate =
        effective.intervalDays !== null
          ? new Date(updated.doneAt.getTime() + effective.intervalDays * 24 * 60 * 60 * 1000)
          : null

      db.insert(tickets)
        .values({
          userMotorcycleId: ticket.userMotorcycleId,
          intervalId: ticket.intervalId,
          operation: ticket.operation,
          status: 'todo',
          targetKm: nextTargetKm,
          targetDate: nextTargetDate,
        })
        .run()

      logger.info({ ticketId: updated.id, operation: ticket.operation, nextTargetKm }, 'Ticket regenerated')
    }
  }

  res.json(updated)
})

router.patch('/:id/interval', validateBody(updateIntervalSchema), (req, res) => {
  const parsedId = idSchema.safeParse(req.params.id)
  if (!parsedId.success) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }

  const { customKm, customDays, operation } = res.locals.body as z.infer<typeof updateIntervalSchema>

  const ticket = db.select().from(tickets).where(eq(tickets.id, parsedId.data)).get()
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  const userMoto = db.select().from(userMotorcycles).where(eq(userMotorcycles.id, ticket.userMotorcycleId)).get()!
  const moto = db.select().from(motorcycles).where(eq(motorcycles.id, userMoto.motorcycleId)).get()!

  let intervalId = ticket.intervalId

  if (!intervalId) {
    if (!operation) {
      res.status(400).json({ error: 'operation is required for tickets without an existing interval' })
      return
    }
    const [newInterval] = db
      .insert(intervals)
      .values({ motorcycleId: moto.id, operation, intervalKm: customKm ?? null, intervalDays: customDays ?? null })
      .returning()
      .all()
    intervalId = newInterval.id
    db.update(tickets).set({ intervalId, operation }).where(eq(tickets.id, ticket.id)).run()
    logger.info({ ticketId: ticket.id, intervalId, operation }, 'Custom interval created for ticket')
  }

  db.insert(motorcycleIntervals)
    .values({ userMotorcycleId: ticket.userMotorcycleId, intervalId, customKm: customKm ?? null, customDays: customDays ?? null })
    .onConflictDoUpdate({
      target: [motorcycleIntervals.userMotorcycleId, motorcycleIntervals.intervalId],
      set: { customKm: customKm ?? null, customDays: customDays ?? null },
    })
    .run()

  const newTargetKm = customKm != null ? userMoto.currentKm + customKm : null
  const newTargetDate = customDays != null ? new Date(Date.now() + customDays * 24 * 60 * 60 * 1000) : null

  const [updated] = db
    .update(tickets)
    .set({ targetKm: newTargetKm, targetDate: newTargetDate })
    .where(eq(tickets.id, parsedId.data))
    .returning()
    .all()

  logger.info({ ticketId: ticket.id, intervalId, customKm, customDays }, 'Ticket interval updated')
  res.json(updated)
})

export default router
