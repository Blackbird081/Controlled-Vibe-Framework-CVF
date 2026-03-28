Memory class: POINTER_RECORD


> Status: active classification reference for `docs/reviews/`
> Canonical registry: `governance/compat/CVF_REVIEW_RETENTION_REGISTRY.json`
> Last reviewed: `2026-03-28`

## Purpose

Standardize how `docs/reviews/` is retained or archived so the active-archive flow can run automatically without collapsing canonical decision or evidentiary chains.

## Classes

| Class | Meaning | Default Handling |
|---|---|---|
| `ACTIVE_DECISION_REVIEW` | recent review and decision artifacts still inside the normal active window | keep active by date |
| `RETAIN_EVIDENCE_REVIEW` | older reviews that remain canonical evidence for governance, release, whitepaper, closure, or decision chains | block archive |
| `SAFE_TO_ARCHIVE_REVIEW` | older reviews not in retain-evidence and not blocked by screening | archive-eligible |
| `ARCHIVED_REVIEW` | historical reviews already migrated under `docs/reviews/archive/` | keep archived |

## Current Summary

Current snapshot after the archive migration completed on `2026-03-28`:

| Bucket | Count | Basis |
|---|---|---|
| `ACTIVE_DECISION_REVIEW` | `120` | dated reviews still inside the active window |
| `RETAIN_EVIDENCE_REVIEW` | `136` | explicit registry entries tied to protected-reference evidence chains |
| `SAFE_TO_ARCHIVE_REVIEW` | `0` | no remaining historical reviews are currently eligible after the archive run |
| `ARCHIVED_REVIEW` | `335` | historical reviews already moved under `docs/reviews/archive/` |

## Retain-Evidence Rule

The `retain-evidence` set is intentionally conservative.

These reviews stay in the active `docs/reviews/` surface because they anchor one or more of:

- continuation authorization chains such as `GC-018`
- structural or fast-lane decision evidence such as `GC-019` and `GC-021`
- tranche closure proofs, whitepaper/tracker anchors, or release/readiness evidence
- phase-governance review packets still cited by active reference docs

The exhaustive path list lives in `governance/compat/CVF_REVIEW_RETENTION_REGISTRY.json`.

## Automation Rule

Archive automation must treat `docs/reviews/` more strictly than `roadmaps/` or `baselines/`, and at least as strictly as `docs/audits/`.

- recent reviews remain active by date
- registry-pinned `retain-evidence` reviews are blocked even if they are old
- only non-pinned old reviews may flow into archive screening
- markdown-link dependency and protected-reference dependency still override archive moves
- `governance/compat/check_review_retention_registry.py` enforces that dynamically blocked historical reviews are present in the retain-evidence registry
- once moved, archived reviews are tracked through `docs/reviews/archive/CVF_ARCHIVE_INDEX.md`

## Operational Guidance

Use this order when cleaning `docs/reviews/`:

1. refresh the review retention registry when a decision chain changes materially
2. run the archive status or impact scan
3. archive only `SAFE_TO_ARCHIVE_REVIEW` documents
4. leave `RETAIN_EVIDENCE_REVIEW` in root until the parent canonical chain is archived or reclassified

## Related Artifacts

- `governance/compat/CVF_REVIEW_RETENTION_REGISTRY.json`
- `governance/compat/check_review_retention_registry.py`
- `scripts/cvf_active_archive.py`
- `governance/toolkit/05_OPERATION/CVF_ACTIVE_ARCHIVE_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_MULTI_AGENT_REVIEW_DOC_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md`
