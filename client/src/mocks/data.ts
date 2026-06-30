import type { CatalogEntry, CatalogSummary, Ticket, TicketPart, UserMotorcycle, VelocityResult } from '@/types'

export const mockCatalogEntries: CatalogEntry[] = [
  {
    slug: 'suzuki-gsf600-bandit-1997',
    brand: 'Suzuki',
    model: 'GSF 600 Bandit',
    year: 1997,
    intervals: [
      { slug: 'oil-change', operation: 'Engine oil change', km: 6000, days: 365 },
      { slug: 'oil-filter', operation: 'Engine oil filter', km: 12000, days: 730 },
      { slug: 'air-filter-inspection', operation: 'Air filter inspection', km: 6000, days: 365 },
      { slug: 'air-filter-replacement', operation: 'Air filter replacement', km: 18000, days: 1095 },
      { slug: 'spark-plugs-replacement', operation: 'Spark plugs replacement', km: 12000, days: 730 },
      { slug: 'chain-lubrication', operation: 'Drive chain lubrication', km: 1000, days: null },
      { slug: 'valve-clearance-check', operation: 'Valve clearance check', km: 48000, days: null },
      { slug: 'brake-fluid-replacement', operation: 'Brake fluid replacement', km: null, days: 730 },
      { slug: 'brake-hose-replacement', operation: 'Brake hose replacement', km: null, days: 1460 },
      { slug: 'fuel-line-replacement', operation: 'Fuel line replacement', km: null, days: 1460 },
    ],
    torque_specs: [
      { slug: 'spark-plug', component: 'Spark plug', nm: 20, note: null, related_intervals: ['spark-plugs-replacement'] },
      { slug: 'oil-drain-bolt', component: 'Oil drain bolt', nm: 35, note: null, related_intervals: ['oil-change', 'oil-filter'] },
      { slug: 'front-axle', component: 'Front wheel axle', nm: 65, note: null, related_intervals: [] },
    ],
  },
  {
    slug: 'honda-cb500-1998',
    brand: 'Honda',
    model: 'CB500',
    year: 1998,
    intervals: [
      { slug: 'oil-change', operation: 'Engine oil change', km: 8000, days: 365 },
      { slug: 'spark-plugs-replacement', operation: 'Spark plugs replacement', km: 16000, days: null },
      { slug: 'air-filter-replacement', operation: 'Air filter replacement', km: 24000, days: null },
      { slug: 'chain-lubrication', operation: 'Drive chain lubrication', km: 1000, days: null },
      { slug: 'brake-fluid-replacement', operation: 'Brake fluid replacement', km: null, days: 730 },
    ],
    torque_specs: [
      { slug: 'spark-plug', component: 'Spark plug', nm: 16, note: 'Apply anti-seize compound', related_intervals: ['spark-plugs-replacement'] },
      { slug: 'oil-drain-bolt', component: 'Oil drain bolt', nm: 30, note: null, related_intervals: ['oil-change'] },
    ],
  },
]

export const mockCatalogSummaries: CatalogSummary[] = mockCatalogEntries.map(({ slug, brand, model, year }) => ({
  slug,
  brand,
  model,
  year,
}))

export const mockUserMotorcycles: UserMotorcycle[] = [
  {
    id: 1,
    currentKm: 15200,
    acquiredAt: '2021-03-15T00:00:00.000Z',
    motorcycleId: 1,
    brand: 'Suzuki',
    model: 'GSF 600 Bandit',
    year: 1997,
    isCustom: false,
    catalogSlug: 'suzuki-gsf600-bandit-1997',
  },
]

export const mockTickets: Ticket[] = [
  // 🔴 overdue by 200 km
  {
    id: 1,
    userMotorcycleId: 1,
    catalogSlug: 'suzuki-gsf600-bandit-1997',
    intervalSlug: 'oil-change',
    customIntervalId: null,
    operation: 'Vidange moteur',
    status: 'todo',
    targetKm: 15000,
    targetDate: null,
    doneKm: null,
    doneAt: null,
    customKm: null,
    customDays: null,
  },
  // 🔴 150 km left
  {
    id: 2,
    userMotorcycleId: 1,
    catalogSlug: 'suzuki-gsf600-bandit-1997',
    intervalSlug: 'air-filter-inspection',
    customIntervalId: null,
    operation: 'Filtre à air',
    status: 'todo',
    targetKm: 15350,
    targetDate: null,
    doneKm: null,
    doneAt: null,
    customKm: null,
    customDays: null,
  },
  // 🟠 450 km left
  {
    id: 3,
    userMotorcycleId: 1,
    catalogSlug: 'suzuki-gsf600-bandit-1997',
    intervalSlug: 'spark-plugs-replacement',
    customIntervalId: null,
    operation: 'Bougies',
    status: 'todo',
    targetKm: 15650,
    targetDate: null,
    doneKm: null,
    doneAt: null,
    customKm: null,
    customDays: null,
  },
  // 🟢 part ordered, 2800 km left
  {
    id: 4,
    userMotorcycleId: 1,
    catalogSlug: 'suzuki-gsf600-bandit-1997',
    intervalSlug: 'chain-lubrication',
    customIntervalId: null,
    operation: 'Lubrification chaîne',
    status: 'part_ordered',
    targetKm: 18000,
    targetDate: null,
    doneKm: null,
    doneAt: null,
    customKm: null,
    customDays: null,
  },
  // 🟢 in progress, no target
  {
    id: 5,
    userMotorcycleId: 1,
    catalogSlug: 'suzuki-gsf600-bandit-1997',
    intervalSlug: 'air-filter-inspection',
    customIntervalId: null,
    operation: 'Filtre à air',
    status: 'in_progress',
    targetKm: null,
    targetDate: null,
    doneKm: null,
    doneAt: null,
    customKm: null,
    customDays: null,
  },
  // done — brake fluid, will regenerate on next demo drag to done
  {
    id: 6,
    userMotorcycleId: 1,
    catalogSlug: 'suzuki-gsf600-bandit-1997',
    intervalSlug: 'brake-fluid-replacement',
    customIntervalId: null,
    operation: 'Liquide de frein',
    status: 'done',
    targetKm: 14000,
    targetDate: null,
    doneKm: 14050,
    doneAt: '2025-11-20T00:00:00.000Z',
    customKm: null,
    customDays: null,
  },
]

export const mockParts: TicketPart[] = [
  {
    id: 1,
    ticketId: 1,
    name: 'Filtre à huile',
    brand: 'Mann',
    reference: 'W811/80',
    quantity: 1,
    url: 'https://www.amazon.fr',
  },
  {
    id: 2,
    ticketId: 1,
    name: 'Huile moteur 10W40',
    brand: 'Motul',
    reference: null,
    quantity: 4,
    url: null,
  },
]

let _nextPartId = 3
export function nextMockPartId(): number {
  return _nextPartId++
}

export const mockVelocity: VelocityResult = {
  kmPerDay: 6.99,
  dataPoints: 4,
  periodDays: 458.5,
}

let nextTicketId = 7
export function nextId(): number {
  return nextTicketId++
}
