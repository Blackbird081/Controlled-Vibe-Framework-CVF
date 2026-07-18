# CVF Memory Consolidation Schema Appendix

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-13

Version: `cvf.memoryConsolidationSchemaAppendix.t1b.v1`

MEMCON tranche: T1b

Parent roadmap:
`docs/roadmaps/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_ROADMAP_2026-06-12.md`

Parent standard:
`docs/reference/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_STANDARD_2026-06-12.md`

Owner map:
`docs/reference/CVF_MEMORY_CONSOLIDATION_EXISTING_OWNER_RECONCILIATION_MAP_2026-06-12.md`

GC-018:
`docs/baselines/CVF_GC018_MEMCON_T1B_MEMORY_CONSOLIDATION_SCHEMA_APPENDIX_2026-06-13.md`

## Purpose

This appendix turns the MEMCON-T1a Memory Consolidation standard into typed
field tables that later MEMCON tranches can validate. It is a schema reference
only. It does not create runtime interfaces, storage, retrieval behavior,
operator UI, provider calls, or Policy_Local behavior.

The schema is pre-store. It prepares memory candidates before any durable
storage or post-store retrieval chain consumes them.

## Scope / Applies-To

Applies to:

- MEMCON pre-store schema authoring;
- future MEMCON checker design;
- future operator-visible memory review packet design;
- downstream Policy_Local use-case planning only after a separate operator
  decision.

Does not apply to:

- runtime memory storage;
- retrieval runtime changes;
- provider calls;
- public-sync;
- external workspace mutation.

## Source And Owner Boundary

| Existing owner | Source file | Reused by T1b | Boundary |
| --- | --- | --- | --- |
| MEMCON T1a standard | `docs/reference/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_STANDARD_2026-06-12.md` | Vocabulary, temporal rule, retrieval boundary, operator-visible packet rule | T1b refines into fields only |
| Existing owner map | `docs/reference/CVF_MEMORY_CONSOLIDATION_EXISTING_OWNER_RECONCILIATION_MAP_2026-06-12.md` | Owner reuse and extension boundaries | T1b must not redefine reused owners |
| Memory tier classifier | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-tier-classifier.contract.ts` | `MemoryTier`, `persistenceClass` | T1b maps to `scope`, not new tiers |
| Memory lifecycle policy | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-lifecycle-policy.ts` | `expired`, `disputed` blocking semantics | T1b maps to retrieval eligibility |
| Memory retrieval policy | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-policy.ts` | `MemoryRetrievalCandidate`, `rawMemoryReleased: false` | T1b does not replace retrieval candidates |
| Memory runtime workflow chain | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-runtime-workflow-chain.ts` | post-store workflow status and package boundary | T1b output may feed later runtime work |
| Controlled memory gateway | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled-memory-gateway.ts` | release invariant and reinjection block | T1b inherits `rawMemoryReleased: false` |
| W7 memory record | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/w7.memory.record.contract.ts` | `contradiction_flag` | T1b uses same contradiction meaning |
| Knowledge maintenance | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.maintenance.contract.ts` | lint, contradiction, drift, orphan, staleness | T1b uses taxonomy for review signals |

## Schema Status Legend

| Term | Meaning |
| --- | --- |
| Required | Field must be present when the record is emitted |
| Optional | Field may be absent when not applicable |
| Nullable | Field must be present and may be null |
| Derived | Field is computed from earlier fields or owner contracts |
| Doc-only | Defined only in this appendix until a later runtime tranche implements it |

## MemorySignal Field Table

`MemorySignal` is a raw, unvalidated memory-relevant claim or observation
eligible for promotion to a `MemoryCandidate`.

| Field | Requirement | Type | Allowed values / source | Owner source | Notes |
| --- | --- | --- | --- | --- | --- |
| `signalId` | Required | string | stable unique ID | MEMCON T1a | Must be unique inside the packet |
| `sourceType` | Required | string enum | `session_turn`, `worker_return`, `handoff`, `source_map`, `completion_review`, `operator_supplied`, `external_artifact` | MEMCON T1a | Do not add values without a later standard update |
| `sourcePathOrRef` | Required | string | repo path, external pinned ref, transcript ref, or operator ref | MEMCON T1a | Hidden memory alone is not sufficient authority |
| `capturedAtDate` | Required | string date | `YYYY-MM-DD` | MEMCON T1a | Relative phrases are forbidden |
| `operatorSupplied` | Required | boolean | `true`, `false` | MEMCON T1a | Marks direct operator statement |
| `agentSource` | Required | string | agent ID or `operator` | MEMCON T1a | Required for cross-agent accountability |
| `claimText` | Required | string | concise claim summary | T1b appendix | Must not contain raw transcript dumps |
| `rawEvidenceReleased` | Required | boolean literal | `false` | Controlled memory gateway boundary | Raw source content is not released by MEMCON packets |
| `riskClass` | Required | string enum | `LOW`, `MEDIUM`, `HIGH`, `UNKNOWN` | MEMCON T1a | `UNKNOWN` requires operator review |
| `sensitiveDataFlag` | Required | boolean | `true`, `false` | MEMCON T1a | `true` blocks direct context release |
| `candidateAction` | Required | string enum | `PROMOTE_TO_CANDIDATE`, `MERGE_WITH_EXISTING`, `DEFER_LOW_SIGNAL`, `REJECT_NOISE`, `BLOCKED_SOURCE_MISSING` | MEMCON T1a | `BLOCKED_SOURCE_MISSING` stops consolidation |

## MemoryCandidate Field Table

`MemoryCandidate` is a normalized, source-backed claim extracted from one or
more `MemorySignal` records and ready for consolidation review.

| Field | Requirement | Type | Allowed values / source | Owner source | Notes |
| --- | --- | --- | --- | --- | --- |
| `candidateId` | Required | string | stable unique ID | MEMCON T1a | Must be stable across review updates |
| `sourceSignalIds` | Required | string array | `signalId` values | T1b appendix | Must contain at least one ID |
| `canonicalClaim` | Required | string | normalized claim | MEMCON T1a | Must not contain unresolved relative dates |
| `sourceAuthority` | Required | string | repo path, artifact hash, work-order ref, or operator ref | MEMCON T1a | Empty value blocks promotion |
| `confidenceLevel` | Required | string enum | `HIGH`, `MEDIUM`, `LOW`, `UNVERIFIED` | MEMCON T1a | Hidden-memory-only claims must be `UNVERIFIED` |
| `scope` | Required | string enum | `session`, `project`, `organization`, `global` | MEMCON T1a + `MemoryTier` owner | Maps to existing tier/privacy scope, not new tiers |
| `memoryTierHint` | Optional | string enum | `working`, `task`, `skill`, `organizational`, `long-term`, `audit`, `receipt` | `MemoryTier` | Hint only until runtime storage work |
| `domainTags` | Required | string array | domain labels | MEMCON T1a | Should stay compact |
| `timeReferences` | Required | string array | absolute dates or `NO_TIME_REFERENCE` | MEMCON T1a | No relative phrases |
| `temporalNormalizationStatus` | Required | string enum | `ABSOLUTE_DATE_PRESENT`, `NORMALIZED_TO_ABSOLUTE_DATE`, `NO_TIME_REFERENCE`, `TIME_AMBIGUOUS_BLOCKED` | MEMCON T1a | `TIME_AMBIGUOUS_BLOCKED` blocks consolidation |
| `conflictSetIds` | Required | string array | `candidateId` values or empty array | MEMCON T1a | Any non-empty unresolved set needs review |
| `stalenessRisk` | Required | string enum | `NONE`, `LOW`, `MEDIUM`, `HIGH` | MEMCON T1a + knowledge maintenance | `HIGH` requires operator decision |
| `knowledgeMaintenanceSignals` | Optional | string array | `lint`, `contradiction`, `drift`, `orphan`, `staleness` | `KnowledgeMaintenanceSignalType` | Reuses existing taxonomy |
| `retrievalEligibility` | Required | string enum | `ELIGIBLE`, `INELIGIBLE`, `BLOCKED_SOURCE_MISSING`, `BLOCKED_CONFLICT`, `BLOCKED_STALE`, `BLOCKED_TIME_AMBIGUOUS`, `BLOCKED_SENSITIVE` | MEMCON T1a + retrieval policy | Any `BLOCKED_*` prevents retrieval packaging |
| `operatorReviewRequired` | Required | boolean | `true`, `false` | MEMCON T1a | `true` keeps candidate out of durable promotion |

## ConsolidatedMemoryRecord Field Table

`ConsolidatedMemoryRecord` is a candidate that passed consolidation gates and
is eligible for later storage and downstream retrieval packaging.

| Field | Requirement | Type | Allowed values / source | Owner source | Notes |
| --- | --- | --- | --- | --- | --- |
| `recordId` | Required | string | stable unique ID | T1b appendix | Separate from `candidateId` |
| `sourceCandidateIds` | Required | string array | `candidateId` values | T1b appendix | Must contain at least one ID |
| `canonicalClaim` | Required | string | normalized claim | inherited from candidate | Must be source-backed |
| `sourceAuthority` | Required | string | repo path, artifact hash, work-order ref, or operator ref | inherited from candidate | Empty value blocks record |
| `confidenceLevel` | Required | string enum | `HIGH`, `MEDIUM`, `LOW`, `UNVERIFIED` | inherited from candidate | `UNVERIFIED` is not durable-ready without review |
| `scope` | Required | string enum | `session`, `project`, `organization`, `global` | `MemoryTier` owner | `global` requires stricter operator review |
| `memoryTierHint` | Optional | string enum | `working`, `task`, `skill`, `organizational`, `long-term`, `audit`, `receipt` | `MemoryTier` owner | Hint only in T1b |
| `timeReferences` | Required | string array | absolute dates or `NO_TIME_REFERENCE` | MEMCON T1a | No unresolved relative dates |
| `temporalNormalizationStatus` | Required | string enum | `ABSOLUTE_DATE_PRESENT`, `NORMALIZED_TO_ABSOLUTE_DATE`, `NO_TIME_REFERENCE` | MEMCON T1a | `TIME_AMBIGUOUS_BLOCKED` is forbidden on promoted records |
| `consolidationDecision` | Required | string enum | `CONSOLIDATED`, `MERGED`, `SUPERSEDED`, `PRUNED_LOW_VALUE`, `BLOCKED_CONFLICT`, `BLOCKED_STALE`, `BLOCKED_TIME_AMBIGUOUS`, `DEFERRED_NEEDS_OPERATOR` | MEMCON T1a | `BLOCKED_*` and `DEFERRED_*` are not retrieval-ready |
| `supersedes` | Required | string array | `recordId` or `candidateId` values | MEMCON T1a | Empty array allowed |
| `supersededBy` | Nullable | string or null | newer `recordId` or null | MEMCON T1a | Required even when null |
| `lastValidatedDate` | Required | string date | `YYYY-MM-DD` | MEMCON T1a | Must be absolute |
| `nextReviewDate` | Required | string date | `YYYY-MM-DD` | MEMCON T1a | Must be absolute |
| `staleReason` | Nullable | string or null | concise reason | MEMCON T1a + knowledge maintenance | Required when staleness blocks |
| `operatorDecision` | Nullable | string or null | operator approval, override, reject, or null | MEMCON T1a | Required for conflict/staleness override |
| `contradiction_flag` | Required | boolean | `true`, `false` | `W7MemoryRecord` | Use existing W7 field name |
| `retrievalBoundary` | Required | string enum | `SUMMARY_ONLY`, `FULL_WITH_SOURCE`, `NOT_RETRIEVABLE`, `OPERATOR_ONLY` | MEMCON T1a | `FULL_WITH_SOURCE` still excludes raw transcript release |
| `retrievalEligibility` | Required | string enum | `ELIGIBLE`, `INELIGIBLE`, `BLOCKED_SOURCE_MISSING`, `BLOCKED_CONFLICT`, `BLOCKED_STALE`, `BLOCKED_TIME_AMBIGUOUS`, `BLOCKED_SENSITIVE` | MEMCON T1a + retrieval policy | Must align with lifecycle and decision |
| `rawMemoryReleased` | Required | boolean literal | `false` | controlled memory gateway and retrieval policy | Literal invariant for every retrieval-facing output |

## MemoryRetrievalPackInput Field Table

`MemoryRetrievalPackInput` is the doc-only shape for later MEMCON-to-retrieval
handoff work. It does not change the existing runtime workflow chain.

| Field | Requirement | Type | Allowed values / source | Owner source | Notes |
| --- | --- | --- | --- | --- | --- |
| `packId` | Required | string | stable unique ID | T1b appendix | Local to review packet |
| `requestContext` | Required | string | bounded task context summary | T1b appendix | Must not contain raw memory dumps |
| `selectedRecordIds` | Required | string array | `recordId` values | T1b appendix | Only retrieval-eligible records |
| `excludedRecordIds` | Required | string array | `recordId` values | T1b appendix | Empty array allowed |
| `exclusionReasons` | Required | object | record ID to reason | T1b appendix | Reasons must name block token |
| `summaryOnly` | Required | boolean literal | `true` | MEMCON T1a boundary | Later runtime can narrow, not widen, without authorization |
| `rawMemoryReleased` | Required | boolean literal | `false` | controlled memory gateway and retrieval policy | Must stay false |
| `sourceAuthorityIncluded` | Required | boolean | `true`, `false` | MEMCON T1a | `false` requires reason |
| `confidenceIncluded` | Required | boolean | `true`, `false` | MEMCON T1a | `false` requires reason |
| `retrievalConsumer` | Required | string | target agent, route, or review packet | T1b appendix | No provider call implied |
| `generatedAtDate` | Required | string date | `YYYY-MM-DD` | MEMCON T1a | Absolute date only |

## OperatorMemoryReviewPacket Field Table

`OperatorMemoryReviewPacket` is the Markdown-first visible-control packet that
shows what memory is kept, blocked, merged, stale, or pruned.

| Field | Requirement | Type | Allowed values / source | Owner source | Notes |
| --- | --- | --- | --- | --- | --- |
| `packetId` | Required | string | stable unique ID | T1b appendix | Must identify the review packet |
| `generatedAtDate` | Required | string date | `YYYY-MM-DD` | MEMCON T1a | Absolute date only |
| `activeConsolidatedMemories` | Required | record list | `ConsolidatedMemoryRecord` summaries | MEMCON T1a | Summary only |
| `newCandidateMemories` | Required | record list | `MemoryCandidate` summaries | MEMCON T1a | Must include source authority |
| `conflictsRequiringDecision` | Required | record list | candidates or records | MEMCON T1a + knowledge maintenance | Must name conflict IDs |
| `staleOrOutdatedMemories` | Required | record list | candidates or records | MEMCON T1a + knowledge maintenance | Must name staleness reason |
| `temporalAmbiguityBlocks` | Required | record list | candidates with `TIME_AMBIGUOUS_BLOCKED` | MEMCON T1a | Operator-visible repair queue |
| `prunedOrRejectedNoise` | Required | record list | rejected signals or low-value candidates | MEMCON T1a | Visible pruning, not silent deletion |
| `retrievalEligiblePackPreview` | Optional | object | `MemoryRetrievalPackInput` summary | T1b appendix | No runtime retrieval implied |
| `operatorActionsRequired` | Required | string array | approve, reject, merge, update date, provide source, archive | MEMCON T1a | Empty array allowed only when no decisions remain |
| `claimBoundary` | Required | string | bounded claim text | CVF closure-quality gate | Must avoid readiness overclaim |
| `publicExportDisposition` | Required | string enum | `EXPORTED`, `DEFERRED_PRIVATE_ONLY`, `BLOCKED_MISSING_PUBLIC_ARTIFACTS` | public export disposition standard | T1b uses `DEFERRED_PRIVATE_ONLY` |

## Promotion And Blocking Rules

| Rule | Required behavior |
| --- | --- |
| Source authority | `MemoryCandidate.sourceAuthority` and `ConsolidatedMemoryRecord.sourceAuthority` must be non-empty |
| Relative date | durable or retrieval-facing fields must use absolute dates or `NO_TIME_REFERENCE` |
| Time ambiguity | `TIME_AMBIGUOUS_BLOCKED` prevents promotion to `ConsolidatedMemoryRecord` |
| Conflict | unresolved `conflictSetIds` require operator decision |
| Staleness | `stalenessRisk=HIGH` requires operator decision before promotion |
| Sensitive data | `sensitiveDataFlag=true` prevents direct context release |
| Raw release | every retrieval-facing shape must carry `rawMemoryReleased=false` |
| Visibility | pruning, stale blocking, and conflict blocking must appear in the operator packet |

## Runtime Collision Evidence

Search commands used:

```powershell
rg -n "MemorySignal|MemoryCandidate|ConsolidatedMemoryRecord" EXTENSIONS governance --glob '!**/node_modules/**'
rg -n "MemorySignal|MemoryCandidate|ConsolidatedMemoryRecord" docs/reference docs/roadmaps docs/reviews docs/baselines
```

| Proposed symbol | Runtime/source owner result | Collision disposition |
| --- | --- | --- |
| `MemorySignal` | No runtime type/interface/function owner found in `EXTENSIONS/` or `governance/` | DOC_ONLY_NEW in T1b |
| `MemoryCandidate` | No runtime type/interface owner found; helper functions `graphNodeToMemoryCandidate` and `kgrNodeToMemoryCandidate` exist, and `MemoryRetrievalCandidate` is an existing retrieval-stage interface | DOC_ONLY_NEW; do not confuse with `MemoryRetrievalCandidate` |
| `ConsolidatedMemoryRecord` | No runtime type/interface/function owner found in `EXTENSIONS/` or `governance/` | DOC_ONLY_NEW in T1b |

Doc collisions are expected: these symbols are already present in the MEMCON
roadmap and T1a artifacts as doc-only vocabulary.

## Machine-Check Handoff Notes For MEMCON-T2

T2 may check for:

- missing source-authority fields;
- relative date phrases in durable or retrieval-facing fields;
- `TIME_AMBIGUOUS_BLOCKED` incorrectly promoted;
- missing `rawMemoryReleased=false` on retrieval-facing sections;
- missing operator-visible conflict, stale, or pruning sections;
- missing public export disposition in review packets;
- field-table drift from this appendix.

T2 must remain separately authorized and must not treat this appendix as runtime
implementation evidence.

## Claim Boundary

This appendix defines doc-only schema fields for the MEMCON pre-store
consolidation chain. It does not implement runtime types, storage, retrieval,
operator UI, provider calls, Policy_Local behavior, EC activation, T12 unlock,
public-sync export, production/public readiness, memory reinjection,
high-risk promotion, or autonomous mutation.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private Memory Plane foundation schema; no public-sync export is
authorized in MEMCON-T1b.
