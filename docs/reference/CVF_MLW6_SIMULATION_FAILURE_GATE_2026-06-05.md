# CVF MLW6 Simulation And Failure Gate

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference_contract

Date: 2026-06-05

contractVersion: `cvf.mlw6.simulationFailureGate.v1`

## Purpose

Define the simulation and failure gate for high-risk learning, trust,
adaptation, and policy candidates before any promotion decision.

## Scope / Applies-To

Applies to future learning proposal validation and failure scenario testing. It
is contract-only and does not run live provider simulations or promote policy.

## Authority Chain

| Authority | Evidence | Disposition |
| --- | --- | --- |
| MLW0 source map | MLW6 simulation/failure rows | ACCEPT |
| CI1-T11 roadmap | MLW6 tranche row | ACCEPT |
| T11A packet | simulation/failure/adaptation input | ACCEPT |
| T11D packet | execution and audit failure input | ACCEPT |
| MLW3 contract | candidate update path | ACCEPT |
| MLW5 contract | high-risk audit feedback routing | ACCEPT |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Simulation environment exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/simulation-environment.ts` | MLW0 owner row | `runSimulation` | LPF simulation environment | EXISTS | ACCEPT |
| Simulation scenario source exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/simulation-environment.ts` | MLW0 owner row | `SimulationScenario` | LPF simulation environment | EXISTS | ACCEPT |
| Evaluation engine exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/evaluation.engine.contract.ts` | MLW0 owner row | `EvaluationEngineContract` | LPF evaluation | EXISTS | ACCEPT |
| Truth update source exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/truth.model.update.contract.ts` | MLW0 owner row | `TruthModelUpdateContract` | LPF truth update | EXISTS | ACCEPT |
| Adaptation policy exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/adaptation-policy-engine.ts` | MLW0 owner row | `checkAdaptationPolicy` | LPF adaptation policy | EXISTS | ACCEPT |
| Pattern drift source exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/pattern.drift.contract.ts` | MLW0 owner row | `PatternDriftSignal` | LPF pattern drift | EXISTS | ACCEPT |
| FailureAnalysis is not current source | `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md` | legacy row T11A/FailureAnalysis | `BLOCKED_NO_SOURCE_FOUND` | MLW0 source map | VALUE_SET | ACCEPT |

## New Doc-Only Fields

| Field | Type | Purpose | Runtime status |
| --- | --- | --- | --- |
| `simulationGateId` | string | stable gate evaluation ID | DOC_ONLY_NEW |
| `candidateRef` | string | MLW3 or MLW5 candidate reference | DOC_ONLY_NEW |
| `scenarioSetId` | string | failure scenario set ID | DOC_ONLY_NEW |
| `minimumPassThreshold` | number | required scenario pass threshold | DOC_ONLY_NEW |
| `criticalFailureCount` | number | critical failures observed | DOC_ONLY_NEW |
| `rollbackPlanRef` | string | rollback evidence pointer | DOC_ONLY_NEW |
| `promotionVerdict` | enum | `BLOCK`, `DEFER`, `ESCALATE`, `RECOMMEND_REVIEW` | DOC_ONLY_NEW |

## Scenario Set

| Scenario | Required result |
| --- | --- |
| Missing evidence candidate | BLOCK |
| Candidate bypasses context bundle | BLOCK |
| Candidate requests direct mutation | BLOCK |
| Conflicting audit and truth signals | ESCALATE |
| Rollback path absent | BLOCK |
| Evaluation confidence below threshold | DEFER |
| Pattern drift detected | ESCALATE |

## Workflow

1. Receive candidate from MLW3 or MLW5.
2. Verify governed evidence and rollback references.
3. Run scenario set through simulation environment when runtime work is later
   authorized.
4. Evaluate threshold and critical failures.
5. Emit promotion verdict.
6. Never promote automatically.

## Failure Modes

| Failure | Disposition |
| --- | --- |
| Candidate lacks evidence reference | BLOCK |
| Candidate lacks rollback plan | BLOCK |
| Critical scenario fails | BLOCK |
| Threshold not met | DEFER |
| Conflicting evaluator signals | ESCALATE |

## Test / Checker Plan

Future implementation should test critical failure blocking, threshold
calculation, rollback-plan requirement, conflicting-signal escalation, and no
automatic promotion.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| FailureAnalysis exact owner is missing | RUNTIME_SIGNAL_GAP | RUNTIME_BEHAVIOR_LEARNING | RULE_ADDED | MLW6 defines doc-only scenario taxonomy pending runtime owner |
| High-risk learning update requires simulation before promotion | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | future checker should require scenario results and rollback plan |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: MLW6 is private simulation/failure contract work and does not prove
runtime simulation or live governance behavior.

## Claim Boundary

MLW6 defines simulation and failure gate requirements only. It does not run
live simulations, implement failure analysis runtime, promote policy, or prove
production readiness.
