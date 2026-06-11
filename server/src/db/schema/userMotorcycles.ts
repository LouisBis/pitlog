import { integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { motorcycles } from './motorcycles.js'

export const userMotorcycles = sqliteTable('user_motorcycles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  motorcycleId: integer('motorcycle_id')
    .notNull()
    .references(() => motorcycles.id),
  currentKm: integer('current_km').notNull().default(0),
  acquiredAt: integer('acquired_at', { mode: 'timestamp' }).notNull(),
})
