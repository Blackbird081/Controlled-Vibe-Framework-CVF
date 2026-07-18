# CVF Memory Consolidation Ledger And Operator Packet Contract

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-13

sourceAuthority:
`docs/reference/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_STANDARD_2026-06-12.md`

rawMemoryReleased=false

GC-018:
`docs/baselines/CVF_GC018_MEMCON_T3_CONSOLIDATED_MEMORY_LEDGER_OPERATOR_PACKET_2026-06-13.md`

Parent work order:
`docs/work_orders/CVF_AGENT_WORK_ORDER_MEMCON_T3_CONSOLIDATED_MEMORY_LEDGER_OPERATOR_PACKET_FOR_CLAUDE_2026-06-13.md`

---

## Purpose

Define the consolidated memory ledger structure and the Markdown-first
Operator-Visible Memory Review Packet contract for MEMCON-T3.

This contract governs how `MemoryCandidate` and `ConsolidatedMemoryRecord`
instances are presented to operators in a categorized, inspectable format
before any retrieval-pack integration work begins. It does not implement
runtime storage, retrieval behavior, provider calls, or autonomous memory
mutation.

---

## Scope

In scope:

- Ledger purpose and authority chain.
- `MemoryCandidate` and `ConsolidatedMemoryRecord` usage boundaries.
- Record status categories and rendering rules for each category.
- Source-authority requirements for durable memory records.
- Conflict and staleness rendering rules.
- Temporal ambiguity rendering rule.
- Retrieval preview boundary with `rawMemoryReleased=false`.
- Operator action table.
- Sample packet fixture requirements.

Out of scope:

- Runtime memory storage or write implementation.
- Retrieval packaging or integration.
- Provider or API calls.
- Policy_Local mutation.
- Public-sync.
- Cross-agent consistency (MEMCON-T5 lane).
- JSON aggregate ledger (deferred to T3+ unless entries become append-heavy).

---

## Authority Chain

| Authority | Path | Disposition |
| --- | --- | --- |
| MEMCON-T1a standard | `docs/reference/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_STANDARD_2026-06-12.md` | ACCEPT |
| MEMCON-T1b schema appendix | `docs/reference/CVF_MEMORY_CONSOLIDATION_SCHEMA_APPENDIX_2026-06-13.md` | ACCEPT |
| MEMCON-T2 artifact quality checker | `governance/compat/check_memory_consolidation_artifact_quality.py` | ACCEPT |
| GC-018 baseline | `docs/baselines/CVF_GC018_MEMCON_T3_CONSOLIDATED_MEMORY_LEDGER_OPERATOR_PACKET_2026-06-13.md` | ACCEPT |
| JSON aggregate discipline | `docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md` | ACCEPT |

---

## MemoryCandidate And ConsolidatedMemoryRecord Boundaries

`MemoryCandidate` is a promoted raw signal that has not yet passed all
consolidation gates. It carries a `candidateId`, `sourceAuthority`,
`canonicalClaim`, and `retrievalEligibility`. Candidates are surfaced in the
operator packet under `New Candidate Memories` or in the appropriate blocking
category.

`ConsolidatedMemoryRecord` is a candidate that passed all consolidation gates.
It is eligible for later storage and downstream retrieval packaging. Every
consolidated record must carry non-empty `sourceAuthority` and
`rawMemoryReleased=false`.

A `ConsolidatedMemoryRecord` with `rawMemoryReleased=false` may appear in the
`Active Consolidated Memories` section and in the `Retrieval-Eligible Pack
Preview`. The raw release invariant must remain false throughout the operator
packet.

---

## Record Status Categories

| Status | Definition | Operator packet section |
| --- | --- | --- |
| Active consolidated | Passed all gates; retrieval-eligible | Active Consolidated Memories |
| New candidate | Promoted from signal; not yet consolidated | New Candidate Memories |
| Conflicted | Has unresolved `conflictSetIds` | Conflicts Requiring Decision |
| Stale or outdated | `stalenessRisk = HIGH` or expired `lastValidatedDate` | Stale Or Outdated Memories |
| Pruned or rejected noise | Discarded as `REJECT_NOISE` or `PRUNED_LOW_VALUE` | Pruned Or Rejected Noise |
| Temporal ambiguity blocked | `TIME_AMBIGUOUS_BLOCKED` prevents consolidation | Temporal Ambiguity Blocks |

---

## Source Authority Requirements

Every `MemoryCandidate` and `ConsolidatedMemoryRecord` must carry a non-empty
`sourceAuthority`. Allowed values:

- Repository path to a binding standard, review, work order, or governed
  artifact.
- Operator-provided reference with date and scope.
- Artifact hash reference for immutable evidence.

A record with empty `sourceAuthority` must receive
`retrievalEligibility = BLOCKED_SOURCE_MISSING` and must not proceed to
consolidation or retrieval packaging.

---

## Conflict And Staleness Rendering Rules

**Conflict rendering:**

A record with at least one unresolved `conflictSetId` must be placed in
`Conflicts Requiring Decision`. The entry must name:

- all conflicting `candidateId` or `recordId` values;
- the nature of the conflict (contradictory claim, scope overlap, or
  authority collision);
- the operator decision options (approve one, merge, reject all, request
  additional source).

**Staleness rendering:**

A record with `stalenessRisk = HIGH` or with `lastValidatedDate` before the
current governance cycle cutoff must be placed in `Stale Or Outdated
Memories`. The entry must name:

- the `staleReason`;
- the `lastValidatedDate`;
- the operator decision options (re-validate, archive, or supersede).

---

## Temporal Ambiguity Rendering Rule

A candidate with `temporalNormalizationStatus = TIME_AMBIGUOUS_BLOCKED` must
not proceed to consolidation. It must be surfaced in `Temporal Ambiguity
Blocks` with:

- the raw phrase that triggered the block;
- the resolution options (provide a normalized absolute date, record
  `NO_TIME_REFERENCE`, or discard);
- the blocked `candidateId`;
- the operator action required.

The operator packet must not promote a `TIME_AMBIGUOUS_BLOCKED` entry to an
active or retrieval-eligible status until the block is resolved.

---

## Retrieval Preview Boundary

Every section that lists `ConsolidatedMemoryRecord` entries eligible for
retrieval packaging must include the boundary marker:

```
rawMemoryReleased=false
```

This invariant is inherited from the `controlled-memory-gateway.ts` and
`memory-runtime-workflow-chain.ts` owner surfaces. The pre-store MEMCON
workflow chain does not modify this invariant.

The `Retrieval-Eligible Pack Preview` section must be clearly marked
`rawMemoryReleased=false` and must not imply that raw memory has been or
will be released to a retrieval consumer.

---

## Operator Action Table

| Action | Triggered by | Required operator input |
| --- | --- | --- |
| Approve and consolidate | New candidate passes gates | Operator confirmation |
| Reject candidate | Candidate fails quality or authority check | Rejection reason |
| Merge candidates | Duplicate or near-duplicate candidates | Merge target `candidateId` |
| Provide source | `sourceAuthority` is empty or insufficient | Valid source reference |
| Resolve conflict | Conflicting records | Decision for each conflict |
| Re-validate or archive stale record | Stale or outdated record | Updated `lastValidatedDate` or archive decision |
| Provide normalized date | `TIME_AMBIGUOUS_BLOCKED` candidate | Absolute date or `NO_TIME_REFERENCE` |
| Prune noise | `REJECT_NOISE` or `PRUNED_LOW_VALUE` decision | Prune reason |

---

## JSON Aggregate Ledger Boundary

Default route: do not create a JSON aggregate ledger in MEMCON-T3. The
Markdown operator packet is the primary operator-visible artifact.

If entries become large or append-heavy in a later tranche, a separate JSON
aggregate tranche must follow the generated aggregate discipline standard at:
`docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md`

Any JSON ledger must use a compact source directory, a deterministic
generator, and a drift-check command. Hand-editing a large JSON aggregate
without a generator is not permitted.

---

## Claim Boundary

This contract defines the structure and rendering rules for a Markdown-first
consolidated memory ledger and operator-visible review packet in CVF. It does
not prove runtime memory implementation, storage, retrieval behavior, semantic
memory correctness, provider calls, operator UI implementation, Policy_Local
mutation, EC activation, corpus ingestion, public readiness, production
readiness, or live governance behavior.

MEMCON-T3 artifacts are documentation-first and fixture-only. They do not
create executable code, modify runtime state, or authorize memory reinjection,
high-risk promotion, or autonomous mutation.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Private provenance reference contract for MEMCON-T3. Public-sync is not
authorized for this artifact. No public catalog claim is made.
