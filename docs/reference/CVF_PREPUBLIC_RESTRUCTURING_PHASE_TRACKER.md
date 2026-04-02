# CVF Pre-Public Restructuring Phase Tracker

Memory class: POINTER_RECORD
Status: active progress tracker for pre-public repository restructuring phases and delivered `P3` control points.

## Purpose

- give one compact progress surface for `P0` through `P5`
- separate formal phase-gate truth from execution readout
- help future agents see what is closed, what is partially delivered, and what is still blocked

## Tracking Rule

This tracker does not replace the machine-readable phase-gate registry.

Canonical split of responsibility:

- `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json`
  - formal gate truth for `P0`, `P1`, and `P2`
- this tracker
  - human-readable progress readout for all phases, including bounded `P3` control points

## Phase Snapshot

| Phase | Phase-Gate Status | Execution Readout | Current Meaning |
|---|---|---|---|
| `P0` | `CLOSED` | Delivered | Lifecycle/exposure inventory and registries are in place and may be cited as readiness evidence. |
| `P1` | `CLOSED` | Delivered | Root-level hygiene and root-file exposure posture are canonically classified. |
| `P2` | `CLOSED` | Delivered | Extension lifecycle and export-readiness posture are canonically classified. |
| `P3` | `PER-MOVE / BLOCKED BY DEFAULT` | `CP1-CP3 delivered` | Small bounded `P3` batches are possible, but every further physical move still requires fresh `GC-019` plus `GC-039`. |
| `P4` | `BLOCKED` | Not started | Public navigation, packaging, and publication-model execution remain blocked behind later authorization. |
| `P5` | `BLOCKED` | Not started | Retirement/archive closure remains downstream of a stable `P3/P4` outcome. |

## P3 Control-Point Readout

| Control Point | Status | Result |
|---|---|---|
| `P3/CP1` | Delivered | Retired `CVF Edit/`, `CVF_Important/`, and `CVF_Restructure/` from the visible root. |
| `P3/CP2` | Delivered | Reconciled visible-root truth; `.claude/`, `.vscode/`, and worktree `.git` are treated as local/worktree metadata, and stale `REVIEW/` / `public/` root claims were removed from active canon. |
| `P3/CP3` | Delivered | Audited `v1.0/` and `v1.1/`; both remain blocked from the near-term move set because dependency footprint is still too high. |

## What P3 Is Allowed To Do Next

Allowed next step:

- open another bounded `GC-019` packet for a specific move set that is smaller than the unresolved dependency horizon and still satisfies `GC-039`

Not currently allowed:

- broad relocation wave
- `v1.0/` move
- `v1.1/` move
- `P4` public packaging execution
- publication-model execution by implication from cleanup alone

## Immediate Follow-Up Focus

Near-term focus should stay in this order:

1. keep `P3` truth accurate and low-blast-radius
2. identify smaller relocate-safe roots or families that do not carry `v1.0/` / `v1.1/` style reference density
3. delay any `P4` packaging/public-navigation execution until a later explicit authorization wave chooses the target publication model

## Canonical Sources

- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json`

## Final Clause

Progress tracking is useful only if it preserves boundary truth. This tracker must stay consistent with the formal gate registry and the latest approved `GC-019` packet chain.