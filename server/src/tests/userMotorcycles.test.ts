import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db/index.js'
import { intervals, kmHistory, motorcycles, userMotorcycles } from '../db/schema/index.js'

beforeEach(() => {
  db.delete(kmHistory).run()
  db.delete(intervals).run()
  db.delete(userMotorcycles).run()
  db.delete(motorcycles).run()

  db.insert(motorcycles).values({
    brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997, isCustom: false,
  }).run()
})

describe('GET /api/v1/user-motorcycles', () => {
  it('returns empty array when no user motorcycles', async () => {
    const res = await request(app).get('/api/v1/user-motorcycles')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('returns user motorcycles with catalogue info', async () => {
    const [moto] = db.select().from(motorcycles).all()
    db.insert(userMotorcycles).values({
      motorcycleId: moto.id, currentKm: 8500, acquiredAt: new Date('2022-01-01'),
    }).run()

    const res = await request(app).get('/api/v1/user-motorcycles')
    expect(res.status).toBe(200)
    expect(res.body[0].brand).toBe('Suzuki')
    expect(res.body[0].currentKm).toBe(8500)
  })
})

describe('POST /api/v1/user-motorcycles', () => {
  it('creates a user motorcycle and initial km history entry', async () => {
    const [moto] = db.select().from(motorcycles).all()
    const res = await request(app)
      .post('/api/v1/user-motorcycles')
      .send({ motorcycleId: moto.id, currentKm: 5000, acquiredAt: '2022-06-01' })

    expect(res.status).toBe(201)
    expect(res.body.currentKm).toBe(5000)
    expect(res.body.brand).toBe('Suzuki')

    const history = db.select().from(kmHistory).all()
    expect(history).toHaveLength(1)
    expect(history[0].km).toBe(5000)
  })

  it('returns 404 for unknown motorcycleId', async () => {
    const res = await request(app)
      .post('/api/v1/user-motorcycles')
      .send({ motorcycleId: 999, currentKm: 5000, acquiredAt: '2022-06-01' })
    expect(res.status).toBe(404)
  })

  it('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/user-motorcycles')
      .send({ currentKm: 5000 })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/v1/user-motorcycles/:id/km', () => {
  it('updates km and adds km history entry', async () => {
    const [moto] = db.select().from(motorcycles).all()
    const [userMoto] = db.insert(userMotorcycles)
      .values({ motorcycleId: moto.id, currentKm: 8500, acquiredAt: new Date('2022-01-01') })
      .returning().all()

    const res = await request(app)
      .patch(`/api/v1/user-motorcycles/${userMoto.id}/km`)
      .send({ km: 9200 })

    expect(res.status).toBe(200)
    expect(res.body.currentKm).toBe(9200)

    const updated = db.select().from(userMotorcycles).where().get()
    expect(updated?.currentKm).toBe(9200)
  })

  it('returns 422 when new km is less than current km', async () => {
    const [moto] = db.select().from(motorcycles).all()
    const [userMoto] = db.insert(userMotorcycles)
      .values({ motorcycleId: moto.id, currentKm: 8500, acquiredAt: new Date('2022-01-01') })
      .returning().all()

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
