# Public Export Manifest

Memory class: POINTER_RECORD
Status: ACTIVE_REFERENCE
docType: reference

## Purpose

Bind current public changes to their source and preserve the historical export
inventory without presenting that inventory as current release proof.

## Scope / Applies To

Owner: public projection release steward. Applies to the curated public export;
private session, dispatch and release approval evidence remain in provenance.

## Contract / Requirements

Every substantive public change carries the summary below and a generated
same-delta path binding. The exporter derives that binding after projection.

## Enforcement / Verification

The existing public candidate preflight and baseline-update public profile
reject missing, unchanged or incomplete change evidence. Frozen inventory bytes
are checked by their raw SHA256. Current public CI determines candidate status.

## Related Artifacts

- [Public documentation index](INDEX.md).
- [Release manifest](reference/CVF_RELEASE_MANIFEST.md).
- [Frozen May 9 inventory](evidence/archive/EXPORT_MANIFEST_2026-05-09.md).

## Claim Boundary

Public change traceability does not prove private closure, provider governance,
production readiness or a successful QBS benchmark claim.

## Public Change Evidence

Change summary: Repair the complete public foundation CI scope, retain public normative checks without private-proof claims, correct SDK and status-check execution, preserve QBS capability and historical evidence, and split oversized documentation without content loss.

Changed owners: `.github/workflows/documentation-testing.yml`; `scripts/cvf-public-sync.ps1`; `scripts/check_cvf_public_sync_candidate.py`; `governance/compat/`; `governance/toolkit/05_OPERATION/CVF_PUBLIC_DOCS_INDEX.md`; `governance/toolkit/05_OPERATION/CVF_PUBLIC_INCREMENTAL_TEST_LOG.md`; `docs/VERSIONING.md`; `docs/CVF_ARCHITECTURE_DECISIONS.md`; `docs/reference/CVF_IN_VSCODE_GUIDE.md`; `EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/sdk/tests/`; `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/`; `.markdownlintrc`

Structural review: PUBLIC_PROJECTION_STRUCTURE_REVIEWED; QBS helper extraction, SDK integration proof, public documentation adapters and value-preserving document splits; no new runtime or provider authority.

Validation: Targeted public-profile rejection tests, offline SDK integration, strict Web lint/type/tests, Windows checks, QBS CLI parity and historical-byte checks have returned evidence. Final exact-candidate CI remains required before an all-gates claim. No provider call or live QBS scoring was run.

```public-change-evidence-json
{"schemaVersion":"cvf.publicChangeEvidence.v1","publicBase":"b3bd177bc6303137cb53464d88d92e9f59fa13b4","sourceCommit":"ccb0d2e9070e02ad0be86a666c60b126cae1a3a1","changedPaths":[".gitattributes",".github/workflows/ci.yml",".github/workflows/cvf-ci.yml",".github/workflows/cvf-static-ci.yml",".github/workflows/cvf-web-ci.yml",".github/workflows/documentation-testing.yml","EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/mao.atomic.sqlite.record.store.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/skills/suggest/page.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/artifacts/export/proof.operation.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.durable-memory.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/skills/suggest/route.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ProcessingScreen.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/jev-trial-custody.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/law-readout-pilot.offline.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.atomic-sqlite.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/storage-adapter.ts","docs/reference/CVF_PRODUCT_MILESTONE_COVERAGE_CONTRACT_2026-10-23.md","docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json","governance/compat/agent_automation_machine_verification_readout.py","governance/compat/agent_autorun_command_catalog.py","governance/compat/check_system_chain_map_freshness.py","governance/compat/mfrp_actual_seam_replay.py","governance/compat/mfrp_shadow_canary.py","governance/compat/mfrp_shadow_canary_autocollect.py","governance/compat/mfrp_shadow_canary_core.py","governance/compat/run_agent_automation_assist.py","governance/compat/run_agent_autorun_workflow_gate.py","governance/compat/run_dispatch_packet_author_fast_gate.py","governance/compat/test_agent_automation_machine_verification_readout.py","governance/compat/test_agent_autorun_machine_verification.py","governance/compat/test_build_dispatch_evidence_scaffold.py","governance/compat/test_build_dispatch_packet_scaffold.py","governance/compat/test_check_gate_to_role_closeability.py","governance/compat/test_check_preapproval_feasibility.py","governance/compat/test_check_semantic_convergence_control.py","governance/compat/test_check_system_chain_map_freshness.py","governance/compat/test_mfrp_actual_seam_replay.py","governance/compat/test_mfrp_shadow_canary.py","governance/compat/test_mfrp_shadow_canary_autocollect.py","governance/compat/test_mfrp_shadow_canary_core.py","governance/compat/test_run_agent_autorun_workflow_gate.py","governance/compat/test_run_dispatch_packet_author_fast_gate.py","scripts/check_cvf_public_sync_candidate.py","scripts/public_autorun_contract.py","scripts/public_projection/run_agent_autorun_workflow_gate.py.template","scripts/public_sync_ci.py"],"claimBoundary":"PUBLIC_CHANGE_TRACEABILITY_NOT_PRIVATE_CLOSURE"}
```

## Historical Export Binding

- Public source checkout: `30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3`.
- Original export date: `2026-05-09`.
- Provenance tag: `provenance-pre-renewal-2026-05-09`.
- Provenance commit: `16cff60c596af619da040ba8887ce81396dad04e`.
- Original manifest bundle SHA256: `8c7c9924efc94ce9715c1ac5de5554cd338dc56e0f5073fdb339d9ed0165c4dc`.
- Frozen inventory is preserved byte-for-byte at `docs/evidence/archive/EXPORT_MANIFEST_2026-05-09.md`.
- Archived inventory SHA256: `2ED5727817E3C0BBFBDE0F906437F04E06922359967CA0F3ED121A5E7B4E6D0A`.
