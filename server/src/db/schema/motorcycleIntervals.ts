import { integer, sqliteTable, unique } from 'drizzle-orm/sqlite-core'
import { intervals } from './intervals.js'
import { userMotorcycles } from './userMotorcycles.js'

export const motorcycleIntervals = sqliteTable('motorcycle_intervals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userMotorcycleId: integer('user_motorcycle_id')
    .notNull()
    .references(() => userMotorcycles.id),
  intervalId: integer('interval_id')
    .notNull()
    .references(() => intervals.id),
  customKm: integer('custom_km'),
  customDays: integer('custom_days'),
}, (table) => [
  unique().on(table.userMotorcycleId, table.intervalId),
])
