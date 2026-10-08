import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { and, eq } from 'drizzle-orm'
import { app } from '../app.js'
import { db } from '../db/index.js'
import { customIntervals, kmHistory, motorcycles, tickets, userMotorcycles } from '../db/schema/index.js'

let catalogueMotoId: number

beforeEach(() => {
  db.delete(tickets).run()
  db.delete(kmHistory).run()
  db.delete(customIntervals).run()
  db.delete(userMotorcycles).run()
  db.delete(motorcycles).run()

  const [moto] = db
    .insert(motorcycles)
    .values({ brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997, isCustom: false, catalogSlug: 'suzuki-gsf600-bandit-1995-1999' })
    .returning()
    .all()
  catalogueMotoId = moto.id
})

describe('GET /api/v1/user-motorcycles', () => {
  it('returns empty array when no user motorcycles', async () => {
    const res = await request(app).get('/api/v1/user-motorcycles')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('returns user motorcycles with catalogue info including catalogSlug', async () => {
    db.insert(userMotorcycles)
      .values({ motorcycleId: catalogueMotoId, currentKm: 8500, acquiredAt: new Date('2022-01-01') })
      .run()

    const res = await request(app).get('/api/v1/user-motorcycles')
    expect(res.status).toBe(200)
    expect(res.body[0].brand).toBe('Suzuki')
    expect(res.body[0].currentKm).toBe(8500)
    expect(res.body[0].catalogSlug).toBe('suzuki-gsf600-bandit-1995-1999')
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

    expect(seeded).toHaveLength(11)
    const oilChange = seeded.find((t) => t.intervalSlug === 'oil-change')!
    expect(oilChange.status).toBe('todo')
    expect(oilChange.targetKm).toBe(5000 + 6000)
    expect(oilChange.catalogSlug).toBe('suzuki-gsf600-bandit-1995-1999')
  })

  it('creates a custom motorcycle and seeds generic intervals', async () => {
    const res = await request(app)
      .post('/api/v1/user-motorcycles')
      .send({ brand: 'Honda', model: 'CB500', year: 2020, currentKm: 3000 })

    expect(res.status).toBe(201)
    expect(res.body.isCustom).toBe(true)

    const seeded = db.select().from(tickets).all()
    expect(seeded).toHaveLength(6)
    const oilChange = seeded.find((t) => t.intervalSlug === 'oil-change')!
    expect(oilChange.targetKm).toBe(3000 + 5000)
    expect(oilChange.catalogSlug).toBe('generic-standard')
  })

  it('reuses an existing catalogue entry when brand+model+year already exists', async () => {
    await request(app)
      .post('/api/v1/user-motorcycles')
      .send({ brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997, currentKm: 5000 })
    await request(app)
      .post('/api/v1/user-motorcycles')
      .send({ brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997, currentKm: 8000 })

    const suzukis = db
      .select()
      .from(motorcycles)
      .all()
      .filter((m) => m.brand === 'Suzuki')
    expect(suzukis).toHaveLength(1)
  })

  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/v1/user-motorcycles').send({ brand: 'Suzuki', currentKm: 5000 })
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
    expect(res.body.created).toBe(11)

    const seeded = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMoto.id)).all()
    expect(seeded).toHaveLength(11)
  })

  it('is idempotent — skips intervals already covered by an active ticket', async () => {
    const [userMoto] = db
      .insert(userMotorcycles)
      .values({ motorcycleId: catalogueMotoId, currentKm: 8000, acquiredAt: new Date() })
      .returning()
      .all()

    db.insert(tickets)
      .values({
        userMotorcycleId: userMoto.id,
        catalogSlug: 'suzuki-gsf600-bandit-1995-1999',
        intervalSlug: 'oil-change',
        operation: 'Engine oil change',
        status: 'todo',
      })
      .run()

    const res = await request(app).post(`/api/v1/user-motorcycles/${userMoto.id}/import-intervals`)

    expect(res.status).toBe(200)
    expect(res.body.created).toBe(10)

    const all = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMoto.id)).all()
    expect(all).toHaveLength(11)
  })

  it('returns 422 when motorcycle has no catalogSlug', async () => {
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

    const res = await request(app).patch(`/api/v1/user-motorcycles/${userMoto.id}/km`).send({ km: 9200 })

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

    const res = await request(app).patch(`/api/v1/user-motorcycles/${userMoto.id}/km`).send({ km: 5000 })
    expect(res.status).toBe(422)
  })

  it('returns 404 for unknown user motorcycle', async () => {
    const res = await request(app).patch('/api/v1/user-motorcycles/999/km').send({ km: 9000 })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/v1/user-motorcycles/:id', () => {
  it('deletes the user motorcycle and its associated tickets and km history', async () => {
    const [userMoto] = db
      .insert(userMotorcycles)
      .values({ motorcycleId: catalogueMotoId, currentKm: 8500, acquiredAt: new Date('2022-01-01') })
      .returning()
      .all()

    db.insert(tickets).values({ userMotorcycleId: userMoto.id, operation: 'Oil change', status: 'todo' }).run()
    db.insert(kmHistory).values({ userMotorcycleId: userMoto.id, km: 8500, recordedAt: new Date() }).run()

    const res = await request(app).delete(`/api/v1/user-motorcycles/${userMoto.id}`)
    expect(res.status).toBe(204)

    expect(db.select().from(userMotorcycles).where(eq(userMotorcycles.id, userMoto.id)).get()).toBeUndefined()
    expect(db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMoto.id)).all()).toHaveLength(0)
    expect(db.select().from(kmHistory).where(eq(kmHistory.userMotorcycleId, userMoto.id)).all()).toHaveLength(0)
  })

  it('returns 404 for unknown user motorcycle', async () => {
    const res = await request(app).delete('/api/v1/user-motorcycles/999')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/user-motorcycles/:id/history/import', () => {
  let userMotoId: number

  beforeEach(() => {
    const [userMoto] = db
      .insert(userMotorcycles)
      .values({ motorcycleId: catalogueMotoId, currentKm: 12000, acquiredAt: new Date('2022-01-01') })
      .returning()
      .all()
    userMotoId = userMoto.id
  })

  it('creates a done ticket per entry', async () => {
    const res = await request(app)
      .post(`/api/v1/user-motorcycles/${userMotoId}/history/import`)
      .send({
        entries: [
          { operation: 'Vidange moteur', doneAt: '2024-01-15', doneKm: 8000 },
          { operation: 'Changement pneus', doneAt: '2024-06-01', doneKm: 10000 },
        ],
      })

    expect(res.status).toBe(201)
    expect(res.body.created).toBe(2)

    const created = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMotoId)).all()
    expect(created).toHaveLength(2)
    expect(created.every((t) => t.status === 'done')).toBe(true)
  })

  it('regenerates exactly one todo ticket from the latest occurrence of a repeated catalog interval', async () => {
    const res = await request(app)
      .post(`/api/v1/user-motorcycles/${userMotoId}/history/import`)
      .send({
        entries: [
          {
            operation: 'Engine oil change',
            doneAt: '2023-01-01',
            doneKm: 4000,
            catalogSlug: 'suzuki-gsf600-bandit-1995-1999',
            intervalSlug: 'oil-change',
          },
          {
            operation: 'Engine oil change',
            doneAt: '2024-06-01',
            doneKm: 10000,
            catalogSlug: 'suzuki-gsf600-bandit-1995-1999',
            intervalSlug: 'oil-change',
          },
        ],
      })

    expect(res.status).toBe(201)
    expect(res.body.created).toBe(2)
    expect(res.body.regenerated).toBe(1)

    const todos = db
      .select()
      .from(tickets)
      .where(and(eq(tickets.userMotorcycleId, userMotoId), eq(tickets.status, 'todo')))
      .all()
    expect(todos).toHaveLength(1)
    // next due km is computed from the LATEST occurrence (10000 + interval), not the earliest
    expect(todos[0].targetKm).toBeGreaterThan(10000)
  })

  it('does not regenerate anything for one-off entries with no interval link', async () => {
    const res = await request(app)
      .post(`/api/v1/user-motorcycles/${userMotoId}/history/import`)
      .send({ entries: [{ operation: 'Remplacement rétroviseur', doneAt: '2024-01-01', doneKm: 9000 }] })

    expect(res.status).toBe(201)
    expect(res.body.regenerated).toBe(0)
  })

  it('returns 404 for an unknown user motorcycle', async () => {
    const res = await request(app)
      .post('/api/v1/user-motorcycles/999999/history/import')
      .send({ entries: [{ operation: 'Test', doneAt: '2024-01-01', doneKm: 1000 }] })
    expect(res.status).toBe(404)
  })

  it('returns 400 for an empty entries array', async () => {
    const res = await request(app).post(`/api/v1/user-motorcycles/${userMotoId}/history/import`).send({ entries: [] })
    expect(res.status).toBe(400)
  })

  it('returns 400 when an entry has both a catalog interval and a custom interval', async () => {
    const res = await request(app)
      .post(`/api/v1/user-motorcycles/${userMotoId}/history/import`)
      .send({
        entries: [
          {
            operation: 'Test',
            doneAt: '2024-01-01',
            doneKm: 1000,
            catalogSlug: 'suzuki-gsf600-bandit-1995-1999',
            intervalSlug: 'oil-change',
            customIntervalId: 1,
          },
        ],
      })
    expect(res.status).toBe(400)
  })

  it('rejects a catalogSlug that does not belong to this motorcycle', async () => {
    const res = await request(app)
      .post(`/api/v1/user-motorcycles/${userMotoId}/history/import`)
      .send({
        entries: [
          {
            operation: 'Test',
            doneAt: '2024-01-01',
            doneKm: 1000,
            catalogSlug: 'honda-cb500-1994-2001',
            intervalSlug: 'oil-filter',
          },
        ],
      })
    expect(res.status).toBe(400)

    const created = db.select().from(tickets).where(eq(tickets.userMotorcycleId, userMotoId)).all()
    expect(created).toHaveLength(0)
  })

  it('rejects a customIntervalId that belongs to a different motorcycle', async () => {
    const [otherMoto] = db
      .insert(motorcycles)
      .values({ brand: 'Honda', model: 'CB500', year: 1998, isCustom: true, catalogSlug: null })
      .returning()
      .all()
    const [otherInterval] = db
      .insert(customIntervals)
      .values({ motorcycleId: otherMoto.id, operation: 'Autre entretien', intervalKm: 2000, intervalDays: null })
      .returning()
      .all()

    const res = await request(app)
      .post(`/api/v1/user-motorcycles/${userMotoId}/history/import`)
      .send({
        entries: [{ operation: 'Test', doneAt: '2024-01-01', doneKm: 1000, customIntervalId: otherInterval.id }],
      })
    expect(res.status).toBe(400)
  })

  it('rejects a catalogSlug provided without an intervalSlug', async () => {
    const res = await request(app)
      .post(`/api/v1/user-motorcycles/${userMotoId}/history/import`)
      .send({
        entries: [
          { operation: 'Test', doneAt: '2024-01-01', doneKm: 1000, catalogSlug: 'suzuki-gsf600-bandit-1995-1999' },
        ],
      })
    expect(res.status).toBe(400)
  })

  it('rejects more than 2000 entries', async () => {
    const entries = Array.from({ length: 2001 }, (_, i) => ({
      operation: 'Test',
      doneAt: '2024-01-01',
      doneKm: 1000 + i,
    }))
    const res = await request(app)
      .post(`/api/v1/user-motorcycles/${userMotoId}/history/import`)
      .send({ entries })
    expect(res.status).toBe(400)
  })
})
