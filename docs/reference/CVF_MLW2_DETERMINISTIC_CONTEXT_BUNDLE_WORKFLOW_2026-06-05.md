# CVF MLW2 Deterministic Context Bundle Workflow

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference_contract

Date: 2026-06-05

contractVersion: `cvf.mlw2.deterministicContextBundleWorkflow.v1`

## Purpose

Define a deterministic context bundle workflow that combines source mapping,
retrieval, memory context packaging, token budget, cache boundary, and failure
modes without claiming a current `RAGRouter` or `ContextFusionPipeline` runtime
symbol.

## Scope / Applies-To

Applies to future retrieval-backed execution, memory context packaging, and
context governance work. It is contract-only and does not change route behavior
or prompt construction.

## Authority Chain

| Authority | Evidence | Disposition |
| --- | --- | --- |
| MLW0 source map | MLW2 owner rows and blocked router/fusion rows | ACCEPT |
| CI1-T11 roadmap | MLW2 tranche row | ACCEPT |
| T11C packet | RAG/context/control workflow input | ACCEPT |
| T11B packet | memory context and reinjection boundary | ACCEPT |
| Work order | MLW1-MLW6 core work order | ACCEPT |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Context budget source exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/context-budget-policy.ts` | MLW0 owner row | `ContextBudgetPolicy` | LPF context budget policy | EXISTS | ACCEPT |
| Context budget guard exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/context-budget-guard.ts` | MLW0 owner row | `checkContextBudgetGuard` | LPF context budget guard | EXISTS | ACCEPT |
| Memory context packager exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts` | MLW0 owner row | `MemoryContextBlock` | memory context packager | EXISTS | ACCEPT |
| Knowledge retrieval exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/knowledge-retrieval.ts` | MLW0 owner row | `KnowledgeQueryResult` | cvf-web knowledge retrieval | EXISTS | ACCEPT |
| Knowledge context injector exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/knowledge-context-injector.ts` | MLW0 owner row | `buildKnowledgeSystemPrompt` | cvf-web knowledge context injection | EXISTS | ACCEPT |
| Knowledge store exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/knowledge-store.ts` | MLW0 owner row | `KnowledgeStore` | cvf-web knowledge store | EXISTS | ACCEPT |
| Route request context profile exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/route-request-context-readout.ts` | MLW0 owner row | `RouteRequestContextProfile` | route request context readout | EXISTS | ACCEPT |
| Knowledge graph storage exists | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/` | MLW0 owner row | `knowledge/graph/` | LPF knowledge graph | EXISTS | ACCEPT |
| RAGRouter is not current source | `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md` | legacy row T11C/RAGRouter | `BLOCKED_NO_SOURCE_FOUND` | MLW0 source map | VALUE_SET | ACCEPT |
| ContextFusionPipeline is not current source | `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md` | legacy row T11C/ContextFusionPipeline | `BLOCKED_NO_SOURCE_FOUND` | MLW0 source map | VALUE_SET | ACCEPT |

## New Doc-Only Fields

| Field | Type | Purpose | Runtime status |
| --- | --- | --- | --- |
| `bundleId` | string | deterministic ID for a context bundle | DOC_ONLY_NEW |
| `sourceMap` | array | ordered source pointers with authority class | DOC_ONLY_NEW |
| `retrievalTrace` | array | retrieval query/result references | DOC_ONLY_NEW |
| `memoryContextRefs` | array | MLW1 memory operation receipt references | DOC_ONLY_NEW |
| `tokenBudgetDecision` | object | budget status and reason | DOC_ONLY_NEW |
| `cacheBoundary` | enum | `STATIC_ONLY`, `PROFILE_CACHE_ALLOWED`, `DYNAMIC_REBUILD_REQUIRED` | DOC_ONLY_NEW |
| `bundleHash` | string | deterministic hash over ordered governed metadata | DOC_ONLY_NEW |
| `redTeamCaseRefs` | array | required adversarial cases | DOC_ONLY_NEW |

## Workflow

1. Resolve task and context profile.
2. Run retrieval only through governed knowledge sources.
3. Attach memory context only through MLW1 receipt references.
4. Apply token budget decision before prompt or context use.
5. Build source map in deterministic order.
6. Compute bundle hash from non-raw metadata.
7. Reject raw retrieval or raw memory injection.

## Failure Modes

| Failure | Disposition |
| --- | --- |
| Source authority missing | BLOCK_BUNDLE |
| Retrieval result lacks evidence pointer | BLOCK_BUNDLE |
| Token budget exceeded without compression rule | ESCALATE |
| Cache boundary ambiguous | REBUILD_REQUIRED |
| Raw memory or raw retrieval requested | BLOCK_BUNDLE |
| Bundle hash drift | BLOCK_BUNDLE |

## Red-Team Cases

| Case | Expected result |
| --- | --- |
| Retrieval source without authority | BLOCK_BUNDLE |
| Conflicting source priorities | ESCALATE |
| Memory context without MLW1 receipt | BLOCK_BUNDLE |
| Prompt asks for raw memory dump | BLOCK_BUNDLE |
| Cached context stale after source-map change | REBUILD_REQUIRED |

## Test / Checker Plan

Future runtime implementation should test deterministic source ordering,
bundle hash stability, raw-injection denial, token-budget enforcement, cache
boundary handling, and source authority rejection.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| Router/fusion legacy names are not current runtime symbols | RUNTIME_SIGNAL_GAP | RUNTIME_BEHAVIOR_LEARNING | RULE_ADDED | use MLW2 doc-only bundle contract until runtime owner is implemented |
| Context workflow is required before safe memory use | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | future checker should require bundle hash and source map for retrieval-backed execution |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: MLW2 is private contract work and does not add public-ready runtime
retrieval or memory behavior.

## Claim Boundary

MLW2 defines a deterministic context bundle contract only. It does not implement
RAG routing, context fusion runtime, live provider proof, public search, or
production retrieval.
