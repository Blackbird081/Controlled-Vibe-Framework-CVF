# CVF Non-Coder Security Breadth Expansion Delta

Date: 2026-03-20  
Type: Baseline Delta / Breadth Expansion  
Scope: Active Web non-coder governed security-assessment path

## Purpose

Add `SecurityAssessmentWizard` as the ninth active non-coder governed live path on the active Web reference line.

## Changes Applied

- Updated [SecurityAssessmentWizard.tsx](/d:/UNG%20DUNG%20AI/TOOL%20AI%202026/Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SecurityAssessmentWizard.tsx) to produce a governed packet, approval checkpoints, freeze receipt, and live governed run.
- Added regression coverage in [SecurityAssessmentWizard.test.tsx](/d:/UNG%20DUNG%20AI/TOOL%20AI%202026/Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SecurityAssessmentWizard.test.tsx) for packet display and live governed execution.
- Updated shared metadata in [template-i18n.ts](/d:/UNG%20DUNG%20AI/TOOL%20AI%202026/Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/template-i18n.ts) and [security.ts](/d:/UNG%20DUNG%20AI/TOOL%20AI%202026/Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/security.ts).
- Updated [CVF_NONCODER_REFERENCE_GOVERNED_PACKET.md](/d:/UNG%20DUNG%20AI/TOOL%20AI%202026/Controlled-Vibe-Framework-CVF/docs/reference/CVF_NONCODER_REFERENCE_GOVERNED_PACKET.md) and [CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md](/d:/UNG%20DUNG%20AI/TOOL%20AI%202026/Controlled-Vibe-Framework-CVF/docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md) to reflect the ninth governed breadth path.

## Verification

- `cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/components/SecurityAssessmentWizard.test.tsx src/lib/template-recommender.test.ts` -> `PASS`
- `python governance/compat/check_docs_governance_compat.py --enforce` -> `PASS`
- `python governance/compat/check_baseline_update_compat.py --enforce` -> `PASS`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push` -> `PASS`

## Reconciliation Note

This batch expands active non-coder governed breadth on the Web reference line. Reassessment and release-readiness artifact updates are intentionally deferred to the next evidence reconciliation batch.
