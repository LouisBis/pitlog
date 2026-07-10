import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import {
  tickets,
  userMotorcycles,
  intervalOverrides,
  customIntervals,
  motorcycles,
  ticketParts,
  TICKET_STATUSES,
  type TicketStatus,
} from '../db/schema/index.js'
import { validateBody } from '../middleware/validate.js'
import { loadCatalogEntry } from '../lib/catalog.js'
import logger from '../lib/logger.js'
import { parseId } from '../lib/parseId.js'

const router = Router()

const createSchema = z.object({
  userMotorcycleId: z.number().int().positive(),
  operation: z.string().min(1),
  catalogSlug: z.string().optional(),
  intervalSlug: z.string().optional(),
  targetKm: z.number().int().min(0).optional(),
  targetDate: z.coerce.date().optional(),
})

const updateTicketSchema = z.object({
  operation: z.string().min(1).optional(),
  targetKm: z.number().int().min(0).nullable().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES),
})

const updateIntervalSchema = z.object({
  customKm: z.number().int().positive().nullable().optional(),
  customDays: z.number().int().positive().nullable().optional(),
  operation: z.string().min(1).optional(),
})

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  todo: ['part_ordered', 'in_progress'],
  part_ordered: ['todo', 'in_progress'],
  in_progress: ['todo', 'part_ordered', 'done'],
  done: [],
}

/** Returns effective km/days for a ticket, applying intervalOverrides or customIntervals. */
function resolveInterval(userMotorcycleId: number, ticket: typeof tickets.$inferSelect) {
  if (ticket.catalogSlug && ticket.intervalSlug) {
    const entry = loadCatalogEntry(ticket.catalogSlug)
    const catalogInterval = entry?.intervals.find((i) => i.slug === ticket.intervalSlug)
    if (!catalogInterval) return null

    const override = db
      .select()
      .from(intervalOverrides)
      .where(
        and(
          eq(intervalOverrides.userMotorcycleId, userMotorcycleId),
          eq(intervalOverrides.catalogSlug, ticket.catalogSlug),
          eq(intervalOverrides.intervalSlug, ticket.intervalSlug),
        ),
      )
      .get()

    return {
      intervalKm: override?.customKm ?? catalogInterval.km,
      intervalDays: override?.customDays ?? catalogInterval.days,
    }
  }

  if (ticket.customIntervalId) {
    const custom = db.select().from(customIntervals).where(eq(customIntervals.id, ticket.customIntervalId)).get()
    if (!custom) return null
    return { intervalKm: custom.intervalKm, intervalDays: custom.intervalDays }
  }

  return null
}

router.get('/', (req, res) => {
  const userMotorcycleId = parseId(req.query.userMotorcycleId, res)
  if (userMotorcycleId === null) return

  const result = db
    .select({
      id: tickets.id,
      userMotorcycleId: tickets.userMotorcycleId,
      catalogSlug: tickets.catalogSlug,
      intervalSlug: tickets.intervalSlug,
      customIntervalId: tickets.customIntervalId,
      operation: tickets.operation,
      status: tickets.status,
      targetKm: tickets.targetKm,
      targetDate: tickets.targetDate,
      doneKm: tickets.doneKm,
      doneAt: tickets.doneAt,
      customKm: intervalOverrides.customKm,
      customDays: intervalOverrides.customDays,
    })
    .from(tickets)
    .leftJoin(
      intervalOverrides,
      and(
        eq(intervalOverrides.userMotorcycleId, tickets.userMotorcycleId),
        eq(intervalOverrides.catalogSlug, tickets.catalogSlug),
        eq(intervalOverrides.intervalSlug, tickets.intervalSlug),
      ),
    )
    .where(eq(tickets.userMotorcycleId, userMotorcycleId))
    .all()

  res.json(result)
})

router.post('/', validateBody(createSchema), (req, res) => {
  const body = res.locals.body as z.infer<typeof createSchema>

  const userMoto = db.select().from(userMotorcycles).where(eq(userMotorcycles.id, body.userMotorcycleId)).get()
  if (!userMoto) {
    logger.warn({ userMotorcycleId: body.userMotorcycleId }, 'User motorcycle not found')
    res.status(404).json({ error: 'User motorcycle not found' })
    return
  }

  const [created] = db.insert(tickets).values(body).returning().all()

  logger.info({ ticketId: created.id, operation: created.operation, userMotorcycleId: body.userMotorcycleId }, 'Ticket created')
  res.status(201).json(created)
})

router.patch('/:id/status', validateBody(updateStatusSchema), (req, res) => {
  const id = parseId(req.params.id, res)
  if (id === null) return

  const { status } = res.locals.body as z.infer<typeof updateStatusSchema>

  const ticket = db.select().from(tickets).where(eq(tickets.id, id)).get()
  if (!ticket) {
    logger.warn({ ticketId: id }, 'Ticket not found')
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  if (!VALID_TRANSITIONS[ticket.status].includes(status)) {
    logger.warn({ ticketId: id, from: ticket.status, to: status }, 'Invalid status transition')
    res.status(422).json({ error: `Transition ${ticket.status} → ${status} not allowed` })
    return
  }

  let updates: Partial<typeof ticket>
  if (status === 'done') {
    const userMotoForKm = db.select().from(userMotorcycles).where(eq(userMotorcycles.id, ticket.userMotorcycleId)).get()
    if (!userMotoForKm) {
      logger.warn({ ticketId: id, userMotorcycleId: ticket.userMotorcycleId }, 'User motorcycle not found on done transition')
      res.status(500).json({ error: 'User motorcycle not found' })
      return
    }
    updates = { status, doneAt: new Date(), doneKm: userMotoForKm.currentKm }
  } else {
    updates = { status, doneAt: null, doneKm: null }
  }

  const [updated] = db.update(tickets).set(updates).where(eq(tickets.id, id)).returning().all()

  const hasInterval = ticket.catalogSlug || ticket.customIntervalId
  if (status === 'done' && hasInterval && updated.doneKm !== null && updated.doneAt !== null) {
    const effective = resolveInterval(ticket.userMotorcycleId, ticket)
    if (effective) {
      const nextTargetKm = effective.intervalKm !== null ? updated.doneKm + effective.intervalKm : null
      const nextTargetDate =
        effective.intervalDays !== null
          ? new Date(updated.doneAt.getTime() + effective.intervalDays * 24 * 60 * 60 * 1000)
          : null

      db.insert(tickets)
        .values({
          userMotorcycleId: ticket.userMotorcycleId,
          catalogSlug: ticket.catalogSlug,
          intervalSlug: ticket.intervalSlug,
          customIntervalId: ticket.customIntervalId,
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
  const id = parseId(req.params.id, res)
  if (id === null) return

  const { customKm, customDays, operation } = res.locals.body as z.infer<typeof updateIntervalSchema>

  const ticket = db.select().from(tickets).where(eq(tickets.id, id)).get()
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  const userMoto = db.select().from(userMotorcycles).where(eq(userMotorcycles.id, ticket.userMotorcycleId)).get()
  if (!userMoto) {
    logger.warn({ ticketId: id, userMotorcycleId: ticket.userMotorcycleId }, 'User motorcycle not found on interval update')
    res.status(404).json({ error: 'User motorcycle not found' })
    return
  }

  if (ticket.catalogSlug && ticket.intervalSlug) {
    db.insert(intervalOverrides)
      .values({
        userMotorcycleId: ticket.userMotorcycleId,
        catalogSlug: ticket.catalogSlug,
        intervalSlug: ticket.intervalSlug,
        customKm: customKm ?? null,
        customDays: customDays ?? null,
      })
      .onConflictDoUpdate({
        target: [intervalOverrides.userMotorcycleId, intervalOverrides.catalogSlug, intervalOverrides.intervalSlug],
        set: { customKm: customKm ?? null, customDays: customDays ?? null },
      })
      .run()
    logger.info({ ticketId: ticket.id, catalogSlug: ticket.catalogSlug, intervalSlug: ticket.intervalSlug, customKm, customDays }, 'Interval override upserted')
  } else if (!ticket.customIntervalId) {
    if (!operation) {
      res.status(400).json({ error: 'operation is required for tickets without an existing interval' })
      return
    }
    const moto = db.select().from(motorcycles).where(eq(motorcycles.id, userMoto.motorcycleId)).get()
    if (!moto) {
      res.status(404).json({ error: 'Motorcycle not found' })
      return
    }
    const [newInterval] = db
      .insert(customIntervals)
      .values({ motorcycleId: moto.id, operation, intervalKm: customKm ?? null, intervalDays: customDays ?? null })
      .returning()
      .all()
    db.update(tickets).set({ customIntervalId: newInterval.id, operation }).where(eq(tickets.id, ticket.id)).run()
    logger.info({ ticketId: ticket.id, customIntervalId: newInterval.id, operation }, 'Custom interval created for ticket')
  } else {
    db.update(customIntervals)
      .set({ intervalKm: customKm ?? null, intervalDays: customDays ?? null })
      .where(eq(customIntervals.id, ticket.customIntervalId))
      .run()
    logger.info({ ticketId: ticket.id, customIntervalId: ticket.customIntervalId, customKm, customDays }, 'Custom interval updated')
  }

  const newTargetKm = customKm != null ? userMoto.currentKm + customKm : null
  const newTargetDate = customDays != null ? new Date(Date.now() + customDays * 24 * 60 * 60 * 1000) : null

  const [updated] = db
    .update(tickets)
    .set({ targetKm: newTargetKm, targetDate: newTargetDate })
    .where(eq(tickets.id, id))
    .returning()
    .all()

  logger.info({ ticketId: ticket.id, customKm, customDays }, 'Ticket interval updated')
  res.json(updated)
})

router.patch('/:id', validateBody(updateTicketSchema), (req, res) => {
  const id = parseId(req.params.id, res)
  if (id === null) return

  const body = res.locals.body as z.infer<typeof updateTicketSchema>
  if (!body.operation && body.targetKm === undefined) {
    res.status(400).json({ error: 'At least one field required: operation, targetKm' })
    return
  }

  const ticket = db.select().from(tickets).where(eq(tickets.id, id)).get()
  if (!ticket) {
    logger.warn({ ticketId: id }, 'Ticket not found for update')
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  const [updated] = db
    .update(tickets)
    .set({
      ...(body.operation !== undefined && { operation: body.operation }),
      ...(body.targetKm !== undefined && { targetKm: body.targetKm }),
    })
    .where(eq(tickets.id, id))
    .returning()
    .all()

  logger.info({ ticketId: updated.id, operation: updated.operation, targetKm: updated.targetKm }, 'Ticket updated')
  res.json(updated)
})

router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id, res)
  if (id === null) return

  const ticket = db.select().from(tickets).where(eq(tickets.id, id)).get()
  if (!ticket) {
    logger.warn({ ticketId: id }, 'Ticket not found for deletion')
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  db.delete(ticketParts).where(eq(ticketParts.ticketId, id)).run()
  db.delete(tickets).where(eq(tickets.id, id)).run()
  logger.info({ ticketId: id, operation: ticket.operation }, 'Ticket deleted')
  res.status(204).send()
})

const createPartSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  reference: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  url: z.string().url().optional(),
})

router.get('/:id/parts', (req, res) => {
  const id = parseId(req.params.id, res)
  if (id === null) return

  const ticket = db.select().from(tickets).where(eq(tickets.id, id)).get()
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  const parts = db.select().from(ticketParts).where(eq(ticketParts.ticketId, id)).all()
  res.json(parts)
})

router.post('/:id/parts', validateBody(createPartSchema), (req, res) => {
  const id = parseId(req.params.id, res)
  if (id === null) return

  const body = res.locals.body as z.infer<typeof createPartSchema>

  const ticket = db.select().from(tickets).where(eq(tickets.id, id)).get()
  if (!ticket) {
    logger.warn({ ticketId: id }, 'Ticket not found for part creation')
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  const [created] = db
    .insert(ticketParts)
    .values({ ticketId: id, ...body })
    .returning()
    .all()

  logger.info({ partId: created.id, ticketId: id, name: body.name }, 'Part added to ticket')
  res.status(201).json(created)
})

router.delete('/:id/parts/:partId', (req, res) => {
  const id = parseId(req.params.id, res)
  if (id === null) return
  const partId = parseId(req.params.partId, res)
  if (partId === null) return

  const part = db
    .select()
    .from(ticketParts)
    .where(and(eq(ticketParts.id, partId), eq(ticketParts.ticketId, id)))
    .get()

  if (!part) {
    logger.warn({ partId, ticketId: id }, 'Part not found for deletion')
    res.status(404).json({ error: 'Part not found' })
    return
  }

  db.delete(ticketParts).where(eq(ticketParts.id, partId)).run()
  logger.info({ partId, ticketId: id, name: part.name }, 'Part deleted')
  res.status(204).send()
})

export default router
