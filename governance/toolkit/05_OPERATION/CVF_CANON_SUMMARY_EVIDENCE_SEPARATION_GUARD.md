# CVF Canon Summary Evidence Separation Guard

**Control ID:** `GC-036`
**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active maintainability rule for canonical summary surfaces.
**Applies to:** canonical summary docs such as whitepaper, tracker, handoff, index, and active roadmap summary surfaces.
**Enforced by:** `governance/compat/check_canon_summary_evidence_separation.py`

## Purpose

- keep canonical summary docs readable as the evidence graph grows
- stop summary surfaces from absorbing typed evidence fields that belong in baselines, reviews, audits, or log artifacts
- preserve a clean navigation layer for future tranche drafting and governance review

## Rule

Canonical summary docs must summarize and point.

They may:

- state tranche posture, quality posture, and aggregate metrics
- cite the governing evidence artifact
- provide reader navigation across canon

They must not:

- inline typed evidence payloads or field-level trace/report metadata that belong in full evidence artifacts
- silently replace baselines, reviews, audits, or measurement records

The canonical maintainability authority is:

- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_canon_summary_evidence_separation.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

## Related Artifacts

- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
- `AGENT_HANDOFF.md`
- `docs/INDEX.md`
- `governance/compat/check_canon_summary_evidence_separation.py`

## Final Clause

Summary canon should shorten the path to truth, not duplicate the full evidence payload.
