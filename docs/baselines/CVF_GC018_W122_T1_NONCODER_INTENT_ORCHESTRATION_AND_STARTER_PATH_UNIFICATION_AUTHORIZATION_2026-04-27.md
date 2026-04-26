<!-- Memory class: SUMMARY_RECORD -->

# CVF GC-018 Authorization — W122-T1 Noncoder Intent Orchestration And Starter Path Unification

> Date: 2026-04-27
> Authorization class: GC-018 (Tranche Authorization)
> Wave: W122-T1
> Predecessor: W119-T1 CLOSED DELIVERED 2026-04-23; W121-T1 CLOSED DELIVERED 2026-04-26; template quality canonicalization CLOSED DELIVERED 2026-04-26

---

## 1. Problem Statement

W119 proved the bounded non-coder adoption journey. W121 proved public skill quality. Template quality canonicalization proved 53 templates are clean, 45/45 regression gates pass.

The remaining activation bottleneck is the **fragmented front-door experience**. A non-coder can succeed in CVF, but must manually understand:

- which template/wizard fits their need
- which entry surface (Home gallery vs QuickStart vs SkillPlanner) to use first
- how to connect their plain-language intent to the governed execution path

Three parallel routing surfaces exist at the library layer (`intent-detector.ts`, `skill-planner.ts`, `governed-starter-path.ts`) with overlapping logic, propagating incoherence into the first-run UX.

The next high-value move is intent-first routing: a non-coder states what they need in plain language (VN or EN), CVF routes them into the right wizard-family governed starter path without forcing manual selection.

---

## 2. Authorization Conditions

This tranche is authorized under the following conditions:

1. W122 must not reopen broad core architecture. Allowed change surface: Web UX/orchestration surfaces and the bounded starter-path helper contracts (`intent-detector.ts`, `governed-starter-path.ts`, new `intent-router.ts`).
2. The trusted routing subset for W122 is the **wizard-family (9)** only. Form-template routing (≤42) is explicitly out of scope.
3. `skill-planner.ts` must not be removed or have behavior changed — browse-side use only.
4. Any claim about governed execution behavior must be backed by a real provider API call through the live release gate.
5. Mock/UI-only checks may cover navigation, static layout, and flag-off behavior only.
6. Feature flag `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` must default to `false` during build; flip to `true` only after CP4 + CP5 close.
7. GC-023 line budget must be respected; any modified file ≥ approved limit must have a registry entry or use extracted components.
8. No raw API key values must appear in any committed artifact.
9. Evidence parity (CP4) must be asserted at field level using a declared parity object, not descriptive review.

---

## 3. Authorized Scope

| CP | Deliverable | Primary surfaces |
| --- | --- | --- |
| CP0 | Pre-flight inventory + GC-023 check + feature flag scaffold + source-of-truth declaration | `docs/reviews/W122_ENTRY_SURFACE_INVENTORY.md`, `.env.local`, `next.config` |
| CP1 | `intent-router.ts` routing facade + `intent-router.test.ts` + canonical QuickStart front-door wired behind flag | `src/lib/intent-router.ts`, `src/lib/intent-router.test.ts`, `QuickStart.tsx` or `IntentEntry.tsx` |
| CP2 | Unify Home / QuickStart / OnboardingTour to consume `intent-router.ts` | `home/page.tsx`, `QuickStart.tsx`, `OnboardingTour.tsx` |
| CP3 | Skill library repositioned as browse surface (copy + CTA only) | `src/app/skills/page.tsx`, skill detail pages |
| CP4 | Evidence parity test: `intent-router-evidence-parity.test.ts` | `src/lib/intent-router-evidence-parity.test.ts` |
| CP5 | Playwright live E2E: `intent-first-flow.live.spec.ts` + evidence pack | `tests/e2e/intent-first-flow.live.spec.ts`, `docs/assessments/` |
| CP6 | Closure doc sync + feature flag default flip + AGENT_HANDOFF update | `AGENT_HANDOFF.md`, `docs/baselines/`, README |

---

## 4. Boundary Constraints

- Do not claim Web is the full CVF runtime.
- Do not claim intent routing works beyond the wizard-family (9) subset.
- Do not remove `skill-planner.ts` or its UI.
- Do not copy or re-declare phase/risk/template regex in `intent-router.ts`; delegate to `intent-detector.ts`.
- Do not persist provider API keys into any committed artifact.
- Do not broaden provider benchmarks without a separate GC-018.
- Do not replace the mandatory release gate with targeted UI or mock checks.
- Do not use `GovernanceEvidenceReceipt` type expansion unless explicitly chosen during implementation.
- Feature flag rollback must work by flipping the flag alone — no code revert needed.

---

## 5. Authorization Decision

**AUTHORIZED** — W122-T1 may proceed as a NONCODER ACTIVATION / PRODUCTIZATION / FRONT-DOOR ORCHESTRATION tranche.

Implementation roadmap: `docs/roadmaps/CVF_W122_T1_NONCODER_INTENT_ORCHESTRATION_AND_STARTER_PATH_UNIFICATION_ROADMAP_2026-04-26.md`

Execution order: CP0 → CP1 → CP2 → CP3 → CP4 → CP5 → CP6
