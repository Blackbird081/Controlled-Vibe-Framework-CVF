# CVF Corpus Intelligence Classification Guard

Memory class: POINTER_RECORD

**Control ID:** `GC-050`
**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active structural classification guard.
**Applies to:** Humans and AI agents classifying corpus knowledge for chatbot,
retrieval, legal/policy lookup, internal-decision lookup, or downstream answer
surfaces.
**Enforced by:** `governance/compat/check_corpus_intelligence_classification.py`

## Purpose

Keep corpus-derived knowledge classification from becoming vague prose. The
guard requires a ledger, evidence pointers, dispositions, owner surfaces, and
answer boundaries before an agent may claim a corpus is ready for intelligent
retrieval or question answering.

## Rule

Any changed governed artifact that includes a `Corpus Intelligence
Classification` claim or a `Corpus Intelligence Classification Ledger` must
follow:

`docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md`

The artifact must include a `## Corpus Intelligence Classification` block and a
ledger with these required columns:

- `sourcePath`
- `processingStatus`
- `knowledgeRegion`
- `ownerSurface`
- `disposition`
- `evidencePointer`

Accepted dispositions must carry an evidence pointer. Legal or policy corpora
must include the required domain fields. The response boundary must include the
four answer classes from the standard.

The checker is structural. It does not claim semantic correctness, legal
correctness, or that the agent understood the corpus.

## Enforcement Surface

- `governance/compat/check_corpus_intelligence_classification.py`
- `governance/compat/run_local_governance_hook_chain.py`
- `governance/compat/run_agent_autorun_workflow_gate.py`

## Related Artifacts

- `docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md`
- `docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md`
- `docs/reference/CVF_CORPUS_TO_KNOWLEDGE_MAP_RECONCILIATION_STANDARD_2026-06-01.md`
- `governance/compat/check_corpus_intelligence_classification.py`

## Final Clause

GC-050 says an agent classified corpus intelligence with discipline. It does not
say the classification is semantically correct; that remains review and
adversarial sampling work.
