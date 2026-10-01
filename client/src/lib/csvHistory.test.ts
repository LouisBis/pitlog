import { describe, it, expect } from 'vitest'
import {
  guessColumnMapping,
  parseFrenchOrIsoDate,
  parseKm,
  mapRows,
  normalizeForMatch,
  autoMatchInterval,
  jsonImportSchema,
} from './csvHistory'

describe('guessColumnMapping', () => {
  it('matches common header names case-insensitively', () => {
    expect(guessColumnMapping(['Date', 'Opération', 'Kilométrage'])).toEqual({
      date: 'Date',
      operation: 'Opération',
      km: 'Kilométrage',
    })
  })

  it('returns nulls for unrecognized headers', () => {
    expect(guessColumnMapping(['Colonne A', 'Colonne B', 'Colonne C'])).toEqual({
      date: null,
      operation: null,
      km: null,
    })
  })
})

describe('parseFrenchOrIsoDate', () => {
  it('parses ISO dates', () => {
    expect(parseFrenchOrIsoDate('2024-06-15')).toBe('2024-06-15T00:00:00.000Z')
  })

  it('parses French DD/MM/YYYY dates', () => {
    expect(parseFrenchOrIsoDate('15/06/2024')).toBe('2024-06-15T00:00:00.000Z')
  })

  it('returns null for unparseable input', () => {
    expect(parseFrenchOrIsoDate('not a date')).toBeNull()
  })
})

describe('parseKm', () => {
  it('parses plain digits', () => {
    expect(parseKm('12000')).toBe(12000)
  })

  it('strips spaces used as thousand separators', () => {
    expect(parseKm('12 000')).toBe(12000)
  })

  it('returns null for non-numeric input', () => {
    expect(parseKm('beaucoup')).toBeNull()
  })
})

describe('mapRows', () => {
  const mapping = { date: 'Date', operation: 'Op', km: 'Km' }

  it('maps valid rows', () => {
    const result = mapRows([{ Date: '2024-01-15', Op: 'Vidange', Km: '8000' }], mapping)
    expect(result).toEqual([{ operation: 'Vidange', doneAt: '2024-01-15T00:00:00.000Z', doneKm: 8000, error: null }])
  })

  it('flags a row with an unparseable date', () => {
    const result = mapRows([{ Date: 'nope', Op: 'Vidange', Km: '8000' }], mapping)
    expect(result[0].error).toBe('invalid_date')
  })

  it('flags a row with an unparseable km', () => {
    const result = mapRows([{ Date: '2024-01-15', Op: 'Vidange', Km: 'nope' }], mapping)
    expect(result[0].error).toBe('invalid_km')
  })

  it('flags a row with an empty operation', () => {
    const result = mapRows([{ Date: '2024-01-15', Op: '  ', Km: '8000' }], mapping)
    expect(result[0].error).toBe('missing_operation')
  })
})

describe('normalizeForMatch', () => {
  it('trims, lowercases, and collapses whitespace', () => {
    expect(normalizeForMatch('  Vidange   Moteur  ')).toBe('vidange moteur')
  })
})

describe('autoMatchInterval', () => {
  const candidates = [
    { label: 'Vidange moteur', catalogSlug: 'x', intervalSlug: 'oil-change' },
    { label: 'Changement pneus', catalogSlug: 'x', intervalSlug: 'tires' },
  ]

  it('matches on normalized equality', () => {
    expect(autoMatchInterval('  vidange MOTEUR ', candidates)).toEqual(candidates[0])
  })

  it('returns null when nothing matches', () => {
    expect(autoMatchInterval('Réparation guidon', candidates)).toBeNull()
  })
})

describe('jsonImportSchema', () => {
  it('accepts a valid entries array', () => {
    const result = jsonImportSchema.safeParse([{ operation: 'Vidange', doneAt: '2024-01-01T00:00:00.000Z', doneKm: 8000 }])
    expect(result.success).toBe(true)
  })

  it('rejects an entry missing required fields', () => {
    const result = jsonImportSchema.safeParse([{ operation: 'Vidange' }])
    expect(result.success).toBe(false)
  })

  it('rejects a non-array', () => {
    const result = jsonImportSchema.safeParse({ not: 'an array' })
    expect(result.success).toBe(false)
  })
})
