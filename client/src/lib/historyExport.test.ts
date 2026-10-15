import { describe, it, expect } from 'vitest'
import { buildCsvExport, buildJsonExport } from './historyExport'
import type { Ticket } from '@/types'

const ticket: Ticket = {
  id: 1,
  userMotorcycleId: 1,
  catalogSlug: null,
  intervalSlug: null,
  customIntervalId: null,
  operation: 'Vidange moteur',
  status: 'done',
  targetKm: null,
  targetDate: null,
  doneKm: 8000,
  doneAt: '2024-01-15T00:00:00.000Z',
  customKm: null,
  customDays: null,
  photoBase64: null,
}

const t = (_key: string, fallback: string) => fallback

describe('buildCsvExport', () => {
  it('produces a CSV with date/operation/km columns', () => {
    const csv = buildCsvExport([ticket], t)
    expect(csv).toContain('date,operation,km')
    expect(csv).toContain('2024-01-15,Vidange moteur,8000')
  })
})

describe('buildJsonExport', () => {
  it('produces a JSON array matching the import entry shape', () => {
    const json = JSON.parse(buildJsonExport([ticket]))
    expect(json).toEqual([
      {
        operation: 'Vidange moteur',
        doneAt: '2024-01-15T00:00:00.000Z',
        doneKm: 8000,
        catalogSlug: null,
        intervalSlug: null,
        customIntervalId: null,
        photoBase64: null,
      },
    ])
  })
})
