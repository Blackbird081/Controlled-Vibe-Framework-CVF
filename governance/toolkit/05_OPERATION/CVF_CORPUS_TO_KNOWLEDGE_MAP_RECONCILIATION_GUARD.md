# CVF Corpus-To-Knowledge-Map Reconciliation Guard

Memory class: POINTER_RECORD

**Control ID:** `GC-048`
**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active mandatory knowledge-map reconciliation guard.
**Applies to:** Humans and AI agents creating or relying on corpus-derived
knowledge maps, semantic-region ledgers, architecture reconciliations, Memory
syntheses, graphification plans, or retrieval-readiness claims.
**Enforced by:** `governance/compat/check_corpus_to_knowledge_map_reconciliation.py`

## Purpose

- keep corpus-derived knowledge maps traceable to source authority
- prevent graph, semantic-region, Palace, summary, and cache views from
  silently replacing source truth
- reject stale, orphaned, or arithmetically inconsistent maps
- protect non-coder operators from coherent-looking but incomplete synthesis

## Rule

Any applicable map or claim must follow:

`docs/reference/CVF_CORPUS_TO_KNOWLEDGE_MAP_RECONCILIATION_STANDARD_2026-06-01.md`

The output must contain `## Knowledge System Reconciliation` with authority,
derived-view, semantic-region, arithmetic, drift, rebuildability, retrieval
boundary, and adversarial-verification evidence.

`RECONCILED_VERIFIED` is forbidden unless:

```text
assets = mapped + deferred + unmapped
deferred = 0
unmapped = 0
drift check = PASS
```

## Enforcement Surface

- local pre-commit and pre-push hooks run
  `governance/compat/check_corpus_to_knowledge_map_reconciliation.py`
- autorun runs the same checker before dispatch, implementation, closure, and
  push
- documentation CI runs the same checker
- startup, authoring, and GC-018 templates route applicable work through this
  guard

## Related Artifacts

- `docs/reference/CVF_KNOWLEDGE_SYSTEM_METHOD_STANDARD_2026-06-01.md`
- `docs/reference/CVF_CORPUS_TO_KNOWLEDGE_MAP_RECONCILIATION_STANDARD_2026-06-01.md`
- `docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md`
- `governance/compat/check_corpus_to_knowledge_map_reconciliation.py`
- `governance/compat/test_check_corpus_to_knowledge_map_reconciliation.py`

## Final Clause

A knowledge map may be partial and still useful. It may not hide the partial
state or present a derived view as source authority.

