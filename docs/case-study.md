# Case Study: Pins Inventory

**Role:** Product Manager + Builder
**Timeline:** March 2026 → In Progress
**Stack:** React Native, Expo, Supabase, TypeScript
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
1. Sign up / log in
2. Add a pin: take photo, add name, optional notes
3. View collection as a photo grid
4. Tap a pin to see detail

**Key screens:**
- [To be added with screenshots]

---

## 5. Technical Challenges

### NativeWind v4 dependency chain

NativeWind v4 has an underdocumented dependency chain that caused multiple EAS build failures before the root cause was identified. Installing `nativewind` alone is not enough — it requires `react-native-css-interop`, `react-native-reanimated`, and `react-native-worklets` to be installed explicitly. The reanimated Babel plugin also calls into worklets at build time, so both packages must be present or the autolinking step fails silently with a non-obvious error.

Additionally, the `nativewind/babel` plugin cannot be used as a standard Babel plugin in newer versions of `@babel/core` — it returns a preset-like object rather than a plugin. The fix was to reference `react-native-css-interop/dist/babel-plugin` directly.

**Lesson:** When using NativeWind v4, install the full dependency chain upfront and verify the babel config before triggering a cloud build.

### Metro bundler — nested semver module resolution failure

After installing `react-native-reanimated`, Metro failed to bundle with an `UnableToResolveError` for `../internal/parse-options` inside a nested `semver` package at `node_modules/react-native-reanimated/node_modules/semver/`. The nested `semver` installation was incomplete — missing its `internal/` directory. Metro was resolving to the nested copy instead of the root `semver`.

**Fix:** Delete the broken nested package (`rm -rf node_modules/react-native-reanimated/node_modules/semver`) and restart Metro with `--clear`. Metro then falls back to the complete root installation.

### Magic link deep linking in React Native

Supabase magic links redirect to a URL containing the session tokens in the URL fragment (`#access_token=...&refresh_token=...`). On web, Supabase handles this automatically via `detectSessionInUrl`. In React Native, `window.location` doesn't exist, so this detection does nothing.

The solution was to listen for incoming deep links in the root layout using `expo-linking`, parse the URL fragment manually with `URLSearchParams`, and call `supabase.auth.setSession` with the extracted tokens. The Supabase `onAuthStateChange` listener in `useAuth` then fires, updating the session state and triggering navigation to the authenticated screen.

Additionally, the `emailRedirectTo` option must be set explicitly to the app's custom scheme (`pins-inventory://`) in the `signInWithOtp` call, and that scheme must be whitelisted in the Supabase project's allowed redirect URLs — otherwise Supabase defaults the redirect to `localhost:3000`.

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

- **Repo:** https://github.com/osdiego97/pins-inventory
- **Live app / demo:** [TestFlight link — TBD]
- **PRDs:** `docs/` folder in this repo
