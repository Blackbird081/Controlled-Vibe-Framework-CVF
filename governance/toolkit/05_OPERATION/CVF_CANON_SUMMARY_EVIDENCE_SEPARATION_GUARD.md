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

## Repository Profiles

The existing checker accepts an explicit `--profile private|public` selector.
The default is `private`, which retains its five established summary surfaces.
The `public` profile checks exactly these four surfaces:

- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
- `docs/INDEX.md`
- `AGENT_HANDOFF.md`

It does not require private session memory or roadmap files in the public
repository.

Both profiles apply the same missing-surface and typed-evidence checks. The
invoking workflow selects the profile for its repository; the checker never
infers a profile from missing files. Local pre-push and provenance checks keep
the private default unless they explicitly select another profile.

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
