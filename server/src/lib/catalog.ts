import { resolve } from 'path'
import { readdirSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'

export interface CatalogInterval {
  slug: string
  operation: string
  km: number | null
  days: number | null
}

export interface TorqueSpec {
  slug: string
  component: string
  nm: number
  note: string | null
  related_intervals: string[]
}

export interface CatalogEntry {
  slug: string
  brand: string
  model: string
  year: number
  intervals: CatalogInterval[]
  torque_specs: TorqueSpec[]
}

export interface CatalogSummary {
  slug: string
  brand: string
  model: string
  year: number
}

const __dirname = fileURLToPath(new URL('.', import.meta.url))
// In Docker: CATALOG_PATH=/app/catalog (set via env). On host: resolves to {repo_root}/catalog/
export const CATALOG_DIR = process.env.CATALOG_PATH ?? resolve(__dirname, '../../../catalog')

/** Reads all catalog entries from disk. */
export function loadAllCatalogEntries(): CatalogEntry[] {
  const entries: CatalogEntry[] = []
  for (const brand of readdirSync(CATALOG_DIR)) {
    const brandDir = resolve(CATALOG_DIR, brand)
    for (const file of readdirSync(brandDir).filter((f) => f.endsWith('.json'))) {
      entries.push(JSON.parse(readFileSync(resolve(brandDir, file), 'utf-8')) as CatalogEntry)
    }
  }
  return entries
}

/** Reads a single catalog entry by slug. Returns undefined if not found. */
export function loadCatalogEntry(slug: string): CatalogEntry | undefined {
  return loadAllCatalogEntries().find((e) => e.slug === slug)
}
