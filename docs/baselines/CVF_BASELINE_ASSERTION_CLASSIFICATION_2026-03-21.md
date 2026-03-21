# CVF Baseline Assertion Classification
> **Date:** 2026-03-21
> **Classification Legend:** `Correct`, `Stale`, `Wrong`, `Not Authorized`

## 1. `CVF_CURRENT_STATE_SNAPSHOT_2026-03-20.md`

| Assertion Family | Statement | Classification | Why |
|---|---|---|---|
| Phase model | Canonical loop is `INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE` | Correct | Matches current shared contract and runtime parsing |
| Legacy alias | `DISCOVERY` is compatibility-only vocabulary | Correct | Matches boundary normalization in current code |
| Execution topology | All execution goes through one `GuardEngine` singleton across all fronts | Stale | Too strong for current official posture |
| Guard baseline | Current system is a fixed `13-guard` core | Wrong | Current shared default is 8, full runtime preset is 15 |
| Governance posture | Active wave is delivered and depth-frozen | Correct | Matches current governance posture |

## 2. `CVF_CURRENT_TO_NEW_MAPPING.md`

| Assertion Family | Statement | Classification | Why |
|---|---|---|---|
| Phase correction | There is no canonical `EXECUTE` phase; execution happens inside `BUILD` | Correct | Matches current repo |
| Overlap detection | Many proposed modules overlap existing CVF modules and must merge | Correct | Directionally sound and architecturally useful |
| Risk model | Target mapping should use `L0-L4` | Wrong | Current baseline remains `R0-R3` |
| Guard baseline | `CVF_GUARD_CONTRACT` equals a `13-guard` engine | Wrong | Current shared/default baseline does not match |
| Plane allocation | 3-plane target allocation is a valid restructuring lens | Stale | Useful as target-state, not current authorized structure |

## 3. `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`

| Assertion Family | Statement | Classification | Why |
|---|---|---|---|
| Phase model | Canonical 5-phase loop is immutable | Correct | Matches current baseline |
| Execution semantics | `EXECUTE` is not a canonical phase | Correct | Matches current baseline |
| Risk model | `L0-L4` officially replaces `R0-R3` | Wrong | Current codebase still uses `R0-R3` |
| Governance scope | All modules/planes/guards already inherit this whitepaper as frozen truth | Not Authorized | Wave is not authorized for implementation |
| Subsystem consolidation | Gateway, router, strategy, trust, audit, and context should be merged around stronger boundaries | Correct as concept | Architecturally strong as target-state guidance |

## 4. `CVF_V2_RESTRUCTURING_ROADMAP.md`

| Assertion Family | Statement | Classification | Why |
|---|---|---|---|
| Phase immutability | 5-phase loop must remain unchanged | Correct | Matches current baseline |
| Merge-first rule | Merge overlapping modules instead of creating duplicates | Correct | Strong architectural principle |
| Risk migration | Repo-wide removal of `R0-R3` is required in Phase 0 | Wrong | Conflicts with current baseline |
| Guard freeze | `GuardEngine singleton + 13 guards core` is untouchable truth | Wrong | Current baseline is not that exact model |
| Restructure authority | Big-bang 3-plane restructure is ready to execute | Not Authorized | Current continuation posture does not authorize it |
| Learning sequencing | Learning plane must be late | Correct | Matches sound EA sequencing |

## 5. `EA_CROSS_CHECK_ASSESSMENT.md`

| Assertion Family | Statement | Classification | Why |
|---|---|---|---|
| Review quality | Several earlier reviews are too positively biased | Correct | Matches current re-audit |
| Overlap concern | Reviews 7/8/9 and 3/5 overlap and need consolidation | Correct | Strongly supported by source docs |
| Trust layer concern | Review 12 must remain conditional until hardening gaps are closed | Correct | Supported by Red Team source |
| Risk mismatch | `R0-R3` vs `L0-L4` conflict must be resolved | Correct | Supported by current baseline |
| Immediate wave sequencing | Constitutional / Trust / System Reality should be immediate implementation priorities | Not Authorized | Useful prioritization idea, but not currently approved |
| Frozen-spec readiness | Package can become `CVF v2.0 Frozen Architecture Specification` after fixes | Not Authorized | Requires a future approved wave |

## Summary

### Clean assertions that can be retained now

- Canonical phase model
- `DISCOVERY` as boundary-only alias
- merge-first architecture principle
- subsystem overlap findings
- trust-layer hardening caveat
- learning plane should come last

### Assertions that must be treated as dirty until corrected

- any claim that current CVF already runs `L0-L4`
- any claim that current guard truth is exactly `13` guards
- any claim that the review package is already implementation-authorized
- any claim that current CVF is already fully restructured into a 3-plane source tree
