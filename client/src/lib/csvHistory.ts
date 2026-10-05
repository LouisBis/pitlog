import Papa from 'papaparse'
import { z } from 'zod'

/** Parses a CSV File into its header row and data rows (keyed by header). */
export function parseCsvFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve({ headers: result.meta.fields ?? [], rows: result.data }),
      error: (err: Error) => reject(err),
    })
  })
}

const DATE_HEADERS = ['date']
const OPERATION_HEADERS = ['operation', 'opération', 'op']
const KM_HEADERS = ['km', 'kilometrage', 'kilométrage', 'kilometres', 'kilomètres']

/** Best-guess mapping of CSV headers to date/operation/km, by case-insensitive name match. */
export function guessColumnMapping(headers: string[]): { date: string | null; operation: string | null; km: string | null } {
  const find = (candidates: string[]) => headers.find((h) => candidates.includes(h.trim().toLowerCase())) ?? null
  return { date: find(DATE_HEADERS), operation: find(OPERATION_HEADERS), km: find(KM_HEADERS) }
}

/** Parses an ISO (YYYY-MM-DD) or French (DD/MM/YYYY) date string. Returns an ISO datetime string, or null if unparseable. */
export function parseFrenchOrIsoDate(raw: string): string | null {
  const trimmed = raw.trim()

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    const [, yyyy, mm, dd] = iso
    const d = new Date(`${trimmed}T00:00:00.000Z`)
    if (Number.isNaN(d.getTime())) return null
    // JS Date overflows an out-of-range day into the next month instead of rejecting it — verify it round-trips.
    if (d.getUTCFullYear() !== Number(yyyy) || d.getUTCMonth() + 1 !== Number(mm) || d.getUTCDate() !== Number(dd)) return null
    return d.toISOString()
  }

  const fr = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (fr) {
    const [, dd, mm, yyyy] = fr
    const d = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T00:00:00.000Z`)
    if (Number.isNaN(d.getTime())) return null
    if (d.getUTCFullYear() !== Number(yyyy) || d.getUTCMonth() + 1 !== Number(mm) || d.getUTCDate() !== Number(dd)) return null
    return d.toISOString()
  }

  return null
}

/** Parses a km value, tolerating spaces used as thousand separators. Returns null if non-numeric. */
export function parseKm(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '')
  return /^\d+$/.test(cleaned) ? Number(cleaned) : null
}

export interface MappedRow {
  operation: string
  doneAt: string | null
  doneKm: number | null
  error: 'invalid_date' | 'invalid_km' | 'missing_operation' | null
}

/** Applies a column mapping to raw CSV rows, parsing and validating each one independently. */
export function mapRows(rows: Record<string, string>[], mapping: { date: string; operation: string; km: string }): MappedRow[] {
  return rows.map((row) => {
    const operation = (row[mapping.operation] ?? '').trim()
    const doneAt = parseFrenchOrIsoDate(row[mapping.date] ?? '')
    const doneKm = parseKm(row[mapping.km] ?? '')

    const error = !operation ? 'missing_operation' : doneAt === null ? 'invalid_date' : doneKm === null ? 'invalid_km' : null

    return { operation, doneAt, doneKm, error }
  })
}

/** Trims, lowercases, and collapses internal whitespace — for tolerant text comparison. */
export function normalizeForMatch(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export interface IntervalCandidate {
  label: string
  catalogSlug?: string
  intervalSlug?: string
  customIntervalId?: number
}

/** Finds a candidate interval whose label matches the given operation text exactly (after normalization). */
export function autoMatchInterval(operationText: string, candidates: IntervalCandidate[]): IntervalCandidate | null {
  const normalized = normalizeForMatch(operationText)
  return candidates.find((c) => normalizeForMatch(c.label) === normalized) ?? null
}

/** Validates a parsed JSON import file — must be an array of Pitlog's own history-export entry shape. */
export const jsonImportSchema = z.array(
  z
    .object({
      operation: z.string().min(1),
      doneAt: z.string().min(1),
      doneKm: z.number().int().min(0),
      catalogSlug: z.string().nullish(),
      intervalSlug: z.string().nullish(),
      customIntervalId: z.number().int().positive().nullish(),
      photoBase64: z.string().nullish(),
    })
    .transform((e) => ({
      operation: e.operation,
      doneAt: e.doneAt,
      doneKm: e.doneKm,
      catalogSlug: e.catalogSlug ?? undefined,
      intervalSlug: e.intervalSlug ?? undefined,
      customIntervalId: e.customIntervalId ?? undefined,
      photoBase64: e.photoBase64 ?? undefined,
    })),
)
