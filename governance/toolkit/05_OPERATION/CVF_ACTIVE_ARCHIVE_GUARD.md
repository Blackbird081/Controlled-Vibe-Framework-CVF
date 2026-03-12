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

This guard applies to 4 managed directories:

| Directory | Content Type |
|---|---|
| `docs/assessments/` | Independent assessments, expert reviews |
| `docs/reviews/cvf_phase_governance/` | Conformance reports, audit traces, evidence packets |
| `docs/roadmaps/` | Roadmaps, migration plans, fix plans |
| `ECOSYSTEM/strategy/` | Strategic docs, roadmaps, evaluation reports |

---

## 3. RULES

### R1 — File Naming (NON-NEGOTIABLE)

> ⚠️ All files in managed directories **MUST** include date suffix in filename.

**Required format:** `CVF_<DESCRIPTIVE_NAME>_YYYY-MM-DD.md`

Examples:
- ✅ `CVF_INDEPENDENT_EXPERT_ASSESSMENT_2026-03-09.md`
- ✅ `CVF_ROADMAP_FIXES_2026-03-10.md`
- ❌ `CVF_ROADMAP_NANG_CAP.md` (no date)
- ❌ `assessment_final_v2.md` (no CVF_ prefix, no date)

### R2 — Active Zone (≤3 days)

Only files with dates within the last 3 calendar days remain in the active directory. All older files must be in `archive/` subdirectory.

### R3 — Archive Zone (>3 days)

Each managed directory has an `archive/` subdirectory containing:
- All files older than 3 days
- `ARCHIVE_INDEX.md` — auto-generated index of all archived files

### R4 — Permanent Files (Exempt)

The following files are **never archived**:
- `README.md` (in any managed directory)
- `CVF_STRATEGIC_SUMMARY.md`
- `CVF_UNIFIED_ROADMAP_2026.md`

### R5 — Automation Required

Archive management is performed by running:
```bash
python scripts/cvf_active_archive.py --execute
```

This script must be run:
- Before any major review or assessment session
- After completing a sprint or upgrade wave
- When active zone file count exceeds 10 files

---

## 4. AUTOMATION COMMANDS

| Command | Purpose |
|---|---|
| `python scripts/cvf_active_archive.py --dry-run` | Preview what would be archived |
| `python scripts/cvf_active_archive.py --execute` | Execute archive migration |
| `python scripts/cvf_active_archive.py --restore` | Restore all files from archive |
| `python scripts/cvf_active_archive.py --status` | Show current active/archive counts |

---

## 5. DRIFT TRIGGER

If a managed directory contains files older than 3 days (excluding permanent files):

1. Agent/reviewer flags governance drift
2. Run archive script before continuing work
3. Verify `ARCHIVE_INDEX.md` is up to date

---

## 6. RELATED ARTIFACTS

- `scripts/cvf_active_archive.py` — Automation script
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_NAMING_GUARD.md` — Naming convention (includes date requirement)
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md` — Storage taxonomy

End of Active-Archive Guard.
