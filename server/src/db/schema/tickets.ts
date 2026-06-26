import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { intervals } from './intervals.js'
import { userMotorcycles } from './userMotorcycles.js'

export const TICKET_STATUSES = ['todo', 'part_ordered', 'in_progress', 'done'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const tickets = sqliteTable('tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userMotorcycleId: integer('user_motorcycle_id')
    .notNull()
    .references(() => userMotorcycles.id),
  intervalId: integer('interval_id').references(() => intervals.id),
  operation: text('operation').notNull(),
  status: text('status', { enum: TICKET_STATUSES }).notNull().default('todo'),
  targetKm: integer('target_km'),
  targetDate: integer('target_date', { mode: 'timestamp' }),
  doneKm: integer('done_km'),
  doneAt: integer('done_at', { mode: 'timestamp' }),
})
