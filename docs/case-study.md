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

**Core flow:**
1. Sign up / log in via magic link — email only, no password
2. Browse collection as a searchable card list (477 pins pre-loaded from CSV at launch)
3. Tap a pin to see full detail: photo, description, location, tags, year, collection number
4. Add or edit a pin via a form: photo picker, description, location fields, year, commemorative toggle, hierarchical tag selector
5. Delete a pin with confirmation — image cleaned up, collection numbers re-sequenced

**Features shipped:**
- **Magic link auth** — email → link → app, session persists across restarts
- **Collection list** — ordered by collection number, searchable by description/city/country, swipe right to edit, swipe left to delete
- **Pin cards** — description, location (pin icon), year (calendar icon), tag chips (L1 uppercase + category icon, L2 text), commemorative ribbon icon
- **Pin detail screen** — full data including signed image URL, edit and delete in header
- **Add/edit form** — single shared form component, pre-populated on edit; image picker (gallery), char counter on description, cascade tag selection, validation
- **Hierarchical tag picker** — 11 L1 categories with icons (Ionicons + FontAwesome6), L2 subcategories. Cascade logic: selecting L2 auto-selects L1; deselecting all L2 children deselects L1
- **Image handling** — `expo-image-picker` for selection, uploaded to private Supabase Storage bucket, served via signed URLs (24h TTL). MIME + size validation before upload.
- **Collection number management** — auto-assigned as max+1 on add; Postgres RPC re-sequences on delete to keep numbers contiguous
- **Swipe gestures** — `PanResponder` with `Animated.Value` for zero-dependency swipe-to-reveal on collection cards

**Key screens:**
- [Screenshots to be added when MVP is complete]

---

## 5. Technical Challenges

**Magic link deep linking in React Native**
Supabase's `detectSessionInUrl` is web-only. In React Native, deep links must be handled manually: listen for the URL via `expo-linking`, parse the URL fragment with `URLSearchParams`, and call `supabase.auth.setSession()`. `onAuthStateChange` handles the session propagation from there.

**Hierarchical tag cascade logic**
The tag taxonomy is two-level (L1 category, L2 subcategory) with implicit dependencies: selecting an L2 implies its L1 parent is also selected; deselecting all L2 children should deselect the L1. The cascade logic lives in `PinForm.tsx` rather than the `usePinForm` hook because it requires access to the tag group structure from `useTags`. This separation keeps the hook stateless with respect to the taxonomy.

**Collection number re-sequencing on delete**
Deleting a pin leaves a gap in collection numbers (e.g. deleting #42 leaves a jump from #41 to #43). Solved with a Postgres RPC function `decrement_collection_numbers_after(p_deleted_number, p_user_id)` that updates all subsequent rows in a single DB call. Required an explicit `GRANT EXECUTE ON FUNCTION ... TO authenticated` — Supabase does not grant this by default.

**Swipe gestures coexisting with FlatList scroll**
`PanResponder`'s `onMoveShouldSetPanResponder` uses `Math.abs(dx) > 10 && Math.abs(dy) < 15` to only claim the gesture when horizontal movement is dominant. This hands vertical scroll back to `FlatList` naturally.

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
