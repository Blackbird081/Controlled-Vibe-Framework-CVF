# CVF Golden Downstream Bootstrap — Learning Intake

Memory class: POINTER_RECORD

Status: IMPORTED_PENDING_PROVENANCE_REVIEW

docType: reference

Text Encoding Exception: preserve Unicode punctuation from the imported
public learning title; no machine-readable token depends on it.

## Purpose

Capture the originating downstream-bootstrap learning that motivated the
golden project catalog kit.

## Scope / Applies To

Applies to downstream workspace bootstrap completeness and generated catalog
integrity. It grants no repository or public-export authority.

- Tranche: `CVF-BSL-T1`
- Date: 2026-07-23
- Phase: INTAKE
- Status: ACCEPTED
- Risk: R2
- Owner authority: operator instruction to open the separate learning tranche
- Source case: `CVF-Ecosystem/CVF-Operations-Workspace`
- Source case baseline: `b1d1cf8684a7da9903f682456da8ee8770f2217f`
- Public-core baseline: `6ce1cf00c31a7f825d4c3fa3e66e8a3509e4a4b2`

## Intent

Turn the reusable lessons from creating `CVF-Operations-Workspace` into a
stronger default bootstrap for future downstream repositories. A newly
bootstrapped project should begin with machine-governed discovery,
claim-bounded catalogs, canonical continuity and executable drift checks,
without requiring a separate G1-style repair tranche.

## Observed learning

The current bootstrap successfully creates workspace isolation, manifest and
policy files, provider-neutral roles, seven-step continuity, an empty Module
Registry, a human Module Catalog and a documentation Index.

The real downstream build exposed gaps:

1. Artifact Registry, registry schemas and deterministic catalog tooling were
   absent, so Index/Catalog governance had to be built as a separate tranche.
2. The initial Index and Module Catalog were hand-authored views, allowing
   machine-source and generated-view drift.
3. The doctor checked existence and selected JSON fields but not catalog
   consistency, duplicate paths, invalid lifecycle vocabulary or generated
   view drift.
4. The bootstrap implementation is a 625-line monolith, already beyond the
   600-line project guard used in the downstream case.
5. There is no hermetic golden-downstream test that runs bootstrap twice,
   validates preservation/idempotency and then runs the project doctor.
6. Bootstrap output must remain portable across fresh clones: relative core
   pin in source, ignored absolute local binding, no machine path as portable
   truth.
7. A baseline catalog must remain claim-safe: an empty Module Registry cannot
   imply roadmap or runtime capability.
8. The F0 review found that same-machine determinism can hide Windows
   working-tree transformation defects. Bootstrap tests must exercise
   encoding/EOL and fresh-checkout behavior rather than trusting one local
   rerun.

## Boundary

This tranche improves the public bootstrap kit only. It does not modify
`CVF-Operations-Workspace`, import application source, add runtime/provider
behavior, alter governance decisions unrelated to bootstrap, or claim that a
generated downstream project is production-ready.

No provider call, API key, secret read or live governance claim is required or
authorized. Evidence is structural and hermetic.

## Success boundary

## Claim Boundary

This intake records a learning need and success criteria. It is not standalone
implementation, closure, or public-release authorization.

The tranche succeeds when a temporary empty downstream repository can be
bootstrapped into a portable, catalog-governed INTAKE state; the bootstrap is
idempotent; deliberate registry/index/catalog defects fail closed; the doctor
passes the clean baseline and rejects drift; and public documentation describes
the new default accurately.
