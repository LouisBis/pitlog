import { and, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tickets, intervalOverrides, customIntervals } from '../db/schema/index.js'
import { loadCatalogEntry } from './catalog.js'
import logger from './logger.js'

/** Returns effective km/days for a ticket, applying intervalOverrides or customIntervals. */
export function resolveInterval(
  userMotorcycleId: number,
  ticket: { catalogSlug: string | null; intervalSlug: string | null; customIntervalId: number | null },
): { intervalKm: number | null; intervalDays: number | null } | null {
  if (ticket.catalogSlug && ticket.intervalSlug) {
    const entry = loadCatalogEntry(ticket.catalogSlug)
    const catalogInterval = entry?.categories.flatMap((c) => c.intervals).find((i) => i.slug === ticket.intervalSlug)
    if (!catalogInterval) return null

    const override = db
      .select()
      .from(intervalOverrides)
      .where(
        and(
          eq(intervalOverrides.userMotorcycleId, userMotorcycleId),
          eq(intervalOverrides.catalogSlug, ticket.catalogSlug),
          eq(intervalOverrides.intervalSlug, ticket.intervalSlug),
        ),
      )
      .get()

    return {
      intervalKm: override?.customKm ?? catalogInterval.km,
      intervalDays: override?.customDays ?? catalogInterval.days,
    }
  }

  if (ticket.customIntervalId) {
    const custom = db.select().from(customIntervals).where(eq(customIntervals.id, ticket.customIntervalId)).get()
    if (!custom) return null
    return { intervalKm: custom.intervalKm, intervalDays: custom.intervalDays }
  }

  return null
}

/** If doneTicket is linked to a catalog or custom interval and has doneKm/doneAt set, inserts the
 *  next `todo` ticket for that interval. No-op (and returns false) otherwise. */
export function regenerateIfDue(
  userMotorcycleId: number,
  doneTicket: {
    catalogSlug: string | null
    intervalSlug: string | null
    customIntervalId: number | null
    operation: string
    doneKm: number | null
    doneAt: Date | null
  },
): boolean {
  const hasInterval = doneTicket.catalogSlug || doneTicket.customIntervalId
  if (!hasInterval || doneTicket.doneKm === null || doneTicket.doneAt === null) return false

  const effective = resolveInterval(userMotorcycleId, doneTicket)
  if (!effective) return false

  const nextTargetKm = effective.intervalKm !== null ? doneTicket.doneKm + effective.intervalKm : null
  const nextTargetDate =
    effective.intervalDays !== null
      ? new Date(doneTicket.doneAt.getTime() + effective.intervalDays * 24 * 60 * 60 * 1000)
      : null

  db.insert(tickets)
    .values({
      userMotorcycleId,
      catalogSlug: doneTicket.catalogSlug,
      intervalSlug: doneTicket.intervalSlug,
      customIntervalId: doneTicket.customIntervalId,
      operation: doneTicket.operation,
      status: 'todo',
      targetKm: nextTargetKm,
      targetDate: nextTargetDate,
    })
    .run()

  logger.info({ userMotorcycleId, operation: doneTicket.operation, nextTargetKm }, 'Ticket regenerated')
  return true
}
