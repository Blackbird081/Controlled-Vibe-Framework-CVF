# CVF Memory Consolidation Cross-Agent Consistency Contract

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-13

Version: `cvf.memoryConsolidationCrossAgentConsistency.t5.v1`

MEMCON tranche: T5

Parent roadmap:
`docs/roadmaps/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_ROADMAP_2026-06-12.md`

Parent standard:
`docs/reference/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_STANDARD_2026-06-12.md`

Schema appendix:
`docs/reference/CVF_MEMORY_CONSOLIDATION_SCHEMA_APPENDIX_2026-06-13.md`

GC-018:
`docs/baselines/CVF_GC018_MEMCON_T5_CROSS_AGENT_MEMORY_CONSISTENCY_CONTRACT_2026-06-13.md`

rawMemoryReleased=false

---

## Purpose

Define the shared-ledger rules and field semantics that prevent Codex, Claude,
Gemini, or any future worker from writing separate authoritative memories
without source-backed reconciliation and explicit operator confirmation.

This contract is documentation-only. It does not implement runtime memory
storage, retrieval behavior, route wiring, provider calls, Policy_Local
mutation, public-sync, or autonomous memory mutation.

---

## Scope

In scope:

- Shared cross-agent memory ledger row shape and required fields.
- Source-authority rules for cross-agent memory claims.
- Conflict detection and resolution ownership requirements.
- Operator confirmation boundary.
- `rawMemoryReleased=false` invariant preservation.
- Claim-boundary and public-export disposition.

Out of scope:

- Runtime storage or durable write implementation.
- Retrieval packaging or integration.
- Provider or API calls.
- Policy_Local mutation.
- Public-sync.
- Route or API wiring.
- Autonomous memory mutation or reinjection.

---

## Authority Chain

| Authority | Path | Disposition |
| --- | --- | --- |
| MEMCON-T1a standard | `docs/reference/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_STANDARD_2026-06-12.md` | ACCEPT |
| MEMCON-T1b schema appendix | `docs/reference/CVF_MEMORY_CONSOLIDATION_SCHEMA_APPENDIX_2026-06-13.md` | ACCEPT |
| MEMCON-T2 artifact quality checker | `governance/compat/check_memory_consolidation_artifact_quality.py` | ACCEPT |
| MEMCON-T3 operator packet contract | `docs/reference/CVF_MEMORY_CONSOLIDATION_LEDGER_OPERATOR_PACKET_CONTRACT_2026-06-13.md` | ACCEPT |
| MEMCON-T4 retrieval boundary completion | `docs/reviews/CVF_MEMCON_T4_RETRIEVAL_PACK_BOUNDARY_CONFORMANCE_COMPLETION_2026-06-13.md` | ACCEPT |
| GC-018 baseline | `docs/baselines/CVF_GC018_MEMCON_T5_CROSS_AGENT_MEMORY_CONSISTENCY_CONTRACT_2026-06-13.md` | ACCEPT |

---

## Core Problem This Contract Addresses

Without a shared ledger, Codex may record: "MEMCON-T1a is the foundation."
Claude may simultaneously record: "MEMCON-T1a standard is deferred."
Gemini may have no record of MEMCON-T1a at all.

These three states are incompatible. If any agent acts on its local view as
authoritative without reconciliation, contradictory governance decisions result.
This contract defines the rules that make cross-agent memory claims visible,
reconcilable, and operator-confirmed before they become authoritative.

---

## Shared Ledger Row Shape

Every cross-agent memory claim submitted to the shared consistency ledger must
carry the following fields. Fields marked Required must be non-empty. Fields
marked Optional may be absent when not applicable. Fields marked Nullable must
be present and may carry null.

| Field | Requirement | Type | Allowed values | Owner source | Notes |
| --- | --- | --- | --- | --- | --- |
| `claimId` | Required | string | stable unique ID | T5 contract | Unique across the ledger |
| `agentSource` | Required | string | `codex`, `claude`, `gemini`, or named agent ID | `MemorySignal.agentSource` (schema appendix line 91) | Required for cross-agent accountability |
| `agentRole` | Required | string enum | `orchestrator`, `worker`, `reviewer`, `operator` | T5 doc-only field (roadmap lines 581-591) | Doc-only role label; not runtime RBAC |
| `sourceArtifact` | Required | string | repo path, artifact hash, work-order ref, or operator ref | T5 doc-only field (roadmap lines 581-591) | Must be a verifiable source reference, not hidden memory alone |
| `canonicalClaim` | Required | string | normalized claim text | `MemoryCandidate.canonicalClaim` (schema appendix line 107) | Must not contain unresolved relative dates |
| `sourceAuthority` | Required | string | repo path, artifact hash, work-order ref, or operator ref | `ConsolidatedMemoryRecord.sourceAuthority` (schema appendix line 132) | Empty value blocks authority |
| `confidenceLevel` | Required | string enum | `HIGH`, `MEDIUM`, `LOW`, `UNVERIFIED` | `MemoryCandidate.confidenceLevel` (schema appendix line 109) | `UNVERIFIED` requires operator review |
| `claimBoundary` | Required | string | bounded claim text stating what the claim proves and does not prove | `OperatorMemoryReviewPacket.claimBoundary` (schema appendix line 185) | Must avoid readiness overclaim |
| `conflictsWithAgentMemory` | Required | string array | `claimId` values or empty array | T5 doc-only field (roadmap lines 581-591) | Non-empty means conflict requiring resolution |
| `resolutionOwner` | Nullable | string or null | agent ID, `operator`, or null | T5 doc-only field (roadmap lines 581-591) | Must be set when `conflictsWithAgentMemory` is non-empty |
| `operatorConfirmed` | Required | boolean | `true`, `false` | T5 doc-only field (roadmap lines 581-591) | `false` means the claim is pending; only `true` claims may become authoritative |
| `operatorDecision` | Nullable | string or null | approve, reject, merge, defer, or null | `ConsolidatedMemoryRecord.operatorDecision` (schema appendix line 143) | Required when `operatorConfirmed=true`; null until confirmation |
| `rawMemoryReleased` | Required | boolean literal | `false` | controlled memory gateway; `MemorySignal.rawEvidenceReleased` (schema appendix line 93) | Literal invariant; never `true` |
| `submittedDate` | Required | string date | `YYYY-MM-DD` | MEMCON-T1a temporal rule | Absolute date; relative phrases are forbidden |
| `ledgerStatus` | Required | string enum | `PENDING`, `ALIGNED`, `CONFLICTED`, `RESOLVED`, `OPERATOR_CONFIRMED`, `REJECTED`, `NOISE` | T5 contract | Tracks the claim lifecycle in the ledger |

---

## Source-Authority Rules

Every cross-agent memory claim must carry a non-empty `sourceArtifact` and
`sourceAuthority`. Allowed source values are:

- A repository path to a binding standard, governed review, work order, or
  completion artifact.
- An artifact hash reference for immutable evidence.
- An operator-provided reference with date and scope.

A claim with empty `sourceAuthority` or `sourceArtifact` must receive
`ledgerStatus=PENDING` and must not proceed to `ALIGNED` or
`OPERATOR_CONFIRMED` status.

Hidden agent memory alone is insufficient source authority. A claim grounded
only in an agent's inference from its training data or prior session context
must carry `confidenceLevel=UNVERIFIED` and `ledgerStatus=PENDING` until an
external source reference is added.

---

## Conflict Detection Rule

When two agents submit claims whose `canonicalClaim` content or `sourceAuthority`
coverage is inconsistent:

- The later claim must list the prior `claimId` in its
  `conflictsWithAgentMemory` array.
- Both claims must be given `ledgerStatus=CONFLICTED`.
- A `resolutionOwner` must be assigned (typically `operator` or the
  orchestrator agent).
- Neither claim may advance to `ALIGNED` or `OPERATOR_CONFIRMED` status until
  the conflict is resolved.

If an agent submits a claim that is semantically identical to a prior claim
from a different agent with the same `sourceArtifact`, it must be marked
`ledgerStatus=NOISE` rather than creating a redundant conflict.

---

## Resolution Ownership Rule

Every `CONFLICTED` claim must name a `resolutionOwner`. The resolution owner
is the agent or operator responsible for deciding which claim is authoritative.

Resolution steps:

1. `resolutionOwner` evaluates both claims against their `sourceArtifact` and
   `sourceAuthority` references.
2. One of: approve one claim, merge both into a new consolidated claim, or
   reject both and defer.
3. Resolution must produce an updated `operatorDecision` on the winning claim
   and `ledgerStatus=RESOLVED` on losing claims.
4. `operatorConfirmed` must remain `false` until an operator explicitly sets it
   `true`. Agent resolution alone does not advance a claim to
   `OPERATOR_CONFIRMED`.

---

## Operator Confirmation Boundary

A cross-agent memory claim may only become authoritative when:

1. `ledgerStatus=OPERATOR_CONFIRMED`; and
2. `operatorConfirmed=true`; and
3. `operatorDecision` names the confirmation action (approve, merge); and
4. `sourceAuthority` is non-empty; and
5. `rawMemoryReleased=false`.

A claim with `operatorConfirmed=false` must not be used as authoritative
governance evidence by any agent, even if its `ledgerStatus` is `ALIGNED` or
`RESOLVED`.

No agent may autonomously set `operatorConfirmed=true`. This field may only
be set by an explicit operator action recorded in the governed packet.

---

## Autonomous Mutation Prohibition

No agent may:

- silently overwrite another agent's memory claim without recording a conflict
  row;
- promote its own claim to `OPERATOR_CONFIRMED` without an explicit operator
  decision;
- merge conflicting claims without a named `resolutionOwner` decision;
- write to the shared ledger outside of a governed work order with an active
  GC-018 baseline.

Violation of these rules is a governance learning candidate that must be
promoted to a written rule per the CVF Agent Error to Governance Learning
Philosophy.

---

## rawMemoryReleased Invariant

Every ledger row, consistency packet, review packet, and downstream retrieval
shape that references cross-agent memory claims must carry:

```
rawMemoryReleased=false
```

This invariant is inherited from the controlled memory gateway and retrieval
policy boundary established in MEMCON-T1a through T4. The cross-agent
consistency contract does not modify this invariant.

---

## Ledger Status Lifecycle

```
PENDING
  |
  +--> ALIGNED          (no conflict; source-backed; pending operator review)
  |      |
  |      +--> OPERATOR_CONFIRMED  (operator explicitly sets operatorConfirmed=true)
  |
  +--> CONFLICTED       (conflict detected with another agent's claim)
  |      |
  |      +--> RESOLVED  (resolution owner decides; losing claim marked RESOLVED)
  |      |      |
  |      |      +--> OPERATOR_CONFIRMED  (operator confirms winning claim)
  |      |
  |      +--> REJECTED  (resolution owner rejects both claims)
  |
  +--> NOISE            (duplicate or low-signal; no conflict needed)
```

---

## Relationship to Existing MEMCON Owner Surfaces

| Existing surface | Relationship to T5 |
| --- | --- |
| `MemorySignal.agentSource` (schema appendix) | T5 inherits this field for cross-agent tracking |
| `MemoryCandidate.conflictSetIds` (schema appendix) | T5 cross-agent conflicts are a superset; ledger tracks cross-agent scope |
| `ConsolidatedMemoryRecord.operatorDecision` (schema appendix) | T5 adds `operatorConfirmed` as a separate explicit flag |
| `OperatorMemoryReviewPacket.claimBoundary` (schema appendix) | T5 requires per-row `claimBoundary` for all cross-agent claims |
| MEMCON-T3 operator packet (operator packet contract) | T5 cross-agent conflict rows appear in the T3 `Conflicts Requiring Decision` section |
| MEMCON-T4 retrieval boundary (T4 completion) | T5 claims with `ledgerStatus=OPERATOR_CONFIRMED` and `rawMemoryReleased=false` may be eligible for T4 pack boundary input; T5 does not wire this path |

T5 does not replace any existing owner surface. It adds the shared-ledger layer
that coordinates cross-agent claims before they can enter the MEMCON pre-store
chain.

---

## Claim Boundary

This contract defines doc-only rules for cross-agent memory consistency in CVF.
It does not prove cross-agent memory consistency is implemented in runtime,
durable memory storage exists, retrieval behavior changed, semantic correctness
is proven, provider calls are made, Policy_Local is ready, public catalog export
exists, OCR is available, memory reinjection is authorized, high-risk promotion
is authorized, or autonomous mutation is authorized.

rawMemoryReleased=false

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Private Memory Plane foundation contract for MEMCON-T5. Public-sync is not
authorized for this artifact. No public catalog claim is made from T5.
