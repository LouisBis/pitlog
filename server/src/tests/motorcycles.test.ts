import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db/index.js'
import { intervals, motorcycles } from '../db/schema/index.js'

beforeEach(() => {
  db.delete(intervals).run()
  db.delete(motorcycles).run()

  db.insert(motorcycles)
    .values([
      { brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997, isCustom: false },
      { brand: 'Honda', model: 'CB500', year: 1998, isCustom: false },
      { brand: 'Generic', model: 'Standard', year: 0, isCustom: false },
      { brand: 'Honda', model: 'CB500', year: 2020, isCustom: true },
    ])
    .run()

  const [gsf600] = db.select().from(motorcycles).all()
  db.insert(intervals)
    .values([
      {
        motorcycleId: gsf600.id,
        operation: 'Engine oil change',
        intervalKm: 6000,
        intervalDays: 365,
      },
      {
        motorcycleId: gsf600.id,
        operation: 'Spark plugs replacement',
        intervalKm: 12000,
        intervalDays: null,
      },
    ])
    .run()
})

describe('GET /api/v1/motorcycles', () => {
  it('returns only catalogue motorcycles, excluding custom and Generic template', async () => {
    const res = await request(app).get('/api/v1/motorcycles')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body.every((m: { isCustom: boolean }) => !m.isCustom)).toBe(true)
    expect(res.body.some((m: { brand: string }) => m.brand === 'Generic')).toBe(false)
    expect(res.body[0].brand).toBe('Suzuki')
  })
})

describe('GET /api/v1/motorcycles/:id', () => {
  it('returns a motorcycle with its intervals', async () => {
    const [moto] = db.select().from(motorcycles).all()
    const res = await request(app).get(`/api/v1/motorcycles/${moto.id}`)
    expect(res.status).toBe(200)
    expect(res.body.brand).toBe('Suzuki')
    expect(res.body.intervals).toHaveLength(2)
    expect(res.body.intervals[0].operation).toBe('Engine oil change')
  })

  it('returns 400 for a non-numeric id', async () => {
    const res = await request(app).get('/api/v1/motorcycles/abc')
    expect(res.status).toBe(400)
  })

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/v1/motorcycles/999')
    expect(res.status).toBe(404)
  })
})
