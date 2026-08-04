# ADR-013 — Visual regression testing with Chromatic Playwright

**Date:** 2026-08-04
**Status:** Accepted

## Context

As the UI grows, we needed CI to catch visual regressions automatically on every PR, with a low-friction way to review and accept intentional visual changes.

Options considered:

| Option | CI enforcement | Accept UX | Accumulation |
|---|---|---|---|
| Playwright `toHaveScreenshot` | Manual (committed files) | CLI + commit | Orphan files if tests deleted |
| Chromatic + Storybook | Automatic | Web UI in PR | None (cloud-stored) |
| **Chromatic Playwright** | **Automatic** | **Web UI in PR** | **None** |

Chromatic now supports Playwright natively without Storybook. Snapshots are stored in Chromatic's cloud — nothing committed to the repo.

## Decision

Use `@chromatic-com/playwright` for visual regression. Chromatic runs in CI on every PR, compares screenshots against the accepted baseline, and surfaces diffs as a GitHub status check.

### Workflow

**Catching a regression:**
1. Developer pushes a feature branch
2. CI runs Chromatic, detects visual diff
3. GitHub PR shows a failing Chromatic check
4. Developer opens the Chromatic UI, reviews the diff
5. If unintentional → fix the code, push again
6. If intentional → click "Accept" in Chromatic UI → check passes

**Accepting a redesign:**
Same as above — click Accept in the Chromatic web UI. No local commands, no file commits.

**No accumulation:**
Chromatic stores baselines in its cloud. When a test is deleted, its baseline expires automatically. Nothing accumulates in the repo.

### Covered pages

| Page | Snapshot name |
|---|---|
| Garage | `Garage` |
| Board | `Board` |
| History | `History` |
| Reference | `Reference` |

**Excluded:** HomePage — Three.js AsciiEffect animates every frame; no stable screenshot is possible.

### Setup required

1. Create a project at [chromatic.com](https://www.chromatic.com) linked to the GitHub repo
2. Add the project token as a GitHub Actions secret: `CHROMATIC_PROJECT_TOKEN`
3. In Chromatic project settings, add the CI check as a required status check in branch protection

### Rule for new pages

Every new `<Route>` added in `App.tsx` must include a matching `takeSnapshot` call in `client/e2e/visual.spec.ts`. Pages driven by canvas or JS animation are excluded with a comment.

## Consequences

- Chromatic is a SaaS dependency. Free for open source projects.
- `fetch-depth: 0` required in CI checkout so Chromatic can read the full git history for baseline comparison.
- No snapshot files in the repo — baselines live in Chromatic's cloud.
