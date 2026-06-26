import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import {
  tickets,
  userMotorcycles,
  intervals,
  motorcycleIntervals,
  motorcycles,
  ticketParts,
  TICKET_STATUSES,
  type TicketStatus,
} from '../db/schema/index.js'
import { validateBody } from '../middleware/validate.js'
import logger from '../lib/logger.js'
import { parseId } from '../lib/parseId.js'

const updateTicketSchema = z.object({
  operation: z.string().min(1).optional(),
  targetKm: z.number().int().min(0).nullable().optional(),
})

const router = Router()

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

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  todo: ['part_ordered', 'in_progress'],
  part_ordered: ['todo', 'in_progress'],
  in_progress: ['todo', 'part_ordered', 'done'],
  done: [],
}

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
      and(eq(motorcycleIntervals.userMotorcycleId, userMotorcycleId), eq(motorcycleIntervals.intervalId, intervalId)),
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
  const userMotorcycleId = parseId(req.query.userMotorcycleId, res)
  if (userMotorcycleId === null) return

  const result = db
    .select({
      id: tickets.id,
      userMotorcycleId: tickets.userMotorcycleId,
      intervalId: tickets.intervalId,
      operation: tickets.operation,
      status: tickets.status,
      targetKm: tickets.targetKm,
      targetDate: tickets.targetDate,
      doneKm: tickets.doneKm,
      doneAt: tickets.doneAt,
      customKm: motorcycleIntervals.customKm,
      customDays: motorcycleIntervals.customDays,
    })
    .from(tickets)
    .leftJoin(
      motorcycleIntervals,
      and(
        eq(motorcycleIntervals.intervalId, tickets.intervalId),
        eq(motorcycleIntervals.userMotorcycleId, tickets.userMotorcycleId),
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

  logger.info(
    {
      ticketId: created.id,
      operation: created.operation,
      userMotorcycleId: body.userMotorcycleId,
    },
    'Ticket created',
  )
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
      logger.warn(
        { ticketId: id, userMotorcycleId: ticket.userMotorcycleId },
        'User motorcycle not found on done transition',
      )
      res.status(500).json({ error: 'User motorcycle not found' })
      return
    }
    updates = { status, doneAt: new Date(), doneKm: userMotoForKm.currentKm }
  } else {
    updates = { status, doneAt: null, doneKm: null }
  }

  const [updated] = db.update(tickets).set(updates).where(eq(tickets.id, id)).returning().all()

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
    logger.warn(
      { ticketId: id, userMotorcycleId: ticket.userMotorcycleId },
      'User motorcycle not found on interval update',
    )
    res.status(404).json({ error: 'User motorcycle not found' })
    return
  }
  const moto = db.select().from(motorcycles).where(eq(motorcycles.id, userMoto.motorcycleId)).get()
  if (!moto) {
    logger.warn({ ticketId: id, motorcycleId: userMoto.motorcycleId }, 'Motorcycle not found on interval update')
    res.status(404).json({ error: 'Motorcycle not found' })
    return
  }

  let intervalId = ticket.intervalId

  if (!intervalId) {
    if (!operation) {
      res.status(400).json({
        error: 'operation is required for tickets without an existing interval',
      })
      return
    }
    const [newInterval] = db
      .insert(intervals)
      .values({
        motorcycleId: moto.id,
        operation,
        intervalKm: customKm ?? null,
        intervalDays: customDays ?? null,
      })
      .returning()
      .all()
    intervalId = newInterval.id
    db.update(tickets).set({ intervalId, operation }).where(eq(tickets.id, ticket.id)).run()
    logger.info({ ticketId: ticket.id, intervalId, operation }, 'Custom interval created for ticket')
  }

  db.insert(motorcycleIntervals)
    .values({
      userMotorcycleId: ticket.userMotorcycleId,
      intervalId,
      customKm: customKm ?? null,
      customDays: customDays ?? null,
    })
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
    .where(eq(tickets.id, id))
    .returning()
    .all()

  logger.info({ ticketId: ticket.id, intervalId, customKm, customDays }, 'Ticket interval updated')
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

  logger.info(
    {
      ticketId: updated.id,
      operation: updated.operation,
      targetKm: updated.targetKm,
    },
    'Ticket updated',
  )
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
