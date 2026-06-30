import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { motorcycles } from './motorcycles.js'

/** Maintenance intervals for custom (user-defined) motorcycles. Catalog motorcycles use JSON files. */
export const customIntervals = sqliteTable('custom_intervals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  motorcycleId: integer('motorcycle_id').notNull().references(() => motorcycles.id),
  operation: text('operation').notNull(),
  intervalKm: integer('interval_km'),
  intervalDays: integer('interval_days'),
})
