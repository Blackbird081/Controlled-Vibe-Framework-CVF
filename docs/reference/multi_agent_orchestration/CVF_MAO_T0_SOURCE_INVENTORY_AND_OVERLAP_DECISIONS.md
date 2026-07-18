# CVF MAO-T0 Source Inventory And Overlap Decisions

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-11

Batch ID: MAO-T0

executionBaseHead: `209a9b4b3`

EPISTEMIC_PROCESS_NA_WITH_REASON: this document is a source inventory and
reuse/reject/adapt decision record. It does not predict runtime behavior or
compare empirical evidence; its factual claims are source-verified file
reads and `rg` searches recorded in the Verification Commands section.

## Purpose

Record the definitive MAO-T0 source inventory: every existing CVF owner
surface relevant to multi-agent orchestration, its current strength, and an
explicit REUSE / ADAPT / REJECT decision. This document also carries the
three external-critique caveats from the accepted reconciliation forward
into a compatibility analysis, as required before MAO-T1 dispatch.

## Scope / Applies To

Applies to: the MAO-T0 tranche only. Every fact below is either
source-verified against current repository state at `executionBaseHead`, or
explicitly marked as a new doc-only field owned by this tranche. This
document does not implement runtime, does not call a provider, does not
create a queue/scheduler, and does not change AHB, workspace, ASC/R91, L4,
R84, or R73F semantics.

## Source Authority

| Source | Role |
|---|---|
| `docs/roadmaps/CVF_MULTI_AGENT_ORCHESTRATION_RUNTIME_FOUNDATION_ROADMAP_2026-07-11.md` | governing roadmap; Existing-Owner And Overlap Matrix, Architecture Decision Table |
| `docs/reviews/CVF_MAO_ROADMAP_EXTERNAL_CRITIQUE_INTERNAL_RECONCILIATION_2026-07-11.md` | accepted critique reconciliation; three T0 caveats |
| `docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md` | Agent Handoff Contract; CF-01 through CF-09 |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md` | workspace state topology and generated-aggregate boundary |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md` | workspace lane vocabulary |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` | runtime expansion boundary |
| `docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | archived MA1 packet structure (evidence only) |
| `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.multi.agent.coordination.contract.ts` | existing W2-T9 coordination contract source |
| `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/cloud/multi.agent.runtime.ts` | existing phase-governance multi-agent runtime source |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/provider.router.contract.ts` | existing provider-router contract source |

## Source Inventory

Action-cell vocabulary is limited to `READ`, `FULL_READ`, `PARTIAL_READ`, or
`SOURCE_VERIFIED` per the governed artifact literal-format gotcha checklist.

| # | Owner surface | Source path | Action | Disposition |
|---|---|---|---|---|
| 1 | Agent Handoff Contract (route/phase/base-head/trace/commit/isolation/next-move) | `docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md` | FULL_READ | REUSE unchanged |
| 2 | Workspace state topology, lanes, generated aggregate | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md`; `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md` | FULL_READ | REUSE as read projection only; not execution authority |
| 3 | Workspace runtime expansion boundary | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` | FULL_READ | REUSE boundary; MAO runtime tranches (T1+) must carry a `runtimeMode` disposition when they touch queue/UI/provider/public scope |
| 4 | Archived MA1 internal transfer packet | `docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` | FULL_READ | ADAPT source-packet, role-assignment, dissent-ledger, and integration-decision vocabulary into the active MAO contract schema; archive is not reactivated as live authority |
| 5 | W2-T9 `MultiAgentCoordinationContract` | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.multi.agent.coordination.contract.ts` | FULL_READ | ADAPT deterministic-hash and round-robin/broadcast/priority-first distribution pattern into future task-assignment receipts; REJECT as a complete runtime (no dependency graph, no authority envelope, no terminal propagation) |
| 6 | Phase-governance `MultiAgentRuntime` | `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/cloud/multi.agent.runtime.ts` | FULL_READ | ADAPT role/risk admission (`canAssignTask`), session TTL, resource-lock, and conflict-record vocabulary; REJECT tenant/message-bus model as MAO does not need multi-tenant SaaS scope |
| 7 | Provider router contract | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/provider.router.contract.ts` | PARTIAL_READ | REUSE behind a new capability adapter boundary; resolver never chooses policy (see Compatibility Analysis MAO-CRIT-03 note below) |
| 8 | Commit-steward standard | `docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md` | SOURCE_VERIFIED | REUSE for phase-to-mode split; does not itself own closer identity (see Compatibility Analysis MAO-CRIT-02 note below) |
| 9 | Worker-return fast gate and quality-gate checker | `governance/compat/run_worker_return_fast_gate.py`; `governance/compat/check_worker_return_quality_gate.py` | FULL_READ | REUSE unchanged for this and future MAO worker returns |
| 10 | Agent workspace design/runtime-boundary checkers | `governance/compat/check_agent_workspace_design.py`; `governance/compat/check_agent_workspace_runtime_boundary.py` | FULL_READ | REUSE; both checkers key off fixed existing paths under `docs/reference/agent_workspace/` and are unaffected by this tranche's new `docs/reference/multi_agent_orchestration/` paths |
| 11 | ASC front door and admission route | `docs/reference/system_architecture_catalog/README.md` | PARTIAL_READ | REUSE; MAO catalog admission is deferred to MAO-T7/T9 per roadmap, after implemented source and generator validation exist |

## Compatibility Analysis (Three Reconciliation Caveats)

The accepted reconciliation
(`docs/reviews/CVF_MAO_ROADMAP_EXTERNAL_CRITIQUE_INTERNAL_RECONCILIATION_2026-07-11.md`,
Decision / Recommendation / Disposition:
`INTERNAL_RECONCILIATION_ACCEPTED_WITH_T0_CAVEATS`) requires T0 to fold
three caveats. Each is resolved below with fresh independent verification
at `executionBaseHead`.

### Caveat 1 (MAO-CRIT-01): `MultiAgentRuntime` scope-source and caller status

Fresh verification command: `rg -l "MultiAgentRuntime" --type ts`.

Result: three files match -
`EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/multi.agent.runtime.test.ts`,
`EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/index.ts`,
and the source file itself. `index.ts:104` lists `MultiAgentRuntime` inside
a barrel re-export statement; it does not instantiate or call the class.
This confirms the roadmap's disposition: zero non-test **instantiation**
caller exists. The dual scope-source finding (a second, unrelated
`MultiAgentCoordinationContract` in the execution-plane extension) is
confirmed structurally accurate. Per the accepted reconciliation, this is
recorded as an unproven-bug / plausible-two-layer-boundary observation, not
a confirmed defect: `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` is a
phase-governance guard-runtime module and `CVF_EXECUTION_PLANE_FOUNDATION`
is a separate execution-plane module; the two coordination concepts were
never asserted to be the same owner. MAO-T1+ must not silently promote
either historical module to MAO runtime authority without a fresh
source-verified decision.

### Caveat 2 (MAO-CRIT-02): closer-identity ownership

Fresh verification command:
`rg -n "closer" "docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md"`.

Result: zero matches. This confirms the commit-steward standard does not
itself carry a `closer` token. The explicit ownership map, folded per the
reconciliation, is: the **Agent Handoff Contract** (CF-07 `commitOwner`,
`docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md`
lines 235-259) owns closer identity and the exactly-one-closer invariant for
every route configuration, including the C3 designation rule at lines
392-440. The commit-steward standard owns phase-to-mode mapping and the
commit-split/no-commit discipline only; it is a downstream execution
surface, not the closer-identity authority. MAO's contract front door (see
`CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md` Section "Closer And Commit
Boundary") states this ownership map explicitly so a future MAO-T5 author
does not need to re-derive it.

### Caveat 3 (MAO-CRIT-03): no MAO-specific ADIF calibration baseline

Fresh verification command:
`python governance/compat/run_adif_defect_resolver.py --task-class architecture-contract --role dispatcher --lifecycle-phase pre-dispatch --surface-selector docs/reference --risk-ceiling HIGH --max-results 20 --json`.

Result: `NONE_RETURNED` (see the paired GC-018 and work order's ADIF Defect
Registry Disclosure sections, and this document's own ADIF Defect Registry
Disclosure section below for a rerun at execution time). This confirms no
ADIF-classified empirical defect baseline exists that is specific to MAO
role/risk admission calibration. Per the accepted reconciliation, this does
not mean zero empirical grounding exists at all: W2-T9 coordination
evidence, W2-T14 consumer-bridge evidence, the historical
`MultiAgentRuntime` role/risk-admission implementation, and the AHB-T1/T2
audit and ratification evidence are real prior CVF evidence, just not
ADIF-classified defect records. MAO's threat/failure model (see
`CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md` Section "Threat And Failure Model")
states admission thresholds as first-principles/source-informed decisions,
not ADIF-calibrated ones, and names this as an explicit limitation for
MAO-T9 to revisit once a pilot produces real defect evidence.

## Existing-Owner And Overlap Matrix

This matrix is carried forward unchanged from the accepted roadmap's
Existing-Owner And Overlap Matrix
(`docs/roadmaps/CVF_MULTI_AGENT_ORCHESTRATION_RUNTIME_FOUNDATION_ROADMAP_2026-07-11.md`),
with each row's disposition confirmed by the Source Inventory table above.

| Concern | Existing owner | MAO decision |
|---|---|---|
| Role route, phase, commit owner, closer | Agent Handoff Contract | REUSE unchanged |
| Work authority and bounded source packet | GC-018/work order plus archived MA1 semantics | ADAPT MA1 section intent into active work-order contract |
| Workspace lanes and compact status view | agent workspace generated state | REUSE as read projection only |
| Task distribution | W2-T9 coordination contract | ADAPT algorithmic/hash patterns; REJECT as complete MAO runtime |
| Consumer bridge | W2-T14 | REUSE only if a future tranche proves a compatible observer boundary |
| Agent registration and role/risk checks | phase-governance `MultiAgentRuntime` | ADAPT verified invariants; no wholesale promotion |
| Provider selection | `ProviderRouterContract` | REUSE behind a new capability adapter; resolver never chooses policy |
| Worker return and review | worker-return scaffold/quality gates and completion review | REUSE |
| Commit and continuity | commit steward, AHB, active session generated state | REUSE; runtime cannot bypass |
| Observability/evidence | current AOT, receipts, completion evidence | EXTEND through MAO receipts in future tranches |
| Architecture visibility | ASC compact source/generator and gap ledger | EXTEND only after implementation proof |

## New Doc-Only Fields

All MAO schema field names introduced by this tranche (`taskGraphId`,
`authorityHash`, `invocationReceipt`, and the complete set defined in
`CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json`) are new doc-only decisions owned
by MAO-T0. They are not claimed to exist as current runtime source. See
`CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md` for the full new-field ledger.

## Negative Search And Collision Discipline

| Search | Command | Result |
|---|---|---|
| MAO contract/schema name collision | `rg -li "MAO_RUNTIME_FOUNDATION\|MaoTaskGraph\|MaoEventLedger\|MaoReceipt\|MaoAuthorityEnvelope"` | only the MAO-T0 work order itself matches; no prior contract/schema owner exists |
| Target path collision | `Test-Path` equivalent per-file existence check on all five allowed deliverables | none existed before this tranche |
| MA1 active-vs-archive path check | `rg -l "CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD"` | only the archive-qualified path exists; no non-archive duplicate |

## Verification Commands

- `rg -l "MultiAgentRuntime" --type ts` - PASS, three matches, one barrel
  re-export, zero instantiation callers outside tests.
- `rg -n "closer" "docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md"` -
  PASS, zero matches.
- `python governance/compat/run_adif_defect_resolver.py --task-class architecture-contract --role dispatcher --lifecycle-phase pre-dispatch --surface-selector docs/reference --risk-ceiling HIGH --max-results 20 --json` -
  PASS, `NONE_RETURNED`.
- `rg -li "MAO_RUNTIME_FOUNDATION\|MaoTaskGraph\|MaoEventLedger\|MaoReceipt\|MaoAuthorityEnvelope"` -
  PASS, no collision beyond the work order itself.

## ADIF Defect Registry Disclosure

Resolver query: taskClass=`architecture-contract`, role=`dispatcher`, lifecyclePhase=`pre-dispatch`

| Field | Value |
|---|---|
| Resolver command | `python governance/compat/run_adif_defect_resolver.py --task-class architecture-contract --role dispatcher --lifecycle-phase pre-dispatch --surface-selector docs/reference --risk-ceiling HIGH --max-results 20 --json` |
| Returned defect count | 0 |
| Returned defects | NONE_RETURNED |
| Disclosed defectIds | N/A with reason: none returned |

Returned defects: NONE_RETURNED

## Claim Boundary

This document is a source inventory and overlap-decision record only. It
does not implement runtime, does not call a provider, does not create a
queue/scheduler/UI, does not change AHB/workspace/ASC/R91/L4/R84/R73F
semantics, and does not claim production or public readiness.
