# PRD: Pins Inventory — MVP

**Status:** Approved
**Author:** Oscar
**Date:** 2026-03-07
**Version:** 1.0

---

## 1. Problem Statement

- **User pain:** Pin collectors have no dedicated mobile tool to catalogue their physical collection. The only option today is a spreadsheet — no photos, no mobile-first experience, no way to browse visually.
- **Current workaround:** CSV spreadsheet (Notion export). Functional for data entry but useless for browsing, and has no photos.
- **Why this matters:** The collection grows over time and becomes harder to track mentally. Without a catalogue, you can't recall where a pin came from, when you got it, or what you already own.

---

## 2. Goals

| Goal | Metric | Target |
|------|--------|--------|
| Digitise the existing collection | Pins imported via seed script | 477 pins loaded at launch |
| Enable new pin logging | Time to add a new pin | Under 60 seconds |
| Make the collection browsable | Core flow works end-to-end on Android | All screens functional at launch |

**Out of scope:**
- Statistics and tag analytics
- CSV import UI (handled via one-time seed script)
- Adding new tags from the app
- iOS and web
- Social or sharing features

---

## 3. User Stories

### 3.1 Authentication

```
As a collector,
I want to log in with my email via a magic link,
So that my collection is tied to my account and survives device loss.
```

**Acceptance criteria:**
- [x] User can enter their email on the login screen
- [x] Supabase sends a magic link email
- [x] Tapping the link in the email opens the app and logs the user in
- [x] Session persists across app restarts — user does not need to log in again
- [ ] If the magic link has expired, the app shows an error and allows resending

---

### 3.2 Add a pin

```
As a collector,
I want to add a new pin with a photo and metadata,
So that I have a complete digital record of it.
```

**Acceptance criteria:**
- [x] User can open an "Add pin" screen from the main collection view via FAB
- [ ] User can take a photo or select one from the gallery (gallery only in MVP — camera deferred to backlog)
- [x] Description is required — form cannot be submitted without it (max 100 chars, live counter)
- [x] Country and city are required in the form
- [x] Region (Comunidad Autónoma) is optional
- [x] Acquired year is required — numeric input, 4 digits, pre-filled to current year _(changed from optional — see decisions.md 2026-03-15)_
- [x] Is commemorative is optional — toggle, defaults to off
- [x] User can assign one or more tags from the predefined taxonomy (inline two-level chip selector in form — see decisions.md 2026-03-15)
- [x] Photo is optional — pin can be saved without one
- [x] Collection number auto-assigned as max+1 on create; re-sequenced on delete via Postgres RPC
- [x] On save, pin appears immediately in the collection list
- [x] If image upload fails, an error is shown and the user can retry

---

### 3.3 Browse the collection

```
As a collector,
I want to browse my collection as a scrollable card list,
So that I can quickly scan and find pins by name and location.
```

**Acceptance criteria:**
- [x] Collection is displayed as a scrollable card list, ordered by collection number
- [x] Each card shows: collection number, description, city · country (with location icon), acquired year (with calendar icon), category tags (up to 3, L1 uppercase + icon), commemorative badge (ribbon icon) if applicable
- [x] Photos are not shown in the list — visible only in the detail screen
- [x] List loads the full collection on open; refreshes on focus (returning from add/edit/detail)
- [x] Empty state is shown with a CTA to add the first pin when the collection is empty
- [x] Swipe right on a card to edit; swipe left to delete (with confirmation dialog)

---

### 3.4 View pin detail

```
As a collector,
I want to tap a pin to see its full details,
So that I can recall all information about it.
```

**Acceptance criteria:**
- [x] Tapping a pin in the list opens a detail screen
- [x] Detail screen shows: collection number, photo (signed URL, or placeholder), description, country · city · region (with location icon), acquired year (with calendar icon), is commemorative badge (ribbon icon + label), and all assigned tags (L1 uppercase + icon, L2 text)
- [x] Edit (pencil) and delete (trash) actions accessible from detail screen header
- [x] Back navigation returns to the collection list

---

### 3.5 Edit a pin

```
As a collector,
I want to edit a pin's details after saving it,
So that I can fix mistakes or add missing information.
```

**Acceptance criteria:**
- [x] Edit option is accessible from the pin detail screen header (pencil icon) and via swipe right on the collection list
- [x] Edit screen is pre-populated with the pin's existing data (including existing photo as signed URL)
- [x] All fields editable: description, country, city, region, acquired year, is commemorative, photo, tags
- [x] Changes are saved to Supabase on confirm
- [x] Updated data is reflected immediately on returning to the detail screen (useFocusEffect refetch)

---

### 3.6 Delete a pin

```
As a collector,
I want to delete a pin from my collection,
So that I can remove duplicates or incorrect entries.
```

**Acceptance criteria:**
- [x] Delete option is accessible from the pin detail screen header (trash icon) and via swipe left on the collection list
- [x] A confirmation dialog is shown before deleting — no accidental deletions
- [x] On confirm, pin is removed from Supabase and disappears from the collection list immediately
- [x] Associated image is deleted from Supabase Storage
- [x] Collection numbers of subsequent pins are re-sequenced via Postgres RPC to close the gap

---

### 3.7 Filter and search the collection

```
As a collector,
I want to filter my collection by category and search by text,
So that I can quickly find specific pins.
```

**Acceptance criteria:**
- [x] A search bar is visible at the top of the collection list
- [x] Search filters pins in real time by description, city, and country
- [x] A horizontal scrollable row of L1 category chips is shown below the search bar
- [x] Tapping a category chip filters the list to that L1 category
- [x] Search and category filter can be combined
- [x] Active chip shows selected state; tapping again deselects
- [x] Pin count in header reflects active filters (e.g. "47 de 477 pins")
- [x] Empty state shown when no pins match active filters
- [x] Replace L1 chip row with a "Filtrar" button (+ active count badge) next to search bar
- [x] Tapping "Filtrar" opens a bottom sheet with 5 sections:
  - Categoría (L1 chips — narrowed by other active filters)
  - Subcategoría (L2 chips — all shown by default, narrowed when L1 selected; selecting L2 without L1 works)
  - País (searchable input + chips, shown on type)
  - Ciudad (searchable input + chips, shown on type; cascades from País)
  - Año (year chips)
- [x] All filters combinable with each other and with search (full faceted search — each dimension only shows values that return results given other active filters)
- [x] Clear all resets all filters

---

## 4. Solution Overview

Single-user Android app. User logs in once via magic link. The main screen is a card list of their collection ordered by collection number. From there they can add a new pin. Tapping any pin opens its detail.

**Screens:**
1. **Login** — email input + "Send magic link" button. No password, no signup form.
2. **Collection list** — search bar + Filtrar button + scrollable card list ordered by collection number. Floating "+" FAB to add a pin. Filtrar opens a bottom sheet with 5 filter sections (Categoría, Subcategoría, País, Ciudad, Año) with full faceted search.
3. **Add pin** — form with photo picker (gallery), description (max 100 chars), location fields, year (mandatory, pre-filled), commemorative toggle, and inline two-level tag chip selector (L1 + L2 with cascade logic). Collection number auto-assigned.
4. **Pin detail** — full view of a single pin's data including collection number. Edit and delete actions accessible from here.
5. **Edit pin** — same form as Add pin, pre-populated with existing data.

**Key flows:**
1. First open → Login screen → enter email → check email → tap magic link → Collection list
2. Returning user → Collection list (session persists)
3. Add pin → fill form → save → back to Collection list (pin appears)
4. Tap pin → Detail screen → back to Collection list
5. Detail screen → Edit → update form → save → back to Detail screen
6. Detail screen → Delete → confirmation dialog → back to Collection list
7. Collection list → search bar → type query → list filters in real time
8. Collection list → tap Filtrar → bottom sheet → select filters → close → list updates

**Edge cases to handle:**
- Magic link expired → show error + resend option
- No photo added → show placeholder image in grid and detail
- Image upload fails → show error, allow retry, do not save pin without confirming failure
- Empty collection → empty state with prompt to add first pin
- Offline → show graceful error, no silent failure or data loss

---

## 5. Technical Considerations

- **Auth:** Supabase magic link. Session stored in `expo-secure-store`. Auto-refresh enabled.
- **Database:** Supabase Postgres. Three tables: `pins`, `tags`, `pin_tags`. RLS enforced — users can only read/write their own data. `pins` includes a `collection_number` integer for stable ordering.
- **Tags:** Controlled vocabulary only. `tags` table seeded at launch, not user-editable in MVP.
- **Image storage:** Supabase Storage. Images stored under `{user_id}/{pin_id}`. `image_url` stored on the pin record.
- **Image picker:** `expo-image-picker` — supports camera and gallery on Android.
- **Deep linking:** Required for magic link to open the app. Must configure Expo deep link scheme.
- **Risks:**
  - Magic link deep linking requires correct Expo/EAS configuration — test early
  - `expo-image-picker` camera permissions must be declared in `app.json`
  - Supabase Storage RLS policies must be configured to match DB policies

---

## 6. UX Considerations

- **Key interaction:** The "Add pin" flow. Must feel fast — under 60 seconds from opening the form to saving. Tag selection is the most complex part; keep it simple (two-level list, not a search input).
- **Error states:**
  - Magic link expired → clear message + resend button
  - Image upload failure → inline error on the form, not a blocking modal
  - Network error on load → banner or retry button, not a blank screen
- **Empty states:**
  - Empty collection grid → illustration + "Add your first pin" CTA
  - Pin with no photo → consistent placeholder (e.g. a pin icon)
- **Accessibility:** Minimum tap target 44×44pt. Descriptive labels on all interactive elements.

---

## 7. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-07 | Magic link auth over anonymous auth | Data must survive device loss — anonymous sessions are device-bound |
| 2026-03-07 | Android only for MVP | Solves the actual problem; iOS adds cost and setup with no MVP benefit |
| 2026-03-07 | Supabase from day 1, not local SQLite | v2 needs web — starting local means a painful migration later |
| 2026-03-07 | Controlled tag vocabulary, no free-form | Enables clean filtering and statistics; free-form tags create duplicates |
| 2026-03-07 | `is_commemorative` as boolean, not a tag | Cross-cutting attribute — applies to pins in any category |
| 2026-03-07 | Full schema from day 1 | CSV already has location and tag data; migrations on populated tables are costly |
| 2026-03-07 | Edit and delete included in MVP | Collector needs to fix mistakes after 478-pin import; omitting them would make the app unusable |
| 2026-03-07 | Filter and search in MVP | Core to the value of a catalogue — without it, browsing 478 pins is impractical |
| 2026-03-07 | Tag selector: bottom sheet with two-level chips | Fastest mobile UX for a known two-level taxonomy — category tap then subcategory, no typing required |
| 2026-03-07 | NativeWind v4 for styling, dark mode as MVP default | Premium UI goal requires a design system — NativeWind's Tailwind dark mode support is first-class. Light mode is v2. |
| 2026-03-11 | Card list over photo grid for collection view | Pins are identified by text (description + location), not thumbnails. Cards allow scanning at a glance. Photo grid added to backlog as future layout option. |
| 2026-03-11 | `collection_number` column for ordering | Batch inserts share timestamps — timestamp ordering is unreliable. Collection number is also semantically meaningful (pin's permanent catalogue position). |
| 2026-03-15 | Inline tag picker over bottom sheet | Tags embedded in form scroll view — state always visible, no modal layer. See decisions.md. |
| 2026-03-15 | Acquired year mandatory, pre-filled to current year | Year is key catalogue data; pre-fill removes friction. DB column stays nullable for seeded data. |
| 2026-03-15 | PanResponder for swipe gestures | Avoids new EAS build — react-native-gesture-handler not in existing binary. Backlogged for migration. |
| 2026-03-15 | collection_number auto-assign + RPC re-sequence on delete | Keeps collection numbers contiguous and meaningful as the physical binder position. |
| 2026-03-15 | L1 category icons — Ionicons + FontAwesome6 hybrid | FontAwesome6 already in @expo/vector-icons. TagIcon component encapsulates library selection. |

---

## 9. Launch Checklist

- [ ] Acceptance criteria met for all user stories
- [ ] Magic link deep linking tested on a physical Android device
- [ ] Image upload and retrieval tested on a physical Android device
- [ ] Empty states visible and correct
- [ ] Error states visible and correct
- [ ] RLS policies verified — no cross-user data access possible
- [ ] No secrets committed to the repo
- [ ] Security rules applied (see `docs/security-rules.md`)
- [x] 477 pins seeded via CSV import script (`scripts/seed-pins.js`)
- [ ] Preview APK built via EAS (`eas build --platform android --profile preview`) and installed on device — app runs without Metro
