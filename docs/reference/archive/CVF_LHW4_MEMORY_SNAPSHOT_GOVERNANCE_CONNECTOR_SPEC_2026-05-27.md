# CVF LHW4-T1 Memory Snapshot Governance Connector Spec

docType: connector_spec

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-27

Contract version: `cvf.memorySnapshotGovernanceConnector.lhw4.t1.v1`

---

## Purpose

This connector defines the governed memory snapshot package standard: which
memory surfaces may contribute, which tiers are includable or blocked, and what
a snapshot receipt must contain to remain auditable.

It is not an AIF-B, AIF-C, M1, VI3, or H2 runtime extension. It is not a live
snapshot executor, automated scheduler, memory reinjection path, or receipt
envelope change.

`canReinject=false` and `rawMemoryReleased=false` are preserved from W2, VI3,
M1, and AIF-C boundaries. This connector does not relax either constraint. A
snapshot is a read-only packaging record; it does not grant reinjection
authority.

## Scope / Applies-To

Applies to future documentation, packet design, and implementation planning for
memory snapshot packaging across AIF-B graph references, AIF-C gateway
decisions, M1 durable memory receipts, VI3 capture records, and H2 memory tiers.

Does not apply to runtime provider calls, graph scoring authority, prompt
injection, raw memory export, hosted readiness, production readiness, or public
release readiness.

## S1 - Claim Boundary

The connector is normative for document design only. A future runtime snapshot
assembler must still implement and verify this contract before any live snapshot
claim can be made.

## S2 - Memory Surface Contribution Table

| Memory surface | Owner | Includable in snapshot? | Boundary rule | Current status |
| --- | --- | --- | --- | --- |
| AIF-B graph index | `GraphKnowledgeService` / `SymbolIndex` | Yes, as reference | Include `GraphQueryResult` or index reference only; no scoring authority | SOURCE_DEFINED; snapshot binding DOC_ONLY |
| AIF-C gateway retrieval result | `MemoryGatewayDecision.memoryIdsAffected` | Yes, summary-only | Include ids/summary; no raw item export | SOURCE_DEFINED; snapshot binding DOC_ONLY |
| M1 `skill` tier | `DurableMemoryReceipt` | Yes | Summary + evidence path only; no raw content | RUNTIME_PROVEN (M1 closed) |
| M1 `long-term` tier | `DurableMemoryReceipt` | Yes | Summary + evidence path only; no raw content | RUNTIME_PROVEN (M1 closed) |
| VI3 capture record | `AgentMemoryCaptureRecord.memoryIds` | Yes | IDs and capture decision only; no raw memory content | RUNTIME_PROVEN (VI3 closed) |
| H2 `working` / `task` tiers | `TIER_RUNTIME_RULES` | No | Ephemeral, same-task/in-process only; not persistent snapshot material | DOC_ONLY boundary |

## S3 - Snapshot Receipt Minimum Fields

Every governed memory snapshot receipt must contain:

- `snapshotId`: unique token.
- `snapshotActor`: `actorId` from producing gateway request or capture record.
- `includedTiers`: H2 tier tokens included in the snapshot.
- `captureDecision`: VI3 `AgentMemoryCaptureRecord.captureDecision` when VI3
  evidence contributes.
- `evidencePaths`: M1 or AIF-B evidence file paths included.
- `rawMemoryReleased`: always `false`.
- `canReinject`: always `false`.
- `snapshotBoundary`: one of `advisory_summary`, `evidence_path_only`, or
  `index_reference_only`.

These fields are documentation-only minimum requirements. They do not extend
`GovernanceEvidenceReceipt` or any existing receipt envelope type.

## S4 - Runtime-Enforcement Boundary Table

| Behavior | Current status | Future path |
| --- | --- | --- |
| AIF-B graph index query | Runtime (AIF-B LPF) | Stable |
| AIF-C gateway retrieval | Runtime (AIF-C LPF) | Stable |
| M1 durable memory read | Runtime (M1 LPF) | Stable |
| VI3 capture record readout | Runtime (cvf-web route) | Stable |
| Snapshot package composition | Document-only | Future: snapshot assembler service |
| Snapshot receipt validation | Document-only | Future: receipt field validator |
| Automated snapshot scheduling | Document-only | Future: governance scheduling surface |

## S5 - Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `GraphKnowledgeService` / `GraphQueryResult` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/schema/graph-schema.ts` | lines 50-69 | graph query/readout contract | AIF-B graph schema | ACCEPT |
| `SymbolIndex` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/index/symbol-index.ts` | lines 13-19, 77-100 | index and in-memory service | AIF-B symbol index | ACCEPT |
| `MemoryGatewayRequest.actorId` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | lines 25-38 | `actorId` | AIF-C memory gateway request | ACCEPT |
| `MemoryGatewayDecision.memoryIdsAffected` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | lines 40-50, 83 | `memoryIdsAffected` | AIF-C memory gateway decision | ACCEPT |
| `auditReceiptRequired`, `canReinject`, `rawMemoryReleased` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | lines 47-50, 83-88 | gateway decision invariants | AIF-C memory gateway | ACCEPT |
| `skill` / `long-term` durable tiers | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | lines 13, 113-115 | `DurableMemoryTier` | M1 durable memory store | ACCEPT |
| `DurableMemoryReceipt.memoryIds`, `summaryOnly`, `canReinject`, `rawMemoryReleased` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | lines 35-49, 169-175 | receipt fields | M1 durable memory receipt | ACCEPT |
| H2 tier values | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-tier-classifier.contract.ts` | lines 1-8, 23-30 | `working`, `task`, `skill`, `organizational`, `long-term`, `audit`, `receipt` | H2 memory tier classifier | ACCEPT |
| H2 tier reinjection and persistence rules | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/runtime-memory-hierarchy.ts` | lines 144-230 | `TIER_RUNTIME_RULES` | H2 runtime memory hierarchy | ACCEPT |
| `AgentMemoryCaptureRecord.captureDecision` / `memoryIds` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts` | lines 16-40, 232-233 | capture record fields | VI3 audit memory receipt | ACCEPT |

## Risk / Corrective Action

Risk: Readers may mistake this connector for a live snapshot feature.

Corrective action: All composition, validation, and scheduling rows are labeled
Document-only. Any future implementation must create a fresh roadmap and live
or source-level proof before claiming runtime snapshot behavior.

## Claim Boundary

This spec is a documentation-only connector standard. It does not prove runtime
snapshot assembly, snapshot receipt validation, automated scheduling, memory
reinjection, raw memory release, provider behavior, hosted readiness,
production readiness, public release readiness, or broad memory autonomy.
