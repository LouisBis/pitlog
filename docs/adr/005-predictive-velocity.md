# ADR-005 — Sliding window velocity for predictive mileage alerts

## Context

Pitlog needs to predict when a service interval will be due, not just report the current gap. Given a target mileage and a current odometer reading, a static alert ("X km remaining") is less useful than a dynamic one ("due in ~47 days at your current pace"). This requires estimating how fast the user rides.

## Decision

Compute a **sliding window velocity** (km/day) from the last N km entries stored in `KmHistory`.

```text
velocity     = (latest_km - oldest_km_in_window) / days_in_window
eta_days     = (target_km - current_km) / velocity
```

The alert displays whichever deadline comes first: the km-based ETA or the calendar-based deadline (`target_date`).

### Staleness threshold

If no km entry has been recorded in the last **30 days**, velocity is considered unreliable. The app falls back to displaying the static gap ("X km remaining") without a time estimate, and shows a prompt to update the odometer.

### Window size

Default window: last **5 entries** or last **90 days**, whichever is smaller. This balances responsiveness to recent riding patterns against noise from isolated trips.

## Why not the alternatives

**Fixed average** (total km / total days since acquisition) — too slow to reflect seasonal changes (winter storage, summer tour).

**Last two entries only** — too noisy; a single long trip skews the velocity significantly.

**External data (GPS, connected OBD)** — out of scope for Phase 1, possible Phase 2 enhancement.

## Consequences

- Every km entry saved to `KmHistory` with its timestamp
- Velocity recalculated on each new entry
- UI shows: badge with days/km remaining + tooltip "at your current pace"
- No velocity displayed if last entry > 30 days ago — staleness guard prevents misleading alerts
- Open question for later: should the window adapt based on entry frequency?
