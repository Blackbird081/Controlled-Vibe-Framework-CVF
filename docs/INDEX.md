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

## Start Here

- `README.md`
- `ARCHITECTURE.md`
- `GOVERNANCE.md`
- `docs/GET_STARTED.md`
- `docs/evidence/README.md`
- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md`
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

## Enforcement / Verification

Run these checks before changing public docs:

```bash
python governance/compat/check_docs_governance_compat.py
python governance/compat/check_markdown_structural_completeness.py
```

## Related Artifacts

- `docs/evidence/latest-release-gate.md`
- `docs/evidence/provider-lanes.md`
- `docs/evidence/web-governance-path.md`
- `docs/reference/CVF_PUBLIC_CATALOG_CLAIM_BOUNDARY_2026-05-18.md`
- `governance/toolkit/05_OPERATION/CVF_AUDIT_PROTOCOL.md`
