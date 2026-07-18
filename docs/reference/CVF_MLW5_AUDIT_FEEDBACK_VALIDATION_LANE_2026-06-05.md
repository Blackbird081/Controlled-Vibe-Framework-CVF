# CVF MLW5 Audit Feedback Validation Lane

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference_contract

Date: 2026-06-05

contractVersion: `cvf.mlw5.auditFeedbackValidationLane.v1`

## Purpose

Define a validation lane that routes audit, gate, trust, and reviewer feedback
into learning proposals without direct policy, prompt, provider, or memory
mutation.

## Scope / Applies-To

Applies to future audit-feedback-to-learning work. It is contract-only and
does not change audit receipt runtime behavior or trust calibration source.

## Authority Chain

| Authority | Evidence | Disposition |
| --- | --- | --- |
| MLW0 source map | MLW5 audit/trust rows | ACCEPT |
| CI1-T11 roadmap | MLW5 tranche row | ACCEPT |
| T11D packet | audit feedback and planner trace input | ACCEPT |
| T11A packet | reputation/adaptation/trust input | ACCEPT |
| MLW3 contract | proposal-only signal pipeline | ACCEPT |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Audit memory receipt exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` | MLW0 owner row | `AuditMemoryReceipt` | cvf-web audit memory receipt | EXISTS | ACCEPT |
| Audit memory capture exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` | MLW0 owner row | `buildRouteAuditMemoryCapture` | cvf-web audit memory receipt | EXISTS | ACCEPT |
| Finding-to-learning bridge exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/finding-to-learning-bridge.ts` | MLW0 owner row | `FindingToLearningRecord` | cvf-web finding bridge | EXISTS | ACCEPT |
| Reputation signal exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/reputation.signal.contract.ts` | MLW0 owner row | `ReputationSignal` | LPF reputation signal | EXISTS | ACCEPT |
| Adaptation policy exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/adaptation-policy-engine.ts` | MLW0 owner row | `checkAdaptationPolicy` | LPF adaptation policy | EXISTS | ACCEPT |
| AuditCouncilFeedback is renamed/gapped | `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md` | legacy row T11D/AuditCouncilFeedback | `ACCEPT_RENAMED_WITH_GAP` | MLW0 source map | VALUE_SET | ACCEPT |
| TrustCalibrationRecord is renamed/gapped | `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md` | legacy row T11D/TrustCalibrationRecord | `ACCEPT_RENAMED_WITH_GAP` | MLW0 source map | VALUE_SET | ACCEPT |
| W7DecisionRecord is not runtime source | `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md` | legacy row T11D/W7DecisionRecord | `BLOCKED_NO_RUNTIME_SOURCE` | MLW0 source map | VALUE_SET | ACCEPT |

## New Doc-Only Fields

| Field | Type | Purpose | Runtime status |
| --- | --- | --- | --- |
| `auditFeedbackId` | string | stable audit feedback ID | DOC_ONLY_NEW |
| `feedbackSource` | enum | `AUDIT`, `REVIEW`, `GATE`, `TRUST`, `OPERATOR` | DOC_ONLY_NEW |
| `evidenceReceiptRefs` | array | governed evidence pointers | DOC_ONLY_NEW |
| `trustCalibrationCandidate` | object | proposal-only trust adjustment candidate | DOC_ONLY_NEW |
| `policyCandidate` | object | proposal-only policy candidate | DOC_ONLY_NEW |
| `rollbackCriteria` | array | rollback triggers required before promotion | DOC_ONLY_NEW |
| `requiresSimulation` | boolean | high-risk proposals must go to MLW6 | DOC_ONLY_NEW |
| `mutationAuthorized` | boolean | must be false | DOC_ONLY_NEW |

## Workflow

1. Accept only audit or review feedback with governed evidence references.
2. Normalize trust and policy candidates as proposals.
3. Apply adaptation policy preflight for risk and authority.
4. Require rollback criteria for any promotion candidate.
5. Send high-risk candidates to MLW6 simulation.
6. Keep `mutationAuthorized=false`.

## Failure Modes

| Failure | Disposition |
| --- | --- |
| Feedback lacks evidence receipt | BLOCK_FEEDBACK |
| Feedback requests direct policy mutation | BLOCK_FEEDBACK |
| Trust candidate lacks reputation source | ESCALATE |
| Rollback criteria missing | BLOCK_PROMOTION |
| High-risk candidate bypasses MLW6 | BLOCK_PROMOTION |

## Test / Checker Plan

Future implementation should test evidence-required feedback, direct mutation
rejection, rollback criteria requirement, high-risk MLW6 routing, and
`mutationAuthorized=false`.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| Audit feedback exists as bridge/receipt pieces, not audit council runtime | RULE_GAP | GOVERNANCE_CONTROL_PLANE | RULE_ADDED | MLW5 defines proposal-only audit lane |
| Trust calibration must not mutate policy directly | RUNTIME_BEHAVIOR_LEARNING | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | future checker should block direct mutation in feedback artifacts |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: MLW5 is private audit-feedback contract work and does not export public
trust or policy mutation claims.

## Claim Boundary

MLW5 defines audit feedback validation requirements only. It does not implement
trust calibration runtime, policy mutation, live governance proof, or autonomous
learning.
