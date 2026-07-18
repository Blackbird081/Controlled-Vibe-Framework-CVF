# CVF MSEA R41 T2 - MinerU Persistence Mode Authorization Decision Matrix

Memory class: reference-decision

docType: reference

Status: ACTIVE_REFERENCE

Created: 2026-07-06

rawMemoryReleased: false

EPISTEMIC_PROCESS_NA_WITH_REASON: this is an authority-posture decision over
already-established source and closure evidence, not an empirical
prediction-versus-outcome comparison against new observation.

## Purpose

Decide, from current repository source and accepted R41-T1 closure evidence
only, who may set `fileBackedPersistenceRequested` to `true` in the MinerU
system-chain route candidate, under what receipt and invariant conditions,
and whether that specific authorization question is ready for a future
narrow implementation packet, must remain held pending authority gaps, or
should stop.

## Scope / Applies To

Applies only to the persistence-mode authorization question named by R41-T1
as the concrete next move: naming the actor and conditions that could widen
`MineruSystemChainPersistenceMode` beyond its current single literal value.
Does not apply to production Memory/RAG route release (already held
separately by R39-T1), provider/live proof (closed separately by R40-T1), or
use-case/legal workflow. Does not implement, execute, or invoke file-backed
persistence, MinerU runtime, or production Memory/RAG behavior.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| `fileBackedPersistenceRequested` is a plain boolean authority field with no actor-identity, role, or authorization-source type attached to it | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | lines 36-44 | `MineruSystemChainRouteAuthority` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| Persistence-mode type is a single-literal type with no second literal value or actor-parameterized variant defined anywhere in this file | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | line 33 | `MineruSystemChainPersistenceMode` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| The route candidate rejects any true `fileBackedPersistenceRequested` unconditionally, with no branch that inspects an actor, role, or authorization object before rejecting | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | lines 105-110 | `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| The route candidate's existing actor-facing authority field is `freshMemoryOwnerAuthorization: boolean`, a single flag with no actor-identity or role field of its own | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | line 38 | `freshMemoryOwnerAuthorization` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| Accepted route result reports `"in-process-only"` persistence mode; no code path returns any other persistence-mode literal | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | line 158 | `persistenceMode` | MinerU system-chain route candidate | VALUE_SET | ACCEPT |
| The memory-owner authorization object that does exist one layer down (`MineruMemoryOwnerAuthorization`) carries `actorRole` and `provenanceScore`, but is validated only against the T22 route-release helper, not against `fileBackedPersistenceRequested` at all | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-memory-rag-route-release.ts` | lines 40-46 | `MineruMemoryOwnerAuthorization` | MinerU Memory/RAG route release candidate | EXISTS | ACCEPT |
| Memory/RAG route release keeps `productionRouteAuthorized` false independent of persistence mode | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-memory-rag-route-release.ts` | lines 33-34 and 64 | `MEMORY_RAG_ROUTE_RELEASE_NOT_PRODUCTION_AUTHORIZED_BY_T22`; `productionRouteAuthorized` | MinerU Memory/RAG route release candidate | VALUE_SET | ACCEPT |
| Durable memory receipt's private-output invariants (`summaryOnly`, `canReinject`, `rawMemoryReleased`) are structural literal types on the receipt shape itself; they do not vary by persistence mode and are not, by themselves, an authorization mechanism for who may request file-backed persistence | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | lines 46-48 | `summaryOnly`; `canReinject`; `rawMemoryReleased` | `DurableMemoryReceipt` | EXISTS | ACCEPT |
| File-backed durable-memory store factory exists as a general-purpose constructor with a caller-supplied file path and no actor/authorization parameter of any kind | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | line 105 | `createFileBackedDurableMemoryStore` | durable memory store | EXISTS | ACCEPT |
| Internal harness default input hard-codes `fileBackedPersistenceRequested: false` and does not exercise any actor/authorization branch for file-backed persistence, because no such branch exists to exercise | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-internal-system-chain-harness.ts` | line 111 | `fileBackedPersistenceRequested` | MinerU internal system-chain harness | VALUE_SET | ACCEPT |
| Internal harness result always reports `fileBackedPersistenceUsed: false` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-internal-system-chain-harness.ts` | line 49 | `fileBackedPersistenceUsed` | MinerU internal system-chain harness result | VALUE_SET | ACCEPT |
| R41-T1 selected held disposition for file-backed persistence release pending authority gaps and named a persistence-mode authorization decision as the specific next allowed move | `docs/reference/CVF_MSEA_R41_T1_MINERU_FILE_BACKED_PERSISTENCE_RELEASE_AUTHORITY_DECISION_MATRIX_2026-07-06.md` | line 118 and Next Move section | `R41_T1_FILE_BACKED_PERSISTENCE_RELEASE_HELD_PENDING_AUTHORITY_GAPS` | R41-T1 decision matrix | VALUE_SET | ACCEPT |
| R41-T1 completion review accepted that held disposition and closed the file-backed release lane on that basis, routing next move to this exact authorization question | `docs/reviews/CVF_MSEA_R41_T1_MINERU_FILE_BACKED_PERSISTENCE_RELEASE_AUTHORITY_DECISION_COMPLETION_2026-07-06.md` | Reviewer Decision and Return-To-Orchestrator sections | `R41_T1_AUTHORITY_DECISION_COMPLETE_HELD_PENDING_AUTHORITY_GAPS` | R41-T1 completion review | VALUE_SET | ACCEPT |
| Active session front door names `fileBackedPersistenceRequested` as the field this next packet must resolve | `CVF_SESSION_MEMORY.md` | Next Allowed Move section | `fileBackedPersistenceRequested` | active session front door | VALUE_SET | ACCEPT |

## Decision Options

| Token | Meaning |
| --- | --- |
| `R41_T2_PERSISTENCE_MODE_AUTHORIZATION_READY_FOR_NARROW_IMPLEMENTATION_PACKET` | A specific authority actor and source-backed invariant conditions can be named now, and a future narrow implementation packet may be authored against them |
| `R41_T2_PERSISTENCE_MODE_AUTHORIZATION_HELD_PENDING_AUTHORITY_GAPS` | The authorization question remains held because the actor/condition question is a genuine authority gap this packet cannot supply, not a source gap |
| `R41_T2_PERSISTENCE_MODE_AUTHORIZATION_REJECTED_STOP` | Persistence-mode authorization is rejected outright and no further packet in this lane is worth authoring |

## Reasoning

Naming a real authority actor and invariant conditions requires two things to
already exist in source or governed evidence: (1) a place in the type system
or runtime logic where an actor identity, role, or authorization object is
actually checked before a persistence-mode decision is made, and (2) a
receipt or invariant field that would let a future implementation bind that
authorization to an auditable, fail-closed condition. Neither exists today.
`MineruSystemChainRouteAuthority.fileBackedPersistenceRequested` is a bare
boolean with no accompanying actor/role/authorization-object field on the
same interface, and the fail-closed check at
`FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` rejects unconditionally
without inspecting any actor field, because there is no actor field for it
to inspect. `MineruSystemChainPersistenceMode` is typed as the single
literal `"in-process-only"`, meaning there is no second literal value (for
example, an actor-scoped `"file-backed:<role>"` variant) for an authorization
decision to select.

The one place an actor-role concept does exist in the current chain -
`MineruMemoryOwnerAuthorization.actorRole` in
`mineru-memory-rag-route-release.ts` - is validated only against the T22
Memory/RAG route-release helper's own prerequisites (R27 prerequisites,
output-content-read, raw-memory-released, and similar invariants). It is
never read, checked, or referenced anywhere in
`mineru-system-chain-route-candidate.ts` in connection with
`fileBackedPersistenceRequested`. Reusing that same authorization object as
"the" persistence-mode authority actor would be an inference this matrix
must reject: the object's fields (`policyDecision`, `actorAuthorized`,
`provenanceScore`, `actorRole`, `targetDurableTier`) were defined and
source-verified for a different decision (Memory/RAG route-release
candidacy), and nothing in the cited source ties them to a persistence-mode
authorization semantics. Treating an unrelated authorization object as if it
already answered this question would repeat, in a new form, the exact
mistake R41-T1 rejected for file-backed store existence: assuming a nearby
structure is authority just because it is source-verified and adjacent.

The durable-memory receipt's structural invariants
(`summaryOnly: true`, `canReinject: false`, `rawMemoryReleased: false`) are
real and do constrain what any future write can look like, but they are
receipt-shape invariants that apply identically regardless of persistence
mode - they say what a written record must look like, not who may request
that it be written to a file instead of in-process memory. They are
necessary conditions a future implementation packet would have to preserve,
not sufficient conditions that answer the actor question this packet asks.

Because no source anchor names an actor, role, or authorization object that
the system-chain route candidate would check before accepting a
`fileBackedPersistenceRequested: true` request, this matrix cannot supply
`persistenceAuthorityActor`, `persistenceAuthorizationConditions`, or
`persistenceInvariantConditions` as source-backed facts. Inventing them here
would assert authority that the operator has not granted and that no
accepted governed artifact has named. This is precisely a held-pending-
authority-gap posture, not a source conflict (nothing in the cited files
disagrees with anything else) and not a rejection (nothing in the cited
evidence suggests persistence-mode authorization is a bad idea in
principle, only that this packet cannot supply the missing element).

`READY_FOR_NARROW_IMPLEMENTATION_PACKET` is rejected because selecting it
without a source-backed actor and condition set would authorize
implementation against an invented authority, which the work order's fail
conditions explicitly forbid ("Authority actor or invariant conditions are
asserted without source-backed evidence"). `REJECTED_STOP` is rejected
because no cited evidence shows persistence-mode authorization is unwanted;
it shows only that the actor/condition question has not yet been answered by
any accepted packet, which is a gap, not a stop.

## Selected Disposition

`R41_T2_PERSISTENCE_MODE_AUTHORIZATION_HELD_PENDING_AUTHORITY_GAPS`

## Unresolved Authority Gap

The unresolved gap is narrow and specific: no source file or accepted
governed artifact names (a) which actor role may request
`fileBackedPersistenceRequested: true`, (b) what authorization object or
receipt field the system-chain route candidate would check before accepting
that request, or (c) what new invariant conditions (beyond the existing
receipt-shape invariants) a file-backed persistence-mode grant would have to
preserve. This is an authority gap, not a source gap: nothing in current
source conflicts with resolving it, and nothing forbids resolving it in
principle - it simply has not been decided by any operator-approved,
source-verified packet yet.

## Reopen Condition

This lane reopens only when a fresh, source-verified, operator-approved
packet does one of the following, each of which would supply the specific
missing element identified above:

- Names an explicit actor/role (for example, a specific operator or
  memory-owner role, verified against an existing or newly added
  authorization type) that the system-chain route candidate would check
  before accepting `fileBackedPersistenceRequested: true`; or
- Adds a second literal value to `MineruSystemChainPersistenceMode` (or an
  equivalent typed variant) together with the runtime check that would
  accept it only under that named actor's authorization; or
- Names the specific new receipt or invariant field a file-backed grant must
  carry, beyond the existing `summaryOnly`/`canReinject`/`rawMemoryReleased`
  invariants, and ties it to a fail-closed default.

Until one of these is supplied by an accepted packet, this lane remains held
and should not be reopened by simply re-asking the same question.

## Hold / Release Consequence Matrix

| Surface | Current state | Remains unauthorized until |
| --- | --- | --- |
| Persistence-mode widening (`fileBackedPersistenceRequested: true` acceptance) | Held; no actor/role/authorization field exists on `MineruSystemChainRouteAuthority` for this purpose | A fresh packet names the actor, authorization mechanism, and new invariant per the Reopen Condition above |
| MinerU system-chain file-backed persistence invocation | Held by `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` | The persistence-mode authorization gap above is resolved and a separate implementation packet is accepted |
| Production Memory/RAG route release | Held separately by `R39_PRODUCTION_MEMORY_RAG_ROUTE_RELEASE_HELD_PENDING_AUTHORITY_GAPS` | Decided separately by R39-T1; not reopened by this packet |
| Private/generated MinerU output content | Held by `R30_PRIVATE_OUTPUT_POLICY_NOT_RELEASED` | A dedicated private-output policy packet is accepted |
| Provider/live proof | Closed only as bounded private provenance evidence by R40-T1 | A dedicated production-readiness packet, separate from bounded live-proof evidence, is accepted |
| Use-case/legal workflow | Out of scope for this packet | A separately selected, source-verified roadmap opens it |
| Public-sync, public claim | Out of scope for this packet | A separate public-sync packet with its own claim boundary is authored |
| Worker commit, push | Not authorized by this work order | Reviewer/closer owns the material closure commit; push requires separate explicit operator confirmation |

## Next Move

Next allowed move: operator decision on whether to pursue the specific
Reopen Condition above (naming a persistence-mode authority actor and
invariant set through a fresh source-verified packet), or selection of a
different held lane (production Memory/RAG memory-owner authorization packet
per R39-T1's next move, private-output policy, or use-case/legal workflow),
or stop. No implementation, persistence-mode widening, runtime wiring, or
file-backed production release is authorized by this decision.

## Claim Boundary

This decision matrix is docs-only. It does not implement, execute, or invoke
file-backed persistence, does not construct or write to any file-backed
durable store, does not run MinerU runtime, does not read or release
private/generated MinerU output content, does not invoke production
Memory/RAG behavior, retrieval, or vectorization, does not perform any
provider/live call, and does not create a public-sync, public claim, or
production-readiness claim. It records an authority-posture decision only,
based on the Source Verification Block above, and explicitly declines to
invent a persistence-mode authority actor or invariant set that no cited
source or governed artifact currently supports.
