# CVF MPI-T3 External Agent Memory Read Contract

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

## Purpose

Define the summary-only read-direction contract for future external-agent
consumers of CVF memory readout. This is the read-side counterpart to the
LSC-T6 external-agent signal IO contract. It gives future CLI/MCP adapter
authors a stable documentation boundary without implementing an adapter,
route, helper, schema validator, service-token bridge, provider call, public
surface, or runtime mutation.

`adapterContractOnly=true`.

## Scope

Applies to future adapter authors who need a source-verified mapping from an
external-agent memory read request to the existing memory readout route body,
and from the existing summary-only readout response to a portable external
readout shape.

Does not apply to current runtime implementation work, route edits, schema
changes, service-token handling, registry wiring, durable writes, provider/live
proof, public-sync, generated-state mutation, package activation, or DICE.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
| MPI-T3 is the external-agent memory read contract tranche | `docs/roadmaps/CVF_MPI_MEMORY_PLANE_INTEGRATION_ROADMAP_2026-06-21.md` | Work Plan row `MPI-T3` | `MPI-T3` | MPI roadmap | ACCEPT |
| Memory Plane map owns the memory-facing surface inventory | `docs/reference/CVF_MEMORY_PLANE_MAP.md` | Surface Inventory | `LPF Memory runtime readout route` | Memory Plane map | ACCEPT |
| Runtime route body owns request fields | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | interface declaration | `MemoryRuntimeReadoutBody` | Memory readout route | ACCEPT |
| Route validates required request body fields | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | `validateBody` | `validateBody` | Memory readout route | ACCEPT |
| Route allows service-token or session authentication | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | `POST` auth branch | `verifyServiceTokenRequest`; `verifySessionCookie` | Memory readout route | ACCEPT |
| Route returns summary-only response flags | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | response object | `rawMemoryReleased`; `canReinject` | Memory readout route | ACCEPT |
| Projection removes raw candidate content | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/memory-runtime-readout.ts` | `sanitizeCandidates` | `content` | memory runtime readout projection | ACCEPT |
| Projection returns fixed false raw-release and reinjection flags | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/memory-runtime-readout.ts` | projection object | `rawMemoryReleased`; `canReinject` | memory runtime readout projection | ACCEPT |
| LSC-T6 is contract-only for external CLI/MCP adapter authors | `docs/reference/learning_signal_chain/CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT.md` | Claim Boundary | `adapterContractOnly` | LSC-T6 reference contract | ACCEPT |
| MPI-T2 did not implement external-agent read behavior | `docs/reviews/CVF_MPI_T2_SCAN_REGISTRY_EPISODIC_READ_PROJECTION_COMPLETION_2026-06-22.md` | Risk / Corrective Action row | `MPI-T3` | MPI-T2 completion review | ACCEPT |

## External-Agent Read Request Mapping

`externalAgentMemoryReadRequest` is a documentation-only wrapper name. A future
adapter may map it to the existing route body only after a separate authorized
implementation tranche. This reference does not create a parser or schema.

| External documentation field | Existing source-verified field | Requirement | Boundary |
|---|---|---|---|
| `operationId` | `MemoryRuntimeReadoutBody.operationId` | required string | caller-supplied correlation only |
| `sessionId` | `MemoryRuntimeReadoutBody.sessionId` | required string | no raw session memory may be embedded |
| `projectId` | `MemoryRuntimeReadoutBody.projectId` | required string | project scoping token only |
| `actorId` | `MemoryRuntimeReadoutBody.actorId` | required string | caller identity token only |
| `actorRole` | `MemoryRuntimeReadoutBody.actorRole` | required allowed role | use source-verified route vocabulary only |
| `scope` | `MemoryRuntimeReadoutBody.scope` | required string | retrieval scope label only |
| `riskLevel` | `MemoryRuntimeReadoutBody.riskLevel` | required allowed risk level | use source-verified route vocabulary only |
| `query` | `MemoryRuntimeReadoutBody.query` | optional string | no raw secret or provider memory dump |
| `tokenBudget` | `MemoryRuntimeReadoutBody.tokenBudget` | optional number | advisory only |
| `policyDecision` | `MemoryRuntimeReadoutBody.policyDecision` | optional allowed policy | use source-verified route vocabulary only |
| `containsSensitiveData` | `MemoryRuntimeReadoutBody.containsSensitiveData` | optional boolean | route input metadata only |
| `maxResults` | `MemoryRuntimeReadoutBody.maxResults` | optional number | advisory only |
| `candidates` | `MemoryRuntimeReadoutBody.candidates` | required array | candidate `content` must not be exposed by readout |

## External-Agent Readout Mapping

`externalAgentMemoryReadout` is a documentation-only wrapper name. It maps to
the current response shape and projection invariants only.

| External documentation field | Existing source-verified field | Required invariant | Boundary |
|---|---|---|---|
| `success` | route response `success` | true for successful route response | no adapter success semantics created |
| `routeVersion` | route response `routeVersion` | current route constant value | informational only |
| `memoryRuntimeReadout` | route response `memoryRuntimeReadout` | summary-only projection | no raw candidate `content` |
| `rawMemoryReleased` | route response `rawMemoryReleased` | false | fixed false invariant |
| `canReinject` | route response `canReinject` | false | fixed false invariant |
| `selected` | projection `retrievalResult.selected` | sanitized candidate list | `content` omitted |
| `contextBlock` | projection `contextBlock` | summary-only if present | nested evidence keeps false flags |

## No-Readable-Memory Assertion

`externalAgentNoReadableMemoryAssertion` is a documentation-only response
pattern for future adapters that cannot obtain a readable memory result.

| Field | Disposition |
|---|---|
| `assertionType` | `NO_READABLE_MEMORY` |
| `reason` | no authorized summary-only memory readout is available |
| `rawMemoryReleased` | false |
| `canReinject` | false |
| `adapterContractOnly` | true |
| `nextAction` | use governed CVF source surfaces; do not infer from provider-local memory |

## Safety Invariants

| Invariant | Required value | Source basis | Consequence |
|---|---|---|---|
| Raw memory release | `rawMemoryReleased=false` | route and projection source | external agents must not receive raw memory content |
| Reinjection authority | `canReinject=false` | route and projection source | external agents must not reinsert readout into memory automatically |
| Candidate raw content | no exposed `content` field in selected projection | `sanitizeCandidates` | readout remains summary-only |
| RAW sentinel | no `RAW_MEMORY_CONTENT_MUST_NOT_LEAK` in serialized projection | route sentinel branch | runtime route fails closed if sentinel appears |
| Adapter status | `adapterContractOnly=true` | this contract and LSC-T6 analogy | no CLI/MCP adapter behavior exists |
| Registry status | no registry source or aggregate write | MPI-T2 closure and this contract | scan registry remains separate governed source |
| Durable store status | no durable write authority | Memory Plane map | durable memory write remains unwired/forbidden here |

## Dual Agent Surface Matrix

| Consumer class | Interface or surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this reference contract | may use for future work-order source verification | Source Verification Block | no adapter | ACTIVE_REFERENCE |
| `EXTERNAL_AGENT_CLI_MCP` | documentation-only external read shape | may not execute or call CVF through this contract | Request and Readout Mapping tables | `adapterContractOnly=true` | CONTRACT_ONLY |
| `FUTURE_ADAPTER_AUTHOR` | future separately authorized implementation tranche | must source-verify route fields again before code | this contract plus runtime source | separate GC-018 required | DEFERRED_WITH_REASON |

## External Knowledge Intake Routing

| Field | Disposition |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | Runtime/provider/MCP/readiness claim |
| Chain map route | operator continuation authorizes a CVF-owned contract-only read boundary; source facts remain verified against CVF-governed surfaces and runtime source |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | MPI-T3 reference contract |
| Disposition | ADAPT as bounded CVF-owned reference contract |
| Claim boundary | no external prompt is source proof; no runtime, adapter, provider/live, public, registry, route, or generated-state mutation is authorized |

## Parking Ledger

| Lane | Status after MPI-T3 | Relationship |
|---|---|---|
| CLI/MCP adapter implementation | not started | requires separate GC-018 and source-verified work order |
| Memory readout route schema change | not started | requires separate runtime/source tranche |
| Service-token bridge or credential flow | not started | requires separate security review and runtime authorization |
| Scan-registry automatic route wiring | not started | MPI-T2 helper remains not route-wired |
| Durable memory write or reinjection | not started | forbidden by this contract |
| MPI-T4 federated read helper | optional parked | may be selected only through a fresh governed tranche |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference contract. No public-sync remote, public
commit, public artifact path, or public claim is authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | MPI-T3 external-agent memory read contract reference |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE |
| receiptEvidence | CVF_RECEIPT_PRESENT: source verification rows, mapping tables, completion review, and gate output |
| actionEvidence | ACTION_EVIDENCE_PRESENT: reference contract created and navigation surfaces updated |
| invocationBoundary | local source reads, governed markdown edits, local governance gates |
| interceptionBoundary | no IDE/shell/git/filesystem/provider/CLI/MCP interception claim |
| claimLanguage | contract-only external-agent memory read boundary |
| forbiddenExpansion | no route edit, runtime schema change, service-token bridge, CLI/MCP adapter, helper implementation, registry write, durable write, provider/live proof, public-sync, generated-state mutation, queue/daemon, watcher, readiness, or universal control claim |

## Agent Operation Trace Block

| Field | Disposition |
|---|---|
| Actor | Codex |
| Provider or surface | Codex local workspace |
| Session or invocation | `mpi-t3-external-agent-memory-read-contract-2026-06-27` |
| Working directory | repository root |
| Command or tool surface | PowerShell, rg, git, apply_patch, python governance gates |
| Target paths | `docs/reference/CVF_MPI_T3_EXTERNAL_AGENT_MEMORY_READ_CONTRACT.md` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_MPI_T3_EXTERNAL_AGENT_MEMORY_READ_CONTRACT_FOR_CODEX_2026-06-27.md` |
| Before status evidence | HEAD `eeb0e532`; clean worktree at startup |
| After status evidence | material closure verified by pre-dispatch/pre-implementation gates; post-commit pre-closure required for finality |
| Diff evidence | `git diff --name-status eeb0e532..HEAD` |
| Approval boundary | contract-only MPI-T3 execution |
| Claim boundary | no runtime, route, helper, adapter, provider/live, public-sync, registry, durable-write, package, resolver, DICE, or generated-state mutation |
| Agent type | Codex dispatcher/implementer/reviewer/closer |
| Invocation ID | `mpi-t3-external-agent-memory-read-contract-2026-06-27` |
| Expected manifest | this reference contract plus MPI navigation updates |
| Actual changed set | this reference contract plus MPI navigation updates |
| Manifest delta | MATCH |

## Acceptance Receipt Assertion Matrix

| Assertion | Evidence | Status |
|---|---|---|
| External request fields map only to existing route fields | Request Mapping table and Source Verification Block | PASS |
| External readout fields map only to existing response/projection fields | External-Agent Readout Mapping table | PASS |
| Raw release remains false | Safety Invariants | PASS |
| Reinjection remains false | Safety Invariants | PASS |
| Adapter remains contract-only | `adapterContractOnly=true` and Parking Ledger | PASS |
| No public export is claimed | Public Export Disposition | PASS |

## Claim Boundary

This reference defines a documentation-only external-agent memory read contract.
It does not implement, modify, or authorize any runtime route, request schema,
response schema, service-token bridge, CLI/MCP adapter, MCP tool, shell bridge,
IDE bridge, queue, daemon, watcher, helper, registry write, durable memory
write, provider/live proof, public-sync, generated-state mutation, package
activation, resolver mutation, DICE work, push, or release-readiness claim.
