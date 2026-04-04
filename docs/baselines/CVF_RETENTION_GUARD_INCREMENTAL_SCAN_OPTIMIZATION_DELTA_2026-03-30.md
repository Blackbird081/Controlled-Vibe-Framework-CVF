# CVF Retention Guard Incremental Scan Optimization Delta — 2026-03-30
Memory class: SUMMARY_RECORD

> Scope: optimize audit/review retention registry guards so local and CI enforcement stay strict without re-running unnecessary full archive scans on unrelated changes

## What changed

- updated `governance/compat/check_review_retention_registry.py`
- updated `governance/compat/check_audit_retention_registry.py`
- both guards now detect whether the current changed set can actually affect retention truth
- if no retention-affecting paths changed, dynamic archive-plan recomputation is skipped
- if retention-affecting paths changed, the guards still run the full dynamic blocked-path scan
- CI now passes explicit `BASE_SHA/HEAD_SHA` into both retention guards so changed-range detection is deterministic

## Retention-Affecting Change Rule

Full dynamic scan remains mandatory when the changed set touches:

- `docs/reviews/` or `docs/audits/`
- `docs/reference/`
- `docs/roadmaps/`
- `docs/baselines/`
- `AGENT_HANDOFF.md`
- `docs/INDEX.md`
- `docs/CVF_CORE_KNOWLEDGE_BASE.md`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- retention registries
- active window registry

If none of those surfaces changed, the guards now stay in static-validation mode and skip the expensive archive-plan rebuild.

## Why

- preserve strict retention correctness where archive truth can really drift
- eliminate heavy full-tree recomputation on code-only or unrelated governance changes
- keep auto-run hooks usable by default instead of making every push pay the same worst-case scan cost

## Result

- retention guards remain fail-closed on relevant doc and registry changes
- unrelated pushes avoid the previous 50-120 second retention scan penalty
