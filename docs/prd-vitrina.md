# PRD: Vitrina — Generic Collectibles Platform

**Status:** Approved
**Author:** Oscar
**Date:** 2026-04-03
**Version:** 1.0

---

## 1. Problem Statement

- **User pain:** Collectors of any kind of physical object — pins, thimbles, figurines, stamps, coins — have no dedicated mobile tool to catalogue their collection. The options are spreadsheets (no photos, not mobile-first) or generic inventory apps that don't understand the mental model of a collector (categories, acquisition year, provenance).
- **Current workaround:** Spreadsheets (e.g. Notion exports). Functional for data entry; useless for browsing, photos, or discovery.
- **Why this matters:** Vitrina v1 (pins-inventory) solved this for a single user with a fixed category vocabulary. The constraint that blocks any second user is the hardcoded taxonomy — it only makes sense for a pin collection. Unlocking Vitrina for any collector requires making the category system user-owned.

---

## 2. Goals

| Goal | Metric | Target |
|------|--------|--------|
| Enable any collector to use the app | New user can complete onboarding and add first item | Full flow works end-to-end on Android |
| User-defined taxonomy | User can create, edit, and delete their own L1/L2 categories | All CRUD operations functional |
| Preserve existing feature quality | Existing Oscar user retains all functionality | Zero regression on existing features |
| Generic item schema | Items can carry `material` and `color` in addition to existing fields | Both fields editable on add/edit form |

**Out of scope:**
- Multiple collections per user (v2)
- iOS and web (v2)
- Social features, sharing, or public profiles
- Cross-user discovery or browsing
- Custom fields beyond `material` and `color`
- In-app photo cropping or editing
- Offline mode with sync

---

## 3. User Stories

### 3.1 Open Registration

```
As a new collector,
I want to create an account using just my email,
So that I can start cataloguing my collection without a password.
```

**Acceptance criteria:**
- [ ] Any email address can register — `shouldCreateUser: true` in Supabase auth config
- [ ] User receives a magic link email and is logged in on tap
- [ ] On first login, user is routed to the Onboarding screen instead of the collection
- [ ] On returning login, user is routed directly to the collection (session persists)
- [ ] If the magic link has expired, the app shows an error and allows resending

---

### 3.2 Onboarding — Collection Setup

```
As a first-time user,
I want to name my collection and set up my initial categories,
So that the app feels like mine from the first session.
```

**Acceptance criteria:**
- [ ] Onboarding screen appears only on first login (dismissed permanently once completed)
- [ ] User can enter a collection name (required, max 50 chars)
- [ ] User can select a collection icon from a predefined icon set (optional — defaults to a generic box icon)
- [ ] Onboarding completion creates a `user_settings` row — no categories created by default
- [ ] User is informed they can set up categories from Settings after onboarding
- [ ] On complete, user is routed to the collection list

---

### 3.3 Category Management

```
As a collector,
I want to manage my category taxonomy after onboarding,
So that I can refine my organisation as my collection grows.
```

**Acceptance criteria:**
- [ ] A "Categorías" settings screen is accessible from the app (e.g. profile/settings menu)
- [ ] User can view all their L1 categories (with icons) and their associated L2 subcategories, plus any standalone L2 tags (no parent)
- [ ] User can create a new L1 category — name required, icon required (picker from `@expo/vector-icons`)
- [ ] User can create a new L2 tag — name required, then user chooses: attach to an L1 (dependent) or make it standalone / no parent
- [ ] User can rename an existing L1 or L2
- [ ] User can reassign an L2's parent (change L1, or detach to standalone, or attach a standalone to an L1)
- [ ] User can change an L1's icon
- [ ] User can delete an L1 or L2 — with a warning showing how many items use it; tag associations removed on confirm, items are not deleted
- [ ] Category changes are reflected immediately in the add/edit form and filter sheet

---

### 3.4 Collection Name and Icon

```
As a collector,
I want to customise my collection's name and icon,
So that the app reflects what I'm cataloguing.
```

**Acceptance criteria:**
- [ ] Collection name is displayed in the header of the collection list screen
- [ ] User can edit the collection name and icon from a settings screen
- [ ] Changes persist across sessions via the `user_settings` table

---

### 3.5 Generic Item Fields — Material and Color

```
As a collector,
I want to record the material and colour of an item,
So that I have a more complete physical description of what I own.
```

**Acceptance criteria:**
- [ ] Add/edit form includes a `Material` text field (optional, max 50 chars)
- [ ] Add/edit form includes a `Color` multi-select swatch grid (optional, predefined palette: Rojo, Azul, Verde, Amarillo, Negro, Blanco, Dorado, Plateado, Multicolor, Otro — "Otro" rendered as a grey "?" swatch)
- [ ] Material and color are displayed on the item detail screen
- [ ] Material and color are included in the text search index

---

### 3.6 App Theme

```
As a user,
I want to choose the app's colour theme,
So that the UI matches my preference.
```

**Acceptance criteria:**
- [ ] User can select a theme from Settings: Dark, Light, System (follows device setting)
- [ ] Selection persists across sessions — stored in `user_settings`
- [ ] Theme applies immediately on selection, no restart required
- [ ] Default is Dark for all users

---

### 3.7 All Existing Features (Carry-Forward)

The following user stories from the Pins Inventory MVP (v1 PRD) are carried forward without change. All acceptance criteria remain in force:

- **3.1 Authentication** (magic link, session persistence, deep linking)
- **3.2 Add an item** (form, photo, description, location, year, commemorative, tags, collection number)
- **3.3 Browse the collection** (card list, search, swipe gestures, empty state)
- **3.4 View item detail** (full data, photo, edit/delete access)
- **3.5 Edit an item** (pre-populated form, all fields editable)
- **3.6 Delete an item** (confirmation, image cleanup, collection number re-sequence)
- **3.7 Filter and search** (full faceted search, bottom sheet, 5 dimensions)
- **Map screen** (Google Maps, custom markers, clustering, multi-pin callout, region preservation)
- **Stats screen** (7 sections, animated charts, full collection view)

The primary naming change throughout the app: "pin" → "item" (UI labels and screen titles). Internal table rename: `pins` → `items` (handled via migration).

---

## 4. Solution Overview

Vitrina is a personal collectibles catalogue: any user can register, define their own category taxonomy, and build a digital record of their physical collection with photos, metadata, and a map view.

**Screens (new or changed):**

1. **Login** — unchanged. Magic link entry point.
2. **Onboarding** — fires on first login only. Two steps: (1) name collection + pick icon, (2) set up L1 categories (presets or blank). Skip available throughout.
3. **Collection list** — header now shows collection name. Otherwise identical to MVP.
4. **Add/Edit item** — adds `Material` (text) and `Color` (multi-select) fields. Tag picker now draws from user-owned categories instead of seeded vocabulary.
5. **Item detail** — shows `material` and `color` if set.
6. **Category management** — new screen in settings. Full CRUD on L1 and L2 categories.
7. **Settings** — screen accessible via a gear/profile icon in the collection list header. Entry points: edit collection name/icon, manage categories, theme selector, sign out.

**Key new flows:**

1. First login → Onboarding (name + categories) → Collection list
2. Settings → Categorías → add/edit/delete L1 or L2
3. Settings → Editar colección → change name or icon
4. Add/edit item form → Material field + Color selector (alongside existing fields)

**Architecture changes:**

| Change | Detail |
|--------|--------|
| `pins` table → `items` | Rename via migration; all existing rows preserved |
| `color text[]` added to `items` | Nullable array column |
| `material text` added to `items` | Nullable text column |
| `user_id` added to `tags` | Tags are now user-scoped; each user owns their taxonomy |
| `user_settings` table | `user_id` (PK), `collection_name`, `collection_icon` (nullable), `theme` (text, default 'dark') |
| Seeded tag vocabulary removed | Tags are no longer global — created per user at onboarding or via category management |

**Edge cases to handle:**
- User deletes an L1 that has items tagged to it — remove tag associations, do not delete items
- User deletes an L2 — same: remove associations, warn before delete
- User skips category setup in onboarding — empty tag state, form tag picker shows "Add categories in Settings" prompt
- User renames a category — all existing tag associations update automatically (tag `name` is the display label; `id` is the foreign key — rename is safe)
- Standalone L2 tags (no parent) appear in a separate section in the add/edit form tag picker and in the filter sheet — not grouped under any L1
- Auto-select parent L1 when tapping a dependent L2 only applies to L2s with a `parent_id` — standalone L2 selection has no L1 side-effect

---

## 5. Technical Considerations

- **Auth:** `shouldCreateUser: true` — open registration. No other auth changes.
- **Schema migrations required:**
  1. `rename_pins_to_items` — rename table, update FK references in `pin_tags` → `item_tags`
  2. `add_material_color_to_items` — add `material text`, `color text[]` to `items`
  3. `add_user_id_to_tags` — add `user_id uuid FK → auth.users`, nullable initially for migration safety; backfill Oscar's user_id; add NOT NULL constraint
  4. `create_user_settings` — create `user_settings` table with RLS (user can only read/write their own row)
- **RLS:** All new tables require RLS policies. `user_settings` and `tags` are user-scoped. `item_tags` FK cascade from `items` delete.
- **Onboarding state:** Determined by presence of a `user_settings` row for the user. No boolean flag needed — missing row = first login.
- **Tag CRUD:** All category CRUD targets the `tags` table filtered by `user_id`. Deleting a tag calls a Postgres RPC to remove `item_tags` associations atomically.
- **Dependencies:** No new native modules required — this is schema + UI work only. No new EAS build needed unless a new native package is added.
- **Risks:**
  - Migration on a populated `tags` table (backfilling `user_id`) — must be done carefully. One-time, but needs to be correct.
  - `item_tags` FK reference changes from `pin_tags` → test cascade deletes after migration.

---

## 6. UX Considerations

- **Onboarding tone:** First impression. Should feel like setting up a personal space, not filling out a form. Short, fast, optional depth.
- **Category management:** CRUD for categories should feel like managing a list, not configuring a system. Inline edit preferred over modal forms where possible.
- **Empty states:**
  - No categories set up → collection filter sheet shows empty state with link to Settings
  - New user, empty collection → existing empty state + "Add your first item" CTA
- **Error states:**
  - Delete category with items in use → warn with item count, confirm required
  - Onboarding network failure → retry CTA, do not lose entered data
- **Naming:** UI consistently uses "item" as the generic noun. The collection name (e.g. "Pins de Oscar", "Dedales de María") is the user-facing label for their specific collectibles.

---

## 7. Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| What icon set to use for collection icons in onboarding? | Oscar | Resolved — `@expo/vector-icons` (same as category icons) |
| Color field UX — text chips ("Rojo", "Dorado") or colored swatches? | Oscar | Resolved — swatches |

---

## 8. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-03 | Evolve pins-inventory in place → Vitrina, not a new repo | Oscar's sister wants to use the app; forking creates two codebases to maintain. Existing MVP is stable and tested. |
| 2026-04-03 | One collection per user; multiple collections is v2 | Simplest model that solves the immediate need. Multi-collection adds significant complexity to the data model and navigation. |
| 2026-04-03 | User-scoped tags (add `user_id` to `tags`) | Global seeded taxonomy only works for pins. Each collector has a different mental model — taxonomy must be personal. |
| 2026-04-03 | `user_settings` table for collection name + icon | Lightweight config row; no need for a dedicated settings service. Absence of row = first login (doubles as onboarding gate). |
| 2026-04-03 | `material text` + `color text[]` as generic item fields | Both are universally relevant physical descriptors. |
| 2026-04-03 | Color UX — swatch grid over text chips | 10 colors is the right size for a swatch grid; faster to scan than labels, better looking. "Otro" = grey "?" swatch. |
| 2026-04-03 | Settings accessed via header icon, not bottom tab | Settings is infrequently used — doesn't deserve a permanent tab. Gear icon in collection list header keeps the tab bar focused on content. |
| 2026-04-03 | Rename `pins` → `items` via migration | "Pins" is collection-specific vocabulary. "Items" is neutral and works for any collectible type. |

---

## 9. Launch Checklist

- [ ] All migrations applied and verified on Supabase
- [ ] Oscar's existing data fully intact after `pins` → `items` rename
- [ ] Onboarding flow tested end-to-end on a fresh (no `user_settings`) account
- [ ] Category CRUD tested: create L1, create L2 under L1, rename, delete with item associations
- [ ] New user registration tested (magic link + onboarding route)
- [ ] Existing user (Oscar) bypasses onboarding and lands on collection list
- [ ] Material and color fields editable on add/edit form and visible on detail screen
- [ ] Material and color included in text search
- [ ] Tag picker on add/edit form draws from user-owned tags, not global seed
- [ ] Filter sheet category sections reflect user-owned taxonomy
- [ ] Stats screen unaffected (uses `items` table after rename)
- [ ] Map screen unaffected
- [ ] Theme switching tested — Dark, Light, System all apply correctly
- [ ] No secrets committed
- [ ] Security rules applied (`docs/security-rules.md`)
- [ ] Preview APK built via EAS and tested on device
