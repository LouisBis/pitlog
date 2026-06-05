import { integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { userMotorcycles } from './userMotorcycles.js'

export const kmHistory = sqliteTable('km_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userMotorcycleId: integer('user_motorcycle_id')
    .notNull()
    .references(() => userMotorcycles.id),
  km: integer('km').notNull(),
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull(),
})
