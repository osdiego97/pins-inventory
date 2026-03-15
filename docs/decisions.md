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
