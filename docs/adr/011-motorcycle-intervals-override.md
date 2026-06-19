# ADR-011 — motorcycle_intervals as a frequency-override table

## Status

Accepted.

## Context

Users need two things on a per-motorcycle basis:
1. Override the recurrence of a catalogue or generic interval (e.g. oil change every 5 000 km instead of the catalogue's 6 000 km).
2. Define a brand-new recurring operation that does not exist in any catalogue (e.g. "Fork oil change every 12 000 km" for a motorcycle that has no such entry).

The question is: where does the **operation name** live for case 2?

### Rejected design

An early proposal added an `operation` text column to `motorcycle_intervals`, making it a dual-purpose table: an override record when `interval_id` is set, a standalone definition when `interval_id` is null.

This was rejected because it duplicates the responsibility of the `intervals` table. An operation is just a named text string regardless of whether it has a recurrence — storing it in two places creates ambiguity about which is the source of truth.

## Decision

`motorcycle_intervals` is a **pure frequency-override table**. It always references an `interval_id` — no exceptions.

```
motorcycle_intervals
  id                  PK
  user_motorcycle_id  FK → user_motorcycles  NOT NULL
  interval_id         FK → intervals          NOT NULL
  custom_km           INT nullable
  custom_days         INT nullable
  UNIQUE (user_motorcycle_id, interval_id)
```

**Case 1 — override an existing interval:**
Create a `motorcycle_intervals` record pointing to the existing `intervals.id`. The ticket keeps its `intervalId`. Future regenerations check `motorcycle_intervals` first, fall back to `intervals` defaults.

**Case 2 — new custom recurring operation:**
1. Create an `intervals` entry (`motorcycleId`, `operation`, `intervalKm`, `intervalDays`).
2. Create a `motorcycle_intervals` entry referencing that new interval.
3. Create the ticket with `intervalId` pointing to the new interval.

Operation names always live in `intervals`. `motorcycle_intervals` only stores how often.

## Regeneration logic

When a ticket is marked done, the regeneration resolver:
1. Looks for a `motorcycle_intervals` record matching `(userMotorcycleId, intervalId)`.
2. If found: uses `custom_km` / `custom_days` (falling back to the interval's defaults if either is null).
3. If not found: uses `intervals.intervalKm` / `intervals.intervalDays` directly.

## Consequences

- `motorcycle_intervals` has a NOT NULL `interval_id` — no nullable FK, no dual-mode rows.
- Creating a custom recurring ticket is a two-step server operation: insert into `intervals`, then insert into `motorcycle_intervals`. Both must succeed or neither does (wrap in a transaction).
- A non-recurring custom ticket (no checkbox checked) has no `motorcycle_intervals` entry and no `intervalId` on the ticket — it simply does not regenerate when done.
