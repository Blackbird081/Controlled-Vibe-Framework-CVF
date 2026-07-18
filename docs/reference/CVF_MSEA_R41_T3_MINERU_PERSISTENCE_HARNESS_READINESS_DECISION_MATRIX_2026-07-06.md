# CVF MSEA R41 T3 - MinerU Persistence Harness Readiness Decision Matrix

Memory class: reference-decision

docType: reference

Status: ACTIVE_REFERENCE

Created: 2026-07-06

rawMemoryReleased: false

EPISTEMIC_PROCESS_NA_WITH_REASON: this is an authority-posture decision over
already-established source and closure evidence, not an empirical
prediction-versus-outcome comparison against new observation.

## Purpose

Decide, from current repository source and accepted R41-T1/R41-T2 closure
evidence only, whether a proposed minimal production-adjacent MinerU
persistence harness is ready for a later narrow implementation packet, is
blocked by the persistence-mode authorization gap R41-T2 left unresolved, or
should stop.

## Scope / Applies To

Applies only to the readiness question of whether a minimal
production-adjacent persistence harness may now be implemented. Does not
apply to production Memory/RAG route release (held separately by R39-T1),
provider/live proof (closed separately by R40-T1), or use-case/legal
workflow. Does not implement, execute, or invoke file-backed persistence,
MinerU runtime, or production Memory/RAG behavior. Does not run or construct
any harness; it decides only whether one may be authored next.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| R41-T2 selected persistence-mode authorization held pending authority gaps | `docs/reference/CVF_MSEA_R41_T2_MINERU_PERSISTENCE_MODE_AUTHORIZATION_DECISION_MATRIX_2026-07-06.md` | line 131 | `R41_T2_PERSISTENCE_MODE_AUTHORIZATION_HELD_PENDING_AUTHORITY_GAPS` | R41-T2 decision matrix | VALUE_SET | ACCEPT |
| R41-T2 completion review accepted the held disposition and closed the lane on that basis | `docs/reviews/CVF_MSEA_R41_T2_MINERU_PERSISTENCE_MODE_AUTHORIZATION_DECISION_COMPLETION_2026-07-06.md` | line 69 | `R41_T2_AUTHORITY_DECISION_COMPLETE_HELD_PENDING_AUTHORITY_GAPS` | R41-T2 completion review | VALUE_SET | ACCEPT |
| R41-T2 reopen condition requires one of three specific accepted-packet elements: a named actor/role authorization check, a second persistence-mode literal with its own runtime check, or a named new receipt/invariant field tied to a fail-closed default | `docs/reference/CVF_MSEA_R41_T2_MINERU_PERSISTENCE_MODE_AUTHORIZATION_DECISION_MATRIX_2026-07-06.md` | lines 146-164 | `Reopen Condition` | R41-T2 decision matrix | VALUE_SET | ACCEPT |
| R41-T2 next-move routing names only fresh-packet authoring, a different held lane, or stop as the next allowed move | `docs/reviews/CVF_MSEA_R41_T2_MINERU_PERSISTENCE_MODE_AUTHORIZATION_DECISION_COMPLETION_2026-07-06.md` | lines 323-327 | `Return-To-Orchestrator` | R41-T2 completion review | VALUE_SET | ACCEPT |
| R41-T1 file-backed persistence release remained held pending authority gaps and is the predecessor lane R41-T2 narrowed | `docs/reference/CVF_MSEA_R41_T1_MINERU_FILE_BACKED_PERSISTENCE_RELEASE_AUTHORITY_DECISION_MATRIX_2026-07-06.md` | line 118 | `R41_T1_FILE_BACKED_PERSISTENCE_RELEASE_HELD_PENDING_AUTHORITY_GAPS` | R41-T1 decision matrix | VALUE_SET | ACCEPT |
| Active session front door records R41-T2 closure and does not record any accepted packet between R41-T2 closure and this T3 dispatch that names a persistence-mode authority actor, an authorization mechanism, or a new invariant field | `CVF_SESSION_MEMORY.md` | Current Work table, most recent MSEA rows | `msea_r41_t3_mineru_persistence_harness_readiness_decision_dispatched_pending_worker_return` | active session front door | VALUE_SET | ACCEPT |
| R41-T3 work order requires the worker to select the blocked disposition unless it can cite accepted, source-verified evidence satisfying the R41-T2 reopen condition | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R41_T3_MINERU_PERSISTENCE_HARNESS_READINESS_DECISION_2026-07-06.md` | Mission section | `selectedR41T3Disposition` | R41-T3 work order | VALUE_SET | ACCEPT |

## Decision Options

| Token | Meaning |
| --- | --- |
| `R41_T3_MINIMAL_PERSISTENCE_HARNESS_BLOCKED_BY_R41_T2_AUTHORITY_GAPS` | The persistence-mode authorization gap R41-T2 identified remains unresolved by any accepted packet, so a minimal persistence harness cannot be authored yet |
| `R41_T3_MINIMAL_PERSISTENCE_HARNESS_READY_FOR_NARROW_IMPLEMENTATION_PACKET` | An accepted, source-verified packet has satisfied the R41-T2 reopen condition, and a minimal persistence harness implementation packet may now be authored |
| `R41_T3_MINIMAL_PERSISTENCE_HARNESS_REJECTED_STOP` | A minimal persistence harness is rejected outright and no further packet in this lane is worth authoring |

## Reasoning

`READY_FOR_NARROW_IMPLEMENTATION_PACKET` requires an accepted, source-verified
packet that has already satisfied one of the three specific elements named in
R41-T2's Reopen Condition: (a) an explicit actor/role that the system-chain
route candidate checks before accepting `fileBackedPersistenceRequested:
true`, (b) a second literal value on `MineruSystemChainPersistenceMode` (or an
equivalent typed variant) paired with the runtime check that accepts it only
under that named actor's authorization, or (c) a specific new receipt or
invariant field a file-backed grant must carry, tied to a fail-closed
default. The Source Verification Block above confirms that no packet between
R41-T2's closure and this T3 dispatch supplies any of these three elements:
the active session front door's most recent entries show R41-T2 closure and
this T3 dispatch, with nothing in between naming a persistence authority
actor, a second persistence-mode literal, or a new invariant field. This
matrix therefore cannot select the ready-for-implementation token without
inventing authority evidence that the operator has not granted, which the
R41-T3 work order's fail conditions explicitly forbid.

The operator's decision to proceed to the T3 lane is itself not evidence
satisfying the reopen condition. R41-T2 was explicit that its lane "reopens
only when a fresh, source-verified, operator-approved packet" supplies one of
the three named elements, and "should not be reopened by simply re-asking the
same question." Selecting the T3 readiness-decision lane is an operator
choice about which question to ask next, not an answer to the persistence
authority question itself. Treating "the operator wants to move forward" as
if it were "the authority gap is resolved" would repeat, in a new form, the
exact category of mistake R41-T1 and R41-T2 already rejected: assuming a
nearby, adjacent, or convenient signal answers a specific authority question
it was never source-verified to answer. This work order's own Mission section
states this directly: "The worker must not treat the operator's desire to
proceed to T3 as authority to run or implement a harness."

`REJECTED_STOP` is rejected because nothing in the cited evidence suggests a
minimal persistence harness is a bad idea in principle or that the lane
should be permanently closed; R41-T2's own Reopen Condition frames the gap as
resolvable by a future packet, not as a dead end. The correct posture is a
carried-forward block, not a stop.

## Selected Disposition

`R41_T3_MINIMAL_PERSISTENCE_HARNESS_BLOCKED_BY_R41_T2_AUTHORITY_GAPS`

## Unresolved Authority Gap

The unresolved gap is identical to the one R41-T2 named and remains
unresolved: no accepted, source-verified packet has supplied (a) a named
actor/role checked by the system-chain route candidate before accepting
`fileBackedPersistenceRequested: true`, (b) a second `MineruSystemChainPersistenceMode`
literal with its own runtime check, or (c) a new receipt/invariant field tied
to a fail-closed default. T3 inherits this gap directly from T2 rather than
introducing a new one, because a minimal persistence harness would have
nothing to exercise beyond the same fail-closed rejection R41-T1 and R41-T2
already characterized.

## Reopen Condition

This T3 lane reopens under the same three-part condition R41-T2 already
established, restated here for T3's own readiness question:

- A fresh, source-verified, accepted packet names an explicit actor/role that
  the system-chain route candidate would check before accepting
  `fileBackedPersistenceRequested: true`; or
- A fresh, source-verified, accepted packet adds a second literal value to
  `MineruSystemChainPersistenceMode` (or an equivalent typed variant)
  together with the runtime check that would accept it only under that named
  actor's authorization; or
- A fresh, source-verified, accepted packet names the specific new receipt or
  invariant field a file-backed grant must carry, beyond the existing
  `summaryOnly`/`canReinject`/`rawMemoryReleased` invariants, and ties it to a
  fail-closed default.

Until one of these is supplied and accepted, a minimal persistence harness
implementation packet should not be authored, because it would have no
authorized persistence-mode path to exercise.

## Hold / Release Consequence Matrix

| Surface | Current state | Remains unauthorized until |
| --- | --- | --- |
| Minimal production-adjacent persistence harness implementation | Blocked; inherits the R41-T2 persistence-mode authorization gap directly | The Reopen Condition above is satisfied by a fresh, accepted, source-verified packet |
| Persistence-mode widening (`fileBackedPersistenceRequested: true` acceptance) | Held; no actor/role/authorization field exists on `MineruSystemChainRouteAuthority` for this purpose | Same Reopen Condition as above (this is the same gap, not a separate one) |
| MinerU system-chain file-backed persistence invocation | Held by `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` | The persistence-mode authorization gap is resolved and a separate implementation packet is accepted |
| Production Memory/RAG route release | Held separately by `R39_PRODUCTION_MEMORY_RAG_ROUTE_RELEASE_HELD_PENDING_AUTHORITY_GAPS` | Decided separately by R39-T1; not reopened by this packet |
| Private/generated MinerU output content | Held by `R30_PRIVATE_OUTPUT_POLICY_NOT_RELEASED` | A dedicated private-output policy packet is accepted |
| Provider/live proof | Closed only as bounded private provenance evidence by R40-T1 | A dedicated production-readiness packet, separate from bounded live-proof evidence, is accepted |
| Use-case/legal workflow | Out of scope for this packet | A separately selected, source-verified roadmap opens it |
| Public-sync, public claim | Out of scope for this packet | A separate public-sync packet with its own claim boundary is authored |
| Worker commit, push | Not authorized by this work order | Reviewer/closer owns the material closure commit; push requires separate explicit operator confirmation |

## Next Move

Next allowed move: operator decision on whether to pursue the Reopen
Condition above (authoring a fresh, source-verified packet naming a
persistence-mode authority actor, second persistence-mode literal, or new
invariant field), selection of a different held lane (production Memory/RAG
memory-owner authorization packet per R39-T1's next move, private-output
policy, or use-case/legal workflow), or stop. No implementation, harness
construction, persistence-mode widening, runtime wiring, or file-backed
production release is authorized by this decision.

## Claim Boundary

This decision matrix is docs-only. It does not implement, execute, or invoke
any persistence harness, file-backed persistence, or MinerU runtime. It does
not construct or write to any file-backed durable store, does not read or
release private/generated MinerU output content, does not invoke production
Memory/RAG behavior, retrieval, or vectorization, does not perform any
provider/live call, and does not create a public-sync, public claim, or
production-readiness claim. It records a readiness-posture decision only,
based on the Source Verification Block above, and explicitly declines to
treat the operator's lane selection as authority evidence that resolves the
R41-T2 persistence-mode authorization gap.
