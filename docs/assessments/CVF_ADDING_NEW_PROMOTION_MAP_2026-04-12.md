# CVF ADDING NEW — Promotion Map

> **Date:** 2026-04-12
> **Purpose:** record how every useful source file from `CVF ADDING NEW` was handled during promotion into CVF core
> **Scope Boundary:** this promotion map covers only `CVF ADDING NEW` integration. It does not apply to the separate PVV Alibaba/provider workstream.

## 1. Outcome Classes

- `PROMOTED_AS_DRAFT` — copied or adapted into `docs/reference`
- `SYNTHESIZED_INTO_CANON` — useful content absorbed into a new consolidated draft
- `RETAINED_AS_REFERENCE` — kept for provenance, not promoted as canon text
- `DECISION_RECORD_ONLY` — kept in assessments/review packet only

## 2. File-level Promotion Map

| Source File | Outcome | Canon Target / Notes |
| --- | --- | --- |
| `ADK SkillToolset/Thong_tin.md` | `RETAINED_AS_REFERENCE` | provenance only |
| `ADK SkillToolset/CVF Audit.md` | `RETAINED_AS_REFERENCE` | provenance only |
| `ADK SkillToolset/CVF_KNOWLEDGE_ASSIMILATION_LOG.md` | `RETAINED_AS_REFERENCE` | provenance only |
| `Claude how to/Thong_tin.md` | `RETAINED_AS_REFERENCE` | provenance only |
| `Claude how to/CVF_W7_CLI_Schema_Contracts.md` | `PROMOTED_AS_DRAFT` | `docs/reference/CVF_W7_CLI_SCHEMA_CONTRACTS.md` |
| `Claude how to/CVF_W7_CLI_Governance_Bindings.md` | `PROMOTED_AS_DRAFT` | `docs/reference/CVF_W7_CLI_GOVERNANCE_BINDINGS.md` |
| `Claude how to/CVF_W7_CLI_MVP_Scope.md` | `PROMOTED_AS_DRAFT` | `docs/reference/CVF_W7_CLI_MVP_SCOPE.md` |
| `Claude how to/CVF_W7_CLI_Workspace_and_State.md` | `PROMOTED_AS_DRAFT` | `docs/reference/CVF_W7_CLI_WORKSPACE_AND_STATE.md` with heavier review pending |
| `Claude how to/CVF_W7_CLI_Command_Catalog.md` | `SYNTHESIZED_INTO_CANON` | `docs/reference/CVF_W7_CLI_COMMAND_SURFACE.md` |
| `Claude how to/CVF_W7_CLI_Spec.md` | `SYNTHESIZED_INTO_CANON` | W7 CLI drafts + compiler/intake docs |
| `Claude how to/CVF_W7_CLI_Implementation_Spec.md` | `SYNTHESIZED_INTO_CANON` | W7 CLI drafts + compiler/intake docs |
| `Claude how to/W7 Compiler Spec.md` | `SYNTHESIZED_INTO_CANON` | `docs/reference/CVF_W7_EXTERNAL_ASSET_COMPILER_GUIDE.md` |
| `Claude how to/W7-compliant assets.md` | `SYNTHESIZED_INTO_CANON` | `docs/reference/CVF_W7_EXTERNAL_ASSET_COMPILER_GUIDE.md` |
| `HowtoClaude/Thong_tin.md` | `RETAINED_AS_REFERENCE` | provenance only |
| `HowtoClaude/CVF Audit Note` | `RETAINED_AS_REFERENCE` | rationale/provenance only |
| `HowtoClaude/CVF_SEMANTIC_POLICY_GUARD_VOCABULARY.md` | `SYNTHESIZED_INTO_CANON` | `docs/reference/CVF_SEMANTIC_POLICY_INTENT_REGISTRY.md` |
| `HowtoClaude/CVF_SKILL_NORMALIZATION_SCHEMA.md` | `SYNTHESIZED_INTO_CANON` | `docs/reference/CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md` |
| `HowtoClaude/CVF_PLANNER_TRIGGER_PATTERN_SPEC.md` | `SYNTHESIZED_INTO_CANON` | `docs/reference/CVF_PLANNER_TRIGGER_HEURISTICS.md` |
| `HowtoClaude/CVF_EVALUATION_SIGNAL_REGISTRY.md` | `SYNTHESIZED_INTO_CANON` | `docs/reference/CVF_PROVISIONAL_EVALUATION_SIGNAL_CANDIDATES.md` |

## 3. Decision Records

These remain part of the audit trail rather than canon reference:

- `docs/assessments/CVF_ADDING_NEW_INDEPENDENT_EVALUATION_2026-04-12.md`
- `docs/assessments/CVF_ADDING_NEW_REBUTTAL_CHECKLIST_2026-04-12.md`
- `docs/assessments/CVF_ADDING_NEW_STRUCTURED_REBUTTAL_2026-04-12.md`
- `.private_reference/legacy/CVF ADDING NEW/REVIEW/CVF_ADDING_NEW_FINAL_INTEGRATION_DECISION_2026-04-12.md`

## 4. Final Rule

Every useful source file from `CVF ADDING NEW` must end in one of three states:

- promoted
- synthesized
- retained as reference with explicit reason

This map exists so future agents do not need to re-audit the same source set from scratch.
