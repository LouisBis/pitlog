import { resolve } from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema/index.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const sqlite = new Database(process.env.DB_PATH ?? './data/pitlog.db')
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

migrate(db, { migrationsFolder: resolve(__dirname, 'migrations') })
