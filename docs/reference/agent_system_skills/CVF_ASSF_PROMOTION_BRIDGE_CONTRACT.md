# CVF ASSF Learning And ADIF Promotion Bridge Contract

Memory class: FULL_RECORD

Status: CANDIDATE

Date: 2026-06-23

docType: reference

Batch ID: ASSF-T3

EPISTEMIC_PROCESS_NA_WITH_REASON: fixed-schema contract document; it
defines mapping rules, gate requirements, and invariants rather than
testing an evidence-comparison hypothesis.

## Purpose

Define how a repeated, accepted LSC learning signal and a recorded ADIF
finding each map into an ASSF skill candidate, with deduplication by
root-cause group, an evidence threshold reusing the LSC-T4 policy, a
reviewer-decision gate, a UAT requirement, explicit rejection and
session-local outcomes, a no-self-activation invariant, and explicit
internal and external agent CLI/MCP disposition fields.

Promoted output is always `CANDIDATE`. No promoter may set a skill
`APPROVED` or `ACTIVE` without reviewer decision and UAT.

## Scope / Applies To

Applies to any future ASSF promoter implementation (ASSF-T4 or later),
any tool, agent, or process that proposes an ASSF skill candidate from a
Learning Signal Chain ledger entry or an ADIF defect finding, and any
reviewer deciding on a promoted candidate.

Does not apply to direct candidate authoring by a human operator, to the
ASSF-T2 generated index or resolver, to the LSC ledger store generator, to
the ADIF resolver, or to any runtime/provider/live surface.

## Authority Chain

| Authority | Path |
|---|---|
| ASSF-T1 package contract (lifecycle states, provenance fields, candidate shape) | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` |
| ASSF-T2 resolver foundation (feed target for promoted candidates) | `governance/compat/run_assf_skill_resolver.py` |
| LSC-T4 promotion threshold policy (threshold and de-dup authority) | `docs/reference/learning_signal_chain/CVF_LSC_T4_PROMOTION_THRESHOLD_POLICY.md` |
| LSC signal ledger entry template (learning-evidence source shape) | `docs/reference/learning_signal_chain/CVF_LEARNING_SIGNAL_LEDGER_ENTRY_TEMPLATE.json` |
| ADIF entry template (defect-finding source shape, promotionState field) | `docs/reference/agent_defect_intelligence/CVF_ADIF_ENTRY_TEMPLATE.md` |
| Dual-agent surface accounting standard | `docs/reference/CVF_DUAL_AGENT_SURFACE_ACCOUNTING_STANDARD_2026-06-23.md` |
| ASSF roadmap (T3 tranche definition) | `docs/roadmaps/CVF_AGENT_SYSTEM_SKILLS_FOUNDATION_ROADMAP_2026-06-23.md` |

## No-Self-Activation Invariant

**This invariant is binding on all bridge-promoted candidates and on any
future promoter that implements this contract.**

1. No promoter, resolver, generator, agent, or automated process may set
   any skill to `APPROVED` or `ACTIVE` without an explicit reviewer
   decision recorded in a governed review artifact.
2. `autonomousMutationAuthorized=false` is inherited from the LSC
   `autonomousMutationAuthorized` field and is invariant for all
   bridge-promoted candidates.
3. A promoted `CANDIDATE` is evidence of a proposal only. It does not
   activate any skill, grant any agent expanded authority, open any
   package instruction body, or authorize any CLI/MCP adapter scope.
4. A reviewer or operator may advance a candidate past `CANDIDATE` only
   after the reviewer-decision gate and, for `ACTIVE`, after the UAT
   requirement are both satisfied.
5. Session-local candidate proposals that are not committed by a reviewer
   do not persist as CVF artifacts and must not be cited as CVF authority.

## Learning Signal To Candidate Mapping

This table defines how a promoter maps a LSC signal ledger entry field
to the corresponding ASSF-T1 compact source schema field. All promoted
candidates carry `status: "CANDIDATE"` regardless of signal severity or
threshold outcome.

| LSC signal field | ASSF-T1 candidate field | Transformation rule |
|---|---|---|
| `rootCauseGroupId` | `skillId` | `"lsc-" + slugify(rootCauseGroupId)` -- stable identifier derived from the de-dup key |
| `sourceSummary` | `name` | direct copy |
| `sourceArtifact` | `sourceArtifacts[0]` | direct path reference |
| `rootCauseGroupId` | `originLane` | `"LSC:" + rootCauseGroupId` -- preserves traceability to the de-dup key |
| `lane` | contributes to `taskClasses` | see Lane-to-TaskClass table below |
| `defectClass` | contributes to `taskClasses` | see DefectClass-to-TaskClass table below |
| `severity` | `riskProfile` | `"low"->"R0"`, `"medium"->"R1"`, `"high"->"R2"` |
| `evidenceBasis` | `purpose` | direct (promoter may augment with source context) |
| `nextControlAction` | `useWhen` | direct |
| `disposition` | contributes to `acceptanceEvidence` | promoter records disposition value |
| `autonomousMutationAuthorized` | `loaderBoundary` | must carry the `false` invariant; promoter must not override |
| (fixed) | `status` | always `"CANDIDATE"` |
| (fixed) | `candidateState` | always `"CANDIDATE"` |
| (fixed) | `approvalState` | always `"AWAITING_REVIEW"` |
| (fixed) | `uatState` | always `"NOT_STARTED"` |
| (fixed) | `certificationState` | always `"NOT_STARTED"` |
| (fixed) | `internalAgentDisposition` | always `"CANDIDATE"` |
| (fixed) | `externalCliMcpDisposition` | always `"DEFERRED_WITH_REASON"` |
| (fixed) | `adapterContract` | `"N/A with reason: no external adapter implemented"` |
| (fixed) | `license` | `"CVF_PRIVATE_GOVERNED"` |

### Lane-To-TaskClass Mapping

| LSC `lane` value | ASSF-T1 `taskClasses` entry |
|---|---|
| `GOVERNANCE_CONTROL_PLANE` | `"governance-review"` |
| `RUNTIME_BEHAVIOR_LEARNING` | `"runtime-analysis"` |
| `PROVIDER_OUTPUT_LEARNING` | `"provider-evaluation"` |
| `COST_ECONOMICS_LEARNING` | `"cost-analysis"` |
| `DOCUMENTATION_ONLY_LEARNING` | `"documentation-authoring"` |
| (unknown) | promoter records raw value prefixed with `"lsc-lane:"` |

### DefectClass-To-TaskClass Mapping

| LSC/F2G `defectClass` | Contributes `taskClasses` entry |
|---|---|
| `WORKER_EXECUTION_ERROR` | `"worker-execution"` |
| `ORCHESTRATOR_PACKET_GAP` | `"dispatch-authoring"` |
| `RULE_GAP` | `"governance-review"` |
| `MACHINE_GATE_GAP` | `"governance-review"` |
| `PHASE_GATE_PLACEMENT_GAP` | `"governance-review"` |
| `OPERATOR_SCOPE_CLARITY_GAP` | `"governance-review"` |
| `RUNTIME_SIGNAL_GAP` | `"runtime-analysis"` |
| `UNVERIFIED_CLAIM` | `"reviewer"` |
| `DOCUMENTATION_GAP` | `"documentation-authoring"` |
| (other) | promoter records raw value prefixed with `"defect-class:"` |

## ADIF Finding To Candidate Mapping

This table defines how a promoter maps an ADIF entry to the corresponding
ASSF-T1 compact source schema field.

| ADIF entry field | ASSF-T1 candidate field | Transformation rule |
|---|---|---|
| `defectId` | `skillId` | `"adif-" + slugify(defectId)` -- stable identifier derived from the defect id |
| `title` | `name` | direct copy |
| path to entry file | `sourceArtifacts[0]` | direct path reference |
| `defectId` | `originLane` | `"ADIF:" + defectId` -- preserves traceability to the defect entry |
| `taskClasses` | `taskClasses` | direct copy (values are already governed task-class identifiers) |
| `roles` | `roles` | direct copy |
| `lifecyclePhases` | `phases` | direct copy |
| `surfaceSelectors` | `surfaces` | direct copy |
| `severity` | `riskProfile` | `"LOW"->"R0"`, `"MEDIUM"->"R1"`, `"HIGH"->"R2"` |
| `detectionSignals` | `useWhen` | promoter summarizes into `useWhen` sentence |
| `remediation` | `purpose` | promoter summarizes into `purpose` sentence |
| `promotionState` | bridging advisory field (see Advisory Field below) | carried as-is; not a replacement for ASSF lifecycle state |
| `checkerBindings` | `acceptanceEvidence` | promoter records checker path if MACHINE_CHECKED |
| (fixed) | `status` | always `"CANDIDATE"` |
| (fixed) | `candidateState` | always `"CANDIDATE"` |
| (fixed) | `approvalState` | always `"AWAITING_REVIEW"` |
| (fixed) | `uatState` | always `"NOT_STARTED"` |
| (fixed) | `certificationState` | always `"NOT_STARTED"` |
| (fixed) | `internalAgentDisposition` | always `"CANDIDATE"` |
| (fixed) | `externalCliMcpDisposition` | always `"DEFERRED_WITH_REASON"` |
| (fixed) | `license` | `"CVF_PRIVATE_GOVERNED"` |
| (fixed) | `loaderBoundary` | `"loading metadata never grants authority to commit, activate, or execute"` |

### ADIF promotionState Advisory Field

The ADIF `promotionState` field (`RULE_EXISTS`, `MACHINE_CHECK_ADDED`,
`DESIGN_REVIEW_REQUIRED`) is carried as an advisory field in the promoted
candidate. It does not replace or override the ASSF-T1 lifecycle state.
Its purpose is to help a future reviewer understand what governance action
has already been taken for the defect pattern, so they can assess whether
a skill candidate adds value beyond the existing defect record.

## Deduplication Rule

This rule reuses the LSC-T4 "De-dup before promotion" rule exactly.
Promoters must not invent a weaker rule.

1. Signals and ADIF findings sharing a `rootCauseGroupId` are counted
   **once** for promotion eligibility, regardless of how many projections
   (LSC signal, ADIF entry, worker-experience token, F2G row) observe the
   same root cause.
2. If an LSC signal and an ADIF entry both describe the same root cause,
   they must be mapped to a single candidate. The candidate's `skillId`
   is derived from the `rootCauseGroupId`; the candidate's `sourceArtifacts`
   lists both the LSC signal artifact and the ADIF entry path.
3. A promoter must not create two separate candidate entries for the same
   `rootCauseGroupId`. A future ledger or helper tranche enforces this
   constraint via de-dup by `rootCauseGroupId`; this contract states the
   policy rule.
4. `repeatRisk=POSSIBLE` is the correct default for any signal's first
   ledger entry, per LSC-T1 and LSC-T4. A promoter must not upgrade
   `repeatRisk` to `OBSERVED_REPEATED` based on agent memory or chat
   recollection alone; a future ledger tranche must confirm recurrence
   deterministically.

## Evidence Threshold

This threshold reuses the LSC-T4 Threshold Decision Matrix and
Blocking-Vs-Readout Policy exactly. Promoters must not invent a weaker
threshold.

### LSC Signal Promotion Threshold

A LSC signal is eligible for candidate promotion only when its recommended
outcome (derived from the LSC-T4 matrix) is:

- `GOVERNANCE_PROPOSAL_CANDIDATE`
- `RULE_CANDIDATE`
- `CHECKER_CANDIDATE`
- `WORK_ORDER_CANDIDATE`
- `CLOSURE_BLOCKER`

A signal with outcome `READOUT_ONLY` or `WATCH_FOR_REPEAT` is **not**
eligible for candidate promotion at that time. A promoter must not
promote a `READOUT_ONLY` or `WATCH_FOR_REPEAT` signal, even if the
operator requests it, until the signal's outcome is re-evaluated to a
higher level by a future ledger or helper tranche.

`CLOSURE_BLOCKER` signals must be routed to the reviewer-decision gate
before promotion is considered; a promoter must not create a candidate
for a `CLOSURE_BLOCKER` signal without operator-or-reviewer authorization
of the promotion.

### ADIF Finding Promotion Threshold

An ADIF finding is eligible for candidate promotion only when:

1. Its `lifecycleState` is `ACTIVE` (not `PROPOSED`, `SUPERSEDED`, or
   `RETIRED`), AND
2. Its `promotionState` is one of: `DESIGN_REVIEW_REQUIRED`,
   `MACHINE_CHECK_ADDED`, or `RULE_EXISTS`, AND
3. Its `severity` is `MEDIUM` or `HIGH`.

A `LOW`-severity `ACTIVE` ADIF finding is not automatically eligible for
promotion. A promoter may promote a `LOW`-severity finding only with
explicit operator authorization recorded in the promotion request.

## Reviewer-Decision Gate

Before any promoted candidate may advance from `CANDIDATE` to `PROPOSED`
or `APPROVED`, a CVF reviewer must:

1. Read the candidate's `sourceArtifacts` and verify that the source
   signal or ADIF finding exists and meets the evidence threshold above.
2. Verify that the dedupe rule has been applied (no duplicate candidates
   share a `rootCauseGroupId`).
3. Explicitly record acceptance or rejection in a governed review artifact
   under `docs/reviews/`.
4. Update the candidate's `approvalState` from `AWAITING_REVIEW` to
   either `APPROVED` or `REJECTED`.

Worker self-approval is not a reviewer decision. An agent that promoted
the candidate may not also serve as its reviewer.

## UAT Requirement

Before any candidate may advance from `APPROVED` to `ACTIVE`:

1. UAT must be completed against the candidate's defined `inputs`,
   `outputs`, and `executionConstraints`.
2. UAT evidence must be recorded in the candidate's `reviewArtifacts`
   field with a path to the UAT artifact.
3. The reviewer or closer must update `uatState` from `NOT_STARTED` to
   `COMPLETE` and `certificationState` to `CERTIFIED` after evidence is
   accepted.

No agent or automated process may set `uatState: "COMPLETE"` without a
human or reviewer having verified the UAT evidence.

## REJECTED Outcome

A candidate is REJECTED when:

- The reviewer-decision gate produces an explicit rejection (the reviewer
  finds the source signal or ADIF finding does not meet the evidence
  threshold, is a duplicate, or is otherwise not suitable for a skill
  candidate).
- A future operator or closer marks the candidate as superseded by a
  better candidate.

A REJECTED candidate must:

- have `status: "REJECTED"` and `candidateState: "REJECTED"` in its
  source entry file;
- remain in the registry at its canonical path (never deleted);
- be excluded from resolver results by default (the resolver's
  `include_excluded=False` default applies per `run_assf_skill_resolver.py`);
- cite the rejection reason in a `rejectionReason` field (advisory, not
  currently enforced by checker).

## Session-Local Outcome

A candidate that is drafted or proposed in a worker session but not
committed to the repository by a reviewer is session-local. Session-local
candidates:

- do not persist as CVF artifacts;
- must not be cited as CVF authority in any downstream artifact;
- must not be referenced in session state, front doors, or handoffs as if
  they were committed;
- are discarded when the session ends without a reviewer commit.

A worker-return packet may describe a session-local candidate as a
proposed candidate, but it must clearly mark it as "session-local,
uncommitted" and must not treat it as a committed skill entry.

## External-Agent CLI/MCP Disposition

| Field | Value |
|---|---|
| `externalCliMcpDisposition` | `DEFERRED_WITH_REASON` for all bridge-promoted candidates |
| Adapter boundary | no CLI/MCP adapter is implemented by ASSF-T3; this contract records the external-agent disposition in all promoted candidates |
| Adapter contract | N/A with reason: external CLI/MCP promotion or candidate-review adapter not yet authored; separate ASSF adapter work order required before any CLI/MCP bridge scope is implemented |
| Mutation boundary | no external mutation permitted until a separate ASSF adapter work order is accepted and reviewed |
| Future adapter requirement | any future CLI/MCP adapter that surfaces promoted candidates must cite this contract as a required read and must enforce the no-self-activation invariant and the reviewer-decision gate |

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | the bridge contract that future internal promotion tooling (ASSF-T4 or later) will consume | T3 defines the mapping and gates only; it implements no promoter and grants no authority to set a candidate APPROVED or ACTIVE; promoted output is always CANDIDATE | this contract document, conformance to ASSF-T1 lifecycle states, LSC-T4 threshold reuse, and ADIF template source shapes | no promoter implemented in ASSF-T3 | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future CLI/MCP promotion or candidate-review adapter | T3 records the external-agent disposition in the bridge contract and in all promoted candidates; it does not implement, expose, or authorize any adapter | dual-agent standard; `externalCliMcpDisposition` field defined in all promoted candidates via the mapping tables | separate ASSF adapter work order required | `DEFERRED_WITH_REASON` |

## Conformance Mapping Summary

| Source field family | Source artifact | Maps to ASSF-T1 family | Key fields mapped |
|---|---|---|---|
| LSC Intake Owned Fields | `CVF_LEARNING_SIGNAL_LEDGER_ENTRY_TEMPLATE.json` existingIntakeOwnedFields | Identity, Purpose, Selectors, Risk | `sourceId->skillId`, `sourceSummary->name`, `severity->riskProfile`, `evidenceBasis->purpose` |
| LSC Extension Fields | `CVF_LEARNING_SIGNAL_LEDGER_ENTRY_TEMPLATE.json` lscExtensionFields | Provenance, Lifecycle | `rootCauseGroupId->originLane/skillId`, `repeatRisk->threshold check` |
| ADIF Identity Fields | `CVF_ADIF_ENTRY_TEMPLATE.md` Required Fields | Identity, Provenance | `defectId->skillId`, `title->name`, `lifecycleState->eligibility check` |
| ADIF Selector Fields | same | Selectors | `taskClasses`, `roles`, `lifecyclePhases`, `surfaceSelectors` |
| ADIF Risk Fields | same | Risk | `severity->riskProfile` |
| ADIF Promotion Fields | same | Lifecycle (advisory) | `promotionState->advisory bridging field` |
| Fixed bridge constants | this contract | Lifecycle, Internal/External | `status=CANDIDATE`, `approvalState=AWAITING_REVIEW`, `internalAgentDisposition=CANDIDATE`, `externalCliMcpDisposition=DEFERRED_WITH_REASON` |

## Future Tranche Routing

| Future scope | Required next action |
|---|---|
| Executable promoter implementation | Route to ASSF-T4 or a separately authorized tranche; requires GC-018 baseline and source-verified work order citing this contract as authority |
| Bridge-conformance checker | Route to ASSF-T7 or a checker tranche; a checker should verify that promoted candidate entries carry valid provenance back to an LSC signal or ADIF finding |
| No-self-activation regression test | Route to any tranche that implements a promoter; the test should assert that no promoted output has `status=APPROVED` or `status=ACTIVE` |
| CLI/MCP adapter | Route to a separate ASSF adapter work order; this contract must be cited as a required read |

This contract must be cited as a required read in any future ASSF-T4 or
later promoter work order.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | ASSF-T3 bridge contract authoring only |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE -- contract-definition worker-return lane only |
| receiptEvidence | N/A with reason: no runtime execution, no promoter invocation, no candidate files created |
| actionEvidence | ACTION_EVIDENCE_PRESENT -- conformance mapping tables, source verification rows in the work order |
| invocationBoundary | reference document authoring only; no filesystem mutation beyond creating this file |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | authorizes a bounded learning-and-defect promotion bridge contract document only |
| forbiddenExpansion | no promoter code, resolver, generator, drift checker, real candidate entry, skill activation, CLI/MCP adapter, migration, runtime/provider/live, or public-sync |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this bridge contract references private learning-signal and defect
provenance. It also depends on private ASSF registry sources and private
ADIF entry shapes that have not been reviewed for public export. Public-safe
promotion documentation requires later redaction, public-sync authorization,
and a separate reviewed artifact.

## Claim Boundary

This document defines the bridge contract only. It does not implement a
promoter, resolver, generator, drift checker, or test. It does not create
a real skill candidate entry, activate any skill, run a learning scan,
implement a CLI/MCP adapter, provide runtime or provider proof, or
authorize public-sync. A future promoter must obtain a separate GC-018
baseline and governed work order citing this contract as authority before
any implementation begins.
