# CVF GC-025 Session Bootstrap Guard Delta (2026-03-23)

Memory class: SUMMARY_RECORD
## Purpose

- record the adoption of `GC-025`
- make session-start bootstrap routing canonical and machine-enforced

## Added

- `governance/toolkit/05_OPERATION/CVF_SESSION_GOVERNANCE_BOOTSTRAP_GUARD.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `governance/compat/check_session_governance_bootstrap.py`

## Aligned

- `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `governance/compat/run_local_governance_hook_chain.py`
- `.github/workflows/documentation-testing.yml`
- `docs/INDEX.md`

## Governing effect

- new or resumed governed sessions must load one canonical bootstrap first
- workers must route into relevant controls instead of rereading every guard by default
- bootstrap, handoff, and memory are now explicitly separated in the canonical chain
