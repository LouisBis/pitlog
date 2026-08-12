import type { Ticket, CatalogInterval } from '@/types'

type LabelSource =
  | Pick<Ticket, 'intervalSlug' | 'operation'>
  | Pick<CatalogInterval, 'slug' | 'operation'>

/** Returns a translated operation label. Works for catalog Tickets (intervalSlug) and raw CatalogIntervals (slug). Falls back to item.operation if no translation key exists. */
export function getOperationLabel(
  item: LabelSource,
  t: (key: string, fallback: string) => string
): string {
  const slug = 'intervalSlug' in item ? item.intervalSlug : item.slug
  if (slug) return t(`catalog.intervals.${slug}`, item.operation)
  return item.operation
}
