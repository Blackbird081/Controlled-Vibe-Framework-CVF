# CVF Document Storage Guard

**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active taxonomy-placement contract for long-lived CVF documents.
**Applies to:** All humans and AI agents creating or relocating long-lived documents under `docs/`.
**Enforced by:** `governance/compat/check_docs_governance_compat.py`

## Purpose

- keep durable documents discoverable and traceable
- preserve folder-level intent so later readers can infer document role quickly
- maintain the storage-side foundation for memory classification and governance continuity

If naming drift creates ambiguity, storage drift creates context loss.

## Rule

Any new long-term document created under `docs/` MUST be placed in the correct taxonomy folder defined by `docs/INDEX.md`.

Do not place new governance records directly in `docs/` root unless they are approved root-level exceptions or already-canonical files maintained there intentionally.

This applies equally to:

- human contributors
- AI agents
- migration batches
- review archive creation
- roadmap and assessment outputs

### Approved Taxonomy

| Folder | Use for |
|---|---|
| `docs/reference/` | authoritative long-lived reference docs |
| `docs/assessments/` | assessments, audits, verdict-driven evaluations |
| `docs/audits/` | specialized audit packets for structural changes, execution preflight, or evidence-first merge reviews |
| `docs/baselines/` | baseline snapshots and comparison anchors |
| `docs/roadmaps/` | plans, remediation, rollout, upgrade sequencing |
| `docs/reviews/` | review archives by scope or module |
| `docs/logs/` | rotated log archives and long-lived operational log windows |
| `docs/concepts/` | conceptual explanations |
| `docs/guides/` | role and team guides |
| `docs/tutorials/` | tutorials and walkthroughs |
| `docs/cheatsheets/` | quick-reference docs |
| `docs/case-studies/` | real-world applications |

`docs/INDEX.md` is the current canonical storage map.

This storage map also carries the default memory-role relationship used by `CVF_MEMORY_GOVERNANCE_GUARD.md` and `docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md`.

Default relationship:

- `docs/assessments/`, `docs/audits/`, `docs/reviews/` -> `FULL_RECORD`
- `docs/baselines/`, `docs/roadmaps/`, `docs/logs/` -> `SUMMARY_RECORD`
- `docs/reference/`, `docs/INDEX.md`, `docs/reference/README.md` -> `POINTER_RECORD`

### Root-Level Rule

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

For new files:

- do not default to `docs/` root
- choose the proper folder first
- only use root if a governance decision explicitly keeps the document there
- do not add new root-level filenames outside the approved list without explicit governance approval

### Migration Rule

- migrate historical root-level files in controlled batches
- update references in the same batch
- do not mix partial folder migrations that leave the taxonomy ambiguous
- this guard is immediately mandatory for all newly created files even when old files still exist in legacy locations

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_docs_governance_compat.py`
- placement review should happen together with the naming expectations from `CVF_DOCUMENT_NAMING_GUARD.md`
- required remediation is to stop, move the file into the correct folder, rename when needed, and update references in the same batch

Strict command:

```bash
python governance/compat/check_docs_governance_compat.py --enforce
```

Violations include:

- creating a new roadmap directly in `docs/` root
- placing a baseline file under `reviews/`
- storing a long-term assessment in proposal workspace after it became canonical
- creating ad-hoc folders without taxonomy approval

## Related Artifacts

- `governance/compat/check_docs_governance_compat.py`
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_NAMING_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md`
- `docs/INDEX.md`
- `docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md`

## Final Clause

Correct naming identifies the document. Correct placement identifies its role in the system. CVF requires both.
