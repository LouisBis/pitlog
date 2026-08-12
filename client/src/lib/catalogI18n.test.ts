import { describe, it, expect } from 'vitest'
import { getOperationLabel } from './catalogI18n'
import type { Ticket, CatalogInterval } from '@/types'

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 1,
    userMotorcycleId: 1,
    catalogSlug: null,
    intervalSlug: null,
    customIntervalId: null,
    operation: 'Engine oil change',
    status: 'todo',
    targetKm: null,
    targetDate: null,
    doneKm: null,
    doneAt: null,
    customKm: null,
    customDays: null,
    ...overrides,
  }
}

const t = (key: string, fallback: string) => {
  const translations: Record<string, string> = {
    'catalog.intervals.oil-change': 'Vidange huile moteur',
  }
  return translations[key] ?? fallback
}

describe('getOperationLabel', () => {
  it('returns translated label for a catalog ticket with a known slug', () => {
    const ticket = makeTicket({ intervalSlug: 'oil-change', catalogSlug: 'suzuki-gsf600-bandit-1995-1999' })
    expect(getOperationLabel(ticket, t)).toBe('Vidange huile moteur')
  })

  it('falls back to ticket.operation when slug has no translation', () => {
    const ticket = makeTicket({ intervalSlug: 'unknown-slug', catalogSlug: 'suzuki-gsf600-bandit-1995-1999' })
    expect(getOperationLabel(ticket, t)).toBe('Engine oil change')
  })

  it('returns ticket.operation for a user-created ticket (no intervalSlug)', () => {
    const ticket = makeTicket({ operation: 'Vidange perso' })
    expect(getOperationLabel(ticket, t)).toBe('Vidange perso')
  })

  it('returns translated label for a CatalogInterval (slug field)', () => {
    const interval: CatalogInterval = { slug: 'oil-change', operation: 'Engine oil change', km: 6000, days: 365 }
    expect(getOperationLabel(interval, t)).toBe('Vidange huile moteur')
  })

  it('returns operation for a CatalogInterval with unknown slug', () => {
    const interval: CatalogInterval = { slug: 'unknown-op', operation: 'Some operation', km: null, days: 30 }
    expect(getOperationLabel(interval, t)).toBe('Some operation')
  })
})
