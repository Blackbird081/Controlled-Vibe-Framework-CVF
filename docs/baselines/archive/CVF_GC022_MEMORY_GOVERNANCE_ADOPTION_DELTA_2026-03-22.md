# CVF GC-022 Memory Governance Adoption Delta

Memory class: SUMMARY_RECORD
> Date: 2026-03-22
> Scope: adopt mandatory memory-governance rules for evidence-bearing records and connect them to docs storage classification

## Intent

Make durable CVF memory truthful, economical, and machine-checkable.

This batch closes a real gap:

- CVF already required traceability
- CVF did not yet define the storage granularity for durable memory records
- as a result, some records could become over-detailed and expensive without adding memory value

## Adopted Rule

`GC-022` now requires memory-bearing records to classify themselves as one of:

- `FULL_RECORD`
- `SUMMARY_RECORD`
- `POINTER_RECORD`

The class must match the document role and the canonical `docs/` taxonomy.

## Why This Matters

This adoption supports the context-continuity model directly:

- memory keeps durable facts/history/evidence
- handoff compresses transition truth
- context loading should load only the bounded phase-relevant material

Without memory-governance rules, traceability alone can drift into unnecessary detail and token waste.

## Changes Made

- added `governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md`
- added `docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md`
- added `governance/compat/check_memory_governance_compat.py`
- registered the rule in `CVF_MASTER_POLICY`
- registered control `GC-022` in `CVF_GOVERNANCE_CONTROL_MATRIX`
- linked the memory-class model to `CVF_DOCUMENT_STORAGE_GUARD`
- updated `docs/INDEX.md`, `docs/reference/README.md`, and `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`
- added memory-class markers to the changed memory-bearing docs in this batch
- added the new compat gate to `run_local_governance_hook_chain.py`

## Resulting Governance Truth

CVF now distinguishes between:

- full durable evidence
- durable summaries
- pointer-only routing records

This means memory storage is no longer governed only by "leave traceability".

It is now governed by **what level of durable detail is actually justified**.

## Verification

- `python governance/compat/check_memory_governance_compat.py --enforce`
- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Closing Readout

> `GC-022` turns CVF memory storage from a loose traceability habit into a governed storage standard. Durable evidence stays available, while low-yield duplication is pushed down into summary or pointer-only form.
