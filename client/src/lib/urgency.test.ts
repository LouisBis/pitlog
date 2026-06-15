import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getUrgency, getKmRemaining, getEstimatedDays } from './urgency'
import type { Ticket } from '@/types'

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 1,
    userMotorcycleId: 1,
    intervalId: null,
    operation: 'Vidange',
    status: 'todo',
    targetKm: null,
    targetDate: null,
    doneKm: null,
    doneAt: null,
    ...overrides,
  }
}

// Fixed "now" for all date-based tests
const NOW = new Date('2026-01-01T00:00:00Z')

describe('getUrgency', () => {
  beforeEach(() => vi.setSystemTime(NOW))
  afterEach(() => vi.useRealTimers())

  it('returns ok for a done ticket regardless of km or date', () => {
    const ticket = makeTicket({ status: 'done', targetKm: 100, targetDate: '2026-01-02' })
    expect(getUrgency(ticket, 5000)).toBe('ok')
  })

  it('returns ok when no targetKm and no targetDate', () => {
    expect(getUrgency(makeTicket(), 5000)).toBe('ok')
  })

  describe('km-based urgency', () => {
    it('returns urgent when remaining ≤ 200 km', () => {
      expect(getUrgency(makeTicket({ targetKm: 5100 }), 5000)).toBe('urgent')
      expect(getUrgency(makeTicket({ targetKm: 5200 }), 5000)).toBe('urgent')
    })

    it('returns warning when remaining between 201 and 500 km', () => {
      expect(getUrgency(makeTicket({ targetKm: 5201 }), 5000)).toBe('warning')
      expect(getUrgency(makeTicket({ targetKm: 5500 }), 5000)).toBe('warning')
    })

    it('returns ok when remaining > 500 km', () => {
      expect(getUrgency(makeTicket({ targetKm: 5501 }), 5000)).toBe('ok')
    })

    it('returns urgent when already overdue (remaining < 0)', () => {
      expect(getUrgency(makeTicket({ targetKm: 4900 }), 5000)).toBe('urgent')
    })
  })

  describe('estimated days via kmPerDay', () => {
    it('returns urgent when estimated days ≤ 14', () => {
      // 300 km remaining at 30 km/day = 10 days
      expect(getUrgency(makeTicket({ targetKm: 5300 }), 5000, 30)).toBe('urgent')
    })

    it('returns warning when estimated days between 15 and 30', () => {
      // 300 km remaining at 15 km/day = 20 days
      expect(getUrgency(makeTicket({ targetKm: 5300 }), 5000, 15)).toBe('warning')
    })

    it('ignores kmPerDay when 0 or negative', () => {
      expect(getUrgency(makeTicket({ targetKm: 5300 }), 5000, 0)).toBe('warning')
      expect(getUrgency(makeTicket({ targetKm: 5300 }), 5000, -5)).toBe('warning')
    })
  })

  describe('date-based urgency', () => {
    it('returns urgent when targetDate is within 14 days', () => {
      expect(getUrgency(makeTicket({ targetDate: '2026-01-10' }), 5000)).toBe('urgent')
    })

    it('returns warning when targetDate is between 15 and 30 days', () => {
      expect(getUrgency(makeTicket({ targetDate: '2026-01-20' }), 5000)).toBe('warning')
    })

    it('returns ok when targetDate is more than 30 days away', () => {
      expect(getUrgency(makeTicket({ targetDate: '2026-02-15' }), 5000)).toBe('ok')
    })
  })

  describe('maxUrgency — worst signal wins', () => {
    it('returns urgent when km is warning but date is urgent', () => {
      // 400 km remaining → warning; date in 5 days → urgent
      const ticket = makeTicket({ targetKm: 5400, targetDate: '2026-01-06' })
      expect(getUrgency(ticket, 5000)).toBe('urgent')
    })

    it('returns urgent when date is ok but km is urgent', () => {
      const ticket = makeTicket({ targetKm: 5100, targetDate: '2026-02-15' })
      expect(getUrgency(ticket, 5000)).toBe('urgent')
    })
  })
})

describe('getKmRemaining', () => {
  it('returns null for a done ticket', () => {
    expect(getKmRemaining(makeTicket({ status: 'done', targetKm: 5500 }), 5000)).toBeNull()
  })

  it('returns null when targetKm is null', () => {
    expect(getKmRemaining(makeTicket(), 5000)).toBeNull()
  })

  it('returns positive remaining km', () => {
    expect(getKmRemaining(makeTicket({ targetKm: 5500 }), 5000)).toBe(500)
  })

  it('returns 0 when exactly at target', () => {
    expect(getKmRemaining(makeTicket({ targetKm: 5000 }), 5000)).toBe(0)
  })

  it('returns negative value when overdue', () => {
    expect(getKmRemaining(makeTicket({ targetKm: 4800 }), 5000)).toBe(-200)
  })
})

describe('getEstimatedDays', () => {
  it('returns null for a done ticket', () => {
    expect(getEstimatedDays(makeTicket({ status: 'done', targetKm: 5500 }), 5000, 20)).toBeNull()
  })

  it('returns null when targetKm is null', () => {
    expect(getEstimatedDays(makeTicket(), 5000, 20)).toBeNull()
  })

  it('returns null when kmPerDay is 0 or negative', () => {
    expect(getEstimatedDays(makeTicket({ targetKm: 5500 }), 5000, 0)).toBeNull()
    expect(getEstimatedDays(makeTicket({ targetKm: 5500 }), 5000, -10)).toBeNull()
  })

  it('returns null when already overdue (days ≤ 0)', () => {
    expect(getEstimatedDays(makeTicket({ targetKm: 4900 }), 5000, 20)).toBeNull()
  })

  it('returns rounded estimated days', () => {
    // 500 km at 20 km/day = 25 days
    expect(getEstimatedDays(makeTicket({ targetKm: 5500 }), 5000, 20)).toBe(25)
  })

  it('rounds to nearest day', () => {
    // 100 km at 30 km/day = 3.33 → 3
    expect(getEstimatedDays(makeTicket({ targetKm: 5100 }), 5000, 30)).toBe(3)
  })
})
