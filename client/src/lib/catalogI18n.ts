import type { Ticket } from '@/types'

/** Returns a translated operation label for catalog tickets, falls back to ticket.operation for user-created tickets. */
export function getOperationLabel(
  ticket: Ticket,
  t: (key: string, fallback: string) => string
): string {
  if (ticket.intervalSlug) {
    return t(`catalog.intervals.${ticket.intervalSlug}`, ticket.operation)
  }
  return ticket.operation
}
