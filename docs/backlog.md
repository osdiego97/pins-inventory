# Backlog — Pins Inventory

> Future ideas and features. Not committed, not prioritised — just captured so nothing gets lost.
> When an item moves to active development, create a PRD for it.

---

## Platform

- **iOS support** — Expo already targets iOS. Requires Mac + Apple developer account for distribution. Natural follow-on after Android MVP is stable.
- **Web version** — React Native Web via Expo. No blocker — magic link auth already supports cross-device access.

## Tags

- **Add new tags from the app** — tag list is hardcoded/seeded for MVP. Allow users to create new tags from within the app in a future iteration.

## UI

- **Light mode / dark mode switch** — dark mode is the MVP default. Add an in-app toggle to switch between dark and light mode in a future iteration.
- **Collection layout toggle (list/grid)** — MVP uses a card list. Add a toggle to switch between card list and photo grid once pins have photos populated. Grid only makes sense as a secondary option — list remains the default.
- **Map view** — visualise the collection on a map showing where each pin came from, based on the city/country data already stored in the schema.

## Build Config

- **Set `cli.appVersionSource`** — EAS warns this will be required in future. Set to `"remote"` in `eas.json` to manage version increments server-side. Low priority, non-blocking.

## Auth & Sync

- **Cross-device sync** — automatic once web is live and the user logs in with the same email on a second device.

## V2 Direction — Multi-collection platform

- **Support multiple collection types** — extend the app to host collections beyond pins (e.g. thimbles, stamps, coins). This is a meaningful architectural pivot: the current schema is pins-specific (geographic fields, `is_commemorative`, tag taxonomy). Doing this right requires a flexible schema per collection type (or a generic schema with custom fields), multi-collection management per user, per-collection taxonomies, and likely a rebrand. **Do not bolt onto the MVP schema — design from scratch when the time comes.**
