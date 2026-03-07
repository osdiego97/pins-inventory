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
| Digitise the existing collection | Pins imported via seed script | 478 pins loaded at launch |
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
- [ ] User can enter their email on the login screen
- [ ] Supabase sends a magic link email
- [ ] Tapping the link in the email opens the app and logs the user in
- [ ] Session persists across app restarts — user does not need to log in again
- [ ] If the magic link has expired, the app shows an error and allows resending

---

### 3.2 Add a pin

```
As a collector,
I want to add a new pin with a photo and metadata,
So that I have a complete digital record of it.
```

**Acceptance criteria:**
- [ ] User can open an "Add pin" screen from the main collection view
- [ ] User can take a photo or select one from the gallery
- [ ] Description is required — form cannot be submitted without it
- [ ] Country and city are required in the form
- [ ] Region (Comunidad Autónoma) is optional
- [ ] Acquired year is optional — numeric input, 4 digits
- [ ] Is commemorative is optional — toggle, defaults to off
- [ ] User can assign one or more tags from the predefined taxonomy (two-level: category + subcategory)
- [ ] Photo is optional — pin can be saved without one
- [ ] On save, pin appears immediately in the collection grid
- [ ] If image upload fails, an error is shown and the user can retry

---

### 3.3 Browse the collection

```
As a collector,
I want to browse my collection as a photo grid,
So that I can visually explore what I have.
```

**Acceptance criteria:**
- [ ] Collection is displayed as a scrollable photo grid
- [ ] Each card shows the pin photo (or a placeholder if no photo)
- [ ] Each card shows the pin description
- [ ] Grid loads the full collection on open
- [ ] Empty state is shown with a CTA to add the first pin when the collection is empty

---

### 3.4 View pin detail

```
As a collector,
I want to tap a pin to see its full details,
So that I can recall all information about it.
```

**Acceptance criteria:**
- [ ] Tapping a pin in the grid opens a detail screen
- [ ] Detail screen shows: photo, description, country, city, region (if set), acquired year (if set), is commemorative flag, and all assigned tags
- [ ] Back navigation returns to the collection grid

---

### 3.5 Edit a pin

```
As a collector,
I want to edit a pin's details after saving it,
So that I can fix mistakes or add missing information.
```

**Acceptance criteria:**
- [ ] Edit option is accessible from the pin detail screen
- [ ] Edit screen is pre-populated with the pin's existing data
- [ ] All fields editable: description, country, city, region, acquired year, is commemorative, photo, tags
- [ ] Changes are saved to Supabase on confirm
- [ ] Updated data is reflected immediately in the grid and detail screen

---

### 3.6 Delete a pin

```
As a collector,
I want to delete a pin from my collection,
So that I can remove duplicates or incorrect entries.
```

**Acceptance criteria:**
- [ ] Delete option is accessible from the pin detail screen
- [ ] A confirmation dialog is shown before deleting — no accidental deletions
- [ ] On confirm, pin is removed from Supabase and disappears from the collection grid immediately
- [ ] Associated image is deleted from Supabase Storage

---

### 3.7 Filter and search the collection

```
As a collector,
I want to filter my collection by category and search by text,
So that I can quickly find specific pins.
```

**Acceptance criteria:**
- [ ] A search bar is visible at the top of the collection grid
- [ ] Search filters pins in real time by description, city, and country
- [ ] A horizontal scrollable row of category chips is shown below the search bar
- [ ] Tapping a category chip filters the grid to show only pins in that category
- [ ] Search and category filter can be combined — both active at the same time
- [ ] An active filter chip shows a visual indicator (selected state)
- [ ] Tapping an active chip deselects it and clears that filter
- [ ] A "clear all" option resets both search and filters
- [ ] Empty state is shown when no pins match the active filters

---

## 4. Solution Overview

Single-user Android app. User logs in once via magic link. The main screen is a photo grid of their collection. From there they can add a new pin. Tapping any pin opens its detail.

**Screens:**
1. **Login** — email input + "Send magic link" button. No password, no signup form.
2. **Collection grid** — search bar + category filter chips + scrollable grid of pin cards. Floating "+" button to add a pin.
3. **Add pin** — form with photo picker, description, location fields, year, commemorative toggle, and tag selector (bottom sheet, two-level: category chips → subcategory).
4. **Pin detail** — full view of a single pin's data. Edit and delete actions accessible from here.
5. **Edit pin** — same form as Add pin, pre-populated with existing data.

**Key flows:**
1. First open → Login screen → enter email → check email → tap magic link → Collection grid
2. Returning user → Collection grid (session persists)
3. Add pin → fill form → save → back to Collection grid (pin appears)
4. Tap pin → Detail screen → back to Collection grid
5. Detail screen → Edit → update form → save → back to Detail screen
6. Detail screen → Delete → confirmation dialog → back to Collection grid
7. Collection grid → search bar → type query → grid filters in real time
8. Collection grid → tap category chip → grid filters to that category

**Edge cases to handle:**
- Magic link expired → show error + resend option
- No photo added → show placeholder image in grid and detail
- Image upload fails → show error, allow retry, do not save pin without confirming failure
- Empty collection → empty state with prompt to add first pin
- Offline → show graceful error, no silent failure or data loss

---

## 5. Technical Considerations

- **Auth:** Supabase magic link. Session stored in `expo-secure-store`. Auto-refresh enabled.
- **Database:** Supabase Postgres. Three tables: `pins`, `tags`, `pin_tags`. RLS enforced — users can only read/write their own data.
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

---

## 9. Launch Checklist

- [ ] Acceptance criteria met for all four user stories
- [ ] Magic link deep linking tested on a physical Android device
- [ ] Image upload and retrieval tested on a physical Android device
- [ ] Empty states visible and correct
- [ ] Error states visible and correct
- [ ] RLS policies verified — no cross-user data access possible
- [ ] No secrets committed to the repo
- [ ] Security rules applied (see `docs/security-rules.md`)
- [ ] 478 pins seeded via CSV import script
