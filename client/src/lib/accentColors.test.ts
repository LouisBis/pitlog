import { describe, it, expect } from 'vitest'
import { getAccentStyle } from './accentColors'
import type { UserMotorcycle } from '@/types'

function makeMoto(overrides: Partial<UserMotorcycle>): UserMotorcycle {
  return {
    id: 1,
    currentKm: 1000,
    acquiredAt: '2024-01-01T00:00:00.000Z',
    motorcycleId: 1,
    brand: 'Honda',
    model: 'CB500',
    year: 2020,
    isCustom: false,
    catalogSlug: 'honda-cb500-2020',
    accentColor: null,
    ...overrides,
  }
}

describe('getAccentStyle', () => {
  it('returns the fixed Honda accent for a catalog motorcycle', () => {
    const style = getAccentStyle(makeMoto({ brand: 'Honda', isCustom: false }))
    expect(style).toEqual({ '--brand-accent': 'var(--red-500)', '--brand-accent-hover': 'var(--red-300)' })
  })

  it('returns the fixed Yamaha accent for a catalog motorcycle', () => {
    const style = getAccentStyle(makeMoto({ brand: 'Yamaha', isCustom: false }))
    expect(style).toEqual({ '--brand-accent': 'var(--moto-blue-500)', '--brand-accent-hover': 'var(--moto-blue-300)' })
  })

  it('matches catalog brand case-insensitively', () => {
    const style = getAccentStyle(makeMoto({ brand: 'yamaha', isCustom: false }))
    expect(style).toEqual({ '--brand-accent': 'var(--moto-blue-500)', '--brand-accent-hover': 'var(--moto-blue-300)' })
  })

  it('returns undefined (default brass) for a catalog brand with no mapping', () => {
    const style = getAccentStyle(makeMoto({ brand: 'Ducati', isCustom: false }))
    expect(style).toBeUndefined()
  })

  it('ignores accentColor on a catalog motorcycle — the brand mapping always wins', () => {
    const style = getAccentStyle(makeMoto({ brand: 'Honda', isCustom: false, accentColor: 'blue' }))
    expect(style).toEqual({ '--brand-accent': 'var(--red-500)', '--brand-accent-hover': 'var(--red-300)' })
  })

  it('returns the chosen swatch for a custom motorcycle', () => {
    const style = getAccentStyle(makeMoto({ isCustom: true, catalogSlug: null, accentColor: 'purple' }))
    expect(style).toEqual({
      '--brand-accent': 'var(--moto-purple-500)',
      '--brand-accent-hover': 'var(--moto-purple-300)',
    })
  })

  it('returns undefined (default brass) for a custom motorcycle with no chosen swatch', () => {
    const style = getAccentStyle(makeMoto({ isCustom: true, catalogSlug: null, accentColor: null }))
    expect(style).toBeUndefined()
  })
})
