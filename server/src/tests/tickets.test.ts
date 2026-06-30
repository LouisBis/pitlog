import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { eq } from 'drizzle-orm'
import { app } from '../app.js'
import { db } from '../db/index.js'
import {
  intervalOverrides,
  customIntervals,
  kmHistory,
  motorcycles,
  userMotorcycles,
  tickets,
  ticketParts,
} from '../db/schema/index.js'

let motoId: number
let userMotoId: number

beforeEach(() => {
  db.delete(intervalOverrides).run()
  db.delete(ticketParts).run()
  db.delete(tickets).run()
  db.delete(customIntervals).run()
  db.delete(kmHistory).run()
  db.delete(userMotorcycles).run()
  db.delete(motorcycles).run()

  const [moto] = db
    .insert(motorcycles)
    .values({ brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997, isCustom: false, catalogSlug: 'suzuki-gsf600-bandit-1997' })
    .returning()
    .all()
  motoId = moto.id

  const [userMoto] = db
    .insert(userMotorcycles)
    .values({ motorcycleId: motoId, currentKm: 8500, acquiredAt: new Date('2022-01-01') })
    .returning()
    .all()
  userMotoId = userMoto.id
})

describe('GET /api/v1/tickets', () => {
  it('returns empty array when no tickets', async () => {
    const res = await request(app).get(`/api/v1/tickets?userMotorcycleId=${userMotoId}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('returns tickets for the given user motorcycle', async () => {
    db.insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .run()

    const res = await request(app).get(`/api/v1/tickets?userMotorcycleId=${userMotoId}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].operation).toBe('Oil change')
  })

  it('includes customKm and customDays from interval_overrides', async () => {
    db.insert(tickets)
      .values({
        userMotorcycleId: userMotoId,
        catalogSlug: 'suzuki-gsf600-bandit-1997',
        intervalSlug: 'oil-change',
        operation: 'Engine oil change',
        status: 'todo',
      })
      .run()

    db.insert(intervalOverrides)
      .values({
        userMotorcycleId: userMotoId,
        catalogSlug: 'suzuki-gsf600-bandit-1997',
        intervalSlug: 'oil-change',
        customKm: 4000,
        customDays: null,
      })
      .run()

    const res = await request(app).get(`/api/v1/tickets?userMotorcycleId=${userMotoId}`)
    expect(res.status).toBe(200)
    expect(res.body[0].customKm).toBe(4000)
    expect(res.body[0].customDays).toBeNull()
  })

  it('returns null customKm/customDays when no override exists', async () => {
    db.insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Chain lube', status: 'todo' })
      .run()

    const res = await request(app).get(`/api/v1/tickets?userMotorcycleId=${userMotoId}`)
    expect(res.status).toBe(200)
    expect(res.body[0].customKm).toBeNull()
    expect(res.body[0].customDays).toBeNull()
  })

  it('returns 400 when userMotorcycleId is missing', async () => {
    const res = await request(app).get('/api/v1/tickets')
    expect(res.status).toBe(400)
  })
})

describe('POST /api/v1/tickets', () => {
  it('creates a ticket', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .send({ userMotorcycleId: userMotoId, operation: 'Chain lubrication' })

    expect(res.status).toBe(201)
    expect(res.body.operation).toBe('Chain lubrication')
    expect(res.body.status).toBe('todo')
  })

  it('returns 404 for unknown userMotorcycleId', async () => {
    const res = await request(app).post('/api/v1/tickets').send({ userMotorcycleId: 999, operation: 'Oil change' })
    expect(res.status).toBe(404)
  })

  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/v1/tickets').send({ userMotorcycleId: userMotoId })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/v1/tickets/:id/status', () => {
  it('updates ticket status', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Tire check', status: 'todo' })
      .returning()
      .all()

    const res = await request(app).patch(`/api/v1/tickets/${ticket.id}/status`).send({ status: 'in_progress' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('in_progress')
  })

  it('sets doneKm and doneAt when status becomes done', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'in_progress' })
      .returning()
      .all()

    const res = await request(app).patch(`/api/v1/tickets/${ticket.id}/status`).send({ status: 'done' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('done')
    expect(res.body.doneKm).toBe(8500)
    expect(res.body.doneAt).toBeTruthy()
  })

  it('done tickets are immutable — all transitions from done return 422', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'done', doneKm: 8500, doneAt: new Date() })
      .returning()
      .all()

    for (const status of ['todo', 'part_ordered', 'in_progress', 'done']) {
      const res = await request(app).patch(`/api/v1/tickets/${ticket.id}/status`).send({ status })
      expect(res.status).toBe(422)
    }
  })

  it('returns 422 for invalid transitions (todo → done, part_ordered → done)', async () => {
    const [t1] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'A', status: 'todo' })
      .returning()
      .all()
    const [t2] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'B', status: 'part_ordered' })
      .returning()
      .all()

    expect((await request(app).patch(`/api/v1/tickets/${t1.id}/status`).send({ status: 'done' })).status).toBe(422)
    expect((await request(app).patch(`/api/v1/tickets/${t2.id}/status`).send({ status: 'done' })).status).toBe(422)
  })

  it('allows all valid forward and backward transitions', async () => {
    const [t1] = db.insert(tickets).values({ userMotorcycleId: userMotoId, operation: 'A', status: 'todo' }).returning().all()
    const [t2] = db.insert(tickets).values({ userMotorcycleId: userMotoId, operation: 'B', status: 'part_ordered' }).returning().all()
    const [t3] = db.insert(tickets).values({ userMotorcycleId: userMotoId, operation: 'C', status: 'in_progress' }).returning().all()

    expect((await request(app).patch(`/api/v1/tickets/${t1.id}/status`).send({ status: 'part_ordered' })).status).toBe(200)
    expect((await request(app).patch(`/api/v1/tickets/${t1.id}/status`).send({ status: 'todo' })).status).toBe(200)
    expect((await request(app).patch(`/api/v1/tickets/${t1.id}/status`).send({ status: 'in_progress' })).status).toBe(200)
    expect((await request(app).patch(`/api/v1/tickets/${t2.id}/status`).send({ status: 'todo' })).status).toBe(200)
    expect((await request(app).patch(`/api/v1/tickets/${t2.id}/status`).send({ status: 'in_progress' })).status).toBe(200)
    expect((await request(app).patch(`/api/v1/tickets/${t3.id}/status`).send({ status: 'done' })).status).toBe(200)
  })

  it('returns 404 for unknown ticket', async () => {
    const res = await request(app).patch('/api/v1/tickets/999/status').send({ status: 'done' })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid status', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Brakes', status: 'todo' })
      .returning()
      .all()

    const res = await request(app).patch(`/api/v1/tickets/${ticket.id}/status`).send({ status: 'invalid_status' })
    expect(res.status).toBe(400)
  })

  it('regenerates next ticket when done and catalog interval is set', async () => {
    // GSF 600 Bandit catalog: oil-change → 6000 km
    const [ticket] = db
      .insert(tickets)
      .values({
        userMotorcycleId: userMotoId,
        catalogSlug: 'suzuki-gsf600-bandit-1997',
        intervalSlug: 'oil-change',
        operation: 'Engine oil change',
        status: 'in_progress',
      })
      .returning()
      .all()

    await request(app).patch(`/api/v1/tickets/${ticket.id}/status`).send({ status: 'done' })

    const all = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMotoId)).all()
    expect(all).toHaveLength(2)

    const next = all.find((t) => t.id !== ticket.id)!
    expect(next.status).toBe('todo')
    expect(next.operation).toBe('Engine oil change')
    expect(next.targetKm).toBe(8500 + 6000)
    expect(next.catalogSlug).toBe('suzuki-gsf600-bandit-1997')
    expect(next.intervalSlug).toBe('oil-change')
  })

  it('regenerates with targetDate when catalog interval has only days', async () => {
    // GSF 600 Bandit catalog: brake-fluid-replacement → 730 days, no km
    const [ticket] = db
      .insert(tickets)
      .values({
        userMotorcycleId: userMotoId,
        catalogSlug: 'suzuki-gsf600-bandit-1997',
        intervalSlug: 'brake-fluid-replacement',
        operation: 'Brake fluid replacement',
        status: 'in_progress',
      })
      .returning()
      .all()

    await request(app).patch(`/api/v1/tickets/${ticket.id}/status`).send({ status: 'done' })

    const all = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMotoId)).all()
    const next = all.find((t) => t.id !== ticket.id)!
    expect(next.targetKm).toBeNull()
    expect(next.targetDate).toBeTruthy()
  })

  it('does not regenerate when ticket has no interval', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Custom check', status: 'in_progress' })
      .returning()
      .all()

    await request(app).patch(`/api/v1/tickets/${ticket.id}/status`).send({ status: 'done' })

    const all = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMotoId)).all()
    expect(all).toHaveLength(1)
  })

  it('regenerates using interval_overrides instead of catalogue default', async () => {
    // Catalog default is 6000 km, override sets 4000 km
    db.insert(intervalOverrides)
      .values({
        userMotorcycleId: userMotoId,
        catalogSlug: 'suzuki-gsf600-bandit-1997',
        intervalSlug: 'oil-change',
        customKm: 4000,
        customDays: null,
      })
      .run()

    const [ticket] = db
      .insert(tickets)
      .values({
        userMotorcycleId: userMotoId,
        catalogSlug: 'suzuki-gsf600-bandit-1997',
        intervalSlug: 'oil-change',
        operation: 'Engine oil change',
        status: 'in_progress',
      })
      .returning()
      .all()

    await request(app).patch(`/api/v1/tickets/${ticket.id}/status`).send({ status: 'done' })

    const all = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMotoId)).all()
    const next = all.find((t) => t.id !== ticket.id)!
    expect(next.targetKm).toBe(8500 + 4000)
  })
})

describe('PATCH /api/v1/tickets/:id', () => {
  it('updates operation', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .returning()
      .all()

    const res = await request(app).patch(`/api/v1/tickets/${ticket.id}`).send({ operation: 'Full oil change' })

    expect(res.status).toBe(200)
    expect(res.body.operation).toBe('Full oil change')
  })

  it('updates targetKm', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Tires', status: 'todo', targetKm: 10000 })
      .returning()
      .all()

    const res = await request(app).patch(`/api/v1/tickets/${ticket.id}`).send({ targetKm: 12000 })

    expect(res.status).toBe(200)
    expect(res.body.targetKm).toBe(12000)
  })

  it('clears targetKm when null is sent', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Tires', status: 'todo', targetKm: 10000 })
      .returning()
      .all()

    const res = await request(app).patch(`/api/v1/tickets/${ticket.id}`).send({ targetKm: null })

    expect(res.status).toBe(200)
    expect(res.body.targetKm).toBeNull()
  })

  it('returns 404 for unknown ticket', async () => {
    const res = await request(app).patch('/api/v1/tickets/999').send({ operation: 'Oil change' })
    expect(res.status).toBe(404)
  })

  it('returns 400 when no field is provided', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Tires', status: 'todo' })
      .returning()
      .all()

    const res = await request(app).patch(`/api/v1/tickets/${ticket.id}`).send({})
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/v1/tickets/:id', () => {
  it('deletes an existing ticket', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .returning()
      .all()

    const res = await request(app).delete(`/api/v1/tickets/${ticket.id}`)
    expect(res.status).toBe(204)

    const remaining = db.select().from(tickets).where(eq(tickets.id, ticket.id)).get()
    expect(remaining).toBeUndefined()
  })

  it('returns 404 for unknown ticket', async () => {
    const res = await request(app).delete('/api/v1/tickets/999')
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/tickets/:id/interval', () => {
  it('upserts an interval_overrides entry for a catalog ticket', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({
        userMotorcycleId: userMotoId,
        catalogSlug: 'suzuki-gsf600-bandit-1997',
        intervalSlug: 'oil-change',
        operation: 'Engine oil change',
        status: 'todo',
        targetKm: 14500,
      })
      .returning()
      .all()

    const res = await request(app).patch(`/api/v1/tickets/${ticket.id}/interval`).send({ customKm: 4000 })

    expect(res.status).toBe(200)
    expect(res.body.targetKm).toBe(8500 + 4000)

    const overrides = db.select().from(intervalOverrides).all()
    expect(overrides).toHaveLength(1)
    expect(overrides[0].customKm).toBe(4000)
  })

  it('creates a customIntervals entry and links it for a ticket with no interval', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Fork oil', status: 'todo' })
      .returning()
      .all()

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}/interval`)
      .send({ operation: 'Fork oil', customKm: 12000 })

    expect(res.status).toBe(200)

    const updatedTicket = db.select().from(tickets).where(eq(tickets.id, ticket.id)).get()!
    expect(updatedTicket.customIntervalId).not.toBeNull()

    const custom = db.select().from(customIntervals).all()
    expect(custom).toHaveLength(1)
    expect(custom[0].intervalKm).toBe(12000)
  })

  it('returns 400 when operation is missing for a custom ticket with no interval', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Fork oil', status: 'todo' })
      .returning()
      .all()

    const res = await request(app).patch(`/api/v1/tickets/${ticket.id}/interval`).send({ customKm: 12000 })
    expect(res.status).toBe(400)
  })

  it('updates an existing interval_overrides record on second call', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({
        userMotorcycleId: userMotoId,
        catalogSlug: 'suzuki-gsf600-bandit-1997',
        intervalSlug: 'oil-change',
        operation: 'Engine oil change',
        status: 'todo',
      })
      .returning()
      .all()

    await request(app).patch(`/api/v1/tickets/${ticket.id}/interval`).send({ customKm: 4000 })
    await request(app).patch(`/api/v1/tickets/${ticket.id}/interval`).send({ customKm: 3500 })

    const overrides = db.select().from(intervalOverrides).all()
    expect(overrides).toHaveLength(1)
    expect(overrides[0].customKm).toBe(3500)
  })

  it('returns 404 for unknown ticket', async () => {
    const res = await request(app).patch('/api/v1/tickets/999/interval').send({ customKm: 5000 })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/tickets/:id/parts', () => {
  it('returns empty array when no parts', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .returning()
      .all()

    const res = await request(app).get(`/api/v1/tickets/${ticket.id}/parts`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('returns parts for the given ticket', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .returning()
      .all()

    db.insert(ticketParts)
      .values({ ticketId: ticket.id, name: 'Oil filter', brand: 'Mann', quantity: 1 })
      .run()

    const res = await request(app).get(`/api/v1/tickets/${ticket.id}/parts`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Oil filter')
    expect(res.body[0].brand).toBe('Mann')
  })

  it('returns 404 for unknown ticket', async () => {
    const res = await request(app).get('/api/v1/tickets/999/parts')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/tickets/:id/parts', () => {
  it('creates a part for a ticket', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .returning()
      .all()

    const res = await request(app).post(`/api/v1/tickets/${ticket.id}/parts`).send({
      name: 'Oil filter',
      brand: 'Mann',
      reference: 'W811/80',
      quantity: 1,
      url: 'https://example.com/filter',
    })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Oil filter')
    expect(res.body.brand).toBe('Mann')
    expect(res.body.reference).toBe('W811/80')
    expect(res.body.url).toBe('https://example.com/filter')
    expect(res.body.ticketId).toBe(ticket.id)
  })

  it('defaults quantity to 1', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .returning()
      .all()

    const res = await request(app).post(`/api/v1/tickets/${ticket.id}/parts`).send({ name: 'Drain bolt' })

    expect(res.status).toBe(201)
    expect(res.body.quantity).toBe(1)
  })

  it('returns 404 for unknown ticket', async () => {
    const res = await request(app).post('/api/v1/tickets/999/parts').send({ name: 'Filter' })
    expect(res.status).toBe(404)
  })

  it('returns 400 when name is missing', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .returning()
      .all()

    const res = await request(app).post(`/api/v1/tickets/${ticket.id}/parts`).send({ brand: 'Mann' })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/v1/tickets/:id/parts/:partId', () => {
  it('deletes a part', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .returning()
      .all()

    const [part] = db.insert(ticketParts).values({ ticketId: ticket.id, name: 'Oil filter', quantity: 1 }).returning().all()

    const res = await request(app).delete(`/api/v1/tickets/${ticket.id}/parts/${part.id}`)
    expect(res.status).toBe(204)

    const remaining = db.select().from(ticketParts).where(eq(ticketParts.id, part.id)).get()
    expect(remaining).toBeUndefined()
  })

  it('returns 404 for unknown part', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .returning()
      .all()

    const res = await request(app).delete(`/api/v1/tickets/${ticket.id}/parts/999`)
    expect(res.status).toBe(404)
  })

  it('returns 404 when part does not belong to the ticket', async () => {
    const [ticket1] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .returning()
      .all()

    const [ticket2] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Brake pads', status: 'todo' })
      .returning()
      .all()

    const [part] = db.insert(ticketParts).values({ ticketId: ticket2.id, name: 'Brake pad', quantity: 2 }).returning().all()

    const res = await request(app).delete(`/api/v1/tickets/${ticket1.id}/parts/${part.id}`)
    expect(res.status).toBe(404)
  })
})
