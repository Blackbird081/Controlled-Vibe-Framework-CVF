# CVF MSEA R43 T1 - MinerU Actor Role Persistence Authority Wiring Design Matrix

Memory class: reference-decision

docType: reference

Status: ACTIVE_REFERENCE

Created: 2026-07-06

rawMemoryReleased: false

EPISTEMIC_PROCESS_NA_WITH_REASON: this is a design-option comparison over
already-established source and accepted closure evidence, not an empirical
prediction-versus-outcome comparison against new observation.

## Purpose

Compare at least three design options for wiring actor-role authority into
the MinerU `fileBackedPersistenceRequested` decision path, select exactly one
R43-T1 disposition, and, if design-ready, name the minimal later
implementation surfaces and invariants without implementing them.

## Scope / Applies To

Applies only to the R43-T1 docs-only design question named by the paired work
order: propose and source-verify a narrow design that could satisfy the
R41-T2 reopen condition. Does not implement, execute, or invoke file-backed
persistence, MinerU runtime, or production Memory/RAG behavior. Does not
decide production Memory/RAG route release (held separately by R39-T1),
provider/live proof (closed separately by R40-T1), or use-case/legal
workflow.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| `MineruSystemChainRouteAuthority` currently has no `actorRole` field of any kind; its only actor-facing field is the boolean `freshMemoryOwnerAuthorization` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | lines 36-44 | `MineruSystemChainRouteAuthority` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| `buildMineruSystemChainRouteCandidate` rejects `fileBackedPersistenceRequested: true` unconditionally with no actor-role branch before the rejection | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | lines 105-110 | `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| `MineruSystemChainPersistenceMode` remains a single-literal type (`"in-process-only"`) with no second literal value | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | line 34 | `MineruSystemChainPersistenceMode` | MinerU system-chain route candidate | EXISTS | ACCEPT |
| `RuntimeMemoryActorRole` is an existing, well-formed nine-value union type plus `"unknown"`, already exported and usable without inventing a new type | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/runtime-memory-hierarchy.ts` | lines 12-22 | `RuntimeMemoryActorRole` | runtime memory hierarchy | EXISTS | ACCEPT |
| `evaluateRuntimeMemoryAction`'s actor-role allowlist is scoped by memory tier (`skill`, `long-term`, etc.) and by action (`write`, `retrieve`), not by storage-medium (file-backed vs. in-process); its `durablePersistenceRequested` flag denies when the tier does not allow durable persistence at all, which is a different axis than "may this actor request a file-backed store instance" | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/runtime-memory-hierarchy.ts` | lines 144-233 (`TIER_RUNTIME_RULES`); lines 253-255 and 273-275 (`evaluateRuntimeMemoryAction`) | `TIER_RUNTIME_RULES`; `evaluateRuntimeMemoryAction` | runtime memory hierarchy | EXISTS | ACCEPT |
| `mineru-durable-store-invocation.ts` imports the `RuntimeMemoryActorRole` type and casts `input.actorRole` before calling `store.write`, but never calls `evaluateRuntimeMemoryAction` itself; the actor-role check that does run happens one layer further down, inside `BaseDurableMemoryStore.write`, not in this helper | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-durable-store-invocation.ts` | line 18 (type import); lines 367-383 (write-input mapping and store call) | `RuntimeMemoryActorRole`; `invokeMineruDurableStoreWrite` | MinerU durable store invocation helper | EXISTS | ACCEPT |
| `createFileBackedDurableMemoryStore` is a general-purpose factory with a caller-supplied file path and no actor/authorization parameter of its own; it is never called anywhere in `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src` outside its own definition and the export barrel | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts`; `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/index.ts` | line 106 (definition); export barrel only | `createFileBackedDurableMemoryStore` | durable memory store | EXISTS | ACCEPT |
| R41-T2 named three reopen paths: a checked actor/role, a second persistence-mode literal plus runtime check, or a new receipt/invariant field tied to a fail-closed default | `docs/reference/CVF_MSEA_R41_T2_MINERU_PERSISTENCE_MODE_AUTHORIZATION_DECISION_MATRIX_2026-07-06.md` | Reopen Condition section | `Reopen Condition` | R41-T2 decision matrix | VALUE_SET | ACCEPT |
| R42-T1 confirmed the nearest actor-role controls are real but structurally unconnected to `fileBackedPersistenceRequested`, and recorded that a future packet could examine wiring `evaluateRuntimeMemoryAction`'s allowlist into that decision path as a design direction (not a finding) | `docs/reference/CVF_MSEA_R42_T1_MINERU_PERSISTENCE_MODE_AUTHORITY_REOPEN_SOURCE_DISCOVERY_MATRIX_2026-07-06.md` | Reopen Condition (Unchanged From R41-T2) section | `R42_T1_PERSISTENCE_AUTHORITY_SOURCE_MISSING_CONFIRMED` | R42-T1 decision matrix | VALUE_SET | ACCEPT |
| R42-T1 completion review repaired the source-claim precision distinction between "type cast exists" and "decision path uses this source to authorize the named route", and set that distinction as the next-action instruction for future packets | `docs/reviews/CVF_MSEA_R42_T1_MINERU_PERSISTENCE_MODE_AUTHORITY_REOPEN_SOURCE_DISCOVERY_COMPLETION_2026-07-06.md` | Finding-To-Governance Learning Disposition section | `ORCHESTRATOR_PACKET_GAP` | R42-T1 completion review | VALUE_SET | ACCEPT |

## Design Options Considered

### Option A: Reuse `evaluateRuntimeMemoryAction` directly in the route candidate

Call `evaluateRuntimeMemoryAction` from `buildMineruSystemChainRouteCandidate`
before the existing `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` check,
passing `durablePersistenceRequested: true` and a caller-supplied actor role,
and accept `fileBackedPersistenceRequested: true` only when the call returns
`decision: "allowed"`.

Rejected. `evaluateRuntimeMemoryAction`'s allowlist is keyed by memory tier
(`skill`, `long-term`, `working`, and so on) and by action (`write`,
`retrieve`), a classification designed to answer "may this actor durably
persist memory of this tier at all," not "may this actor request a
file-backed store instance instead of an in-process one." Reusing it would
conflate two different axes: durable-vs-ephemeral (which
`evaluateRuntimeMemoryAction` already governs correctly for its own domain)
and file-backed-vs-in-process (which is the MinerU system-chain candidate's
own concern and has no tier concept at all). This is the same
adjacent-structure-as-authority error R41-T2 and R42-T1 already rejected
once each; reusing a tier-scoped function for a storage-medium decision
would repeat it a third time in a new form, even though the source function
itself is real and correctly implemented for its actual purpose.

### Option B: Introduce a narrow, purpose-built actor-role field on the route authority

Add a new field to `MineruSystemChainRouteAuthority`, for example
`fileBackedPersistenceActorRole?: RuntimeMemoryActorRole`, reusing the
existing `RuntimeMemoryActorRole` type from `runtime-memory-hierarchy.ts`
(no new type invented). Add a new, narrowly scoped allowlist constant
private to `mineru-system-chain-route-candidate.ts` (for example
`FILE_BACKED_PERSISTENCE_ALLOWED_ACTOR_ROLES`, populated only with roles the
operator explicitly approves, such as `["OPERATOR", "GOVERNOR"]`) and a new
runtime check inside `buildMineruSystemChainRouteCandidate`, placed
immediately before the existing `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_
REQUESTED` check: if `authority.fileBackedPersistenceRequested === true`,
require `authority.fileBackedPersistenceActorRole` to be present and a
member of the new allowlist, and fail closed with a new, distinct
disposition token (for example `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_
ROLE_NOT_AUTHORIZED`) when it is absent or not on the allowlist. Only when
the actor-role check passes would the existing rejection be bypassed for a
true `fileBackedPersistenceRequested`.

Accepted as the selected direction. This design directly satisfies R41-T2
reopen path (a) as written: it names an explicit actor/role field, checked
by the route candidate itself, verified against an existing type
(`RuntimeMemoryActorRole`) that is actually referenced from the
`fileBackedPersistenceRequested` decision path, because the check would live
inside `buildMineruSystemChainRouteCandidate` itself rather than in an
unrelated adjacent file. It reuses an existing type without inventing new
governance vocabulary, keeps the check narrowly scoped to this one route
candidate (no change to `evaluateRuntimeMemoryAction`, `TIER_RUNTIME_RULES`,
or any other caller of the runtime memory hierarchy), and preserves a
fail-closed default: the new field is optional, so any caller that does not
supply it is treated as not authorized, matching the existing pattern where
`fileBackedPersistenceRequested !== false` fails closed today. It does not
by itself decide reopen path (b) (no second persistence-mode literal) or
reopen path (c) (no new receipt/invariant field beyond the existing
receipt), but reopen path (a) alone is sufficient per R41-T2's "one of the
following" framing.

### Option C: Keep the lane held pending an operator-selected allowlist policy

Continue to hold R41-T2's authorization gap open, on the reasoning that
naming which specific actor roles should be allowed to request file-backed
persistence is a policy decision for the operator to make, not something a
design packet can supply on its own, and that Option B's illustrative
allowlist (`["OPERATOR", "GOVERNOR"]`) is itself an unauthorized invention.

Rejected as the final disposition, but its underlying concern is preserved
as an explicit implementation-packet precondition rather than dropped. The
mechanism design in Option B (new field, new narrowly scoped check, new
fail-closed disposition token, reuse of the existing `RuntimeMemoryActorRole`
type) is fully specifiable without picking the final allowlist membership;
the illustrative role list above is a worked example to show the mechanism
is concrete and buildable, not a claim that `["OPERATOR", "GOVERNOR"]` is
the operator-approved final answer. The later implementation packet must
still carry an explicit operator decision on final allowlist membership
before any source edit occurs. Treating that one remaining decision as
grounds to hold the entire design would block a real, narrow, safely bounded
design from being recorded, when the actual remaining gap is a single
named parameter, not the mechanism shape.

## Decision Options

| Token | Meaning |
| --- | --- |
| `R43_T1_ACTOR_ROLE_WIRING_DESIGN_READY_FOR_IMPLEMENTATION_PACKET` | A narrow, source-verified design can be described now, and a future implementation packet may build it without changing this packet's forbidden scope |
| `R43_T1_ACTOR_ROLE_WIRING_DESIGN_HELD_PENDING_MISSING_AUTHORITY` | No design in this packet can be made concrete enough for an implementation packet without inventing unauthorized governance policy |
| `R43_T1_ACTOR_ROLE_WIRING_DESIGN_CONTRADICTION_BLOCKED` | Cited source rows conflict with each other or with accepted R41/R42 evidence in a way this packet cannot resolve |

## Selected Disposition

`R43_T1_ACTOR_ROLE_WIRING_DESIGN_READY_FOR_IMPLEMENTATION_PACKET`

Selected design: Option B (introduce a narrow, purpose-built actor-role field
and allowlist check on the MinerU system-chain route candidate itself).

## Reasoning

Option A is rejected because it repeats an inference error already rejected
twice in this lane's history: treating a real, source-verified, adjacent
structure as if it already answered a question it was never designed to
answer. `evaluateRuntimeMemoryAction`'s tier-and-action allowlist correctly
governs durable-vs-ephemeral memory access; it has no concept of
file-backed-vs-in-process storage selection, and bending it to serve that
purpose would produce a check whose actual semantics (tier-based) do not
match its apparent semantics (persistence-mode authorization) at the call
site, an invitation to a future misreading exactly like the ones R41-T2 and
R42-T1 both had to correct.

Option C is rejected as the final disposition because the concern it raises
(operator must approve the actual allowlist membership) is real but does not
require holding the entire design. R41-T2's reopen path (a) asks for an
actor/role that the route candidate "would check" -- a mechanism
specification, not a final populated policy. Option B fully specifies that
mechanism: an existing, reused type; a route-candidate-local, narrowly
scoped allowlist constant; a new check placed at a precise, cited location;
and a new, distinct fail-closed disposition token consistent with the
existing pattern of every other check in `buildMineruSystemChainRouteCandidate`.
The one remaining decision (which roles populate the allowlist) is recorded
explicitly as an implementation-packet precondition below, not silently
assumed.

Option B is selected because it is the only option that produces a
genuinely new, purpose-built, narrowly scoped mechanism that a future
implementation packet could build without inventing authority beyond what
this design packet records, and because it satisfies R41-T2 reopen path (a)
on its own terms without requiring paths (b) or (c) as well.

## Minimal Later Implementation Surfaces (Design Only, Not Implemented Here)

| Surface | Proposed change | File |
| --- | --- | --- |
| New optional field on route authority | Add `fileBackedPersistenceActorRole?: RuntimeMemoryActorRole` to `MineruSystemChainRouteAuthority`, importing the type from `runtime-memory-hierarchy.ts` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` |
| New narrowly scoped allowlist constant | Add a private, route-candidate-local constant (for example `FILE_BACKED_PERSISTENCE_ALLOWED_ACTOR_ROLES: readonly RuntimeMemoryActorRole[]`) populated only with operator-approved roles at implementation time | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` |
| New fail-closed disposition token | Add a new exported constant (for example `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_ACTOR_ROLE_NOT_AUTHORIZED`) distinct from the existing `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` token | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` |
| New runtime check | Inside `buildMineruSystemChainRouteCandidate`, before the existing `fileBackedPersistenceRequested !== false` check, add: if `fileBackedPersistenceRequested === true`, require `fileBackedPersistenceActorRole` to be present and a member of the allowlist, else return the new fail-closed disposition | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` |
| Preserved invariant | The existing `FAIL_CLOSED_FILE_BACKED_PERSISTENCE_REQUESTED` check remains as the fail-closed default for any caller that does not pass the new actor-role check; no existing check is removed or weakened | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` |

## Implementation-Packet Preconditions (Not Satisfied By This Design Packet)

- Operator must explicitly approve the final allowlist membership (which
  specific `RuntimeMemoryActorRole` values may request file-backed
  persistence); this design packet's `["OPERATOR", "GOVERNOR"]` example is
  illustrative only and is not an approved policy.
- A future implementation packet must still receive explicit runtime
  execution, source-edit, and test-edit authorization; this design packet
  does not grant any of those.
- Persistence-mode widening (`MineruSystemChainPersistenceMode` gaining a
  second literal, or file-backed persistence actually being invoked) is a
  separate decision from this actor-role wiring design and remains held
  pending its own future authorization.
- Production Memory/RAG route release remains held separately per R39-T1
  and is not affected by this design.

## Negative Search And Collision Discipline

| Check | Evidence | Disposition |
| --- | --- | --- |
| Path existence for R43-T1 matrix (this file) | `Test-Path docs/reference/CVF_MSEA_R43_T1_MINERU_ACTOR_ROLE_PERSISTENCE_AUTHORITY_WIRING_DESIGN_MATRIX_2026-07-06.md` returned `False` before authoring. | ACCEPT_NO_COLLISION |
| Search for any existing `fileBackedPersistenceActorRole` or `FILE_BACKED_PERSISTENCE_ALLOWED_ACTOR_ROLES` symbol in current source | Direct read of `mineru-system-chain-route-candidate.ts` lines 1-164 found no such field or constant anywhere in the file; the proposed names are new. | ACCEPT_NO_EXISTING_SYMBOL_COLLISION |
| Search for any existing call from the route candidate to `evaluateRuntimeMemoryAction` | Direct read of `mineru-system-chain-route-candidate.ts` found no import of, or reference to, `runtime-memory-hierarchy.ts` or `evaluateRuntimeMemoryAction` anywhere in the file. | ACCEPT_NO_REFERENCE_FOUND |

## Next Move

Next allowed move: operator decision on whether to author a fresh,
source-verified implementation packet that builds Option B exactly as
specified above (new optional field, new narrowly scoped allowlist constant
with an operator-approved role list, new fail-closed disposition token, and
one new runtime check inside `buildMineruSystemChainRouteCandidate`), select
a different held lane (production Memory/RAG memory-owner authorization
packet per R39-T1's next move, private-output policy, or use-case/legal
workflow), or stop this actor-role wiring design sub-lane. No
implementation, persistence-mode widening, runtime wiring, source/test edit,
or file-backed production release is authorized by this design decision.

## Claim Boundary

This design matrix is docs-only. It does not implement, execute, or invoke
file-backed persistence, does not construct or write to any file-backed
durable store, does not run MinerU runtime, does not read or release
private/generated MinerU output content, does not invoke production
Memory/RAG behavior, retrieval, or vectorization, does not edit any
source or test file, does not perform any provider/live call, and does not
create a public-sync, public claim, or production-readiness claim. It
records a design comparison and a named implementation-ready direction only,
and explicitly defers final allowlist-membership policy and all
implementation authorization to a future, separately authorized packet.
