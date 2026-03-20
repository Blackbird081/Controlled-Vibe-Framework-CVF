# CVF Onboarding Governed Starter Path Delta

> Date: `2026-03-20`
> Scope: Onboarding-to-starter handoff on the active Web reference path
> Source roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
> Source control gate: `GC-018` in `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`

## Objective

Close `P2` from the post-closure depth-audit register by turning onboarding guidance into a real governed starter handoff instead of stopping at explanatory copy.

## Changes Applied

- added `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-starter-path.ts`
  - builds, stores, reads, and clears a governed starter handoff
  - maps Quick Start intent suggestions to routed governed wizard targets
- updated `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/OnboardingWizard.tsx`
  - distinguishes `dismiss` versus `starter` completion
- updated `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/QuickStart.tsx`
  - surfaces the routed starter wizard on the confirmation step
  - emits a typed Quick Start result for governed starter handoff persistence
- updated `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/hooks/useModals.ts`
  - opens Quick Start when onboarding completes into starter mode
- updated `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/layout.tsx`
  - renders Quick Start as a governed starter entry modal
  - persists starter handoff and routes back to the home dashboard when needed
- updated `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/home/page.tsx`
  - consumes starter handoff state from session storage
  - renders a reviewable governed handoff card
  - launches the routed starter wizard from that handoff

## Verification

- `cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/components/OnboardingWizard.test.tsx src/components/QuickStart.test.tsx src/lib/hooks/useModals.test.ts src/lib/governed-starter-path.test.ts`
- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Reconciliation Note

This delta closes the starter-handoff gap on the active Web reference path. It does not reopen `P3`; breadth expansion remains deferred until a fresh depth-audit register says a new path materially changes the decision boundary.
