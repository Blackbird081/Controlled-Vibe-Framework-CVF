# CVF Memory Consolidation Existing Owner Reconciliation Map

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: source_map

Date: 2026-06-12

MEMCON tranche: T1a

Parent standard:
`docs/reference/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_STANDARD_2026-06-12.md`

GC-018:
`docs/baselines/CVF_GC018_MEMCON_T1A_MEMORY_CONSOLIDATION_STANDARD_OWNER_RECONCILIATION_2026-06-12.md`

---

## Purpose

Map every current CVF owner surface that is relevant to Memory Plane behavior
and record its disposition with respect to MEMCON-T1a. This map proves that
MEMCON builds on partial owners rather than re-inventing them.

## Scope

This map covers source-visible owner surfaces in `EXTENSIONS/` and
`docs/reference/`. It does not claim to cover all session/handoff pointer
files, generated JSON aggregates, or external workspace files. Its corpus
verdict is `PARTIAL`  - scoped to the memory-relevant surfaces identified
during roadmap authoring, rebuttal, and dispatch.

## Evidence Reuse

Source anchors in this map reuse verification from:

- `docs/roadmaps/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_ROADMAP_2026-06-12.md`
  (planning-time verification, commit `4cb775b3`);
- `docs/reviews/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_CLAUDE_REBUTTAL_2026-06-12.md`
  (rebuttal source verification);
- `docs/work_orders/CVF_AGENT_WORK_ORDER_MEMCON_T1A_MEMORY_CONSOLIDATION_STANDARD_OWNER_RECONCILIATION_FOR_CLAUDE_2026-06-12.md`
  (dispatch source verification table).

Fresh runtime verification was performed at `executionBaseHead=b39ea40d` for
symbol anchors directly cited in this map.

---

## Disposition Vocabulary

| Code | Meaning |
| --- | --- |
| `REUSE_NOW` | MEMCON-T1a standard uses this surface's semantics directly with no extension needed |
| `EXTEND_LATER` | this surface is a partial primitive; a later authorized tranche (T1b/T2+) may extend it; do not duplicate in T1a |
| `OUT_OF_SCOPE` | relevant surface but not in the MEMCON consolidation chain; leave untouched |
| `BLOCKED_PENDING_T1B` | usage requires the schema appendix (T1b) to define typed fields first |
| `REJECT` | surface is not applicable to MEMCON and must not be imported into the standard |

---

## Owner Surface Reconciliation Table

### CVF_LEARNING_PLANE_FOUNDATION owners

| Owner surface | Path | Verified symbol / line | Role in MEMCON | Disposition | Extension boundary |
| --- | --- | --- | --- | --- | --- |
| Memory lifecycle policy | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-lifecycle-policy.ts` | `MemoryLifecycleState` (line 4); `evaluateLifecycleTransition` (line 49); `unreinforced_memory_expired` (line 65) | `expired` and `disputed` states map to `retrievalEligibility` blocking in the MEMCON standard | `REUSE_NOW` | Reuse `expired` / `disputed` semantics; do not redefine lifecycle states in T1a |
| Memory tier classifier | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-tier-classifier.contract.ts` | `MemoryTier` (line 1); `persistenceClass` (lines 24-29); `describeMemoryTier` (line 48) | `MemoryTier` values inform `scope` and `persistenceClass` informs `retrievalBoundary` of a `ConsolidatedMemoryRecord` | `REUSE_NOW` | Reuse tier taxonomy; T1b schema appendix maps `MemoryTier` to MEMCON `scope` field |
| Controlled memory gateway | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | `rawMemoryReleased: false` (lines 50, 88); `global_memory_scope_not_authorized` (line 102); `memory_reinjection_not_authorized` (line 121) | all MEMCON retrieval packaging must pass through gateway; raw-memory boundary and reinjection block are inherited | `REUSE_NOW` | MEMCON standard cites these invariants; no extension needed in T1a |
| Memory retrieval policy | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-policy.ts` | `BLOCKED_STATES = new Set(["expired", "disputed"])` (line 52); `rawMemoryReleased: false` (lines 49, 121, 161, 176, 217, 258) | defines the post-store filter that MEMCON consolidated records must satisfy before retrieval | `REUSE_NOW` | align MEMCON `retrievalEligibility` blocking with `BLOCKED_STATES`; no extension in T1a |
| Memory runtime workflow chain | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-runtime-workflow-chain.ts` | `runMemoryRuntimeWorkflowChain` (line 95); `MemoryRuntimeWorkflowStatus: "packaged" \| "denied" \| "deferred"` (line 29); `rawMemoryReleased: false` | post-store chain; MEMCON pre-store chain feeds its input; they are complementary, not competing | `REUSE_NOW` | MEMCON must declare the pre-store/post-store boundary; no modification to this file in T1a |
| Learning signal intake bridge | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts` | `LearningSignalIntakeRecord` (line 51); `LearningSignalLane` (line 11); `LearningSignalDisposition` (line 29) | peer intake channel for governance defect/feedback signals; `MemorySignal` is a sibling for memory-consolidation signals only | `REUSE_NOW` | `MemorySignal` must not duplicate `LearningSignalIntakeRecord`; they serve different intake lanes |
| Durable memory store | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | `DurableMemoryRecord` (line 23); `DurableMemoryStore` (line 89) | storage interface for persisted records; MEMCON consolidated records eventually target this interface | `EXTEND_LATER` | T1b or later implementation tranche maps `ConsolidatedMemoryRecord` to `DurableMemoryRecord`; no extension in T1a |
| Memory context packager | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts` | `packageMemoryContext`; `MemoryContextBlock`; `MemoryContextItem` | packages retrieval-eligible context blocks; MEMCON retrieval-eligible records feed this | `OUT_OF_SCOPE` | post-store packaging; leave untouched in T1a; MEMCON standard notes the boundary |
| Memory readout eligibility policy | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-readout-eligibility-policy.ts` | `evaluateReadoutEligibility` | governs whether a stored record is eligible for operator-visible readout | `OUT_OF_SCOPE` | downstream of consolidation; covered by existing policy; no change in T1a |
| Memory event hooks | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-event-hooks.ts` | `evaluateMemoryEventHook`; `MemoryEventHookEvaluation` | audit event hooks called by the runtime chain | `OUT_OF_SCOPE` | runtime audit; leave untouched in T1a |
| Memory durable readiness | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-durable-readiness.ts` | durable readiness contract | governs whether a durable memory write is permitted | `OUT_OF_SCOPE` | pre-write gate downstream of consolidation; leave untouched in T1a |
| Memory runtime | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-runtime.ts` | runtime memory operations | low-level runtime; not a consolidation surface | `OUT_OF_SCOPE` | leave untouched in T1a |
| Runtime memory hierarchy | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/runtime-memory-hierarchy.ts` | `RuntimeMemoryActorRole` | actor role taxonomy for runtime memory operations | `OUT_OF_SCOPE` | used by runtime chain; T1b may reference if actor roles map to MEMCON agent source |
| Memory retrieval attribution | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-attribution.ts` | retrieval attribution contract | source attribution for retrieved records | `OUT_OF_SCOPE` | post-store; leave untouched in T1a |
| Task memory store | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/task-memory/task-memory-store.ts` | `TaskMemoryStore` | task-scoped ephemeral memory | `OUT_OF_SCOPE` | ephemeral task memory; not part of durable consolidation chain |

### CVF_CONTROL_PLANE_FOUNDATION owners

| Owner surface | Path | Verified symbol / line | Role in MEMCON | Disposition | Extension boundary |
| --- | --- | --- | --- | --- | --- |
| W7 memory record | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/w7.memory.record.contract.ts` | `W7MemoryRecord` (lines 11-31); `contradiction_flag` (line 97) | the canonical record format for durable W7-plane memory; `contradiction_flag` is the record-level contradiction indicator that MEMCON consolidation must set when a contradiction is detected | `REUSE_NOW` | MEMCON must not invent a separate contradiction flag; use `contradiction_flag` on `W7MemoryRecord`; no extension in T1a |
| Knowledge maintenance contract | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.maintenance.contract.ts` | `KnowledgeMaintenanceSignalType: lint \| contradiction \| drift \| orphan \| staleness` (lines 13-18); maintenance operations (lines 153-191) | signal types are reused in MEMCON Stage 4 (conflict/staleness review) | `REUSE_NOW` | reuse signal type taxonomy in MEMCON stage 4 vocabulary; no extension in T1a |
| Knowledge refactor contract | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.refactor.contract.ts` | `selectAction` (line 38); `buildRationale` (line 58); reactions to `drift`, `staleness`, `orphan`, `contradiction` | existing conflict/staleness handling; MEMCON Stage 4 aligns with this contract | `REUSE_NOW` | reuse existing reaction patterns; do not duplicate `selectAction` logic; no extension in T1a |
| Knowledge vault intake | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.vault.intake.contract.ts` | vault intake contract | governs intake of knowledge assets into the vault | `OUT_OF_SCOPE` | knowledge vault intake is a separate lane; leave untouched in T1a |
| Knowledge context assembly | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.context.assembly.contract.ts` | context assembly contract | assembles knowledge context for task execution | `OUT_OF_SCOPE` | context assembly is post-store; leave untouched in T1a |

### Docs/Reference owners

| Owner surface | Path | Verified section / line | Role in MEMCON | Disposition | Extension boundary |
| --- | --- | --- | --- | --- | --- |
| Agent continuity and delegation doctrine | `docs/reference/CVF_AGENT_CONTINUITY_AND_DELEGATION_DOCTRINE_2026-05-07.md` | `Repository truth outranks chat memory` (line 35); `Hidden memory must not become authority` (line 40) | provides the authority-hierarchy rule that governs `confidenceLevel` and `sourceAuthority` requirements in MEMCON | `REUSE_NOW` | MEMCON standard quotes these rules directly; no change to this document |
| JSON generated aggregate discipline standard | `docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md` | aggregate discipline rules | governs how agent-edited JSON ledgers must be structured | `REUSE_NOW` | T3 ledger (when authorized) must follow this standard; noted in MEMCON standard |

---

## Gap Coverage Assessment

The owner reconciliation map confirms:

1. **Pre-store intake vocabulary (`MemorySignal`, `MemoryCandidate`)** is a
   genuine gap  - no existing surface covers memory-specific consolidation
   intake. `learning-signal-intake-bridge.ts` covers feedback/defect only.

2. **Composing consolidation contract (`ConsolidatedMemoryRecord`, gates)**
   is a genuine gap  - existing primitives (`memory-lifecycle-policy.ts`,
   `memory-tier-classifier.contract.ts`, knowledge maintenance) provide
   building blocks but no composing contract exists.

3. **Temporal ambiguity blocking rule (`TIME_AMBIGUOUS_BLOCKED`)** is a
   genuine gap  - no existing surface defines a durable-memory temporal block.

4. **Cross-agent consistency ledger** is a genuine gap deferred to T4.

5. **Operator-visible memory review packet** is a genuine gap deferred to T3.

6. **Machine gates for missing metadata** are genuine gaps deferred to T2.

Items that were incorrectly characterized as gaps in the original pre-rebuttal
draft and have been corrected:

- Signal intake was absent only for *memory consolidation*; feedback/defect
  intake (`learning-signal-intake-bridge.ts`) already existed.
- Consolidation primitives (lifecycle, tier, maintenance) already existed;
  only the composing contract was missing.
- A retrieval-time memory workflow chain already existed; MEMCON is the
  complementary pre-store half.

---

## Corpus Completeness Block

Corpus task class: bounded existing-owner surface scan.

Enumeration scope: memory-relevant files under
`EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/`,
`EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/`, and
`docs/reference/`.

Manifest: 29 owner surfaces reviewed (15 Learning Plane, 5 Control Plane,
2 docs/reference + 7 session/handoff/pointer files excluded as
non-owner-surface).

Exclusions: generated JSON aggregates, session state files, handoff files,
external workspaces  - all excluded with reason (not owner surfaces).

Unresolved files: 0.

Corpus verdict: `PARTIAL`  - scoped to memory-relevant surfaces; not a
full-repository scan.

---

## Claim Boundary

This map proves that the cited owner surfaces exist at the reviewed worktree
state and records their MEMCON disposition. It does not prove runtime
correctness, full-repository completeness, production readiness, or that
proposed MEMCON vocabulary (doc-only in T1a) is implemented.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private Memory Plane foundation map; public-sync is not authorized
by this tranche.
