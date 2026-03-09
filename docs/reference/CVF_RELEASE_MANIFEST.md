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

## Current Operational Manifest (2026-03-07)

| Version | Module / Line | Release line | Maturity | Evidence anchor | Notes |
|---|---|---|---|---|---|
| v1.0 | Foundation | frozen | baseline-reference | `v1.0/` | original framework baseline |
| v1.1 | Governance Refinement | frozen | baseline-reference | `v1.1/` | policy/governance lineage root |
| v1.1.1 | Phase Governance Protocol | stable | production-candidate | `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/` | integrated under ADR-014 |
| v1.1.2 | Phase Governance Hardening | local-ready | hardening-active | `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/` | current local hardening wave; tracked by `REQ-20260307-001` |
| v1.2 | Capability Extension | frozen | baseline-reference | `EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/` | capability governance root |
| v1.2.1 | External Integration | active | production-candidate | `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/` | independently reassessed 2026-03-06 |
| v1.2.2 | Skill Governance Engine | local-ready | hardening-active | `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/` | present in current upgrade chain |
| v1.3 | Implementation Toolkit | frozen | baseline-reference | `EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/` | tooling baseline |
| v1.3.1 | Operator Edition | legacy-reference | reference-only | `EXTENSIONS/CVF_v1.3.1_OPERATOR_EDITION/` | retained for operator lineage |
| v1.4.x | Usage Layer family | legacy-reference | reference-only | `EXTENSIONS/CVF_v1.4_USAGE_LAYER/` | historical usage/operator branch |
| v1.5.x | UX / end-user family | legacy-reference | reference-only | `EXTENSIONS/CVF_v1.5_UX_PLATFORM/` | retained, not current hardening priority |
| v1.6 | Agent Platform | active | production-candidate | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/` | current web entrypoint line |
| v1.6.1 | Governance Engine | active | production-candidate | `EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/` | governance runtime line |
| v1.7 | Controlled Intelligence | stable | production-candidate | `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE/` | intelligence/safety line root |
| v1.7.1 | Safety Runtime | stable | production-candidate | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/` | tested kernel/safety runtime |
| v1.7.2 | Safety Dashboard | stable | production-candidate | `EXTENSIONS/CVF_v1.7.2_SAFETY_DASHBOARD/` | non-coder safety visibility |
| v1.7.3 | Runtime Adapter Hub | active | production-candidate | `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/` | current adapter line |
| v1.8 | Safety Hardening | local-ready | implemented-local | `EXTENSIONS/CVF_v1.8_SAFETY_HARDENING/` | implemented line referenced in root README |
| v1.8.1 | Adaptive Observability Runtime | local-ready | implemented-local | `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/` | added in Mar 2026 wave |
| v1.9 | Deterministic Reproducibility | local-ready | implemented-local | `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/` | reproducibility line referenced in root README |
| v2.0 | Non-Coder Safety Runtime | local-ready | implemented-local | `EXTENSIONS/CVF_v2.0_NONCODER_SAFETY_RUNTIME/` | current local implementation line |
| v3.0 | Core Foundation Primitives / Git for AI | draft | branch-track | `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/` | draft track under ADR-016 |

## Current Baseline Pointers

| Need | Canonical file |
|---|---|
| baseline review | `docs/reviews/cvf_phase_governance/CVF_DANH_GIA_DOC_LAP_TOAN_DIEN_2026-03-06.md` |
| executive summary | `docs/reviews/cvf_phase_governance/CVF_EXECUTIVE_REVIEW_BASELINE_2026-03-06.md` |
| roadmap | `docs/reviews/cvf_phase_governance/CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md` |
| current upgrade trace | `docs/reviews/cvf_phase_governance/CVF_UPGRADE_TRACE_2026-03-07.md` |
| test evidence chain | `docs/CVF_INCREMENTAL_TEST_LOG.md` |
| enterprise evidence pack | `docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md` |

## Operational Notes

- this manifest is local-authoritative until the current upgrade wave is pushed and frozen
- any new version/line must update:
  - `docs/CVF_ARCHITECTURE_DECISIONS.md`
  - `docs/VERSIONING.md`
  - this manifest
- local consistency gate:
  - `python governance/compat/check_release_manifest_consistency.py --enforce`
