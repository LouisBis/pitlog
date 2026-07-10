import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { db } from '../db/index.js'
import { motorcycles } from '../db/schema/index.js'

beforeEach(() => {
  db.delete(motorcycles).run()

  db.insert(motorcycles)
    .values([
      { brand: 'Suzuki', model: 'GSF 600 Bandit', year: 1997, isCustom: false, catalogSlug: 'suzuki-gsf600-bandit-1997' },
      { brand: 'Honda', model: 'CB500', year: 1998, isCustom: false, catalogSlug: 'honda-cb500-1998' },
      { brand: 'Generic', model: 'Standard', year: 0, isCustom: false, catalogSlug: null },
      { brand: 'Honda', model: 'CB500', year: 2020, isCustom: true, catalogSlug: null },
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
  it('returns a motorcycle with its catalogSlug', async () => {
    const [moto] = db.select().from(motorcycles).all()
    const res = await request(app).get(`/api/v1/motorcycles/${moto.id}`)
    expect(res.status).toBe(200)
    expect(res.body.brand).toBe('Suzuki')
    expect(res.body.catalogSlug).toBe('suzuki-gsf600-bandit-1997')
    expect(res.body.intervals).toBeUndefined()
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
