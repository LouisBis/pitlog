/** Motorcycle from the catalogue (not user-owned). */
export interface Motorcycle {
  id: number
  brand: string
  model: string
  year: number
  /** True when entered manually by the user — no catalogue intervals exist for it. */
  isCustom: boolean
}

export interface AddMotorcyclePayload {
  brand: string
  model: string
  year: number
  currentKm: number
}

export const TICKET_STATUSES = ['todo', 'part_ordered', 'in_progress', 'done'] as const
export type TicketStatus = typeof TICKET_STATUSES[number]

/** Motorcycle owned by the user, joined with catalogue data for display. */
export interface UserMotorcycle {
  id: number
  currentKm: number
  acquiredAt: string
  motorcycleId: number
  brand: string
  model: string
  year: number
  isCustom: boolean
}

/** Maintenance ticket on the kanban board. */
export interface Ticket {
  id: number
  userMotorcycleId: number
  /** Null when the ticket was created manually with no catalogue interval. */
  intervalId: number | null
  operation: string
  status: TicketStatus
  /** Odometer value at which the operation is due. */
  targetKm: number | null
  targetDate: string | null
  doneKm: number | null
  doneAt: string | null
  /** User-overridden recurrence in km (supersedes catalogue interval). */
  customKm: number | null
  /** User-overridden recurrence in days (supersedes catalogue interval). */
  customDays: number | null
}

/** Predictive velocity derived from the user's odometer history. */
export interface VelocityResult {
  /** Average km ridden per day over the sliding window. */
  kmPerDay: number
  /** Number of odometer readings used in this computation (max 10). */
  dataPoints: number
  /** Calendar days spanned by the sliding window. */
  periodDays: number
}

export interface CreateTicketPayload {
  userMotorcycleId: number
  operation: string
  intervalId?: number
  targetKm?: number
  targetDate?: string
}

export interface UpdateTicketIntervalPayload {
  customKm?: number | null
  customDays?: number | null
  operation?: string
}

export interface TicketPart {
  id: number
  ticketId: number
  name: string
  brand: string | null
  reference: string | null
  quantity: number
  url: string | null
}

export interface CreatePartPayload {
  name: string
  brand?: string
  reference?: string
  quantity?: number
  url?: string
}
