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
