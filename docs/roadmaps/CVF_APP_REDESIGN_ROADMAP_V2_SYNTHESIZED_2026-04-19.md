# CVF App Redesign — Synthesized Implementation Roadmap (v2)

**Date:** 2026-04-19
**Status:** IMPLEMENTATION-READY — supersedes `CVF_APP_REDESIGN_PLAN_2026-04-19.md`
**Scope:** UI-only redesign of dashboard pages + modals to match `App onboarding/*.jsx` mockups
**Memory class:** SUMMARY_RECORD (GC-022)
**Governance class:** PRESENTATION_REFACTOR (proposed) — treated as REALIZATION with zero-logic contract
**Supersedes:** `docs/roadmaps/CVF_APP_REDESIGN_PLAN_2026-04-19.md` (draft) + two critiques embedded therein

---

## 0. How this doc was produced

This roadmap is the **synthesis of two independent critiques** of the original draft plan:

1. **Governance critique** (Cascade, this session): flagged missing tranche IDs, GC-018 authorization, scope overload (18+ files = 5 tranches worth), missing evidence plan, unresolved blockers in "Open Questions".
2. **Technical critique** (independent agent, embedded in original plan lines 304–383): verified actual line counts (all files < 1000), identified build-order dependency via `layout.tsx` imports, cleared SVG SSR compatibility, produced 5 explicit implementation conditions.

Where the two critiques **agreed** (sidebar = partial logic change, Phase C Multi-Agent is risky, dark mode unclear, line counts must be verified) → adopted verbatim.

Where they **disagreed** (governance wrapper necessity, scope split, Modal-vs-Page status) → resolved below in §2 "Binding Decisions".

Where one agent caught what the other missed → both insights incorporated:

- Technical agent's **build-order fix** (A→B→E→C→D) is adopted.
- Governance agent's **5-tranche split** is adopted.

---

## 1. Governance envelope

| Field | Value |
| --- | --- |
| Parent workline | Post-W104 UI Modernization |
| Tranche family | W105 — W109 (5 tranches, sequential) |
| Authorization | Each tranche requires its own GC-018 packet before CP1 |
| Class | REALIZATION (UI-only variant) — no backend/schema/test-contract changes |
| Evidence class | SUMMARY_RECORD per tranche (GC-022) |
| Closure artifact | GC-026 tracker sync + AGENT_HANDOFF.md entry |
| Baseline to preserve | cvf-web: **2070 passed / 35 skipped / 0 failures** (147 test files) — post-commit `5d3242a6` |
| Forbidden surfaces | `src/lib/`, `src/app/api/`, `middleware.ts`, `auth.ts`, `package.json`, `(dashboard)/layout.tsx` (see §2.1 exception) |

---

## 2. Binding decisions (blockers resolved)

### 2.1 `layout.tsx handleNavigate` — SCOPED EXCEPTION GRANTED

Original plan forbade touching `(dashboard)/layout.tsx`. Technical agent correctly identified that adding `Knowledge` and `Enterprise` as new Sidebar nav items requires new `case` entries in `handleNavigate`.

**Decision:** `layout.tsx` is allowed **only** under W105-T1 (Sidebar tranche), limited to:

- Adding `case` entries in `handleNavigate` for new nav items (max 2 new cases: `knowledge`, `enterprise`).
- No changes to modal mount logic, state shape, or imports.

Any edit beyond this = **tranche scope violation** → STOP and reopen GC-018.

### 2.2 Modal vs Page (Context / Settings / AI Usage) — KEEP AS MODALS

Original plan kept them as modals. Technical agent confirmed this is correct for minimal-change approach. Governance agent initially flagged as blocker but conceded on re-read.

**Decision:** Modals stay. Mockup shows full-page layouts but we implement them as modal overlays with the same visual tokens (dark bg, gradient avatar, etc.). No route changes.

### 2.3 Knowledge URL — NO CHANGE

App Onboarding groups Knowledge under "AI", but its route stays at `/governance/knowledge`. Sidebar nav item label is "Knowledge" (no URL change).

**Decision:** Nav grouping is purely visual; URL preserved; no redirect needed.

### 2.4 Enterprise page — OUT OF SCOPE

Admin pages (`/admin/*`) are excluded from the entire W105–W109 wave. The Sidebar "Enterprise" entry points to existing `/admin/team` route unchanged. No visual redesign of admin pages in this roadmap.

### 2.5 Phase C Multi-Agent SVG canvas — STYLE-ONLY FENCE

**Decision:** W107-T1 (AI Modals) Multi-Agent scope is restricted to:

- Colors, box dimensions, fonts, badge styles, status dot colors.
- Node positioning algorithm: **DO NOT TOUCH**.
- Edge drawing logic: **DO NOT TOUCH**.

If visual redesign would require repositioning nodes → stop, split into a separate REALIZATION tranche. This is a hard fence.

### 2.6 Chart library — SVG-ONLY (NO RECHARTS)

Technical agent cleared `<svg>`/`<polyline>`/`<rect>`/`<circle>` as SSR-safe in React 19 / Next.js 16. No new dependency added.

**Constraint:** Charts are **static-only**. No hover tooltips, no click handlers, no DOM-event listeners. If interaction is ever needed → separate tranche with `'use client'` boundary.

### 2.7 Dark / Light mode parity — DARK IS PRIMARY, LIGHT MUST WORK

Mockup is dark-primary. Current CVF app supports both.

**Decision:**

- Dark mode = visual source of truth (match mockup).
- Light mode = must not break; acceptable if slightly less polished.
- All SVG chart colors use `currentColor` or Tailwind `dark:` variants — no hardcoded hex that only works in dark.
- No theme toggle changes.

### 2.8 i18n footer switcher (VI · EN) — COSMETIC PLACEHOLDER

**Decision:** Render the VI · EN pill as a **non-functional visual element** (disabled, tooltip "Coming soon"). Do not wire to i18n config. Any real i18n wiring = separate tranche.

### 2.9 `CompactHeader.tsx` — INCLUDED IN W105-T1

Technical agent caught this was missing. Included in Sidebar tranche since they share the top-of-app visual surface.

---

## 3. Pre-flight checklist (must complete BEFORE W105-T1 CP1)

```text
[ ] Run `wc -l` on these files, record in CP1 audit:
    - src/components/Sidebar.tsx           (known: 359)
    - src/app/(dashboard)/layout.tsx        (known: 311)
    - src/components/CompactHeader.tsx      (verify)
    - src/components/AgentChatWithHistory.tsx (known: 149)
    - src/components/MultiAgentPanel.tsx    (known: 658 — 66%)
    - src/components/AIUsagePanel.tsx       (known: 414)
    - src/components/ToolsPage.tsx or equivalent (verify path + count)
    - src/components/SettingsPage.tsx or equivalent (verify path + count)
    - src/components/UserContextForm.tsx    (verify count)

[ ] Confirm exception registry: no entries needed (all files < 1000 verified above)

[ ] cvf-web baseline lock:
    - npx vitest run                        → 2070 passed / 35 skipped / 0 failures
    - npx tsc --noEmit                      → 0 errors
    - npm run build                         → green
    - npm run lint                          → clean

[ ] Record behavior-preservation baseline before any redesign:
    - Sidebar navigation map (which item opens which route/modal)
    - Modal trigger inventory from `(dashboard)/layout.tsx`
    - Existing loading / empty / error / disabled states for touched surfaces
    - Capture at least one before-run screen/video for AI Agent modal + one non-AI page

[ ] Capture screenshots of all 18 existing pages/modals (dark + light)
    → stored as "before" evidence under docs/evidence/W105_UI_BASELINE/

[ ] Confirm Alibaba live-test lane is available for post-redesign proof:
    - canonical env: `ALIBABA_API_KEY`
    - compatibility aliases still accepted: `CVF_BENCHMARK_ALIBABA_KEY`, `CVF_ALIBABA_API_KEY`
    - operator has pre-authorized agents to use the configured Alibaba key + existing configured model set for live validation; no repeated permission ask is needed if env/config is already present
    - standardized fallback now treats `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env.local` as the canonical local config source for Vitest + benchmark/PVV runners when shell env is empty
    - do not start tranche closure work if the operator explicitly expects live proof and no live key is configured
```

Any failure here → STOP. Do not start W105-T1.

---

## 4. Tranche split (5 sequential tranches)

### Corrected build order (from technical agent)

```text
W105-T1  Sidebar + layout handleNavigate (exception §2.1)
   ↓
W106-T1  Workspace pages    (Home, Skills, Skill Search, Help, Docs)
   ↓
W107-T1  Account modals     (Context, Settings, AI Usage) — MODALS FIRST (lowest risk, in-place signatures)
   ↓
W108-T1  AI modals          (AI Agent, Multi-Agent§2.5, Tools) — in-place signatures only
   ↓
W109-T1  Platform pages     (History, Analytics, Marketplace, Governance, Simulation, AI Safety)
```

**Rationale:** Components imported by `layout.tsx` (W107, W108) must keep their **exported signature frozen** — no prop rename, no new required props. If W108 breaks, W109 page builds also fail because `layout.tsx` can't compile. Doing modals before Platform pages ensures the dependency chain stays compilable.

### Per-tranche summary

| Tranche | Surface | Files touched | New files | Est. effort | Depends on |
| --- | --- | --- | --- | --- | --- |
| W105-T1 | Sidebar + CompactHeader + layout.tsx §2.1 | 3 | 0–2 (`SidebarNavItem`, `SidebarNavGroup`) | Medium | Pre-flight §3 |
| W106-T1 | Workspace pages (5) | 5 | 3–6 (category filter, template card, etc.) | Large | W105 |
| W107-T1 | Account modals (3) | 3 | 1–3 | Medium | W105 |
| W108-T1 | AI modals (3) — Multi-Agent §2.5 fenced | 3 | 2–4 | Medium-High | W107 |
| W109-T1 | Platform pages (6) | 6 | 4–8 | Large | W108 |

**Total:** 20 core file edits + ~10–23 new sub-components across **5 independent tranches**, each with its own GC-018 + CP1 + closure review.

---

## 5. Per-tranche implementation contract

Every tranche MUST follow this contract. Agent implementing the code cannot skip any step.

### 5.1 CP0 — Authorization (before any edit)

1. Draft GC-018 authorization: `docs/baselines/CVF_GC018_W10X_T1_<SURFACE>_AUTHORIZATION_2026-04-19.md`
   - Class: REALIZATION (UI-only variant)
   - Binding constraints: forbidden surfaces from §1, scope fences from §2
   - Expected test delta: **0** (UI-only, no new unit tests required unless component contract changes)
   - Expected regression: **0** (baseline must hold)
2. Human/operator signs off the GC-018 before CP1.

### 5.2 CP1 — Implementation

Per file touched:

1. `wc -l <file>` before editing. If ≥ 700 lines (advisory) or ≥ 1000 (hard) → plan sub-component extraction first.
2. Make visual changes. Forbidden in this pass:
   - Any change to imports from `@/lib/*` or `@/app/api/*`.
   - Any change to component **exported signature** (prop names, types, required-ness).
   - Any change to hooks or their dependency arrays.
   - Adding new state beyond pure UI state (open/closed, hovered, selected tab visual).
3. `npm run build` after each file. Revert if fail.
4. Commit per logical unit (one file + its sub-components), message `W10X-T1 CP1: <surface> visual sync`.

### 5.3 Verification Tier Classification

Redesign tranches do **not** all require the same verification depth. Agents must classify each tranche into `Tier A` or `Tier B` before running CP2 and record that classification in the tranche audit / closure packet.

**Tier A — Presentation-only tranche**

Use `Tier A` only when **all** of the following remain true:

- edits stay inside the zero-logic contract
- changes are limited to Tailwind classes, static SVG, JSX structure, spacing/typography/color, and purely cosmetic local UI state
- no exported component signature changes
- no route change, modal wiring change, submit/save/cancel wiring change, or shared runtime behavior change
- no touched surface requires layout/state/hook reasoning beyond presentation

**Tier B — Elevated verification tranche**

Escalate to `Tier B` if **any** of the following are true:

- tranche touches `(dashboard)/layout.tsx` even under the narrow sidebar exception
- tranche changes navigation wiring, modal wiring, or any route-trigger mapping
- tranche changes conditional rendering that may affect behavior, not just appearance
- tranche touches shared components with broad reuse and meaningful existing test coverage
- tranche changes form affordances in a way that could affect submit/save/cancel/disabled behavior
- targeted tests fail, or there is any ambiguity that the tranche is still presentation-only
- operator explicitly asks for full-suite evidence for that tranche

`W105-T1` should be presumed `Tier B` by default because it touches sidebar wiring + `layout.tsx`.
`W106-T1`, `W107-T1`, `W108-T1`, `W109-T1` may use `Tier A` only if their actual edits stay within the fence above.

### 5.4 CP2 — Verification

```bash
# Always required
npx tsc --noEmit                   # 0 errors
npm run lint                       # clean
npm run build                      # green
```

**Tier A minimum proof**

```bash
# Run only when related tests exist for touched surfaces
npx vitest run <targeted test files>
```

- Targeted Vitest is sufficient for `Tier A`; do **not** default to full-suite for CSS-only / presentation-only tranches.
- If no relevant test files exist for the edited surfaces, `tsc + lint + build + manual behavior proof` is acceptable for `Tier A`.

**Tier B minimum proof**

```bash
npx vitest run                     # full baseline preservation
```

- `Tier B` must preserve the known shared baseline unless a newer explicit baseline replaces it in repo truth.
- If a tranche begins as `Tier A` but drifts into any `Tier B` trigger, stop and rerun CP2 as `Tier B`.

**Manual QA checklist per tranche**
- Open each edited page/modal in dev server
- Toggle dark ↔ light — both render without broken styling (dark = polished, light = functional)
- Chrome DevTools 375px mobile — no horizontal scroll, no overflow
- Keyboard focus states visible (tab through nav, inputs, buttons)
- No console errors on mount

**Behavior Preservation Matrix — mandatory per touched surface**

- Navigation behavior preserved:
  - each redesigned sidebar/header entry still opens the same existing route or modal as before
  - no broken deep-link path, no accidental route rename, no admin route exposure change
- Modal behavior preserved:
  - open / close / overlay dismiss / escape key / focus trap behavior unchanged
  - exported component signatures unchanged for layout-imported modals
- State behavior preserved:
  - loading, empty, error, disabled, and success states still render and remain understandable after restyling
  - no hidden call-to-action because of contrast, overflow, or collapsed containers
- Form behavior preserved:
  - existing save/submit/cancel buttons still trigger the same old flow
  - redesign must not swallow native submit, keyboard submit, or validation visibility
- Runtime-entry behavior preserved:
  - AI Agent entry still reaches governed execute path
  - Knowledge entry still reaches existing knowledge surface
  - Simulation / governance / usage panels still mount without runtime exceptions

**Alibaba live validation — required proof, not optional narrative**

- For `W108-T1` (AI modals) and `W109-T1` (Platform pages), closure is incomplete without rerunning the Alibaba live smoke lane when operator-provided credentials are available.
- Use the existing configured Alibaba model lane for proof. Do not block on asking for fresh permission if the env/config is already present; the operator has pre-authorized this test use because the Alibaba free-token lane is the preferred validation path.
- Minimum route-level live evidence:
  - `src/app/api/execute/route.dlp.live.test.ts`
  - `src/app/api/execute/route.retrieval.live.test.ts`
  - `src/app/api/governance/knowledge/benchmark.live.test.ts`
- These runs are required because "UI-only" is a design intent, not proof. The redesign wave must show that provider-backed governed execution still works with real Alibaba connectivity after the visual refactor.
- Record results in the tranche audit/closure packet with exact pass/skip status and the reason for any skip.

**Recommended manual live UI smoke after AI-facing redesign**

- From the redesigned shell, open AI Agent and complete one real Alibaba-backed prompt/response round-trip.
- From the redesigned navigation, open Knowledge and confirm the surface mounts cleanly with no console/runtime error.
- If follow-up or simulation entrypoints are part of the touched tranche, run one visible smoke interaction there too.

Capture "after" screenshots into `docs/evidence/W10X_UI_AFTER/` for closure packet.

### 5.5 CP3 — Closure

1. Closure review doc: `docs/reviews/CVF_W10X_T1_TRANCHE_CLOSURE_REVIEW_2026-04-19.md`
2. GC-026 sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W10X_T1_CLOSED_2026-04-19.md`
3. `AGENT_HANDOFF.md` — add row to "Last Tranches Closed" table with:
   - Commit hash
   - verification tier used (`Tier A` or `Tier B`)
   - exact verification commands/results run for that tier
   - Before/after evidence paths
   - Next tranche pointer
4. Commit with hook pass (`.githooks/pre-commit` enforces GC-023 + docs governance).

---

## 6. Implementation rules (hard constraints for every agent)

Copy this block into each CP1 work order:

```text
ZERO-LOGIC CONTRACT
-------------------
FORBIDDEN EDITS:
- src/lib/**                    (business logic, adapters, AI providers)
- src/app/api/**                (routes, handlers)
- middleware.ts, auth.ts
- package.json, package-lock.json, tsconfig.json
- vitest.config.ts, next.config.ts
- (dashboard)/layout.tsx        (except W105-T1 §2.1 narrow exception)
- Any *.test.ts / *.test.tsx    (do not touch tests; if a test breaks, the visual change is wrong)
- Component exported signatures (no prop rename, no new required props)
- useEffect / useState / useMemo / useCallback dependency arrays (keep shape)

ALLOWED EDITS:
- Tailwind classes, inline styles, CSS variables
- JSX structure (reordering, wrapping in new containers, adding decorative elements)
- Local-only UI state (hover/open/selected) if and only if purely cosmetic
- Extracting sub-components to keep files under GC-023 thresholds
- Adding new component files under the same route/modal tree
- SVG markup for static charts

SCOPE FENCES:
- Sidebar: max 2 new handleNavigate cases in layout.tsx (knowledge, enterprise)
- Multi-Agent: node positioning algorithm untouched (style-only)
- Charts: static only, no hover/tooltip interactivity
- i18n: footer VI·EN is cosmetic placeholder (disabled)

STOP CONDITIONS:
- Any test that was passing now fails → REVERT, do not "fix" the test
- tsc --noEmit produces any new error → REVERT
- An edit requires touching a forbidden surface → STOP, reopen GC-018
- A file would cross GC-023 hard threshold (1000 lines) after edit → extract sub-component FIRST
```

---

## 7. Rollback policy

Per phase:

1. Each tranche starts on a fresh branch: `ui/w10X-<surface>`.
2. Commits are atomic per file + sub-components.
3. If `npm run build` or `vitest` fails mid-phase:
   - `git reset --hard HEAD~1` if last commit caused it.
   - `git stash` in-flight changes, investigate, decide keep/drop.
4. Never merge to `main` until CP3 closure is signed.
5. Baseline guard: `main` must always hold **2070 passed / 35 skipped / 0 failures**. A merge that drops this baseline is an automatic revert.

---

## 8. Evidence plan (per tranche)

| Artifact | Class | Location |
| --- | --- | --- |
| GC-018 authorization | POINTER_RECORD | `docs/baselines/CVF_GC018_W10X_T1_*_AUTHORIZATION_2026-04-19.md` |
| CP1 audit (line counts, file diffs) | FULL_RECORD | `docs/audits/CVF_W10X_T1_CP1_*_AUDIT_2026-04-19.md` |
| CP1 delta (what changed, what didn't) | SUMMARY_RECORD | `docs/baselines/CVF_W10X_T1_CP1_*_DELTA_2026-04-19.md` |
| Before/after screenshots | FULL_RECORD | `docs/evidence/W10X_UI_*/` |
| Closure review | FULL_RECORD | `docs/reviews/CVF_W10X_T1_TRANCHE_CLOSURE_REVIEW_2026-04-19.md` |
| GC-026 tracker sync | SUMMARY_RECORD | `docs/baselines/CVF_GC026_TRACKER_SYNC_W10X_T1_CLOSED_2026-04-19.md` |
| Handoff entry | SUMMARY_RECORD | `AGENT_HANDOFF.md` (top of Last Tranches Closed table) |

---

## 9. Acceptance checklist (roadmap-level closure)

The entire roadmap (W105 → W109) is CLOSED when all of these hold:

```text
[ ] W105-T1 through W109-T1 each have GC-018 + CP1 + CP2 + CP3 committed
[ ] Each tranche explicitly records whether it used Tier A or Tier B verification
[ ] Every tranche passes `tsc --noEmit`, `lint`, and `build`
[ ] Tier A tranches have targeted Vitest evidence when relevant tests exist, plus behavior-preservation proof
[ ] Tier B tranches preserve the full shared Vitest baseline
[ ] npm run build green on main after each tranche merge
[ ] 18 redesigned surfaces visually match App onboarding mockups in dark mode
[ ] Light mode: no broken styling on any redesigned surface
[ ] Mobile (375px): no horizontal overflow on any redesigned surface
[ ] Before/after screenshot evidence complete for all 18 surfaces
[ ] Behavior Preservation Matrix completed for every touched tranche
[ ] Alibaba live smoke evidence captured after AI-facing redesign (`route.dlp.live`, `route.retrieval.live`, `knowledge benchmark live`) when operator-provided key is available
[ ] At least one manual Alibaba-backed UI smoke recorded after redesign of AI-entry surfaces
[ ] No new dependencies added to package.json
[ ] No test files modified
[ ] No file over GC-023 hard threshold (1000 lines)
[ ] AGENT_HANDOFF.md updated with 5 closure rows
```

---

## 10. Open items the implementer must raise BEFORE starting

Not blockers — but must have operator answer on record before W105-T1 CP0:

1. **Screenshot tooling:** Playwright snapshot? Manual? Decide capture method for "before/after" evidence.
2. **Sidebar active-dot styling:** Mockup shows 5px accent dot on active item. Current app has no such pattern — is introducing it acceptable, or keep to existing active-background-only pattern?
3. **CompactHeader existence:** Verify `src/components/CompactHeader.tsx` exists and is imported by layout.tsx (flag if renamed/moved).
4. **Template category source:** Home page has 7 category pills. Where does the category list come from — hardcoded or derived from templates data? If derived, pill order must match template data's category ordering.
5. **Alibaba proof capture:** Decide whether the closure packet stores live-test stdout excerpts, screenshots, or a short evidence summary table — but some concrete artifact is mandatory when live key is available.

---

## 11. What this roadmap explicitly does NOT cover

- Landing page (already redesigned in a prior session)
- Admin pages under `/admin/*` (Enterprise redesign deferred)
- Any backend, API, schema, or auth change
- i18n wiring (cosmetic placeholder only)
- New charts library adoption (SVG-only)
- Multi-Agent node positioning refactor (fenced §2.5)
- Route changes (no URL changes anywhere)
- Test modifications

---

## 12. Changelog vs original plan

| Aspect | Original plan | This roadmap |
| --- | --- | --- |
| Verdict | DRAFT pending critique | IMPLEMENTATION-READY |
| Tranching | 1 plan for 18+ files | 5 tranches (W105 → W109) |
| Build order | A→B→C→D→E | **A→B→E→C→D** (technical agent fix) |
| `layout.tsx` | Forbidden | Narrow exception §2.1 (max 2 handleNavigate cases) |
| Modal-vs-Page | Open question | Decided: keep as modals §2.2 |
| Knowledge URL | Open question | Decided: no change §2.3 |
| Enterprise page | Open question | Decided: out of scope §2.4 |
| Multi-Agent SVG | "UI-only" ambiguous | Style-only fence §2.5 |
| Chart library | Open question | SVG-only, static-only §2.6 |
| Dark / light | Unspecified | Dark primary, light functional §2.7 |
| i18n switcher | Unspecified | Cosmetic placeholder §2.8 |
| CompactHeader | Missing | Included in W105-T1 §2.9 |
| Line counts | Unverified | Verified, all < 1000 §3 |
| Evidence plan | None | §8 |
| Rollback policy | None | §7 |
| Governance envelope | None | §1 + per-tranche §5 |
| Acceptance gate | Visual check + build | §9 full checklist + Tier A / Tier B verification rules |

---

**End of roadmap.** Any deviation from this document during implementation requires reopening the relevant GC-018.
