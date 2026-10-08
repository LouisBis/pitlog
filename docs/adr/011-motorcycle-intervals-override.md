# ADR-011 — per-motorcycle interval overrides and custom intervals

## Status

Amended — the single `motorcycle_intervals`/`intervals` table pair below was never built. It shipped as two separate tables, `interval_overrides` and `custom_intervals` (see "What was actually built" below).

## Context

Users need two things on a per-motorcycle basis:
1. Override the recurrence of a catalogue or generic interval (e.g. oil change every 5 000 km instead of the catalogue's 6 000 km).
2. Define a brand-new recurring operation that does not exist in any catalogue (e.g. "Fork oil change every 12 000 km" for a motorcycle that has no such entry).

The question is: where does the **operation name** live for case 2?

### Rejected design

An early proposal added an `operation` text column to `motorcycle_intervals`, making it a dual-purpose table: an override record when `interval_id` is set, a standalone definition when `interval_id` is null.

This was rejected because it duplicates the responsibility of the `intervals` table. An operation is just a named text string regardless of whether it has a recurrence — storing it in two places creates ambiguity about which is the source of truth.

### Original decision (not implemented as written)

The original plan was a single `motorcycle_intervals` table, a **pure frequency-override table** that always references an `interval_id`:

```
motorcycle_intervals
  id                  PK
  user_motorcycle_id  FK → user_motorcycles  NOT NULL
  interval_id         FK → intervals          NOT NULL
  custom_km           INT nullable
  custom_days         INT nullable
  UNIQUE (user_motorcycle_id, interval_id)
```

This assumed a database-backed `intervals` table that every catalog interval and every custom operation would be inserted into, so `motorcycle_intervals` could always point at one row via `interval_id`.

## What was actually built

No `intervals` table and no `motorcycle_intervals` table exist. Catalog intervals never moved into the database — they stayed in the versioned JSON files under `catalog/` (see [ADR-010](010-generic-seed-strategy.md)), identified by `catalogSlug` + `intervalSlug` strings, not a database row. That made a single FK-based override table impossible: there is no `intervals.id` for a catalog interval to point to.

The two cases from the Context section ended up as two separate tables instead:

**`interval_overrides`** (`server/src/db/schema/intervalOverrides.ts`) — overrides a *catalog* interval's recurrence. Keyed by `(userMotorcycleId, catalogSlug, intervalSlug)` — a text key, not a foreign key, because the interval it overrides lives in JSON, not in a table row.

```
interval_overrides
  id                  PK
  user_motorcycle_id  FK → user_motorcycles  NOT NULL
  catalog_slug        TEXT NOT NULL
  interval_slug       TEXT NOT NULL
  custom_km           INT nullable
  custom_days         INT nullable
  UNIQUE (user_motorcycle_id, catalog_slug, interval_slug)
```

**`custom_intervals`** (`server/src/db/schema/customIntervals.ts`) — a brand-new recurring operation with no catalog equivalent. This is exactly the "rejected design" above: it carries its own `operation` text column, because there is no `intervals` table for the name to live in instead.

```
custom_intervals
  id              PK
  motorcycle_id   FK → motorcycles  NOT NULL
  operation       TEXT NOT NULL
  interval_km     INT nullable
  interval_days   INT nullable
```

A ticket links to one or the other via `catalogSlug` + `intervalSlug` (catalog interval, with an optional `interval_overrides` row) or `customIntervalId` (custom interval) — never both. See [ADR-010](010-generic-seed-strategy.md) for how a ticket is seeded in the first place.

## Regeneration logic

When a ticket is marked done, `resolveInterval` (`server/src/lib/ticketRegeneration.ts`) resolves the effective km/days:

1. If the ticket has `catalogSlug` + `intervalSlug`: load the catalog JSON entry, then check `interval_overrides` for a matching `(userMotorcycleId, catalogSlug, intervalSlug)` row — its `custom_km`/`custom_days` win when set, otherwise fall back to the catalog interval's own `km`/`days`.
2. If the ticket has `customIntervalId`: load that `custom_intervals` row directly — its `interval_km`/`interval_days` are the only source, there is no catalog fallback.
3. Otherwise: no interval, the ticket does not regenerate.

## Consequences

- No transaction is needed to create a custom recurring ticket — one `custom_intervals` insert, one ticket insert, no two-step dependency between a brand-new `intervals` row and a `motorcycle_intervals` row (that coupling only existed in the design that was never built).
- Overriding a catalog interval never touches `custom_intervals` or the catalog JSON — it's an upsert into `interval_overrides` keyed by slug strings, independent of any database id for the interval itself.
- A non-recurring custom ticket (no checkbox checked) has no `custom_intervals` entry and no `customIntervalId` on the ticket — it simply does not regenerate when done.
- The cost of the original design not matching reality: this ADR went unamended for a while after the real schema shipped, and `docs/ENTRETIEN.md`'s interview-prep answer on ticket regeneration repeated the never-built table names. Both are corrected together with this amendment.
