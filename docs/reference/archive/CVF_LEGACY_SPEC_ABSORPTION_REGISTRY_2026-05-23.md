# CVF Legacy Spec Absorption Registry

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-05-23

Owner: CVF governance/session-continuity surface

---

## Purpose

Prevent legacy specifications in `.private_reference/legacy/` from being
forgotten during future audits, GC-018 packets, roadmaps, or tranche scoping.

This registry exists because the Review-CVF pain-point chain scoped work from
active reviews and runtime surfaces but did not reliably reconcile older source
specs, archived absorption evidence, and current product gaps.

---

## Scope / Applies-To

Applies to:

- `.private_reference/legacy/` source folders;
- Review-CVF pain-point audits and successor tranches;
- GC-018 packets that touch memory, graph knowledge, context building,
  operational intelligence, or external-knowledge absorption;
- future correction or closure claims involving `CVF 16.5`, `CVF 17.05`,
  `CVF ADD`, or `CVF Edit`.

Does not apply to:

- ordinary bug fixes with no legacy-source dependency;
- pure UI/static checks that make no governance or absorption claim;
- implementation authorization by itself.

---

## Scope / Target / Owner Boundary

Target:

- active routing and audit control for legacy-source absorption status.

Owner:

- CVF governance/session-continuity surface.

Boundary:

- This registry summarizes current known status from existing evidence.
- It is not a substitute for reading source specs during a future tranche.
- `untriaged_active_source` means "must scan before claiming," not "approved."
- `runtime-owned` means a CVF owner surface exists, not that full product
  readiness or live governance behavior is proven.

---

## Required Use

Any future tranche that touches memory, graph knowledge, context building,
operational intelligence, Review-CVF pain points, or external-knowledge
absorption must:

1. Read this registry.
2. List the relevant `.private_reference/legacy/` folders it scanned.
3. Declare which source specs are absorbed, partially absorbed, deferred, or
   out of scope.
4. Cite the current owner surface or explain why none exists.
5. Add a Legacy Spec Scan Block to the GC-018 packet.

Failure to do this repeats the 2026-05-23 blindspot.

---

## Status Vocabulary

| Status | Meaning |
| --- | --- |
| `runtime-owned` | A CVF owner surface and tests exist, but product-path use may still be bounded. |
| `CLOSED_PASS_BOUNDED` | A successor tranche closed for the named bounded scope, with later expansions still gated. |
| `partially_absorbed` | Some concepts exist in CVF, but the original spec has material remaining product/runtime gaps. |
| `boundary_absorbed_engine_missing` | Governance or read-only boundary exists, but the main engine described by the source is not implemented. |
| `doctrine_absorbed` | Source was normalized into doctrine/governance text only. |
| `untriaged_active_source` | Source is known and relevant but has not been mapped to current CVF owner surfaces in this registry. |
| `deferred_or_archived` | Source exists but is not an active implementation driver unless a future GC-018 selects it. |

---

## High-Risk Source Registry

| Source folder | Status | Current owner/evidence | Remaining gap / next trigger |
| --- | --- | --- | --- |
| `.private_reference/legacy/CVF 16.5/agentmemory/` | `partially_absorbed` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.gateway.contract.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-lifecycle-policy.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-policy.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts`; `docs/baselines/CVF_GC018_AIF_C_MEMORY_GATEWAY_PHASE2_2026-05-24.md`; `docs/reviews/CVF_AIF_C_MEMORY_GATEWAY_PHASE2_COMPLETION_2026-05-24.md`; `docs/reviews/CVF_N6_AIF_GRAPH_SEARCH_ACTIVATION_COMPLETION_2026-05-24.md` | AIF-C Phase 2a owns local gateway, lifecycle, retrieval, privacy/exclusion, and context packaging; N6 activates local advisory `graph_search` through injected AIF-B graph service. Active product path still does not prove event-hook capture, cross-session memory, live reinjection, or non-graph durable memory. |
| `.private_reference/legacy/CVF ADD/code-review-graph/` | `runtime-owned` | `docs/reference/CVF_SCOPED_KNOWLEDGE_PROVIDER_BOUNDARY_DOCTRINE_2026-05-07.md`; `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/scoped.knowledge.provider.contract.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/schema/graph-schema.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/ast/ast-parser.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/index/symbol-index.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/storage/graph-sqlite-store.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/context_builder/graph/task-query-mapper.ts`; `docs/baselines/CVF_GC018_AIF_B_GRAPH_KNOWLEDGE_PHASE1_2026-05-24.md`; `docs/reviews/CVF_AIF_B_GRAPH_KNOWLEDGE_PHASE1_COMPLETION_2026-05-24.md`; `docs/reviews/CVF_PBR04_GRAPH_SQLITE_PERSIST_COMPLETION_2026-05-24.md` | AIF-B Phase 1 delivers AST graph, dependency/symbol index, advisory blast-radius resolver, and `GraphKnowledgeService`; PBR-04 adds optional SQLite symbol-index persistence without changing the interface. Standalone scoring and live authority remain deferred; `CVF_GRAPH_SCORING_SPEC.md` does not exist in the source bundle. |
| `.private_reference/legacy/CVF 17.05/Review CVF.md` | `partially_absorbed` | Active deliverable-fit oracle for Review-CVF pain-point closure chain. | Continue using as source oracle, but do not use it as the only comparator when deeper specs exist in 16.5, ADD, or Edit folders. |
| `.private_reference/legacy/CVF Edit/` | `untriaged_active_source` | Operator-opened review/edit folder; current active file `.private_reference/legacy/CVF Edit/Review CVF_2.md`. | Must be scanned before any future Review-CVF correction or pain-point closure claim. No current absorption status may be inferred without a dedicated review. |

---

## CVF 16.5 Folder Registry

| Source folder | Registry status | Notes |
| --- | --- | --- |
| `.private_reference/legacy/CVF 16.5/abtop/` | `runtime-owned` | Observability Delta closure exists; deeper observability plane foundation was later separately reviewed. |
| `.private_reference/legacy/CVF 16.5/agentmemory/` | `partially_absorbed` | AIF-C Phase 2a local memory policy modules exist; N6 advisory `graph_search` is active; durable/live memory remains deferred outside graph symbol-index persistence. |
| `.private_reference/legacy/CVF 16.5/Claude Kit/` | `runtime-owned` | Agent boundary/delegation runtime adoption evidence exists. |
| `.private_reference/legacy/CVF 16.5/free Claude Code/` | `runtime-owned` | Model gateway/provider compatibility concepts absorbed in bounded form. |
| `.private_reference/legacy/CVF 16.5/freellmapi/` | `runtime-owned` | Model Gateway runtime adoption evidence exists. |
| `.private_reference/legacy/CVF 16.5/md2html/` | `runtime-owned` | Document artifact renderer adoption evidence exists. |
| `.private_reference/legacy/CVF 16.5/Memento-Skills/` | `runtime-owned` | Skill evolution loop adoption evidence exists. |
| `.private_reference/legacy/CVF 16.5/OpenAgentd/` | `runtime-owned` | Tool trace/sandbox and agent-boundary concepts absorbed in bounded form. |
| `.private_reference/legacy/CVF 16.5/OpenSpec/` | `runtime-owned` | OpenSpec change adapter adoption evidence exists. |
| `.private_reference/legacy/CVF 16.5/pancake-pos-mcp/` | `runtime-owned` | Generic MCP business adapter absorbed; Pancake profile remains optional/deferred. |
| `.private_reference/legacy/CVF 16.5/REVIEW FOLDER/` | `deferred_or_archived` | Historical intake/review material. Use as evidence source, not implementation authorization. |
| `.private_reference/legacy/CVF 16.5/tolaria/` | `runtime-owned` | Knowledge Vault Intake adoption evidence exists. |

Baseline reference: `docs/baselines/archive/CVF_16_5_LIVING_INTEGRATION_CLASSIFICATION_SUMMARY_2026-05-16.md`.

---

## CVF ADD Folder Registry

| Source folder | Registry status | Notes |
| --- | --- | --- |
| `.private_reference/legacy/CVF ADD/AGENT ENGINEER/` | `doctrine_absorbed` | Use ADD doctrine/runtime activation references before claiming runtime agent-engineering behavior. |
| `.private_reference/legacy/CVF ADD/Agent Harnesses/` | `doctrine_absorbed` | Continuity/delegation doctrine exists; runtime expansion requires fresh GC-018. |
| `.private_reference/legacy/CVF ADD/AI-first vs Human-first/` | `doctrine_absorbed` | Anti-overconstraint concepts normalized into ADD doctrine; product changes remain demand-gated. |
| `.private_reference/legacy/CVF ADD/caveman/` | `deferred_or_archived` | Efficiency/context-budgeting concepts require a concrete product trigger. |
| `.private_reference/legacy/CVF ADD/CLI-Anything/` | `deferred_or_archived` | Tool-surface concepts require a fresh tool-runtime work order. |
| `.private_reference/legacy/CVF ADD/code-review-graph/` | `runtime-owned` | AIF-B Phase 1 graph foundation exists; PBR-04 optional SQLite symbol-index persistence exists; scoring/live authority remain deferred. |
| `.private_reference/legacy/CVF ADD/cortex-hub/` | `boundary_absorbed_engine_missing` | Related to scoped knowledge/provider boundary; concrete code intelligence runtime remains demand-gated. |
| `.private_reference/legacy/CVF ADD/deepagents/` | `doctrine_absorbed` | Delegation/subagent boundaries exist in doctrine/contract form; async runtime remains blocked without GC-018. |
| `.private_reference/legacy/CVF ADD/gridex/` | `deferred_or_archived` | Database action/runtime concepts require persistence/database boundary lift. |
| `.private_reference/legacy/CVF ADD/Hermes Agent/` | `deferred_or_archived` | Scheduled/cron agent execution requires explicit operator use case and guard review. |
| `.private_reference/legacy/CVF ADD/Hugging Face/` | `deferred_or_archived` | External model/skill ingestion requires provider/tool boundary review. |
| `.private_reference/legacy/CVF ADD/Human System Harness/` | `doctrine_absorbed` | Human/orchestrator brief concepts overlap ADD doctrine; runtime use must cite exact owner surface. |
| `.private_reference/legacy/CVF ADD/openrouter-cli.git/` | `deferred_or_archived` | No active implementation driver. |
| `.private_reference/legacy/CVF ADD/REVIEW FOLDER/` | `doctrine_absorbed` | Canonical ADD synthesis/rebuttal source. Required for ADD-family reopen decisions. |
| `.private_reference/legacy/CVF ADD/Workflow GoClaw/` | `doctrine_absorbed` | Context profile/boundary concepts normalized into ADD references; product runtime remains demand-gated. |

Primary ADD references:

- `docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_GOVERNED_CONTEXT_PROFILE_METADATA_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_AGENT_CONTINUITY_AND_DELEGATION_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_SCOPED_KNOWLEDGE_PROVIDER_BOUNDARY_DOCTRINE_2026-05-07.md`

---

## Other Legacy Roots

| Source folder | Registry status | Notes |
| --- | --- | --- |
| `.private_reference/legacy/App onboarding/` | `untriaged_active_source` | Must be scanned before onboarding/product-readiness claims that might depend on it. |
| `.private_reference/legacy/CVF 17.05/` | `partially_absorbed` | Active session first-reads use selected REVIEW FOLDER files; other files must still be scanned when relevant. |
| `.private_reference/legacy/CVF Edit/` | `untriaged_active_source` | High priority because operator is actively reviewing these files. |
| `.private_reference/legacy/CVF_Important/` | `untriaged_active_source` | Scan before high-level architecture or claim-boundary work. |
| `.private_reference/legacy/CVF_Restructure/` | `untriaged_active_source` | Scan before structure/topology/refactor roadmap work. |

---

## Demand-Gated Successor Entries

| Candidate | Source | Status | Required preconditions |
| --- | --- | --- | --- |
| T-H2 / AIF-C Memory Gateway Phase 2a | `.private_reference/legacy/CVF 16.5/agentmemory/` | `CLOSED_PASS_BOUNDED` | Closed by `docs/reviews/CVF_AIF_C_MEMORY_GATEWAY_PHASE2_COMPLETION_2026-05-24.md`; future durable/live/cross-session memory still requires fresh GC-018. |
| T-GRAPH / AIF-B Graph Knowledge Phase 1 | `.private_reference/legacy/CVF ADD/code-review-graph/` | `CLOSED_PASS_BOUNDED` | Closed by `docs/reviews/CVF_AIF_B_GRAPH_KNOWLEDGE_PHASE1_COMPLETION_2026-05-24.md`; future durable storage/scoring/live integration still requires fresh GC-018. |
| N6 / AIF-C graph_search activation | `.private_reference/legacy/CVF 16.5/agentmemory/`; `.private_reference/legacy/CVF ADD/code-review-graph/` | `CLOSED_PASS_BOUNDED` | Closed by `docs/reviews/CVF_N6_AIF_GRAPH_SEARCH_ACTIVATION_COMPLETION_2026-05-24.md`; graph output remains advisory evidence only. |
| PBR-04 / Graph SQLite symbol-index persistence | `.private_reference/legacy/CVF ADD/code-review-graph/` | `CLOSED_PASS_BOUNDED` | Closed by `docs/reviews/CVF_PBR04_GRAPH_SQLITE_PERSIST_COMPLETION_2026-05-24.md`; persistence is optional storage only, not graph scoring or live authority. |

---

## Claim Boundary

This registry is a routing and audit-control artifact. It does not authorize
implementation, reopen closed tranches, lift the freeze, create new memory
tiers, approve persistence/database work, or assert public product readiness.
