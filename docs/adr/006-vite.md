# ADR-006 — Vite as the React build tool

## Context

The client is a React + TypeScript SPA. We need a build tool that provides fast dev feedback (HMR), TypeScript support, and a production-optimized output. The project has a separate Express backend, so a full-stack framework is not appropriate.

## Decision

Use **Vite** as the build tool for the React client.

## Why not the alternatives

**Create React App** — officially unmaintained since 2023. Not a viable choice.

**Next.js / Remix** — full-stack frameworks that would conflict with the existing Express backend. SSR is not a requirement for a PWA with a local API.

**Parcel** — zero-config but smaller ecosystem and less tooling than Vite.

**Turbopack / Rspack** — promising but either tied to Next.js or relevant only for Webpack migrations. No benefit here.

## Consequences

- Dev server starts in milliseconds via esbuild
- HMR works seamlessly inside Docker with volume mounts
- Production build via Rollup — output is a static bundle deployable to GitHub Pages
- TypeScript, path aliases, and env variables (`VITE_*`) supported out of the box
- `VITE_USE_MOCKS=true` flag activates MSW for the GitHub Pages demo build
