# ADR-009 — Express over Fastify / NestJS / Hono

## Context

The backend is a REST API serving a single React client. It needs to handle CRUD operations on motorcycles, tickets, and km history, with room for a streaming LLM endpoint in Phase 3. The framework choice affects developer experience, TypeScript integration, and readability in a portfolio context.

## Decision

Use **Express 5** as the HTTP framework.

## Why not the alternatives

**Fastify** — technically stronger than Express: faster throughput, native TypeScript support, JSON Schema validation built-in, and Pino integrated by default. A legitimate alternative. Ruled out because Express remains the dominant framework in job postings and technical interviews in the French market — recognizability matters for a portfolio project.

**NestJS** — opinionated full framework (decorators, modules, DI container). Well-suited for large teams but introduces significant boilerplate and architectural overhead that doesn't pay off at this scale.

**Hono** — modern, lightweight, TypeScript-first, runs on multiple runtimes. Promising but less established in the French ecosystem. Low signal value for recruiters today.

**tRPC** — eliminates the REST layer by sharing types between client and server. Interesting but tightly couples the client and server, and removes the ability to demonstrate REST API design — a common interview topic.

## Consequences

- Express 5 (stable release) with full async/await error handling — no more `next(err)` boilerplate
- REST API — explicit routes, HTTP verbs, status codes — defensible in interviews
- Pino added manually as the logger (would have been built-in with Fastify)
- Simple to extend with a streaming endpoint (`res.setHeader('Content-Type', 'text/event-stream')`) for Phase 3 LLM integration
