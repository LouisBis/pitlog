# ADR-001 — Docker for development environment

## Context

The project runs a React client, an Express server, and a SQLite database. Each developer (or machine) needs a consistent, reproducible environment. Running services directly on the host creates "works on my machine" problems and pollutes the local Node.js environment.

## Decision

The entire development stack runs in Docker via `docker-compose`. No direct `npm install` or `node` on the host machine.

```bash
docker-compose up   # starts client + server
```

Volume mounts ensure HMR (hot module reload) works for the React client during development.

## Why not the alternative

Running services directly on the host is faster to start but:

- Node version mismatches between machines break builds silently
- Global `npm install` side effects are hard to reproduce
- Onboarding a new dev requires manual setup instead of a single command
- Dev/prod parity is harder to guarantee

## Consequences

- Single `docker-compose up` spins up the full stack
- HMR preserved via volume mounts — no dev-experience regression
- SQLite file persisted via a named volume
- Adds a small overhead on first build (image pull/build)
- All environment variables managed via `.env` files per service, never hardcoded
