# CVF MSEA R42 T1 - MinerU Persistence Mode Authority Reopen Source Discovery Matrix

Memory class: reference-decision

docType: reference

Status: ACTIVE_REFERENCE

Created: 2026-07-06

rawMemoryReleased: false

EPISTEMIC_PROCESS_NA_WITH_REASON: this is a source-discovery decision over
already-established source and accepted closure evidence, not an empirical
prediction-versus-outcome comparison against new observation.

## Purpose

Determine, from current governed source and accepted R41 evidence only,
whether any existing actor/role, second persistence-mode literal plus
runtime check, receipt field, or invariant already satisfies the R41-T2
reopen condition for `fileBackedPersistenceRequested`, or whether the
missing authority remains confirmed.

## Scope / Applies To

Applies only to the R42-T1 docs-only source-discovery question named by the
paired work order: search current repository source for evidence that could
satisfy one of the three named R41-T2 reopen paths. Does not implement,
execute, or invoke file-backed persistence, MinerU runtime, or production
Memory/RAG behavior. Does not decide production Memory/RAG route release
(held separately by R39-T1), provider/live proof (closed separately by
R40-T1), or use-case/legal workflow.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| `fileBackedPersistenceRequested` remains a plain boolean field on the route authority interface, with no actor-identity or role field attached to it on the same interface | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | lines 36-44 | `MineruSystemChainRouteAuthority` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| Persistence-mode type is still a single-literal type with no second literal value defined anywhere in this file | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | line 34 | `MineruSystemChainPersistenceMode` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| The route candidate rejects any true `fileBackedPersistenceRequested` unconditionally, with no branch that inspects an actor, role, or authorization object before rejecting | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | lines 105-110 | `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| The route candidate's actor-facing authority field remains `freshMemoryOwnerAuthorization: boolean`, a single flag with no actor-identity or role field of its own | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | line 38 | `freshMemoryOwnerAuthorization` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| `MineruMemoryOwnerAuthorization.actorRole` continues to exist one layer down and is validated only against the T22 route-release helper's own prerequisites, never against `fileBackedPersistenceRequested` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-memory-rag-route-release.ts` | lines 40-46 and 131-137 | `MineruMemoryOwnerAuthorization` | MinerU Memory/RAG route release candidate | EXISTS | ACCEPT |
| `evaluateRuntimeMemoryAction` checks `input.actorRole` against a per-tier `allowedActors` allowlist before authorizing `durablePersistenceRequested`, and denies with `durable_persistence_not_authorized` when the tier does not allow it | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/runtime-memory-hierarchy.ts` | lines 253-255 and 273-275 | `evaluateRuntimeMemoryAction` | runtime memory hierarchy | EXISTS | ACCEPT |
| This actor-role and `durablePersistenceRequested` check governs the general in-process `DurableMemoryStore.write` path for both `skill` and `long-term` tiers, and applies identically to `InProcessDurableMemoryStore` and `FileBackedDurableMemoryStore`, because both extend the same `BaseDurableMemoryStore.write` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | lines 184, 195, and 227-233 | `BaseDurableMemoryStore` | durable memory store | EXISTS | ACCEPT |
| `evaluateRuntimeMemoryAction` is reached through `BaseDurableMemoryStore.write` after a durable store is supplied, and `mineru-durable-store-invocation.ts` uses `RuntimeMemoryActorRole` as a type cast, but no cited MinerU route/release/invocation source calls `evaluateRuntimeMemoryAction` to decide `fileBackedPersistenceRequested` or selects between `createInProcessDurableMemoryStore` and `createFileBackedDurableMemoryStore` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-durable-store-invocation.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | lines 105-110 (route candidate); lines 371-382 (invocation helper store write input and store call); lines 227-233 (store-level runtime check) | `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED`; `invokeMineruDurableStoreWrite`; `BaseDurableMemoryStore.write` | MinerU system-chain route candidate; MinerU durable store invocation helper; durable memory store | EXISTS | ACCEPT |
| `createFileBackedDurableMemoryStore` exists as a general-purpose factory but is called nowhere in `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src` outside its own definition and the module's export barrel | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/index.ts` | line 106 (definition); export barrel only | `createFileBackedDurableMemoryStore` | durable memory store | EXISTS | ACCEPT |
| Durable memory receipt's private-output invariants (`summaryOnly`, `canReinject`, `rawMemoryReleased`) remain structural literal types on the receipt shape itself and do not vary by persistence mode | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` | lines 46-48 | `DurableMemoryReceipt` | durable memory store | EXISTS | ACCEPT |
| R41-T2 selected persistence-mode authorization held pending authority gaps and named the reopen condition | `docs/reference/CVF_MSEA_R41_T2_MINERU_PERSISTENCE_MODE_AUTHORIZATION_DECISION_MATRIX_2026-07-06.md` | line 131 and Reopen Condition section | `R41_T2_PERSISTENCE_MODE_AUTHORIZATION_HELD_PENDING_AUTHORITY_GAPS` | R41-T2 decision matrix | VALUE_SET | ACCEPT |
| R41-T4 selected bounded-candidate stop and preserved the R41-T2 reopen condition as a future option | `docs/reference/CVF_MSEA_R41_T4_MINERU_FOUNDATION_CHAIN_STOP_RELEASE_DECISION_MATRIX_2026-07-06.md` | lines 106 and 122-126 | `R41_T4_FOUNDATION_CHAIN_STOP_BOUNDED_CANDIDATE` | R41-T4 decision matrix | VALUE_SET | ACCEPT |
| R41-T4 completion review accepted the bounded-candidate stop from accepted closure evidence, without authorizing implementation | `docs/reviews/CVF_MSEA_R41_T4_MINERU_FOUNDATION_CHAIN_STOP_RELEASE_DECISION_COMPLETION_2026-07-06.md` | Reviewer Decision section | `R41_T4_STOP_RELEASE_DECISION_COMPLETE_BOUNDED_CANDIDATE` | R41-T4 completion review | VALUE_SET | ACCEPT |

## Decision Options

| Token | Meaning |
| --- | --- |
| `R42_T1_PERSISTENCE_AUTHORITY_SOURCE_FOUND_FOR_REOPEN_DESIGN` | Source-backed evidence already satisfies at least one R41-T2 reopen path and a future narrow implementation packet may reopen persistence-mode authorization design |
| `R42_T1_PERSISTENCE_AUTHORITY_SOURCE_MISSING_CONFIRMED` | The searched source surfaces contain no evidence satisfying any R41-T2 reopen path; the missing element identified by R41-T2 remains confirmed missing |
| `R42_T1_PERSISTENCE_AUTHORITY_SOURCE_CONTRADICTION_BLOCKED` | Cited source rows conflict with each other or with accepted R41 evidence in a way this packet cannot resolve |

## Reasoning

The R41-T2 reopen condition names three specific missing elements: (a) an
actor/role the system-chain route candidate would check before accepting
`fileBackedPersistenceRequested: true`; (b) a second `MineruSystemChain
PersistenceMode` literal plus the runtime check that would accept it only
under that named actor's authorization; or (c) a new receipt or invariant
field, beyond the existing `summaryOnly`/`canReinject`/`rawMemoryReleased`
invariants, tied to a fail-closed default. This packet re-reads the same
three files R41-T2 cited, plus one adjacent file R41-T2 did not cite
(`runtime-memory-hierarchy.ts`), to check whether anything has moved since
R41-T2's authoring commit `4a08d3ef0`.

Re-verification of the three originally cited files confirms no change: the
route authority interface, persistence-mode type, and fail-closed rejection
in `mineru-system-chain-route-candidate.ts` are identical to what R41-T2
recorded, and `MineruMemoryOwnerAuthorization.actorRole` in
`mineru-memory-rag-route-release.ts` is still validated only against the
T22 route-release helper's own prerequisites, never against
`fileBackedPersistenceRequested`.

The one candidate lead this packet found that R41-T2 did not examine is
`evaluateRuntimeMemoryAction` in `runtime-memory-hierarchy.ts`. This function
does check `input.actorRole` against a per-tier `allowedActors` allowlist
(for example, only `OPERATOR`, `GOVERNOR`, `SERVICE_AGENT` may write the
`long-term` tier) before allowing `durablePersistenceRequested` to succeed,
and denies with `durable_persistence_not_authorized` when the actor is not
on that tier's allowlist. On its face this looks like exactly the kind of
"actor/role checked before a persistence-mode decision" that reopen path (a)
asks for.

Three source-verified facts prevent selecting `SOURCE_FOUND_FOR_REOPEN_
DESIGN` on this lead. First, `evaluateRuntimeMemoryAction`'s
`durablePersistenceRequested` check governs the general in-process durable
write path shared by both `InProcessDurableMemoryStore` and
`FileBackedDurableMemoryStore` (both extend the same
`BaseDurableMemoryStore.write`), not a `fileBackedPersistenceRequested`-
specific decision; it already applies to today's allowed in-process writes,
so its existence does not narrow the specific gap R41-T2 named. Second,
the invocation helper uses `RuntimeMemoryActorRole` as a type cast and
passes a store-supplied write input to `store.write`, which means the
store-level runtime check may run after a store has already been selected;
no cited source line uses `evaluateRuntimeMemoryAction` to decide
`fileBackedPersistenceRequested`, and the system-chain candidate's
fail-closed rejection at
`FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` happens before any store
call for the `fileBackedPersistenceRequested: true` route. Third,
`createFileBackedDurableMemoryStore` is never invoked anywhere in
`EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src` outside its own definition
and the export barrel, so there is no runtime call site where an actor-role
check and a file-backed store selection could jointly apply even in
principle today.

Treating `evaluateRuntimeMemoryAction`'s actor-role allowlist as if it
already answered the persistence-mode authorization question would repeat,
in a new form, the exact inference R41-T2 already rejected for
`MineruMemoryOwnerAuthorization.actorRole`: a real, source-verified,
adjacent structure that happens to carry an actor-role concept, but that no
cited source line ties to `fileBackedPersistenceRequested` or to selecting
a file-backed store. Reopen path (b) also remains unmet:
`MineruSystemChainPersistenceMode` is still exactly one literal
(`"in-process-only"`), with no second literal value or actor-scoped variant
anywhere in the file. Reopen path (c) also remains unmet: the durable
memory receipt's `summaryOnly`/`canReinject`/`rawMemoryReleased` invariants
are unchanged structural literals that do not vary by persistence mode, and
no new receipt or invariant field naming a file-backed grant condition was
found in any cited or newly searched file.

Because none of the three reopen paths is satisfied by current source, and
because nothing in the newly discovered `runtime-memory-hierarchy.ts` lead
conflicts with anything R41-T2 or R41-T4 recorded (it is a real, unrelated
control, not a contradiction), this is a confirmed-missing result rather
than a contradiction-blocked result. `SOURCE_FOUND_FOR_REOPEN_DESIGN` is
rejected because selecting it would repeat the adjacent-structure inference
error the work order's fail conditions forbid. `SOURCE_CONTRADICTION_
BLOCKED` is rejected because no cited source row disagrees with any other
cited source row or with accepted R41 evidence.

## Selected Disposition

`R42_T1_PERSISTENCE_AUTHORITY_SOURCE_MISSING_CONFIRMED`

## Confirmed Missing Elements

- No actor/role field exists on `MineruSystemChainRouteAuthority`, and no
  runtime check inside `mineru-system-chain-route-candidate.ts`,
  `mineru-memory-rag-route-release.ts`, or
  `mineru-durable-store-invocation.ts` inspects any actor/role before
  rejecting `fileBackedPersistenceRequested: true`. The nearest actor-role
  checks that exist (`MineruMemoryOwnerAuthorization.actorRole` and
  `evaluateRuntimeMemoryAction`'s tier allowlist) are both real, but neither
  is used to authorize the `fileBackedPersistenceRequested` decision path.
- `MineruSystemChainPersistenceMode` remains a single literal
  (`"in-process-only"`) with no second literal value or actor-scoped variant
  defined anywhere in the searched files.
- No new receipt or invariant field, beyond the existing
  `summaryOnly`/`canReinject`/`rawMemoryReleased` invariants on
  `DurableMemoryReceipt`, names a file-backed persistence-mode grant
  condition tied to a fail-closed default.

## Negative Search And Collision Discipline

| Check | Evidence | Disposition |
| --- | --- | --- |
| Path existence for R42-T1 matrix (this file) | `Test-Path docs/reference/CVF_MSEA_R42_T1_MINERU_PERSISTENCE_MODE_AUTHORITY_REOPEN_SOURCE_DISCOVERY_MATRIX_2026-07-06.md` returned `False` before authoring. | ACCEPT_NO_COLLISION |
| Search for a second `MineruSystemChainPersistenceMode` literal or actor-scoped variant | Direct read of `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` lines 1-164 found exactly one literal type declaration at line 34 and no second literal or variant anywhere in the file. | ACCEPT_NO_SECOND_LITERAL_FOUND |
| Search for a call site of `createFileBackedDurableMemoryStore` | Grep of `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src` found only the definition in `durable-memory-store.ts` and the export barrel in `index.ts`; no invocation call site exists. | ACCEPT_NO_INVOCATION_CALL_SITE_FOUND |
| Search for any route/release/invocation-chain use of `evaluateRuntimeMemoryAction` to decide `fileBackedPersistenceRequested` | Direct reads found no call or reference to `evaluateRuntimeMemoryAction` in `mineru-system-chain-route-candidate.ts`, `mineru-memory-rag-route-release.ts`, or `mineru-durable-store-invocation.ts`; `mineru-durable-store-invocation.ts` imports only the `RuntimeMemoryActorRole` type from `runtime-memory-hierarchy.ts` and casts `input.actorRole` before calling the supplied store. | ACCEPT_NO_DECISION_PATH_FOUND |

## Reopen Condition (Unchanged From R41-T2)

This lane still reopens only when a fresh, source-verified, operator-approved
packet does one of the following:

- Names an explicit actor/role that the system-chain route candidate would
  check before accepting `fileBackedPersistenceRequested: true`, verified
  against an existing or newly added authorization type that is actually
  referenced from the `fileBackedPersistenceRequested` decision path; or
- Adds a second literal value to `MineruSystemChainPersistenceMode` (or an
  equivalent typed variant) together with the runtime check that would
  accept it only under that named actor's authorization; or
- Names the specific new receipt or invariant field a file-backed grant must
  carry, beyond the existing `summaryOnly`/`canReinject`/`rawMemoryReleased`
  invariants, and ties it to a fail-closed default.

This R42-T1 source-discovery pass confirms none of the three paths is
satisfied by current source. A future packet could productively examine
whether wiring `evaluateRuntimeMemoryAction`'s actor-role allowlist into the
`fileBackedPersistenceRequested` decision path (rather than treating the
allowlist as already-sufficient) is a viable design direction, but that is
an implementation-design proposal, not a source-discovery finding, and is
out of scope for this packet.

## Next Move

Next allowed move: operator decision on whether to pursue a fresh,
source-verified implementation-design packet that explicitly proposes wiring
`evaluateRuntimeMemoryAction`'s actor-role allowlist (or an equivalent new
mechanism) into the `fileBackedPersistenceRequested` decision path, select a
different held lane (production Memory/RAG memory-owner authorization packet
per R39-T1's next move, private-output policy, or use-case/legal workflow),
or stop this reopen-source-discovery sub-lane. No implementation,
persistence-mode widening, runtime wiring, or file-backed production release
is authorized by this decision.

## Claim Boundary

This decision matrix is docs-only. It does not implement, execute, or invoke
file-backed persistence, does not construct or write to any file-backed
durable store, does not run MinerU runtime, does not read or release
private/generated MinerU output content, does not invoke production
Memory/RAG behavior, retrieval, or vectorization, does not perform any
provider/live call, and does not create a public-sync, public claim, or
production-readiness claim. It records a source-discovery result only,
based on the Source Verification Block above, and explicitly declines to
treat an adjacent, unconnected actor-role check as if it already answered
the R41-T2 reopen question.
