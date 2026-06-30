import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { customIntervals } from './customIntervals.js'
import { userMotorcycles } from './userMotorcycles.js'

export const TICKET_STATUSES = ['todo', 'part_ordered', 'in_progress', 'done'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const tickets = sqliteTable('tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userMotorcycleId: integer('user_motorcycle_id')
    .notNull()
    .references(() => userMotorcycles.id),
  /** Set for catalog motorcycle tickets. Paired with intervalSlug. */
  catalogSlug: text('catalog_slug'),
  /** Slug of the catalog interval this ticket tracks. */
  intervalSlug: text('interval_slug'),
  /** Set for custom motorcycle tickets. Points to a customIntervals row. */
  customIntervalId: integer('custom_interval_id').references(() => customIntervals.id),
  operation: text('operation').notNull(),
  status: text('status', { enum: TICKET_STATUSES }).notNull().default('todo'),
  targetKm: integer('target_km'),
  targetDate: integer('target_date', { mode: 'timestamp' }),
  doneKm: integer('done_km'),
  doneAt: integer('done_at', { mode: 'timestamp' }),
})
