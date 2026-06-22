# ADR-003 — TanStack Query for all state (Zustand removed)

## Context

The kanban board requires frequent UI updates (drag & drop, column changes) alongside server-synchronized data (tickets, motorcycles, km history). The original design planned to split state management between Zustand (UI state) and TanStack Query (server state).

## Decision

Use **TanStack Query exclusively** for state management:

- Server state (tickets, motorcycles, km history) via queries and cache invalidation
- Drag & drop via TanStack Query's built-in optimistic updates (`onMutate` / `onError` rollback)
- Local `useState` for isolated component state (open/close panels, form fields)

Zustand was removed after evaluating that no UI state actually required a global store:

- Active motorcycle is in the URL (route param)
- Drag state is managed by dnd-kit internally
- There are no global modals

## Why not the alternatives

**Redux Toolkit** — introduces actions/reducers/selectors boilerplate that doesn't pay off at this scale.

**Context API** — triggers cascade re-renders on frequent updates. Drag & drop on a kanban board would make it unusable.

**Zustand** — was planned for drag state and active motorcycle, but TanStack Query optimistic updates cover drag entirely, and the active motorcycle belongs in the URL. Keeping an unused dependency for speculative future use is worse than removing it.

## Consequences

- Optimistic updates on drag & drop: `onMutate` updates the cache instantly, `onError` rolls back on failure
- Clear separation: anything that "lives on the server" goes through TanStack Query, anything purely visual stays in `useState`
- One fewer dependency to maintain
