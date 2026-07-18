# CVF Corpus Completeness And Report Integrity Guard

Memory class: POINTER_RECORD

**Control ID:** `GC-047`
**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active mandatory corpus-evidence guard.
**Applies to:** Humans and AI agents producing reports, comparisons, audits,
extractions, migrations, inventories, or knowledge-absorption decisions from a
bounded existing project corpus.
**Enforced by:** `governance/compat/check_corpus_completeness_report_integrity.py`

## Purpose

- prevent complete-sounding reports from silently omitting project files
- require filesystem-backed corpus inventory before agent conclusions
- make processing coverage, exclusions, drift, and report traceability visible
- protect non-coder operators from having to suspect omissions manually

## Rule

Any bounded-corpus output that claims full scan, complete inventory, all files
read, all files processed, or equivalent completeness must follow:

`docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md`

The output must contain a `## Corpus Completeness And Report Integrity` block
with manifest evidence, processing-ledger evidence, reconciliation, unresolved
files, exclusions, aggregation check, drift check, traceability, adversarial
verification, and one allowed corpus verdict.

`COMPLETE_VERIFIED` is forbidden while any manifest file lacks an allowed
terminal processing-ledger status.

Bare `rg --files` is ignore-sensitive and is not completeness evidence.
Ripgrep inventory must use `rg --files --hidden --no-ignore`.

## Enforcement Surface

- local pre-commit and pre-push hook chains run
  `governance/compat/check_corpus_completeness_report_integrity.py`
- the autorun workflow runs the same checker before dispatch,
  implementation, closure, and push
- CI runs the same checker in the documentation workflow
- `AGENTS.md`, `CLAUDE.md`, and the GC-018 template route agents through this
  guard before bounded-corpus conclusions are accepted

## Related Artifacts

- `docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md`
- `docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-06-01.md`
- `docs/audits/CVF_LEGACY_SCAN_COMPLETENESS_FAILURE_AUDIT_2026-06-01.md`
- `governance/compat/check_corpus_completeness_report_integrity.py`
- `governance/compat/test_check_corpus_completeness_report_integrity.py`

## Final Clause

An agent may bound a report honestly. It may not silently shrink the corpus and
then publish a complete-sounding conclusion.
