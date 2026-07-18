# CVF MLW3 Evidence-To-Truth Learning Signal Pipeline

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference_contract

Date: 2026-06-05

contractVersion: `cvf.mlw3.evidenceToTruthLearningSignalPipeline.v1`

## Purpose

Define how governed execution, audit, context, and memory receipts become
truth/evaluation/reputation candidates and then learning proposals routed into
the existing Learning Signal Intake Bridge.

## Scope / Applies-To

Applies to future learning proposal workflows that need evidence-backed signal
normalization. It does not authorize learning orchestration, runtime truth
mutation, model tuning, prompt mutation, or autonomous policy changes.

## Authority Chain

| Authority | Evidence | Disposition |
| --- | --- | --- |
| MLW0 source map | MLW3 owner rows and blocked orchestrator/task rows | ACCEPT |
| CI1-T11 roadmap | MLW3 tranche row | ACCEPT |
| T11A packet | truth/evaluation/reputation/adaptation input | ACCEPT |
| T11D packet | audit and execution evidence input | ACCEPT |
| MLW1 contract | memory operation receipt references | ACCEPT |
| MLW2 contract | deterministic context bundle references | ACCEPT |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Learning signal intake exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts` | MLW0 owner row | `LearningSignalIntakeRecord` | LPF intake bridge | EXISTS | ACCEPT |
| Finding-to-learning bridge exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/finding-to-learning-bridge.ts` | MLW0 owner row | `FindingToLearningRecord` | cvf-web finding bridge | EXISTS | ACCEPT |
| Truth model exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/truth.model.contract.ts` | MLW0 owner row | `TruthModelContract` | LPF truth model | EXISTS | ACCEPT |
| Truth score exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/truth.score.contract.ts` | MLW0 owner row | `TruthScoreContract` | LPF truth score | EXISTS | ACCEPT |
| Evaluation engine exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/evaluation.engine.contract.ts` | MLW0 owner row | `EvaluationEngineContract` | LPF evaluation | EXISTS | ACCEPT |
| Reputation signal exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/reputation.signal.contract.ts` | MLW0 owner row | `ReputationSignalContract` | LPF reputation | EXISTS | ACCEPT |
| Audit memory receipt exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` | MLW0 owner row | `AuditMemoryReceipt` | cvf-web audit memory receipt | EXISTS | ACCEPT |
| LearningOrchestrator is not current source | `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md` | legacy row T11A/LearningOrchestrator | `BLOCKED_NO_SOURCE_FOUND` | MLW0 source map | VALUE_SET | ACCEPT |
| TaskSchema is not equivalent current source | `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md` | legacy row T11A/TaskSchema | `BLOCKED_NO_SOURCE_FOUND` | MLW0 source map | VALUE_SET | ACCEPT |

## New Doc-Only Fields

| Field | Type | Purpose | Runtime status |
| --- | --- | --- | --- |
| `signalId` | string | stable learning signal ID | DOC_ONLY_NEW |
| `evidenceReceiptRefs` | array | upstream receipt IDs from MLW1/MLW2/audit/execution | DOC_ONLY_NEW |
| `truthCandidate` | object | candidate truth model input | DOC_ONLY_NEW |
| `evaluationCandidate` | object | candidate evaluation input | DOC_ONLY_NEW |
| `reputationCandidate` | object | candidate reputation input | DOC_ONLY_NEW |
| `proposalAction` | enum | `NOOP`, `REVIEW`, `SIMULATE`, `ESCALATE` | DOC_ONLY_NEW |
| `autonomousMutationAuthorized` | boolean | must be false | DOC_ONLY_NEW |

## Workflow

1. Collect governed receipt references only.
2. Normalize evidence into truth, evaluation, and reputation candidates.
3. Require MLW2 context bundle reference for retrieval-backed evidence.
4. Mark all outputs as proposal-only.
5. Route proposal to Learning Signal Intake Bridge or Finding-to-Learning
   bridge.
6. Send high-risk proposals to MLW6 before any promotion decision.

## Failure Modes

| Failure | Disposition |
| --- | --- |
| Missing governed receipt reference | BLOCK_SIGNAL |
| Raw output or raw memory supplied | BLOCK_SIGNAL |
| Context bundle missing for retrieval-backed evidence | BLOCK_SIGNAL |
| Candidate conflicts with source authority | ESCALATE |
| Autonomous mutation requested | BLOCK_SIGNAL |

## Test / Checker Plan

Future implementation should test receipt-only input, no raw memory/output,
context bundle requirement, proposal-only output, and
`autonomousMutationAuthorized=false`.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| Learning orchestrator name is not current source | RUNTIME_SIGNAL_GAP | RUNTIME_BEHAVIOR_LEARNING | DESIGN_REVIEW_REQUIRED | future orchestrator must be explicitly authored, not inferred |
| Learning must propose, not mutate | RULE_GAP | GOVERNANCE_CONTROL_PLANE | RULE_ADDED | all MLW3 outputs remain proposal-only |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: MLW3 is private contract work and does not expose public learning
behavior.

## Claim Boundary

MLW3 defines signal normalization and proposal routing only. It does not prove
learning runtime behavior, model calibration quality, live provider behavior, or
autonomous mutation safety.
