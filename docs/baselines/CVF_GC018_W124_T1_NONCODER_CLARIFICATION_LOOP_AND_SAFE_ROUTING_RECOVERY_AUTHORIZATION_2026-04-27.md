<!-- Memory class: SUMMARY_RECORD -->

# CVF GC-018 Authorization — W124-T1 Noncoder Clarification Loop And Safe Routing Recovery

> Date: 2026-04-27
> Authorization class: GC-018 (Tranche Authorization)
> Wave: W124-T1
> Predecessor: W123-T1 CLOSED DELIVERED 2026-04-27; W122-T1 CLOSED DELIVERED 2026-04-27

---

## 1. Problem Statement

W122 proved intent-first routing: when a non-coder's input has strong confidence, CVF
routes them directly into a trusted wizard-family governed starter path.

The remaining gap is the **weak-confidence path**. Today CVF correctly refuses to guess
a governed target on ambiguous input — but the fallback is silent: the user is pushed
back to manual browse with no explanation of what clarification is actually needed.

For a non-coder this creates dead-end friction:

- the user cannot infer what would make their input more actionable
- weak-confidence recovery is not a designed product path
- CVF already classifies phase/risk/language from the input but does not convert those
  signals into helpful next-step guidance
- the product abandons value between "route strongly" and "browse manually"

The next move is guided recovery: when CVF cannot route confidently, it asks at most
two bounded clarification questions drawn from existing routing signals, then either
recovers a confident route into a trusted starter path or explains clearly why guided
browse remains the safer outcome.

---

## 2. Authorization Conditions

This tranche is authorized under the following conditions:

1. W124 must not reopen broad core architecture. Allowed change surface: Web UX/orchestration surfaces, the W122 `intent-router.ts` facade, and a new bounded `intent-router-clarification.ts` contract.
2. Clarification depth is capped at **2 questions per session**. Auto-routing after repeated ambiguity is forbidden.
3. Trusted routing subset stays **wizard-family (9) only** — identical to W122. Form-template routing is out of scope.
4. Clarification questions must reuse existing routing signals (phase classification, risk framing, language detection) from `intent-detector.ts`. Introducing a parallel detector is forbidden.
5. Any claim about governed execution behavior must be backed by a real provider API call through the live release gate.
6. Mock/UI-only checks may cover navigation, static layout, flag-off behavior, and clarification form structure only.
7. Feature flag `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` must default to `false` during build; flip to `true` only after CP4 evidence passes.
8. No server-side memory or cross-session conversation thread store may be introduced.
9. No raw API key values must appear in any committed artifact.
10. Feature flag rollback must work by flipping the flag alone — no code revert needed.

---

## 3. Authorized Scope

| CP | Deliverable | Primary surfaces |
| --- | --- | --- |
| CP0 | Clarification contract lock + eligible vs browse-only case taxonomy + feature flag scaffold | `docs/reviews/CVF_W124_CLARIFICATION_CONTRACT_INVENTORY_2026-04-27.md`, `.env.local` |
| CP1 | `intent-router-clarification.ts` — clarification question model extending W122 router; `intent-router-clarification.test.ts` | `src/lib/intent-router-clarification.ts`, `src/lib/intent-router-clarification.test.ts` |
| CP2 | `IntentEntry` / `QuickStart` clarification UX — weak-confidence renders question inline; answer retries routing | `src/components/IntentEntry.tsx`, `src/components/QuickStart.tsx`, `src/app/(dashboard)/home/page.tsx` |
| CP3 | Safe recovery auditability — telemetry events (weak-confidence detected, clarification asked, recovered/browse) | `src/lib/analytics.ts`, clarification state in `IntentEntry` |
| CP4 | Live E2E evidence pack — ambiguous VN/EN clarified to route; unresolved loop → guided browse; unsafe guessing absent | `tests/e2e/noncoder-clarification-recovery.live.spec.ts` |
| CP5 | Closure doc sync + AGENT_HANDOFF update + flag default flip after evidence passes | `AGENT_HANDOFF.md`, `AGENTS.md`, `docs/baselines/` |

---

## 4. Boundary Constraints

- Do not claim clarification routing works beyond the wizard-family (9) subset.
- Do not introduce a parallel intent detector; extend `intent-router.ts` only.
- Do not auto-guess a route after the clarification depth limit is reached.
- Do not persist clarification state server-side; client-only session state only.
- Do not remove or change `skill-planner.ts` behavior.
- Do not persist provider API keys into any committed artifact.
- Do not replace the mandatory release gate with targeted UI or mock checks.
- Unsupported-language inputs must still end in guided browse — no guessed routes allowed regardless of clarification answers.
- Feature flag rollback must work by flipping the flag alone.

---

## 5. Authorization Decision

**AUTHORIZED** — W124-T1 may proceed as a NONCODER ROUTING RECOVERY / CLARIFICATION UX / SAFE ACTIVATION tranche.

Implementation roadmap: `docs/roadmaps/CVF_W124_T1_NONCODER_CLARIFICATION_LOOP_AND_SAFE_ROUTING_RECOVERY_ROADMAP_2026-04-27.md`

Execution order: CP0 → CP1 → CP2 → CP3 → CP4 → CP5
