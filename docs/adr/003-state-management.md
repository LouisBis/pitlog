# ADR-003 — Zustand + TanStack Query over Redux / Context

## Context

The kanban board requires frequent UI updates (drag & drop, column changes) alongside server-synchronized data (tickets, motorcycles, km history). A single state solution would either cause unnecessary re-renders or add significant boilerplate.

## Decision

Split state management in two:
- **Zustand** for client/UI state: active motorcycle, drag state, open modals
- **TanStack Query** for server state: tickets, motorcycles, km history fetched from the Express API

Local `useState` remains for isolated form state.

## Why not the alternatives

**Redux Toolkit** — well-suited for large teams but introduces actions/reducers/selectors boilerplate that doesn't pay off at this scale. DevTools are excellent but Zustand ships its own.

**Context API** — no external dependency, but triggers cascade re-renders on frequent updates. Drag & drop on a kanban board would make it unusable.

**Zustand alone (no TanStack Query)** — managing cache invalidation, loading states, and background refetching manually in Zustand is reinventing what TanStack Query already solves.

## Consequences

- Optimistic updates on drag & drop: Zustand updates the UI instantly, TanStack Query patches the API in the background and rolls back on failure
- Clear separation: anything that "lives on the server" goes through TanStack Query, anything purely visual goes into Zustand
- Both libraries are lightweight and have strong adoption in the React ecosystem (2024–2025)
