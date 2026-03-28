# PRD: Collection Stats Screen

**Status:** Approved
**Author:** Oscar
**Date:** 2026-03-24
**Version:** 1.0

---

## 1. Problem Statement

- **User pain:** The collection is 477 pins and growing — but there's no way to see the shape of it at a glance. How many countries? Which categories dominate? How has it grown over the years?
- **Current workaround:** None. The data exists in the database but is invisible to the user.
- **Why this matters:** A catalogue without summary intelligence is just a list. Stats turn the collection into something the user can understand and reflect on.

---

## 2. Goals

| Goal | Metric | Target |
|------|--------|--------|
| Surface collection-level insights | Key stats visible without scrolling | Summary row always above the fold |
| Make category and geography distribution legible | User can see top categories and countries at a glance | All sections render correctly on device |

**Out of scope:**
- Filtered stats (stats always reflect the full collection, not active filters)
- Drill-down navigation (tapping a bar does not filter the collection list — v2)
- Export or sharing of stats
- Per-tag or per-city granularity beyond country
- Pins without photos count

---

## 3. User Stories

### 3.1 Overview stats

```
As a collector,
I want to see a high-level summary of my collection,
So that I can understand its size and breadth at a glance.
```

**Acceptance criteria:**
- [ ] Stats screen is accessible via a tab bar (bottom navigation) — second tab alongside the collection list
- [ ] Summary row shows: total pins, total countries, total cities, year range (earliest–latest acquired_year)
- [ ] Each summary stat is displayed as a large bold number with a label below
- [ ] Stats always reflect the full collection, regardless of any filters active on the collection screen

---

### 3.2 Category breakdown

```
As a collector,
I want to see how my pins are distributed across categories,
So that I can understand which themes dominate my collection.
```

**Acceptance criteria:**
- [ ] A "Categories" section shows all L1 tags ranked by pin count, with an animated horizontal fill bar and count
- [ ] Each L1 row is tappable to expand/collapse its L2 subcategory breakdown
- [ ] L2 subcategories are shown indented below their L1, also with bar fills and counts
- [ ] L2 bars are relative to the L1 total (not the whole collection)
- [ ] L1 rows collapsed by default — only one section expanded at a time
- [ ] Pins with no category tags are shown as "Sin categoría" at the bottom

---

### 3.3 Geographic breakdown

```
As a collector,
I want to see which countries are most represented in my collection,
So that I can see the geographic spread.
```

**Acceptance criteria:**
- [ ] A "Countries" section shows the top 10 countries ranked by pin count, with animated bar fills and counts
- [ ] Each bar fill is relative to the top country (not the total), so the #1 bar is always full-width
- [ ] A "and X more countries" label is shown if there are more than 10 countries

---

### 3.4 Year distribution

```
As a collector,
I want to see how my collection is distributed over time,
So that I can understand when most pins were acquired.
```

**Acceptance criteria:**
- [ ] A "By year" section shows all years with at least one pin, in chronological order
- [ ] Each year row shows the year label, an animated bar fill, and the count
- [ ] Bars are relative to the peak year
- [ ] Pins with no acquired_year are shown as "Sin año" at the bottom of the section

---

## 4. Solution Overview

A new Stats screen added as a second tab in a bottom tab bar. The collection list becomes the first tab. Stats always reflect the full collection.

**Visual design direction: Revolut-inspired dark mode**
- Dark card surfaces matching existing `surface` tokens
- Large, bold white numbers for summary stats
- Mixed chart types per section (see below)
- Accent-coloured fills and SVG segments using `accent.DEFAULT` and `accent.muted` tokens
- All charts animate in on mount; bars stagger per row
- Clean section headers with subtle dividers
- Expandable L1 rows with smooth height animation on expand/collapse

**Chart types per section:**
| Section | Chart type |
|---|---|
| Summary | Stat cards — large bold number + label |
| Categories (L1) | Donut/ring chart — SVG circles, segments animate on mount |
| Categories (L2) | Horizontal bar rows (on L1 expand), relative to L1 total |
| Countries | Horizontal bar chart, relative to top country |
| By year | Vertical column chart — SVG rects, relative to peak year |

**Screens / flows:**
1. **Tab bar** — bottom navigation with two tabs: collection (list icon) and stats (bar-chart icon). Replaces the current headerless single-screen layout.
2. **Stats screen** — single scrollable screen with four sections: Summary, Categories, Countries, By Year.

**Data fetching:**
- All stats computed via a single Supabase RPC or composed client-side from two queries:
  - `pins` table: country, city, acquired_year (for summary + geo + year sections)
  - `pin_tags` + `tags`: pin_id, L1 name, L2 name (for category section)
- Fetched once on mount; no real-time subscription needed

**Edge cases:**
- Pins with no country → excluded from country count and "Countries" section
- Pins with no acquired_year → shown as "Sin año" in the year section
- Pins with no tags → counted under "Sin categoría" in the category section
- Collection is empty → empty state with illustration and prompt to add the first pin

---

## 5. Technical Considerations

- **react-native-svg required** — needed for donut and column charts. Native module — requires a new EAS build. Expected since stats is a new feature branch.
- **Charts built from SVG primitives directly** — no charting library. Donut = two SVG circles. Columns = SVG rects. Full design control, no library defaults to override.
- **Tab bar:** `expo-router` supports tab layouts natively via `app/(tabs)/` — restructure routing to use a tabs layout. This is a file-system change, not a new dependency.
- **Bar animations:** `useSharedValue` + `useAnimatedStyle` from Reanimated for horizontal bar width. Animate from 0 to target percentage on mount using `withTiming` with staggered delay per row.
- **Donut animation:** SVG `stroke-dashoffset` animated via Reanimated `useAnimatedProps` — segments draw in on mount.
- **Column chart animation:** SVG rect height animated from 0 on mount.
- **Data:** Client-side aggregation is fine at 477 pins. No need for a Supabase RPC — fetch pins + pin_tags/tags and aggregate in JS.
- **Performance:** Memoize aggregation results with `useMemo`. Stats screen refetches on tab focus via `useFocusEffect` to stay in sync after pin adds/deletes.
- **Routing restructure:** Current `app/(app)/index.tsx` becomes `app/(app)/(tabs)/index.tsx`. Existing deep links (pin detail, edit) are unaffected — they live outside the tabs layout.

---

## 6. UX Considerations

- **Key interaction:** Bar animations on mount. Bars should animate in with a staggered delay per row (e.g. 50ms between rows) — this is what makes it feel premium, not just a static list.
- **Expandable categories:** L1 rows expand with a smooth height animation (LayoutAnimation or Reanimated layout transition). Chevron icon rotates on expand.
- **Empty states:** If collection is empty, show a single card with a message — don't render broken empty sections.
- **Error states:** If the fetch fails, show a retry button — don't leave the screen blank.
- **Accessibility:** Tab bar icons must have accessible labels. Minimum tap target 44×44pt on expandable rows.

---

## 7. Open Questions

None — all design decisions resolved before writing this PRD.

---

## 8. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-24 | Stats always show full collection, not filtered | Simpler implementation; filtered stats deferred to v2 when the value is clearer |
| 2026-03-24 | react-native-svg, no charting library — custom SVG primitives | Full design control for Revolut-style look; donut + columns are simple SVG shapes. New EAS build expected for this feature anyway. |
| 2026-03-24 | Client-side aggregation over Supabase RPC | 477 pins is trivial to aggregate in JS; RPC adds complexity with no benefit at this scale |
| 2026-03-24 | Tab bar navigation over header icon | Stats is a first-class view, not a utility. Tab bar is the right structural pattern. |
| 2026-03-24 | L1 expandable to show L2 breakdown | Full category picture without overwhelming the screen by default |

---

## 9. Launch Checklist

- [ ] Acceptance criteria met for all user stories
- [ ] Tab bar renders correctly and navigates between collection and stats
- [ ] Bar animations play correctly on mount
- [ ] L1 expand/collapse works with smooth animation
- [ ] All sections render correct data against known collection (spot-check a few values)
- [ ] Empty states tested
- [ ] Error state (fetch failure) tested
- [ ] Tested on physical Android device
- [ ] No secrets committed to repo
- [ ] Security rules applied (see `docs/security-rules.md`)
