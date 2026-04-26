<!-- Memory class: FULL_RECORD -->

# W122-T1 Entry Surface Inventory

> Date: 2026-04-27
> Produced by: CP0 pre-flight
> Authorization: GC-018 W122-T1

---

## 1. Entry Surface Inventory (file + line range + role)

### UI Layer

| Surface | File | Lines | Current First-Run Role | W122 Classification |
|---|---|---|---|---|
| Home page | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/home/page.tsx` | 818 | Template gallery browse + quick-try path + starred handoff handler | **Primary** — hosts browse gallery and will host the intent-first CTA banner behind feature flag; implementation body extracted to `IntentEntry.tsx` |
| QuickStart | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/QuickStart.tsx` | 268 | 3-step onboarding: provider select → intent describe → confirm routing | **Canonical front door** — upgraded to consume `intent-router.ts`, becomes dominant first-run CTA |
| SkillPlanner | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SkillPlanner.tsx` | 291 | Independent skill-plan generator (industry-based CSV rules) | **Browse** — retained unchanged; not on primary intent-first path |
| TemplateSuggester | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/TemplateSuggester.tsx` | 95 | Inline template suggestion widget | **Supporting** — remains available; not on primary intent-first path |
| OnboardingTour | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/OnboardingTour.tsx` | 147 | 3-step modal: templates → governance → provider | **Supporting** — updated to reference QuickStart as the next step, not raw template gallery |
| Skill library | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/skills/page.tsx` | ~300 | Skill catalog browse | **Browse** — repositioned (CP3): CTA copy points back to intent-first path |
| Skill detail | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/skills/[id]/page.tsx` | — | Skill detail + linked guided form | **Browse** — retained, forms still accessible; catalog not mandatory at first touch |

### Library Layer (three parallel routing surfaces → resolved by CP1)

| Module | File | Lines | Concern | W122 Role |
|---|---|---|---|---|
| `intent-detector.ts` | `src/lib/intent-detector.ts` | 211 | Phase/risk/suggestedTemplates classifier | **Dependency** of `intent-router.ts`; unchanged |
| `governed-starter-path.ts` | `src/lib/governed-starter-path.ts` | 97 | Wizard handoff serializer + `STARTER_TEMPLATE_MAP` | **Dependency** of `intent-router.ts`; unchanged |
| `skill-planner.ts` | `src/lib/skill-planner.ts` | 299 | Industry-based multi-skill plan generator | **Browse-only**; not touched in W122 |
| `intent-router.ts` | `src/lib/intent-router.ts` | NEW | Routing facade — source of truth for W122 | **Source of truth** |

---

## 2. GC-023 Pre-flight Decision

**`home/page.tsx` — 818 lines (hard threshold: 1000)**

Decision: **EXTRACT `IntentEntry.tsx`** as a sibling component.

- Current: 818 lines (between soft 700 and hard 1000)
- W122 CP2 would add ~40 lines of intent-first CTA to Home
- Projected without extraction: ~858 lines (still under hard threshold 1000)
- However, CP2 also modifies existing QuickStart wiring → conservatively extract `IntentEntry.tsx` to keep Home lean and respect the pattern contract
- `IntentEntry.tsx` will be a new component (~60-80 lines) hosting the intent-first banner/CTA; Home imports and renders it conditionally behind the feature flag
- No GC-023 exception is required; extraction prevents reaching the hard threshold

**Other files modified in W122:**

| File | Current Lines | Projected Lines | Status |
|---|---|---|---|
| `QuickStart.tsx` | 268 | ~310 | Under soft threshold (700) — OK |
| `OnboardingTour.tsx` | 147 | ~160 | Well under threshold — OK |
| `intent-router.ts` | NEW | ~90 | New file — well under threshold |
| `IntentEntry.tsx` | NEW | ~80 | New file — well under threshold |
| `skills/page.tsx` | ~300 | ~320 | Well under threshold — OK |

---

## 3. Feature Flag Declaration

Feature flag: `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR`

- **Default during build:** `false` (off — preserves current behavior bit-identical)
- **Set to `true`** only after CP4 (evidence parity) + CP5 (live evidence pack) close
- Rollback: flip flag to `false` — no code revert needed
- Client-visible by default (C2 from roadmap §0.6)
- Checked in: `intent-router.ts` (returns `null` when flag is false), `IntentEntry.tsx` (renders nothing when flag is false)

---

## 4. Source-of-Truth Declaration

- `src/lib/intent-router.ts` — NEW facade, routing source of truth for W122
- `src/lib/intent-detector.ts` — becomes `intent-router.ts` dependency (unchanged)
- `src/lib/governed-starter-path.ts` — becomes `intent-router.ts` dependency (unchanged)
- `src/lib/skill-planner.ts` — browse-only, NOT touched in W122

---

## 5. Onboarding Component Census

| Component | localStorage key | Current behavior |
|---|---|---|
| `OnboardingTour.tsx` | `cvf_onboarding_seen` | 3-step modal: fires 600ms after mount on first session |
| Setup banner (Home) | `cvf_setup_banner_dismissed` | Dismissable readiness banner |
| `QuickStart.tsx` | (no localStorage key — stateless multi-step modal) | Triggered by external `onComplete` callback |

All three surfaces are unified in CP2 to reference the same `intent-router.ts` routing core.
