# CVF MLW1 Governed Memory Operation Receipt Model

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference_contract

Date: 2026-06-05

contractVersion: `cvf.mlw1.governedMemoryOperationReceiptModel.v1`

## Purpose

Define the governed memory operation receipt model for capture, retrieval,
context packaging, lifecycle, privacy, reinjection denial, provenance, and
receipt evidence.

MLW1 is contract-only. It does not implement a new durable backend or authorize
runtime memory writes.

## Scope / Applies-To

Applies to future memory runtime, memory route, receipt, and learning-workflow
work that needs a source-verified memory operation contract.

It does not apply as live proof, public product claim, backend selection, or
autonomous mutation permission.

## Authority Chain

| Authority | Evidence | Disposition |
| --- | --- | --- |
| MLW0 source map | `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md` rows MLW1 | ACCEPT |
| CI1-T11 roadmap | MLW1 tranche row | ACCEPT |
| T11B packet | governed memory and knowledge-store controls | ACCEPT |
| T10 packet | cortex-hub external memory boundary | ACCEPT_WITH_BOUNDARY |
| Work order | `docs/work_orders/CVF_WO_MLW1_MLW6_MEMORY_LEARNING_CORE_WORKFLOW_CHAIN_2026-06-05.md` | ACCEPT |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Controlled memory record source exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.gateway.contract.ts` | MLW0 owner row | `ControlledMemoryRecord` | controlled memory gateway contract | EXISTS | ACCEPT |
| Controlled memory receipt source exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.gateway.contract.ts` | MLW0 owner row | `ControlledMemoryReceipt` | controlled memory gateway contract | EXISTS | ACCEPT |
| Runtime memory decision source exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | MLW0 owner row | `MemoryGatewayDecision` | runtime memory gate | EXISTS | ACCEPT |
| Durable memory source exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | MLW0 owner row | `DurableMemoryRecord` | durable memory store | EXISTS | ACCEPT |
| Lifecycle transition source exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-lifecycle-policy.ts` | MLW0 owner row | `evaluateLifecycleTransition` | memory lifecycle policy | EXISTS | ACCEPT |
| Retrieval attribution source exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-attribution.ts` | MLW0 owner row | `buildRetrievalAttribution` | memory retrieval attribution | EXISTS | ACCEPT |
| Memory context packager source exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts` | MLW0 owner row | `packageMemoryContext` | memory context packager | EXISTS | ACCEPT |
| Memory runtime workflow source exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-runtime-workflow-chain.ts` | MLW0 owner row | `runMemoryRuntimeWorkflowChain` | memory runtime workflow | EXISTS | ACCEPT |
| Memory write route exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/write/route.ts` | MLW0 owner row | `MemoryDurableWriteBody` | memory write route | EXISTS | ACCEPT |
| W7MemoryRecord is not runtime source | `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md` | legacy row T11D/W7MemoryRecord | `BLOCKED_NO_RUNTIME_SOURCE` | MLW0 source map | VALUE_SET | ACCEPT |

## New Doc-Only Fields

| Field | Type | Purpose | Runtime status |
| --- | --- | --- | --- |
| `operationId` | string | stable ID for one memory operation | DOC_ONLY_NEW |
| `operationKind` | enum | `CAPTURE`, `RETRIEVE`, `PACKAGE`, `LIFECYCLE_TRANSITION`, `PRIVACY_FILTER`, `REINJECTION_DENIAL` | DOC_ONLY_NEW |
| `sourceReceiptId` | string | upstream execution or audit receipt reference | DOC_ONLY_NEW |
| `policySnapshotRef` | string | policy snapshot reference used for the operation | DOC_ONLY_NEW |
| `privacyReportRef` | string | privacy filter report pointer | DOC_ONLY_NEW |
| `lifecycleStateBefore` | string | state before transition | DOC_ONLY_NEW |
| `lifecycleStateAfter` | string | state after transition | DOC_ONLY_NEW |
| `provenanceHash` | string | deterministic hash of governed non-raw receipt metadata | DOC_ONLY_NEW |
| `canReinject` | boolean | must remain false unless a later runtime contract proves otherwise | DOC_ONLY_NEW |
| `learningProposalEligible` | boolean | permits proposal routing, not mutation | DOC_ONLY_NEW |

## Contract Model

The governed memory operation receipt must preserve:

- observation before permission;
- receipt metadata before memory use;
- privacy report before context packaging;
- lifecycle decision before durable write;
- provenance hash before learning proposal;
- reinjection denial by default.

Required invariant: `canReinject=false` for all MLW1 contract examples. This is
a contract invariant only; runtime source proof remains the current MLW0
sources until a future runtime work order changes source.

## Workflow

1. Accept an upstream receipt reference.
2. Evaluate memory gate using current controlled memory gateway concepts.
3. Apply privacy filtering and record privacy report reference.
4. Resolve lifecycle transition.
5. Build retrieval attribution or context packaging evidence when requested.
6. Emit governed receipt metadata.
7. Route only proposal-eligible output to MLW3.

## Failure Modes

| Failure | Disposition |
| --- | --- |
| Missing upstream receipt reference | BLOCK_OPERATION |
| Missing policy snapshot reference | BLOCK_OPERATION |
| Privacy report absent | BLOCK_OPERATION |
| Lifecycle transition unresolved | BLOCK_OPERATION |
| Raw memory requested for reinjection | BLOCK_OPERATION |
| Backend unavailable | DEFER_OPERATION |

## Test / Checker Plan

Future runtime implementation should add focused tests for:

- receipt hash stability;
- privacy report required before package;
- lifecycle transition required before durable write;
- raw reinjection denied;
- missing upstream receipt blocks operation;
- learning proposal emitted without mutation.

Checker candidate: ensure future MLW1 runtime receipt examples keep
`canReinject=false` unless a later operator-authorized runtime contract changes
the invariant.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| Legacy `MemoryAccessRecord` and `MemoryProvenanceChain` are not current source symbols | RUNTIME_SIGNAL_GAP | RUNTIME_BEHAVIOR_LEARNING | RULE_ADDED | use doc-only fields until runtime implementation source-verifies them |
| Durable backend choice remains unresolved | OPERATOR_SCOPE_CLARITY_GAP | GOVERNANCE_CONTROL_PLANE | DEFERRED_WITH_BOUNDARY | open separate backend work order if runtime durability is required |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: MLW1 is a private provenance contract derived from private source
verification and legacy scan packets.

## Claim Boundary

MLW1 defines a contract model only. It does not implement durable storage,
runtime memory writes, public memory features, live governance proof, or
autonomous memory mutation.
