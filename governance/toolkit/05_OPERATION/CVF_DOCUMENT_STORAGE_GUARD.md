# CVF DOCUMENT STORAGE GUARD

> **Type:** Governance Guard  
> **Effective:** 2026-03-06  
> **Status:** Active  
> **Applies to:** All humans and all AI agents working in CVF repositories
> **Enforced by:** `governance/compat/check_docs_governance_compat.py` (current automated scope: `docs/**/*.md`)

---

## 1. PURPOSE

This guard standardizes where documents must be stored inside `docs/`.

Correct placement is required for:

- discoverability,
- traceability,
- memory classification,
- governance continuity,
- future maintenance.

If naming drift creates ambiguity, storage drift creates loss of context.

---

## 2. RULE

> **NON-NEGOTIABLE:**  
> Any new long-term document created under `docs/` MUST be placed in the correct taxonomy folder defined by `docs/INDEX.md`.

Do not place new governance records directly in `docs/` root unless they are approved root-level exceptions or already-canonical files maintained in place.

This rule applies equally to:

- human contributors,
- AI agents,
- migration batches,
- review archive creation,
- roadmap and assessment outputs.

---

## 3. APPROVED TAXONOMY

| Folder | Use for |
|---|---|
| `docs/reference/` | authoritative long-lived reference docs |
| `docs/assessments/` | assessments, audits, verdict-driven evaluations |
| `docs/audits/` | specialized audit packets for structural changes, execution preflight, or evidence-first merge reviews |
| `docs/baselines/` | baseline snapshots and comparison anchors |
| `docs/roadmaps/` | plans, remediation, rollout, upgrade sequencing |
| `docs/reviews/` | review archives by scope/module |
| `docs/logs/` | rotated log archives and long-lived operational log windows |
| `docs/concepts/` | conceptual explanations |
| `docs/guides/` | role/team guides |
| `docs/tutorials/` | tutorials and walkthroughs |
| `docs/cheatsheets/` | quick-reference docs |
| `docs/case-studies/` | real-world applications |

`docs/INDEX.md` is the current canonical storage map.

This storage map also carries the default memory-role relationship used by
`CVF_MEMORY_GOVERNANCE_GUARD.md` and
`docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md`.

Default relationship:

- `docs/assessments/`, `docs/audits/`, `docs/reviews/` -> `FULL_RECORD`
- `docs/baselines/`, `docs/roadmaps/`, `docs/logs/` -> `SUMMARY_RECORD`
- `docs/reference/`, `docs/INDEX.md`, `docs/reference/README.md` -> `POINTER_RECORD`

---

## 4. ROOT-LEVEL RULE

Approved root-level files in `docs/` are currently:

- `BUG_HISTORY.md`
- `CHEAT_SHEET.md`
- `CVF_ARCHITECTURE_DECISIONS.md`
- `CVF_CORE_KNOWLEDGE_BASE.md`
- `CVF_INCREMENTAL_TEST_LOG.md`
- `GET_STARTED.md`
- `HOW_TO_APPLY_CVF.md`
- `INDEX.md`
- `VERSIONING.md`
- `VERSION_COMPARISON.md`

For **new files**:

- do not default to `docs/` root,
- choose the proper folder first,
- only use root if a governance decision explicitly keeps that document there,
- do not add new root-level filenames outside the approved list without explicit governance approval.

---

## 5. MIGRATION RULE

For historical files currently in `docs/` root:

- migrate in controlled batches,
- update references in the same batch,
- do not mix partial folder migrations that leave the taxonomy ambiguous.

Migration is recommended, but this guard is immediately mandatory for all **newly created** files.

---

## 6. ENFORCEMENT

Violations include:

- creating a new roadmap directly in `docs/` root,
- placing a baseline file under `reviews/`,
- storing a long-term assessment in proposal workspace after it became canonical,
- creating ad-hoc folders without taxonomy approval.

Required action:

1. stop,
2. place file in correct folder,
3. rename if needed to match document naming guard,
4. update references.

### Automated Check

```bash
# Standard check (advisory)
python governance/compat/check_docs_governance_compat.py

# Strict enforcement (blocks on violation)
python governance/compat/check_docs_governance_compat.py --enforce
```

---

## 7. FINAL CLAUSE

Correct naming identifies the document.  
Correct placement identifies its role in the system.

CVF requires both.
