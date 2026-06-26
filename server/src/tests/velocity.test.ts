import { describe, it, expect } from 'vitest'
import { computeVelocity } from '../lib/velocity.js'

const day = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000)

describe('computeVelocity', () => {
  it('returns null with 0 entries', () => {
    expect(computeVelocity([])).toBeNull()
  })

  it('returns null with a single entry', () => {
    expect(computeVelocity([{ km: 10000, recordedAt: day(0) }])).toBeNull()
  })

  it('returns null when all entries share the same date', () => {
    const now = day(0)
    expect(
      computeVelocity([
        { km: 10000, recordedAt: now },
        { km: 10500, recordedAt: now },
      ]),
    ).toBeNull()
  })

  it('computes km/day from two entries', () => {
    const result = computeVelocity([
      { km: 10000, recordedAt: day(-10) },
      { km: 10100, recordedAt: day(0) },
    ])
    expect(result).not.toBeNull()
    expect(result!.kmPerDay).toBe(10)
    expect(result!.dataPoints).toBe(2)
    expect(result!.periodDays).toBe(10)
  })

  it('uses the last windowSize entries when more are provided', () => {
    const entries = [
      { km: 1000, recordedAt: day(-100) }, // outside window of 3
      { km: 5000, recordedAt: day(-20) },
      { km: 5200, recordedAt: day(-10) },
      { km: 5500, recordedAt: day(0) },
    ]
    const result = computeVelocity(entries, 3)
    expect(result).not.toBeNull()
    expect(result!.dataPoints).toBe(3)
    // 500 km over 20 days = 25 km/day
    expect(result!.kmPerDay).toBe(25)
  })

  it('sorts entries by date regardless of input order', () => {
    const result = computeVelocity([
      { km: 10100, recordedAt: day(0) },
      { km: 10000, recordedAt: day(-10) },
    ])
    expect(result).not.toBeNull()
    expect(result!.kmPerDay).toBe(10)
  })
})
