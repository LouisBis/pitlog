import type { Ticket } from '@/types'

export type Urgency = 'urgent' | 'warning' | 'ok'

const MS_PER_DAY = 1000 * 60 * 60 * 24

// Thresholds: ≤14 days / ≤200 km = urgent, ≤30 days / ≤500 km = warning
function urgencyFromDays(days: number): Urgency {
  if (days <= 14) return 'urgent'
  if (days <= 30) return 'warning'
  return 'ok'
}

/** Returns the more severe of two urgency levels.
 *  Used when both a km deadline and a date deadline apply to the same ticket. */
function maxUrgency(a: Urgency, b: Urgency): Urgency {
  const rank: Record<Urgency, number> = { urgent: 2, warning: 1, ok: 0 }
  return rank[a] >= rank[b] ? a : b
}

/** Computes the urgency level for a ticket given the current odometer and optional velocity. */
export function getUrgency(ticket: Ticket, currentKm: number, kmPerDay?: number | null): Urgency {
  if (ticket.status === 'done') return 'ok'

  let urgency: Urgency = 'ok'

  if (ticket.targetKm !== null) {
    const remaining = ticket.targetKm - currentKm
    if (remaining <= 200) urgency = maxUrgency(urgency, 'urgent')
    else if (remaining <= 500) urgency = maxUrgency(urgency, 'warning')

    // If velocity is known, also derive urgency from estimated arrival time
    if (kmPerDay && kmPerDay > 0) {
      const estimatedDays = remaining / kmPerDay
      urgency = maxUrgency(urgency, urgencyFromDays(estimatedDays))
    }
  }

  if (ticket.targetDate !== null) {
    const daysUntil = (new Date(ticket.targetDate).getTime() - Date.now()) / MS_PER_DAY
    urgency = maxUrgency(urgency, urgencyFromDays(daysUntil))
  }

  return urgency
}

/** Returns km remaining until the ticket is due, or null if not applicable. */
export function getKmRemaining(ticket: Ticket, currentKm: number): number | null {
  if (ticket.status === 'done' || ticket.targetKm === null) return null
  return ticket.targetKm - currentKm
}

/** Returns the estimated number of days until due based on velocity, or null if not computable. */
export function getEstimatedDays(ticket: Ticket, currentKm: number, kmPerDay: number): number | null {
  if (ticket.status === 'done' || ticket.targetKm === null || kmPerDay <= 0) return null
  const days = Math.round((ticket.targetKm - currentKm) / kmPerDay)
  return days <= 0 ? null : days
}
