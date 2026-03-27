# CVF Active Archive Guard

**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active archive-maintenance contract for dated operational documents.
**Applies to:** Managed roots such as `docs/` and `ECOSYSTEM/strategy/` plus their local `archive/` subdirectories.
**Enforced by:** `scripts/cvf_active_archive.py`

## Purpose

- keep working directories focused on current data
- separate active documents from historical archives without losing auditability
- prevent archive moves that silently break live references or baseline anchors

## Rule

Maintain clean active zones for dated operational artifacts while preserving truthful archives.

### Scope

This guard applies to managed roots:

| Root | Content Type |
|---|---|
| `docs/` | full CVF docs tree including reference, reviews, roadmaps, baselines, guides, concepts, and support docs |
| `ECOSYSTEM/strategy/` | strategic docs, roadmaps, and evaluation reports |

Policy overlap control:

- paths that already have dedicated rotation guards are excluded from this guard, such as `docs/logs/` and `docs/reviews/cvf_phase_governance/logs/`
- archive folders (`*/archive/`) are never re-scanned as active candidates

### File Naming Rule

Files intended for automated active/archive rotation MUST include a date suffix in the filename.

Required pattern:

```text
CVF_<DESCRIPTIVE_NAME>_YYYY-MM-DD.md
```

Examples:

- `CVF_INDEPENDENT_EXPERT_ASSESSMENT_2026-03-09.md`
- `CVF_ROADMAP_FIXES_2026-03-10.md`

Non-compliant examples:

- `CVF_ROADMAP_NANG_CAP.md`
- `assessment_final_v2.md`

### Active Zone

- only files with a date suffix are eligible for auto-archive
- dated files in the last 3 calendar days stay active
- dated files older than 3 days become archive candidates and then pass screening rules before move
- non-dated files are treated as evergreen docs and remain active unless explicitly refactored

### Archive Zone

Each local doc area keeps a sibling `archive/` subdirectory. Only candidates that pass impact screening are moved:

- no protected-reference dependency
- no high inbound reference risk from active docs
- no live markdown-link dependency from active docs
- no dedicated-rotation overlap

`CVF_ARCHIVE_INDEX.md` is auto-generated or updated for each archive folder.

### Permanent Files

The following files are never archived:

- `README.md` in any managed directory
- `CVF_STRATEGIC_SUMMARY.md`
- `CVF_UNIFIED_ROADMAP_2026.md`
- `CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
- `CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
- architecture and baseline anchors explicitly marked permanent in script config

### Impact Screening

Before archive move, each candidate is scanned for reference impact:

- inbound references from active docs are counted
- the candidate is blocked if referenced by protected anchor files such as whitepaper, tracker, handoff, or index
- the candidate is blocked if inbound active reference count exceeds threshold
- the candidate is blocked if active markdown links resolve directly to that file

### Automation Required

Archive management is performed by running:

```bash
python scripts/cvf_active_archive.py --execute
```

This script should be run:

- before any major review or assessment session
- after completing a sprint or upgrade wave
- when safe-to-archive candidate count exceeds `10` files

## Enforcement Surface

- active/archive maintenance runs through `scripts/cvf_active_archive.py`
- governance drift exists when safe-to-archive files remain active without reason or when archive moves break references
- remediation requires running the archive script, verifying `CVF_ARCHIVE_INDEX.md`, and resolving `BROKEN-ARCHIVED` findings before more cleanup proceeds

Useful commands:

| Command | Purpose |
|---|---|
| `python scripts/cvf_active_archive.py --dry-run` | preview archive candidates |
| `python scripts/cvf_active_archive.py --impact-scan` | inspect blocked vs safe candidates |
| `python scripts/cvf_active_archive.py --link-audit` | detect broken local markdown links |
| `python scripts/cvf_active_archive.py --repair-broken-archive-links` | restore files still needed by active docs |
| `python scripts/cvf_active_archive.py --execute` | execute archive migration |
| `python scripts/cvf_active_archive.py --restore` | restore all files from archive |
| `python scripts/cvf_active_archive.py --status` | show current active vs archive counts |

## Related Artifacts

- `scripts/cvf_active_archive.py`
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_NAMING_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md`
- `docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md`

## Final Clause

Archive hygiene is only useful when it preserves truth. CVF never archives first and asks questions later.
