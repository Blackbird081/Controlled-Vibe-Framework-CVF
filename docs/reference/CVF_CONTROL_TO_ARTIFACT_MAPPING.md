# CVF Control-to-Artifact Mapping

Status: canonical control mapping for enterprise evidence preparation.

## Purpose

- map control objectives to concrete CVF artifacts
- make audit preparation deterministic
- reduce ambiguity about which file proves which control

## Mapping

| Control family | Control objective | Primary artifact(s) | Supporting artifact(s) | Refresh trigger |
|---|---|---|---|---|
| Authority | roles, phases, and decisions are governed | `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md` | `governance/toolkit/03_CONTROL/CVF_PHASE_AUTHORITY_MATRIX.md` | policy update |
| Risk | risky actions are classified and gated | `governance/toolkit/02_POLICY/CVF_RISK_MATRIX.md` | `docs/concepts/risk-model.md` | risk model change |
| Traceability | changes can be reconstructed later | `docs/reviews/cvf_phase_governance/CVF_UPGRADE_TRACE_2026-03-07.md` | `docs/CVF_ARCHITECTURE_DECISIONS.md`, `docs/CVF_INCREMENTAL_TEST_LOG.md` | each remediation wave |
| Testing | verification decisions are documented | `docs/CVF_INCREMENTAL_TEST_LOG.md` | `governance/toolkit/05_OPERATION/CVF_TEST_DOCUMENTATION_GUARD.md` | each testing batch |
| Bug history | production or logic issues have historical continuity | `docs/BUG_HISTORY.md` | `governance/toolkit/05_OPERATION/CVF_BUG_DOCUMENTATION_GUARD.md` | each fix batch |
| Release state | current baseline/draft/local-only status is explicit | `docs/reference/CVF_RELEASE_MANIFEST.md` | `docs/reference/CVF_MATURITY_MATRIX.md`, `docs/reference/CVF_MODULE_INVENTORY.md` | release-state change |
| Version policy | naming/version rules stay consistent | `docs/VERSIONING.md` | `docs/CVF_ARCHITECTURE_DECISIONS.md` | version rule change |
| Baseline review | upgrade direction is grounded in independent assessment | `docs/reviews/cvf_phase_governance/CVF_DANH_GIA_DOC_LAP_TOAN_DIEN_2026-03-06.md` | executive review + roadmap | new baseline cycle |
| Release approval | release decision is explicit and reviewable | `docs/reference/CVF_RELEASE_APPROVAL_PACKET_TEMPLATE.md` | trace + manifest + test log | each release packet |
| Enterprise audit readiness | evidence can be exported as a packet | `docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md` | this mapping | evidence-pack update |

## Usage Note

- this file maps control objective to evidence source
- it does not replace the evidence itself
- when evidence changes materially, update both the source artifact and this mapping if the control path changes
