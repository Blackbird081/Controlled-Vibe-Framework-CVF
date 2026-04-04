# CVF GC-023 Guard Hardening Delta (2026-03-27)

Memory class: SUMMARY_RECORD
## Purpose

- close the self-authorization gap where an agent could mutate governed file-size exceptions during a normal commit
- move GC-023 enforcement back onto the repo-managed hook path instead of relying on a local-only `.git/hooks` file
- make the exception-registry schema fail closed when bump metadata is incomplete

## What Changed

- hardened `governance/compat/check_governed_exception_registry.py`
- added baseline comparison against `HEAD` so:
  - new exception entries are blocked in the normal pre-commit path
  - existing `approvedMaxLines` changes are blocked in the normal pre-commit path
- required every threshold class to declare `maxAllowedBumpPercent`
- wired the exception-registry guard into the repo-managed pre-commit chain in `governance/compat/run_local_governance_hook_chain.py`
- aligned operator guidance in `.agents/workflows/pre-commit-check.md`
- aligned local hook installation messaging in `scripts/install-cvf-git-hooks.ps1`
- added regression coverage in `governance/compat/test_check_governed_exception_registry.py`

## Governing Effect

- GC-023 now treats exception registry mutations as governed changes, not as agent-available shortcuts
- adding a new exception or bumping an existing cap now requires explicit human review and a deliberate override path
- repo-managed `.githooks/pre-commit` is again the canonical enforcement surface for GC-023

## Verification

- `python governance/compat/test_check_governed_exception_registry.py`
- `python governance/compat/check_governed_exception_registry.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-commit`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
