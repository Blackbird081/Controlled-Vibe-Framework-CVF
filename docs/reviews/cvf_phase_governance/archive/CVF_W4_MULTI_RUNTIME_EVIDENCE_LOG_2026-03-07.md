# CVF W4 Multi-Runtime Evidence Log - 2026-03-07

## Header

- source manifest: `docs/reviews/cvf_phase_governance/CVF_W4_MULTI_RUNTIME_EVIDENCE_MANIFEST_2026-03-07.json`
- schemaVersion: `2026-03-07`
- manifestType: `CVF_MULTI_RUNTIME_REMEDIATION_EVIDENCE`
- requestId: `REQ-20260307-002`
- traceBatch: `CVF_CROSS_EXTENSION_CONFORMANCE_BATCH_2026-03-07`
- runtimeFamilyCount: `8`
- totalReceiptCount: `27`
- releaseManifestPath: `docs/reference/CVF_RELEASE_MANIFEST.md`
- linkedPacketPath: `docs/reviews/cvf_phase_governance/CVF_RELEASE_APPROVAL_PACKET_LOCAL_BASELINE_2026-03-07.md`
- manifestLogPath: `docs/reviews/cvf_phase_governance/CVF_W4_MULTI_RUNTIME_EVIDENCE_LOG_2026-03-07.md`

## Runtime Families

| Runtime Family | Version | Release Line | Maturity | Adapter | Receipt Count | Artifact | Log |
|---|---|---|---|---|---|---|---|
| `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` | `v1.1.1` | `stable` | `production-candidate` | `PHASE_GOVERNANCE_RUNTIME_EVIDENCE` | `3` | `docs/reviews/cvf_phase_governance/CVF_W4_PHASE_GOVERNANCE_EVIDENCE_2026-03-07.json` | `docs/reviews/cvf_phase_governance/CVF_W4_PHASE_GOVERNANCE_LOG_2026-03-07.md` |
| `CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE` | `v1.2.2` | `local-ready` | `hardening-active` | `SKILL_GOVERNANCE_RUNTIME_EVIDENCE` | `3` | `docs/reviews/cvf_phase_governance/CVF_W4_SKILL_GOVERNANCE_EVIDENCE_2026-03-07.json` | `docs/reviews/cvf_phase_governance/CVF_W4_SKILL_GOVERNANCE_LOG_2026-03-07.md` |
| `CVF_v1.6.1_GOVERNANCE_ENGINE` | `v1.6.1` | `active` | `production-candidate` | `GOVERNANCE_ENGINE_RUNTIME_EVIDENCE` | `3` | `docs/reviews/cvf_phase_governance/CVF_W4_GOVERNANCE_ENGINE_EVIDENCE_2026-03-07.json` | `docs/reviews/cvf_phase_governance/CVF_W4_GOVERNANCE_ENGINE_LOG_2026-03-07.md` |
| `CVF_v1.6_AGENT_PLATFORM` | `v1.6` | `active` | `production-candidate` | `AGENT_PLATFORM_GOVERNANCE_EVIDENCE` | `3` | `docs/reviews/cvf_phase_governance/CVF_W4_AGENT_PLATFORM_GOVERNANCE_EVIDENCE_2026-03-07.json` | `docs/reviews/cvf_phase_governance/CVF_W4_AGENT_PLATFORM_GOVERNANCE_LOG_2026-03-07.md` |
| `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` | `v1.9` | `local-ready` | `implemented-local` | `FILE_BACKED_REMEDIATION_ADAPTER` | `6` | `docs/reviews/cvf_phase_governance/CVF_W4_REMEDIATION_RECEIPTS_LOCAL_BASELINE_2026-03-07.json` | `docs/reviews/cvf_phase_governance/CVF_W4_REMEDIATION_RECEIPT_LOG_2026-03-07.md` |
| `CVF_v1.8_SAFETY_HARDENING` | `v1.8` | `local-ready` | `implemented-local` | `SAFETY_HARDENING_ROLLBACK_EVIDENCE` | `3` | `docs/reviews/cvf_phase_governance/CVF_W4_SAFETY_HARDENING_ROLLBACK_EVIDENCE_2026-03-07.json` | `docs/reviews/cvf_phase_governance/CVF_W4_SAFETY_HARDENING_ROLLBACK_LOG_2026-03-07.md` |
| `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` | `v1.7.3` | `active` | `production-candidate` | `RUNTIME_ADAPTER_HUB_RELEASE_EVIDENCE` | `3` | `docs/reviews/cvf_phase_governance/CVF_W4_RUNTIME_ADAPTER_HUB_REMEDIATION_RECEIPTS_2026-03-07.json` | `docs/reviews/cvf_phase_governance/CVF_W4_RUNTIME_ADAPTER_HUB_REMEDIATION_RECEIPT_LOG_2026-03-07.md` |
| `CVF_v1.7.1_SAFETY_RUNTIME` | `v1.7.1` | `stable` | `production-candidate` | `SAFETY_RUNTIME_SESSION_EVIDENCE` | `3` | `docs/reviews/cvf_phase_governance/CVF_W4_SAFETY_RUNTIME_SESSION_EVIDENCE_2026-03-07.json` | `docs/reviews/cvf_phase_governance/CVF_W4_SAFETY_RUNTIME_SESSION_LOG_2026-03-07.md` |

## Release Metadata

- releaseLinesCovered: `active, local-ready, stable`
- maturityBandsCovered: `hardening-active, implemented-local, production-candidate`

## Notes

- This manifest links the current release-evidence baseline across more than one runtime family.
- The `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` artifact proves integrity verification, pipeline execution, and phase-audit evidence can join the same release-grade manifest chain.
- The `CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE` artifact proves skill filtering, phase gating, and successor-migration evidence can join the same release-grade manifest chain.
- The `CVF_v1.6.1_GOVERNANCE_ENGINE` artifact proves policy evaluation, enforcement routing, and approval-state evidence can join the same release-grade manifest chain.
- The `CVF_v1.6_AGENT_PLATFORM` artifact proves governance snapshot and enforcement-route evidence can join the release-grade manifest chain.
- The `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` artifact remains the primary orchestration-line remediation baseline.
- The `CVF_v1.8_SAFETY_HARDENING` artifact proves rollback/recovery evidence can join the same release-facing manifest chain.
- The `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` artifact proves the adapter-hub line can emit compatible remediation evidence without format translation.
- The `CVF_v1.7.1_SAFETY_RUNTIME` artifact proves checkpoint/session/audit evidence can be exported into the same release-grade manifest without lossy translation.
