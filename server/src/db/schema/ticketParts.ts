import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { tickets } from './tickets.js'

export const ticketParts = sqliteTable('ticket_parts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketId: integer('ticket_id')
    .notNull()
    .references(() => tickets.id),
  name: text('name').notNull(),
  brand: text('brand'),
  reference: text('reference'),
  quantity: integer('quantity').notNull().default(1),
  url: text('url'),
})
