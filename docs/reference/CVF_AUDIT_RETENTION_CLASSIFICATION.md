
Memory class: POINTER_RECORD


> Status: active classification reference for `docs/audits/`
> Canonical registry: `governance/compat/CVF_AUDIT_RETENTION_REGISTRY.json`
> Last reviewed: `2026-03-28`

## Purpose

Standardize how `docs/audits/` is retained or archived so the active-archive flow can run automatically without collapsing important evidence chains.

## Classes

| Class | Meaning | Default Handling |
|---|---|---|
| `ACTIVE_RECENT_AUDIT` | recent audit packets still within the normal active time window | keep active by date |
| `RETAIN_EVIDENCE_AUDIT` | older audits that remain canonical evidence anchors for tranche closure, foundation proof, or protected roadmap/whitepaper references | block archive |
| `SAFE_TO_ARCHIVE_AUDIT` | older audits not in retain-evidence and not blocked by screening | archive-eligible |

## Current Summary

Current snapshot after the archive migration completed on `2026-03-28`:

| Bucket | Count | Basis |
|---|---|---|
| `ACTIVE_RECENT_AUDIT` | `40` | dated audits still inside the active window |
| `RETAIN_EVIDENCE_AUDIT` | `45` | explicit registry entries tied to protected-reference evidence chains |
| `SAFE_TO_ARCHIVE_AUDIT` | `0` | no remaining historical audits are currently eligible after the archive run |
| `ARCHIVED_AUDIT` | `96` | historical audits already moved under `docs/audits/archive/` |

## Retain-Evidence Rule

The `retain-evidence` set is intentionally conservative.

These audits stay in the root `docs/audits/` surface because they anchor one or more of:

- whitepaper completion roadmap references
- canonical tranche closure chains
- foundational contract proof for W1-T1 through W4-T2 bootstrap work
- active logs or reference docs that still cite the audit directly

The exhaustive path list lives in `governance/compat/CVF_AUDIT_RETENTION_REGISTRY.json`.

## Automation Rule

Archive automation must treat `docs/audits/` more strictly than `roadmaps/` or `baselines/`.

- recent audits remain active by date
- registry-pinned `retain-evidence` audits are blocked even if they are old
- only non-pinned old audits may flow into archive screening
- once moved, archived audits are tracked through `docs/audits/archive/CVF_ARCHIVE_INDEX.md`
- markdown-link dependency and protected-reference dependency still override archive moves
- `governance/compat/check_audit_retention_registry.py` enforces that dynamically blocked historical audits are present in the retain-evidence registry

## Operational Guidance

Use this order when cleaning `docs/audits/`:

1. refresh the audit retention registry when a closure chain changes materially
2. run the archive status or impact scan
3. archive only `SAFE_TO_ARCHIVE_AUDIT` documents
4. leave `RETAIN_EVIDENCE_AUDIT` in root until the parent canonical chain is archived or reclassified

## Related Artifacts

- `governance/compat/CVF_AUDIT_RETENTION_REGISTRY.json`
- `governance/compat/check_audit_retention_registry.py`
- `scripts/cvf_active_archive.py`
- `governance/toolkit/05_OPERATION/CVF_ACTIVE_ARCHIVE_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md`
