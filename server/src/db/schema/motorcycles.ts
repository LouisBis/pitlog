import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const motorcycles = sqliteTable('motorcycles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
})
