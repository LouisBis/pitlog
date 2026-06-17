import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { eq } from 'drizzle-orm'
import { app } from '../app.js'
import { db } from '../db/index.js'
import { intervals, kmHistory, motorcycles, tickets, userMotorcycles } from '../db/schema/index.js'

let catalogueMotoId: number

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
  catalogueMotoId = moto.id

  db.insert(intervals).values([
    { motorcycleId: catalogueMotoId, operation: 'Engine oil change', intervalKm: 6000, intervalDays: 365 },
    { motorcycleId: catalogueMotoId, operation: 'Spark plugs', intervalKm: 12000, intervalDays: null },
  ]).run()

  // Generic template — required for custom motorcycle seeding
  const [generic] = db
    .insert(motorcycles)
    .values({ brand: 'Générique', model: 'Standard', year: 0, isCustom: false })
    .returning()
    .all()

  db.insert(intervals).values([
    { motorcycleId: generic.id, operation: 'Engine oil change', intervalKm: 5000, intervalDays: 365 },
    { motorcycleId: generic.id, operation: 'Drive chain lubrication', intervalKm: 500, intervalDays: null },
  ]).run()
})

describe('GET /api/v1/user-motorcycles', () => {
  it('returns empty array when no user motorcycles', async () => {
    const res = await request(app).get('/api/v1/user-motorcycles')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('returns user motorcycles with catalogue info', async () => {
    db.insert(userMotorcycles)
      .values({ motorcycleId: catalogueMotoId, currentKm: 8500, acquiredAt: new Date('2022-01-01') })
      .run()

    const res = await request(app).get('/api/v1/user-motorcycles')
    expect(res.status).toBe(200)
    expect(res.body[0].brand).toBe('Suzuki')
    expect(res.body[0].currentKm).toBe(8500)
    expect(res.body[0].isCustom).toBe(false)
  })
})

describe('POST /api/v1/user-motorcycles', () => {
  it('creates a user motorcycle matched to the catalogue and records initial km', async () => {
    const res = await request(app)
      .post('/api/v1/user-motorcycles')
      .send({ brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997, currentKm: 5000 })

    expect(res.status).toBe(201)
    expect(res.body.currentKm).toBe(5000)
    expect(res.body.brand).toBe('Suzuki')
    expect(res.body.isCustom).toBe(false)

    const history = db.select().from(kmHistory).all()
    expect(history).toHaveLength(1)
    expect(history[0].km).toBe(5000)
  })

  it('auto-seeds tickets from catalogue intervals on creation', async () => {
    await request(app)
      .post('/api/v1/user-motorcycles')
      .send({ brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997, currentKm: 5000 })

    const [userMoto] = db.select().from(userMotorcycles).all()
    const seeded = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMoto.id)).all()

    expect(seeded).toHaveLength(2)
    const oilChange = seeded.find((t) => t.operation === 'Engine oil change')!
    expect(oilChange.status).toBe('todo')
    expect(oilChange.targetKm).toBe(5000 + 6000)
    expect(oilChange.intervalId).toBeTruthy()
  })

  it('creates a custom motorcycle and seeds generic intervals', async () => {
    const res = await request(app)
      .post('/api/v1/user-motorcycles')
      .send({ brand: 'Honda', model: 'CB500', year: 2020, currentKm: 3000 })

    expect(res.status).toBe(201)
    expect(res.body.isCustom).toBe(true)

    const seeded = db.select().from(tickets).all()
    expect(seeded).toHaveLength(2)
    const oilChange = seeded.find((t) => t.operation === 'Engine oil change')!
    expect(oilChange.status).toBe('todo')
    expect(oilChange.targetKm).toBe(3000 + 5000)
  })

  it('reuses an existing catalogue entry when brand+model+year already exists', async () => {
    await request(app)
      .post('/api/v1/user-motorcycles')
      .send({ brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997, currentKm: 5000 })
    await request(app)
      .post('/api/v1/user-motorcycles')
      .send({ brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997, currentKm: 8000 })

    const suzukis = db.select().from(motorcycles).all().filter((m) => m.brand === 'Suzuki')
    expect(suzukis).toHaveLength(1)
  })

  it('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/user-motorcycles')
      .send({ brand: 'Suzuki', currentKm: 5000 })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/v1/user-motorcycles/:id/import-intervals', () => {
  it('creates tickets for all catalogue intervals when board is empty', async () => {
    const [userMoto] = db
      .insert(userMotorcycles)
      .values({ motorcycleId: catalogueMotoId, currentKm: 8000, acquiredAt: new Date() })
      .returning()
      .all()

    const res = await request(app).post(`/api/v1/user-motorcycles/${userMoto.id}/import-intervals`)

    expect(res.status).toBe(200)
    expect(res.body.created).toBe(2)

    const seeded = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMoto.id)).all()
    expect(seeded).toHaveLength(2)
  })

  it('is idempotent — skips intervals already covered by an active ticket', async () => {
    const [userMoto] = db
      .insert(userMotorcycles)
      .values({ motorcycleId: catalogueMotoId, currentKm: 8000, acquiredAt: new Date() })
      .returning()
      .all()

    const [interval] = db.select().from(intervals).where(eq(intervals.motorcycleId, catalogueMotoId)).all()
    db.insert(tickets).values({
      userMotorcycleId: userMoto.id,
      intervalId: interval.id,
      operation: interval.operation,
      status: 'todo',
    }).run()

    const res = await request(app).post(`/api/v1/user-motorcycles/${userMoto.id}/import-intervals`)

    expect(res.status).toBe(200)
    expect(res.body.created).toBe(1)

    const all = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMoto.id)).all()
    expect(all).toHaveLength(2)
  })

  it('returns 422 when motorcycle has no catalogue intervals', async () => {
    const [customMoto] = db
      .insert(motorcycles)
      .values({ brand: 'Custom', model: 'One-off', year: 2000, isCustom: true })
      .returning()
      .all()
    const [userMoto] = db
      .insert(userMotorcycles)
      .values({ motorcycleId: customMoto.id, currentKm: 1000, acquiredAt: new Date() })
      .returning()
      .all()

    const res = await request(app).post(`/api/v1/user-motorcycles/${userMoto.id}/import-intervals`)
    expect(res.status).toBe(422)
  })

  it('returns 404 for unknown user motorcycle', async () => {
    const res = await request(app).post('/api/v1/user-motorcycles/999/import-intervals')
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/user-motorcycles/:id/km', () => {
  it('updates km and adds a km history entry', async () => {
    const [userMoto] = db
      .insert(userMotorcycles)
      .values({ motorcycleId: catalogueMotoId, currentKm: 8500, acquiredAt: new Date('2022-01-01') })
      .returning()
      .all()

    const res = await request(app)
      .patch(`/api/v1/user-motorcycles/${userMoto.id}/km`)
      .send({ km: 9200 })

    expect(res.status).toBe(200)
    expect(res.body.currentKm).toBe(9200)

    const updated = db.select().from(userMotorcycles).where(eq(userMotorcycles.id, userMoto.id)).get()
    expect(updated?.currentKm).toBe(9200)
  })

  it('returns 422 when new km is less than current km', async () => {
    const [userMoto] = db
      .insert(userMotorcycles)
      .values({ motorcycleId: catalogueMotoId, currentKm: 8500, acquiredAt: new Date('2022-01-01') })
      .returning()
      .all()

    const res = await request(app)
      .patch(`/api/v1/user-motorcycles/${userMoto.id}/km`)
      .send({ km: 5000 })

    expect(res.status).toBe(422)
  })

  it('returns 404 for unknown user motorcycle', async () => {
    const res = await request(app)
      .patch('/api/v1/user-motorcycles/999/km')
      .send({ km: 9000 })
    expect(res.status).toBe(404)
  })
})
