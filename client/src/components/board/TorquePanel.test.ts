import { describe, it, expect } from 'vitest'
import { getRelevantTorqueSpecs } from './TorquePanel'
import type { CatalogEntry } from '@/types'

const entry: CatalogEntry = {
  slug: 'suzuki-gsf600-bandit-1997',
  brand: 'Suzuki',
  model: 'GSF 600 Bandit',
  year: 1997,
  intervals: [],
  torque_specs: [
    { slug: 'spark-plug', component: 'Spark plug', nm: 20, note: null, related_intervals: ['spark-plugs-replacement'] },
    { slug: 'oil-drain-bolt', component: 'Oil drain bolt', nm: 35, note: null, related_intervals: ['oil-change', 'oil-filter'] },
    { slug: 'front-axle', component: 'Front wheel axle', nm: 65, note: null, related_intervals: [] },
  ],
}

describe('getRelevantTorqueSpecs', () => {
  it('returns specs whose related_intervals include the given slug', () => {
    const specs = getRelevantTorqueSpecs(entry, 'oil-change')
    expect(specs).toHaveLength(1)
    expect(specs[0].slug).toBe('oil-drain-bolt')
    expect(specs[0].nm).toBe(35)
  })

  it('returns multiple specs when several match', () => {
    const entry2 = {
      ...entry,
      torque_specs: [
        ...entry.torque_specs,
        { slug: 'drain-gasket', component: 'Drain gasket', nm: 5, note: null, related_intervals: ['oil-change'] },
      ],
    }
    const specs = getRelevantTorqueSpecs(entry2, 'oil-change')
    expect(specs).toHaveLength(2)
  })

  it('returns empty array when no spec matches the slug', () => {
    const specs = getRelevantTorqueSpecs(entry, 'chain-lubrication')
    expect(specs).toHaveLength(0)
  })

  it('returns empty array when a spec has no related_intervals', () => {
    const specs = getRelevantTorqueSpecs(entry, 'front-axle')
    expect(specs).toHaveLength(0)
  })
})
