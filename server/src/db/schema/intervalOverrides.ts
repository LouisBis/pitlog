import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { userMotorcycles } from './userMotorcycles.js'

/** User overrides for catalog interval recurrence (custom km / days). */
export const intervalOverrides = sqliteTable(
  'interval_overrides',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userMotorcycleId: integer('user_motorcycle_id').notNull().references(() => userMotorcycles.id),
    catalogSlug: text('catalog_slug').notNull(),
    intervalSlug: text('interval_slug').notNull(),
    customKm: integer('custom_km'),
    customDays: integer('custom_days'),
  },
  (table) => [unique().on(table.userMotorcycleId, table.catalogSlug, table.intervalSlug)],
)
