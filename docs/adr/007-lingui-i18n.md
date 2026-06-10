# ADR-007 — react-i18next for i18n and label management

## Status

Amended — replaced Lingui with react-i18next (see context below).

## Context

The app UI is in French. All user-facing strings must live in external resource files, not in source code. The core requirement: code contains only keys, business copy is centralised in a JSON file that can be edited without touching any component.

Lingui was the original choice. It was replaced after implementation revealed a mismatch: Lingui is designed for the **message-based** workflow (source text is the key, extracted from code). Forcing it into a **key-based** workflow requires verbose explicit-ID syntax and a mandatory compile step (`lingui compile`) after every translation change. The tool works against the requirement rather than with it.

## Decision

Use **react-i18next** (`i18next` + `react-i18next`) for all UI labels and user-facing strings.

Keys in components, text in `src/locales/fr.json`:

```typescript
// In a component
const { t } = useTranslation()
t('board.column.todo')

// In a pure function
import i18n from '@/lib/i18n'
i18n.t('ticket.urgency.remaining', { count: remaining })
```

```json
// src/locales/fr.json
{
  "board": {
    "column": {
      "todo": "À faire"
    }
  }
}
```

No string is hardcoded in a component. Every label references a key. The JSON file is the single point of truth for business copy.

## Why react-i18next over Lingui

- **Key-based by design** — `t('some.key')` with no text in code, exactly matching the requirement
- **No compile step** — edit `fr.json`, reload, done
- **JSON resource files** — familiar format, editable by anyone
- **Most widely adopted** React i18n library — established patterns, extensive docs

## Key naming convention

`<domain>.<entity>.<qualifier>` — e.g. `board.column.todo`, `ticket.urgency.overdue`, `common.error.loading`

## Consequences

- All French copy lives in `client/src/locales/fr.json`
- Adding a second language requires a new `en.json` and one line in `i18n.ts` — no component changes
- i18next is initialised in `src/lib/i18n.ts` and imported once in `main.tsx`
