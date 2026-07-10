# ADR-012 — Framer Motion for in-app animations

## Context

The app needs three categories of animation:
- Elements entering/leaving the DOM (ticket regeneration, empty states appearing)
- Staggered list entrances (moto cards, ticket columns on load)
- Microinteractions (done confirmation, form transitions)

## Decision

Use **Framer Motion** for animations that require DOM lifecycle awareness (`AnimatePresence`) or spring physics. Use plain CSS transitions for simple hover/focus states.

## Why not the alternatives

**CSS only** — cannot animate elements *leaving* the DOM. A ticket regenerating (old one done, new one appears) cannot be expressed in CSS alone. `@starting-style` exists but Safari support is incomplete as of 2026.

**React Spring** — same physics approach, but less active maintenance and a less intuitive API for layout animations. No meaningful advantage over Framer Motion here.

**GSAP** — the agency standard for complex sequences. Overkill for this scope, and the pro licence is required for commercial use. Not React-native.

**Motion One** — lighter (same author), but no `AnimatePresence` equivalent. Ruled out for the same reason as CSS only.

## Consequences

- `AnimatePresence` wraps lists where elements enter/exit (ticket cards, moto cards)
- `motion.div` replaces plain `div` only where animation is needed — no blanket wrapping
- CSS handles hover, focus, and simple transitions — Framer Motion is not a replacement for CSS
- Bundle cost: ~45kb gzipped, acceptable for this scope
