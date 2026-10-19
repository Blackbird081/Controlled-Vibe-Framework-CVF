# Model Selection S4-R1: Manual AGENT_SEAT Worked Example

Memory class: bounded-manual-guide
docType: guide
Status: MANUAL_EXAMPLE_ONLY
Date: 2026-10-11
Batch ID: CVF-MODEL-SELECTION-S4-R1-20261011
Role: INTERNAL_AGENT documentation worker; Local is independent reviewer and final technical decision owner
rawMemoryReleased=false

## Purpose and Claim Boundary

This example shows how a dispatcher can carry an operator's explicit assignment through a bounded AGENT_SEAT task while keeping model selection, dispatch admission, evidence quality, outcome review, and later learning use separate. It is a manual worked example under the R3 selection doctrine and contract designs. Those designs remain proposals subordinate to current CVF owners. This guide adds no schema, runtime selector, provider rule, or automatic control.

Use this guide to prepare a source-bound work order and later review its worker return. It does not select a model for future tasks, establish model equivalence or ranking, validate a price, or prove runtime/provider behavior. Requested tool settings are not proof of immutable runtime identity.

Role, phase, and decision owner: this is an INTERNAL_AGENT worker artifact for internal documentation execution; Local owns private-CVF verification, independent review, and final disposition. No external research is part of this task.

## Source Authority and Pins

The following source bytes were pinned at the clean execution base `d35e96b9456d78f4ebcb8aa9d7a91584c501af3f`. Hashes identify these local files; they do not prove current web content or a model runtime snapshot.

| Source | SHA-256 | Use in this example |
|---|---|---|
| `docs/reference/CVF_ORCHESTRATOR_MODEL_SELECTION_DOCTRINE_DESIGN_2026-10-10.md` | `9eb0b9cb8020113f1db7dbd41923b4f06ac57d884d5eade7ee31156395504082` | AGENT_SEAT versus Gateway boundary; explicit assignment and delegated-choice branches; uncertainty, cost, and learning limits |
| `docs/reference/CVF_ORCHESTRATOR_MODEL_SELECTION_CONTRACT_DESIGN_2026-10-10.md` | `7e090f5249d7e61a939ca1a0dadc65e10555cc5b04f75a053c1c64e190611a09` | `CandidateConfiguration`, `VersionEvidence`, `SelectionDecision`, `ReviewedOutcomeLink`, and `LearningConsumptionLink` semantics |
| `docs/roadmaps/CVF_ORCHESTRATOR_MODEL_SELECTION_SYSTEM_CHAIN_ROADMAP_2026-10-10.md` | `2583aa5f81394cc9353f078c51053d00ca3b102c2f133f6a6a5ebfa162ba7e14` | S4 requires a later B task and reviewer-checked action/result; S2 and S5 are separate and not authorized here |
| `docs/reviews/CVF_MODEL_SELECTION_S3_R1_COMPLETION_2026-10-10.md` | `b02b0077a97d7808a433a6ad2d6dedbb1a3ab50cf4362c4627d7888d3aa11a9a` | Frozen S3 packet-completeness observation and its limitations |
| `docs/baselines/CVF_GC018_MODEL_SELECTION_S4_R1_MANUAL_WORKED_EXAMPLE_2026-10-11.md` | `daba5c16243353284151c61159a8eeebcbbe16d4e30f4f2ff33c0a7a876e6fc8` | This task's bounded scope, evidence pins, acceptance criteria, and worker ownership |
| `docs/work_orders/CVF_AGENT_WORK_ORDER_MODEL_SELECTION_S4_R1_MANUAL_WORKED_EXAMPLE_2026-10-11.md` | `d33284509af2456fc2402e4cf21868bd45bbde16c1523940f955986a8d69806b` | Exact work order, three output paths, no-commit rule, 45-minute cap, and required return shape |
| `docs/reference/CVF_AGENT_DELEGATION_AND_SUBAGENT_BOUNDARY_STANDARD_2026-05-19.md` | `5a5356b1afe32dbd1ce1c109ad0fc04bbc9c54cafd8f05a3f081d0c5dcb07f52` | A worker executes only its bounded task and returns uncommitted work for review |
| `docs/reference/project_role_provider_delegation/README.md` | `d8b4ff00d6d1793dd924105152ec40905b4780b3ba22b342570cffee07ca2755` | Operator owns role/provider configuration; worker cannot commit or grant provider execution |

The R3 contract names the record family `CandidateConfiguration`. A shorthand in the work-order prose does not create a new `ConfigurationRef` record or schema. Keep this guide aligned with the source owner.

## Actual Worked Example: Explicit Assignment

### 1. Fix the outcome and task profile

The actual task is one private, reversible documentation job: prepare this guide for the next manual B dispatcher, create a complete worker return, and record source, identity, static-case, gate, and attempt evidence. The required outcome is three exact files. The worker may read governed sources, write those three paths, and run the named local checks. The worker may not commit, call a provider API, spawn another worker, install software, edit a protected source, or open a public, runtime, deployment, or real-data effect.

The task profile is `surface=AGENT_SEAT`, `role=worker`, with an independent Local reviewer and closer. The acceptance floor is artifact and evidence completeness against the work order plus independent review. The operator set the topology and the task-specific requested configuration. A future non-coder can state the goal, constraints, and budget; ordinary technical model selection stays with the orchestrator and existing authority owners.

### 2. Record the candidate and evidence limits

For this actual dispatch, `CandidateConfiguration` records only what is supported:

| Field or evidence | Actual value | Basis and limit |
|---|---|---|
| Requested model alias | `gpt-6-luna` | Operator/dispatcher request carried in the work order |
| Requested effort | `xhigh` | Tool value requested in the work order |
| Provider/product identifier, immutable snapshot, channel, harness/version, and observed effort | `UNKNOWN` | No immutable runtime identity receipt is exposed to this worker |
| Runtime-observed model identity | `UNKNOWN` | The requested setting is not runtime observation |
| Relevant quality history for this exact task/configuration | `INSUFFICIENT` | No prior Luna trial supports a task-specific quality upgrade |
| Cost, tokens, quota, invoice, and subscription allocation | `UNKNOWN` / `null` | No unit-safe measurement or tariff evidence is supplied |

Do not fill an unknown with a model-family guess, infer the provider from an alias, or treat the invocation request as an immutable snapshot. No model benchmark, price, availability, or current capability lookup was performed for this guide.

### 3. Make the selection decision

This is the explicit-assignment branch. Record `SelectionDecision=SELECT` for the assigned configuration and `operatorAssignmentDisposition=HONORED_WITH_EVIDENCE_GAP`. Keep `qualityDisposition=INSUFFICIENT` for configuration-specific predictive evidence. The contract allows an explicit assignment when the only gap is missing predictive quality history; it does not turn that gap into `SUPPORTED`.

Selection does not itself authorize execution. If the assigned model is unavailable, conflicts with policy or method, or fails a known hard requirement, stop with a hold or use only an already authorized substitution path. Do not silently replace it. A missing mandatory context, authority, budget, or effect proof remains with its owner and blocks dispatch as applicable, even when the explicit assignment is recorded.

### 4. Check dispatch admission separately

The Local dispatcher admitted this one task after a clean committed release and a bound pre-dispatch PASS. At worker start, the full execution base was `d35e96b9456d78f4ebcb8aa9d7a91584c501af3f`; all three output paths were absent and the worktree was clean. The worker's bound pre-implementation gate then passed on the same base/head before editing. These are task-specific admission facts, not proof that a provider ran or that the selected configuration is generally suitable.

The work order fixes one shared-workspace worker, three exact output files, a 45-minute ceiling, no retry or nested delegation, no provider execution, and no commit. The Local reviewer is a different actor. If context or tool access had been missing, dispatch would have remained held regardless of the `HONORED_WITH_EVIDENCE_GAP` label.

### 5. Keep the worker return and acceptance distinct

The return preserves the initial disposition, any first gate failure, every repair and its actor, the final submitted bytes, and separate money/token/quota/worker-time/human-time fields. In this task, the requested configuration remains unverified and all cost fields remain unknown. Elapsed wall time is a separate measure and cannot be converted into a bill or savings claim.

`ReviewedOutcomeLink` must keep the first worker return and its first disposition separate from any final accepted artifact. If a reviewer repairs the artifact, record who repaired what and why. Local may accept the final document without upgrading the initial worker return into a configuration-quality result. The completion review and any final acceptance remain pending until Local independently checks the three files and the action/result evidence.

## S3 Observation Consumption

The later-use link is `branch=LOCAL_OBSERVATION`, source `docs/reviews/CVF_MODEL_SELECTION_S3_R1_COMPLETION_2026-10-10.md`, SHA-256 `b02b0077a97d7808a433a6ad2d6dedbb1a3ab50cf4362c4627d7888d3aa11a9a`, source commit `011c9cd1d7a3d3ffbd6b8e070d8aab37f6774a40`. The current pinned roadmap and Local completion still identify S3-R1 as closed for its documentation outcome; the observation remains applicable only to packet completeness. Local retained a failed mixed-range receipt and explicitly did not promote it into successful full-range closure proof. This limitation does not remove the source-bound packet-gap observation, and it conveys no model-quality or runtime evidence.

The current action is to expose the complete required return-section list in this order and produce a guide/return that a later dispatcher can follow. At authoring, the evidence-use label is `CITED`; independent action/result review is pending. Local may record `ACTION_VERIFIED` only after checking the actual guide/return against the gap and observing the return gate result. A citation, this worker's self-check, or a passing structural gate alone is not independent semantic verification. If a later check finds the source retracted or superseded, narrow it to historical context and hold any dependent claim.

This is not `PARENT_CONTROL`. A future parent-control link must use the existing typed PLL owner and its own delivery/application evidence. The S3 observation does not claim PLL `DELIVERY` or `APPLICATION`, and no new learning store or control is created here.

## Static Counterfactual Cases

Except for Case 1, each row below is a hypothetical static example and was not executed. Each row separates selection, admission, evidence, and acceptance.

| Case | Selection | Dispatch admission | Evidence disposition | Acceptance disposition |
|---|---|---|---|---|
| 1. Explicit quality-history gap (actual S4 assignment) | `SELECT`; `HONORED_WITH_EVIDENCE_GAP` | Admit only after all independent context, authority, tool, and budget checks pass; this task's bound gates passed | Exact runtime identity and predictive quality remain unknown/insufficient | Artifact remains `PENDING_REVIEW`; no model-quality conclusion |
| 2. Delegated choice with insufficient quality evidence (hypothetical, unexecuted) | `HOLD_EVIDENCE`; a recommendation may be returned, but no autonomous SELECT | Require relevant evidence or an eligible supported alternative. A new explicit operator assignment opens the separate assignment branch; generic authority does not waive delegated quality requirements | Preserve missing evidence; do not convert it to `SUPPORTED` | No worker outcome to accept |
| 3. Missing mandatory context proof after an explicit assignment (hypothetical, unexecuted) | The assignment record may remain SELECT with the quality-gap label | Hold dispatch until the context owner supplies proof; the evidence-gap label is never context PASS | Name the owner and pending proof | No execution or artifact acceptance claim |
| 4. Requested/observed identity mismatch (hypothetical, unexecuted) | Preserve the original decision and request | Stop or hold any dependent action according to the existing admission owner; do not silently swap configuration | Record requested and observed identity separately as a deviation; do not transfer old evidence | Do not promote the output to the originally selected configuration |
| 5. Repaired artifact (hypothetical, unexecuted) | Selection remains the original decision | Repair is allowed only within the admitted scope and review boundary | Keep initial return, first disposition, repairs/assistance, and final bytes distinct | Reviewer may accept final artifact; no first-return quality upgrade follows |
| 6. Retracted or superseded source (hypothetical, unexecuted) | Do not base a new selection/action on stale evidence | Hold the dependent action or narrow the link to historical context | Preserve original pin and current retraction/applicability check | No `ACTION_VERIFIED` or `NO_CHANGE_REASONED` claim on that source |
| 7. Unavailable explicitly assigned model (hypothetical, unexecuted) | `HOLD_OPERATOR_CONSTRAINT`, with reason and owner; selected candidate is null. An alternative requires already authorized substitution and its own admitted decision | Hold without silent fallback | Availability evidence belongs to the current admission check | No worker outcome exists until a permitted configuration is admitted |
| 8. Unknown money (hypothetical, unexecuted) | Do not rank on an unknown monetary value | Compare a hard cap only in a supported matching unit/window; otherwise hold that budget decision | Money, token usage, quota, worker time, human time, and elapsed time remain separate; unknown is null, not zero | No bill, savings, or cost-effectiveness claim |

## Dispatcher Continuation Checklist

For the next manual B task, the dispatcher should:

1. Read the current work order, operator assignment or delegated-choice authority, outcome, acceptance floor, allowed tools, data/risk boundary, and hard budgets.
2. Build a task-specific `CandidateConfiguration` from observed and requested fields, preserving unknowns. Use `VersionEvidence` only when a source is actually pinned and applicable to this task/configuration.
3. Record whether the choice is explicitly assigned or delegated. Use the explicit-assignment evidence-gap branch only for missing predictive quality history; for a delegated choice with insufficient evidence, hold for evidence or choose a supported eligible alternative.
4. Run current dispatch/context and release gates separately from SELECT. Stop on any hard authority, policy, method, context, budget, or availability conflict.
5. Freeze the bounded rationale and exact file manifest in the existing work order. Preserve the worker's original return, gate failures, repairs, unknown units, and final artifact as distinct evidence.
6. Assign a different-actor reviewer. Record `LOCAL_OBSERVATION` as `CITED` until a reviewer checks the later action/result; use typed PLL proof only for an actual `PARENT_CONTROL` branch.

The Local reviewer for this return owns the next action: independently check the three-file manifest, the static counterfactual boundaries, the S3 packet-gap action/result, and the worker-return gate. This guide does not open S2, S5, Expense, Gateway, provider, public-sync, deployment, or any successor task.

## Scope / Methodology

This is a named-source manual example for one private, reversible AGENT_SEAT documentation assignment. It follows the paired S4-R1 baseline and work order, reads the R3 design owners and S3 completion evidence, and uses the local checker owners named by the work order. It changes no source contract, schema, runtime path, global template, or provider behavior.

## Findings / Position

The actual assignment branch can record SELECT with HONORED_WITH_EVIDENCE_GAP when predictive quality history alone is missing. This does not make the configuration SUPPORTED or bypass task admission. The guide records the requested Luna/xhigh settings and leaves immutable runtime identity, snapshot, costs, and model-specific quality unknown.

## Risk / Corrective Action

A requested setting can differ from the runtime configuration, and an artifact can be repaired before acceptance. Keep requested and observed fields separate, preserve the first return and repair attribution, and let the independent reviewer assess the final artifact. Local must verify the S3 packet-gap action/result before marking the LOCAL_OBSERVATION ACTION_VERIFIED.

## Decision / Disposition

Disposition: MANUAL_EXAMPLE_ONLY. The guide is ready for Local's independent review as a bounded worker artifact; it does not close S4 and does not authorize a follow-on tranche.

## Claim Boundary and Verification

Claim: This file demonstrates a source-bound manual decision path for one explicitly assigned private AGENT_SEAT task.

Final: No model quality, cost, runtime, or global governance conclusion is made.

Verification: Local independently checks the three-file manifest, the eight case boundaries, and the actual action/result against the pinned S3 packet-gap finding. A citation or worker-authored check alone leaves the observation at CITED.

## Local Review Amendment

Local preserved the submitted guide SHA-256 `344199fff3ea91e05bbc1578003f771ce37d9eddff57ce9bd981ee98791d2b67` and corrected the evidence-use label and two hold-branch explanations. The pending statements above describe the frozen worker-time example. Final artifact acceptance and reviewer-verified observation use are recorded separately in `docs/reviews/CVF_MODEL_SELECTION_S4_R1_COMPLETION_2026-10-11.md`; they do not change the historical worker decision or establish model quality.
