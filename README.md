# Pins Inventory

A mobile app to catalogue a personal pin collection with photos, built with React Native + Expo + Supabase.

**Status:** MVP complete — map feature in review

---

## What it does

Simple, focused tool for pin collectors who want to:
- Add pins with a photo, description, location, tags, and year
- Browse their collection as a searchable, filterable card list ordered by collection number (filter by category, subcategory, country, city, and year with full faceted search)
- Tap any pin to see full details including photo
- Explore collection analytics — totals, category breakdown, countries, year trends, cumulative growth, and data completeness
- See pins plotted on a world map with proximity clustering, location search on add/edit, and map previews on pin detail
- Keep everything private and tied to their account

No marketplace features. No social layer. Just a clean digital catalogue.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 55 |
| Navigation | Expo Router v3 |
| Backend | Supabase (auth, database, storage) |
| Language | TypeScript (strict) |
| Styling | NativeWind v4 (Tailwind CSS) |

---

## Product docs

| Document | Description |
|----------|-------------|
| [`docs/case-study.md`](docs/case-study.md) | Full PM case study — problem, decisions, outcomes |
| [`docs/decisions.md`](docs/decisions.md) | Decision log with rationale for key choices |
| [`docs/architecture-rules.md`](docs/architecture-rules.md) | Architecture decisions and code conventions |
| [`docs/security-rules.md`](docs/security-rules.md) | Security constraints applied to all code |

---

## Running locally

> Setup instructions to be added when MVP is complete.

---

## About

Built by Oscar as a personal project and PM portfolio piece. See the [case study](docs/case-study.md) for the full product story.
