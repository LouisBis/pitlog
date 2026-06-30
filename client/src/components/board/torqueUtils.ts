import type { CatalogEntry, TorqueSpec } from '@/types'

/** Returns torque specs from entry whose related_intervals include the given slug. */
export function getRelevantTorqueSpecs(entry: CatalogEntry, intervalSlug: string): TorqueSpec[] {
  return entry.torque_specs.filter((s) => s.related_intervals.includes(intervalSlug))
}
