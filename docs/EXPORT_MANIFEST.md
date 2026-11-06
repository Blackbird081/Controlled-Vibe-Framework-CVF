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
{"schemaVersion":"cvf.publicChangeEvidence.v1","publicBase":"c4c8767ac8861854f40d466ba338ffd11eb9558e","sourceCommit":"fee51fb883b82852d54737be0365183438be2a45","changedPaths":["docs/reference/CVF_AGENT_ERROR_TO_GOVERNANCE_LEARNING_PHILOSOPHY_2026-05-28.md","docs/reference/CVF_PRODUCT_MILESTONE_COVERAGE_CONTRACT_2026-10-23.md","docs/reference/CVF_WORKSPACE_RULES.md","docs/reference/downstream_gate_profile/CVF_MILESTONE_COVERAGE_MACHINE_CONTRACT.md","governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json","governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md","scripts/check_cvf_workspace_agent_enforcement.ps1","scripts/initialize_cvf_project_clone.ps1","scripts/initialize_cvf_repository_clone.ps1","scripts/install_cvf_workspace_root_wrappers.ps1","scripts/lib/downstream_catalog/CvfDownstreamBootstrapContent.ps1","scripts/lib/downstream_governance/CvfDownstreamGateProfile.ps1","scripts/lib/downstream_governance/cvf_dg_common.py","scripts/lib/downstream_governance/cvf_downstream_gate_profile.json","scripts/lib/downstream_governance/cvf_downstream_gate_runner.py","scripts/lib/downstream_governance/cvf_milestone_coverage.py","scripts/lib/downstream_governance/cvf_repair_convergence.py","scripts/lib/downstream_governance/cvf_workspace_activation.py","scripts/new-cvf-workspace.ps1","scripts/update_cvf_workspace_public_core.ps1"],"claimBoundary":"PUBLIC_CHANGE_TRACEABILITY_NOT_PRIVATE_CLOSURE"}
```

## Historical Export Binding

- Public source checkout: `30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3`.
- Original export date: `2026-05-09`.
- Provenance tag: `provenance-pre-renewal-2026-05-09`.
- Provenance commit: `16cff60c596af619da040ba8887ce81396dad04e`.
- Original manifest bundle SHA256: `8c7c9924efc94ce9715c1ac5de5554cd338dc56e0f5073fdb339d9ed0165c4dc`.
- Frozen inventory is preserved byte-for-byte at `docs/evidence/archive/EXPORT_MANIFEST_2026-05-09.md`.
- Archived inventory SHA256: `2ED5727817E3C0BBFBDE0F906437F04E06922359967CA0F3ED121A5E7B4E6D0A`.
