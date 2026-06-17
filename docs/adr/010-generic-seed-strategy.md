# ADR-010 — Generic seed strategy for unrecognised motorcycles

## Status

Accepted.

## Context

When a user adds a motorcycle that is not in the catalogue (unknown brand/model/year combination), the app creates a `motorcycles` entry with `is_custom = true`. The question is: what state should the kanban board be in immediately after creation?

Two options were considered:

**Option A — Empty board.** The user starts with no tickets and creates them manually. Simple to implement, but a poor first-run experience: the board looks broken, and the user has no starting point for what to track.

**Option B — Generic template.** A permanent `Generic / Standard` entry in the `motorcycles` catalogue holds a set of common service intervals (oil change, air filter, spark plugs, chain, brake fluid). Any custom motorcycle is seeded from this template at creation time, giving the user a functional board on arrival.

## Decision

Use **Option B**. The `Generic / Standard` catalogue entry is inserted by the seed script alongside real models. The `POST /user-motorcycles` route detects `is_custom = true` and calls `findGenericIntervals()` instead of the motorcycle's own catalogue intervals.

The generic intervals are intentionally conservative (oil every 5 000 km, chain lube every 500 km, brake fluid every 2 years) — reasonable defaults for most road motorcycles.

## Why not an empty board

This is a single-user local app. There is no onboarding flow, no tutorial, no guided setup. An empty board on first open for a custom motorcycle would require the user to know what to add, how to add it, and why. The generic template removes that friction entirely while remaining easy to customise or delete.

## Migration path

The generic template is a V1 stopgap. In V1.2, the `motorcycle_intervals` table will allow per-motorcycle interval customisation. Once that is in place, the generic template becomes the default starting point that the user overrides — rather than a permanent constraint.

## Consequences

- The `Generic / Standard` entry must always be present in the DB. A fresh seed creates it; wiping the volume and reseeding restores it.
- `findGenericIntervals()` in `userMotorcycles.ts` looks up the entry by `brand = 'Generic'` and `model = 'Standard'`. If the entry is missing (e.g. partial DB reset), custom motos are created with an empty board — degraded but not broken.
- The `import-intervals` endpoint still returns 422 for custom motos: it looks for catalogue intervals on the motorcycle's own entry, which has none. This is intentional — the import button is only shown for catalogue motos.
