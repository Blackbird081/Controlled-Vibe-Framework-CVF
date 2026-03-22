# CVF MEMORY GOVERNANCE GUARD

> **Type:** Governance Guard
> **Effective:** 2026-03-22
> **Status:** Active
> **Applies to:** All humans and all AI agents creating or updating evidence-bearing records for later CVF memory use
> **Enforced by:** `governance/compat/check_memory_governance_compat.py`

---

## 1. PURPOSE

This guard standardizes how CVF stores durable memory evidence.

The goal is not only traceability.

The goal is to keep later memory useful, bounded, and economical:

- durable facts must stay recoverable
- low-value repetition must not bloat memory
- storage granularity must match the role of the document
- later handoff and context loading must be able to rely on this structure

---

## 2. CANONICAL MEMORY MODEL

CVF uses the following model:

- `memory = repository of facts, history, and durable evidence`
- `handoff = governance-filtered summary and transfer checkpoint`
- `context loading = phase-bounded loading of only what the current step needs`

This guard governs the **memory** side of that model.

---

## 3. NON-NEGOTIABLE RULE

> Any new or materially updated evidence-bearing document intended to support later CVF memory MUST declare the correct memory class.

The canonical classes are:

- `FULL_RECORD`
- `SUMMARY_RECORD`
- `POINTER_RECORD`

The declaration format is:

```md
Memory class: FULL_RECORD
```

Place it near the top of the document after the title block or status header.

---

## 4. MEMORY CLASSES

### `FULL_RECORD`

Use when durable reconstruction of the event or decision matters.

Typical use:

- approvals and explicit decisions
- audits and reviews
- incident or failure investigation
- tranche closure reviews
- scope or boundary decisions that later workers must be able to reconstruct faithfully

### `SUMMARY_RECORD`

Use when durable memory needs the outcome, not every intermediate detail.

Typical use:

- implementation deltas
- planning deltas
- execution progress updates
- active test-log batches
- roadmap progress snapshots

### `POINTER_RECORD`

Use when the file exists mainly to route later readers to canonical facts elsewhere.

Typical use:

- indexes
- reference READMEs
- canonical navigation maps
- summary pages that should point to evidence rather than repeat it

---

## 5. DEFAULT TAXONOMY MAPPING

Unless a narrower rule is explicitly approved, the default mapping is:

| Location | Default memory class |
|---|---|
| `docs/assessments/` | `FULL_RECORD` |
| `docs/audits/` | `FULL_RECORD` |
| `docs/reviews/` | `FULL_RECORD` |
| `docs/baselines/` | `SUMMARY_RECORD` |
| `docs/roadmaps/` | `SUMMARY_RECORD` |
| `docs/logs/` | `SUMMARY_RECORD` |
| `docs/reference/` | `POINTER_RECORD` unless the specific file is itself an evidence-bearing review or assessment |
| `docs/CVF_INCREMENTAL_TEST_LOG.md` | `SUMMARY_RECORD` |
| `docs/INDEX.md` | `POINTER_RECORD` |
| `docs/reference/README.md` | `POINTER_RECORD` |

`docs/INDEX.md` remains the canonical storage map.

`docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md` is the canonical memory-class map.

---

## 6. FULL VS SUMMARY VS POINTER DECISION RULE

Choose the lightest class that still preserves truthful future use.

Use `FULL_RECORD` when omission would make later reconstruction unsafe.

Use `SUMMARY_RECORD` when later workers only need:

- what changed
- why it changed
- where the canonical evidence lives
- what verification passed

Use `POINTER_RECORD` when the document's job is mainly:

- navigation
- routing
- canonical reference listing
- directing future context loading to higher-value sources

Do not use `FULL_RECORD` just because a file feels important.

Do not duplicate full evidence into `SUMMARY_RECORD` or `POINTER_RECORD` files.

Lane selection does not decide memory class by itself.

`GC-021 Fast Lane` reduces procedural burden, but the resulting audit/review artifacts can still be `FULL_RECORD` while deltas remain `SUMMARY_RECORD`.

---

## 7. VIOLATIONS

Violations include:

- storing a long narrative duplicate in a baseline delta that should only summarize the change
- turning an index into a second full review packet
- failing to declare a memory class on a new evidence-bearing record
- placing a document in the correct taxonomy folder but assigning the wrong memory granularity

Required action:

1. stop
2. classify the record correctly
3. reduce or expand detail to match that class
4. point to canonical evidence instead of duplicating it when `SUMMARY_RECORD` or `POINTER_RECORD` is sufficient

---

## 8. AUTOMATED ENFORCEMENT

```bash
# Standard check
python governance/compat/check_memory_governance_compat.py

# Strict enforcement
python governance/compat/check_memory_governance_compat.py --enforce
```

The compat gate checks:

- guard + policy + control-matrix + hook-chain alignment
- linkage with document-storage classification
- required `Memory class:` markers on changed memory-bearing records

---

## 9. FINAL CLAUSE

Traceability alone is not enough.

CVF memory must stay truthful **and** economical.

The right record is not the longest one.
The right record is the one stored at the right granularity for later governed reuse.
