# CVF Front-Door Onboarding Canonicalization Delta

> Date: `2026-03-20`
> Scope: Front-door and onboarding semantics on the active Web reference path
> Source roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
> Source control gate: `GC-018` in `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`

## Objective

Close `P1` from the post-closure depth-audit register by aligning first-touch non-coder guidance with the canonical governed starter model.

## Changes Applied

- updated `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/OnboardingWizard.tsx`
  - replaced legacy `3-step / AI does the rest` framing with governed starter semantics
  - taught packet review, controlled live run, and freeze evidence as the expected starter flow
- updated `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/QuickStart.tsx`
  - reframed quick start around governed intake, routed phase/risk confirmation, and governed path launch
- updated `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/template-i18n.ts`
  - aligned App Builder front-door English metadata to governed packet/live-path language
- updated `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/development.ts`
  - aligned App Builder front-door Vietnamese metadata to governed packet/live-path language
- updated `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
  - marked `P1` as executed and recorded this batch in the historical receipt chain

## Verification

- `cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/components/OnboardingWizard.test.tsx src/lib/template-i18n.test.ts`
- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Reconciliation Note

This delta closes the first-touch semantics gap on the active Web line. It does not yet implement `P2` itself; the actual onboarding-to-governed-starter execution handoff remains the next authorized continuation batch.
