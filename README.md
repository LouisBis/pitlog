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

## Data model

```mermaid
erDiagram
    motorcycles {
        int id PK
        text brand
        text model
        int year
        bool is_custom
    }
    intervals {
        int id PK
        int motorcycle_id FK
        text operation
        int interval_km
        int interval_days
    }
    user_motorcycles {
        int id PK
        int motorcycle_id FK
        int current_km
        int acquired_at
    }
    km_history {
        int id PK
        int user_motorcycle_id FK
        int km
        int recorded_at
    }
    tickets {
        int id PK
        int user_motorcycle_id FK
        int interval_id FK
        text operation
        text status
        int target_km
        int target_date
        int done_km
        int done_at
    }

    motorcycles ||--o{ intervals : "defines"
    motorcycles ||--o{ user_motorcycles : "referenced by"
    user_motorcycles ||--o{ km_history : "tracks"
    user_motorcycles ||--o{ tickets : "has"
    intervals |o--o{ tickets : "generates"
```

## Stack

| Layer | Tool |
| --- | --- |
| Frontend | React 19 + TypeScript, Vite |
| State | Zustand + TanStack Query |
| i18n | Lingui |
| Drag & drop | dnd-kit |
| Backend | Express 5 + Node.js |
| Database | SQLite + Drizzle ORM |
| Logging | loglevel (client) + Pino (server) |
| Mocks | MSW |
| Dev environment | Docker |

## Structure

```text
pitlog/
  client/     # React + TypeScript
  server/     # Express + Node.js
  docs/
    adr/      # Architecture Decision Records (ADR-001 to ADR-009)
```

## Getting started

```bash
docker compose up --build
```

---

*Pitlog — "Journal de bord de tes révisions"*
