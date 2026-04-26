<!-- Memory class: SUMMARY_RECORD -->

# GC-026 Progress Tracker Sync Note

- Workline: W122-T1 — Noncoder Intent Orchestration And Starter Path Unification
- Trigger source: W122-T1 CLOSED DELIVERED 2026-04-27
- Previous pointer: W119-T1 — Non-Coder Adoption Proof And Evidence UX (CLOSED 2026-04-23)
- New pointer: W122-T1 — Noncoder Intent Orchestration And Starter Path Unification (CLOSED 2026-04-27)
- Last canonical closure: W122-T1
- Current active tranche: NONE — W122-T1 CLOSED. Fresh GC-018 required for continuation.
- Next governed move: Fresh quality assessment + GC-018 for the next candidate tranche.
- Canonical tracker updated: 2026-04-27

---

## W122-T1 Closure Summary

**Class:** PRODUCTIZATION / NONCODER ACTIVATION / FRONT-DOOR ORCHESTRATION
**Roadmap:** `docs/roadmaps/CVF_W122_T1_NONCODER_INTENT_ORCHESTRATION_AND_STARTER_PATH_UNIFICATION_ROADMAP_2026-04-26.md`
**GC-018:** `docs/baselines/CVF_GC018_W122_T1_NONCODER_INTENT_ORCHESTRATION_AND_STARTER_PATH_UNIFICATION_AUTHORIZATION_2026-04-27.md`

### Checkpoints Delivered

**CP0 — Entry Surface Inventory + Flag Declaration**
- Entry surface inventory filed at `docs/reviews/W122_ENTRY_SURFACE_INVENTORY.md`.
- `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` feature flag declared (default `false`).
- `intent-router.ts` declared as single routing source of truth.

**CP1 — `intent-router.ts` Core**
- `src/lib/intent-router.ts` created as facade over `intent-detector.ts` + `governed-starter-path.ts`.
- Exports: `isIntentFirstEnabled()`, `routeIntent()`.
- `IntentRouteResult`: `starterKey`, `recommendedTemplateId`, `recommendedTemplateLabel` all nullable on weak confidence.
- 12/12 unit tests pass (`src/lib/intent-router.test.ts`).

**CP2 — `IntentEntry` Component + Home Wiring**
- `src/components/IntentEntry.tsx` extracted (GC-023 compliance).
- `home/page.tsx` renders `IntentEntry` behind flag; `handleIntentRoute` callback routes to wizard or form state.
- Weak-confidence fallback: CTA disabled, no routed target — operator cannot be misled into wrong template.
- `QuickStart.tsx` upgraded to consume `intent-router.ts` in step 2–3.

**CP3 — Skills Back-Link**
- `skills/page.tsx` shows intent-first back-link CTA when flag is on.

**CP4 — Evidence Parity**
- `src/lib/intent-router-evidence-parity.test.ts` — 10/10 parity assertions pass.
- Proves field-set diff between routed and direct handoff path is empty.

**CP5 — Live E2E**
- `tests/e2e/intent-first-flow.live.spec.ts` — J1 (structural/flag-off), J2 (flag-on IntentEntry + routing CTA), J3 (live governed execution via Alibaba lane).
- Result: **6 passed / 2 skipped** (J1 correctly skipped when `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true`).
- J3.1: BLOCK (400) — governed non-allow; J3.2: ALLOW — evidence receipt decision present. Both valid governed outcomes.

**CP6 — Release Gate + Handoff**
- `python scripts/run_cvf_release_gate_bundle.py --json` → **7/7 PASS** (build, tsc, provider readiness, secrets scan, docs governance, E2E mock `6 passed`, E2E live `6 passed / 2 skipped`).
- AGENTS.md, AGENT_HANDOFF.md, roadmap §5.1 updated to closure posture.

### Verification

- Targeted vitest: `intent-router.test.ts` 12/12, `intent-router-evidence-parity.test.ts` 10/10, `governed-starter-path.test.ts` 2/2, `governance-enforcement.test.ts` 11/11, `skill-template-map.test.ts` 11/11, `front-door-rewrite-regression.test.ts` 11/11, `QuickStart.test.tsx` 1/1. All 58 targeted tests pass.
- Live E2E: `npx playwright test tests/e2e/intent-first-flow.live.spec.ts --config playwright.config.ts` → 6 passed / 2 skipped, exit code 0.
- Release gate: `python scripts/run_cvf_release_gate_bundle.py --json` → PASS, 7/7 checks.

### Architecture Boundary

- `intent-router.ts` is Web-only client-side routing. It does not modify `/api/execute` governance pipeline.
- Feature flag default `false` is rollout-safe; existing home/skills/QuickStart behavior unchanged when flag is off.
- Routing subset is wizard-family (9 entries) only; arbitrary template routing is not claimed.
- VN `ứng dụng` `\b` boundary limitation: ASCII keywords (`app`, `mobile`, etc.) required for strong routing confidence on pure Vietnamese text. Template regex reopen is out of scope for this tranche.
- Web governance claim remains active `/api/execute` path only, not full CVF runtime inheritance.
