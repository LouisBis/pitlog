export interface Motorcycle {
  id: number
  brand: string
  model: string
  year: number
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

export interface Ticket {
  id: number
  userMotorcycleId: number
  intervalId: number | null
  operation: string
  status: TicketStatus
  targetKm: number | null
  targetDate: string | null
  doneKm: number | null
  doneAt: string | null
  customKm: number | null
  customDays: number | null
}

export interface VelocityResult {
  kmPerDay: number
  dataPoints: number
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
