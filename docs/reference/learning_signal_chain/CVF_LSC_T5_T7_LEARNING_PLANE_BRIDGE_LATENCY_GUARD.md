# CVF LSC-T5/T7 Learning Plane Bridge And Latency Guard

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-21

Path policy: stable reference-family file retained at an undated path; dated
closure evidence lives in the worker-return and completion-review artifacts.

EPISTEMIC_PROCESS_NA_WITH_REASON: reference contract - it defines bridge
alignment from LSC signal records to existing RT2/RT3/MLW3 proposal-only
Learning Plane surfaces and a latency guard; it makes no evidence comparison
claim requiring the full epistemic process block.

## Purpose

LSC-T1 through LSC-T6 established intake ownership, de-dup policy, capture
eligibility, fast helper readout, promotion threshold vocabulary, and external
agent IO contract. What remained was an explicit source-verified alignment from
LSC signal records to the existing proposal-only Learning Plane chain (RT2/RT3,
MLW3, MLW5, MLW6) and a latency guard that keeps capture fast and promotion
governed.

LSC-T5/T7 defines:

- **Bridge Alignment**: which LSC/RT2 signal fields map to which RT2/RT3/MLW3
  proposal-only ownership surfaces, without creating a parallel runtime record.
- **Bridge Eligibility Matrix**: which LSC-T4 promotion outcomes remain
  readout-only (FAST_PATH), which become proposal candidates (GOVERNED_PROMOTION),
  and which require closure-blocker handling (BLOCKER_PENDING_EVIDENCE).
- **Evaluated Route**: how `EVALUATED` signals reuse MLW5 audit-feedback
  validation and MLW6 simulation/failure gate without defining a new evaluator.
- **Latency Guard Rules**: capture stays cheap/local; readout-only signals add
  no gate cost; promotion and validation are batched and governed.
- **Fast Path Rule**: routine `READOUT_ONLY` signals must not block closure or
  inflate gate latency.
- **Mutation Boundary**: `autonomousMutationAuthorized=false` remains invariant.

`adapterContractOnly=false`. LSC-T5/T7 adds a narrow read-only helper field
(`latencyGuardDisposition`) to the existing AAF helper signal readout. It does
not implement a ledger store, generator, drift checker, runtime Learning Plane
mutation, CLI/MCP adapter, provider/live proof, or public-sync.

## Scope

**Applies to:** worker, reviewer, and external-agent roles that need a stable
bridge-alignment reference before a runtime Learning Plane implementation tranche
is separately authorized.

**Does not apply to:** runtime Learning Plane mutation, actual RT2/RT3 bridge
call execution, ledger store implementation, generator or drift-checker
implementation, CLI/MCP adapter implementation, or public-sync.

## Relationship To Existing LSC And Learning Plane Records

| Record | Relationship to LSC-T5/T7 |
|---|---|
| LSC-T1 Signal Ledger Source Layout And De-Dup Contract | **Field ownership authority.** LSC-T5/T7 maps LSC signal fields to RT2/RT3/MLW3 ownership. It does not redefine or parallel LSC-T1 field definitions. |
| LSC-T3 Fast Helper Readout | **Readout shape authority.** `SignalReadoutItem` adds `latencyGuardDisposition` in LSC-T5/T7. The helper remains read-only, advisory, and deterministic. |
| LSC-T4 Promotion Threshold Policy | **Outcome vocabulary authority.** LSC-T5/T7 derives `latencyGuardDisposition` from LSC-T4 `recommendedOutcome`. No new promotion outcome is defined. |
| LSC-T6 External Agent CLI/MCP Signal Contract | **IO boundary authority.** External-agent signal events may become bridge candidates only after absorption/classification per LSC-T2 and LSC-T6. |
| RT2 finding-to-learning bridge (`finding-to-learning-bridge.ts`) | **Runtime bridge authority.** `FindingToLearningInput`, `FindingToLearningRecord`, and `buildFindingToLearningRecord` are the authoritative bridge surfaces. LSC-T5/T7 maps to them, does not replace or parallel them. |
| RT3 learning-plane readout route (`/api/learning-plane/readout`) | **Runtime readout authority.** The readout route calls RT2 and returns `findingToLearningReadout`. LSC-T5/T7 documents this relationship, does not modify the route. |
| MLW3 Evidence-To-Truth Learning Signal Pipeline | **Proposal pipeline authority.** `proposalAction` enum (`NOOP`, `REVIEW`, `SIMULATE`, `ESCALATE`) and `autonomousMutationAuthorized=false` invariant. High-risk proposals route to MLW6. |
| MLW5 Audit Feedback Validation Lane | **Evaluation authority for audit-feedback signals.** `requiresSimulation=true` routes high-risk candidates to MLW6. `mutationAuthorized=false`. |
| MLW6 Simulation And Failure Gate | **High-risk promotion gate authority.** `promotionVerdict` enum (`BLOCK`, `DEFER`, `ESCALATE`, `RECOMMEND_REVIEW`). Never promotes automatically. |
| Learning Signal Intake Bridge (`learning-signal-intake-bridge.ts`) | **Intake field owner.** All bridge mapping inherits, not parallels, intake bridge field definitions. |

## Bridge Alignment

`learningPlaneBridgeCandidate`: a captured LSC signal that meets eligibility
criteria to be routed to the RT2/RT3/MLW3 proposal-only chain. This is a
documentation-only concept; no runtime endpoint accepts this term yet.

### LSC-To-RT2 Field Mapping

The following table maps LSC signal fields (from LSC-T1 intake ownership and
LSC-T4 output vocabulary) to RT2 bridge input fields (`FindingToLearningInput`).
Mapping is proposal-only: no field assignment triggers autonomous mutation.

| LSC/intake field | RT2 `FindingToLearningInput` field | Notes |
|---|---|---|
| `signalClass` / `defectClass` | `defectClass` | intake-owned; must use existing `LearningSignalDefectClass` values |
| `severity` | `severity` | one of `low`, `medium`, `high`, `critical` |
| `lane` / `sourceProjection` | `lane` | `LearningSignalLane` value |
| `description` / `sourceSummary` | `sourceSummary` | self-contained human-readable summary |
| `sourceArtifact` | `sourceArtifact` | governing artifact path, not raw chat |
| `sourceId` | `sourceId` | intake-synthesized ID |
| `disposition` (from LSC-T1) | `disposition` | assigned by absorbing role; `LearningSignalDisposition` value |
| `nextControlAction` | `nextControlAction` | suggested next action; human-initiated |
| `evidenceBasis` | `evidenceBasis` | concrete artifact, commit, or gate output |

`FindingToLearningRecord` adds `recordId`, `recordedAt`, `bridgeVersion`,
`feedbackClass`, `requiresGovernanceWorkOrder`, and `autonomousMutationAuthorized=false`
on top of the input fields. The `autonomousMutationAuthorized: false` literal
is set by `buildFindingToLearningRecord` and cannot be overridden by any LSC
signal input.

### RT3 Readout Path

The RT3 readout route (`/api/learning-plane/readout`) calls RT2's
`buildFindingToLearningRecord` and returns `findingToLearningReadout`. This is
the only current runtime expression of the learning bridge. LSC-T5/T7 does not
add new calls to this route.

### External Knowledge Absorption Pre-Condition

Before an external-agent signal event may become a bridge candidate, it must
have been classified through the external knowledge absorption chain per
LSC-T2 section "External Agent Returned-Output Routing" and LSC-T6
section "External Returned-Output Absorption Routing". The absorbed and
classified item's absorption packet is the `sourceArtifact` for the bridge
candidate, never the raw external file.

## Bridge Eligibility Matrix

`bridgeEligibility`: whether a given LSC-T4 outcome may proceed to a proposal-only
bridge candidate in the RT2/RT3/MLW3 chain.

| LSC-T4 outcome | Bridge eligibility | latencyGuardDisposition | Bridge action |
|---|---|---|---|
| `READOUT_ONLY` | eligible only as FAST_PATH readout | `FAST_PATH` | remain in `signalReadout` advisory; do not route to RT2/MLW3 unless separately promoted |
| `WATCH_FOR_REPEAT` | eligible only as FAST_PATH readout | `FAST_PATH` | remain advisory until ledger de-dup confirms `OBSERVED_REPEATED` |
| `GOVERNANCE_PROPOSAL_CANDIDATE` | proposal candidate | `GOVERNED_PROMOTION` | may be submitted as `FindingToLearningInput` with `disposition=DESIGN_REVIEW_REQUIRED` |
| `RULE_CANDIDATE` | proposal candidate | `GOVERNED_PROMOTION` | may be submitted with `disposition=MACHINE_CHECK_CANDIDATE` or `RULE_ADDED` |
| `CHECKER_CANDIDATE` | proposal candidate | `GOVERNED_PROMOTION` | may be submitted with `disposition=MACHINE_CHECK_CANDIDATE` |
| `WORK_ORDER_CANDIDATE` | proposal candidate | `GOVERNED_PROMOTION` | requires a governed work order before bridge submission |
| `CLOSURE_BLOCKER` | blocked pending evidence | `BLOCKER_PENDING_EVIDENCE` | requires source-backed LSC-T4 blocker conditions before any action; do not promote automatically |

### Eligibility Invariants

- **No autonomous promotion:** advancing a signal from FAST_PATH to
  GOVERNED_PROMOTION requires a human-initiated governed action (work order,
  review, or dispatch author decision). No helper or external agent may promote
  a signal autonomously.
- **No OBSERVED_REPEATED without de-dup:** `WATCH_FOR_REPEAT` signals must not
  be treated as `OBSERVED_REPEATED` until ledger de-dup confirms it per LSC-T4.
- **No closure blocking without evidence:** `CLOSURE_BLOCKER` conditions require
  explicit source-backed LSC-T4 evidence. The helper sets `blocking=false` for
  all routine items.
- **Absorption pre-condition:** external-agent signals require absorption
  classification before any eligibility determination.

## Evaluated Route

`evaluationRoute`: how `EVALUATED` signals reuse existing MLW5/MLW6 validation
surfaces without defining a new evaluator.

### No New Evaluator

LSC-T5/T7 does not introduce a new evaluation surface, evaluator class,
simulation runtime, or promotion judge. The existing chain is:

1. **MLW3 pipeline** (`proposalAction` enum): captures the proposal action
   (`NOOP`, `REVIEW`, `SIMULATE`, `ESCALATE`). High-risk proposals are routed
   to MLW6 by `proposalAction=SIMULATE` or `ESCALATE`.
2. **MLW5 audit-feedback validation** (`requiresSimulation`, `mutationAuthorized=false`):
   accepts audit, gate, trust, and reviewer feedback as proposals; routes
   high-risk candidates to MLW6 (`requiresSimulation=true`); keeps
   `mutationAuthorized=false`.
3. **MLW6 simulation/failure gate** (`promotionVerdict` enum): evaluates
   candidates against a scenario set; emits `BLOCK`, `DEFER`, `ESCALATE`, or
   `RECOMMEND_REVIEW`; never promotes automatically.

### `EVALUATED` Disposition Mapping

When a captured signal carries `disposition=EVALUATED` or a governed role marks
it as evaluated after review, the following routing applies:

| Evaluation result | MLW5/MLW6 action | Bridge outcome |
|---|---|---|
| Low risk, evidence sufficient | MLW5 `requiresSimulation=false`, MLW6 not invoked | GOVERNED_PROMOTION eligible; submit as `FindingToLearningInput` |
| High risk or missing evidence | MLW5 `requiresSimulation=true`, route to MLW6 | DEFER or BLOCK per MLW6 `promotionVerdict` |
| Critical failure or rollback absent | MLW6 `promotionVerdict=BLOCK` | do not promote; return to GOVERNED_PROMOTION queue |
| Conflicting evaluator signals | MLW6 `promotionVerdict=ESCALATE` | operator review required before promotion |
| Below confidence threshold | MLW6 `promotionVerdict=DEFER` | batch and re-evaluate in a later governed cycle |

`autonomousMutationAuthorized=false` remains invariant throughout the evaluated
route. No evaluation result authorizes autonomous mutation.

## Latency Guard Rules

`latencyGuardDisposition`: the advisory field added to `SignalReadoutItem` by
LSC-T5/T7 to classify whether a helper-detected signal is fast-path (no gate
cost) or needs governed promotion.

### Rule L1: Capture Must Stay Cheap

Signal capture (recording a `SignalReadoutItem` in the helper) is O(1) per
item. It must not make provider/live calls, run expensive gates, read large
corpora, or trigger Learning Plane network requests. The helper reads only the
current changed-file text in memory.

### Rule L2: FAST_PATH Signals Add No Gate Cost

Signals with `latencyGuardDisposition=FAST_PATH` (`READOUT_ONLY`,
`WATCH_FOR_REPEAT`) are advisory only. They must not:
- extend the reviewer-fast gate chain;
- add a new check that runs on every commit;
- inflate the `run_worker_return_fast_gate.py` gate cost;
- set `blocking=true`.

### Rule L3: Governed Promotion Is Batched

Signals with `latencyGuardDisposition=GOVERNED_PROMOTION` are proposal
candidates. Promotion requires a human-initiated batch: a governed work order,
dispatch, review cycle, or operator decision. No helper, automation, or
external agent may trigger promotion on every commit.

### Rule L4: Blocker Evidence Must Be Source-Backed

`BLOCKER_PENDING_EVIDENCE` may appear in the advisory `latencyGuardDisposition`
output only when a signal meets LSC-T4 `CLOSURE_BLOCKER` conditions with
explicit source-backed evidence. The helper currently produces no
`CLOSURE_BLOCKER` outcome for routine items; this disposition remains reserved
for future governed gate conditions.

### Rule L5: No Retrospective Overburden

Adding the `latencyGuardDisposition` field to `signalReadout` does not impose a
new retrospective scan obligation on existing artifacts. The field applies only
to items in the current changed-set readout. Historical signals in existing
worker-return artifacts are not retroactively rescanned or reclassified.

## Fast Path Rule

`fastPathNoBlocker`: routine `READOUT_ONLY` signals must keep `blocking=false`
and `latencyGuardDisposition=FAST_PATH`. Only source-backed LSC-T4
`CLOSURE_BLOCKER` conditions may block closure, and no such conditions are
triggered by the current helper for routine items.

### What Fast-Path Means In Practice

- The `signalReadout` list in `AssistReport` may grow as more helper-detectable
  surfaces are added, without any new closure gate or reviewer-fast check being
  added.
- Each new `FAST_PATH` item is visible in `--json` and human output but does
  not change exit code, does not extend `defects`, and does not trigger a new
  gate rule.
- An external agent or CLI consumer receiving `signalReadout` output must
  observe the `latencyGuardDisposition` value and must not elevate a
  `FAST_PATH` item to a blocker or gate without a separate governed work order.

## Optional Helper Implementation

LSC-T5/T7 adds a narrow read-only helper field to the existing AAF helper.

### Changes Made

- `governance/compat/run_agent_automation_assist.py`: added
  `latency_guard_disposition: str = ""` field to `SignalReadoutItem`; added
  `_LSC_T5_T7_FAST_PATH`, `_LSC_T5_T7_GOVERNED_PROMOTION`,
  `_LSC_T5_T7_BLOCKER_PENDING_EVIDENCE` constants; added
  `_derive_latency_guard_disposition` function; populated
  `latency_guard_disposition` in `_build_signal_readout` via
  `dataclasses.replace`; added `latencyGuardDisposition` to `to_dict`; updated
  `_print_human` to show `[FAST_PATH]`/`[GOVERNED_PROMOTION]`/`[BLOCKER_PENDING_EVIDENCE]`
  alongside `recommendedOutcome`.
- `governance/compat/test_run_agent_automation_assist.py`: added
  `BridgeLatencyGuardTests` class with 8 focused tests verifying derivation
  rules, JSON key presence, non-empty invariant, no-mutation on empty set, and
  no-blocker-inflation for routine items.

### What The Helper Does Not Do

- Does not make RT2/RT3 runtime calls.
- Does not read Learning Plane source, ledger, or provider.
- Does not write, stage, commit, or mutate any state.
- Does not enforce latency by blocking closure.
- Does not add a new reviewer-fast gate check.
- Does not change existing `SignalReadoutItem` field defaults or break existing
  `SignalReadoutTests`.

### `_derive_latency_guard_disposition` Derivation Contract

| Input `recommendedOutcome` | Output `latencyGuardDisposition` | Source rule |
|---|---|---|
| `READOUT_ONLY` | `FAST_PATH` | Rule L2: FAST_PATH signals add no gate cost |
| `WATCH_FOR_REPEAT` | `FAST_PATH` | Rule L2: pending repeat evidence; still advisory |
| `CLOSURE_BLOCKER` | `BLOCKER_PENDING_EVIDENCE` | Rule L4: blocker evidence must be source-backed |
| `GOVERNANCE_PROPOSAL_CANDIDATE` | `GOVERNED_PROMOTION` | Rule L3: governed promotion is batched |
| `RULE_CANDIDATE` | `GOVERNED_PROMOTION` | Rule L3 |
| `CHECKER_CANDIDATE` | `GOVERNED_PROMOTION` | Rule L3 |
| `WORK_ORDER_CANDIDATE` | `GOVERNED_PROMOTION` | Rule L3 |
| any other value | `GOVERNED_PROMOTION` | default: unknown outcomes route to governed promotion |

## Mutation Boundary

`autonomousMutationAuthorized=false` remains invariant for all actors and
surfaces in the LSC-T5/T7 bridge and latency guard tranche.

| Boundary | Rule |
|---|---|
| `FindingToLearningRecord.autonomousMutationAuthorized` | literal `false`; set by `buildFindingToLearningRecord`; not overridable by any LSC input |
| MLW3 `autonomousMutationAuthorized` | must be `false`; all MLW3 outputs are proposal-only |
| MLW5 `mutationAuthorized` | must be `false`; direct mutation rejected |
| MLW6 promotion verdict | never promotes automatically; verdict is advisory until operator-confirmed |
| AAF helper `latency_guard_disposition` | read-only computed field; no state written |
| GOVERNED_PROMOTION signals | advisory only; proposal submission requires human-initiated governed action |
| BLOCKER_PENDING_EVIDENCE signals | blocked pending evidence; no automatic block imposed |
| External-agent signal events | advisory only; see LSC-T6 mutation boundary |

## Parking Ledger

| Lane | Status | Relationship to LSC-T5/T7 |
|---|---|---|
| Ledger store, generator, drift checker | not started; future separately authorized tranche | LSC-T5/T7 defines bridge alignment; actual ledger store requires separate work |
| Runtime Learning Plane mutation | not started; operator-authorized separate tranche | not implemented or claimed by LSC-T5/T7 |
| RT2/RT3 runtime source edits | out of scope | not authorized by LSC-T5/T7 |
| CLI/MCP adapter implementation | not started; requires separate GC-018 and work order | LSC-T6 defines the contract; adapter requires its own tranche |
| AAF-T6 Guard Orientation Read-Receipt Gate | parked | not reopened by LSC-T5/T7 |
| AAF-T7 friction-finding hardening | parked | not reopened by LSC-T5/T7 |
| CGE-T3 external knowledge ledger | parked | not reopened by LSC-T5/T7 |
| ACE-R1 Agent Coding Evidence Replay | parked | not reopened by LSC-T5/T7 |
| MLW7 / MLW8 | parked | not reopened by LSC-T5/T7 |
| Provider/live proof | out of scope | not authorized by LSC-T5/T7 |
| Public-sync export | not started; requires separate authorization | not authorized by LSC-T5/T7 |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference contract for Learning Signal Chain bridge
and latency guard work. No public-sync remote, public commit, public artifact
path, or public claim is authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | LSC-T5/T7 bridge alignment, latency guard, fast-path readout field, and focused tests only |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | documentation/reference contract authoring and narrow read-only local helper/test work |
| interceptionBoundary | no direct IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | bridge alignment, bridge eligibility matrix, EVALUATED route, latency guard rules, fast path rule, mutation boundary only |
| forbiddenExpansion | wrapper/proxy enforcement, arbitrary-command execution, EDIT/COMMIT execution, provider/live, public-sync, queue/daemon, watcher, readiness, full-hook equivalence, CLI/MCP adapter behavior, runtime Learning Plane mutation, RT2/RT3 runtime source edits, cost optimization, and universal control remain out of scope |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | worker role |
| Provider or surface | local workspace |
| Session or invocation | LSC-T5/T7 worker execution, 2026-06-21 |
| Working directory | repository root |
| Command or tool surface | direct file read/write/edit tools |
| Target paths | `docs/reference/learning_signal_chain/CVF_LSC_T5_T7_LEARNING_PLANE_BRIDGE_LATENCY_GUARD.md`; `docs/reference/learning_signal_chain/README.md`; `governance/compat/run_agent_automation_assist.py`; `governance/compat/test_run_agent_automation_assist.py`; `docs/reviews/CVF_LSC_T5_T7_LEARNING_PLANE_BRIDGE_LATENCY_GUARD_WORKER_RETURN_2026-06-21.md` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_LSC_T5_T7_LEARNING_PLANE_BRIDGE_LATENCY_GUARD_FOR_WORKER_2026-06-21.md`; `docs/baselines/CVF_GC018_LSC_T5_T7_LEARNING_PLANE_BRIDGE_LATENCY_GUARD_2026-06-21.md` |
| Before status evidence | HEAD `eff8ce94`; clean worktree before worker execution |
| After status evidence | five worker-authorized paths changed/created; uncommitted |
| Diff evidence | reference contract created; README row added; helper `latencyGuardDisposition` added; tests added; worker-return created |
| Approval boundary | worker: update/create only the five authorized paths; no commit |
| Claim boundary | bridge alignment, latency guard, fast-path readout, focused tests, and worker-return only; no runtime Learning Plane mutation, RT2/RT3 edits, ledger/generator/adapter claim |
| Agent type | worker role |
| Invocation ID | `lsc-t5-t7-worker-2026-06-21` |
| Expected manifest | `docs/reference/learning_signal_chain/CVF_LSC_T5_T7_LEARNING_PLANE_BRIDGE_LATENCY_GUARD.md` (create); `docs/reference/learning_signal_chain/README.md` (update); `governance/compat/run_agent_automation_assist.py` (update); `governance/compat/test_run_agent_automation_assist.py` (update); `docs/reviews/CVF_LSC_T5_T7_LEARNING_PLANE_BRIDGE_LATENCY_GUARD_WORKER_RETURN_2026-06-21.md` (create) |
| Actual changed set | same as expected manifest |
| Manifest delta | MATCH |

## Related Surfaces

- `docs/reference/learning_signal_chain/README.md` - reference front door
- `docs/reference/learning_signal_chain/CVF_LSC_T1_SIGNAL_LEDGER_SOURCE_LAYOUT_AND_DEDUP_CONTRACT.md` - field ownership
- `docs/reference/learning_signal_chain/CVF_LSC_T3_FAST_HELPER_READOUT.md` - signalReadout shape
- `docs/reference/learning_signal_chain/CVF_LSC_T4_PROMOTION_THRESHOLD_POLICY.md` - outcome vocabulary and blocker rules
- `docs/reference/learning_signal_chain/CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT.md` - external IO contract
- `docs/roadmaps/CVF_LSC_T0_LEARNING_SIGNAL_CHAIN_RECONCILIATION_ROADMAP_2026-06-20.md` - chain reconciliation roadmap
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/finding-to-learning-bridge.ts` - RT2 bridge source
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/learning-plane/readout/route.ts` - RT3 readout route
- `docs/reference/CVF_MLW3_EVIDENCE_TO_TRUTH_LEARNING_SIGNAL_PIPELINE_2026-06-05.md` - proposal pipeline
- `docs/reference/CVF_MLW5_AUDIT_FEEDBACK_VALIDATION_LANE_2026-06-05.md` - audit feedback validation
- `docs/reference/CVF_MLW6_SIMULATION_FAILURE_GATE_2026-06-05.md` - simulation/failure gate
- `governance/compat/run_agent_automation_assist.py` - AAF helper with latencyGuardDisposition
- `governance/compat/test_run_agent_automation_assist.py` - BridgeLatencyGuardTests

## Claim Boundary

This contract defines bridge alignment from LSC signal records to RT2/RT3/MLW3
proposal-only Learning Plane surfaces, the bridge eligibility matrix, the
`EVALUATED` route through MLW5/MLW6, latency guard rules, the fast-path rule,
and the mutation boundary. It adds a narrow read-only `latencyGuardDisposition`
field to the AAF helper signal readout and focused tests.

It does not implement a ledger store, source directory, generator, drift
checker, durable store, runtime Learning Plane mutation, RT2/RT3 runtime
source edits, provider/live proof, actual CLI/MCP adapter behavior, public-sync,
direct interception, wrapper/proxy enforcement, queue/daemon, watcher, readiness
proof, cost optimization, full-hook equivalence, or universal governed-coding
control.

`autonomousMutationAuthorized=false` remains invariant for all actors and
all surfaces defined in this contract.
