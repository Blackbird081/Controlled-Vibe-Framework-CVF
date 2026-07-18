# CVF PLCS-T2 Registry-Companion Decision

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-16

Batch ID: PLCS-T2

dispatchBaseHead: 38c17198

dispatchCommit: 9b483168

## Scope / Applies-To

This decision applies only to future FPC-T2 C01, C02, C03, and C04
system-loop interlock registry-edit work orders. It decides whether those
future work orders must carry a PLCS absorption-intake companion reference
when they propose or implement an `ADD_INTERLOCK_ENTRY` registry update.

This packet does not edit the system-loop interlock registry. It does not
authorize C05. It does not implement a checker. It defines a bounded dispatch
constraint for later C01-C04 work orders.

## Purpose

PLCS-T1 closed the routing matrix that maps absorbed plane/layer findings into
workflow-chain ownership. FPC-T2 C01-C04 are already accepted as proposal-only
`ADD_INTERLOCK_ENTRY` candidates, but each still requires a separate
registry-edit work order.

PLCS-T2 prevents those future registry-edit batches from running as isolated
parallel lanes. The decision below makes the PLCS companion rule explicit:
each C01-C04 registry-edit work order must carry the shared PLCS routing row,
CCLV disposition, parallel-lane risk, and cross-reference needed to keep
Central Core + Local View aligned.

## Source Authority

| Source | Verified section | Relevant fact | Disposition |
|---|---|---|---|
| `docs/reference/CVF_PLCS_T1_ABSORPTION_TO_WORKFLOW_CHAIN_ROUTING_MATRIX_2026-06-16.md` | `## Section C: FPC-T2 Candidate Routing Summary` | C01-C04 are `ADD_INTERLOCK_ENTRY` proposal-only registry-edit candidates; C05 is `MACHINE_CHECK_FIRST` | ACCEPT |
| `docs/reviews/CVF_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_COMPLETION_2026-06-13.md` | `## Decision Result` | FPC-T2 accepted C01-C04 as proposal-only `ADD_INTERLOCK_ENTRY`; C05 remains machine-check-first | ACCEPT |
| `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_STANDARD_2026-06-02.md` | `## Required Registry Fields` | registry entries require fields including `id`, `upstreamPlane`, `downstreamPlane`, `routingRule`, `evidenceRefs`, and `automationLevel` | ACCEPT |
| `docs/reference/CVF_CENTRAL_CORE_LOCAL_VIEW_GOVERNANCE_REFACTOR_STANDARD_2026-06-16.md` | `## Required Central Facts`; `## Required Local References` | shared facts belong in a central core packet; local artifacts should carry concise local references | ACCEPT |
| `docs/roadmaps/CVF_PLANE_LAYER_WORKFLOW_CHAIN_SYSTEMIZATION_ROADMAP_2026-06-16.md` | `## Standing Operating Rule` | future foundation hardening touching absorption, planes, layers, memory, learning, workflow chains, or agent handoff governance must preserve Central Core + Local View | ACCEPT |
| `CVF_SESSION/state/entries/nextAllowedMove.json` | value | PLCS-T2 was an authorized bounded follow-up after PLCS-T1 closure | ACCEPT |

## Required First-Read Ledger

| Read ID | File | Evidence used |
|---|---|---|
| R1 | `docs/baselines/CVF_GC018_PLCS_T2_REGISTRY_COMPANION_DECISION_2026-06-16.md` | authorization, forbidden scope, acceptance criteria |
| R2 | `docs/reference/CVF_PLCS_T1_ABSORPTION_TO_WORKFLOW_CHAIN_ROUTING_MATRIX_2026-06-16.md` | Section C C01-C05 routing rows |
| R3 | `docs/reviews/CVF_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_COMPLETION_2026-06-13.md` | Decision Result table |
| R4 | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_STANDARD_2026-06-02.md` | Required Registry Fields |
| R5 | `docs/reference/CVF_CENTRAL_CORE_LOCAL_VIEW_GOVERNANCE_REFACTOR_STANDARD_2026-06-16.md` | Required Central Facts and Required Local References |
| R6 | `docs/roadmaps/CVF_PLANE_LAYER_WORKFLOW_CHAIN_SYSTEMIZATION_ROADMAP_2026-06-16.md` | Standing Operating Rule and PLCS-T2 tranche row |
| R7 | `CVF_SESSION/state/entries/nextAllowedMove.json` | PLCS-T2 allowed as a bounded follow-up after PLCS-T1 |

## Pre-Flight And Collision Evidence

| Check | Evidence | Disposition |
|---|---|---|
| Dispatch commit accepted | `9b483168 dispatch PLCS-T2 registry companion decision` | PASS |
| Handoff sync after dispatch | `29ec11b0 sync handoff after PLCS-T2 dispatch` | PASS |
| HEAD drift before material authoring | no material commits touched PLCS-T2 companion shape or interlock registry between `9b483168` and `29ec11b0` | PASS |
| Worktree before authoring | `git status --short` returned empty after dispatch commit | PASS |
| Negative search | `rg -n "PLCS-T2\|Registry.Companion\|registry.companion" docs` found the PLCS-T2 dispatch packet, roadmap row, and predecessor references only | PASS |
| Same-purpose collision | no prior PLCS-T2 decision packet found | PASS |

## Companion Entry Shape Definition

Future C01-C04 registry-edit work orders must include a PLCS companion block
with these minimum fields:

| Field | Required value shape |
|---|---|
| `plcs_routing_row` | exact PLCS-T1 Section C candidate label, such as `C01 Control Plane hook-chain-to-learning-intake` |
| `plcs_routing_disposition` | inherited PLCS-T1 disposition, currently `ADD_INTERLOCK_ENTRY` proposal-only for C01-C04 |
| `cclv_disposition` | `CENTRAL_FACTS_REQUIRED`, `LOCAL_VIEW_REQUIRED`, or `N/A with reason` |
| `parallel_lane_risk` | `low`, `medium`, or `high`, with reason |
| `plcs_cross_reference` | `docs/reference/CVF_PLCS_T1_ABSORPTION_TO_WORKFLOW_CHAIN_ROUTING_MATRIX_2026-06-16.md#section-c-fpc-t2-candidate-routing-summary` |
| `registry_edit_boundary` | explicit statement that the companion block is evidence/routing context, not registry mutation authority |
| `c05_boundary` | `DEFERRED_PENDING_FPC_T3_C01` when C05 is mentioned |

## Per-Candidate Decision Table

| Candidate | Companion ruling | Shape fields | CCLV disposition | Parallel-lane risk | Work-order constraint |
|---|---|---|---|---|---|
| C01 Control Plane hook-chain-to-learning-intake | REQUIRED | all minimum fields above | CENTRAL_FACTS_REQUIRED | medium: hook-chain output can become checker-local unless routed into learning intake evidence | Future C01 registry-edit work order must include the PLCS companion block and cite the C01 PLCS-T1 row before registry mutation is authorized |
| C02 Memory-to-Learning signal interlock | REQUIRED | all minimum fields above plus no-raw-memory-reinjection boundary | CENTRAL_FACTS_REQUIRED | high: memory-to-learning work can leak into provider memory or raw-memory assumptions without a central companion | Future C02 registry-edit work order must carry the PLCS companion block and preserve `rawMemoryReleased=false` / no raw reinjection boundaries |
| C03 Memory-to-Retrieval signal interlock | REQUIRED | all minimum fields above | LOCAL_VIEW_REQUIRED | medium: retrieval routing can become a local memory feature without explicit workflow-chain owner evidence | Future C03 registry-edit work order must include the PLCS companion block and state how retrieval intake remains local-view evidence under the shared PLCS rule |
| C04 DIR/DICE-to-downstream-adapter eligibility interlock | REQUIRED | all minimum fields above plus downstream-adapter-separate-GC018 boundary | CENTRAL_FACTS_REQUIRED | high: adapter eligibility can be misread as downstream adapter authorization without a central companion | Future C04 registry-edit work order must include the PLCS companion block and state that downstream adapter work still requires separate GC-018/operator authorization |

## C05 Companion Ruling Deferral

Decision: `DEFERRED_PENDING_FPC_T3_C01`.

C05 remains outside PLCS-T2 because both PLCS-T1 and FPC-T2 route it to
machine-check-first handling. A C05 companion ruling may be reopened only after
FPC-T3-C01 defines the epistemic process packet checker and its output signal.

## Registry-Edit Work Order Dispatch Constraint

Any future C01-C04 registry-edit work order must include a PLCS companion block
before dispatch-ready status. The block must cite this packet, cite the PLCS-T1
Section C row, declare the CCLV disposition, and state the parallel-lane risk
if the companion is absent.

The registry-edit work order must also keep the PLCS companion block separate
from the interlock registry entry fields. Companion evidence can justify why a
registry edit is in scope; it is not itself a registry entry and does not relax
the required fields from the system-loop interlock standard.

## Evidence Trace Block

| Evidence item | Source or command | Boundary |
|---|---|---|
| Required first reads complete | read ledger in this packet | source authority closed before decision authoring |
| Negative search result | `rg -n "PLCS-T2\|Registry.Companion\|registry.companion" docs` | no same-purpose decision packet collision |
| Changed set | `git diff --name-status 29ec11b0..HEAD` before closure commit | documentation-only changed set |
| Dispatch gate | pre-dispatch autorun and dispatch steward passed for `38c17198..HEAD` before `9b483168` | dispatch packet accepted |
| Closure gate | pre-closure autorun and closure steward must pass before final closure claim | closure evidence for decision packet |

## Machine Closure Package

| Closure item | Required artifact/path | Machine-readable evidence | Final status |
|---|---|---|---|
| Work order status | `docs/work_orders/CVF_AGENT_WORK_ORDER_PLCS_T2_REGISTRY_COMPANION_DECISION_FOR_CODEX_2026-06-16.md` | `Status: CLOSED_PASS_BOUNDED` | PASS |
| Decision packet | `docs/reference/CVF_PLCS_T2_REGISTRY_COMPANION_DECISION_2026-06-16.md` | `Status: CLOSED_PASS_BOUNDED` | PASS |
| Completion or reviewer artifact | `docs/reviews/CVF_PLCS_T2_REGISTRY_COMPANION_DECISION_COMPLETION_2026-06-16.md` | `Status: CLOSED_PASS_BOUNDED` | PASS |
| Roadmap state | `docs/roadmaps/CVF_PLANE_LAYER_WORKFLOW_CHAIN_SYSTEMIZATION_ROADMAP_2026-06-16.md` | PLCS-T2 row `CLOSED_PASS_BOUNDED` | PASS |
| Registry JSON | BLOCKED with reason: no registry edit authorized | N/A | BLOCKED with reason |
| Registry Markdown | BLOCKED with reason: no registry Markdown edit authorized | N/A | BLOCKED with reason |
| External evidence digest | N/A with reason: no external source or live proof used | N/A | N/A with reason |
| System loop interlock | N/A with reason: PLCS-T2 does not edit the registry | N/A | N/A with reason |
| Session continuity | N/A with reason: session sync follows material closure commit separately | N/A | N/A with reason |

## Finding-To-Governance Learning Disposition

| Field | Disposition |
|---|---|
| Defect class | `RULE_GAP` |
| Learning lane | `GOVERNANCE_CONTROL_PLANE` |
| Escalation state | `RULE_ADDED` |
| Next control action | Future C01-C04 registry-edit work orders must carry the PLCS companion block; PLCS-T3 may later promote this rule into a checker/template guard |
| Worker blame | `N/A_WITH_REASON`: the defect is a structural parallel-lane risk, not an individual worker error |

## Rescan Intelligence Hardening

- Original source artifact: N/A with reason - PLCS-T2 does not reopen a corpus
  rescan or new intake replay.
- Predecessor intake artifact: PLCS-T1 routing matrix and FPC-T2 completion
  review.
- Delta ledger status: COMPLETE_WITH_DECLARED_LIMITS - this packet records a
  companion-shape decision derived from already-governed inputs; it does not
  compute a new corpus delta.
- Routing matrix status: DO_NOW for the PLCS-T2 decision packet; C01-C04
  registry edits are separate future work orders; C05 is deferred.
- Semantic sampling status: bounded adversarial boundary sample below.
- Rescan intelligence verdict: COMPLETE_WITH_DECLARED_LIMITS

### Original-Intake Delta Ledger

| Delta category | PLCS-T2 disposition |
|---|---|
| `UNCHANGED_FROM_INTAKE` | FPC-T2 C01-C04 remain proposal-only `ADD_INTERLOCK_ENTRY` candidates |
| `CHANGED_DISPOSITION` | PLCS-T2 adds REQUIRED companion-block constraints to future C01-C04 work orders |
| `NEW_FINDING` | absent companion blocks create parallel-lane drift risk |
| `REMOVED_OR_REJECTED` | C05 companion ruling is deferred, not rejected |

### Follow-Up Routing Matrix

| Lane | Applies to | Rationale |
|---|---|---|
| DO_NOW | PLCS-T2 companion decision | this packet is the authorized bounded task |
| SEPARATE_RUNTIME_TRANCHE | C01-C04 registry-edit work orders | each registry edit requires a separate GC-018/work order |
| STRATEGIC_OPERATOR_DECISION | C05 companion ruling | blocked until FPC-T3-C01 exists |
| OUT_OF_SCOPE | provider/live proof, public-sync, runtime/source/test mutation, downstream adapter work | forbidden by GC-018/work order |
| RESOLVED_BY_DESIGN | PLCS-T1 routing matrix dispositions | inherited as source authority |

### Semantic Sampling / Adversarial Review

| sampleId | source section | source claim | disposition checked | adversarial challenge | verdict |
|---|---|---|---|---|---|
| PLCS-T2-S1 | Companion Entry Shape Definition | companion block is required before C01-C04 registry-edit dispatch | DO_NOW bounded decision only | Could this be misread as direct registry edit authorization? | PASS_BOUNDARY - registry edit remains forbidden in this tranche |
| PLCS-T2-S2 | C05 Companion Ruling Deferral | C05 companion ruling is deferred | STRATEGIC_OPERATOR_DECISION | Could C05 be bundled with C01-C04 because it appears in PLCS-T1 Section C? | PASS_BOUNDARY - C05 remains `DEFERRED_PENDING_FPC_T3_C01` |
| PLCS-T2-S3 | Per-Candidate Decision Table | C04 companion is required | SEPARATE_RUNTIME_TRANCHE boundary | Could adapter eligibility be misread as adapter authorization? | PASS_BOUNDARY - C04 requires a downstream-adapter separate-GC018 boundary |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex decision author |
| Provider or surface | Codex local workspace |
| Session or invocation | 2026-06-16 PLCS-T2 execution |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | rg, Get-Content, apply_patch, governance gates |
| Target paths | `docs/reference/CVF_PLCS_T2_REGISTRY_COMPANION_DECISION_2026-06-16.md`; `docs/reviews/CVF_PLCS_T2_REGISTRY_COMPANION_DECISION_COMPLETION_2026-06-16.md`; `docs/baselines/CVF_GC018_PLCS_T2_REGISTRY_COMPANION_DECISION_2026-06-16.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_PLCS_T2_REGISTRY_COMPANION_DECISION_FOR_CODEX_2026-06-16.md`; `docs/roadmaps/CVF_PLANE_LAYER_WORKFLOW_CHAIN_SYSTEMIZATION_ROADMAP_2026-06-16.md` |
| Allowed scope source | operator PLCS-T2 selection on 2026-06-16; GC-018 PLCS-T2 baseline; PLCS-T2 work order |
| Before status evidence | dispatch commit `9b483168`; handoff-sync commit `29ec11b0`; worktree clean before decision authoring |
| After status evidence | PLCS-T2 decision packet authored; GC-018/work order/roadmap closure statuses updated in material closure batch |
| Diff evidence | `git diff --name-status 29ec11b0..HEAD` |
| Approval boundary | documentation-only companion-shape decision; no registry/runtime/provider/public mutation |
| Claim boundary | no live/provider/runtime/public/registry edit claim |
| Agent type | Codex decision author |
| Invocation ID | `plcs-t2-registry-companion-decision-codex-2026-06-16` |
| Expected manifest | `docs/reference/CVF_PLCS_T2_REGISTRY_COMPANION_DECISION_2026-06-16.md`; `docs/reviews/CVF_PLCS_T2_REGISTRY_COMPANION_DECISION_COMPLETION_2026-06-16.md`; `docs/baselines/CVF_GC018_PLCS_T2_REGISTRY_COMPANION_DECISION_2026-06-16.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_PLCS_T2_REGISTRY_COMPANION_DECISION_FOR_CODEX_2026-06-16.md`; `docs/roadmaps/CVF_PLANE_LAYER_WORKFLOW_CHAIN_SYSTEMIZATION_ROADMAP_2026-06-16.md` |
| Actual changed set | `docs/reference/CVF_PLCS_T2_REGISTRY_COMPANION_DECISION_2026-06-16.md`; `docs/reviews/CVF_PLCS_T2_REGISTRY_COMPANION_DECISION_COMPLETION_2026-06-16.md`; `docs/baselines/CVF_GC018_PLCS_T2_REGISTRY_COMPANION_DECISION_2026-06-16.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_PLCS_T2_REGISTRY_COMPANION_DECISION_FOR_CODEX_2026-06-16.md`; `docs/roadmaps/CVF_PLANE_LAYER_WORKFLOW_CHAIN_SYSTEMIZATION_ROADMAP_2026-06-16.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance decision packet. No public-sync batch is authorized.

## Claim Boundary

PLCS-T2 proves only the bounded governance decision that future C01-C04
registry-edit work orders must carry a PLCS companion block before dispatch.
It does not edit the interlock registry, create a checker, mutate runtime,
touch source or test code, run provider/API/live proof, public-sync, authorize
C05, authorize downstream adapter work, or claim public/production readiness.
