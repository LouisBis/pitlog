# Pitlog

> Motorcycle maintenance logbook — predictive alerts, kanban board, LLM-assisted diagnostics.

[![CI](https://github.com/LouisBis/pitlog/actions/workflows/ci.yml/badge.svg)](https://github.com/LouisBis/pitlog/actions/workflows/ci.yml)
[![Deploy](https://github.com/LouisBis/pitlog/actions/workflows/deploy.yml/badge.svg)](https://github.com/LouisBis/pitlog/actions/workflows/deploy.yml)
[![Live demo](https://img.shields.io/badge/Live_demo-GitHub_Pages-222?logo=github&logoColor=white)](https://louisbis.github.io/pitlog/)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

## Concept

Pitlog is a mobile-first PWA that turns your maintenance schedule into an actionable kanban board. Tickets are color-coded by urgency based on mileage and time, regenerate automatically when completed, and predict when your next service is due based on your riding velocity.

Service intervals and torque specs for recognised models are stored in versioned JSON files under `catalog/` — no hardcoded data in the database.

## Modules

### **Module 1 — Maintenance Kanban (core)**

- Multi-motorcycle garage — add any bike by brand / model / year
- **Community catalog**: recognised models auto-seed tickets from service intervals defined in versioned JSON files (`catalog/<brand>/<model-year>.json`); unrecognised models fall back to a `generic-standard` catalog template
- Board with columns: `To do` / `Part ordered` / `In progress` / `Done`
- Tickets color-coded by urgency: 🔴 ≤ 200 km or ≤ 14 days / 🟠 ≤ 500 km or ≤ 30 days / 🟢 otherwise
- Predictive mileage: estimates due dates based on your riding velocity (sliding window km/day)
- Auto-regeneration: completing a ticket creates the next one automatically
- Drag & drop between columns
- **Reference page** (`/board/:id/reference`): catalog intervals and torque specs for the current motorcycle
- **Contextual torque hints**: relevant torque values shown inline on ticket cards

### **Module 2 — LLM Diagnostics (Phase 3)**

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
        text catalog_slug
    }
    custom_intervals {
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
    interval_overrides {
        int id PK
        int user_motorcycle_id FK
        text catalog_slug
        text interval_slug
        int custom_km
        int custom_days
    }
    tickets {
        int id PK
        int user_motorcycle_id FK
        text catalog_slug
        text interval_slug
        int custom_interval_id FK
        text operation
        text status
        int target_km
        int target_date
        int done_km
        int done_at
    }
    ticket_parts {
        int id PK
        int ticket_id FK
        text name
        text brand
        text reference
        int quantity
        text url
    }

    motorcycles ||--o{ custom_intervals : "defines custom"
    motorcycles ||--o{ user_motorcycles : "referenced by"
    user_motorcycles ||--o{ km_history : "tracks"
    user_motorcycles ||--o{ tickets : "has"
    user_motorcycles ||--o{ interval_overrides : "overrides"
    custom_intervals |o--o{ tickets : "tracks"
    tickets ||--o{ ticket_parts : "has"
```

Catalog intervals and torque specs are stored in `catalog/<brand>/<slug>.json` and loaded at runtime — they are not written to the database.

## Architecture

The client and server are fully decoupled — the React SPA communicates with the Express API over REST, and can run standalone via MSW for the GitHub Pages demo.

A few deliberate choices worth noting:

- **SQLite over PostgreSQL** — single-user app, zero ops overhead, file-based persistence via a Docker volume. [ADR-002](docs/adr/002-sqlite-vs-postgres.md)
- **TanStack Query** — owns server state, cache invalidation, and optimistic updates (drag & drop). No separate UI state store needed. [ADR-003](docs/adr/003-state-management.md)
- **Sliding window velocity** — km/day is computed over the last 10 odometer entries, not lifetime average. Recent riding behavior predicts near-term due dates better. [ADR-005](docs/adr/005-predictive-velocity.md)
- **Versioned JSON catalog** — service intervals and torque specs live in `catalog/` as plain JSON files, versioned with the code. Adding a new model is a PR, not a database migration. The server loads them at startup via `CATALOG_PATH`; user overrides are stored in `interval_overrides`.
- **MSW for the demo** — no backend on GitHub Pages. MSW intercepts fetch calls at the service worker level and returns realistic stateful mock data. [docs/adr/](docs/adr/)

Full decision log: [docs/adr/](docs/adr/) (ADR-001 to ADR-011)

## Stack

| Layer           | Tool                              |
| --------------- | --------------------------------- |
| Frontend        | React 19 + TypeScript, Vite       |
| State           | Zustand + TanStack Query          |
| i18n            | react-i18next                     |
| Drag & drop     | dnd-kit                           |
| Backend         | Express 5 + Node.js               |
| Database        | SQLite + Drizzle ORM              |
| Logging         | loglevel (client) + Pino (server) |
| Mocks           | MSW                               |
| Dev environment | Docker                            |

## Structure

```text
pitlog/
  catalog/    # Versioned JSON catalog (intervals + torque specs per model)
    suzuki/
    honda/
    kawasaki/
    generic/
  client/     # React + TypeScript
  server/     # Express + Node.js
  docs/
    adr/      # Architecture Decision Records (ADR-001 to ADR-011)
```

## Getting started

**Requirements**: Docker + Docker Compose.

```bash
git clone git@github.com:LouisBis/pitlog.git
cd pitlog
./dev.sh
```

The script opens an interactive menu. To start the full stack:

```text
1) Start   →  docker compose up -d
```

| URL | Service |
| --- | ------- |
| [localhost:5173](http://localhost:5173) | React client |
| [localhost:3001](http://localhost:3001) | Express API |
| [localhost:3001/health](http://localhost:3001/health) | Health check |

To run server tests, use option `7` from the menu.

---

_Pitlog — "Journal de bord de tes révisions"_
