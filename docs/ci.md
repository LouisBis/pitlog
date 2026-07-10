# CI — Continuous Integration

## Overview

The pipeline runs on GitHub Actions and covers three concerns: **code quality**, **security**, and **dependency hygiene**. It is split across two workflow files and one Dependabot configuration.

| File | Trigger | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | Every PR targeting `dev` or `main` | Quality gates |
| `.github/workflows/codeql.yml` | PR, push to `main`/`dev`, weekly | Security scanning |
| `.github/dependabot.yml` | Weekly (Monday) | Dependency updates |

---

## ci.yml — Quality gates

Runs on every pull request. All jobs run in parallel.

### lint-client
ESLint on the React codebase. Fails on any rule violation.

### typecheck-client / typecheck-server
`tsc --noEmit` on both packages. Catches type errors without producing output files.

### test-client / test-server
Vitest test suites for the React client and Express server respectively.

### docker-health
Builds the full Docker stack (`docker compose up --build`) and polls `GET /health` until the server responds or times out at 60 seconds. The only job that validates the full integration between client, server, and database.

### build-pages
Runs only on PRs targeting `main`. Builds the client with `VITE_USE_MOCKS=true` for GitHub Pages, then runs the Playwright smoke suite against the static output.

### branch-policy
Runs only on PRs targeting `main`. Rejects the merge if the source branch is not `dev`, enforcing the `dev → main` release flow.

---

## npm cache

Every job that calls `npm ci` uses `actions/setup-node` with `cache: 'npm'` and an explicit `cache-dependency-path` pointing to the relevant lockfile (`client/package-lock.json` or `server/package-lock.json`). This avoids re-downloading the full dependency tree on every run — subsequent runs restore from cache in a few seconds instead of ~30s per job.

---

## codeql.yml — Security scanning

CodeQL performs static analysis on the JavaScript/TypeScript source, looking for injection flaws, XSS vectors, and other OWASP-class vulnerabilities. Results appear in **Security → Code scanning** on GitHub.

Runs on:
- Every PR targeting `main` or `dev`
- Every push to `main` or `dev`
- Every Monday at 06:00 UTC (scheduled scan)

The weekly schedule catches vulnerabilities disclosed in existing dependencies without requiring a new commit to trigger the scan.

---

## dependabot.yml — Dependency hygiene

Dependabot opens automated PRs every Monday for outdated or patched packages. The CI pipeline runs against each Dependabot PR — a green run is a safe signal to merge.

| Ecosystem | Directory | Covers |
|---|---|---|
| npm | `/client` | React, Vite, shadcn/ui, dnd-kit, etc. |
| npm | `/server` | Express, Drizzle, Pino, Vitest, etc. |
| github-actions | `/` | `actions/checkout`, `actions/setup-node`, CodeQL actions |

The `open-pull-requests-limit: 5` cap per ecosystem prevents noise when many packages update simultaneously.
