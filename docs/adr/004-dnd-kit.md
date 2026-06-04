# ADR-004 — dnd-kit for kanban drag & drop

## Context

The kanban board requires drag & drop between columns on both desktop and mobile. The library must handle touch events natively, integrate cleanly with React, and be actively maintained.

## Decision

Use **dnd-kit** (`@dnd-kit/core` + `@dnd-kit/sortable`) for all drag & drop interactions on the kanban board.

## Why not the alternatives

**react-beautiful-dnd** — the historical reference, but officially unmaintained since 2023. No touch support out of the box. Not a viable choice for a mobile-first app.

**react-dnd** — lower-level, requires more wiring, poor mobile/touch support by default.

**Native HTML5 drag & drop** — no touch support on mobile, limited customization, inconsistent behavior across browsers.

## Consequences

- Touch and mouse events handled uniformly — swipe to change column works on mobile
- Accessibility (keyboard navigation) supported out of the box
- Integrates with the optimistic update pattern: drag triggers Zustand update immediately, API patch follows asynchronously
- Slightly more verbose API than react-beautiful-dnd but fully documented and actively maintained
