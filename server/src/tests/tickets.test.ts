import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { eq } from 'drizzle-orm'
import { app } from '../app.js'
import { db } from '../db/index.js'
import { intervals, kmHistory, motorcycles, userMotorcycles, tickets } from '../db/schema/index.js'

let motoId: number
let userMotoId: number

beforeEach(() => {
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
})
