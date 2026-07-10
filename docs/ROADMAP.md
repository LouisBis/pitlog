# Pitlog — Roadmap

> Product impact first, technical complexity second.
> Features are independent — order can change.

---

## V1.2 — Depth (medium term)

### Import history

Recover an existing maintenance history from CSV or JSON (migration from paper / Excel / another app).

- Configurable column mapping: date, operation, km, cost
- Zod validation before insert
- Preview before import (summary table + detected errors)

---

### Photos on tickets

Attach photos to a ticket: worn part, receipt, odometer reading.

- Storage: base64 in SQLite to start (MVP), S3 for multi-user V2
- Thumbnail display in the parts journal and history

---

### Themes per motorcycle

Each motorcycle has an accent color. The kanban changes tint when switching bikes.

- Honda → red, Yamaha → blue, custom → user-chosen color
- CSS custom property `--brand-accent` already used everywhere — just needs to be overridden per motorcycle

---

## V2 — LLM Diagnostics

NLP chat for diagnostic assistance. Runs on the existing single-user architecture.

- Text input: "metallic noise on acceleration, engine warm"
- Motorcycle context injected automatically into the prompt (brand, model, km, recent history)
- Voice input via Web Speech API
- Ollama (llama3.2) response streamed from VPS
- Response displayed with suggested tickets to create ("Check the timing chain?")

**Stack:** Ollama on VPS, SSE streaming, dedicated chat component

---

## Backlog / ideas to qualify

- **Odometer milestones** — alert at 10k, 25k, 50k km (special badge, milestone in history)
- **Admin reminders** — MOT, insurance, tax disc (not just mechanical)
- **Public API** — for future integrations (OBD2 readers, dealer systems)
- **Dark / light mode** — theme toggle (DS tokens already structured for this)

---

## Out of scope

- Full E2E tests (Playwright) — to be added alongside features, not a separate milestone
- Multi-language i18n — the i18n architecture is in place, translated content is out of scope
- Monetisation — no subscription, no freemium planned
