# ADR-007 — Lingui for i18n and label management

## Context

The app UI is in French. Rather than hardcoding strings directly in components, we use a key-based i18n system from the start. This enforces a clean separation between UI logic and copy, makes future language additions trivial, and avoids scattered string literals across the codebase.

## Decision

Use **Lingui** (`@lingui/react` + `@lingui/macro`) for all UI labels and user-facing strings.

No string is hardcoded in a component. Every label goes through a Lingui key:

```tsx
import { t } from '@lingui/macro'

<button>{t`ticket.action.markDone`}</button>
```

## Why not react-i18next

**react-i18next** is the most widely used option and a safe choice. Lingui is preferred here because:

- Compile-time extraction: unused keys are caught at build time, not at runtime
- Better TypeScript integration — keys are typed, no string typos at runtime
- Cleaner macro syntax vs `t('key')` string calls
- Smaller runtime bundle

## Consequences

- All French copy lives in `client/src/locales/fr.po`
- Adding a second language requires only a new `.po` file — no component changes
- Lingui CLI extracts keys automatically from source: `lingui extract`
- Slight learning curve vs react-i18next, but the pattern is simpler once set up
- Key naming convention: `<domain>.<entity>.<action>` — e.g. `ticket.status.done`, `board.column.inProgress`
