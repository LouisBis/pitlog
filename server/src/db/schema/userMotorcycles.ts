import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { motorcycles } from './motorcycles.js'

export const userMotorcycles = sqliteTable('user_motorcycles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  motorcycleId: integer('motorcycle_id')
    .notNull()
    .references(() => motorcycles.id),
  currentKm: integer('current_km').notNull().default(0),
  acquiredAt: integer('acquired_at', { mode: 'timestamp' }).notNull(),
  /** User-chosen accent swatch key for a custom motorcycle (e.g. 'blue'). Null = default brass.
   *  Catalog motorcycles never set this — their accent is a fixed brand lookup on the client. */
  accentColor: text('accent_color'),
})
