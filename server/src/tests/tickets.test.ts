import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { eq } from 'drizzle-orm'
import { app } from '../app.js'
import { db } from '../db/index.js'
import { intervals, kmHistory, motorcycles, userMotorcycles, tickets, motorcycleIntervals } from '../db/schema/index.js'

let motoId: number
let userMotoId: number

beforeEach(() => {
  db.delete(motorcycleIntervals).run()
  db.delete(tickets).run()
  db.delete(kmHistory).run()
  db.delete(intervals).run()
  db.delete(userMotorcycles).run()
  db.delete(motorcycles).run()

  const [moto] = db
    .insert(motorcycles)
    .values({ brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997, isCustom: false })
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

  it('includes customKm and customDays from motorcycle_intervals override', async () => {
    const [interval] = db
      .insert(intervals)
      .values({ motorcycleId: motoId, operation: 'Oil change', intervalKm: 6000, intervalDays: null })
      .returning()
      .all()

    db.insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', intervalId: interval.id, status: 'todo' })
      .run()

    db.insert(motorcycleIntervals)
      .values({ userMotorcycleId: userMotoId, intervalId: interval.id, customKm: 4000, customDays: null })
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
    const res = await request(app)
      .post('/api/v1/tickets')
      .send({ userMotorcycleId: 999, operation: 'Oil change' })
    expect(res.status).toBe(404)
  })

  it('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .send({ userMotorcycleId: userMotoId })
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

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}/status`)
      .send({ status: 'in_progress' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('in_progress')
  })

  it('sets doneKm and doneAt when status becomes done', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .returning()
      .all()

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}/status`)
      .send({ status: 'done' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('done')
    expect(res.body.doneKm).toBe(8500)
    expect(res.body.doneAt).toBeTruthy()
  })

  it('clears doneKm and doneAt when moving back from done', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({
        userMotorcycleId: userMotoId,
        operation: 'Oil change',
        status: 'done',
        doneKm: 8500,
        doneAt: new Date(),
      })
      .returning()
      .all()

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}/status`)
      .send({ status: 'todo' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('todo')
    expect(res.body.doneKm).toBeNull()
    expect(res.body.doneAt).toBeNull()
  })

  it('returns 404 for unknown ticket', async () => {
    const res = await request(app)
      .patch('/api/v1/tickets/999/status')
      .send({ status: 'done' })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid status', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Brakes', status: 'todo' })
      .returning()
      .all()

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}/status`)
      .send({ status: 'invalid_status' })
    expect(res.status).toBe(400)
  })

  it('regenerates next ticket when done and intervalId is set', async () => {
    const [interval] = db
      .insert(intervals)
      .values({ motorcycleId: motoId, operation: 'Oil change', intervalKm: 6000, intervalDays: null })
      .returning()
      .all()

    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', intervalId: interval.id, status: 'todo' })
      .returning()
      .all()

    await request(app).patch(`/api/v1/tickets/${ticket.id}/status`).send({ status: 'done' })

    const all = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMotoId)).all()
    expect(all).toHaveLength(2)

    const next = all.find((t) => t.id !== ticket.id)!
    expect(next.status).toBe('todo')
    expect(next.operation).toBe('Oil change')
    expect(next.targetKm).toBe(8500 + 6000) // doneKm + intervalKm
    expect(next.intervalId).toBe(interval.id)
  })

  it('regenerates with targetDate when interval has intervalDays', async () => {
    const [interval] = db
      .insert(intervals)
      .values({ motorcycleId: motoId, operation: 'Brake fluid', intervalKm: null, intervalDays: 730 })
      .returning()
      .all()

    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Brake fluid', intervalId: interval.id, status: 'todo' })
      .returning()
      .all()

    await request(app).patch(`/api/v1/tickets/${ticket.id}/status`).send({ status: 'done' })

    const all = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMotoId)).all()
    const next = all.find((t) => t.id !== ticket.id)!
    expect(next.targetKm).toBeNull()
    expect(next.targetDate).toBeTruthy()
  })

  it('does not regenerate when ticket has no intervalId', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Custom check', status: 'todo' })
      .returning()
      .all()

    await request(app).patch(`/api/v1/tickets/${ticket.id}/status`).send({ status: 'done' })

    const all = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMotoId)).all()
    expect(all).toHaveLength(1)
  })

  it('regenerates using motorcycle_intervals override instead of catalogue default', async () => {
    const [interval] = db
      .insert(intervals)
      .values({ motorcycleId: motoId, operation: 'Oil change', intervalKm: 6000, intervalDays: null })
      .returning()
      .all()

    db.insert(motorcycleIntervals)
      .values({ userMotorcycleId: userMotoId, intervalId: interval.id, customKm: 4000, customDays: null })
      .run()

    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', intervalId: interval.id, status: 'todo' })
      .returning()
      .all()

    await request(app).patch(`/api/v1/tickets/${ticket.id}/status`).send({ status: 'done' })

    const all = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMotoId)).all()
    const next = all.find((t) => t.id !== ticket.id)!
    expect(next.targetKm).toBe(8500 + 4000) // uses custom 4000, not catalogue 6000
  })
})

describe('PATCH /api/v1/tickets/:id', () => {
  it('updates operation', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', status: 'todo' })
      .returning()
      .all()

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}`)
      .send({ operation: 'Full oil change' })

    expect(res.status).toBe(200)
    expect(res.body.operation).toBe('Full oil change')
  })

  it('updates targetKm', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Tires', status: 'todo', targetKm: 10000 })
      .returning()
      .all()

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}`)
      .send({ targetKm: 12000 })

    expect(res.status).toBe(200)
    expect(res.body.targetKm).toBe(12000)
  })

  it('clears targetKm when null is sent', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Tires', status: 'todo', targetKm: 10000 })
      .returning()
      .all()

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}`)
      .send({ targetKm: null })

    expect(res.status).toBe(200)
    expect(res.body.targetKm).toBeNull()
  })

  it('returns 404 for unknown ticket', async () => {
    const res = await request(app)
      .patch('/api/v1/tickets/999')
      .send({ operation: 'Oil change' })
    expect(res.status).toBe(404)
  })

  it('returns 400 when no field is provided', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Tires', status: 'todo' })
      .returning()
      .all()

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}`)
      .send({})
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
  it('creates a motorcycle_intervals override for an existing catalogue interval', async () => {
    const [interval] = db
      .insert(intervals)
      .values({ motorcycleId: motoId, operation: 'Oil change', intervalKm: 6000, intervalDays: null })
      .returning()
      .all()

    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', intervalId: interval.id, status: 'todo', targetKm: 14500 })
      .returning()
      .all()

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}/interval`)
      .send({ customKm: 4000 })

    expect(res.status).toBe(200)
    expect(res.body.targetKm).toBe(8500 + 4000)

    const override = db.select().from(motorcycleIntervals).all()
    expect(override).toHaveLength(1)
    expect(override[0].customKm).toBe(4000)
  })

  it('creates an interval entry and links it for a custom ticket without intervalId', async () => {
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
    expect(updatedTicket.intervalId).not.toBeNull()

    const override = db.select().from(motorcycleIntervals).all()
    expect(override).toHaveLength(1)
    expect(override[0].customKm).toBe(12000)
  })

  it('returns 400 when operation is missing for a custom ticket', async () => {
    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Fork oil', status: 'todo' })
      .returning()
      .all()

    const res = await request(app)
      .patch(`/api/v1/tickets/${ticket.id}/interval`)
      .send({ customKm: 12000 })

    expect(res.status).toBe(400)
  })

  it('updates an existing motorcycle_intervals record on second call', async () => {
    const [interval] = db
      .insert(intervals)
      .values({ motorcycleId: motoId, operation: 'Oil change', intervalKm: 6000, intervalDays: null })
      .returning()
      .all()

    const [ticket] = db
      .insert(tickets)
      .values({ userMotorcycleId: userMotoId, operation: 'Oil change', intervalId: interval.id, status: 'todo' })
      .returning()
      .all()

    await request(app).patch(`/api/v1/tickets/${ticket.id}/interval`).send({ customKm: 4000 })
    await request(app).patch(`/api/v1/tickets/${ticket.id}/interval`).send({ customKm: 3500 })

    const overrides = db.select().from(motorcycleIntervals).all()
    expect(overrides).toHaveLength(1)
    expect(overrides[0].customKm).toBe(3500)
  })

  it('returns 404 for unknown ticket', async () => {
    const res = await request(app)
      .patch('/api/v1/tickets/999/interval')
      .send({ customKm: 5000 })
    expect(res.status).toBe(404)
  })
})
