#!/usr/bin/env node
/**
 * Validates all catalog JSON files against the expected schema.
 * Exits with code 1 if any file fails.
 *
 * Checks:
 *  - Valid JSON
 *  - Required fields present and correctly typed
 *  - slug matches filename
 *  - year_start <= year_end
 *  - At least one of km/days is non-null per interval
 *  - All related_intervals reference existing interval slugs
 *  - No duplicate slugs within a file (intervals, torque_specs)
 *  - No duplicate top-level slugs across the entire catalog
 */

import { readdirSync, readFileSync } from 'fs'
import { resolve, basename, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CATALOG_DIR = resolve(__dirname, '../catalog')

let errors = 0

function error(file, msg) {
  console.error(`  ✗ ${file}: ${msg}`)
  errors++
}

function validateEntry(filePath, raw) {
  const file = filePath.replace(CATALOG_DIR + '/', '')
  let entry

  try {
    entry = JSON.parse(raw)
  } catch {
    error(file, 'invalid JSON')
    return null
  }

  // Required top-level fields
  const required = ['slug', 'brand', 'model', 'categories', 'torque_specs']
  for (const field of required) {
    if (entry[field] === undefined) error(file, `missing field: ${field}`)
  }

  if (typeof entry.slug !== 'string') { error(file, 'slug must be a string'); return entry }

  // slug must equal <parent-dir-name>-<filename-without-extension>
  const brandDir = basename(dirname(filePath))
  const expectedSlug = `${brandDir}-${basename(filePath, extname(filePath))}`
  if (entry.slug !== expectedSlug) {
    error(file, `slug "${entry.slug}" does not match expected "${expectedSlug}"`)
  }

  // year_start / year_end — not required for generic catalog
  const isGeneric = brandDir === 'generic'
  if (!isGeneric) {
    if (typeof entry.year_start !== 'number') error(file, 'year_start must be a number')
    if (entry.year_end !== null && entry.year_end !== undefined && typeof entry.year_end !== 'number') {
      error(file, 'year_end must be a number or null')
    }
    if (typeof entry.year_start === 'number' && typeof entry.year_end === 'number' && entry.year_start > entry.year_end) {
      error(file, `year_start (${entry.year_start}) > year_end (${entry.year_end})`)
    }
  }

  const ALLOWED_CATEGORY_SLUGS = new Set(['engine', 'cooling', 'fuel', 'transmission', 'brakes', 'chassis', 'tires'])

  // Categories
  if (!Array.isArray(entry.categories)) {
    error(file, 'categories must be an array')
  } else {
    const intervalSlugs = new Set()
    const categorySlugs = new Set()
    for (const [ci, cat] of entry.categories.entries()) {
      const catCtx = `categories[${ci}]`
      if (typeof cat.slug !== 'string') { error(file, `${catCtx}: slug must be a string`); continue }
      if (!ALLOWED_CATEGORY_SLUGS.has(cat.slug)) error(file, `${catCtx}: unknown category slug "${cat.slug}"`)
      if (categorySlugs.has(cat.slug)) error(file, `${catCtx}: duplicate category slug "${cat.slug}"`)
      categorySlugs.add(cat.slug)
      if (!Array.isArray(cat.intervals)) { error(file, `${catCtx}: intervals must be an array`); continue }
      for (const [i, interval] of cat.intervals.entries()) {
        const ctx = `${catCtx}.intervals[${i}]`
        if (typeof interval.slug !== 'string') { error(file, `${ctx}: slug must be a string`); continue }
        if (intervalSlugs.has(interval.slug)) error(file, `${ctx}: duplicate slug "${interval.slug}"`)
        intervalSlugs.add(interval.slug)
        if (typeof interval.operation !== 'string') error(file, `${ctx}: operation must be a string`)
        if (interval.km === undefined) error(file, `${ctx}: missing field km`)
        if (interval.days === undefined) error(file, `${ctx}: missing field days`)
        if (interval.km === null && interval.days === null) error(file, `${ctx}: km and days cannot both be null`)
      }
    }

    // Torque specs (validate related_intervals against the flat set)
    if (!Array.isArray(entry.torque_specs)) {
      error(file, 'torque_specs must be an array')
    } else {
      const torqueSlugs = new Set()
      for (const [i, spec] of entry.torque_specs.entries()) {
        const ctx = `torque_specs[${i}]`
        if (typeof spec.slug !== 'string') { error(file, `${ctx}: slug must be a string`); continue }
        if (torqueSlugs.has(spec.slug)) error(file, `${ctx}: duplicate slug "${spec.slug}"`)
        torqueSlugs.add(spec.slug)
        if (typeof spec.component !== 'string') error(file, `${ctx}: component must be a string`)
        if (typeof spec.nm !== 'number' || spec.nm <= 0) error(file, `${ctx}: nm must be a positive number`)
        if (!Array.isArray(spec.related_intervals)) {
          error(file, `${ctx}: related_intervals must be an array`)
        } else {
          for (const ref of spec.related_intervals) {
            if (!intervalSlugs.has(ref)) error(file, `${ctx}: related_interval "${ref}" not found in any category`)
          }
        }
      }
    }
  }

  return entry
}

// Collect all files
const allFiles = []
for (const brand of readdirSync(CATALOG_DIR)) {
  const brandDir = resolve(CATALOG_DIR, brand)
  try {
    for (const file of readdirSync(brandDir).filter(f => f.endsWith('.json'))) {
      allFiles.push(resolve(brandDir, file))
    }
  } catch {
    // not a directory
  }
}

console.log(`Validating ${allFiles.length} catalog file(s)…\n`)

const topLevelSlugs = new Map()
for (const filePath of allFiles) {
  const raw = readFileSync(filePath, 'utf-8')
  const entry = validateEntry(filePath, raw)
  if (entry?.slug) {
    const file = filePath.replace(CATALOG_DIR + '/', '')
    if (topLevelSlugs.has(entry.slug)) {
      error(file, `duplicate top-level slug "${entry.slug}" (also in ${topLevelSlugs.get(entry.slug)})`)
    } else {
      topLevelSlugs.set(entry.slug, file)
    }
  }
}

if (errors === 0) {
  console.log(`✓ All catalog files are valid.`)
  process.exit(0)
} else {
  console.error(`\n${errors} error(s) found.`)
  process.exit(1)
}
