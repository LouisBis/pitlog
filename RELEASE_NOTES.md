# 🔒 What's new

Security and CI maintenance release — Chromatic visual regression fully operational, two high-severity server vulnerabilities patched.

## 🔒 Security

- **drizzle-orm 0.45.2** — fixes SQL injection via improperly escaped SQL identifiers (GHSA-gpj5-g38j-94v9, high)
- **form-data** — CRLF injection in multipart field names patched via `npm audit fix`

## 🔧 DX & CI

- **Chromatic re-enabled** — root cause of the Reference page black screen identified (react/react-dom version mismatch in lockfile); visual regression is now fully operational
- **Dependabot groups expanded** — new `linting` group (eslint, typescript-eslint, prettier) and `server-devdeps` group; `react-ecosystem` now includes framer-motion, i18next, @radix-ui
- **vitest 4** in server — test runner upgraded from 3.x, 72 tests passing

## 📦 Dependencies

- @tanstack/react-query, framer-motion, react-i18next, i18next, @radix-ui/react-switch, vite group, testing group, types group, server-deps group — routine bumps

---
