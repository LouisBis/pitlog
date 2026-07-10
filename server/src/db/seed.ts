import 'dotenv/config'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { motorcycles, userMotorcycles, kmHistory, tickets } from './schema/index.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const sqlite = new Database(process.env.DB_PATH ?? './data/pitlog.db')
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')
const db = drizzle(sqlite)

migrate(db, { migrationsFolder: resolve(__dirname, 'migrations') })

// --- Suzuki GSF 600 Bandit (catalogue) ---
const [gsf600] = db
  .insert(motorcycles)
  .values({
    brand: 'Suzuki',
    model: 'GSF 600 Bandit',
    year: 1997,
    isCustom: false,
    catalogSlug: 'suzuki-gsf600-bandit-1997',
  })
  .returning()
  .all()

// --- Honda CB500 (catalogue) ---
db.insert(motorcycles)
  .values({ brand: 'Honda', model: 'CB500', year: 1998, isCustom: false, catalogSlug: 'honda-cb500-1998' })
  .run()

// --- Kawasaki KLE 500 (catalogue) ---
db.insert(motorcycles)
  .values({ brand: 'Kawasaki', model: 'KLE 500', year: 2000, isCustom: false, catalogSlug: 'kawasaki-kle500-2000' })
  .run()

// --- User motorcycle: GSF 600 Bandit at 15 200 km ---
const [userGsf] = db
  .insert(userMotorcycles)
  .values({ motorcycleId: gsf600.id, currentKm: 15200, acquiredAt: new Date('2021-03-15') })
  .returning()
  .all()

db.insert(kmHistory)
  .values([
    { userMotorcycleId: userGsf.id, km: 12000, recordedAt: new Date('2023-01-10') },
    { userMotorcycleId: userGsf.id, km: 13500, recordedAt: new Date('2023-06-20') },
    { userMotorcycleId: userGsf.id, km: 14800, recordedAt: new Date('2024-01-05') },
    { userMotorcycleId: userGsf.id, km: 15200, recordedAt: new Date('2024-04-12') },
  ])
  .run()

const catalogSlug = 'suzuki-gsf600-bandit-1997'

db.insert(tickets)
  .values([
    // ── todo ──
    {
      userMotorcycleId: userGsf.id,
      catalogSlug,
      intervalSlug: 'oil-change',
      operation: 'Engine oil change',
      status: 'todo',
      targetKm: 18000,
    },
    {
      userMotorcycleId: userGsf.id,
      catalogSlug,
      intervalSlug: 'chain-lubrication',
      operation: 'Drive chain lubrication',
      status: 'todo',
      targetKm: 15350,
    },
    {
      userMotorcycleId: userGsf.id,
      catalogSlug,
      intervalSlug: 'valve-clearance-check',
      operation: 'Valve clearance check',
      status: 'todo',
      targetKm: 15550,
    },
    // ── part_ordered ──
    {
      userMotorcycleId: userGsf.id,
      catalogSlug,
      intervalSlug: 'spark-plugs-replacement',
      operation: 'Spark plugs replacement',
      status: 'part_ordered',
      targetKm: 15500,
    },
    // ── in_progress ──
    {
      userMotorcycleId: userGsf.id,
      catalogSlug,
      intervalSlug: 'air-filter-inspection',
      operation: 'Air filter inspection',
      status: 'in_progress',
      targetKm: 14900,
    },
    // ── done ──
    {
      userMotorcycleId: userGsf.id,
      catalogSlug,
      intervalSlug: 'brake-fluid-replacement',
      operation: 'Brake fluid replacement',
      status: 'done',
      doneKm: 14800,
      doneAt: new Date('2024-01-05'),
    },
  ])
  .run()

console.log('Seed complete — 3 catalogue motorcycles, 1 user motorcycle, 6 tickets.')
