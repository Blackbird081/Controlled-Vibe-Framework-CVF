# CVF GC-029 Extension Package Check Guard Delta (2026-03-26)

Memory class: SUMMARY_RECORD
Status: canonical receipt for promoting extension-level `npm run check` verification from a good habit into a mandatory repository guard.

## Purpose

- prevent touched extension packages from shipping with hidden package-level compile/type/test drift
- close the specific gap where focused tests and repo governance passed but package-level `check` was not re-run
- make extension-local verification mandatory whenever governed changes touch code, tests, or package config

## What Changed

CVF now has a dedicated extension package verification control:

- guard: `governance/toolkit/05_OPERATION/CVF_EXTENSION_PACKAGE_CHECK_GUARD.md`
- compat gate: `governance/compat/check_extension_package_check.py`
- local pre-push enforcement: `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement: `.github/workflows/documentation-testing.yml`

## Canonical Truth

- touched extension packages under `EXTENSIONS/` must pass `npm run check` before push when governed changes affect source, tests, or package-level config
- touched packages must expose `scripts.check` in `package.json`
- `GC-029` is a package-level verification control, not a replacement for tranche authorization, test logging, or release readiness

## Operational Effect

From this delta onward, extension-local technical debt like stale `TypeScript` or package-level config drift should be blocked at pre-push and CI instead of surfacing later as “small annoying leftovers”.
