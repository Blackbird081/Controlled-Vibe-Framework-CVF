# CVF Agent Handoff Lane Split Delta — 2026-04-03

Memory class: SUMMARY_RECORD
Status: summarized handoff-lane split for canonical and pre-public relocation work.

## Summary

This delta records the split between the canonical `cvf-next` handoff and the separate pre-public relocation handoff.

## Consolidated Truth

- `AGENT_HANDOFF.md` now focuses on canonical tranche execution only
- pre-public relocation status is moved to:
  - `PREPUBLIC_RELOCATION_HANDOFF.md`
- `cvf-next` is no longer presented as the place to continue relocation work
- relocation execution remains isolated in the secondary worktree

## Explicitly Unchanged

- no relocation diff is landed on `cvf-next`
- no tranche status is changed by this split
- no new relocation packet is approved by this split
