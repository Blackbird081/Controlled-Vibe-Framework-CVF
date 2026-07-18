# CVF LSC-T6 External Agent CLI/MCP Signal Contract

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-21

Path policy: stable reference-family file retained at an undated path; dated
closure evidence lives in the worker-return and completion-review artifacts.

EPISTEMIC_PROCESS_NA_WITH_REASON: reference contract - it defines portable
external-agent signal IO shape, no-signal assertion, and boundary vocabulary;
it makes no evidence comparison claim requiring the full epistemic process block.

## Purpose

LSC-T1 through LSC-T4 established intake ownership, capture eligibility,
fast helper readout, and promotion threshold vocabulary. Those contracts were
designed for internal roles operating with session context. External agents -
CLI tools, MCP clients, and future integrations - lack direct session memory
and cannot safely pass raw chat context to CVF's intake bridge.

LSC-T6 defines the portable external-agent signal IO contract so future
CLI/MCP adapter authors know:

- which five fields a minimal external signal event may carry;
- which defaults a future helper or ledger normalizer may synthesize;
- how external returned output must route through the absorption chain before
  structured signal mapping;
- how LSC-T3 `signalReadout` and LSC-T4 promotion outcomes appear as advisory
  output for external consumers;
- that no direct execution, mutation, adapter behavior, runtime proof, or
  public export is authorized by this contract.

`adapterContractOnly=true`. This contract defines IO shape and boundaries. It
does not implement a CLI/MCP adapter, MCP tool, shell bridge, runtime bridge,
ledger store, or any execution surface.

## Scope

**Applies to:** future CLI/MCP adapter authors who need a stable contract
boundary for portable signal IO before any adapter is built.

**Does not apply to:** the current AAF helper (`run_agent_automation_assist.py`),
which exposes `signalReadout` via Python stdout only; the Learning Plane
intake bridge (`learning-signal-intake-bridge.ts`), which remains the runtime
field owner; the LSC ledger store, which is not yet implemented.

## Relationship To Existing LSC Records

| LSC record | Relationship to LSC-T6 |
|---|---|
| LSC-T1 Signal Ledger Source Layout And De-Dup Contract | **Field ownership authority.** LSC-T6 must map its five minimal fields to existing `LearningSignalIntakeInput` fields. It must not create parallel field definitions. Helper/ledger normalization defaults are inherited from LSC-T1 rules. |
| LSC-T2 Multi-Role Capture Contract And Eligibility Matrix | **Absorption routing authority.** External-agent returned output is not directly eligible for structured signal capture. It must route through the external knowledge absorption chain per LSC-T2 section External Agent Returned-Output Routing before becoming a `EXTERNAL_AGENT_CRITIQUE` signal. |
| LSC-T3 Fast Helper Readout | **Readout shape candidate.** The `SignalReadoutItem` shape defined in LSC-T3 is a candidate advisory output for external agents. LSC-T6 describes this relationship without modifying the helper or making readout items executable. |
| LSC-T4 Promotion Threshold Policy | **Vocabulary authority.** LSC-T4 outcome vocabulary (`READOUT_ONLY`, `WATCH_FOR_REPEAT`, `GOVERNANCE_PROPOSAL_CANDIDATE`, `RULE_CANDIDATE`, `CHECKER_CANDIDATE`, `WORK_ORDER_CANDIDATE`, `CLOSURE_BLOCKER`) may appear as advisory recommendation output for external consumers. It does not authorize dispatch, mutation, or work-order creation. |
| External Knowledge Absorption Chain Map | **Routing authority.** All external-agent returned output must follow the mandatory chain before signal mapping. |
| Learning Signal Intake bridge (`learning-signal-intake-bridge.ts`) | **Runtime field owner.** LSC-T6 inherits, maps to, and does not replace or parallel the intake bridge field definitions. |

## External-Agent Signal Event Shape

`externalAgentSignalEvent`: the minimal portable input a future CLI/MCP
adapter may submit to a future signal capture endpoint.

### Required Fields

An external signal event must carry exactly these five required fields,
corresponding to the LSC-T0 minimal CLI/MCP payload (LSC-T0 lines 188-195).
Some fields map directly to existing intake fields; others are external
payload tokens that must be classified or normalized before they project into
existing LSC-T1 / Learning Signal Intake fields:

| External event field | Governed mapping target | Type | Required | Description |
|---|---|---|---|---|
| `signalClass` | LSC-T0/T1 minimal payload token; classified by absorbing role into existing `defectClass` / owner-surface disposition before intake | string | yes | signal class identifier (for example `FRICTION_FINDING`, `GOVERNANCE_OBSERVATION`, `CAPABILITY_GAP`) |
| `actorRole` | LSC-T2 role-eligibility token; recorded through `sourceArtifact`, `evidenceBasis`, or LSC extension `sourceProjection` after absorption | string | yes | role that observed the signal (for example `worker`, `reviewer`, `external_agent`) |
| `sourceSummary` | `sourceSummary` | string | yes | concise human-readable description of the observed signal; maximum 500 characters; no raw chat context |
| `severity` | `severity` | string | yes | one of `low`, `medium`, `high`, `critical` per LSC-T1 severity mapping |
| `lane` | `lane` | string | yes | governing lane or surface context (for example `GOVERNANCE_CONTROL_PLANE`, `RUNTIME_BEHAVIOR_LEARNING`) |

`signalClass` and `actorRole` are not current fields on
`LearningSignalIntakeInput` / `LearningSignalIntakeRecord`. They are minimal
external payload tokens defined by LSC-T0/T1 for future CLI/MCP capture. A
future adapter must not pass them through as new runtime fields unless a later
source-verified work order updates the intake contract. The absorbing role must
translate them into existing owner surfaces (`defectClass`, `sourceArtifact`,
`evidenceBasis`, `lane`, or LSC extension fields such as `sourceProjection`)
before structured signal intake.

### Field Constraints

- `sourceSummary` must not embed raw chat context, session IDs, provider memory
  IDs, or private key material. It must be a self-contained human-readable
  summary.
- `signalClass` is an external payload token. It must be classified by the
  absorbing role into an existing owner-surface disposition or a future
  governed extension. External agents must not invent new executable classes
  without a governed class-extension work order.
- `severity` values must match the LSC-T1 severity mapping (`low`, `medium`,
  `high`, `critical`). Numeric or unrecognized severity values are rejected.
- `lane` identifies the governed lane for routing; it does not authorize action
  in that lane. The absorbing role determines actual routing after absorption.

### Prohibited External Fields

The external event must not include:
- `sourceId` or `recordId` (synthesized by helper/ledger per section Normalization Defaults)
- `repeatRisk` (defaulted by helper; may only be `OBSERVED_REPEATED` after
  ledger de-dup confirmation per LSC-T4)
- `captureState` (set by intake bridge)
- `autonomousMutationAuthorized` (always `false`; not an input field)
- `rootCauseGroupId` (synthesized pending by helper; assigned by de-dup logic)
- `disposition` (set by the absorbing role during absorption, not by the
  external agent submitting the event)
- Raw session state, handoff content, provider memory tokens, or API keys

### Example Minimal Event (documentation only)

```json
{
  "signalClass": "FRICTION_FINDING",
  "actorRole": "external_agent",
  "sourceSummary": "Work order lacked packet-shape contract section before dispatch.",
  "severity": "medium",
  "lane": "GOVERNANCE_CONTROL_PLANE"
}
```

This example is documentation-only. No endpoint, schema validator, or adapter
parses it at this time.

## External-Agent No-Signal Assertion

`externalAgentNoSignalAssertion`: the exact structure an external agent must
return when it has reviewed a changed set and found no helper-detectable signal.

### No-Signal Assertion Form

```json
{
  "noSignal": true,
  "reason": "<concise human-readable reason why no signal was observed>"
}
```

### No-Signal Rules

- `noSignal` must be the boolean `true` (not a string, not `null`).
- `reason` is required and must be a non-empty string. Allowed forms:
  - `"changed set contains no governed output files applicable to signal capture"`
  - `"changed set is session-only; no material output files changed"`
  - `"all applicable diagnostics are clean"`
  - Any other self-contained non-mutating rationale.
- The no-signal assertion is advisory only. It does not gate closure, prevent
  a reviewer from raising a signal, or suppress the LSC-T3 readout output.
- External agents must not return `"noSignal": false` to indicate a signal
  exists; they must submit an `externalAgentSignalEvent` instead.
- A no-signal assertion is not a null return. An empty return, missing `reason`,
  or `"noSignal": null` is malformed and must be rejected by a future adapter
  validator.

### Example No-Signal Assertion (documentation only)

```json
{
  "noSignal": true,
  "reason": "all applicable diagnostics are clean; no unresolved helper-detectable signals in the current changed set"
}
```

This example is documentation-only.

## Normalization Defaults

`normalizationDefaults`: fields a future helper or ledger normalization step
may synthesize automatically when ingesting an `externalAgentSignalEvent`.

These defaults are defined for future adapter authoring only. No normalization
helper exists yet. The normalization behavior documented here is consistent
with LSC-T1 and LSC-T0 intent.

| Synthesized field | Default value | Source authority | Synthesis timing |
|---|---|---|---|
| `sourceId` | pending-id pattern (for example `signal-pending-<ulid>`) | LSC-T1 CLI/MCP Minimal Payload Boundary; `LearningSignalIntakeRecord.sourceId` | at intake |
| `recordId` | pending-id pattern | LSC-T1; `LearningSignalIntakeRecord.recordId` | at intake |
| `observedAt` / `recordedAt` | ISO-8601 timestamp at ingestion time | LSC-T1 intake bridge | at intake |
| `repeatRisk` | `POSSIBLE` | LSC-T1 section LSC Extension Field Ownership; LSC-T4 section Threshold Matrix | at intake; may be promoted to `OBSERVED_REPEATED` only after ledger de-dup confirmation |
| `captureState` | `CAPTURED` | LSC-T1 section Capture-State Authority Rules | at intake |
| `autonomousMutationAuthorized` | `false` | invariant from `LearningSignalIntakeRecord`; LSC-T2 section Role-Neutral Invariants | at intake; cannot be changed by external agent input |
| `rootCauseGroupId` | `PENDING` | LSC-T1 section Root-Cause Group ID Derivation | at intake; assigned by de-dup logic later |
| `disposition` | `OPEN` | LSC-T1 intake bridge; set by absorbing role after absorption | post-absorption routing |

**Constraint:** normalization defaults may not be overridden by the external
event input. The external event carries only the five required fields listed
in section External-Agent Signal Event Shape. All other fields are synthesized or
assigned by governed CVF roles and processes.

## Readout Relationship

`readoutRelationship`: how the LSC-T3 fast helper readout relates to external
agent consumers.

### What LSC-T3 Provides

The `signalReadout` list exposed by `governance/compat/run_agent_automation_assist.py`
is a helper-local advisory output. Each `SignalReadoutItem` carries:
`sourcePath`, `sourceSurface`, `severity`, `repeatRisk`, `recommendedOutcome`,
`nextSuggestedAction`, `blocking`, and `reason`.

This output is currently emitted as:
- JSON under the `--json` flag (`"signalReadout": [...]` in `AssistReport.to_dict`).
- Human text in the `Learning Signal Readout (LSC-T3)` section of `_print_human`.

### Advisory Boundary For External Consumers

- The `signalReadout` is **advisory only**. An external CLI/MCP consumer that
  receives this output may present it to an operator or log it for review. It
  must not execute actions based on it without a separate governed work order.
- `recommendedOutcome` values are LSC-T4 vocabulary terms. They classify
  signals but do not authorize dispatch, mutation, work-order creation, or
  closure blocking.
- `blocking=false` for all routine helper-detected items. An external consumer
  must not treat advisory readout items as closure gates.
- The readout is derived from the current changed set only. It does not
  represent a global historical signal inventory.

### No Executable Instruction

An external agent that receives `signalReadout` output must treat it as
equivalent to an informational advisory message, not as an executable command
sequence. The `nextSuggestedAction` field suggests a human-initiated action;
it does not authorize the external agent to perform that action autonomously.

### LSC-T6 Does Not Modify the Helper

LSC-T6 is an adapter-contract-only tranche. It does not extend, modify, or
replace `governance/compat/run_agent_automation_assist.py`. The helper shape
described here reflects the LSC-T3 implementation at dispatch-base commit
`5ee4b9b5`. Any future change to the helper requires a separate work order.

## Promotion Recommendation Boundary

LSC-T4 promotion outcome vocabulary may appear in LSC-T6 adapter output only
as advisory recommendations. This section defines what external consumers may
and may not do with a promotion recommendation.

| LSC-T4 outcome | Advisory use by external consumer | Forbidden use |
|---|---|---|
| `READOUT_ONLY` | log the signal; notify operator; include in audit trace | block closure; trigger dispatch; execute mutation |
| `WATCH_FOR_REPEAT` | flag for operator attention; note in session trace | claim repeat evidence without ledger proof; assert `OBSERVED_REPEATED` |
| `GOVERNANCE_PROPOSAL_CANDIDATE` | recommend a governance proposal to a human operator | open a governed proposal autonomously |
| `RULE_CANDIDATE` | surface the signal for rule-authoring consideration | author or activate a rule autonomously |
| `CHECKER_CANDIDATE` | surface the signal for checker-implementation consideration | implement or activate a checker autonomously |
| `WORK_ORDER_CANDIDATE` | surface the signal for work-order dispatch consideration | dispatch a work order autonomously |
| `CLOSURE_BLOCKER` | notify operator that a blocker condition exists | block closure without operator confirmation; apply without explicit authorization |

### Promotion Recommendation Invariants

- An external consumer must not assert `OBSERVED_REPEATED` without confirmed
  ledger de-dup evidence. This rule is non-negotiable per LSC-T4 section Blocking
  Boundary and LSC-T3 section Blocking Boundary.
- An external consumer must not set `blocking=true` on its own authority.
  Only a future governed gate with LSC-T4 blocker conditions met may assert
  a blocker.
- `autonomousMutationAuthorized=false` remains invariant for all actors,
  including external agents. No promotion outcome authorizes autonomous
  mutation.

## External Returned-Output Absorption Routing

All external-agent returned output must follow the mandatory absorption chain
before it becomes a structured CVF signal. This rule is non-negotiable per
LSC-T2 section External Agent Returned-Output Routing and the external knowledge
absorption chain map.

### Mandatory Routing Steps

1. **Identify** the input as "External-agent returned output" per the chain
   map's Input Type Router (`docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md`).
2. **Route** through the External Agent Finding Absorption Workflow
   (`docs/reference/external_agent_review/CVF_EXTERNAL_AGENT_FINDING_ABSORPTION_WORKFLOW.md`)
   and its Required Absorption Table.
3. **Record** a disposition (`ABSORB`, `ADAPT`, `DEFER`, `REJECT`, or `BLOCK`)
   per the chain map's per-input-type minimum disposition column.
4. **Map** the absorbed and classified item to `EXTERNAL_AGENT_CRITIQUE` signal
   class using the absorption packet as `sourceArtifact`, never the raw
   external file or chat output.
5. **Submit** the resulting `externalAgentSignalEvent` using only the five
   required fields (section External-Agent Signal Event Shape), with normalization
   defaults applied at intake (section Normalization Defaults).

### What Bypasses This Chain

Nothing. No external-agent returned output may bypass this chain and become a
CVF signal by direct quotation, chat-paste, or raw file injection.

### What The Chain Does Not Authorize

Completing the absorption chain classifies the external output for signal
mapping. It does not:
- grant the external agent autonomous mutation authority;
- create a governed work order;
- update session or handoff surfaces;
- activate a checker or gate;
- trigger a public export.

## Mutation Boundary

`autonomousMutationAuthorized=false` remains invariant for all actors across
all LSC tranches.

| Boundary | Rule |
|---|---|
| External agent may propose | advisory signal event or no-signal assertion submitted to a future adapter endpoint |
| External agent must not execute | rule changes, work-order dispatch, gate activation, session state writes, handoff writes, public-sync, provider/live calls |
| Helper/ledger normalization | read-only intake normalization only; no autonomous governance action |
| Promotion outcome | advisory label only; does not authorize execution |
| `blocking=true` condition | requires LSC-T4 blocker rules satisfied by a governed gate; external agent cannot assert it unilaterally |

Any external agent that attempts to write session state, edit governed artifacts,
dispatch a work order, or execute a mutation beyond submitting a signal event
is operating outside the LSC-T6 contract boundary. The CVF governance plane
treats such actions as unauthorized autonomous mutation.

## Latency Boundary

| Stage | LSC-T6 behavior |
|---|---|
| Signal event construction | five fields; future external agent assembles before submission; no current CVF runtime path exists |
| No-signal assertion construction | two fields; no current CVF runtime path exists |
| Absorption chain classification | offline human-initiated classification; not a real-time computation |
| Normalization defaults synthesis | future helper/ledger behavior; must be separately authorized and measured before any performance claim |
| Promotion recommendation delivery | advisory label delivery via future adapter output; no current gate call is added |
| Runtime behavior | none; LSC-T6 defines contract boundary only |

LSC-T6 does not run in the current runtime, so no runtime latency, speed, or
cost optimization result is measured or claimed. All behavior described is
documentation-only until a future authorized CLI/MCP adapter tranche is
implemented.

## Parking Ledger

| Lane | Status | Relationship to LSC-T6 |
|---|---|---|
| LSC-T5 Learning Plane Bridge | parked; future operator-selected tranche | LSC-T6 defines the external IO contract; LSC-T5 will define the bridge to the Learning Plane runtime; LSC-T6 does not implement or reopen LSC-T5 |
| LSC-T7 Latency Guard And Fast Path | parked; future operator-selected tranche | LSC-T7 owns any future latency guard; LSC-T6 documents only the no-runtime boundary |
| AAF-T6 Guard Orientation Read-Receipt Gate | parked | not reopened by LSC-T6 |
| AAF-T7 friction-finding hardening | parked | not reopened by LSC-T6 |
| CGE-T3 external knowledge ledger | parked | not reopened by LSC-T6 |
| ACE-R1 Agent Coding Evidence Replay | parked | not reopened by LSC-T6 |
| MLW7 / MLW8 | parked | not reopened by LSC-T6 |
| CLI/MCP adapter implementation | not started; future separately authorized tranche | LSC-T6 defines the contract; actual adapter requires a separate GC-018 and work order |
| Ledger store, generator, drift checker | not started | not implemented or authorized by LSC-T6 |
| Public-safe export | not started; requires separate public-sync authorization | not authorized by LSC-T6 |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference contract for Learning Signal Chain
external-agent IO work. No public-sync remote, public commit, public artifact
path, or public claim is authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | LSC-T6 external-agent CLI/MCP signal IO contract definition only |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | documentation/reference contract authoring only |
| interceptionBoundary | no direct IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | portable external-agent signal IO shape, no-signal assertion, normalization defaults, readout relationship, absorption routing, promotion recommendation boundary, and mutation boundary only |
| forbiddenExpansion | wrapper/proxy enforcement, arbitrary-command execution, EDIT/COMMIT execution, provider/live, public-sync, queue/daemon, watcher, readiness, full-hook equivalence, CLI/MCP adapter behavior, MCP tool implementation, and universal control remain out of scope |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | worker role |
| Provider or surface | local workspace |
| Session or invocation | LSC-T6 worker execution, 2026-06-21 |
| Working directory | repository root |
| Command or tool surface | direct file read/write/edit tools |
| Target paths | `docs/reference/learning_signal_chain/CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT.md`; `docs/reference/learning_signal_chain/README.md`; `docs/reviews/CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT_WORKER_RETURN_2026-06-21.md` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT_FOR_WORKER_2026-06-21.md`; `docs/baselines/CVF_GC018_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT_2026-06-21.md` |
| Before status evidence | HEAD `c4b2c061`; clean worktree before worker execution |
| After status evidence | three worker artifacts created/updated; uncommitted |
| Diff evidence | reference contract created; README LSC-T6 row added; worker-return created |
| Approval boundary | worker role: update/create only the three required paths; no commit |
| Claim boundary | external-agent CLI/MCP signal IO contract only; no runtime, adapter, ledger, or public-sync claim |
| Agent type | worker role |
| Invocation ID | `lsc-t6-worker-2026-06-21` |
| Expected manifest | `docs/reference/learning_signal_chain/CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT.md` (create); `docs/reference/learning_signal_chain/README.md` (update); `docs/reviews/CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT_WORKER_RETURN_2026-06-21.md` (create) |
| Actual changed set | same as expected manifest |
| Manifest delta | MATCH |

## Related Surfaces

- `docs/reference/learning_signal_chain/README.md` - reference front door
- `docs/reference/learning_signal_chain/CVF_LSC_T1_SIGNAL_LEDGER_SOURCE_LAYOUT_AND_DEDUP_CONTRACT.md` - field ownership and CLI/MCP minimal payload boundary
- `docs/reference/learning_signal_chain/CVF_LSC_T2_MULTI_ROLE_CAPTURE_CONTRACT_AND_ELIGIBILITY_MATRIX.md` - external-agent returned-output eligibility and absorption routing
- `docs/reference/learning_signal_chain/CVF_LSC_T3_FAST_HELPER_READOUT.md` - `signalReadout` shape and advisory readout boundary
- `docs/reference/learning_signal_chain/CVF_LSC_T4_PROMOTION_THRESHOLD_POLICY.md` - promotion outcome vocabulary and blocking boundary
- `docs/roadmaps/CVF_LSC_T0_LEARNING_SIGNAL_CHAIN_RECONCILIATION_ROADMAP_2026-06-20.md` - chain reconciliation roadmap and LSC-T6 work plan row
- `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` - mandatory absorption chain routing

## Claim Boundary

This contract defines the external-agent signal IO shape, no-signal assertion,
normalization defaults, readout relationship, absorption routing, promotion
recommendation boundary, latency boundary, and mutation boundary for future
CLI/MCP adapter authors only. It does not implement a CLI/MCP adapter, MCP
tool, shell bridge, ledger store, generator, drift checker, durable store,
runtime Learning Plane mutation, provider/live proof, public-sync, direct
interception, wrapper/proxy enforcement, queue/daemon, watcher, readiness
proof, full-hook equivalence, cost optimization, or universal
governed-coding-control claim.

`externalAgentSignalEvent` and `externalAgentNoSignalAssertion` are
documentation-only shapes. They are not parsed by any current runtime, API
endpoint, schema validator, or MCP tool.

`autonomousMutationAuthorized=false` remains invariant for all actors,
including external agents submitting events through future adapters.
