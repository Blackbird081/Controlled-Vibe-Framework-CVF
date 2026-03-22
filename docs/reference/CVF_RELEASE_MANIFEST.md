# CVF Release Manifest

Status: authoritative operational release manifest for the current local baseline.

## Purpose

- separate versioning policy from release-state reality
- give one operational view for baseline, release line, and evidence status
- reduce confusion between stable, draft, review-only, and local-only tracks

## Authority Boundary

- `docs/VERSIONING.md` defines versioning policy and naming semantics
- this file defines the current operational release state
- if there is a conflict about runtime/release readiness, this manifest wins

## Release Line Legend

| Release line | Meaning |
|---|---|
| `frozen` | architecture fixed, no scope expansion expected |
| `stable` | accepted baseline for reuse with limited controlled hardening |
| `active` | in active use on current baseline |
| `local-ready` | implemented and verified locally, not yet treated as broadly published baseline |
| `draft` | design/branch track, not mainline baseline |
| `legacy-reference` | retained for historical/reference use, not current upgrade focus |

## Current Operational Manifest (2026-03-22)

| Version | Module / Line | Release line | Maturity | Evidence anchor | Notes |
|---|---|---|---|---|---|
| v1.0 | Foundation | frozen | baseline-reference | `v1.0/` | original framework baseline |
| v1.1 | Governance Refinement | frozen | baseline-reference | `v1.1/` | policy/governance lineage root |
| v1.1.1 | Phase Governance Protocol | stable | production-candidate | `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/` | stable governance runtime line with active workflow realism hardening |
| v1.1.2 | Phase Governance Hardening | local-ready | hardening-active | `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/` | local remediation wave aligned to canonical `INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE` semantics |
| v1.2 | Capability Extension | frozen | baseline-reference | `EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/` | capability governance root |
| v1.2.1 | External Integration | active | production-candidate | `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/` | independently reassessed 2026-03-06 |
| v1.2.2 | Skill Governance Engine | local-ready | hardening-active | `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/` | present in current upgrade chain |
| v1.3 | Implementation Toolkit | frozen | baseline-reference | `EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/` | tooling baseline |
| v1.3.1 | Operator Edition | legacy-reference | reference-only | `EXTENSIONS/CVF_v1.3.1_OPERATOR_EDITION/` | retained for operator lineage |
| v1.4.x | Usage Layer family | legacy-reference | reference-only | `EXTENSIONS/CVF_v1.4_USAGE_LAYER/` | historical usage/operator branch |
| v1.5.x | UX / end-user family | legacy-reference | reference-only | `EXTENSIONS/CVF_v1.5_UX_PLATFORM/` | retained, not current hardening priority |
| v1.6 | Agent Platform | active | production-candidate | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/` | current web entrypoint line with canonical phase/UI alignment batch applied locally |
| v1.6.1 | Governance Engine | active | production-candidate | `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/` | governance runtime line |
| v1.7 | Controlled Intelligence | stable | production-candidate | `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE/` | intelligence/safety line root |
| v1.7.1 | Safety Runtime | stable | production-candidate | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/` | tested kernel/safety runtime |
| v1.7.2 | Safety Dashboard | stable | production-candidate | `EXTENSIONS/CVF_v1.7.2_SAFETY_DASHBOARD/` | non-coder safety visibility |
| v1.7.3 | Runtime Adapter Hub | active | production-candidate | `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/` | current adapter line |
| v1.8 | Safety Hardening | local-ready | implemented-local | `EXTENSIONS/CVF_v1.8_SAFETY_HARDENING/` | implemented line referenced in root README |
| v1.8.1 | Adaptive Observability Runtime | local-ready | implemented-local | `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/` | added in Mar 2026 wave |
| v1.9 | Deterministic Reproducibility | local-ready | implemented-local | `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/` | reproducibility line referenced in root README |
| v2.0 | Non-Coder Safety Runtime | local-ready | implemented-local | `EXTENSIONS/CVF_v2.0_NONCODER_SAFETY_RUNTIME/` | current local implementation line |
| W1-T1 / W1-T2 | Control Plane Foundation | local-ready | implemented-local | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/` | closed first control-plane tranche and now extended with a bounded usable-intake contract baseline through `W1-T2 / CP1` |
| W2-T1 | Execution Plane Foundation Shell | local-ready | implemented-local | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/` | closed first execution-plane tranche for whitepaper completion, preserving gateway and MCP lineage with explicit wrapper, evidence, and authorization-boundary surfaces |
| W3-T1 | Governance Expansion Foundation | local-ready | implemented-local | `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/` | closed governance-expansion tranche for operational governance modules with explicit defer of concept-only `Watchdog` and `Audit / Consensus` targets |
| v2.5 | Ecosystem MCP Server | active | production-candidate | `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/` | 476 tests passed, renamed from v1.7 |
| v2.5.1 | Cross-Channel Guard Contract | active | production-candidate | `governance/contracts/` | 49 tests passed, unified governance types |
| v2.5.2 | VS Code Governance Adapter | active | production-candidate | `governance/contracts/adapters/` | 49 tests passed, programmatic enforcement |
| v3.0 | Core Foundation Primitives / Git for AI | draft | branch-track | `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/` | draft track under ADR-016 |

## Current Baseline Pointers

| Need | Canonical file |
|---|---|
| whole-system review | `docs/reviews/CVF_INDEPENDENT_SYSTEM_CHECKPOINT_2026-03-20.md` |
| prior independent review baseline | `docs/reviews/CVF_INDEPENDENT_SYSTEM_REVIEW_2026-03-19.md` |
| archived update remediation review | `docs/reviews/archive/CVF_INDEPENDENT_UPDATE_REVIEW_2026-03-19.md` |
| governed continuation roadmap | `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md` |
| current reassessment-trigger packet | `docs/reviews/CVF_POST_CLOSURE_REASSESSMENT_TRIGGER_HOLD_2026-03-20.md` |
| current continuation defer packet | `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_P3_2026-03-20.md` |
| readiness checkpoint | `docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md` |
| test evidence chain | `docs/CVF_INCREMENTAL_TEST_LOG.md` |
| enterprise evidence pack | `docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md` |
| baseline delta chain | `docs/baselines/CVF_PHASE4_DOCS_READINESS_DELTA_2026-03-20.md` |
| release/module inventory | `docs/reference/CVF_MODULE_INVENTORY.md` |

## Operational Notes

- this manifest is local-authoritative for a system-unification wave that is now complete for the active wave, intentionally held closed under `GC-018`, and currently has no open post-closure reassessment trigger
- any new version/line must update:
  - `docs/CVF_ARCHITECTURE_DECISIONS.md`
  - `docs/VERSIONING.md`
  - this manifest
- local consistency gate:
  - `python governance/compat/check_release_manifest_consistency.py --enforce`
