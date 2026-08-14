## 🏍️ What's new

Reference page redesign — catalog restructured into mechanical categories with collapsible sections, grouped torque specs, and category icons.

### ✨ Features

- **Mechanical categories** — catalog intervals are now organized into 7 categories: Engine, Cooling, Fuel, Transmission, Brakes, Chassis, Tires. All 4 catalog motorcycles migrated.
- **Collapsible category sections** — reference page uses native `<details>/<summary>` accordion, open by default and toggleable. Zero JS overhead.
- **Torque specs by category** — torque specifications are grouped under their respective mechanical category instead of a flat list.
- **Category icons** — each section header displays a Phosphor icon (Engine, ThermometerSimple, GasCan, GearSix, Disc, Motorcycle, Tire).

### 🔧 DX & CI

- Visual regression testing with Chromatic — Playwright snapshots uploaded on every PR, auto-accepted on `dev`/`main`
- CI now triggers on push to `dev`/`main` in addition to pull requests (Chromatic baseline bootstrap)
- `validate-catalog` updated for the new categories schema
- Dependabot PRs grouped by ecosystem (react, vite, testing, types, server-deps)
- Dependabot security alerts enabled on the repository

---
