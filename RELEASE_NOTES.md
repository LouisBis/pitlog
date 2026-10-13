# 🏍️ What's new

Import/export maintenance history — recover an existing maintenance log from CSV or JSON, and export it back out.

## ✨ Features

- **Import from CSV or JSON** — upload a spreadsheet export (date, operation, km) or a Pitlog JSON backup; flexible column mapping with auto-detected headers.
- **Auto-matching to recurring intervals** — imported rows are automatically matched to a motorcycle's known catalog or custom intervals by operation name, with manual override before committing.
- **Smart regeneration** — importing several past occurrences of the same recurring interval regenerates exactly one upcoming ticket, computed from the most recent occurrence.
- **Export to CSV or JSON** — download a motorcycle's full maintenance history; the JSON export round-trips natively back through the same import, no mapping needed.
- **Preview before import** — a summary table shows what will be imported and flags any row that couldn't be parsed, before anything is written.

## 🔧 DX & CI

- **Dependabot security updates now land on `dev`** — they were silently targeting `main` directly (GitHub always routes security-alert PRs to the repo's default branch, ignoring `dependabot.yml`'s `target-branch`), bypassing the usual review pipeline. Switched the repo's default branch to `dev` so they now follow the same path as everything else.
- **Docs audit** — README, CONTRIBUTING, the CI docs, and a couple of ADRs had drifted from what the code actually does (stale table names, an outdated catalog schema, undocumented CI jobs); brought back in sync.

---
