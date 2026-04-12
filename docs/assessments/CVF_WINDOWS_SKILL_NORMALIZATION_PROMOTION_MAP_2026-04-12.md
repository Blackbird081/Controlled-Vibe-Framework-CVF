# CVF Windows Skill Normalization — Promotion Map

Memory class: SUMMARY_RECORD

> **Date:** 2026-04-12
> **Purpose:** record which `Windows_Skill_Normalization` source files were reused, synthesized, or left as reference only
> **Boundary:** this map covers docs/intake curation only; it does not modify provider lanes, sandbox posture, or the active PVV API-key test chain

## 1. Promoted by Synthesis

### Source: `CVF_W7_Cross_Platform_Normalization_Policy.md`

Used to synthesize:

- `docs/reference/CVF_W7_EXECUTION_ENVIRONMENT_NORMALIZATION_POLICY.md`

What was kept:

- environment declaration principle
- cross-platform normalization intent
- compatibility-before-execution posture

What was removed:

- self-declared `Canonical`
- simplistic guard examples as if they were doctrine

### Source: `CVF_W7_Skill_Evaluation_Checklist.md`

Used to synthesize:

- `docs/reference/CVF_W7_WINDOWS_COMPATIBILITY_EVALUATION_CHECKLIST.md`

What was kept:

- Windows compatibility criteria
- execution-readiness criteria
- score-band concept

What was changed:

- repositioned as intake gate 3
- explicitly bounded so it does not replace existing governance-fit gates
- sandbox posture corrected

### Source: `CVF_W7_Windows_Skill_Normalization.md`

Used to synthesize:

- `docs/reference/CVF_W7_EXECUTION_ENVIRONMENT_NORMALIZATION_POLICY.md`
- `docs/reference/CVF_W7_WINDOWS_COMPATIBILITY_EVALUATION_CHECKLIST.md`
- `docs/reference/CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md` updates

What was kept:

- architecture mapping value
- execution-environment insight
- intake/evaluation augmentation value

What was removed:

- `Canonical Reference`
- `Approved for Integration`
- sandbox expansion claims

### Source: `CVF_W7_PowerShell_Command_Catalog.md`

Used to synthesize:

- `docs/reference/CVF_W7_WINDOWS_POWERSHELL_COMMAND_REFERENCE.md`

What was kept:

- bounded Bash/PowerShell equivalence table

What was changed:

- downgraded to reference appendix
- explicit statement that it is not runtime doctrine

## 2. Promoted by Schema Extension

Source concepts reused from:

- `CVF_W7_Windows_Skill_Normalization.md`
- `CVF_W7_Cross_Platform_Normalization_Policy.md`
- `CVF_W7_Skill_Evaluation_Checklist.md`

Applied to:

- `docs/reference/CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/external.asset.intake.profile.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/external.asset.intake.consumer.pipeline.contract.ts`

What changed:

- added optional `execution_environment` enrichment to Stage 1 intake profile
- added bounded `Required-when` rule for executable `W7SkillAsset` candidates
- added Stage 1 contract validation and targeted tests

## 3. Reference or Provenance Only

### `Thong_tin.md`

Status:

- provenance only

Reason:

- useful origin story
- not canon source

### `CVF_W7_Windows_Skill_Normalization_Spec.md`

Status:

- merge-only source, not promoted directly

Reason:

- too thin
- content absorbed better through richer synthesis docs

### `CVF_W7_Windows_Skill_Refactor_Report.md`

Status:

- provenance + bounded evidence source

Reason:

- useful for narrow quality claims
- not promoted as doctrine

## 4. Conflict-Avoidance Note

This promotion wave deliberately did not touch:

- provider routes
- lane behavior
- PVV evidence files
- sandbox platform posture

The only code changes were bounded to Stage 1 intake validation in CPF.
