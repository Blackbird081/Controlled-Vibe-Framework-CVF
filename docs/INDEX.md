# CVF Public Documentation Index

Memory class: POINTER_RECORD
Status: PUBLIC DOCS INDEX

## Purpose

Provide a compact public entry point for CVF documentation surfaces.

## Owner / Source

Owner: CVF public documentation surface.

Source: public-safe repository files only.

## Scope

This index points only at public-safe repository files. It does not mirror
private provenance, review, baseline, or roadmap material.

## Protocol / Contract / Requirements

This file follows `reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`
and must not introduce private provenance links.
Public docs that author, close, or export governed artifacts must also follow
`reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`.
Session bootstrap compatibility is governed by
`reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`.
Product-value validation templates are governed by
`reference/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_TEMPLATE.md`,
`reference/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_TEMPLATE.md`,
`reference/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_TEMPLATE.md`, and
`reference/CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_TEMPLATE.md`.
Knowledge absorption priority is governed by
`reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`.
Template and skill value-proof work is governed by
`reference/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md`,
`reference/CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md`,
`../governance/toolkit/05_OPERATION/CVF_TEMPLATE_SKILL_STANDARD_GUARD.md`, and
`roadmaps/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_ROADMAP_2026-04-14.md`.
Multi-agent review packets use
`reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`,
`reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`, and
`reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`.
Boardroom runtime governance uses
`reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`,
`reference/CVF_BOARDROOM_SESSION_PACKET_TEMPLATE.md`,
`reference/CVF_BOARDROOM_DISSENT_LOG_TEMPLATE.md`, and
`reference/CVF_BOARDROOM_TRANSITION_DECISION_TEMPLATE.md`.
Extension package checks use
`../governance/toolkit/05_OPERATION/CVF_EXTENSION_PACKAGE_CHECK_GUARD.md`.
Default memory role follows
`reference/CVF_MEMORY_RECORD_CLASSIFICATION.md` and
`../governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md`.

## Start Here

- `README.md`
- `ARCHITECTURE.md`
- `GOVERNANCE.md`
- `docs/GET_STARTED.md`
- `docs/guides/CVF_MULTI_AGENT_PROVIDER_ROUTING.md`
- `docs/evidence/README.md`
- `docs/evidence/public-external-review-snapshot-2026-06-19.md`
- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md`
- `docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`
- `docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md`
- `docs/reference/CVF_PUBLIC_CATALOG_CLAIM_BOUNDARY_2026-05-18.md`

## Public Evidence

The `docs/evidence/` folder is reserved for curated public evidence summaries
and public-safe evidence pointers. It must not contain raw provenance packets,
operator environment transcripts, raw provider keys, or private review chains.

## Claim Boundary

Public documentation must preserve CVF's bounded claim posture. Mock-only UI
checks are not release-quality governance proof.

The structured Phase B public claim boundary is
`docs/reference/CVF_PUBLIC_CATALOG_CLAIM_BOUNDARY_2026-05-18.md`.

External-agent and public-source review claim calibration is
`docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`.

The bounded External Review Hardening public-sync summary is
`docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md`.

## Enforcement / Verification

Run these checks before changing public docs:

```bash
python governance/compat/check_docs_governance_compat.py
python governance/compat/check_markdown_structural_completeness.py
```

## Related Artifacts

- `docs/evidence/latest-release-gate.md`
- `docs/evidence/public-external-review-snapshot-2026-06-19.md`
- `docs/evidence/provider-lanes.md`
- `docs/evidence/web-governance-path.md`
- `docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`
- `docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md`
- `docs/reference/CVF_PUBLIC_CATALOG_CLAIM_BOUNDARY_2026-05-18.md`
- `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_TEMPLATE.md`
- `docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`
- `docs/reference/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md`
- `docs/reference/CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md`
- `docs/roadmaps/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_ROADMAP_2026-04-14.md`
- `docs/reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`
- `docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`
- `docs/reference/CVF_BOARDROOM_SESSION_PACKET_TEMPLATE.md`
- `docs/reference/CVF_BOARDROOM_DISSENT_LOG_TEMPLATE.md`
- `docs/reference/CVF_BOARDROOM_TRANSITION_DECISION_TEMPLATE.md`
- `governance/toolkit/05_OPERATION/CVF_AUDIT_PROTOCOL.md`
