# CVF Governance Control Index

Memory class: FULL_RECORD

INDEX type: IDX-3

Source authority: `docs/roadmaps/CVF_MSEA_R72_EA_ASSESSMENT_INTAKE_AND_GOVERNANCE_LOAD_REBALANCING_ROADMAP_2026-07-07.md`

Status: ACTIVE_REFERENCE

Date: 2026-07-07

Human-reviewable: YES

Claim boundary: This index is a lifecycle, cost, value, and overlap management
surface for governance controls. It does not replace each control's canonical
standard, matrix row, checker source, hook catalog, or work-order authority.
It does not delete, disable, or consolidate any control by itself.

Public Export Disposition: DEFERRED_PRIVATE_ONLY

EPISTEMIC_PROCESS_NA_WITH_REASON: lifecycle and routing index; it records a
management taxonomy and current control-family baseline, not an experimental
prediction or live behavioral proof.

## Purpose

Make governance itself governable.

CVF already has strong control surfaces, but R72 found a governance-load
imbalance: control volume and ceremony grew while product-value flow slowed.
This index is the official front door for applying minimum effective governance
to CVF controls. It records why a control family exists, who owns it, which
phase it affects, how costly it is, what value evidence supports it, where it
overlaps with other controls, and what lifecycle state applies.

This completes the front-door refactor for governance-control management. It
does not complete checker-by-checker retirement. Future R72B/R72F work must use
this index as the management spine before any control is retired,
consolidated, or widened.

## Scope / Applies To

Applies to:

- governance standards and guard families under `docs/reference/`;
- checker families and hook phases under `governance/compat/`;
- lifecycle registries, generated governance read models, and front doors;
- Fast Lane and full-ceremony routing decisions;
- public/provenance boundary, public export, and public-surface controls;
- session, handoff, work-order, closure, and source-verification controls.

Does not apply to:

- product feature implementation;
- runtime/provider/live proof execution;
- public-sync mutation, push, or merge;
- production Memory/RAG, retrieval, vectorization, hosted release, or
  use-case/legal workflow release;
- direct checker deletion or hook removal without a later accepted work order.

## Source Verification Block

| Claimed item | Source or command | Verified section or command result | Disposition |
|---|---|---|---|
| R72 identifies governance-load imbalance and routes correction through R72A-R72F | `docs/roadmaps/CVF_MSEA_R72_EA_ASSESSMENT_INTAKE_AND_GOVERNANCE_LOAD_REBALANCING_ROADMAP_2026-07-07.md` | `## Work Plan`; `## Design Principle`; `## Problem Statement` | ACCEPT |
| Existing control ownership matrix maps 50 GC rows but lacks lifecycle/cost/retirement fields | `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`; command `Select-String -Pattern '^\\| `GC-'` | `gcRows=50`; matrix columns are ownership/enforcement/evidence, not lifecycle/cost/retirement | ACCEPT |
| Existing task guard front door routes agents to guard surfaces but is not a lifecycle/cost index | `docs/reference/guard_orientation/README.md` | `## Purpose`; `## Task Class Guard Map`; `## Claim Boundary` | ACCEPT |
| Current direct checker-script baseline is 186 `check_*.py` files with zero direct checker deletion in git history | command `rg --files governance/compat` filtered for `check_*.py`; `git log --all --diff-filter=A/D --name-only -- governance/compat/*.py` | `checkerCount=186`; `added=186`; `deleted=0` for direct checker-script scope at `778adb4c3` | ACCEPT |
| INDEX artifact metadata requirements apply to this file | `docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md` | `## Required Metadata Per INDEX Artifact`; `IDX-3` | ACCEPT |
| Storage-class front-door registration applies to this new reference artifact | `docs/reference/reference_artifact_storage/CVF_REFERENCE_ARTIFACT_STORAGE_CLASS_STANDARD.md` | `SC-1: STABLE_REFERENCE_FRONT_DOOR`; reference artifact index relationship | ACCEPT |

## Relationship To Existing Governance Surfaces

| Surface | Role | Relationship |
|---|---|---|
| `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md` | owner and enforcement map | GCI consumes it as ownership evidence; the matrix remains the canonical owner/evidence map |
| `docs/reference/guard_orientation/README.md` | task-first guard router | GCI complements it with lifecycle, cost, value, and overlap management |
| `governance/compat/agent_autorun_command_catalog.py` | autorun phase command catalog | GCI classifies phase/control-family cost; it does not edit command definitions |
| `governance/compat/run_local_governance_hook_chain.py` | local hook runner | GCI classifies hook-family cost; it does not edit hook chains |
| `docs/reference/CVF_REFERENCE_ARTIFACT_INDEX.md` | reference storage class index | GCI is listed there as a stable reference front door |
| `docs/reference/agent_defect_intelligence/` | repeated defect-pattern registry | GCI uses ADIF value evidence when a control exists because of repeated defects |

## Lifecycle State Vocabulary

| State | Meaning | Allowed action |
|---|---|---|
| ACTIVE | Control is still justified and should run or be cited normally | keep; review during major roadmap changes |
| WATCH | Control is valuable but has known cost, overlap, or false-positive pressure | keep; collect cost/value evidence before changing |
| CONSOLIDATION_CANDIDATE | Control overlaps materially with another control family | author a consolidation packet before changing implementation |
| RETIRE_CANDIDATE | Control may no longer justify its cost under source-backed criteria | author a retirement packet before disabling/removing anything |
| RETIRED | Control has been retired by accepted work order and closure evidence | keep historical record; do not run as active control |
| PROTECTED | Control guards critical public/private, source-fidelity, or live-proof safety and cannot be lightened without fresh operator authorization | keep; no Fast Lane retirement |

## Cost And Value Classes

| Class | Meaning |
|---|---|
| C0 | negligible read/navigation cost |
| C1 | low documentation or checklist cost |
| C2 | moderate local gate or artifact-shape cost |
| C3 | high multi-gate, multi-artifact, or repeated-review cost |
| C4 | very high runtime/live/public mutation or broad hook-chain cost |
| V0 | no current value evidence found |
| V1 | plausible value, evidence not yet tied to a concrete defect or release risk |
| V2 | source-backed value evidence from standard, defect, or accepted tranche |
| V3 | repeated defect or public/private boundary value evidence |
| V4 | critical safety, release, live-proof, or public/private boundary value evidence |

## Required Fields For Future Control Rows

Any future row added to this index or to a generated child inventory should
include at least:

| Field | Required meaning |
|---|---|
| controlId | stable ID for the control family or specific checker |
| controlName | human-readable name |
| controlType | standard, checker, hook phase, registry, front door, template, policy |
| ownerSurface | canonical source file or matrix row |
| enforcementPhase | startup, pre-dispatch, pre-implementation, pre-closure, pre-commit, pre-push, CI, manual review |
| riskClass | public-boundary, source-fidelity, closure, live-proof, session-continuity, artifact-shape, runtime-safety, product-value |
| costClass | C0 through C4 |
| valueClass | V0 through V4 |
| evidenceOfValue | concrete defect, accepted tranche, public-risk, or source standard evidence |
| overlapGroup | named group for controls that may duplicate each other |
| lifecycleState | ACTIVE, WATCH, CONSOLIDATION_CANDIDATE, RETIRE_CANDIDATE, RETIRED, or PROTECTED |
| retirementCriteria | source-backed condition required before retirement or consolidation |
| lastReviewed | ISO date of last lifecycle review |

## Control Family Index

| controlId | controlName | controlType | ownerSurface | enforcementPhase | riskClass | costClass | valueClass | overlapGroup | lifecycleState | retirementCriteria |
|---|---|---|---|---|---|---|---|---|---|---|
| GCI-001 | Session Continuity And Handoff Controls | front door + state registry + handoff guard | `CVF_SESSION_MEMORY.md` (CVF-governed front door, not provider-private); `CVF_SESSION/ACTIVE_SESSION_STATE.json`; `AGENT_HANDOFF_V38_2026-07-06.md` | startup; session-sync; pre-commit | session-continuity | C2 | V4 | continuity | PROTECTED | not eligible while multi-agent continuation depends on active handoff/state truth |
| GCI-002 | Work-Order Source Verification Controls | template + dispatch checker | `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`; `governance/compat/check_work_order_dispatch_quality.py` | pre-dispatch | source-fidelity | C3 | V4 | source-fidelity | PROTECTED | not eligible; may only consolidate duplicate literal-shape checks after equivalent source-fidelity proof exists |
| GCI-003 | Agent Handoff Contract Controls | standard + checker | `docs/reference/agent_handoff/README.md`; `governance/compat/check_agent_handoff_boundary.py` | pre-dispatch; pre-implementation | session-continuity | C2 | V3 | continuity | ACTIVE | consolidation only if session state and handoff contract evidence remain machine-checkable |
| GCI-004 | Public/Provenance Boundary Controls | critical boundary standard + public export guard | `docs/reference/CVF_AGENTS_CRITICAL_REPOSITORY_BOUNDARY_2026-06-23.md`; `governance/compat/check_public_export_disposition.py` | public-sync; pre-push; closure | public-boundary | C3 | V4 | public-boundary | PROTECTED | not eligible while provenance/public split remains active |
| GCI-005 | Live Governance Proof Controls | live-proof and diagnostic standards | `docs/reference/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md`; `AGENTS.md` live proof section | live proof; release proof | live-proof | C4 | V4 | live-proof | PROTECTED | not eligible; Fast Lane cannot bypass real-provider proof for governance behavior claims |
| GCI-006 | ADIF Defect Registry Controls | defect registry + disclosure checker | `docs/reference/agent_defect_intelligence/README.md`; `governance/compat/check_adif_defect_registry_disclosure.py` | pre-dispatch; pre-implementation | artifact-shape; repeated-defect | C2 | V3 | defect-memory | ACTIVE | can consolidate only with a replacement shared defect-memory resolver |
| GCI-007 | Guard Orientation And Literal-Format Controls | orientation front door + gotcha checklist | `docs/reference/guard_orientation/README.md`; `docs/reference/CVF_GOVERNED_ARTIFACT_LITERAL_FORMAT_GOTCHAS_2026-06-25.md` | startup; authoring | artifact-shape | C1 | V3 | authoring-shape | ACTIVE | can move individual gotchas to archive only after checker/source behavior changes or no active trigger remains |
| GCI-008 | Markdown Structural Completeness Controls | structural standard + checker | `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`; `governance/compat/check_markdown_structural_completeness.py` | pre-implementation; pre-commit | artifact-shape | C2 | V2 | authoring-shape | WATCH | eligible for calibration if low-risk docs repeatedly fail only cosmetic shape without review value loss |
| GCI-009 | External Knowledge Intake Controls | absorption chain map + absorption guards | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md`; `governance/compat/check_external_absorption_core.py` | pre-implementation; review | source-fidelity; product-value | C3 | V3 | external-intake | WATCH | eligible for risk-tier routing after R72E defines representative-proof thresholds |
| GCI-010 | Fast Lane Governance Controls | Fast Lane guard + audit template | `docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md`; `governance/toolkit/05_OPERATION/CVF_FAST_LANE_GOVERNANCE_GUARD.md` | dispatch; review | product-value; artifact-shape | C1 | V2 | ceremony-router | WATCH | may be widened only after R72C case matrix proves no public/private or source-fidelity weakening |
| GCI-011 | Generated State Aggregate Controls | generated aggregate standards + generators | `docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md`; `governance/compat/generate_active_session_state.py` | session-sync; pre-commit | session-continuity | C2 | V3 | generated-state | ACTIVE | consolidation only if generator drift checks remain equivalent |
| GCI-012 | Reference Artifact Storage And Index Controls | storage standard + reference artifact index | `docs/reference/reference_artifact_storage/CVF_REFERENCE_ARTIFACT_STORAGE_CLASS_STANDARD.md`; `docs/reference/CVF_REFERENCE_ARTIFACT_INDEX.md` | authoring; review | source-fidelity | C1 | V2 | reference-index | ACTIVE | can consolidate with GCI only if storage-class citation rules stay explicit |
| GCI-013 | Core Guard Self-Protection Controls | self-protection guard + authorization block | `governance/compat/check_core_guard_self_protection.py`; `governance/toolkit/05_OPERATION/CVF_CORE_GUARD_SELF_PROTECTION_GUARD.md` | pre-implementation; pre-commit | public-boundary; checker-integrity | C3 | V4 | protected-control | PROTECTED | not eligible while agents can edit guard/checker/session surfaces |
| GCI-014 | Public Main CI And Public Surface Controls | public-surface and static CI gates | `governance/public-surface-manifest.json`; public-sync `scripts/run_cvf_static_ci_gate.py`; public-sync `scripts/check_public_surface.py` | CI; pre-push | public-boundary; product-value | C4 | V4 | public-release | WATCH | R72A must classify current failures before any lightening or expansion |
| GCI-015 | Governance Control Index Controls | this index + front door README | `docs/reference/governance_control_index/README.md`; `docs/reference/governance_control_index/CVF_GOVERNANCE_CONTROL_INDEX.md` | authoring; review | governance-load | C1 | V3 | governance-lifecycle | ACTIVE | may be generated or split only after the schema remains stable through one R72B/R72F cycle |
| GCI-017 | Worker-Return Quality Controls | standard + checker + scaffold | `docs/reference/work_order_authoring/CVF_WORKER_RETURN_QUALITY_GATE_STANDARD.md`; `governance/compat/check_worker_return_quality_gate.py`; `governance/compat/run_worker_return_scaffold.py` | pre-dispatch; worker return; review | source-fidelity; artifact-shape | C2 | V3 | authoring-shape | ACTIVE | consolidated pilot: keep blocking for evidence-bearing controls; compact only the three R72C conditional controls when dispatch-authenticated Fast Doc eligibility passes; review after measured pilot evidence |

## Baseline Measurement

| Metric | Scope | Value | Evidence |
|---|---|---|---|
| control matrix rows | rows beginning with `GC-` in `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md` | 50 | `Select-String -Pattern '^\\| `GC-'` |
| direct checker scripts | current `governance/compat/check_*.py` files at `778adb4c3` | 186 | `rg --files governance/compat` filtered for direct checker scripts |
| direct checker deletions | git history for `governance/compat/check_*.py` direct checker scripts | 0 | `git log --all --diff-filter=D --name-only -- governance/compat/*.py` |
| R72 broader governance-load signal | roadmap recomputation before this index | high-confidence imbalance | R72 roadmap Source Verification Block |

Metric boundary: the direct checker-script baseline counts only files named
`check_*.py`. It is narrower than any broader "governance Python surface"
metric that also counts runners, catalogs, generators, tests, and support
modules.

## Lifecycle Operating Rules

1. A future packet may not retire, disable, or remove a control only because it
   is annoying. It must name the control row, value evidence, cost evidence,
   overlap group, and retirement criteria.
2. A future packet may not create a new checker family without either adding a
   new GCI row or updating an existing row's overlap group and cost class.
3. `PROTECTED` controls cannot use Fast Lane retirement.
4. `WATCH` controls require cost/value evidence before widening or retiring.
5. `CONSOLIDATION_CANDIDATE` means duplicate governance should be merged or
   routed, not silently deleted.
6. `RETIRE_CANDIDATE` requires a fresh work order and accepted closure before
   any implementation change.
7. GCI rows are management metadata. Canonical behavior still lives in each
   cited standard, checker, hook catalog, registry, or runtime source.

## R72 Routing

| R72 tranche | How this index changes the work |
|---|---|
| R72A | public CI health triage must classify public-main failures against GCI-014 and record whether failures are product debt, governance load, or both |
| R72B | checker lifecycle inventory starts from GCI rows, then expands to checker-level child rows only where cost/value evidence justifies it |
| R72C | Fast Lane calibration uses GCI cost/value classes and the `PROTECTED` state to prevent unsafe lightening |
| R72D | monthly readout uses GCI metric boundaries so checker counts are reproducible |
| R72E | absorb lane reclassification maps intake controls to GCI-009 and GCI-010 instead of inventing a new ceremony path |
| R72F | first retirement/consolidation pilot must select one non-`PROTECTED` candidate row or child row and prove criteria are satisfied; if no candidate passes, closure must name at least one `WATCH` row and the exact missing evidence blocking it |

## Verification

| Gate or check | Result |
|---|---|
| Source read-ahead for index metadata | `docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md` read |
| Source read-ahead for reference storage class | `docs/reference/reference_artifact_storage/CVF_REFERENCE_ARTIFACT_STORAGE_CLASS_STANDARD.md` read |
| Source read-ahead for structural completeness | `governance/compat/check_markdown_structural_completeness.py` read |
| Source read-ahead for trace applicability | `governance/compat/check_agent_operation_trace.py` read |
| Direct checker-script baseline | `checkerCount=186`; `added=186`; `deleted=0` |

Correction note: broader recursive counts that match `check_.*.py` also include
`test_check_*.py` files. R72D metrics must keep the direct checker-script
baseline (`186` at `778adb4c3`) separate from broader governance Python or
checker-test surface counts.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer role |
| Provider or surface | local workspace |
| Session or invocation | R72 governance-control index front-door refactor, 2026-07-07 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | `rg`, `Select-String`, `git`, `apply_patch`, governance gates |
| Target paths | `docs/reference/governance_control_index/README.md`; `docs/reference/governance_control_index/CVF_GOVERNANCE_CONTROL_INDEX.md`; `docs/reference/CVF_REFERENCE_ARTIFACT_INDEX.md`; `docs/roadmaps/CVF_MSEA_R72_EA_ASSESSMENT_INTAKE_AND_GOVERNANCE_LOAD_REBALANCING_ROADMAP_2026-07-07.md` |
| Allowed scope source | operator requested a complete governance refactor through an official Governance Control Index, README, and R72 roadmap update |
| Before status evidence | R72 roadmap identified governance-load imbalance; existing control matrix mapped ownership but lacked cost/value/lifecycle/retirement metadata |
| After status evidence | GCI front door and index define lifecycle states, cost/value classes, control-family rows, baseline measurement, and R72 routing |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | docs/reference index/front-door plus R72 roadmap update only |
| Claim boundary | no checker deletion, checker disablement, hook catalog change, runtime/source/test/checker edit, public-sync mutation, provider/live proof, push, merge, or public/production claim |
| Agent type | reviewer/closer |
| Invocation ID | `msea-r72-governance-control-index-2026-07-07` |
| Expected manifest | `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`; `docs/reference/governance_control_index/CVF_GOVERNANCE_CONTROL_INDEX.md`; `docs/reference/work_order_authoring/CVF_WORKER_RETURN_FULL_GATE_CONTRACT_STANDARD.md`; `docs/reference/work_order_authoring/CVF_WORKER_RETURN_QUALITY_GATE_STANDARD.md`; `docs/reviews/CVF_MSEA_R84_LEAN_GOVERNANCE_FOLLOW_THROUGH_COMPLETION_REVIEW_2026-07-10.md`; `docs/roadmaps/CVF_MSEA_R84_LEAN_GOVERNANCE_FOLLOW_THROUGH_ROADMAP_2026-07-10.md`; `governance/compat/build_worker_return_skeleton_scaffold.py`; `governance/compat/check_work_order_dispatch_quality.py`; `governance/compat/check_work_order_dispatch_quality_core.py`; `governance/compat/check_worker_return_quality_gate.py`; `governance/compat/fixtures/woas_r3_worker_return_skeleton_golden.md`; `governance/compat/run_worker_return_scaffold.py`; `governance/compat/test_check_work_order_dispatch_quality_worker_return_contract.py`; `governance/compat/test_check_worker_return_quality_gate.py`; `governance/compat/test_run_worker_return_scaffold.py` |
| Actual changed set | `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`; `docs/reference/governance_control_index/CVF_GOVERNANCE_CONTROL_INDEX.md`; `docs/reference/work_order_authoring/CVF_WORKER_RETURN_FULL_GATE_CONTRACT_STANDARD.md`; `docs/reference/work_order_authoring/CVF_WORKER_RETURN_QUALITY_GATE_STANDARD.md`; `docs/reviews/CVF_MSEA_R84_LEAN_GOVERNANCE_FOLLOW_THROUGH_COMPLETION_REVIEW_2026-07-10.md`; `docs/roadmaps/CVF_MSEA_R84_LEAN_GOVERNANCE_FOLLOW_THROUGH_ROADMAP_2026-07-10.md`; `governance/compat/build_worker_return_skeleton_scaffold.py`; `governance/compat/check_work_order_dispatch_quality.py`; `governance/compat/check_work_order_dispatch_quality_core.py`; `governance/compat/check_worker_return_quality_gate.py`; `governance/compat/fixtures/woas_r3_worker_return_skeleton_golden.md`; `governance/compat/run_worker_return_scaffold.py`; `governance/compat/test_check_work_order_dispatch_quality_worker_return_contract.py`; `governance/compat/test_check_worker_return_quality_gate.py`; `governance/compat/test_run_worker_return_scaffold.py` |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance governance-control lifecycle index. Public export
requires a separate public-safe packet and operator authorization.

## Claim Boundary

This index is an official governance-control management surface. It creates a
stable lifecycle/cost/value/overlap front door for governance controls, but it
does not implement, remove, disable, rename, or consolidate any checker,
standard, hook, runtime source, test, public-sync file, provider route, or
public claim. A future implementation packet must still source-verify and
authorize any narrower change.
