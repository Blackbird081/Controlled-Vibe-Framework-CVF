# CVF SOT3 Activation Architecture Decision

Memory class: FULL_RECORD

Status: RATIFIED_BOUNDED

docType: architecture_decision

Decision ID: SOT3-ACT-A0

Date: 2026-07-13

## Purpose

Select one bounded product seam where the absorbed Source of Truth three-layer
stack can be activated and later proven with a real provider call.

This decision closes architecture tranche A0 only. It does not authorize A1
runtime edits, create live evidence, or make the final
`LIVE_GOVERNANCE_PROVEN_BOUNDED` claim.

## Scope / Applies To

Applies only to the first SOT3 product activation in the CVF Web scoped
knowledge-context path. It governs the placement and ownership of the future
adapter, evidence store, live scenario, failure proof, and release proof. It
does not authorize implementation in any of those later tranches.

## Decision

The first product activation seam is the scoped knowledge retrieval path in
`/api/execute`, after tenant-aware chunk retrieval and before knowledge context
is appended to the provider system prompt.

```text
knowledgeStore
    |
    v
queryKnowledgeChunks (scope filter remains authoritative)
    |
    v
SOT3 knowledge activation adapter
    |
    +--> RefineryEngine
    +--> TruthKernel
    +--> DistributionEngine / KernelAuthorityBoundary
    |
    v
Flow-approved knowledge context only
    |
    v
buildKnowledgeSystemPrompt -> executeAI
```

The provider is a downstream consumer and never a truth authority. This seam
is already source-bearing, bounded, and positioned before provider execution.
It proves a real application integration without expanding SOT3 into prompt
classification, provider routing, output validation, or the whole CVF runtime.

## Source-Verified As-Built Map

| Existing fact | Source | Verified line or symbol | Disposition |
|---|---|---|---|
| Execute retrieves tenant-scoped knowledge chunks | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` | lines 708-715; `queryKnowledgeChunks` | ACCEPT |
| Chunks are formatted before prompt construction | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` | lines 715-724; `formatKnowledgeChunks`; `buildKnowledgeSystemPrompt` | ACCEPT |
| Provider execution follows prompt construction | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` | lines 788-795; `executeAI` | ACCEPT |
| Retrieval enforces organization and team scope | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/knowledge-retrieval.ts` | `scopeAllowsCollection`; `queryKnowledgeChunks` | ACCEPT |
| Prompt helper expects pre-governed context | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/knowledge-context-injector.ts` | lines 4-6; `buildKnowledgeSystemPrompt` | ACCEPT |
| Execute route is near its hard threshold | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` | 972 physical lines on 2026-07-13 | ACCEPT |
| Refinery has one mandatory deterministic stage chain | `EXTENSIONS/CVF_REFINERY/src/pipeline/engine.ts` | `REQUIRED_STAGE_CHAIN`; `RefineryEngine.run` | ACCEPT |
| Kernel exposes evaluation and reference issuance | `EXTENSIONS/CVF_TRUTH_KERNEL/src/index.ts` | `TruthKernel`; `EvaluateInput`; `EvaluateResult` | ACCEPT |
| Flow exposes Kernel authority and distribution lifecycle | `EXTENSIONS/CVF_TRUTH_FLOW/src/index.ts` | `KernelAuthorityBoundary`; `DistributionEngine` | ACCEPT |
| Vertical slice is a scenario orchestrator | `EXTENSIONS/CVF_SOT_THREE_LAYER_SLICE/src/orchestrator.ts` | `runThreeLayerScenario`; lines 44-56 | ACCEPT |
| Release-quality proof includes live governance E2E | `scripts/run_cvf_release_gate_bundle.py` | `check_e2e`; `--e2e-live`; default gate path | ACCEPT |

## Ownership And Boundaries

| Question | A0 decision |
|---|---|
| Product owner | CVF Web execute-path knowledge integration |
| Adapter owner | a new focused CVF Web library module |
| Retrieval scope owner | existing retrieval and policy scope logic |
| Truth authority | `cvf-truth-kernel` only |
| Distribution authority | `cvf-truth-flow` only |
| Provider role | downstream consumer of Flow-approved context |
| Persistence owner | dedicated SOT3 evidence store introduced in A2 |
| Route edit budget | one thin adapter call and evidence projection; no SOT3 lifecycle implementation in `route.ts` |
| Enforce failure default | unverified knowledge does not reach the provider |
| Public status | private provenance only |

## Adapter Contract Boundary

A1 must accept already scope-filtered chunks; organization, team, actor,
request, and collection context; CVF-selected policy and rule versions; and
injected clock and identifier dependencies for deterministic tests.

It must return approved context, terminal outcome, failure stage, packet,
decision, receipt, reference and distribution identifiers, an A2 evidence
projection, and an explicit injection decision.

Exact TypeScript names and configuration keys are A1 outputs. They are new
fields and must be classified `DOC_ONLY_NEW` in the A1 work order rather than
presented as existing source symbols.

## Rejected Alternatives

| Alternative | Disposition | Reason |
|---|---|---|
| Govern every user prompt through SOT3 | REJECT | instructions are not automatically source evidence |
| Evaluate provider output as the first use case | REJECT | this confuses output validation with source provenance |
| Put lifecycle logic directly in `route.ts` | REJECT | the file is 972 lines and the lifecycle needs a testable owner |
| Use `runThreeLayerScenario` as product policy owner | REJECT | it is scenario-shaped and completes a fixed test lifecycle |
| Activate every collection at once | REJECT | the first proof must stay controlled and bounded |
| Close from unit and package tests alone | REJECT | live governance claims require a real provider call |

## Activation Modes

The exact configuration key is not yet an existing source fact.

| Mode | Required behavior |
|---|---|
| `OFF` | preserve current retrieval behavior and make no SOT3 activation claim |
| `SHADOW` | evaluate and record evidence without changing provider context |
| `ENFORCE` | inject only Flow-approved context; never fall back to raw chunks after rejection |

The initial default is `OFF`. A3 and A5 must explicitly select `ENFORCE`.
Rollback is a configuration change, not code removal.

## Evidence And Failure Semantics

- Scope filtering is necessary but is not a truth decision.
- `READY_FOR_KERNEL` is structural eligibility, not truth.
- Only an eligible receipt may produce an active TruthReference.
- Flow must resolve that reference before delivery or consumption.
- Provider success is not evidence that the source was valid.
- In `ENFORCE`, adapter failure cannot fall back to raw retrieved context.
- A2 persistence failure must be visible; A3 cannot close without durable
  evidence.
- A rejected candidate normally allows provider execution without a knowledge
  block unless a later source-verified policy explicitly blocks the request.

## Claim Ladder

| State | Minimum evidence | Allowed claim |
|---|---|---|
| Current | package tests and deterministic vertical slice | `IMPLEMENTED_AND_INTEGRATION_PROVEN_LOCAL` |
| A1 | product adapter wired and locally tested | `PRODUCT_PATH_WIRED_LOCAL` |
| A2 | durable, replayable evidence chain | `OPERATIONAL_EVIDENCE_DURABLE_LOCAL` |
| A3 | one real-provider happy path in enforce mode | `LIVE_HAPPY_PATH_PROVEN_BOUNDED` |
| A4 | rejection, restart, and recovery cases | `LIVE_FAILURE_BOUNDARY_PROVEN_BOUNDED` |
| A5 | release bundle and manifest pass | `LIVE_GOVERNANCE_PROVEN_BOUNDED` |

No state proves user value, production scale, public readiness, or field
validation.

## Live Cost And Stop Control

- A0-A2 use no provider calls.
- A3 permits one planned call and one retry only after a secret-safe diagnostic.
- A4 rejection cases should assert zero provider calls; at most one recovery
  call is allowed after local negative proof.
- A5 runs the canonical release bundle once. A rerun requires a recorded
  diagnostic and a result-changing repair.
- Do not open prompt, model, or token tuning; this lane proves governance, not
  output parity.

## A0 Acceptance

- one representative seam selected and source-verified before provider use;
- layer ownership and the no-truth Refinery boundary preserved;
- route-size-safe adapter boundary defined;
- rollback, persistence, failure, cost, and claim boundaries explicit;
- A1-A5 form a dependency-ordered proof ladder;
- no runtime edit and no provider call performed.

Disposition: A0_PASS_BOUNDED

## Verification / Evidence

- source and symbol searches for the retrieval, prompt, provider, and SOT3
  package boundaries;
- physical line count for the execute route;
- package export and release-runner inspection;
- governed file-size and pre-implementation gate results recorded in the
  material commit workflow.

## Claim Boundary

A0 proves an architecture decision only. It does not prove an adapter,
restart durability, provider consumption, or readiness for real users.

## Current Evidence Pointer (2026-07-18)

EPISTEMIC_PROCESS_NA_WITH_REASON: this section adds a compact citation
pointer to already-accepted evidence; it does not assert a new empirical
prediction or perform a fresh evidence comparison itself.

This section adds a compact current-evidence pointer only. It does not
rewrite or supersede the A0 decision, ladder, or disposition above.

- The A1-A5 proof ladder is accepted bounded and closed at
  `docs/roadmaps/CVF_SOT3_ACTIVATION_AND_OPERATIONAL_PROOF_ROADMAP_2026-07-13.md`
  with claim `LIVE_GOVERNANCE_PROVEN_BOUNDED`.
- Four bounded catalog module owners now record the underlying Refinery,
  Truth Kernel, Truth Flow, and vertical-slice runtime as accepted review
  evidence: `cvf.asc.module.sot3_refinery_runtime.v1`,
  `cvf.asc.module.sot3_truth_kernel_runtime.v1`,
  `cvf.asc.module.sot3_truth_flow_runtime.v1`,
  `cvf.asc.module.sot3_three_layer_slice.v1` under
  `docs/reference/system_architecture_catalog/entries/`.
- One downstream application proof exists at
  `docs/reviews/CVF_SOT3_APP_T5_COMPLETION_REVIEW_2026-07-18.md`. It remains a
  single bounded product seam and is not a claim of universal SOT3 activation,
  provider/live guarantee, public export, or production readiness.
- This pointer does not turn the A0 local-proof rung into downstream
  application or universal proof; the Claim Ladder table above remains the
  authority for what each A-state proves.

## ADIF Defect Registry Disclosure

Query:
`python governance/compat/run_adif_defect_resolver.py --task-class architecture-design --role architect-reviewer --lifecycle-phase implementation --surface-selector sot-three-layer --risk-ceiling HIGH --max-results 20 --json`

Returned defectIds: none.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex architect/reviewer |
| Provider or surface | local private provenance repository |
| Session or invocation | SOT3-ACT-A0, 2026-07-13 |
| Working directory | repository root |
| Command or tool surface | governed reads, `rg`, line-count inspection, `apply_patch` |
| Target paths | this decision; parent roadmap; SOT3 reference front door |
| Allowed scope source | operator instruction to execute A0 and design A1-A5 |
| Before status evidence | local SOT3 integration existed without a product activation lane |
| After status evidence | product seam, ownership, modes, claim ladder, and dependencies are explicit |
| Diff evidence | material changed-set captured before commit |
| Approval boundary | A0 documentation only; A1 requires fresh GC-018 and work order |
| Claim boundary | architecture ratification, not runtime or live proof |
| Agent type | architect/reviewer |
| Invocation ID | `sot3-act-a0-2026-07-13` |
| Expected manifest | decision, roadmap, reference front door |
| Actual changed set | decision, roadmap, reference front door |
| Manifest delta | MATCH |
