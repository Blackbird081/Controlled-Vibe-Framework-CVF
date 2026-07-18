# CVF LHW13-T3 Graph Context Resolver Boundary Connector Spec

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: connector_spec

Date: 2026-05-29

---

## Purpose

This connector maps AIF-B `GraphKnowledgeService` boundary status ×
LHW7-T2 `signalsStillMissing` × LHW11-T3 `memoryContextSeedDecayAdvisoryType`
→ `graphContextResolverBoundaryAdvisoryType` + `activeResolutionMode` +
`phaseToNextMode`.

## Scope / Applies To

Applies to: CVF graph context resolver boundary advisory surface.
Documentation-only connector. No graph retrieval execution. No
`GraphKnowledgeService` route wiring. No runtime authority.

---

## S1 — Purpose and Gap Citation

Source gap: CVF 25.05 Gop_y.md Gap 9 — AIF-B graph modules exist
(`GraphKnowledgeService` in `graph-schema.ts` at line 62) but are not wired
into any runtime path. No connector defines which resolution mode is active
(text-retrieval / project-knowledge / graph-future) and what phase boundary
separates them. Gap 9 direction: "Do not build now, just define boundary."

Source family: LH1 `tolaria` — PARTIALLY_ABSORBED; trigger: "Governed memory
snapshot packaging or graph context readout." T3 closes the graph context
readout portion of this trigger.

T1 gate: `docs/reviews/CVF_LHW13_T1_AGENT_READING_PROTOCOL_GOVERNANCE_CONNECTOR_COMPLETION_2026-05-29.md`
— Status: CLOSED_PASS_BOUNDED.

T2 gate: `docs/reviews/CVF_LHW13_T2_MEMORY_CONTINUITY_LEVEL_ADVISORY_CONNECTOR_COMPLETION_2026-051-29.md`
— Status: CLOSED_PASS_BOUNDED.

Key invariants for this connector:

- This connector does NOT execute graph retrieval or wire `GraphKnowledgeService`
  to any route.
- The boundary advisory is a governance planning record only.
- `runtimeExecutionAuthorized=false`.

Authority chain:
- LHW13 roadmap: `docs/roadmaps/CVF_LHW13_WORKFLOW_CONNECTOR_WAVE13_ROADMAP_2026-05-29.md`
- LHW13 GC-018: `docs/baselines/CVF_GC018_LHW13_WORKFLOW_CONNECTOR_WAVE13_2026-05-29.md`
- AIF-B source: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/schema/graph-schema.ts`
- LHW7-T2 spec: `docs/reference/CVF_LHW7_T2_PROJECT_MEMORY_CONTEXT_BUDGET_HANDOFF_CONNECTOR_SPEC_2026-05-28.md`
- LHW11-T3 spec: `docs/reference/CVF_LHW11_T3_MEMORY_CONTEXT_SEED_DECAY_ADVISORY_CONNECTOR_SPEC_2026-05-28.md`
- LH1 ledger `tolaria` trigger: `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` line 129

---

## S2 — Connector Design

### Graph Service Boundary Status Taxonomy (doc-only, 3 values)

| `graphServiceBoundaryStatus` | Meaning | Current CVF state |
| --- | --- | --- |
| `interface_only` | `GraphKnowledgeService` exists as interface; `buildIndex`/`queryImpact` not wired to any runtime route | CURRENT STATE |
| `schema_proven` | Graph schema and node/edge storage exist and are tested; not called from runtime route | Future state after route integration |
| `route_wired` | `GraphKnowledgeService` wired to runtime path and callable from execution surface | Not current state |

### Output Advisory Mapping

`graphServiceBoundaryStatus` × `signalsStillMissing` ×
`memoryContextSeedDecayAdvisoryType` → `graphContextResolverBoundaryAdvisoryType`
+ `activeResolutionMode` + `phaseToNextMode`:

| `graphServiceBoundaryStatus` | `signalsStillMissing` | `memoryContextSeedDecayAdvisoryType` | `graphContextResolverBoundaryAdvisoryType` | `activeResolutionMode` | `phaseToNextMode` |
| --- | --- | --- | --- | --- | --- |
| `interface_only` | empty | `memory_context_healthy_eligible_for_review` | `graph_boundary_interface_only` | `text_retrieval` | Route wiring required before advancing to `project_knowledge` |
| `interface_only` | non-empty | any | `graph_boundary_signals_missing` | `text_retrieval` | Resolve missing context signals before graph mode advancement |
| `schema_proven` | empty | `memory_context_healthy_eligible_for_review` | `graph_boundary_schema_ready` | `project_knowledge` | Schema present; route wiring is next phase gate |
| `schema_proven` | non-empty | `memory_context_contaminated_promotion_blocked` | `graph_boundary_schema_contaminated` | `text_retrieval` | Memory contamination; hold graph mode advancement |
| `route_wired` | empty | `memory_context_healthy_eligible_for_review` | `graph_boundary_active` | `graph_future` | Graph resolver active; governance evidence required per use |

---

## S3 — Invariants and Boundary

1. `runtimeExecutionAuthorized=false` — this connector does not execute graph
   retrieval, wire `GraphKnowledgeService` to any route, or call `buildIndex` or
   `queryImpact`.
2. Current CVF state is `graphServiceBoundaryStatus=interface_only` —
   `GraphKnowledgeService` exists as an interface at line 62 of `graph-schema.ts`
   with `buildIndex` (line 63) and `queryImpact` (line 64) methods; these are
   not called from any runtime route.
3. `activeResolutionMode=text_retrieval` is the current operative mode for all
   CVF sessions. `project_knowledge` and `graph_future` are future phase states.
4. `graphContextResolverBoundaryAdvisoryType` is a governance planning record
   only; Orchestrators apply their own judgment based on the advisory output.
5. LH1 `tolaria` graph context readout trigger is satisfied by this doc-only
   boundary definition per wave scope. No runtime graph execution is claimed.

---

## S4 — Non-Goals

- Graph context retrieval execution
- `GraphKnowledgeService` route wiring or `buildIndex`/`queryImpact` invocation
- L2/L3 memory activation
- Memory reinjection
- Receipt envelope extension
- Provider behavior changes
- Runtime advisory enforcement or blocking
- Operations Cockpit UX surface (separate product roadmap)
- External Capability Admission Expansion (separate extension roadmap)
- Hosted readiness, production readiness, or public release readiness
- Any tranche beyond T3 without a fresh roadmap and GC-018

---

## S5 — Source Verification Table

| Verified symbol | Source file | Line/section | Disposition |
| --- | --- | --- | --- |
| `GraphKnowledgeService` interface | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/schema/graph-schema.ts` | line 62 | ACCEPT |
| `buildIndex` method | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/schema/graph-schema.ts` | line 63 | ACCEPT |
| `queryImpact` method | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/schema/graph-schema.ts` | line 64 | ACCEPT |
| `signalsStillMissing` | `docs/reference/CVF_LHW7_T2_PROJECT_MEMORY_CONTEXT_BUDGET_HANDOFF_CONNECTOR_SPEC_2026-05-28.md` | S3 line 114 | ACCEPT |
| `memoryContextSeedDecayAdvisoryType` | `docs/reference/CVF_LHW11_T3_MEMORY_CONTEXT_SEED_DECAY_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S3 field list | ACCEPT |
| LH1 `tolaria` trigger | `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` | line 129 | ACCEPT |

New doc-only fields (no runtime claim):

| New field | Purpose | Runtime claim blocked? |
| --- | --- | --- |
| `graphContextResolverBoundaryAdvisoryType` | Names the graph resolver boundary planning advisory | Yes |
| `graphServiceBoundaryStatus` values: `interface_only`, `schema_proven`, `route_wired` | Doc-only taxonomy defining graph boundary phases | Yes |
| `activeResolutionMode` | Records the currently permitted resolution mode as advisory | Yes |
| `phaseToNextMode` | States the doc-only phase boundary before another mode may be claimed | Yes |

---

## Claim Boundary

This connector produces a documentation planning record. It does not claim
graph retrieval execution, `GraphKnowledgeService` route wiring, memory
reinjection, receipt envelope extension, provider behavior, hosted readiness,
production readiness, or public release readiness.

LHW13 wave closure: T1 + T2 + T3 all CLOSED_PASS_BOUNDED. LH1 `tolaria`
PARTIALLY_ABSORBED trigger (memory snapshot packaging + graph context readout)
is closed for the doc-only connector scope. Remaining `tolaria` value (runtime
graph retrieval) is eligible for a separate live-proof roadmap post-LHW.
