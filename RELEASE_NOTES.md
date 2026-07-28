## 🏍️ What's new

Patch release — bug fixes, open source launch cleanup, and a new catalog entry.

### 🐛 Bug fixes

- **Velocity false urgency** — tickets were turning red immediately after a km update, even with 10 000+ km remaining. Two `km_history` entries recorded minutes apart (motorcycle creation + first update) produced an astronomically high km/day. Fixed by ignoring velocity windows shorter than 1 day.

### ✨ Catalog

- Added **Yamaha MT-07** (2014–2017) with full service intervals

### 📖 Docs & DX

- README: remove unshipped LLM feature, fix stack table (Zustand was not used), fix SSH clone URLs, add Yamaha to catalog structure
- ROADMAP: translated to English, published to repo, restructured (V2 = LLM diagnostics on current architecture)
- CONTRIBUTING: fix SSH clone URL
- ADR-007 renamed from `lingui` to `react-i18next`

---

