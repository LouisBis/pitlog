import { Router } from 'express'
import { loadAllCatalogEntries, loadCatalogEntry, type CatalogSummary } from '../lib/catalog.js'
import logger from '../lib/logger.js'

const router = Router()

/** Returns the catalog summary list (slug, brand, model, year only). */
router.get('/', (_req, res) => {
  const summaries: CatalogSummary[] = loadAllCatalogEntries()
    .filter((e) => e.brand !== 'Generic')
    .map(({ slug, brand, model, year }) => ({ slug, brand, model, year }))
  logger.info({ count: summaries.length }, 'Catalog list served')
  res.json(summaries)
})

/** Returns a full catalog entry including intervals and torque specs. */
router.get('/:slug', (req, res) => {
  const entry = loadCatalogEntry(req.params.slug)
  if (!entry) {
    res.status(404).json({ error: 'Catalog entry not found' })
    return
  }
  res.json(entry)
})

export default router
