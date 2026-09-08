# 🏍️ What's new

Photos on tickets — attach a photo to a completed ticket, view it full-size, replace or delete it.

## ✨ Features

- **Photo on done tickets** — once a ticket is marked done, attach a photo (worn part, receipt, odometer reading). Resized and compressed on-device before upload.
- **Full-size viewer** — click the photo indicator on the card to view it full-size, with replace/delete actions right there.
- **Shown in maintenance history too** — photos also appear next to their ticket on the history page.

## 🔧 DX & CI

- **Client typecheck job fixed** — `typecheck-client` was silently a no-op (`tsc --noEmit` never actually checked anything against this client's project-references config); it now catches real type errors.
- **First component-testing infrastructure in the client** — Testing Library + jsdom, wired into the existing MSW setup.

---
