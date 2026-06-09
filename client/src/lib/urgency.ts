import type { Ticket } from '@/types'

export type Urgency = 'urgent' | 'warning' | 'ok'

const MS_PER_DAY = 1000 * 60 * 60 * 24

function urgencyFromDays(days: number): Urgency {
  if (days <= 14) return 'urgent'
  if (days <= 30) return 'warning'
  return 'ok'
}

function maxUrgency(a: Urgency, b: Urgency): Urgency {
  const rank: Record<Urgency, number> = { urgent: 2, warning: 1, ok: 0 }
  return rank[a] >= rank[b] ? a : b
}

export function getUrgency(ticket: Ticket, currentKm: number, kmPerDay?: number | null): Urgency {
  if (ticket.status === 'done') return 'ok'

  let urgency: Urgency = 'ok'

  if (ticket.targetKm !== null) {
    const remaining = ticket.targetKm - currentKm
    if (remaining <= 200) urgency = maxUrgency(urgency, 'urgent')
    else if (remaining <= 500) urgency = maxUrgency(urgency, 'warning')

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

export function formatKmRemaining(ticket: Ticket, currentKm: number): string | null {
  if (ticket.status === 'done' || ticket.targetKm === null) return null
  const remaining = ticket.targetKm - currentKm
  if (remaining <= 0) return `Dépassé de ${Math.abs(remaining).toLocaleString('fr-FR')} km`
  return `${remaining.toLocaleString('fr-FR')} km restants`
}

export function formatEstimatedDays(ticket: Ticket, currentKm: number, kmPerDay: number): string | null {
  if (ticket.status === 'done' || ticket.targetKm === null || kmPerDay <= 0) return null
  const days = Math.round((ticket.targetKm - currentKm) / kmPerDay)
  if (days <= 0) return null
  return `~${days} j`
}
