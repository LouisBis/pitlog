# ADR-002 — SQLite over PostgreSQL

## Context

The app is single-user and runs locally (or on a personal VPS). We need a persistent relational store for motorcycles, tickets, and km history. The data model is relational with foreign keys and queries that benefit from SQL.

## Decision

Use **SQLite** as the database, accessed via the Express server. The SQLite file is persisted through a Docker named volume.

## Why not PostgreSQL

PostgreSQL is the right choice for multi-user, concurrent, or production-scale workloads. For Pitlog:
- There is no multi-user requirement
- Write concurrency is not a concern (single user, sequential interactions)
- Running a Postgres container adds operational overhead (separate service, connection pool, migrations tooling) that doesn't pay off here
- SQLite is a file — zero network latency, trivially portable, easy to back up

The migration path to Postgres exists if the project evolves: the SQL schema and query patterns are compatible, only the driver changes.

## Consequences

- Simpler `docker-compose.yml`: no separate database service
- SQLite file persisted via Docker volume, not lost on container restart
- No connection pooling needed
- Concurrent writes from multiple tabs could theoretically cause lock contention — acceptable given single-user context
- Must use a SQLite-compatible migration tool (e.g. better-sqlite3 + custom migrations, or Drizzle ORM with SQLite adapter)
