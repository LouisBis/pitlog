# ADR-008 — loglevel (client) + Pino (server) for logging

## Context

The app has two runtime contexts with different logging needs: a React client running in the browser, and an Express server running in Node.js. Each context has different constraints — the client must be silent in production, the server needs structured logs for observability.

## Decision

- **Client**: thin wrapper around **loglevel** — provides log levels (`debug`, `info`, `warn`, `error`), silences everything below `warn` in production via `VITE_LOG_LEVEL`
- **Server**: **Pino** — structured JSON logs, extremely low overhead, standard in the Node.js ecosystem

## Why not the alternatives

**console.log everywhere** — no log levels, no way to silence debug output in production, no structured output on the server.

**winston (server)** — configurable but significantly heavier than Pino. No performance advantage for this scale.

**Same lib for both** — the browser and Node.js environments have different constraints. A shared solution would be a compromise on both ends.

## Consequences

- Client logger exported as a singleton: `import logger from '@/lib/logger'`
- `logger.debug()` calls are compiled away in production builds (log level controlled via env var)
- Server logs are JSON — parseable by any log aggregator if the project moves to a VPS with proper observability
- Pino's `pino-pretty` used in dev for human-readable output
