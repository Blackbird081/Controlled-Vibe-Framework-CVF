# CVF DOCUMENT NAMING GUARD

> **Type:** Governance Guard  
> **Effective:** 2026-03-06  
> **Status:** Active  
> **Applies to:** All humans and all AI agents working in CVF repositories
> **Enforced by:** `governance/compat/check_docs_governance_compat.py` (current automated scope: `docs/**/*.md`)

---

## 1. PURPOSE

This guard standardizes document naming across CVF so repository records remain:

- recognizable,
- searchable,
- auditable,
- non-arbitrary.

Naming inconsistency creates governance drift.  
From this point forward, document naming is a **mandatory control**, not a style preference.

---

## 2. RULE

> **NON-NEGOTIABLE:**  
> Any governance, review, assessment, decision, roadmap, baseline, audit, protocol, policy, checklist, report, or framework record stored in `docs/` or `governance/` MUST use the `CVF_` prefix unless it belongs to the approved exception list in Section 4.

This rule applies equally to:

- human authors,
- AI agents,
- migration/cleanup work,
- newly created archives under `docs/`.

---

## 3. STANDARD FORMAT

### 3.1 Required prefix

```text
CVF_<DOCUMENT_PURPOSE>[_<SCOPE>][_YYYY-MM-DD].md
```

Examples:

- `CVF_ARCHITECTURE_DECISIONS.md`
- `CVF_INCREMENTAL_TEST_LOG.md`
- `CVF_EXECUTIVE_REVIEW_BASELINE_2026-03-06.md`
- `CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md`

### 3.2 Naming rules

- Prefix MUST be `CVF_`
- Use uppercase snake case after prefix
- Date suffix SHOULD use `YYYY-MM-DD` when document is snapshot/baseline/review specific
- Do not invent vague names such as:
  - `new_review.md`
  - `final_decision_v2.md`
  - `roadmap_latest.md`

### 3.3 Scope-specific examples

| Document Type | Correct |
|---|---|
| Baseline | `CVF_BASELINE_<SCOPE>_<DATE>.md` |
| Review | `CVF_REVIEW_<SCOPE>_<DATE>.md` |
| Assessment | `CVF_<SCOPE>_ASSESSMENT_<DATE>.md` |
| Roadmap | `CVF_ROADMAP_<SCOPE>[_<DATE>].md` |
| Decision matrix | `CVF_IMPLEMENT_DECISION_MATRIX_<DATE>.md` |
| Audit/control guard | `CVF_<PURPOSE>_GUARD.md` |

---

## 4. APPROVED EXCEPTIONS

The following filenames are allowed without `CVF_` because they are standard repository entrypoints or already-canonical cross-ecosystem names:

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

Exception rule:

- Do not create new exceptions casually
- Any new exception requires ADR or explicit governance approval

---

## 5. STORAGE RULE

- Long-term governance records belong in `docs/`
- Working proposals may exist elsewhere temporarily
- Once a review/assessment/roadmap becomes baseline or long-term evidence, it MUST be moved into `docs/`
- After moving into `docs/`, the filename MUST comply with this guard

---

## 6. MIGRATION RULE

For pre-existing non-compliant documents:

- rename when touched for governance normalization,
- update references in the same batch,
- log the change if it is part of a reviewed baseline/evidence flow.

Do not leave mixed naming after a normalization batch.

---

## 7. ENFORCEMENT

Violations include:

- creating new non-exempt docs in `docs/` without `CVF_` prefix,
- moving long-term review artifacts into `docs/` while keeping arbitrary names,
- introducing duplicate naming patterns for the same document class.

Required action on violation:

1. stop the naming drift,
2. rename to compliant form,
3. update references,
4. document in the same governance batch when required.

### Automated Check

```bash
# Standard check (advisory)
python governance/compat/check_docs_governance_compat.py

# Strict enforcement (blocks on violation)
python governance/compat/check_docs_governance_compat.py --enforce
```

---

## 8. FINAL CLAUSE

Document naming under CVF is part of governance discipline.

If a document is important enough to keep, it is important enough to name correctly.
