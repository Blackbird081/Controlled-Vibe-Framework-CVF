# CVF MSEA R41 T1 - MinerU File Backed Persistence Release Authority Decision Matrix

Memory class: reference-decision

docType: reference

Status: ACTIVE_REFERENCE

Created: 2026-07-06

rawMemoryReleased: false

EPISTEMIC_PROCESS_NA_WITH_REASON: this is an authority-posture decision over
already-established source and closure evidence, not an empirical
prediction-versus-outcome comparison against new observation.

## Purpose

Decide, from current repository source and governed closure artifacts only,
whether MinerU file-backed persistence release - the second of the four held
authority lanes named by R38 T4 - is ready for a future narrow implementation
work order, must remain held pending authority gaps, or is blocked by a
source conflict.

## Scope / Applies To

Applies only to the file-backed persistence release authority lane named by
R38 T4 as one of four held authority lanes. Does not apply to production
Memory/RAG route release (decided separately by R39-T1), provider/live proof
(closed separately by R40-T1), or use-case/legal workflow, which are separate
lanes requiring their own authority decisions. Does not implement, execute,
or invoke file-backed persistence, MinerU runtime, or production Memory/RAG
behavior.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Durable memory store exposes a file-backed factory function | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | lines 106-111 | `createFileBackedDurableMemoryStore` | durable memory store | EXISTS | ACCEPT |
| Durable memory receipt keeps summary-only, non-reinject, and raw-release-false invariants regardless of persistence mode | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | lines 46-48 | `summaryOnly`; `canReinject`; `rawMemoryReleased` | `DurableMemoryReceipt` | VALUE_SET | ACCEPT |
| File-backed store class reads and writes JSON records from a caller-supplied file path | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | lines 415-452 | `FileBackedDurableMemoryStore` | durable memory store | EXISTS | ACCEPT |
| File-backed store write path creates parent directories and serializes all records to disk on every upsert | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | lines 448-451 | `writeAll` | `FileBackedDurableMemoryStore` | RUNTIME_BEHAVIOR | ACCEPT |
| Memory/RAG route release helper carries a literal production-not-authorized invariant independent of persistence mode | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-memory-rag-route-release.ts` | lines 33-34 and 64 | `MEMORY_RAG_ROUTE_RELEASE_NOT_PRODUCTION_AUTHORIZED_BY_T22`; `productionRouteAuthorized` | MinerU Memory/RAG route release candidate | VALUE_SET | ACCEPT |
| System-chain route candidate models file-backed persistence as an explicit authority field on its input, not an implicit default | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | lines 36-44 | `MineruSystemChainRouteAuthority`; `fileBackedPersistenceRequested` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| System-chain route candidate fails closed the moment file-backed persistence is requested, before any route or store logic runs | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | lines 105-110 | `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` | MinerU system-chain route candidate | VALUE_SET | ACCEPT |
| System-chain route candidate's persistence-mode type is structurally restricted to a single literal value covering only in-process persistence | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | line 34 | `MineruSystemChainPersistenceMode` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| Accepted candidate result path returns persistence mode `"in-process-only"` only after all authority checks, including the file-backed rejection check, pass | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | lines 153-162 | `persistenceMode` | MinerU system-chain route candidate | VALUE_SET | ACCEPT |
| Internal harness always sets `fileBackedPersistenceUsed` to the literal `false` and always builds its default input with `fileBackedPersistenceRequested: false` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-internal-system-chain-harness.ts` | lines 49 and 111 | `fileBackedPersistenceUsed`; `fileBackedPersistenceRequested` | MinerU internal system-chain harness | VALUE_SET | ACCEPT |
| R38 T4 preserved file-backed persistence as a held authority lane needing a fresh packet | `docs/reference/CVF_MSEA_R38_T4_MINERU_TO_MEMORY_SCANLAYER_RELEASE_GATE_DECISION_2026-07-06.md` | lines 60-64 and 71 | `file-backed persistence` | R38 release-gate decision | VALUE_SET | ACCEPT |
| R39 T1 held production Memory/RAG route release pending authority gaps, using the same source chain this matrix inspects | `docs/reference/CVF_MSEA_R39_T1_MINERU_PRODUCTION_MEMORY_RAG_ROUTE_RELEASE_AUTHORITY_DECISION_MATRIX_2026-07-06.md` | line 89 | `R39_PRODUCTION_MEMORY_RAG_ROUTE_RELEASE_HELD_PENDING_AUTHORITY_GAPS` | R39-T1 authority decision matrix | VALUE_SET | ACCEPT |
| R39 T1 named the missing authority gaps as a fresh memory-owner GC-018 and an explicit production-persistence authorization decision, neither of which this packet supplies | `docs/reference/CVF_MSEA_R39_T1_MINERU_PRODUCTION_MEMORY_RAG_ROUTE_RELEASE_AUTHORITY_DECISION_MATRIX_2026-07-06.md` | lines 95-96 | `Hold / Release Consequence Matrix` | R39-T1 authority decision matrix | VALUE_SET | ACCEPT |
| R40 T1 completed only bounded provider-live proof and did not release file-backed persistence or any production route | `docs/reviews/CVF_MSEA_R40_T1_MINERU_SYSTEM_CHAIN_PROVIDER_LIVE_PROOF_COMPLETION_2026-07-06.md` | line 55 and lines 103-106 | `R40_T1_PROVIDER_LIVE_PROOF_COMPLETE_BOUNDED_PRIVATE` | R40-T1 completion review | VALUE_SET | ACCEPT |
| Active session next allowed move routes to R41-T1 no-commit docs-only worker execution creating only the decision matrix and worker return | `CVF_SESSION_MEMORY.md` | Next Allowed Move section | `msea_r41_t1_mineru_file_backed_persistence_release_authority_decision_dispatched_pending_worker_return` | active session front door | VALUE_SET | ACCEPT |

## Decision Options

| Token | Meaning |
| --- | --- |
| `R41_T1_FILE_BACKED_PERSISTENCE_RELEASE_READY_FOR_NARROW_IMPLEMENTATION_PACKET` | Source evidence is sufficient to open a future narrow implementation work order for file-backed persistence release |
| `R41_T1_FILE_BACKED_PERSISTENCE_RELEASE_HELD_PENDING_AUTHORITY_GAPS` | File-backed persistence release remains held because named authority gaps are missing, not because source is missing or conflicting |
| `R41_T1_FILE_BACKED_PERSISTENCE_RELEASE_REJECTED_STOP` | File-backed persistence release is rejected outright and no further packet in this lane is worth authoring |

## Reasoning

Current source shows that a file-backed persistence **implementation**
already exists (`createFileBackedDurableMemoryStore`,
`FileBackedDurableMemoryStore`) and is fully capable of writing durable
memory records to disk. That existence fact is real and is accepted above.
But existence of the file-backed store class is not the same question as
release authority for using it inside the MinerU system chain: the
system-chain route candidate that actually gates MinerU's use of any durable
store treats `fileBackedPersistenceRequested` as an explicit authority input
and fails closed with `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` the
moment that flag is anything other than `false`, before any store or route
logic executes. The persistence-mode type the accepted candidate path can
ever return is structurally limited to the single literal `"in-process-only"`
value - there is no code path in the current system-chain route candidate
that can produce a `"file-backed"` or equivalent persistence-mode result. The
internal harness's default input also hard-codes
`fileBackedPersistenceRequested: false`, so no default or harness invocation
exercises the file-backed branch either.

This is exactly the same shape of held posture R39-T1 found for production
Memory/RAG route release, using an overlapping citation set
(`mineru-memory-rag-route-release.ts`,
`mineru-system-chain-route-candidate.ts`): a mature, internally consistent,
fail-closed source chain that a future implementation work order could be
authored against, but not a chain whose current tokens or R38/R39/R40
closure evidence supply the specific authority a persistence-mode change
would require. R39-T1 already named two concrete authority gaps for the
overlapping production-route question - a fresh memory-owner GC-018 and an
explicit production-persistence authorization decision - and R41-T1 has not
supplied either. R40-T1 closed only the bounded provider-live proof lane and
explicitly did not release file-backed persistence. No new source or
governed-artifact evidence has appeared since R38/R39/R40 that would supply
the missing authority for a persistence-mode change.

The `READY_FOR_NARROW_IMPLEMENTATION_PACKET` token would only be correct if
this decision itself supplied the missing authority (a persistence-mode
authorization) or if the current source already had a route to accept a
file-backed request; neither is true, so selecting that token would treat
file-backed source existence as if it were release authority, which is
exactly the negative edge case this packet must reject. `REJECTED_STOP` is
also incorrect: nothing in the cited source or governed evidence shows
file-backed persistence release is a bad idea in principle, only that the
authority to change the fail-closed persistence-mode restriction has not yet
been granted by any accepted packet - that is a held-pending-authority
posture, not a rejection. `BLOCKED_SOURCE_CONFLICT` is rejected because no
cited source anchor conflicts with any other cited anchor: the store-layer
file-backed implementation and the system-chain route candidate's
fail-closed restriction on that same capability are not in tension, they are
two different layers (a general-purpose durable-store implementation choice
versus a MinerU-specific system-chain authority gate) agreeing that the gate
has not been opened.

## Selected Disposition

`R41_T1_FILE_BACKED_PERSISTENCE_RELEASE_HELD_PENDING_AUTHORITY_GAPS`

## File-Backed Source Existence Is Not Release Authority

This matrix explicitly rejects treating the existence of
`createFileBackedDurableMemoryStore` and `FileBackedDurableMemoryStore` as
release authority for MinerU file-backed persistence. The durable-memory
store module is a general-purpose building block that predates and sits
outside the MinerU system chain; its file-backed factory function existing
in source only shows that a file-backed store *can be constructed* by any
caller, not that the MinerU system-chain route candidate is authorized to
request or receive one. The actual authority gate for MinerU is the
system-chain route candidate's `fileBackedPersistenceRequested` field and its
`FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` rejection path, and that gate
remains closed in current source. Release authority requires a fresh,
explicit, source-verified persistence-mode authorization decision naming
which actor may set `fileBackedPersistenceRequested: true` and under what
receipt/invariant conditions - not the mere presence of a working file-backed
class in a shared library module.

## Hold / Release Consequence Matrix

| Surface | Current state | Remains unauthorized until |
| --- | --- | --- |
| MinerU system-chain file-backed persistence invocation | Held by `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` and the `MineruSystemChainPersistenceMode` type restricted to `"in-process-only"` | A dedicated, source-verified persistence-mode authorization decision is accepted and the system-chain route candidate's persistence-mode type and fail-closed check are deliberately widened in an accepted implementation packet |
| Production Memory/RAG route release | Held by `MEMORY_RAG_ROUTE_RELEASE_NOT_PRODUCTION_AUTHORIZED_BY_T22` and `PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY` | Decided separately by R39-T1; not reopened by this packet |
| Private/generated MinerU output content | Held by `R30_PRIVATE_OUTPUT_POLICY_NOT_RELEASED` | A dedicated private-output policy packet is accepted |
| Provider/live proof | Closed only as bounded private provenance evidence by `R40_T1_PROVIDER_LIVE_PROOF_COMPLETE_BOUNDED_PRIVATE`; not a persistence or production release | A dedicated production-readiness packet, separate from bounded live-proof evidence, is accepted |
| Retrieval, vectorization | Not implemented by any cited source in this lane | A future implementation packet explicitly authorizes and builds them |
| Use-case/legal workflow | Out of scope for this packet | A separately selected, source-verified roadmap opens it |
| Public-sync, public claim | Out of scope for this packet | A separate public-sync packet with its own claim boundary is authored |
| Worker commit, push | Not authorized by this work order | Reviewer/closer owns the material closure commit; push requires separate explicit operator confirmation |

## Next Move

Next allowed move: a fresh, source-verified GC-018 and work order authoring
a persistence-mode authorization packet naming the specific authority gap
this decision confirms is missing (an explicit decision on who may set
`fileBackedPersistenceRequested: true` in the MinerU system-chain route
candidate and under what receipt/invariant conditions), or operator
selection of a different held lane (production Memory/RAG memory-owner
authorization packet per R39-T1's next move, private-output policy, or
use-case/legal workflow). No implementation, persistence-mode widening,
runtime wiring, or file-backed production release is authorized by this
decision.

## Claim Boundary

This decision matrix is docs-only. It does not implement, execute, or
invoke file-backed persistence, does not construct or write to any
file-backed durable store, does not run MinerU runtime, does not read or
release private/generated MinerU output content, does not invoke production
Memory/RAG behavior, retrieval, or vectorization, does not perform any
provider/live call, and does not create a public-sync, public claim, or
production-readiness claim. It records an authority-posture decision only,
based on the Source Verification Block above, and explicitly treats
file-backed source existence as distinct from file-backed release authority.
