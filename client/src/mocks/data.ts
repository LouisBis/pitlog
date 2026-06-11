import type { Ticket, UserMotorcycle, VelocityResult } from '@/types'

interface MockInterval {
  id: number
  intervalKm: number | null
  intervalDays: number | null
}

export const mockIntervals: Record<number, MockInterval> = {
  1: { id: 1, intervalKm: 6000,  intervalDays: 365  }, // Engine oil change
  2: { id: 2, intervalKm: 6000,  intervalDays: 365  }, // Air filter inspection
  3: { id: 3, intervalKm: 12000, intervalDays: 730  }, // Spark plugs
  4: { id: 4, intervalKm: 1000,  intervalDays: null }, // Drive chain lubrication
  5: { id: 5, intervalKm: null,  intervalDays: 730  }, // Brake fluid
}

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
  },
]

export const mockTickets: Ticket[] = [
  // 🔴 overdue by 200 km
  { id: 1, userMotorcycleId: 1, intervalId: 1, operation: 'Vidange moteur', status: 'todo', targetKm: 15000, targetDate: null, doneKm: null, doneAt: null },
  // 🔴 150 km left
  { id: 2, userMotorcycleId: 1, intervalId: 2, operation: 'Filtre à air', status: 'todo', targetKm: 15350, targetDate: null, doneKm: null, doneAt: null },
  // 🟠 450 km left
  { id: 3, userMotorcycleId: 1, intervalId: 3, operation: 'Bougies', status: 'todo', targetKm: 15650, targetDate: null, doneKm: null, doneAt: null },
  // 🟢 part ordered, 2800 km left
  { id: 4, userMotorcycleId: 1, intervalId: 4, operation: 'Lubrification chaîne', status: 'part_ordered', targetKm: 18000, targetDate: null, doneKm: null, doneAt: null },
  // 🟢 in progress, no target
  { id: 5, userMotorcycleId: 1, intervalId: 2, operation: 'Filtre à air', status: 'in_progress', targetKm: null, targetDate: null, doneKm: null, doneAt: null },
  // done — linked to interval 5 (brake fluid), will regenerate on next demo drag to done
  { id: 6, userMotorcycleId: 1, intervalId: 5, operation: 'Liquide de frein', status: 'done', targetKm: 14000, targetDate: null, doneKm: 14050, doneAt: '2025-11-20T00:00:00.000Z' },
]

export const mockVelocity: VelocityResult = {
  kmPerDay: 6.99,
  dataPoints: 4,
  periodDays: 458.5,
}

let nextTicketId = 7
export function nextId(): number {
  return nextTicketId++
}
