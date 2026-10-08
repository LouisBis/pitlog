# CI — Continuous Integration

## Overview

The pipeline runs on GitHub Actions and covers four concerns: **code quality**, **security**, **release automation**, and **dependency hygiene**. It is split across four workflow files and one Dependabot configuration.

| File | Trigger | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | PR and push to `dev`/`main`, manual dispatch | Quality gates |
| `.github/workflows/codeql.yml` | PR, push to `main`/`dev`, weekly | Security scanning |
| `.github/workflows/deploy.yml` | Push to `main` | GitHub Pages deploy |
| `.github/workflows/release.yml` | Push to `main` | GitHub release from `RELEASE_NOTES.md` |
| `.github/dependabot.yml` | Weekly (Monday) | Dependency updates |

---

## ci.yml — Quality gates

Triggers on every PR to `dev`/`main`, every push to `dev`/`main`, and manual dispatch. All jobs run in parallel.

### lint-client
ESLint on the React codebase. Fails on any rule violation.

### typecheck-client / typecheck-server
`tsc --noEmit` on both packages. Catches type errors without producing output files. The client's root `tsconfig.json` is a project-references shell (`"files": []`, only `references`) — a bare `tsc --noEmit` there checks nothing, so `typecheck-client` targets the app project directly: `tsc --noEmit -p tsconfig.app.json`.

### test-client / test-server
Vitest test suites for the React client and Express server respectively.

### validate-catalog
Runs `scripts/validate-catalog.mjs` against every file under `catalog/` — checks the schema (`categories[].intervals`, `torque_specs[].category`, cross-references in `related_intervals`) documented in [CONTRIBUTING.md](../CONTRIBUTING.md). Catches a malformed catalog contribution before merge, independent of the app's own test suite.

### docker-health
Builds the full Docker stack (`docker compose up --build`) and polls `GET /health` until the server responds or times out at 60 seconds. The only job that validates the full integration between client, server, and database.

### build-pages
Runs on PRs targeting `main` **or** `dev`. Builds the client with `VITE_USE_MOCKS=true` for GitHub Pages, then runs the Playwright smoke suite (`e2e/smoke.spec.ts`) against the static output.

### chromatic
Visual regression via Playwright + Chromatic ([ADR-013](adr/013-visual-regression-chromatic.md)). Builds the client, captures snapshots with `e2e/visual.spec.ts`, uploads them to Chromatic. Auto-accepts as the new baseline on `dev`/`main`; on a feature branch a visual diff fails the job and requires review in the Chromatic UI. Skipped for Dependabot PRs — GitHub withholds repo secrets (including `CHROMATIC_PROJECT_TOKEN`) from workflow runs they trigger. Marked `continue-on-error: true` so a pending visual review doesn't block merge.

### check-version-tag
Runs only on PRs targeting `main`. Fails if `client/package.json`'s version is already tagged on the remote — forces a version bump before a `dev → main` release PR can merge.

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

## deploy.yml — GitHub Pages deploy

On every push to `main`, builds the client with `VITE_USE_MOCKS=true` (no backend on GitHub Pages — MSW serves realistic mock data, see [README.md](../README.md#architecture)) and publishes `client/dist` to GitHub Pages. This is what serves the [live demo](https://louisbis.github.io/pitlog/).

---

## release.yml — GitHub release automation

On every push to `main`, reads the version and release name from `client/package.json`, checks whether a `v<version>` tag already exists, and if not, creates a GitHub release tagged `v<version>` with `RELEASE_NOTES.md` as the release body. This is why `RELEASE_NOTES.md` must describe the version currently being released, not the next one in progress — it's read verbatim at release time.

---

## dependabot.yml — Dependency hygiene

Dependabot opens automated PRs every Monday for outdated or patched packages. The CI pipeline runs against each Dependabot PR — a green run is a safe signal to merge (except the `chromatic` job, which Dependabot PRs can't run — see above).

| Ecosystem | Directory | Covers | PR cap |
|---|---|---|---|
| npm | `/client` | React, Vite, shadcn/ui, dnd-kit, etc. | 10 |
| npm | `/server` | Express, Drizzle, Pino, Vitest, etc. | 5 |
| github-actions | `/` | `actions/checkout`, `actions/setup-node`, CodeQL actions | 5 |

Each ecosystem groups related packages into a single PR (e.g. `react-ecosystem`, `testing`, `linting` for the client; `server-deps`, `server-devdeps` for the server) to reduce noise — see `.github/dependabot.yml` for the exact grouping patterns. The `open-pull-requests-limit` cap is per ecosystem, not global, and differs between client (10) and server/github-actions (5).
