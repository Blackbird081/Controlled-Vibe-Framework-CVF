# CVF GC-039 P4 Packaging Landing Path Resolution Delta — 2026-04-04

Memory class: SUMMARY_RECORD
Status: resolves the P3/CP4 canonical landing-path hold by defining what from `restructuring/p3-cp2-retained-internal-root-relocation` is authorized to land on `cvf-next`.

## Purpose

- close the governance ambiguity hold recorded in `docs/baselines/CVF_P3_CP4_CANONICAL_LANDING_PATH_REASSESSMENT_DELTA_2026-04-02.md`
- extend `GC-039` with post-P4 landing semantics
- define the canonical cherry-pick scope so a follow-on agent can execute the landing without re-opening governance

## Context

The P3/CP4 hold stated:

> "no agent should attempt to canonize P3/CP2 onto cvf-next until the landing rule is resolved explicitly"
> "required follow-up: separate governance clarification or guard amendment before any merge-back attempt"

The P4 governance lane on `restructuring/p3-cp2-retained-internal-root-relocation` completed through CP17 (2026-04-03). `npm publish` is AUTHORIZED and pending human execution. The remaining open item is the GC-039 landing path to `cvf-next`.

## Landing Path Decision

### Excluded From Landing — stays on restructuring branch only

| Item | Commit | Reason |
|---|---|---|
| `P3/CP2` physical directory move | `d51485b8` | `cvf-next` adopted freeze-in-place for `CVF_SKILL_LIBRARY/` and `ui_governance_engine/` in commit `6e74a9b7`; landing the move would conflict with the canonical freeze decision |

The `CVF_SKILL_LIBRARY/` and `ui_governance_engine/` roots remain at their current locations on `cvf-next`. The restructuring branch preserves them as a record of what was explored, but the physical move is not a canonical `cvf-next` truth.

### Authorized to Land — cherry-pick scope

All of the following are documentation-and-governance-only additions that are safe to land without conflicting with the freeze-in-place decision:

| Scope | Commits (inclusive) | Description |
|---|---|---|
| `P3/CP3` governance artifacts | `0bd6c95b` | Frozen-reference reassessment hold record |
| `P3/CP4` governance artifacts | `81b9d468` | Canonical landing-path reassessment hold record |
| `P3/CP5` governance artifacts | `049446d9` | Foundation-anchor preservation pivot record |
| `P4/CP1–CP5` governance artifacts | `ead93980`–`cf372573` | Front-door planning, docs mirror, export shortlist, packaging boundary, navigation |
| `P4/CP6` root front-door sync | `a83b0154` | README and START_HERE alignment for external readers |
| `P4/CP7–CP9` module export boundary | `5a6cb4cc`, `32e87dd7`, `c5597333` | Export maps and README rewrites for `CVF_v3.0_CORE_GIT_FOR_AI`, `CVF_GUARD_CONTRACT`, `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` |
| `P4/CP10–CP13` readiness work | `8bf05fc5`, `b3dd8010`, `4369a231`, `5b287c46`, `c62c144d`, `6ca4352f` | Shortlist consolidation, re-assessments, documentation completion |
| `P4/CP14–CP17` publication decision | `c48eb81a`, `64aa524b`, `70a342bd`, `bd4a4f73` | Publication decision, publish implementation, packaging architecture, readiness record |
| W34-T1 retain-evidence fixes | `85b32a19`, `bdea3fc3`, `2c7682a1`, `6f65b52b` | Audit retention registry updates for W34-T1 reviews |

Note: W31/W32 retain-evidence fix (`1f64ac94` on restructuring branch) is already present on `cvf-next` as commit `4e7895d0` — skip this commit during cherry-pick.

## Cherry-Pick Execution Instructions

When executing the landing:

```bash
# From cvf-next worktree
# Cherry-pick in chronological order, skipping d51485b8 (P3/CP2 physical move)
git cherry-pick 0bd6c95b 81b9d468 049446d9 ead93980 11ea4401 ac037ddb 45a68807 cf372573 a83b0154 5a6cb4cc 32e87dd7 c5597333 8bf05fc5 b3dd8010 4369a231 5b287c46 c62c144d 6ca4352f c48eb81a 64aa524b 70a342bd bd4a4f73 85b32a19 bdea3fc3 2c7682a1 6f65b52b
# If a cherry-pick conflict arises in a freeze-in-place reference file,
# accept the cvf-next version (the freeze decision is authoritative here).
```

Conflicts expected:
- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`: cvf-next version has the freeze-in-place posture; accept `cvf-next` side for freeze-in-place root list
- `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`: same; accept `cvf-next` side
- `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`: accept `cvf-next` side (freeze reflects the canonical root state)

## GC-039 Rule Extension

This delta extends `GC-039` with the following binding rule:

> The `P3/CP2` physical move of `CVF_SKILL_LIBRARY/` and `ui_governance_engine/` must not land on `cvf-next` while the freeze-in-place posture is active. Any future proposal to land that move must:
> 1. open a preservation override review that explicitly reopens both roots
> 2. pass a fresh `GC-039` readiness check
> 3. update the freeze-in-place root list in `AGENT_HANDOFF.md` and `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`

## Artifacts Added

- `docs/baselines/CVF_GC039_P4_PACKAGING_LANDING_PATH_DELTA_2026-04-04.md` (this file)

## Related Updates

- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md` — landing path resolution section added
- `AGENT_HANDOFF.md` — landing path status updated to AUTHORIZED (pending cherry-pick execution)

## Closure Statement

The P3/CP4 canonical landing-path hold is resolved. Cherry-pick of P4 packaging governance artifacts and module export boundary changes is AUTHORIZED. P3/CP2 physical directory move is EXCLUDED from `cvf-next` under the current freeze-in-place posture.
