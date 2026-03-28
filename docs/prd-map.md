# PRD: Map View

**Status:** Approved
**Author:** Oscar
**Date:** 2026-03-28
**Version:** 1.0

---

## 1. Problem Statement

- **User pain:** The collection has rich geographic data (country, city, and semantic location per pin) but there is no way to explore it spatially — you cannot see where in the world your pins came from at a glance.
- **Current workaround:** The Stats screen shows "Por País" counts, but as a list — no visual map context.
- **Why this matters:** A significant part of the collection's story is geographic. Map view turns location data into a browsable, visual experience that the list and stats screens cannot provide.

---

## 2. Goals

| Goal | Metric | Target |
|------|--------|--------|
| Make the collection explorable on a map | Map screen functional end-to-end on Android | All plotted pins navigable to detail screen |
| Enable semantic per-pin positioning | Pins geocoded to meaningful locations (stadium, HRC, city hall, etc.) | Existing pins backfilled via script; new pins via place search |
| Filter pins on the map | All existing filter dimensions usable on map screen | Filters reduce plotted pins + map auto-zooms to fit |

**Out of scope:**
- iOS and web
- Directions or routing between pins
- Sharing or exporting the map
- Street view or satellite toggle
- Editing pin data from the map screen
- Offline map tiles

---

## 3. User Stories

### 3.1 Browse collection on a map

```
As a collector,
I want to see my pins plotted on a world map,
So that I can explore the geographic spread of my collection visually.
```

**Acceptance criteria:**
- [ ] A "Mapa" tab is visible in the bottom navigation with an `earth-outline` icon (Ionicons)
- [ ] A pin count label is shown on the map screen in the same style as the collection screen — "X de Y pins" where X is plotted pins matching active filters and Y is total geocoded pins; when no filters are active, shows total geocoded pins only
- [ ] Map screen displays all pins that have coordinates as individual markers
- [ ] Nearby markers cluster into a numbered badge automatically; cluster expands on zoom
- [ ] Tapping a pin marker shows a callout with the pin's description and thumbnail (or placeholder if no photo)
- [ ] Tapping the callout navigates to the pin's detail screen
- [ ] Pins without coordinates are not plotted and do not cause errors
- [ ] Map initialises zoomed to fit all plotted pins in the collection

---

### 3.2 Set map position for a pin

```
As a collector,
I want to assign a specific map location to a pin when adding or editing it,
So that it appears in the correct semantic position on the map (stadium, Hard Rock Cafe, city hall, etc.).
```

**Acceptance criteria:**
- [ ] Add pin and edit pin forms include an optional "Posición en mapa" field
- [ ] The field is a place search input (Google Places Autocomplete) — user types a place name and selects from autocomplete results
- [ ] Selecting a place stores its `latitude` and `longitude` on the pin
- [ ] The field is optional — pin can be saved without a map position
- [ ] When editing a pin that already has coordinates, the current place name is shown in the field
- [ ] The place search input supports clearing the selected location

---

### 3.3 Filter pins on the map

```
As a collector,
I want to filter which pins are shown on the map,
So that I can focus on a specific category, country, or year.
```

**Acceptance criteria:**
- [ ] A "Filtrar" button with active filter count badge is visible on the map screen
- [ ] Tapping "Filtrar" opens the filter bottom sheet (same 5 dimensions: Categoría, Subcategoría, País, Ciudad, Año)
- [ ] Applying filters removes non-matching pins from the map
- [ ] When filters are applied, the map auto-zooms to fit the remaining plotted pins
- [ ] "Clear all" resets filters and map returns to full collection view
- [ ] L1 category filter supports multi-select (e.g. Escudo Ciudad + Bandera Ciudad simultaneously)
- [ ] L2 subcategory filter supports multi-select
- [ ] Multi-select is also applied retroactively to the collection list filter sheet

---

## 4. Solution Overview

A new "Mapa" bottom tab added alongside "Colección" and "Stats". The map screen renders all geocoded pins as individual markers using `react-native-maps` (Google Maps on Android) with proximity clustering via `react-native-map-clustering`.

Each pin has a per-pin lat/lng based on its semantic category (stadium for club pins, Hard Rock Cafe for HRC pins, city hall for city emblem pins, etc.). Existing pins are backfilled via a one-time Python script. New pins get coordinates via an optional Google Places Autocomplete field on the add/edit form.

The filter bottom sheet is reused on the map screen. A `multiSelectCategories` prop (default `false`) is added to enable multi-select on L1 and L2 — enabled for both the map screen and the collection list screen.

**Key screens / flows:**

1. **Map tab** — full-screen map with "Filtrar" button overlay. Markers cluster by proximity. Tap marker → callout. Tap callout → pin detail.
2. **Add/Edit form** — new optional "Posición en mapa" field with Google Places Autocomplete. Appears below the existing location fields (country, city, region).

**Edge cases to handle:**
- Pin has no coordinates → not plotted, no error
- All filtered pins have no coordinates → empty state on map ("No hay pins con ubicación para estos filtros")
- Google Places API unavailable → field shows error, pin can still be saved without coordinates
- Single pin remaining after filter → map zooms to that pin at reasonable zoom level (not maximum zoom)
- Cluster tap at max zoom with overlapping pins → standard `react-native-map-clustering` spread behaviour

---

## 5. Technical Considerations

- **Schema change:** Add nullable `latitude FLOAT8` and `longitude FLOAT8` columns to `pins` table — new migration required.
- **Map library:** `react-native-maps` (Google Maps on Android). Requires Google Maps API key in `app.config.js` and new EAS build.
- **Clustering:** `react-native-map-clustering` wraps `react-native-maps` `MapView` — drop-in replacement, no additional native setup.
- **Place search:** Google Places Autocomplete API. Requires enabling "Places API" in Google Cloud Console alongside Maps SDK. API key added to `.env` as `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`.
- **Backfill script:** Separate Python script (parallel session). Reads `pins` + `pin_tags`, applies semantic routing logic, calls Nominatim (free, no key needed for script), writes lat/lng back to DB via Supabase admin client.
- **Filter component:** Extend existing filter bottom sheet with `multiSelectCategories: boolean` prop. When `true`, L1 and L2 chips allow multiple simultaneous selections. Update both collection list and map screen to pass `multiSelectCategories={true}`.
- **Performance:** 477 markers is within `react-native-maps` comfortable range. Clustering handles visual density. No pagination needed.
- **Risks:**
  - Google Maps API key must be restricted to Android app (package name) to prevent misuse
  - `react-native-maps` requires a new EAS build — cannot hot-reload this change
  - Google Places Autocomplete has a 2-field minimum input before triggering — handle gracefully in UX
  - `react-native-map-clustering` version compatibility with current `react-native-maps` version — verify before installing

---

## 6. UX Considerations

- **Key interaction:** Tapping a cluster → zoom in → individual markers appear → tap marker → callout → tap callout → pin detail. Must feel smooth and fast.
- **Map initialisation:** On first open, fit all plotted pins. On return from pin detail, restore previous map position and zoom level (same scroll preservation pattern as collection list).
- **Callout design:** Consistent with app's dark theme. Show collection number, description (truncated to 1 line), and thumbnail (40×40, rounded). Chevron → to indicate tappable.
- **"Posición en mapa" field UX:** Debounced autocomplete (300ms). Dropdown shows place name + subtitle (city/country from Google). Selected state shows place name with a clear (×) button. No map preview in the form — keep the form lean.
- **Error states:**
  - Google Places unavailable → "No se pudo cargar el buscador de ubicaciones. La posición no se guardará."
  - Map fails to load → "No se pudo cargar el mapa. Comprueba tu conexión."
- **Empty states:**
  - No pins with coordinates → full-screen message: "Ningún pin tiene ubicación todavía. Edita un pin para añadir su posición en el mapa."
  - Filters applied, no matching pins with coordinates → "No hay pins con ubicación para estos filtros."
- **Accessibility:** Callout tap target minimum 44×44pt. Map controls (zoom buttons) not required — pinch-to-zoom is standard.

---

## 7. Open Questions

No open questions.

---

## 8. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-28 | Per-pin lat/lng on `pins` table (not city-level lookup table) | Semantic positioning means two pins in the same city can have different coordinates (stadium vs HRC vs city hall) — per-pin is the only model that supports this |
| 2026-03-28 | Geocoding via Google Places Autocomplete field on form | User controls the exact semantic location; more accurate than automated routing for specific POIs like stadiums and Hard Rock Cafes |
| 2026-03-28 | Backfill existing pins via script (parallel session) | 477 pins need coordinates before the map is useful; automated best-effort script handles the majority, user corrects outliers via edit form |
| 2026-03-28 | Pins without coordinates hidden from map | Graceful degradation — partial data is better than blocking the feature |
| 2026-03-28 | One marker per pin with proximity clustering | Per-pin semantic coords means city-grouping is no longer clean; clustering handles visual density naturally |
| 2026-03-28 | Callout → tap → pin detail (not inline edit) | Map is a browsing surface, not an edit surface; detail screen is the established pattern |
| 2026-03-28 | Mapa as third bottom tab with `earth-outline` icon | Map is a distinct browsing mode, same hierarchy as Colección and Stats; globe icon reflects geographic spread better than a folded map |
| 2026-03-28 | Filter bottom sheet reused on map screen with auto-zoom | Consistency with collection list; auto-zoom to filtered set makes spatial filtering immediately useful |
| 2026-03-28 | Multi-select L1 + L2 categories via `multiSelectCategories` prop | Single-select was a limitation, not a design choice; prop-controlled approach keeps one component, enables rollout to collection list simultaneously |
| 2026-03-28 | react-native-maps + react-native-map-clustering | Industry standard for React Native maps on Android; clustering is a drop-in wrapper with no additional native setup |

---

## 9. Launch Checklist

- [ ] Acceptance criteria met for all user stories
- [ ] Map renders correctly on physical Android device
- [ ] Clustering behaviour tested at various zoom levels
- [ ] Callout → pin detail navigation tested
- [ ] Place search field tested on add and edit forms
- [ ] Filters tested on map screen — plotted pins update and map auto-zooms
- [ ] Multi-select categories tested on both map and collection list filter sheets
- [ ] Empty state shown when no pins have coordinates
- [ ] Empty state shown when filters produce no geocoded results
- [ ] Google Maps API key restricted to app package name
- [ ] No secrets committed to repo
- [ ] Security rules applied (see `docs/security-rules.md`)
- [ ] New EAS build triggered and tested (react-native-maps requires native build)
