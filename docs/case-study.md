# Case Study: Pins Inventory

**Role:** Product Manager + Builder
**Timeline:** March 2026 → In Progress
**Stack:** React Native, Expo SDK 55, Supabase, TypeScript, NativeWind v4
**Status:** In Progress

---

## TL;DR

> [Fill this last — one paragraph summarising what this is, the problem it solves, your role, and the outcome.]

---

## 1. The Problem

> [Tell the story of why this exists. What did you observe?]

**Who has this problem:**
Pin collectors who own physical collections with no good way to catalogue them digitally. The alternative is a spreadsheet — which has no photos and no mobile-first experience.

**The pain today:**
No dedicated tool exists that is simple enough for a personal collector (not a seller, not a trader). Existing options are either marketplace-focused (eBay, Vinted) or generic (spreadsheets, Notes app).

**Why this is interesting:**
Small, well-scoped problem with a real user (me). Perfect for demonstrating end-to-end product thinking without scope creep.

---

## 2. Discovery & Research

**What I investigated:**
- Personal use: my own pain managing a growing pin collection
- Existing apps: searched App Store for "pin collection" — found marketplace apps, nothing for personal cataloguing
- Adjacent products: Discogs (vinyl), Letterboxd (films) — both show that niche collection apps have loyal users

**What I found:**
- The gap is not features — it's focus. Existing apps try to do too much (sell, trade, socialize)
- The core value is simple: photo + name + notes, searchable, on your phone
- MVP can be extremely small and still be genuinely useful

**What I decided NOT to build (and why):**
- Social/sharing features — adds auth complexity, moderation risk, scope creep. Out of MVP.
- Barcode scanning — pins don't have standard barcodes. Not applicable.
- Trading/marketplace features — different product entirely. Not this.

---

## 3. Product Decisions

> See `decisions.md` for the full log. Key decisions summarised here.

### Decision 1: Expo over React Native CLI
- **Context:** Solo project, need to move fast
- **Choice:** Expo SDK 51+
- **Rationale:** Camera, storage, and auth all handled. No custom native modules needed.
- **Trade-off accepted:** Less control over native build config

### Decision 2: Supabase over Firebase
- **Context:** Need auth, a database, and image storage
- **Choice:** Supabase
- **Rationale:** SQL + explicit RLS is cleaner for a data model I understand. Firebase's NoSQL adds complexity without benefit at this scale.
- **Trade-off accepted:** Smaller community than Firebase

---

## 4. What I Built

> [Fill as features ship]

**Core flow:**
1. Sign up / log in via magic link
2. Browse collection as a searchable card list (477 pins pre-loaded from CSV)
3. Tap a pin to see full detail: photo, description, location, tags, year, collection number
4. Add a new pin: photo, description, location, tags, year, collection number

**Key screens:**
- [To be added with screenshots]

---

## 5. Technical Challenges

> [Fill as they arise]

---

## 6. Results & Learnings

> [Fill when MVP is shipped]

**Outcomes:**
- [To be measured]

**What worked:**
- [To be filled]

**What I'd do differently:**
- [To be filled]

**What this project taught me:**
- [To be filled]

---

## 7. Links

- **Repo:** [GitHub link — TBD]
- **Live app / demo:** [TestFlight link — TBD]
- **PRDs:** `docs/` folder in this repo
