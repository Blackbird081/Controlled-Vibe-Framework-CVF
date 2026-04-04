# CVF GC-020 Remote Tracking Loop Fix Delta — 2026-03-30
Memory class: SUMMARY_RECORD

> Scope: remove the impossible exact-remote-SHA handoff invariant that caused self-updating push loops

## Problem

- `AGENT_HANDOFF.md` was being forced to contain the exact live upstream SHA
- but a commit that updates handoff and is then pushed necessarily changes the upstream SHA again
- this created a non-converging loop where every successful push made the handoff stale by one commit

## Fix

- `GC-020` now requires the handoff to record the tracked remote branch, not an exact hand-maintained remote tip SHA
- exact remote SHA is now treated as live git truth to be derived when needed
- `check_agent_handoff_guard_compat.py` now validates tracked remote branch presence instead of exact remote SHA equality
- the handoff template, context continuity model, and live handoff were updated to match the new invariant

## Result

- no more self-updating push loop
- handoff remains truthful and stable across the push boundary
- remote exact SHA remains available from git, where it belongs
