import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { tickets, userMotorcycles, TICKET_STATUSES } from '../db/schema/index.js'
import { validateBody } from '../middleware/validate.js'

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
    res.status(404).json({ error: 'User motorcycle not found' })
    return
  }

  const [created] = db
    .insert(tickets)
    .values(body)
    .returning()
    .all()

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

  res.json(updated)
})

export default router
