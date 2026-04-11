# Decision Log — Pins Inventory

> Key product and technical decisions, newest first.
> This file feeds the case study — log decisions as they happen, not retroactively.

---

## Template

```
## [YYYY-MM-DD] [Short decision title]

**Context:** [What situation forced this decision]
**Options considered:**
  - Option A: [description + pros/cons]
  - Option B: [description + pros/cons]
**Decision:** [What we chose]
**Rationale:** [Why — including real constraints]
**Trade-off accepted:** [What we consciously gave up]
```

---

## Entries

### 2026-04-11 KeyboardAvoidingView for filter bottom sheet

**Context:** The filter sheet's País/Ciudad search inputs were hidden behind the keyboard when opened, making real-time suggestions unusable. The sheet used `position: absolute, bottom: 0` so it didn't respond to the keyboard.

**Options considered:**
  - Track keyboard height manually via `Keyboard` listeners and animate `marginBottom`: works but requires `useNativeDriver: false`, conflicting with the existing native-driven `translateY` slide animation
  - Wrap with `KeyboardAvoidingView` + convert sheet from absolute to flex-end child: sheet stays in normal flow, KAV handles the upward shift natively on both iOS and Android

**Decision:** `KeyboardAvoidingView` with `behavior="padding"` (iOS) / `behavior="height"` (Android) wrapping the full-screen overlay. Sheet changed from `absolute bottom-0` to `justifyContent: flex-end` child.

**Rationale:** Avoids fighting the native driver. No additional state or listeners needed. The existing `translateY` slide animation is unaffected since it operates on the sheet element, not the container.

**Trade-off accepted:** `KeyboardAvoidingView` behaviour can be inconsistent on some Android devices depending on `windowSoftInputMode`. Acceptable for the current Android-only scope.

---


### 2026-04-08 L1 icon storage — tag record vs static map

**Context:** Adding a user-facing icon picker for L1 categories. Icons were previously hardcoded in `lib/tagIcons.ts` (a name → Ionicons/FontAwesome6 map). Needed to decide where to store user-selected icons.

**Options considered:**
  - Extend `TAG_ICONS` static map: no schema change, but requires a code deploy every time a user wants a new icon — defeats the purpose
  - Store icon name on the `tags` row (`icon text` column): one migration, fully dynamic, user can change icons without any code change

**Decision:** Store as `icon text` (nullable) on the `tags` table (migration 06).

**Rationale:** Users managing their own categories need to assign icons without a code deploy. The static `TAG_ICONS` map remains as a fallback for legacy categories that predate the feature. `TagIcon` component checks `tagIcon` prop first, falls back to `TAG_ICONS` by name — backward compatible with zero data migration.

**Trade-off accepted:** Icons are limited to the 32 Ionicons names offered in the picker. FontAwesome6 icons (used by some legacy categories) can't be chosen by users — acceptable since the picker is intentionally curated.

---

### 2026-04-08 Shared subcategory selection model

**Context:** Shared subcategories (`is_shared = true`, no `parent_id`) are displayed under every L1 group in the tag picker as a convenience. Since all copies share the same `tag_id`, selecting one caused all copies to highlight simultaneously — wrong UX.

**Options considered:**
  - Change data model: create a separate tag record per L1 instance — solves the identity problem but changes how shared tags work semantically
  - Visual scoping with context: keep the flat data model, scope the active state to `selectedIds.includes(tag.id) && selectedIds.includes(L1.id)`, pass `parentId` through `onToggle` so selection auto-picks the parent L1

**Decision:** Visual scoping with context (no data model change).

**Rationale:** The flat model is correct — a shared tag is one entity. The bug was in the display logic, not the schema. Passing `parentId` through `onToggle` gives L2-equivalent behaviour (auto-select parent, deselect parent if no siblings remain) without any DB change.

**Trade-off accepted:** If a user selects the same shared tag under both L1-A and L1-B, deselecting it from L1-A removes the tag entirely. Acceptable edge case — the common usage is selecting the tag once under one L1.

---

### 2026-04-05 Vitrina — generic collectibles platform pivot

**Context:** Oscar's sister wanted to use the app. Forking creates two codebases; the right call is to evolve pins-inventory in place into a generic platform any collector can use. Core constraint: preserving all existing data and functionality while unlocking new users.

**Onboarding gate placement:**
- Option A: `(app)/_layout.tsx` with `<Redirect>` — causes a re-render loop on Android. Expo Router layouts re-evaluate when routes change, triggering infinite redirects.
- Option B: `app/index.tsx` (entry point) — checks `user_settings` once on session resolve, uses `<Redirect>` to route to onboarding or collection. Clean, no loop.

**Decision:** Onboarding gate in `app/index.tsx`. Layout files must not contain conditional `<Redirect>` that depends on async state.

**User-scoped tags:**
- Option A: Keep shared global taxonomy (seeded) — works only for pins. Any new user gets Oscar's category vocabulary.
- Option B: Add `user_id` to `tags`, each user owns their taxonomy — requires migration + backfill, but unlocks any collection type.

**Decision:** Option B. Tags scoped per user. Migration 03 backfills Oscar's UUID on all existing tags.

**user_settings table:**
- Presence of a row = onboarding complete. Absence = first login.
- Stores: `collection_name`, `collection_icon`, `theme`. No boolean flag needed — the row itself is the flag.

**Table rename (pins → items):**
- "Pins" is collection-specific vocabulary. "Items" is neutral.
- Migration 01 renames the table, FK column, junction table, and RPC atomically.

**New fields (material, color):**
- `material text` (nullable, max 50) — universally relevant physical descriptor.
- `color text[]` (nullable) — multi-select from 10 predefined values. Swatch grid UX over text chips — faster to scan, more visual.

**Rationale:** Evolving in place avoids a split codebase. User-scoped tags is the minimum change that unlocks any new collector. The onboarding pattern (row-as-flag) keeps the schema simple — no boolean field that can get out of sync.

**Trade-off accepted:** Existing Oscar tags required a one-time UUID backfill. All new categories must be created via the app — no seeded vocabulary for new users.

---

### 2026-03-28 Map view — architecture and key decisions

**Context:** Building the map feature (user story: see pins plotted on a world map). Multiple connected decisions: how coordinates are stored, how they're set on each pin, which map library to use, filter behaviour, and marker design.

**Coordinates storage:**
- Option A: Separate `pin_locations` table (normalised, reusable) — adds join complexity, no benefit at this scale
- Option B: `latitude FLOAT8` + `longitude FLOAT8` nullable columns directly on `pins` — simple, sufficient, no join needed

**Decision:** Per-pin nullable lat/lng columns on `pins`. Schema migration `add_map_coordinates_to_pins` applied.

**Coordinate input:**
- Option A: Manual lat/lng fields — error-prone, not user-friendly
- Option B: Semantic backfill script (geocode by tag type: Hard Rock → venue, Fútbol → stadium, etc.)
- Option C: Google Places Autocomplete search field ("Posición en mapa") on add/edit form — user picks the specific place

**Decision:** Option C (Places search field) as the primary input for new pins, Option B (backfill script) for existing 477 pins (separate session). Places API (New) used — `POST https://places.googleapis.com/v1/places:autocomplete`, not the legacy `/maps/api/place/` endpoint. API key exposed as `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (was `GOOGLE_MAPS_API_KEY`) — `EXPO_PUBLIC_` prefix required for runtime access in app code.

**Map library:**
- `react-native-maps` (Google Maps, Android) + `react-native-map-clustering` for proximity clustering
- Requires a new EAS build (native module)

**Marker design:**
- Option A: Native teardrop (`pinColor` prop) — simple, but can't customise shape/size for badge overlays
- Option B: Custom View (gold circle 28×28, border #0f0f0f) — full control, consistent with design system

**Decision:** Always render custom View. `tracksViewChanges` initialised to `true` (bitmap captured on first render), toggled to `false` after 500ms via `useFocusEffect` to prevent markers disappearing after navigation.

**Same-location pins:**
- Option A: Let ClusteredMapView handle — shows single pin at same coords, no grouping indication
- Option B: `groupByLocation()` pre-groups exact duplicates; multi-pin groups show count badge (white bubble, top-right) and a callout listing all pins

**Decision:** Option B. ClusteredMapView handles proximity clustering; `groupByLocation` handles exact-coordinate duplicates before that.

**Filter multi-select:**
- Previous filter design: single L1 + single L2 selection (string | null)
- Map needs: "show Escudo Ciudad + Bandera Ciudad" — requires multiple L1/L2 simultaneously
- Decision: change `FilterState.l1` and `l2` from `string | null` to `string[]`. Applied to both map and collection list (consistent behaviour everywhere). OR semantics: all selected tags merged into `[...l1, ...l2]`, filter with `.some(t => selectedTags.includes(t.name))`. Selecting an L2 auto-selects its parent L1.

**Rationale:** Normalised schema keeps the data model clean. Google Places gives a UX comparable to Uber/Google Maps — no friction. Custom markers keep the design system consistent. Multi-select was the correct semantic fix; AND semantics across dimensions would always return 0 results when mixing categories.

**Trade-off accepted:** Backfill script is a separate manual step — existing pins start without map coordinates. Google Maps API key must be embedded in the Android manifest at build time (not runtime-injectable).

---

### 2026-03-24 Stats screen — architecture and chart approach

**Context:** Designing the first post-MVP feature: a statistics screen giving the user insight into their collection. Four decisions needed upfront before building.

**Options considered:**

*Navigation placement:*
- Header icon from collection list: accessible but feels like a utility, not a feature
- Bottom tab bar: promotes stats to a first-class screen alongside the collection

*Chart implementation:*
- Charting library (e.g. react-native-gifted-charts): faster to scaffold, but opinionated defaults hard to override for a custom dark mode design system
- `react-native-svg` directly: write SVG primitives ourselves — full design control

*Data fetching:*
- Supabase RPC: server-side aggregation, one query — adds complexity
- Client-side with `useMemo`: aggregate `pins` + `pin_tags` in JS — trivial at 477 pins

*Scope of stats:*
- Reflect active filters: complex, low value — filters are a collection-browsing tool, not an analysis lens
- Always full collection: simple, coherent "big picture" view

**Decision:** Tab bar navigation · react-native-svg directly (no library) · client-side aggregation · always full collection.

**Rationale:** Tab bar gives stats the right structural weight. Custom SVG enables Revolut-style dark mode aesthetics (donut chart, animated fills) without fighting library defaults. Client-side aggregation at this scale is instant. Full collection keeps the screen's purpose clear.

**Trade-off accepted:** react-native-svg requires a new EAS build. Acceptable — stats is a new feature branch that needs a build regardless. Filtered stats deferred to v2.

---

### 2026-03-24 EAS build profile for MVP distribution

**Context:** MVP is a personal Android app — not distributed via Play Store. Needed to decide which EAS build profile to use as the final MVP artifact.

**Options considered:**
- `development`: Requires Metro running on the same machine — not standalone, not suitable for real-world testing
- `preview`: Standalone APK, internal distribution, no Metro required — behaves like a real app
- `production`: AAB format, intended for Play Store submission — unnecessary overhead for a personal app

**Decision:** Use `preview` as the MVP distribution target.

**Rationale:** `preview` produces a standalone APK that installs and runs without any dev tooling. It's the closest to a real production experience without the Play Store overhead. Since this is a single-user personal app, Play Store distribution is out of scope for MVP.

**Trade-off accepted:** No Play Store listing. Acceptable — not a goal for this project.

---

### 2026-03-21 Filter sheet — draft state, pre-warming, overlay over Modal

**Context:** Building the filter bottom sheet for story 3.7. Initial implementation caused 2-second open delay and laggy chip interactions.

**Options considered:**
- Real-time filter application (call `setFilters` on every chip tap): Simple, but causes the collection list behind the sheet to re-render on every tap — JS thread contention makes chips feel unresponsive.
- Draft state (apply filters once on close): Chip taps update local state only; `onFiltersChange` fires once when the sheet dismisses. Collection list untouched while sheet is open.

- `Modal` component: Native Android modal system — ~2 second presentation delay on every open due to native window creation.
- Absolute-positioned overlay rendered in the screen's view hierarchy: No native overhead — appears instantly.

- Render chip lists on open: First open creates 500+ native views (200+ city chips alone) — 1-2 seconds in dev builds.
- Pre-render via `InteractionManager.runAfterInteractions`: Native views created in background after screen settles. Open triggers only the spring animation.

**Decision:** Draft state + absolute overlay + `InteractionManager` pre-warming. País/Ciudad chip rows only render when user types (no chips dumped on initial render).

**Rationale:** Each fix addresses a distinct layer of the problem: draft state eliminates background re-renders, overlay removes native modal overhead, pre-warming eliminates first-render cost at open time.

**Trade-off accepted:** Filters apply on sheet close, not in real time as chips are tapped. Faceted values inside the sheet still update in real time (local state), so the user gets interactive feedback. The list updates once on dismiss — acceptable and arguably cleaner UX.

---

### 2026-03-21 Filter — full faceted search over cascade-only

**Context:** Designing how filter dimensions interact. País → Ciudad cascade was the minimum. Full faceted search (every dimension narrows based on all other active filters) was the alternative.

**Options considered:**
- Cascade only (País → Ciudad): Simple, but selecting Fútbol doesn't narrow País — you could still pick "Tokyo" with Fútbol active and get 0 results.
- Full faceted search: Each dimension shows only values that return results given everything else active. No dead-end combinations possible.

**Decision:** Full faceted search. Each section's available values computed from pins filtered by all other dimensions (`applyFilters` called 5 times, each excluding its own dimension). Granular `useMemo` deps prevent unnecessary recomputation.

**Rationale:** With 477 pins across 11 categories and many countries/cities, guided navigation is the right call. It prevents dead ends and helps the user discover what's actually in their collection (e.g. tapping Fútbol immediately shows only countries where football pins exist).

**Trade-off accepted:** More computation per filter change. Mitigated by granular `useMemo` deps — changing L1 only recomputes memos that depend on L1.

---

### 2026-03-21 Filter — L2 visible without requiring L1 selection

**Context:** Initial implementation showed L2 subcategories only after an L1 was selected. User wanted to filter by "Escudo de Ciudad" directly without first selecting "Geografía".

**Decision:** L2 section always visible, showing all subcategories across all categories (faceted). When L1 is selected, L2 narrows to that category's subcategories. Selecting L2 without L1 works independently. Switching L1 resets L2 only if the selected L2 doesn't belong to the new L1.

**Rationale:** Users know what they're looking for — forcing them to go via L1 adds unnecessary friction. The faceted filtering ensures only valid L2 values are shown anyway.

**Trade-off accepted:** More L2 chips shown initially (~30 vs ~6). Acceptable given the pre-warming strategy handles the render cost.

---

### 2026-03-15 Swipe gestures — PanResponder over react-native-gesture-handler

**Context:** Adding swipe-to-edit (right) and swipe-to-delete (left) on collection list cards. Two options for gesture handling in React Native.

**Options considered:**
  - `react-native-gesture-handler`: UI-thread gesture processing, better coexistence with FlatList scroll via `activeOffsetX`/`failOffsetY` API. Requires native module compiled into the app binary.
  - `PanResponder` (React Native core): JS-thread, no native module required, works with any existing build.

**Decision:** `PanResponder` for MVP. `react-native-gesture-handler` added to backlog for future migration.

**Rationale:** Gesture handler requires a new EAS build to include its native module. PanResponder works immediately with the existing binary and delivers the same end-user behaviour for a simple swipe-to-reveal. Migrating is low-risk when the time comes.

**Trade-off accepted:** Gesture processing on JS thread — could lag if JS is busy. Acceptable for a single-user app with no heavy background work.

---

### 2026-03-15 Tag picker UX — inline chip selector embedded in form

**Context:** PRD specified a bottom sheet with two-level chips for tag selection. When building the form, inline chips within the scrollable form were evaluated against the bottom sheet approach.

**Options considered:**
  - Bottom sheet: Clean separation, but adds a modal layer, requires a bottom sheet library or custom implementation, and hides the tag state while the sheet is open.
  - Inline chip grid: Tags rendered directly in the form scroll view. L1 as selectable chips (uppercase + category icon), L2 chips indented below. State visible at all times.

**Decision:** Inline chip grid. PRD updated to reflect this.

**Rationale:** The form is already a scroll view. Embedding the tag picker inline keeps all form state visible without a modal layer, and the L1/L2 hierarchy is clear at a glance. The bottom sheet adds navigation complexity for no UX gain given the form's existing scroll container.

**Trade-off accepted:** Tag picker occupies vertical space in the form rather than being hidden until needed.

---

### 2026-03-15 Acquired year — mandatory in form

**Context:** PRD marked acquired year as optional. During implementation, making it mandatory was evaluated.

**Decision:** Acquired year is mandatory in the add/edit form. Pre-filled to the current year to reduce friction.

**Rationale:** Year is a key piece of catalogue data — a pin without a year loses important context. Pre-filling to the current year means the user only needs to change it if incorrect, making mandatory feel frictionless in practice.

**Trade-off accepted:** Existing seeded pins without a year (from the CSV) are unaffected — the DB column remains nullable. Only new entries via the form require a year.

---

### 2026-03-15 L1 category icons — multi-library approach (Ionicons + FontAwesome6)

**Context:** Adding icons to L1 category chips in the tag picker and on pin cards. Ionicons (already in `@expo/vector-icons`) was the first choice, but several categories lacked suitable icons.

**Options considered:**
  - Ionicons only: No additional library, but `guitar` and military-specific icons are absent.
  - FontAwesome6 + Ionicons: Full icon coverage. `@expo/vector-icons` includes FontAwesome6 — no new dependency.

**Decision:** Hybrid approach. `TagIcon` component wraps both libraries and selects based on a `library` field in `lib/tagIcons.ts`. L1 categories only — L2 icons deferred to backlog.

**Rationale:** FontAwesome6 is already bundled in `@expo/vector-icons`. No new dependency. `TagIcon` encapsulates the multi-library logic — consumers just pass the tag name.

**Trade-off accepted:** Multi-library icon map requires maintenance when new categories are added. Acceptable given the controlled vocabulary.

---

### 2026-03-15 Collection number — auto-assign on add, re-sequence on delete

**Context:** When a user adds a new pin, a collection number must be assigned. When a pin is deleted, subsequent numbers become gaps.

**Options considered:**
  - Manual assignment: User enters the number. Error-prone and friction-heavy.
  - Auto-assign as max+1 on add; leave gaps on delete: Simple, but gaps make the collection number meaningless over time.
  - Auto-assign as max+1 on add; re-sequence on delete via Postgres RPC: Keeps numbers contiguous. Slightly more complex.

**Decision:** Auto-assign max+1 on create. On delete, call Postgres RPC `decrement_collection_numbers_after` to close the gap.

**Rationale:** Collection number represents the pin's position in the physical binder. Gaps would break that mapping. The RPC is a single DB call and handles the re-sequencing atomically.

**Trade-off accepted:** Delete is slightly more expensive (two DB calls). Acceptable — deletes are infrequent.

---

### 2026-03-11 Pin ordering — collection_number column

**Context:** After seeding 477 pins from CSV, the collection screen needed a meaningful sort order. Pins were inserted in batches of 50, so all pins in a batch shared the same `created_at` timestamp — ordering by timestamp only gave batch-level ordering, not exact row order.

**Options considered:**
  - `created_at ASC`: fast, no schema change, but within-batch order not guaranteed (50-pin granularity)
  - `collection_number` integer column: exact order, requires migration + re-seed, permanent and meaningful beyond CSV import

**Decision:** Add `collection_number integer` column to `pins` table. Seeded with the row index from the CSV (1–477). New pins added via the app will also receive a collection number.

**Rationale:** The collection number is meaningful beyond ordering — it represents the pin's permanent position in the physical collection (e.g. "pin #42"). It also gives the user a stable reference they can use when talking about their collection. A minor migration cost for a permanent benefit.

**Trade-off accepted:** Future pins added via the app require the user to assign a collection number manually. Acceptable for a single-user app.

---

### 2026-03-11 Collection screen layout — card list, not photo grid

**Context:** Designing the main collection screen for 478 pins. Two common patterns: photo grid (visual scanning) or card list (text + metadata).

**Options considered:**
  - Photo grid: Visually rich, but pins are small physical objects — thumbnails look similar and don't convey description, country, or tags. Requires images to be loaded on the main screen.
  - Card list: Shows description, country/city, and category tags. Scannable by text, which is how you identify a pin mentally. Photos deferred to detail screen.

**Decision:** Vertical card list. Each card shows description, country · city, and category tag chips. Photo visible only on detail screen.

**Rationale:** With 478 pins, text-based scanning is how you find a specific pin. A photo grid is only effective when the image alone is the identifier (e.g. product catalogue). For a pin collection, description + location is the primary identifier. Deferring photos also keeps the list fast to render.

**Trade-off accepted:** Less visual impact on the main screen. Acceptable — the premium feel comes from card design and typography, not photo density.

---

### 2026-03-07 UI — NativeWind v4, dark mode first

**Context:** MVP requires a modern, polished UI. The original architecture rules banned external styling libraries to keep dependencies minimal. That constraint was set before the UI quality bar was defined.

**Options considered:**
  - StyleSheet only: Full control, no dependencies, but slow to build a polished UI and dark mode requires manual implementation everywhere
  - React Native Paper: Good component library but opinionated Material Design aesthetic — not the right look
  - NativeWind v4 (Tailwind CSS for React Native): Utility-first, dark mode built-in, fastest path to a consistent premium UI

**Decision:** NativeWind v4. Dark mode is the MVP default — light mode is v2.

**Rationale:** The goal is a premium-feeling app, not a functional prototype. NativeWind's Tailwind design system gives consistency out of the box and dark mode support is first-class. The dependency cost is worth it.

**Trade-off accepted:** External styling dependency. Tailwind class names are less explicit than StyleSheet for native-specific properties.

---

### 2026-03-07 Edit, delete, filter and search included in MVP

**Context:** Initial MVP scope only included add and view. After scoping, three gaps emerged: collectors need to fix mistakes (edit/delete), and browsing 478 pins without search or filtering is impractical.

**Options considered:**
  - Defer edit/delete/filter to v2: Simpler build, but the app would be unusable after importing 478 pins with no way to correct errors or find specific pins
  - Include in MVP: More build effort, but the app is actually useful from day 1

**Decision:** Edit, delete, filter by category, and text search are all included in MVP.

**Rationale:** With 478 pins imported at launch, search and filtering are not nice-to-haves — they are core to the value of the catalogue. Edit and delete are equally essential: mistakes in the CSV seed will need correcting, and the app should not lock users into bad data.

**Trade-off accepted:** More screens and logic to build before launch.

---

### 2026-03-07 Tag selector UX — bottom sheet with two-level chip selection

**Context:** Needed a mobile UX pattern for assigning tags from an 11-category two-level taxonomy when adding or editing a pin.

**Options considered:**
  - Accordion list: Good for browsing but tall and slow to scroll on mobile
  - Two-step full screen: Clean but requires navigation for each tag added
  - Bottom sheet with category chips: Tap category → subcategories appear below → tap to select. Fast, visual, supports multi-select without leaving the sheet

**Decision:** Bottom sheet with category chips at the top, subcategories revealed on tap.

**Rationale:** Matches how a collector thinks — category is immediately obvious (this is a Fútbol pin), subcategory is a quick refinement (Club). No typing required. Multi-tag assignment stays fast.

**Trade-off accepted:** Requires a custom bottom sheet component.

---

### 2026-03-07 Tag taxonomy — theme-first two-level hierarchy

**Context:** CSV data uses three tag columns inconsistently, mixing visual type (Escudo, Bandera) with thematic category (Disney, Fútbol, Hard Rock). Needed a clean taxonomy to support search, filtering, and statistics in the app.

**Options considered:**
  - Keep CSV structure (Tag1/Tag2/Tag3 columns): Simple import, but rigid and poorly structured for querying
  - Flat tag list: Flexible but no hierarchy — hard to filter by broad category
  - Theme-first two-level hierarchy stored in a `tags` table with `parent_id`: Clean queries, supports filtering by category or subcategory, scales well

**Decision:** Theme-first two-level hierarchy.

**Rationale:** Filtering and statistics require clean category boundaries. Theme-first is intuitive — "show me all Football pins" or "show me all Geografía > Escudo de País" works cleanly. `Conmemorativo` moved to a boolean field on `pins` rather than a tag — it's a cross-cutting attribute, not a theme.

**Taxonomy:**

| Category (L1) | Subcategories (L2) |
|---|---|
| Geografía | Escudo de Ciudad · Escudo de Región · Escudo de País · Bandera de Ciudad · Bandera de Región · Bandera de País |
| Turismo | Evento · *(rest flat)* |
| Fútbol | Club · Selección · Jugador · Evento |
| Series y Películas | Disney · Harry Potter · Otros |
| Hard Rock | *(flat)* |
| Música | *(flat)* |
| Marcas | Logotipo · Producto · Otros |
| Militar | *(flat)* |
| Símbolos | Celta · Político · Social · Religión · Otros |
| Animales | *(flat)* |
| Objetos | Vehículo · Instrumento musical · Otros |

**Trade-off accepted:** Tags must be manually remapped on CSV import — old Tag1/2/3 values don't map 1:1 to the new taxonomy.

---

### 2026-03-07 Final pin schema

**Context:** After scoping the full data model, several fields from the initial schema proposal needed revision: tag columns replaced by a proper taxonomy, `notes` dropped, `name` renamed to `description`, `is_commemorative` added as a boolean.

**Decision:** Final `pins` table schema:

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `uuid` | No | Primary key, auto-generated |
| `user_id` | `uuid` | No | FK → auth.users (RLS) |
| `description` | `text` | No | Pin name/description |
| `country` | `text` | Yes | Nullable in DB, required in app form |
| `city` | `text` | Yes | Nullable in DB, required in app form |
| `region` | `text` | Yes | Comunidad Autónoma — Spanish pins only |
| `image_url` | `text` | Yes | Null on CSV import, added via app |
| `acquired_year` | `smallint` | Yes | Year only — no full date needed |
| `is_commemorative` | `boolean` | No | Defaults to false |
| `created_at` | `timestamptz` | No | Auto-generated |

**Supporting tables:**
- `tags (id, name, parent_id)` — controlled vocabulary, seeded from taxonomy, no UI to add tags in MVP
- `pin_tags (id, pin_id, tag_id, user_id)` — junction table

**Fields dropped and why:**
- `notes` — no clear use case identified
- `tag1/tag2/tag3` — replaced by proper taxonomy

**Trade-off accepted:** `country` and `city` nullable in DB to allow CSV import of rows missing those fields. App form enforces them for new entries.

---

### 2026-03-07 Authentication approach — magic link over anonymous auth

**Context:** App is single-user (personal collection), so multi-user auth complexity is not needed. However, data needs to survive device loss since the collection is irreplaceable. Anonymous auth was considered as the simplest option.

**Options considered:**
  - No auth (local storage only): Zero setup, but data lives on device — lose the phone, lose everything. Also blocks future web/cross-device access.
  - Anonymous auth (Supabase): Silent session, no UI needed, but session token is device-bound — same problem as local storage if the phone is lost.
  - Magic link (email): One extra screen (email input), but ties data to an email identity. Reinstall on any device and data is recoverable.

**Decision:** Magic link auth via Supabase.

**Rationale:** The collection is a catalogue of physical pins built over time — irreplaceable. Losing the device should not mean losing the data. Magic link is the minimum auth that solves this with a single screen and no password management.

**Trade-off accepted:** One extra screen in the first-use flow. Acceptable given what's at stake.

---

### 2026-03-07 Data persistence — Supabase over local SQLite

**Context:** MVP is Android-only and single-user. Local SQLite would be simpler for MVP. But v2 includes a web version, which requires a backend. Decision: start with local storage and migrate later, or use Supabase from day 1?

**Options considered:**
  - SQLite (local): Zero backend setup, works offline. Requires full data migration when web/cross-device is added in v2.
  - Supabase from day 1: Slightly more setup upfront, but no migration needed. Stack was already committed to Supabase in earlier decisions.

**Decision:** Supabase from day 1.

**Rationale:** Supabase is already in the committed stack. Starting local and migrating later is real work with real risk on a populated dataset. The upfront cost is low; the future cost of migration is not.

**Trade-off accepted:** Backend dependency from day 1. Acceptable — Supabase free tier covers this project indefinitely.

---

### 2026-03-07 Platform scope — Android-only MVP

**Context:** Deciding which platforms to support at launch. Oscar uses Android. iOS and web are desirable but not required to solve the core problem today.

**Options considered:**
  - Android + iOS: Expo supports both, but iOS requires a Mac and Apple developer account for distribution — adds setup overhead and cost.
  - Android only: Solves the actual problem immediately. iOS added in v2 when the MVP is validated.
  - Android + Web: Web requires auth (anonymous auth doesn't work cross-device), adding scope.

**Decision:** Android only for MVP.

**Rationale:** The problem is personal — cataloguing a pin collection on the device Oscar uses. iOS and web add cost and complexity without adding value to the MVP. Both are natural v2 additions once the core is stable.

**Trade-off accepted:** Not usable on iOS or browser until v2. Acceptable for a personal-use MVP.

---

### 2026-03-07 Pin schema — full fields vs minimal MVP

**Context:** CSV import has rich location and tag data (city, country, region, tag1-3). MVP UI only shows name/notes/photo. Decision: match schema to data or keep it minimal?

**Options considered:**
  - Minimal schema (name, notes, image_url only): Simpler now, migration required later when location/search features ship
  - Full schema from day 1: Slightly more upfront work, no migration needed when v2 features (search by location, filter by tag) are built

**Decision:** Full schema from day 1 — store all fields even if MVP UI doesn't expose them.

**Rationale:** Supabase migrations on a populated table are painful. The fields are already in the CSV. Zero cost to add them now.

**Trade-off accepted:** A few extra optional columns in the DB that the MVP UI ignores.

---

### 2026-03-07 Stack selection

**Context:** Choosing the tech stack for a personal mobile app to catalogue a pin collection. Solo project, no team, no deadlines.

**Options considered:**
  - React Native CLI: More control, more setup overhead, slower iteration
  - Expo + React Native: Managed workflow, EAS Build, camera/storage access out of the box
  - Flutter: Strong performance, but requires Dart — adds learning curve with no benefit here

**Decision:** Expo SDK 51+ with Expo Router v3

**Rationale:** Fastest path to a working app with camera and storage. Supabase chosen over Firebase for explicit RLS, SQL familiarity, and better pricing at zero scale.

**Trade-off accepted:** Less control over native build config. Acceptable for a personal project with no custom native modules.

---

### 2026-03-07 Navigation approach

**Context:** Choosing between file-based routing (Expo Router) and component-based routing (React Navigation).

**Options considered:**
  - React Navigation: More battle-tested, more community resources
  - Expo Router v3: File-based, closer to Next.js mental model, simpler for small apps

**Decision:** Expo Router v3

**Rationale:** The app has a simple navigation tree (auth flow + 3 screens). File-based routing reduces boilerplate. Mental model matches how Oscar already thinks about routing.

**Trade-off accepted:** Expo Router is newer — fewer Stack Overflow answers if stuck. Worth it given the simplicity of the app.
