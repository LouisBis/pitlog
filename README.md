# Pitlog

> Motorcycle maintenance logbook — predictive alerts, kanban board, LLM-assisted diagnostics.

## Concept

Pitlog is a mobile-first PWA that turns your maintenance schedule into an actionable kanban board. Tickets are color-coded by urgency based on mileage and time, regenerate automatically when completed, and predict when your next service is due based on your riding velocity.

## Modules

**Module 1 — Maintenance Kanban (core)**
- Board with columns: `To do` / `In progress` / `Part ordered` / `Done`
- Tickets color-coded by urgency: 🔴 < 200km or < 30d / 🟠 < 500km or < 90d / 🟢 > 500km
- Predictive mileage: estimates due dates based on your riding velocity
- Auto-regeneration: completing a ticket creates the next one automatically
- Drag & drop + mobile swipe

**Module 2 — LLM Diagnostics (Phase 3)**
- Natural language chat: "metallic noise on acceleration"
- Voice input via Web Speech API
- Motorcycle context injected automatically into the prompt
- Local LLM via Ollama (llama3.2) on VPS, streamed response

## Stack

| Layer | Tool |
|---|---|
| Frontend | React + TypeScript |
| Backend | Express (Node.js) |
| Database | SQLite |
| State | Zustand |
| Drag & drop | dnd-kit |
| LLM | Ollama (llama3.2) |

## Structure

```
pitlog/
  client/     # React + TypeScript
  server/     # Express + Node.js
  docs/
    adr/      # Architecture Decision Records
    JOURNAL.md
    ENTRETIEN.md
```

## Getting started

```bash
# Client
cd client && npm install && npm run dev

# Server
cd server && npm install && npm run dev
```

---

*Pitlog — "Journal de bord de tes révisions"*
