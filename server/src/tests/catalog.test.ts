import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

describe('GET /api/v1/catalog', () => {
  it('returns a list of catalog summaries', async () => {
    const res = await request(app).get('/api/v1/catalog')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(3)
    const gsf = res.body.find((e: { slug: string }) => e.slug === 'suzuki-gsf600-bandit-1997')
    expect(gsf).toBeDefined()
    expect(gsf.brand).toBe('Suzuki')
    expect(gsf.model).toBe('GSF 600 Bandit')
    expect(gsf.year).toBe(1997)
    expect(gsf.intervals).toBeUndefined()
    expect(gsf.torque_specs).toBeUndefined()
  })

  it('does not expose generic-standard in the summary list', async () => {
    const res = await request(app).get('/api/v1/catalog')
    expect(res.body.find((e: { slug: string }) => e.slug === 'generic-standard')).toBeUndefined()
  })
})

describe('GET /api/v1/catalog/:slug', () => {
  it('returns full catalog entry with intervals and torque_specs', async () => {
    const res = await request(app).get('/api/v1/catalog/honda-cb500-1998')
    expect(res.status).toBe(200)
    expect(res.body.slug).toBe('honda-cb500-1998')
    expect(res.body.brand).toBe('Honda')
    expect(Array.isArray(res.body.intervals)).toBe(true)
    expect(res.body.intervals.length).toBeGreaterThan(0)
    expect(res.body.intervals[0]).toMatchObject({ slug: expect.any(String), operation: expect.any(String) })
    expect(Array.isArray(res.body.torque_specs)).toBe(true)
    const sparkPlug = res.body.torque_specs.find((s: { slug: string }) => s.slug === 'spark-plug')
    expect(sparkPlug).toBeDefined()
    expect(sparkPlug.nm).toBe(16)
    expect(sparkPlug.related_intervals).toContain('spark-plugs-replacement')
  })

  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/v1/catalog/unknown-moto-0000')
    expect(res.status).toBe(404)
  })
})
