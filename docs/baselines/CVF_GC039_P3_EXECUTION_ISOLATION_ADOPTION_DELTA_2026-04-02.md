# CVF GC-039 P3 Execution Isolation Adoption Delta — 2026-04-02

Memory class: SUMMARY_RECORD

## Purpose

- record the tightening of `GC-039` so future `P3` physical relocation waves cannot execute directly on `cvf-next`
- lock execution isolation through a dedicated `restructuring/p3-*` branch plus a secondary git worktree

## Change Summary

- updated `docs/reference/CVF_PREPUBLIC_P3_READINESS.md` to require branch/worktree isolation for any future physical `P3` relocation
- updated `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md` to make the execution-isolation rule binding
- updated `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md` to state the same `P3` execution requirement
- updated `AGENT_HANDOFF.md` so follow-on agents see the isolation rule before opening the next relocation wave
- extended `governance/toolkit/05_OPERATION/CVF_PREPUBLIC_P3_READINESS_GUARD.md`
- extended `governance/compat/check_prepublic_p3_readiness.py` and its unit tests so the rule is machine-enforced

## Enforced Rule

Any future physical `P3` relocation wave must:

1. run on a dedicated branch matching `restructuring/p3-*`
2. run from a secondary git worktree
3. remain subject to fresh `GC-019` authorization and `GC-039` readiness pass

## Operational Consequence

- `cvf-next` stays canonical and reviewable
- structural relocation waves become isolated, diffable, and easier to roll back
- copy-based side work remains discouraged in favor of branch + worktree isolation
