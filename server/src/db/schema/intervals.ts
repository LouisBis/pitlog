import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { motorcycles } from './motorcycles.js'

export const intervals = sqliteTable('intervals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  motorcycleId: integer('motorcycle_id')
    .notNull()
    .references(() => motorcycles.id),
  operation: text('operation').notNull(),
  intervalKm: integer('interval_km'),
  intervalDays: integer('interval_days'),
})
