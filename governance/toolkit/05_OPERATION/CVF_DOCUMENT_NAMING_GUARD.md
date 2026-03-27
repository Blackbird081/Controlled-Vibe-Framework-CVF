# CVF Document Naming Guard

**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active naming contract for long-lived governance and evidence documents stored in CVF repositories.
**Applies to:** All humans and AI agents creating, migrating, or normalizing long-lived markdown records under `docs/` or `governance/`.
**Enforced by:** `governance/compat/check_docs_governance_compat.py`

## Purpose

- keep durable records recognizable, searchable, and auditable
- stop naming drift from turning important documents into arbitrary one-off files
- preserve a stable document shape across review, baseline, roadmap, and governance evidence flows

Naming discipline is a governance control, not a style preference.

## Rule

Any governance, review, assessment, decision, roadmap, baseline, audit, protocol, policy, checklist, report, or framework record stored in `docs/` or `governance/` MUST use the `CVF_` prefix unless it belongs to the approved exception list below.

This applies equally to:

- human authors
- AI agents
- migration and cleanup batches
- newly created archives under `docs/`

### Standard Format

Required pattern:

```text
CVF_<DOCUMENT_PURPOSE>[_<SCOPE>][_YYYY-MM-DD].md
```

Examples:

- `CVF_ARCHITECTURE_DECISIONS.md`
- `CVF_INCREMENTAL_TEST_LOG.md`
- `CVF_EXECUTIVE_REVIEW_BASELINE_2026-03-06.md`
- `CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md`

### Naming Rules

- prefix MUST be `CVF_`
- use uppercase snake case after the prefix
- date suffix SHOULD use `YYYY-MM-DD` when the record is snapshot, baseline, or review specific
- do not invent vague names such as `new_review.md`, `final_decision_v2.md`, or `roadmap_latest.md`

### Scope-Specific Examples

| Document Type | Correct |
|---|---|
| Baseline | `CVF_BASELINE_<SCOPE>_<DATE>.md` |
| Review | `CVF_REVIEW_<SCOPE>_<DATE>.md` |
| Assessment | `CVF_<SCOPE>_ASSESSMENT_<DATE>.md` |
| Roadmap | `CVF_ROADMAP_<SCOPE>[_<DATE>].md` |
| Decision matrix | `CVF_IMPLEMENT_DECISION_MATRIX_<DATE>.md` |
| Audit or control guard | `CVF_<PURPOSE>_GUARD.md` |

### Approved Exceptions

The following filenames are allowed without `CVF_` because they are already canonical repository entrypoints or cross-ecosystem names:

- `README.md`
- `INDEX.md`
- `CHANGELOG.md`
- `LICENSE`
- `BUG_HISTORY.md`
- `CHEAT_SHEET.md`
- `GET_STARTED.md`
- `HOW_TO_APPLY_CVF.md`
- `VERSIONING.md`
- `VERSION_COMPARISON.md`

Do not create new exceptions casually. Any new exception requires ADR or explicit governance approval.

### Storage And Migration Rule

- long-term governance records belong in `docs/`
- working proposals may exist elsewhere temporarily
- once a review, assessment, or roadmap becomes long-term evidence, it MUST move into `docs/`
- after moving into `docs/`, the filename MUST comply with this guard
- when normalizing historical files, rename and update references in the same batch

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_docs_governance_compat.py`
- the active automated scope is `docs/**/*.md`
- violation handling requires stopping the naming drift, renaming to a compliant form, updating references, and documenting the normalization batch when required

Strict command:

```bash
python governance/compat/check_docs_governance_compat.py --enforce
```

Violations include:

- creating new non-exempt docs in `docs/` without the `CVF_` prefix
- moving long-term review artifacts into `docs/` while keeping arbitrary names
- introducing duplicate naming patterns for the same document class

## Related Artifacts

- `governance/compat/check_docs_governance_compat.py`
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md`
- `docs/INDEX.md`
- `docs/CVF_CORE_KNOWLEDGE_BASE.md`

## Final Clause

If a document is important enough to keep, it is important enough to name correctly.
