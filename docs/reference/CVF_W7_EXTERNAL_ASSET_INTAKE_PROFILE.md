# CVF W7 External Asset Intake Profile

> **Document Type:** INTERNAL DESIGN DRAFT
> **Status:** Promoted from `CVF ADDING NEW` intake after Round 3 rebuttal and human sign-off on 2026-04-12
> **Source Quality:** mixed intake; normalized into CVF-native intake model
> **Scope:** external repo or asset intake into the W7 asset path
> **Scope Boundary:** This profile governs external repo -> W7 asset intake only. It does not apply to the Alibaba provider PVV workstream.

## 1. Purpose

This document defines the intake profile for external material that is broader than legacy external skill intake.

It covers candidate intake for:

- commands
- policy/context material
- skills
- agents
- planners
- tools
- learning assets

The goal is to keep external material in an intake posture until CVF itself fills the governed fields.

## 2. Intake Stages

External material must move through exactly three stages:

1. `external_intake_profile`
2. `w7_normalized_asset_candidate`
3. `registry_ready_governed_asset`

No candidate may skip a stage.

## 3. Stage 1 — External Intake Profile

This is the discovery and bounded capture stage.

Required fields:

```yaml
external_intake_profile:
  source_ref: string
  source_kind: repo|folder|archive|document_bundle
  source_quality: internal_design_draft|community_analysis|official_external|mixed
  officially_verified: boolean
  provenance_notes: string
  candidate_asset_type: W7CommandAsset|W7PolicyAsset|W7ContextAsset|W7SkillAsset|W7AgentAsset|W7PlannerAsset|W7ToolAsset|W7LearningAsset
  description_or_trigger: string
  instruction_body: string
```

Optional enrichment:

- `references`
- `examples`
- `tools`
- `templates`
- `execution_environment`

Optional execution environment shape:

```yaml
execution_environment:
  os: windows|linux|macos
  shell: powershell|bash|zsh|sh
  shell_version: string
  script_type: ps1|sh|zsh|cmd|bat
  compatibility: native|cross-platform
```

Conditional required rule:

- `tools` is `Required-when candidate_asset_type = W7ToolAsset`
- `execution_environment` is `Required-when candidate_asset_type = W7SkillAsset` and the intake material contains executable code blocks

## 4. Stage 2 — W7 Normalized Asset Candidate

This is the structural transformation stage.

Required fields:

```yaml
w7_normalized_asset_candidate:
  candidate_id: string
  source_ref: string
  candidate_asset_type: string
  normalized_header:
    name: string
    description: string
    version_hint: string
  routing_metadata:
    triggers: []
    domain: string
    phase_hints: []
  body:
    instruction_payload: object
  enrichment:
    references: []
    examples: []
    tools: []
    templates: []
    execution_environment: {}
```

This stage may still fail later validation.
It is not yet registry authority.

## 5. Stage 3 — Registry-ready Governed Asset

CVF creates this stage only after review and validation.

CVF-generated governed fields:

```yaml
registry_ready_governed_asset:
  asset_id: string
  asset_type: string
  governance:
    owner: string
    approval_state: draft|reviewed|approved|rejected
    source_quality: string
  risk_level: R0|R1|R2|R3
  observability:
    trace_required: boolean
  evaluation_profile:
    enabled: boolean
  registry_refs: []
```

## 6. Source Quality Classes

### 6.1 `internal_design_draft`

Use for CVF-native draft specs authored in CVF voice and architecture, but not yet canon-final.

### 6.2 `community_analysis`

Use for commentary-heavy materials, derivative notes, or external interpretations that inform design but are not authoritative.

### 6.3 `official_external`

Use only when the source is primary official external documentation and has been verified.

### 6.4 `mixed`

Use when a candidate bundle combines more than one of the above.

## 7. Relationship To Existing Skill Intake

This profile extends but does not replace:

- `governance/skill-library/specs/EXTERNAL_SKILL_INTAKE.md`
- `governance/toolkit/05_OPERATION/SKILL_INTAKE_GOVERNANCE.md`

Those documents remain the active policy for skill-library intake.

This document adds a broader W7 asset intake model for external repo compilation and registry onboarding.

## 8. Adoption Rules

1. No external material may be treated as runtime-ready at intake stage.
2. No external material may set its own governance outcome.
3. No candidate may enter registry-ready state without source-quality and provenance fields.
4. W7ToolAsset candidates must carry actual tool-binding content before passing normalization.
5. W7SkillAsset candidates with executable code blocks must carry declared execution-environment metadata before passing normalization.

## 9. Final Rule

External material enters CVF as bounded intake data.

Only CVF can promote it into a governed asset.
