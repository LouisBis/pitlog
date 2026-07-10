# Contributing to Pitlog

Pitlog is open source. The most impactful way to contribute is by **adding or enriching motorcycles in the community catalog** — no Node.js or Docker knowledge required, just a service manual and a text editor.

Code contributions are also welcome. See [Code contributions](#code-contributions) below.

---

## Catalog contributions

The catalog lives in `catalog/<brand>/<slug>.json`. Each file covers a model for a specific production range and contains service intervals and torque specs sourced from the official service manual.

### Adding a new motorcycle

1. Create a JSON file at `catalog/<brand>/<brand>-<model>-<year_start>-<year_end>.json`
2. Follow the schema below
3. Open a PR — title: `feat(catalog): add <Brand> <Model> <year_start>-<year_end>`

If the brand directory does not exist yet, create it (lowercase, no spaces: `honda`, `kawasaki`, `yamaha`…).

### File schema

```json
{
  "slug": "brand-model-yearstart-yearend",
  "brand": "Brand",
  "model": "Model Name",
  "year_start": 1995,
  "year_end": 1999,
  "intervals": [
    {
      "slug": "oil-change",
      "operation": "Engine oil change",
      "km": 6000,
      "days": 365
    }
  ],
  "torque_specs": [
    {
      "slug": "spark-plug",
      "component": "Spark plug",
      "nm": 11,
      "note": null,
      "related_intervals": ["spark-plugs-replacement"]
    }
  ],
  "bolt_torque_chart": [
    { "diameter_mm": 6, "conventional_nm": 6, "grade7_nm": 10 }
  ]
}
```

### Field reference

#### Top level

| Field | Type | Description |
| --- | --- | --- |
| `slug` | `string` | Unique identifier. Format: `brand-model-yearstart-yearend` |
| `brand` | `string` | Display brand name (e.g. `"Suzuki"`) |
| `model` | `string` | Display model name (e.g. `"GSF 600 Bandit"`) |
| `year_start` | `number` | First production year covered by this file |
| `year_end` | `number \| null` | Last production year (`null` if still in production) |
| `intervals` | `array` | Service intervals (see below) |
| `torque_specs` | `array` | Torque specifications (see below) |
| `bolt_torque_chart` | `array` | Optional generic torque reference table by bolt diameter |

#### `intervals` items

| Field | Type | Description |
| --- | --- | --- |
| `slug` | `string` | Unique within the file. Use kebab-case |
| `operation` | `string` | English description (e.g. `"Engine oil change"`) |
| `km` | `number \| null` | Recurrence in km (`null` if time-only) |
| `days` | `number \| null` | Recurrence in days (`null` if km-only) |

#### `torque_specs` items

| Field | Type | Description |
| --- | --- | --- |
| `slug` | `string` | Unique within the file. Use kebab-case |
| `component` | `string` | English component name from the service manual |
| `nm` | `number` | Torque value in N·m. Use final value for multi-step tightening |
| `note` | `string \| null` | Optional clarification (e.g. `"Front & Rear"`, `"M10"`, `"Initial: 20 N·m, Final: 35 N·m"`) |
| `related_intervals` | `string[]` | Slugs of intervals this torque spec applies to |

#### `bolt_torque_chart` items (optional)

| Field | Type | Description |
| --- | --- | --- |
| `diameter_mm` | `number` | Bolt diameter in mm |
| `conventional_nm` | `number` | Standard bolt torque in N·m |
| `grade7_nm` | `number` | Grade 7 bolt torque in N·m |

### Slug conventions

- Top-level slug: `brand-model-yearstart-yearend` — all lowercase, hyphens only
  - Examples: `suzuki-gsf600-bandit-1995-1999`, `honda-cb500-1994-2001`
- Interval and torque spec slugs: kebab-case, English, descriptive
  - Examples: `oil-change`, `spark-plug`, `rear-axle-nut`

### Data quality rules

- **Source from the official service manual** — do not invent or estimate values
- **One file per generation** — if torque specs changed significantly between years, create a separate file with a different range
- **`year_end: null`** for models still in production
- **English only** — `operation` and `component` fields are English; translations are handled at the app layer

### Enriching an existing file

If a motorcycle is already in the catalog but missing intervals or torque specs, open the existing JSON file, add the missing data, and open a PR — title: `feat(catalog): enrich <Brand> <Model> <year_start>-<year_end> with <what>`.

---

## Code contributions

### Setup

Requirements: **Docker** and **Docker Compose** only.

```bash
git clone https://github.com/LouisBis/pitlog.git
cd pitlog
./dev.sh   # interactive menu — option 1 to start the full stack
```

### Branch and commit conventions

- Branch from `dev`, PR → `dev`
- Branch naming: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`
- Commit format: `<emoji> <type>(<scope>): <short description>` — see existing commits for examples

### Tests

Every new server route or React component must ship with tests. Run them via option `7` in `./dev.sh`.

### Before opening a PR

- [ ] Server tests pass
- [ ] New catalog files validate against the schema (CI checks this automatically)
- [ ] No hardcoded user-facing strings — use i18n keys

---

## Reporting issues

Use GitHub Issues. For catalog errors (wrong torque value, wrong interval), please cite the source (service manual edition and page number if possible).
