# CVF Memory Foundation Reference Front Door

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-28

rawMemoryReleased=false

EPISTEMIC_PROCESS_NA_WITH_REASON: this is a documentation reference front door surface; it does not make empirical or evidence-based claims that require prediction, evidence comparison, or contradiction disposition.

## Purpose

Provide the stable CVF-owned front door for memory foundation contracts that
separate canonical source surfaces from generated aggregates, derived indexes,
retrieval receipts, and rebuild/replay behavior.

This folder was opened by EVEROS-T1 after the EVEROS-T0 external audit accepted
EverOS as a doctrine seed with runtime deferred.

## Scope / Target / Owner Boundary

Target: documentation contracts for source-of-truth, derived index, replay,
rebuild, retrieval receipt, privacy, and time-discipline boundaries.

Owner boundary: this folder is documentation authority only. It does not
implement a memory runtime, database, vector store, embedding pipeline,
watcher, daemon, provider call, public surface, adapter, or MPI-T6 runtime.

## Active References

| Reference | Role |
|---|---|
| `CVF_MEMORY_FOUNDATION_SOURCE_DERIVED_REPLAY_CONTRACT.md` | Canonical T1 contract for source surfaces, derived indexes, replay/rebuild, receipts, and timestamp discipline |
| `CVF_MEMORY_FOUNDATION_OWNER_SURFACE_RECONCILIATION_MATRIX.md` | T2 reconciliation matrix mapping the T1 contract to existing CVF memory owner surfaces, current guards, and future checker candidates |

## Existing CVF Owner Surfaces

| Existing surface | Relationship |
|---|---|
| `docs/reference/CVF_MEMORY_PLANE_MAP.md` | navigation map for current memory-facing surfaces and runtime status |
| `docs/reference/CVF_MEMORY_DERIVED_GRAPH_BOUNDARY_2026-06-01.md` | predecessor boundary for derived graph/retrieval views |
| `docs/reference/CVF_MLW1_GOVERNED_MEMORY_OPERATION_RECEIPT_MODEL_2026-06-05.md` | predecessor receipt model for governed memory operations |
| `docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md` | durable memory class routing for docs artifacts |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | External repo or copied folder |
| Chain map route | External repo or copied folder -> Root/folder lifecycle classification plus absorption map when retained -> CVF-owned reference contract -> ABSORB, ADAPT, DEFER, REJECT, or BLOCK |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | `docs/reference/memory_foundation/` |
| Disposition | ADAPT EverOS memory-foundation patterns into CVF-owned reference contract |
| Claim boundary | EverOS and the advisory package remain external inputs; this folder owns only adapted CVF documentation |

## Design Control Gate

Accepted design:

- preserve governed Markdown and source files as source authority;
- treat generated aggregates, indexes, semantic/vector views, graph views, and
  summaries as derived and rebuildable;
- require stale/degraded derived views to deny or warn before use;
- record receipt requirements for retrieval, rebuild, redaction, and denied
  memory access;
- keep UTC storage and display-time rendering separate for future memory/index
  artifacts.

Rejected design:

- EverOS runtime import or server activation;
- vector database or embedding implementation in T1;
- external package promotion as canonical authority;
- raw chat reuse as trusted memory;
- automatic skill promotion or self-evolving memory;
- public export of private provenance.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | `docs/reference/memory_foundation/` | agents may read this as a CVF reference contract but cannot treat it as runtime memory capability | EVEROS-T1 baseline, work order, and completion review | N/A with reason: internal documentation reference only | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future public-safe or adapter memory readout | no external adapter, MCP tool, CLI command, or public package behavior is created by EVEROS-T1 | this README records deferred external posture | separate GC-018/source-verified work order required before any adapter or public surface | `DEFERRED_WITH_REASON` |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: EVEROS-T1 is private provenance reference promotion. Public-safe memory
foundation wording requires a separate public-sync decision.

## Memory Claim Boundary Taxonomy

Future memory-facing governed artifacts must carry explicit claim boundaries by category. Authorized claim categories and their required substitutes:

| Claim category | Disallowed form | CVF-authorized substitute |
|---|---|---|
| Implementation claim | asserts SQLite, LanceDB, vector store, or embedding behavior exists or is active | doc-only contract field; runtime requires source-verified work order with live proof |
| Runtime claim | asserts memory retrieval, reinjection, or promotion operates at runtime | advisory notation only; any runtime behavior requires a live-proof work order |
| Scope expansion claim | widens role, workspace, project, or sensitivity boundary beyond source authority | explicit source-verified scope grant in a future governed artifact |
| Adapter claim | asserts MCP, CLI, or external adapter reads or writes memory without a separate GC-018 | deferred per MPI-T3 external-agent read contract |
| Raw memory release claim | asserts raw memory is released or that `can_reinject` is true without explicit policy change | `rawMemoryReleased=false` invariant; change requires source-verified policy update |

This taxonomy is a documentation reference only. It does not implement or activate any runtime boundary.

## Claim Boundary

This folder is a documentation reference surface only. It does not implement a
memory runtime, database, vector store, embedding/rerank path, watcher, daemon,
provider/live proof, public claim, adapter, package activation, certification,
generated aggregate, or MPI-T6 runtime.
