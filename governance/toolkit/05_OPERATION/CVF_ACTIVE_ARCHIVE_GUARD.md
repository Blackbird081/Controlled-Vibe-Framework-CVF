# CVF ACTIVE-ARCHIVE GUARD

> **Type:** Governance Policy  
> **Effective:** 2026-03-11  
> **Status:** Active  
> **Enforced by:** `scripts/cvf_active_archive.py`

---

## 1. PURPOSE

Maintain clean, focused working directories by separating active files (≤3 days) from historical archives (>3 days). Prevents confusion during audits and ensures teams work with current data only.

---

## 2. SCOPE

This guard applies to managed roots:

| Root | Content Type |
|---|---|
| `docs/` | Full CVF docs tree (reference + reviews + roadmaps + baselines + guides + concepts + support docs) |
| `ECOSYSTEM/strategy/` | Strategic docs, roadmaps, evaluation reports |

Policy overlap control:
- paths that already have dedicated rotation guards are excluded from this guard (for example: `docs/logs/`, `docs/reviews/cvf_phase_governance/logs/`)
- archive folders (`*/archive/`) are never re-scanned as active candidates

---

## 3. RULES

### R1 — File Naming (NON-NEGOTIABLE FOR AUTO-ARCHIVE ELIGIBILITY)

> ⚠️ Files intended for automated active/archive rotation **MUST** include date suffix in filename.

**Required format:** `CVF_<DESCRIPTIVE_NAME>_YYYY-MM-DD.md`

Examples:
- ✅ `CVF_INDEPENDENT_EXPERT_ASSESSMENT_2026-03-09.md`
- ✅ `CVF_ROADMAP_FIXES_2026-03-10.md`
- ❌ `CVF_ROADMAP_NANG_CAP.md` (no date)
- ❌ `assessment_final_v2.md` (no CVF_ prefix, no date)

### R2 — Active Zone (≤3 days for dated operational artifacts)

- only files with date suffix in filename are eligible for auto-archive
- dated files in the last 3 calendar days stay active
- dated files older than 3 days become archive candidates, then pass screening rules before move
- non-dated files are treated as evergreen docs and remain active unless explicitly refactored

### R3 — Archive Zone (>3 days, screen-approved only)

Each local doc area keeps a sibling `archive/` subdirectory. Only candidates that pass impact screening are moved:
- no protected-reference dependency
- no high inbound reference risk from active docs
- no live markdown-link dependency from active docs
- no dedicated-rotation overlap

`CVF_ARCHIVE_INDEX.md` is auto-generated/updated for each archive folder.

### R4 — Permanent Files (Exempt)

The following files are **never archived**:
- `README.md` (in any managed directory)
- `CVF_STRATEGIC_SUMMARY.md`
- `CVF_UNIFIED_ROADMAP_2026.md`
- `CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
- `CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
- architecture/baseline anchors explicitly marked permanent in script config

### R5 — Impact Screening (NON-NEGOTIABLE)

Before archive move, each candidate is scanned for reference impact:
- inbound references from active docs are counted
- candidate is blocked if referenced by protected anchor files (whitepaper/tracker/handoff/index)
- candidate is blocked if inbound active reference count exceeds threshold
- candidate is blocked if active markdown links resolve directly to that file (to prevent link break after move)

This prevents "archive first, discover broken baseline later" incidents.

### R6 — Automation Required

Archive management is performed by running:
```bash
python scripts/cvf_active_archive.py --execute
```

This script must be run:
- Before any major review or assessment session
- After completing a sprint or upgrade wave
- When safe-to-archive candidate count exceeds 10 files

---

## 4. AUTOMATION COMMANDS

| Command | Purpose |
|---|---|
| `python scripts/cvf_active_archive.py --dry-run` | Preview what would be archived |
| `python scripts/cvf_active_archive.py --impact-scan` | Show candidate risk (blocked/safe) with inbound reference impact |
| `python scripts/cvf_active_archive.py --link-audit` | Audit broken local markdown links and highlight paths likely moved to `archive/` |
| `python scripts/cvf_active_archive.py --repair-broken-archive-links` | Restore files back from `archive/` when they are still linked by active docs |
| `python scripts/cvf_active_archive.py --execute` | Execute archive migration |
| `python scripts/cvf_active_archive.py --restore` | Restore all files from archive |
| `python scripts/cvf_active_archive.py --status` | Show current active/archive counts |

---

## 5. DRIFT TRIGGER

If managed roots contain dated files older than 3 days that are safe-to-archive:

1. Agent/reviewer flags governance drift
2. Run archive script before continuing work
3. Verify `CVF_ARCHIVE_INDEX.md` is up to date
4. Run `--link-audit` and resolve `BROKEN-ARCHIVED` findings before additional cleanup
5. Review blocked candidates and keep them active until links are intentionally refactored

---

## 6. RELATED ARTIFACTS

- `scripts/cvf_active_archive.py` — Automation script
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_NAMING_GUARD.md` — Naming convention (includes date requirement)
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md` — Storage taxonomy

End of Active-Archive Guard.
