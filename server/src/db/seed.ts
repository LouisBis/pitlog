import "dotenv/config";
import { resolve } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { motorcycles, intervals, userMotorcycles, kmHistory, tickets } from "./schema/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const sqlite = new Database(process.env.DB_PATH ?? "./data/pitlog.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: resolve(__dirname, "migrations") });

// --- Suzuki GSF 600 Bandit ---
const [gsf600] = db
  .insert(motorcycles)
  .values({
    brand: "Suzuki",
    model: "GSF 600 Bandit",
    year: 1997,
    isCustom: false,
  })
  .returning()
  .all();

const gsf600Intervals = db.insert(intervals)
  .values([
    { motorcycleId: gsf600.id, operation: "Engine oil change",       intervalKm: 6000,  intervalDays: 365  },
    { motorcycleId: gsf600.id, operation: "Engine oil filter",       intervalKm: 12000, intervalDays: 730  },
    { motorcycleId: gsf600.id, operation: "Air filter inspection",   intervalKm: 6000,  intervalDays: 365  },
    { motorcycleId: gsf600.id, operation: "Air filter replacement",  intervalKm: 18000, intervalDays: 1095 },
    { motorcycleId: gsf600.id, operation: "Spark plugs replacement", intervalKm: 12000, intervalDays: 730  },
    { motorcycleId: gsf600.id, operation: "Drive chain lubrication", intervalKm: 1000,  intervalDays: null },
    { motorcycleId: gsf600.id, operation: "Valve clearance check",   intervalKm: 48000, intervalDays: null },
    { motorcycleId: gsf600.id, operation: "Brake fluid replacement", intervalKm: null,  intervalDays: 730  },
    { motorcycleId: gsf600.id, operation: "Brake hose replacement",  intervalKm: null,  intervalDays: 1460 },
    { motorcycleId: gsf600.id, operation: "Fuel line replacement",   intervalKm: null,  intervalDays: 1460 },
  ])
  .returning()
  .all();

const gsf600i = Object.fromEntries(gsf600Intervals.map((i) => [i.operation, i.id]));

// --- Honda CB500 ---
const [cb500] = db
  .insert(motorcycles)
  .values({
    brand: "Honda",
    model: "CB500",
    year: 1998,
    isCustom: false,
  })
  .returning()
  .all();

db.insert(intervals)
  .values([
    {
      motorcycleId: cb500.id,
      operation: "Engine oil change",
      intervalKm: 6000,
      intervalDays: 365,
    },
    {
      motorcycleId: cb500.id,
      operation: "Engine oil filter",
      intervalKm: 6000,
      intervalDays: 365,
    },
    {
      motorcycleId: cb500.id,
      operation: "Air filter cleaning",
      intervalKm: 6000,
      intervalDays: 365,
    },
    {
      motorcycleId: cb500.id,
      operation: "Air filter replacement",
      intervalKm: 18000,
      intervalDays: 1095,
    },
    {
      motorcycleId: cb500.id,
      operation: "Spark plugs replacement",
      intervalKm: 12000,
      intervalDays: null,
    },
    {
      motorcycleId: cb500.id,
      operation: "Drive chain tension",
      intervalKm: 800,
      intervalDays: null,
    },
    {
      motorcycleId: cb500.id,
      operation: "Drive chain lubrication",
      intervalKm: 300,
      intervalDays: null,
    },
    {
      motorcycleId: cb500.id,
      operation: "Coolant replacement",
      intervalKm: 36000,
      intervalDays: 730,
    },
    {
      motorcycleId: cb500.id,
      operation: "Valve clearance check",
      intervalKm: 24000,
      intervalDays: null,
    },
    {
      motorcycleId: cb500.id,
      operation: "Brake fluid replacement",
      intervalKm: null,
      intervalDays: 730,
    },
    {
      motorcycleId: cb500.id,
      operation: "Fork oil change",
      intervalKm: 12000,
      intervalDays: null,
    },
  ])
  .run();

// --- Kawasaki KLE 500 ---
const [kle500] = db
  .insert(motorcycles)
  .values({
    brand: "Kawasaki",
    model: "KLE 500",
    year: 2000,
    isCustom: false,
  })
  .returning()
  .all();

db.insert(intervals)
  .values([
    {
      motorcycleId: kle500.id,
      operation: "Engine oil change",
      intervalKm: 10000,
      intervalDays: 365,
    },
    {
      motorcycleId: kle500.id,
      operation: "Engine oil filter",
      intervalKm: 10000,
      intervalDays: 365,
    },
    {
      motorcycleId: kle500.id,
      operation: "Air filter inspection",
      intervalKm: 10000,
      intervalDays: null,
    },
    {
      motorcycleId: kle500.id,
      operation: "Spark plugs replacement",
      intervalKm: 5000,
      intervalDays: null,
    },
    {
      motorcycleId: kle500.id,
      operation: "Drive chain tension",
      intervalKm: 800,
      intervalDays: null,
    },
    {
      motorcycleId: kle500.id,
      operation: "Coolant replacement",
      intervalKm: null,
      intervalDays: 730,
    },
    {
      motorcycleId: kle500.id,
      operation: "Valve clearance check",
      intervalKm: 10000,
      intervalDays: null,
    },
    {
      motorcycleId: kle500.id,
      operation: "Brake fluid replacement",
      intervalKm: null,
      intervalDays: 730,
    },
    {
      motorcycleId: kle500.id,
      operation: "Brake fluid change",
      intervalKm: 5000,
      intervalDays: null,
    },
    {
      motorcycleId: kle500.id,
      operation: "Fork oil change",
      intervalKm: 25000,
      intervalDays: null,
    },
    {
      motorcycleId: kle500.id,
      operation: "Steering head check",
      intervalKm: 10000,
      intervalDays: null,
    },
  ])
  .run();

// --- User motorcycle: GSF 600 Bandit at 15 200 km ---
const [userGsf] = db
  .insert(userMotorcycles)
  .values({
    motorcycleId: gsf600.id,
    currentKm: 15200,
    acquiredAt: new Date("2021-03-15"),
  })
  .returning()
  .all();

db.insert(kmHistory)
  .values([
    { userMotorcycleId: userGsf.id, km: 12000, recordedAt: new Date("2023-01-10") },
    { userMotorcycleId: userGsf.id, km: 13500, recordedAt: new Date("2023-06-20") },
    { userMotorcycleId: userGsf.id, km: 14800, recordedAt: new Date("2024-01-05") },
    { userMotorcycleId: userGsf.id, km: 15200, recordedAt: new Date("2024-04-12") },
  ])
  .run();

db.insert(tickets)
  .values([
    // ── todo ──────────────────────────────────────────────
    {
      userMotorcycleId: userGsf.id,
      intervalId: gsf600i["Engine oil change"],
      operation: "Engine oil change",
      status: "todo",
      targetKm: 18000,           // 2 800 km remaining → green
    },
    {
      userMotorcycleId: userGsf.id,
      intervalId: gsf600i["Drive chain lubrication"],
      operation: "Drive chain lubrication",
      status: "todo",
      targetKm: 15350,           // 150 km remaining → red
    },
    {
      userMotorcycleId: userGsf.id,
      intervalId: gsf600i["Valve clearance check"],
      operation: "Valve clearance check",
      status: "todo",
      targetKm: 15550,           // 350 km remaining → orange
    },
    // ── part_ordered ──────────────────────────────────────
    {
      userMotorcycleId: userGsf.id,
      intervalId: gsf600i["Spark plugs replacement"],
      operation: "Spark plugs replacement",
      status: "part_ordered",
      targetKm: 15500,           // 300 km remaining → orange
    },
    // ── in_progress ───────────────────────────────────────
    {
      userMotorcycleId: userGsf.id,
      intervalId: gsf600i["Air filter inspection"],
      operation: "Air filter inspection",
      status: "in_progress",
      targetKm: 14900,           // overdue by 300 km → red
    },
    // ── done ──────────────────────────────────────────────
    {
      userMotorcycleId: userGsf.id,
      intervalId: gsf600i["Brake fluid replacement"],
      operation: "Brake fluid replacement",
      status: "done",
      doneKm: 14800,
      doneAt: new Date("2024-01-05"),
    },
  ])
  .run();

// --- Générique / Standard (template for unrecognised motorcycles) ---
const [generic] = db
  .insert(motorcycles)
  .values({ brand: 'Generic', model: 'Standard', year: 0, isCustom: false })
  .returning()
  .all();

db.insert(intervals)
  .values([
    { motorcycleId: generic.id, operation: 'Engine oil change',       intervalKm: 5000, intervalDays: 365  },
    { motorcycleId: generic.id, operation: 'Air filter inspection',   intervalKm: 10000, intervalDays: null },
    { motorcycleId: generic.id, operation: 'Spark plugs replacement', intervalKm: 10000, intervalDays: null },
    { motorcycleId: generic.id, operation: 'Drive chain lubrication', intervalKm: 500,   intervalDays: null },
    { motorcycleId: generic.id, operation: 'Drive chain tension',     intervalKm: 1000,  intervalDays: null },
    { motorcycleId: generic.id, operation: 'Brake fluid replacement', intervalKm: null,  intervalDays: 730  },
  ])
  .run();

console.log("Seed complete — 4 motorcycles (incl. generic template), intervals, 1 user motorcycle, 6 tickets loaded.");
