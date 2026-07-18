# CVF Memory Consolidation Workflow Chain Standard

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: standard

Date: 2026-06-12

Version: `cvf.memoryConsolidationWorkflowChain.t1a.v1`

MEMCON tranche: T1a

Parent roadmap:
`docs/roadmaps/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_ROADMAP_2026-06-12.md`

GC-018:
`docs/baselines/CVF_GC018_MEMCON_T1A_MEMORY_CONSOLIDATION_STANDARD_OWNER_RECONCILIATION_2026-06-12.md`

---

## Purpose

Define the canonical vocabulary, lifecycle, decision rules, and boundary
constraints for a pre-store Memory Consolidation workflow chain in CVF.

The standard does not implement runtime storage, schema appendix fields,
machine checkers, or Policy_Local behavior. It defines the rule layer from
which T1b (schema appendix) and T2 (machine checker) may draw in later
authorized tranches.

---

## Scope

In scope:

- memory signal lifecycle (intake -> candidate -> consolidation -> retrieval ->
  archive);
- decision vocabulary for each stage;
- temporal ambiguity blocking rule;
- source authority and confidence requirements;
- conflict and staleness detection semantics;
- retrieval eligibility rule and raw-memory boundary;
- operator-visible memory review packet requirements;
- pruning and archive rules.

Out of scope:

- runtime implementation or source mutation;
- schema appendix or typed field tables (T1b);
- machine-check implementations (T2+);
- vector storage, SQLite, FTS5, embeddings, or any database;
- provider/API-key calls;
- Policy_Local mutation or readiness claims;
- autonomous memory mutation or hidden memory authority;
- public-sync or production readiness claims;
- replacing existing session handoff rules or continuity pointers.

---

## Chain Position And Existing Owner Relationship

The Memory Consolidation workflow chain is the **pre-store** half of the CVF
Memory Plane. It converts raw signals (conversation turns, worker returns,
handoffs, source maps) into source-backed consolidated memory records eligible
for storage.

The existing **post-store** half is represented by
`memory-runtime-workflow-chain.ts`
(`cvf.memoryRuntimeWorkflowChain.mkg5.t1.v1`), which takes already-stored
candidates and packages them into retrieval-safe context blocks. MEMCON feeds
that chain; it does not replace it.

```text
[Pre-store: MEMCON]                  [Post-store: existing runtime chain]
RAW SIGNALS                          STORED MEMORY CANDIDATES
  -> MEMORY INTAKE                     -> GATEWAY CHECK
  -> CANDIDATE EXTRACTION              -> RETRIEVAL FILTER
  -> CONSOLIDATION GATE                -> CONTEXT PACKAGING
  -> CONFLICT / STALENESS REVIEW       -> TOKEN BUDGET GUARD
  -> TEMPORAL NORMALIZATION            -> EVENT HOOKS
  -> OPERATOR REVIEW                   -> CONTEXT BLOCK (rawMemoryReleased=false)
  -> CONSOLIDATED RECORD (eligible)
         |
         v
    [storage layer]
         |
         v
  [post-store retrieval chain input]
```

---

## Vocabulary

### MemorySignal

A raw, unvalidated claim or fact eligible for memory-consolidation review.

A `MemorySignal` must record:

- `signalId`  - unique identifier;
- `sourceType`  - one of: `session_turn`, `worker_return`, `handoff`,
  `source_map`, `completion_review`, `operator_supplied`, `external_artifact`;
- `sourcePathOrRef`  - repository path or transcript reference;
- `capturedAtDate`  - absolute date (YYYY-MM-DD); relative dates forbidden;
- `operatorSupplied`  - boolean;
- `agentSource`  - agent ID or `operator`;
- `claimText`  - the literal claim to be evaluated;
- `riskClass`  - R0 through R3;
- `sensitiveDataFlag`  - boolean;
- `candidateAction`  - disposition from the candidate action vocabulary.

Allowed `candidateAction` values:

| Value | Meaning |
| --- | --- |
| `PROMOTE_TO_CANDIDATE` | signal passes intake; extract a MemoryCandidate |
| `MERGE_WITH_EXISTING` | claim duplicates an existing candidate; merge rather than duplicate |
| `DEFER_LOW_SIGNAL` | signal does not meet promotion threshold; hold for later operator review |
| `REJECT_NOISE` | signal is noise, off-topic, or not memory-eligible |
| `BLOCKED_SOURCE_MISSING` | source authority is absent; cannot be consolidated |

### MemoryCandidate

A normalized, source-backed claim extracted from one or more `MemorySignal`
records and ready for consolidation review.

A `MemoryCandidate` must record:

- `candidateId`;
- `canonicalClaim`  - normalized, de-relative-dated statement of the fact;
- `sourceAuthority`  - repository path, artifact SHA, or work-order reference;
- `confidenceLevel`  - one of: `HIGH`, `MEDIUM`, `LOW`, `UNVERIFIED`;
- `scope`  - one of: `session`, `project`, `organization`, `global`;
- `domainTags`  - list of domain keywords;
- `timeReferences`  - list of absolute dates or `NO_TIME_REFERENCE`;
- `temporalNormalizationStatus`  - see temporal normalization vocabulary;
- `conflictSetIds`  - list of `candidateId` values in conflict, or empty;
- `stalenessRisk`  - one of: `NONE`, `LOW`, `MEDIUM`, `HIGH`;
- `retrievalEligibility`  - one of: `ELIGIBLE`, `INELIGIBLE`, `BLOCKED_*`;
- `operatorReviewRequired`  - boolean.

### ConsolidatedMemoryRecord

A memory record that has passed all consolidation gates and is eligible for
storage and downstream retrieval.

A `ConsolidatedMemoryRecord` must record:

- all fields from `MemoryCandidate`;
- `consolidationDecision`  - value from consolidation decision vocabulary;
- `supersedes`  - list of `candidateId` values this record replaces, or empty;
- `supersededBy`  - `candidateId` of newer record, or null;
- `lastValidatedDate`  - absolute date;
- `nextReviewDate`  - absolute date;
- `staleReason`  - free text, or null;
- `operatorDecision`  - operator-recorded approval, override, or null;
- `retrievalBoundary`  - one of: `SUMMARY_ONLY`, `FULL_WITH_SOURCE`,
  `REDACTED_SENSITIVE`, `BLOCKED`.

---

## Temporal Normalization Rule

Relative date phrases must not appear in durable `ConsolidatedMemoryRecord`
fields unless they are quoted source evidence with a `quoteEvidence=true` flag.

Forbidden phrases in durable memory (non-exhaustive):

- `today`, `yesterday`, `tomorrow`;
- `last week`, `this week`, `next week`;
- `recently`, `earlier`, `soon`, `shortly`;
- `this month`, `last month`, `three months ago`;
- `a while back`, `some time ago`;
- `hom nay`, `hom qua`, `tuan truoc`, `gan day`, `vua roi`, `thang truoc`
  (Vietnamese equivalents when the artifact is explicitly Vietnamese-facing;
  exact Unicode forms require a Text Encoding Exception per
  `docs/reference/CVF_TEXT_ENCODING_AND_SYMBOL_DISCIPLINE_STANDARD_2026-06-07.md`)

Allowed `temporalNormalizationStatus` values:

| Value | Meaning |
| --- | --- |
| `ABSOLUTE_DATE_PRESENT` | the claim already carries an absolute date (YYYY-MM-DD or ISO-8601) |
| `NORMALIZED_TO_ABSOLUTE_DATE` | a relative phrase was converted to an absolute date before consolidation |
| `NO_TIME_REFERENCE` | the claim has no time dependency |
| `TIME_AMBIGUOUS_BLOCKED` | a relative phrase was detected but cannot be resolved; consolidation is blocked until normalized |

A candidate with `temporalNormalizationStatus = TIME_AMBIGUOUS_BLOCKED` must
not proceed to consolidation. It must be surfaced in the Operator-Visible
Memory Review Packet under the `Temporal Ambiguity Blocks` section for manual
resolution.

---

## Source Authority And Confidence

A `MemoryCandidate` or `ConsolidatedMemoryRecord` that lacks source authority
(`sourceAuthority = null` or empty) must receive `retrievalEligibility =
BLOCKED_SOURCE_MISSING`.

`confidenceLevel` mapping guideline:

| Level | Basis |
| --- | --- |
| `HIGH` | directly cited from a repository artifact at a verified path and line |
| `MEDIUM` | inferred from a verified artifact with reasonable interpretation |
| `LOW` | derived from a conversation summary or indirect evidence |
| `UNVERIFIED` | no backing artifact found; awaiting operator review |

Memory with `confidenceLevel = UNVERIFIED` must not reach `retrievalEligibility
= ELIGIBLE` without operator confirmation.

---

## Consolidation Gate

A `MemoryCandidate` may be promoted to a `ConsolidatedMemoryRecord` only when
all of the following conditions are met:

1. `temporalNormalizationStatus` is not `TIME_AMBIGUOUS_BLOCKED`;
2. `conflictSetIds` is empty, or all conflicts are resolved with an
   `operatorDecision` record;
3. `stalenessRisk` is not `HIGH` without an `operatorDecision` override;
4. `sourceAuthority` is non-empty;
5. `retrievalEligibility` is not blocked.

Allowed consolidation decisions:

| Value | Meaning |
| --- | --- |
| `CONSOLIDATED` | candidate met all gates; becomes an active record |
| `MERGED` | candidate merged into an existing record; original deprecated |
| `SUPERSEDED` | a newer record with stronger authority replaces this candidate |
| `PRUNED_LOW_VALUE` | duplicate or noise pruned to reduce memory footprint |
| `BLOCKED_CONFLICT` | unresolved conflict prevents consolidation |
| `BLOCKED_STALE` | staleness risk too high without operator override |
| `BLOCKED_TIME_AMBIGUOUS` | `TIME_AMBIGUOUS_BLOCKED` status blocks consolidation |
| `DEFERRED_NEEDS_OPERATOR` | requires operator decision before consolidation proceeds |

---

## Conflict, Staleness, And Outdated Detection

Conflict and staleness detection must use the existing `KnowledgeMaintenanceSignalType`
semantics where applicable:

- `lint`  - format or metadata violation;
- `contradiction`  - two claims assert incompatible facts;
- `drift`  - a claim no longer matches the current repository state;
- `orphan`  - a claim refers to a deleted or renamed artifact;
- `staleness`  - the claim was valid but may no longer reflect current state.

Additional memory-specific fields:

- `conflictsWith`  - list of `candidateId` values this record conflicts with;
- `lastValidatedDate`  - date the claim was last verified against source;
- `nextReviewDate`  - date by which the claim should be re-evaluated;
- `staleReason`  - description of why the claim is stale or at risk of staleness.

The existing `contradiction_flag` on `W7MemoryRecord` is the canonical
indicator of contradiction at the record level. MEMCON consolidation must
set this flag if a contradiction is detected.

---

## Retrieval Eligibility Rule

A `ConsolidatedMemoryRecord` is eligible for retrieval packaging only when:

- `retrievalEligibility = ELIGIBLE`;
- `temporalNormalizationStatus` is not `TIME_AMBIGUOUS_BLOCKED`;
- `consolidationDecision` is not `BLOCKED_*`;
- lifecycle state is not `expired` or `disputed` (aligning with the existing
  retrieval-policy `BLOCKED_STATES`).

Raw memory must never be released to a retrieval consumer. The lower-case
boundary phrase is: raw memory remains blocked from direct release. All retrieval output
must carry `rawMemoryReleased: false` (aligning with the existing
`memory-runtime-workflow-chain.ts` and `controlled-memory-gateway.ts`
invariants).

---

## Operator-Visible Memory Review Packet

The Operator-Visible Memory Review Packet is a Markdown-first artifact
that an operator can inspect without code access. It must include the following
sections:

1. **Active Consolidated Memories**  - source-backed, retrieval-eligible records;
2. **New Candidate Memories**  - promoted but not yet consolidated;
3. **Conflicts Requiring Decision**  - records with unresolved `conflictSetIds`;
4. **Stale Or Outdated Memories**  - records with `stalenessRisk = HIGH` or
   outdated `lastValidatedDate`;
5. **Temporal Ambiguity Blocks**  - candidates blocked on
   `TIME_AMBIGUOUS_BLOCKED` with the raw phrase and resolution options;
6. **Pruned Or Rejected Noise**  - signals discarded as `REJECT_NOISE` or
   `PRUNED_LOW_VALUE`;
7. **Retrieval-Eligible Pack Preview**  - compact list of records that would be
   included in the next retrieval pack;
8. **Operator Actions Required**  - list of decisions awaiting operator input;
9. **Claim Boundary**  - explicit statement of what the packet does and does not
   prove.

JSON ledger output is deferred to T3. The T1a standard defines the required
sections only. If the ledger becomes append-heavy or agent-edited, it must
follow the JSON Generated Aggregate Discipline Standard
(`docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md`).

---

## Pruning And Archive Rule

Every `ConsolidatedMemoryRecord` must have a declared retirement path.

Allowed outcomes:

| Outcome | Condition |
| --- | --- |
| Keep active | record is verified, non-stale, and retrieval-eligible |
| Archive-only evidence | record is no longer retrieval-eligible but has historical value |
| Supersede | a newer, higher-authority record replaces this one |
| Prune as duplicate or noise | exact or near-duplicate of an active record with equal or stronger authority |
| Block pending operator review | `operatorReviewRequired = true` and no decision yet |
| Delete | only when an explicit deletion authority record exists; auto-delete is forbidden |

Autonomous memory mutation (unprompted write, delete, or prune without operator
authorization) is forbidden at all tiers.

---

## Authority Hierarchy

Repository artifacts and source-verified work products outrank chat memory and
session summaries. The existing doctrine applies:

- `Repository truth outranks chat memory`
  (`docs/reference/CVF_AGENT_CONTINUITY_AND_DELEGATION_DOCTRINE_2026-05-07.md`)
- `Hidden memory must not become authority` (same source)

A `MemorySignal` sourced only from a prior chat session with no repository
artifact backing must receive `confidenceLevel = UNVERIFIED` and must not
proceed past `DEFER_LOW_SIGNAL` or `BLOCKED_SOURCE_MISSING` without operator
confirmation.

---

## Existing Owner Integration Boundaries

This standard does not re-implement the following existing owner surfaces. It
defines how MEMCON signals and candidates interact with them.

| Owner | Path | MEMCON interaction |
| --- | --- | --- |
| Memory lifecycle policy | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-lifecycle-policy.ts` | `MemoryLifecycleState` maps to `retrievalEligibility` blocking for `expired` and `disputed` |
| Memory tier classifier | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-tier-classifier.contract.ts` | `MemoryTier` and `persistenceClass` inform `scope` and `retrievalBoundary` of a `ConsolidatedMemoryRecord` |
| Controlled memory gateway | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | all retrieval packaging must pass through gateway; `rawMemoryReleased: false` invariant is inherited |
| Memory retrieval policy | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-policy.ts` | `BLOCKED_STATES = {expired, disputed}` must align with MEMCON `retrievalEligibility` |
| Memory runtime workflow chain | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-runtime-workflow-chain.ts` | post-store chain that consumes consolidated memory; MEMCON output feeds this chain's input |
| Learning signal intake bridge | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts` | peer intake channel for governance/defect feedback; `MemorySignal` is a sibling for memory-consolidation use cases only |
| W7 memory record | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/w7.memory.record.contract.ts` | `contradiction_flag` is the record-level contradiction indicator; MEMCON consolidation must set it |
| Knowledge maintenance | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.maintenance.contract.ts` | signal types `lint`, `contradiction`, `drift`, `orphan`, `staleness` are reused in Stage 4 |

---

## Non-Goals

This standard does not:

- claim CVF has a complete long-term teammate memory system;
- make chat memory authoritative over repository artifacts;
- store complete transcripts by default;
- authorize any agent to write durable truth memory without review;
- implement runtime consolidation, storage, or retrieval;
- define schema appendix or typed field tables (T1b scope);
- implement machine checks (T2 scope);
- touch Policy_Local or any external workspace;
- authorize autonomous memory mutation;
- claim production readiness, public readiness, or memory quality parity.

## Claim Boundary

This standard defines the vocabulary, lifecycle, and decision rules for a
pre-store Memory Consolidation workflow chain in CVF. It does not prove runtime
memory consolidation, storage behavior, retrieval correctness, cross-agent
consistency, operator UI behavior, provider behavior, Policy_Local readiness,
public readiness, production readiness, memory quality parity, memory
reinjection, high-risk promotion, or autonomous mutation.

Proposed vocabulary (`MemorySignal`, `MemoryCandidate`, `ConsolidatedMemoryRecord`,
`TIME_AMBIGUOUS_BLOCKED`) is doc-only in T1a. These symbols have no runtime
existence until a later authorized implementation tranche creates them.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private Memory Plane foundation standard; public-sync is not authorized
by this tranche.
