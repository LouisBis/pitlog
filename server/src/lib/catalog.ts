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
  category: CategorySlug
  component: string
  nm: number
  note: string | null
  related_intervals: string[]
}

export type CategorySlug = 'engine' | 'cooling' | 'fuel' | 'transmission' | 'brakes' | 'chassis' | 'tires'

export interface CatalogCategory {
  slug: CategorySlug
  intervals: CatalogInterval[]
}

export interface CatalogEntry {
  slug: string
  brand: string
  model: string
  year_start: number
  year_end: number | null
  categories: CatalogCategory[]
  torque_specs: TorqueSpec[]
}

export interface CatalogSummary {
  slug: string
  brand: string
  model: string
  year_start: number
  year_end: number | null
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

let catalogCache: Map<string, CatalogEntry> | null = null

function getCatalogCache(): Map<string, CatalogEntry> {
  if (!catalogCache) {
    catalogCache = new Map(loadAllCatalogEntries().map((e) => [e.slug, e]))
  }
  return catalogCache
}

/** Reads a single catalog entry by slug. Returns undefined if not found. */
export function loadCatalogEntry(slug: string): CatalogEntry | undefined {
  return getCatalogCache().get(slug)
}
