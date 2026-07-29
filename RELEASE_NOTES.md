## 🏍️ What's new

Patch release — i18n fix, release automation, and CI improvements.

### ✨ Features

- **Translated operation names** — catalog ticket cards and history page now display operation names in French (`Vidange huile moteur`, `Remplacement bougies`, etc.) instead of the raw English strings from the database. User-created tickets are unaffected.

### 🔧 DX & CI

- Release automation: GitHub release created automatically on every merge to `main`
- Dependabot redirected to `dev` instead of `main`
- Fix two TS type errors blocking the deploy build
- Fix smoke test asserting on the now-translated operation label

---

