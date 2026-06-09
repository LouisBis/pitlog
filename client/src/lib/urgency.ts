import type { Ticket } from '@/types'

export type Urgency = 'urgent' | 'warning' | 'ok'

export function getUrgency(ticket: Ticket, currentKm: number): Urgency {
  if (ticket.status === 'done' || ticket.targetKm === null) return 'ok'
  const remaining = ticket.targetKm - currentKm
  if (remaining <= 200) return 'urgent'
  if (remaining <= 500) return 'warning'
  return 'ok'
}

export function formatKmRemaining(ticket: Ticket, currentKm: number): string | null {
  if (ticket.status === 'done' || ticket.targetKm === null) return null
  const remaining = ticket.targetKm - currentKm
  if (remaining <= 0) return `Dépassé de ${Math.abs(remaining).toLocaleString('fr-FR')} km`
  return `${remaining.toLocaleString('fr-FR')} km restants`
}
