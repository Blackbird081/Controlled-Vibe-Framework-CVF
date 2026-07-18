# CVF SOT Three-Layer Invariants And Negative Cases

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-12

Batch ID: SOT3-T2

## Purpose

Define the ten fail-closed invariants that govern every contract in
`docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md`, and
at least twelve concrete negative cases that map to those invariants with an
expected fail-closed outcome. This file is documentation-only: it defines
required behavior for a future source-verified implementation tranche and
creates no runtime, schema, test, guard, or checker.

## Scope / Target / Owner Boundary

Target: the ten baseline invariants carried from
`docs/baselines/CVF_GC018_SOT3_T2_CANONICAL_INTER_LAYER_CONTRACTS_2026-07-12.md`,
Contract Invariants section, plus the twelve-or-more negative cases required
by the SOT3-T2 work order's Evidence Requirements and the roadmap's Known
Prototype Gaps Requiring Independent Review.

Owner boundary: this file owns invariant and negative-case definitions only.
It does not own contract field shapes (owned by the companion contract-chain
file) or source-to-field reconciliation (owned by the companion source
reconciliation review).

## Scope / Methodology

Each invariant below states the rule, the contract(s) it binds, and the
negative case ID(s) that exercise it. Each negative case states the input
condition, the contract(s) involved, the expected fail-closed outcome, and
the source evidence for why the failure mode is real rather than
hypothetical.

## Ten Baseline Invariants

### Invariant 1 - Source identity precedes and persists

Source identity exists before normalization and persists by reference or
hash through the entire chain. A `RefineryPacket` must retain
`source_envelopes` referencing the original `SourceEnvelope.source_id` and
`content_hash`; nothing downstream may drop or replace that reference.

Bound contracts: `SourceEnvelope`, `RefineryPacket`.
Negative cases: NC-01 (indirectly, via zero-stage packets that would also
lose lineage), NC-06 (cross-packet evidence).

### Invariant 2 - Duplicate grouping precedes conflict evaluation

Within Refinery, duplicate grouping must complete before conflict detection
runs, because conflict-set preconditions (same subject/field, overlapping
scope, overlapping time window, differing normalized values) presuppose
records have already been grouped and normalized.

Bound contracts: `RefineryPacket`.
Negative cases: NC-01 (zero Refinery stages executed, so neither step ran).

### Invariant 3 - Zero executed Refinery stages cannot produce Kernel-ready status

A `RefineryPacket` must not reach `READY_FOR_KERNEL` when zero pipeline
stages executed. `transformation_lineage` must be non-empty and must record
at least one executed stage before `status` may become `READY_FOR_KERNEL`.
Zero executed stages must instead produce `status: BLOCKED` with
`failure_tokens` containing `REFINERY_NO_STAGES_EXECUTED`. `status` never
carries the failure reason itself; `BLOCKED` is a lifecycle state and
`REFINERY_NO_STAGES_EXECUTED` is a separate `failure_tokens` entry (see the
companion contract-chain file's `RefineryPacket` status-versus-failure-tokens
separation).

Bound contracts: `RefineryPacket`.
Negative cases: NC-01.

### Invariant 4 - Empty evidence or verification results cannot pass Kernel evaluation

A `KernelDecision` must not be `ACCEPT_EVIDENCE_CANDIDATE` when the
originating `KernelEvaluationRequest.evidence_refs` is empty, or when the
verification results Kernel itself produced while evaluating that request
(bound into `KernelDecision.verification_result_refs`) are empty.
`KernelEvaluationRequest` never carries a verification-result field itself;
Kernel is the sole producer of verification results, per the
Verification-result ownership and transport model in the companion
contract-chain file's `KernelEvaluationRequest` section. A `TruthReceipt`
must not report `decision: ACCEPT_EVIDENCE_CANDIDATE` when its
`verification_result_refs` array is empty.

Bound contracts: `KernelEvaluationRequest`, `KernelDecision`, `TruthReceipt`.
Negative cases: NC-02, NC-03.

### Invariant 5 - Receipt binds every authority-bearing field under one canonical preimage profile with a published test vector

`TruthReceipt.receipt_hash` must bind every authority-bearing receipt field
together: `receipt_id`, `decision_id`, `decision`, `evaluated_content_hash`,
`evidence_refs`, `obligation_refs`, `verification_result_refs`,
`policy_version`, `rule_version`, `decided_at_utc`, `issued_at_utc`, and
`predecessor_receipt_hash`. The hash is the SHA-256 digest of exactly one
canonical preimage byte sequence defined by the
`cvf.sotThreeLayer.receiptHash.v1` profile: UTF-8 canonical JSON with no
insignificant whitespace, RFC 8785 (JCS) string serialization (minimal
escaping, literal UTF-8 for non-ASCII, no Unicode pre-normalization), fixed
named fields in fixed order, ISO 8601 UTC timestamps
(`YYYY-MM-DDTHH:MM:SSZ`), JSON `null` for absent scalars and `[]` for empty
collections, collection arrays sorted lexicographically by reference
identifier (Unicode code point order, ascending), and `receipt_hash` itself
excluded from its own preimage. The profile identifier and digest algorithm
are included in the preimage so a future profile change is detectable.
`receipt_id` is included as the receipt's required identity and
authority-bearing field. A receipt whose hash covers only a subset of these
fields, or uses a different digest, encoding, field order, timestamp form,
null/empty representation, collection ordering, or non-JCS string escaping
rule, does not satisfy this invariant. An actor must not be able to
substitute the receipt identity, evidence, obligation, or
verification-result bindings without violating `receipt_hash`, and any two
independent verifiers computing `receipt_hash` from the same receipt field
values must produce the same digest. The contract-chain file publishes one
complete illustrative canonical preimage (522 bytes) and its verified
SHA-256 digest (`bc32424380bd483ca208edd8ee18bcaaa874b109584341e8febc01b5e46ab5a3`)
as a profile conformance test vector.

Bound contracts: `TruthReceipt`.
Negative cases: NC-05, NC-07, NC-08.

### Invariant 6 - Only Kernel creates TruthReference, and only from an eligible accepting receipt with a complete resolution chain, content/version equality, and empty failed_obligations

No layer other than CVF Truth Kernel may produce a `TruthReference`. A
`TruthReference` not traceable to an `ISSUED` `TruthReceipt` from Kernel is
invalid. Traceability to an `ISSUED` receipt is necessary but not
sufficient: Kernel may mint a `TruthReference` only from a `TruthReceipt`
that satisfies the Eligible-Acceptance-Only Issuance Rule in the companion
contract-chain file's `TruthReference` section. That rule requires Kernel
to resolve the immutable `KernelDecision` identified by
`TruthReceipt.decision_id` and then resolve the immutable
`KernelEvaluationRequest` identified by `KernelDecision.request_id`, and
verify: `TruthReceipt.decision` matches `KernelDecision.decision`;
`TruthReceipt.verification_result_refs` matches
`KernelDecision.verification_result_refs`; `TruthReceipt.evidence_refs`
matches `KernelEvaluationRequest.evidence_refs`; `TruthReceipt.obligation_refs`
matches `KernelEvaluationRequest.obligation_refs`;
`TruthReceipt.evaluated_content_hash` matches both
`KernelDecision.packet_hash` and `KernelEvaluationRequest.packet_hash` (all
three equal); `TruthReceipt.policy_version` matches both
`KernelDecision.policy_version` and `KernelEvaluationRequest.policy_version`
(all three equal); `TruthReceipt.rule_version` matches both
`KernelDecision.rule_version` and `KernelEvaluationRequest.rule_version`
(all three equal); the resolved decision is `ACCEPT_EVIDENCE_CANDIDATE`;
`KernelDecision.failed_obligations` is empty; and no verification result
bound to the receipt carries a blocking `FAIL` or `BLOCKED` status.
`TruthReceipt` does not carry a `failed_obligations` field; that field
belongs to `KernelDecision` only. `KernelDecision` does not carry
`evidence_refs` or `obligation_refs`; those belong to
`KernelEvaluationRequest` only. The resolution chain uses only fields
actually defined on each contract. A receipt recording `REJECT`,
`ESCALATE`, or `REQUIRE_ADDITIONAL_EVIDENCE` is a valid, `ISSUED` receipt
but can never back a `TruthReference`. Every missing record, broken link,
or field mismatch (including content hash or version mismatch across
receipt, decision, and request) fails closed and blocks reference
issuance.

Bound contracts: `TruthReceipt`, `TruthReference`, `KernelDecision`,
`KernelEvaluationRequest`.
Negative cases: NC-04A, NC-04B, NC-07, NC-10.

### Invariant 7 - Flow cannot publish from caller-supplied approval booleans

`DistributionPackage.routing_decision` must be derived from a bound, resolvable
`TruthReference`, never from an unverified boolean or string ID supplied by a
caller.

Bound contracts: `DistributionPackage`.
Negative cases: NC-11.

### Invariant 8 - Distribution requires a valid, non-expired Kernel receipt/reference

A `DistributionPackage` must not be created with an empty `truth_references`
collection, and every referenced `TruthReference.reference_state` must read
`ACTIVE` (not `EXPIRED`, `SUPERSEDED`, or `REVOKED`) at creation time, per
the companion contract-chain file's single-field `reference_state` model and
precedence rule.

Bound contracts: `DistributionPackage`, `TruthReference`.
Negative cases: NC-09, NC-10.

### Invariant 9 - Feedback is proposal-only and cannot mutate authority directly

A `FeedbackProposal` can never directly mutate a `TruthReceipt`,
`TruthReference`, evidence record, or source score. Only an `ACCEPTED`
proposal may trigger a separate, governed mutation action owned by the
target surface, outside this contract chain's scope.

Bound contracts: `FeedbackProposal`.
Negative cases: NC-12.

### Invariant 10 - Direct import of retained competing packet/runtime shapes is forbidden

No contract in the chain may be satisfied by directly importing a retained
competing shape (for example, the Flow-embedded `RefineryPacket` variant or
the `publish-gate.ts` boolean). Competing shapes are recorded as
`REJECT_DIRECT_IMPORT` in the companion contract-chain and source
reconciliation files, not merged or aliased.

Bound contracts: all eight.
Negative cases: NC-01 through NC-12 plus NC-04A collectively exercise this
invariant by confirming no negative case is resolved by silently accepting
a retained incompatible shape.

## Negative Cases (14/12, minimum satisfied)

Fourteen negative cases are defined. The completion review's R4 repair
(non-acceptance receipts must never mint a `TruthReference`) required one
additional case, NC-04A, beyond the twelve originally required. The
completion review's R8 repair (the `failed_obligations` authority path must
be explicit) required one further case, NC-04B, proving that
decision-resolution mismatch or non-empty `failed_obligations` fails closed.
The work order's at-least-12 minimum remains satisfied, and every one of the
twelve originally required case categories (zero Refinery stages, empty
evidence, empty verification results, packet-hash mismatch, receipt-content
mismatch, policy/rule-version mismatch, cross-packet evidence, replayed
receipt, expired TruthReference, revoked/superseded reference,
caller-supplied approval boolean, direct feedback mutation) is still
present.

| ID | Case | Contract(s) | Input condition | Expected fail-closed outcome | Invariant(s) |
|---|---|---|---|---|---|
| NC-01 | Zero Refinery stages | `RefineryPacket` | `transformation_lineage` is empty; no pipeline stage executed | `status` must be `BLOCKED` with `failure_tokens` containing `REFINERY_NO_STAGES_EXECUTED`, not `READY_FOR_KERNEL`; packet is rejected before reaching Kernel | Invariant 3, Invariant 2 |
| NC-02 | Empty evidence | `KernelEvaluationRequest`, `KernelDecision` | `evidence_refs` on the request resolves to an empty set at evaluation time | `KernelDecision.decision` must be `REJECT` or `REQUIRE_ADDITIONAL_EVIDENCE`, never `ACCEPT_EVIDENCE_CANDIDATE` | Invariant 4 |
| NC-03 | Empty verification results | `TruthReceipt` | the verification results Kernel produced while evaluating the request (bound via `verification_result_refs`) resolve to an empty set | `TruthReceipt` must not be `ISSUED` with `decision: ACCEPT_EVIDENCE_CANDIDATE`; issuance blocks until verification results exist | Invariant 4 |
| NC-04 | Packet-hash mismatch | `KernelEvaluationRequest` | `packet_hash` on the request does not match the current content hash of the referenced `RefineryPacket` | request is rejected before evaluation; Kernel must not evaluate a packet whose content does not match the bound hash | Invariant 1, Invariant 5 |
| NC-04A | Non-acceptance receipt reference-issuance attempt | `TruthReceipt`, `TruthReference` | a `TruthReceipt` with `decision` equal to `REJECT`, `ESCALATE`, or `REQUIRE_ADDITIONAL_EVIDENCE` (an `ISSUED`, non-revoked receipt) is submitted as the basis for a new `TruthReference` | `TruthReference` issuance is rejected; only a receipt with `decision: ACCEPT_EVIDENCE_CANDIDATE`, all mandatory obligations satisfied, and no blocking verification failure may back a `TruthReference`, per the Eligible-Acceptance-Only Issuance Rule | Invariant 6 |
| NC-04B | Decision-resolution mismatch, broken link, content/version mismatch, or non-empty failed_obligations | `TruthReceipt`, `TruthReference`, `KernelDecision`, `KernelEvaluationRequest` | Kernel cannot resolve the immutable `KernelDecision` identified by `TruthReceipt.decision_id`; or cannot resolve the immutable `KernelEvaluationRequest` identified by `KernelDecision.request_id`; or `TruthReceipt.decision` does not exactly match `KernelDecision.decision`; or `TruthReceipt.verification_result_refs` does not match `KernelDecision.verification_result_refs`; or `TruthReceipt.evidence_refs` does not match `KernelEvaluationRequest.evidence_refs`; or `TruthReceipt.obligation_refs` does not match `KernelEvaluationRequest.obligation_refs`; or `TruthReceipt.evaluated_content_hash` does not match `KernelDecision.packet_hash` and `KernelEvaluationRequest.packet_hash` (all three must be equal); or `TruthReceipt.policy_version` does not match `KernelDecision.policy_version` and `KernelEvaluationRequest.policy_version` (all three must be equal); or `TruthReceipt.rule_version` does not match `KernelDecision.rule_version` and `KernelEvaluationRequest.rule_version` (all three must be equal); or the resolved `KernelDecision.failed_obligations` is non-empty | `TruthReference` issuance is rejected; every missing record, broken link, or field mismatch (including content hash or version mismatch across receipt, decision, and request) fails closed and blocks reference issuance, per the Decision-Resolution Model and Eligible-Acceptance-Only Issuance Rule | Invariant 6 |
| NC-05 | Receipt-content mismatch, non-canonical hash profile, or missing receipt identity | `TruthReceipt` | `receipt_hash` does not resolve to the SHA-256 digest of the `cvf.sotThreeLayer.receiptHash.v1` canonical preimage (UTF-8, RFC 8785 JCS string serialization, no insignificant whitespace, fixed named fields in fixed order including `receipt_id`, ISO 8601 UTC timestamps, `null` for absent scalars, `[]` for empty collections, collection arrays sorted lexicographically by reference identifier, `receipt_hash` excluded from its own preimage) covering every authority-bearing receipt field (`receipt_id`, `decision_id`, `decision`, `evaluated_content_hash`, `evidence_refs`, `obligation_refs`, `verification_result_refs`, `policy_version`, `rule_version`, `decided_at_utc`, `issued_at_utc`, `predecessor_receipt_hash`); or the computed digest does not match the published test vector for the illustrative preimage | receipt is invalid on verification; downstream consumers must reject it, not accept a partial-field hash, a missing `receipt_id`, a different digest/encoding/escaping, or a non-canonical preimage as sufficient | Invariant 5 |
| NC-06 | Cross-packet evidence | `KernelEvaluationRequest`, `KernelDecision` | an `evidence_refs` entry resolves to evidence captured for a different `RefineryPacket`/`source_id` than the one under evaluation | evidence is disqualified for this decision; `KernelDecision` must not reach `ACCEPT_EVIDENCE_CANDIDATE` using evidence bound to a different packet's lineage | Invariant 1, Invariant 4 |
| NC-07 | Policy/rule-version mismatch | `KernelEvaluationRequest`, `TruthReceipt` | `policy_version`/`rule_version` on the request does not match the version Kernel is currently authorized to evaluate under | evaluation is rejected or escalated, not silently evaluated under a stale or unexpected version; receipt must not bind a version Kernel did not actually apply | Invariant 5 |
| NC-08 | Replayed receipt | `TruthReceipt` | a `receipt_id` that is already `ISSUED` is submitted again for re-issuance with the same `decision_id` | re-issuance is rejected; a superseding receipt must be a new `receipt_id` with `predecessor_receipt_hash` set, not a duplicate of the original | Invariant 5, Invariant 6 |
| NC-09 | Expired TruthReference | `TruthReference`, `DistributionPackage` | `valid_until_utc` on the referenced `TruthReference` has passed and no explicit `REVOKED`/`SUPERSEDED` transition was recorded | `reference_state` must read `EXPIRED` (derived from `valid_until_utc` under the precedence rule); `DistributionPackage` creation using this reference is rejected | Invariant 8 |
| NC-10 | Revoked/superseded reference | `TruthReference`, `DistributionPackage` | referenced `TruthReference.reference_state` is `REVOKED` (Kernel revoked the receipt or reference) or `SUPERSEDED` (a newer reference for the same scope exists) | distribution using this reference is rejected; only the current `reference_state: ACTIVE` reference for the scope may be distributed | Invariant 6, Invariant 8 |
| NC-11 | Caller-supplied approval boolean | `DistributionPackage` | a caller supplies `truthKernelAccepted: true` (or an equivalent boolean/string ID) without a resolvable bound `TruthReference` | `routing_decision` must not be derived from the boolean; distribution is rejected until a real `TruthReference` resolves | Invariant 7 |
| NC-12 | Direct feedback mutation | `FeedbackProposal` | a proposal, or a caller acting outside this contract, attempts to call a direct mutation path (for example, an `updateSourceScore()`-class function) instead of submitting a proposal for review | the direct mutation path is rejected; only an `ACCEPTED` `FeedbackProposal`, followed by a separate governed mutation action outside this chain, may change the target | Invariant 9 |

## Source Evidence For Failure-Mode Reality

Each negative case corresponds to a specific gap the retained prototype
exhibited, per the roadmap's Known Prototype Gaps table and T0R Axis 4/6
evidence, so these are not hypothetical risks invented for this file:

| Negative case | Retained-prototype evidence it closes |
|---|---|
| NC-01 | roadmap Known Prototype Gaps, "Refinery engine" row: default stage input can be an empty array |
| NC-02, NC-03 | T0R Axis 4 evidence-against: `truth-receipt.ts` lines 26-30 return `status: 'pass'` on an empty `verification_results` array; `strict-mode.ts` lines 3-8 pass on empty results |
| NC-04 | roadmap Known Prototype Gaps, "Kernel receipt" row: receipt binding is incomplete |
| NC-04A | roadmap Known Prototype Gaps, "Flow lifecycle" row: caller-controlled transitions can promote to `VERIFIED` without receipt proof, which includes treating a non-accepting Kernel outcome as if it authorized distribution; T0R Axis 4 evidence-against confirms no gate code checks evidence/verification status before issuing downstream authority |
| NC-04B | T0R Axis 4 evidence-against: no gate code checks evidence/verification status before issuing downstream authority, which includes failing to resolve the authoritative `KernelDecision` and `KernelEvaluationRequest` and verify `failed_obligations`, binding consistency, and content/version equality before minting a `TruthReference`; the retained prototype has no decision-resolution step at reference-issuance time |
| NC-05 | T0R Axis 4 evidence-against: the receipt hash (`hash-chain.ts` via `truth-receipt.ts` line 48) covers receipt metadata, not full packet content; the R7 repair widens this to every authority-bearing receipt field, the R10 repair fixes one canonical preimage profile, and the R11 repair adds `receipt_id` and RFC 8785 JCS string serialization with a published test vector so independent verifiers produce the same digest |
| NC-06 | T0R Axis 4 evidence-against: `truth.packet.schema.json` line 6 `additionalProperties: true` leaves the shared boundary open, permitting evidence not scoped to the packet under evaluation |
| NC-07 | T0R Axis 4 evidence-against: `EVIDENCE_REGISTRY_SPEC.md` line 51 requires `approved`-status evidence in STRICT mode but no gate code checks evidence status, only verification-result status; version drift is the same class of un-enforced precondition |
| NC-08 | roadmap Known Prototype Gaps, "Flow lifecycle" row: caller-controlled transitions can promote to `VERIFIED` without receipt proof, which includes reusing a prior receipt without a fresh Kernel evaluation |
| NC-09, NC-10 | T0R Producer/Consumer table, `TruthReference` row: scoped/versioned/time-bounded/supersession-aware is a required property with no current runtime symbol, so expiry and revocation enforcement is new work, not a retained gap being closed |
| NC-11 | roadmap Known Prototype Gaps, "Flow publish gate" row: booleans and a string receipt ID are trusted without receipt verification; T0R Producer/Consumer table, `DistributionPackage` row: `publish-gate.ts` `PublishGateInput.truthKernelAccepted: boolean` |
| NC-12 | T0R Producer/Consumer table, `FeedbackProposal` row: `source-score.ts` `updateSourceScore()` direct mutation |

## Risk / Corrective Action

| Risk | Corrective action |
|---|---|
| a future implementation treats an empty collection as vacuously passing | Invariants 3 and 4 explicitly name the zero/empty case and bind it to NC-01/NC-02/NC-03 |
| a receipt hash is narrowed back to metadata-only, a partial-field subset, a missing receipt identity, or a non-canonical encoding/escaping during implementation | Invariant 5 and NC-05/NC-07/NC-08 require the hash to bind every authority-bearing receipt field (including `receipt_id`) under one fixed canonical preimage profile (`cvf.sotThreeLayer.receiptHash.v1`, SHA-256, UTF-8 RFC 8785 JCS-canonical JSON, lexicographic collection ordering) with a published test vector so any two independent verifiers produce the same digest |
| Flow re-acquires a pre-Kernel or trust-evaluation role during implementation | Invariants 6, 7, and 8 and NC-09 through NC-11 keep Flow's authority strictly post-Kernel and receipt/reference-bound |
| a rejected, escalated, or additional-evidence-required receipt is treated as sufficient to mint a TruthReference | Invariant 6 and NC-04A require the Eligible-Acceptance-Only Issuance Rule (`ACCEPT_EVIDENCE_CANDIDATE` plus satisfied obligations plus no blocking verification failure) before any TruthReference is minted |
| a TruthReference is minted without resolving the complete receipt-to-decision-to-request chain, without content/version equality, or when failed_obligations is non-empty | Invariant 6 and NC-04B require Kernel to resolve the immutable `KernelDecision` via `TruthReceipt.decision_id` and the immutable `KernelEvaluationRequest` via `KernelDecision.request_id`, verify decision/verification-result/evidence/obligation bindings against the correct contract, verify `evaluated_content_hash`/`packet_hash`, `policy_version`, and `rule_version` equality across receipt, decision, and request, and confirm `failed_obligations` is empty before reference issuance; every missing record, broken link, or field mismatch fails closed |
| a feedback path is wired directly to a mutation function for convenience | Invariant 9 and NC-12 require proposal-only status with a separate governed acceptance step |
| this file's invariant list drifts from the contract-chain file's per-contract rules | each invariant above cites the exact bound contract(s) and negative case(s); the companion contract-chain file's per-contract "Invalid transitions" bullets restate the same negative cases by ID |

## Decision / Disposition

Disposition: `COMPLETE_PENDING_REVIEW`. All ten baseline invariants are
defined and mapped to at least one negative case and one contract
field/status rule. Fourteen negative cases are defined (twelve originally
required plus NC-04A added by the completion review's R4 repair and NC-04B
added by the completion review's R8 repair), each with a fail-closed
expected outcome and source evidence. This file creates no runtime, schema,
test, guard, or checker; it is a documentation contract for a future
source-verified implementation tranche.

## Epistemic Process Block

Epistemic Process Applicability: HIGH_EVIDENCE

Expected Result / Prediction: the ten baseline invariants can each be mapped
to at least one concrete, source-backed negative case and one companion
contract-chain field/status rule, per the work order's Contract Invariants
requirement.

Evidence Comparison Requirement: each invariant and negative case was
compared against the SOT3 roadmap's Known Prototype Gaps table and T0R's
Axis 4 and Axis 6 evidence-against citations, not asserted without a source.

Contradiction Or Gap Disposition: every one of the twelve required
negative-case categories named in the work order maps to a specific
retained-prototype gap cited in the Source Evidence For Failure-Mode Reality
table; no negative case was invented without source grounding. The
completion review found gaps across two bounded-repair rounds that bear
directly on this file. Round 1 found three gaps: NC-01's outcome token
conflated a lifecycle status with a failure-reason code (R2); NC-03's
phrasing implied `KernelEvaluationRequest` carries verification results it
does not define (R3); and no negative case existed for a non-accepting
receipt being used to mint a `TruthReference` (R4). Round 1 corrected NC-01
and NC-03 and added NC-04A. Round 2 found two further gaps: Invariant 5 and
NC-05 did not bind the evidence/obligation/verification-result decision
basis into `receipt_hash` (R7), and Invariant 6 and the Eligible-Acceptance-
Only Issuance Rule cited `failed_obligations` without defining whether the
receipt copies that field or how `decision_id` resolves the authoritative
decision (R8). Round 2 widens Invariant 5 and NC-05 to every
authority-bearing receipt field with deterministic lexicographic collection
ordering, updates Invariant 6 to require decision resolution of the
immutable `KernelDecision` with empty `failed_obligations`, and adds NC-04B
to prove decision-resolution mismatch or non-empty `failed_obligations`
fails closed. Round 3 found two further gaps: the round 2
decision-resolution comparison targeted `evidence_refs`/`obligation_refs`
on `KernelDecision`, which does not define those fields (R9), and the
round 2 receipt hash serialization permitted multiple encodings that
produce different digests for the same receipt (R10). Round 3 corrects
R9 by defining the complete receipt-to-decision-to-request resolution
chain using only fields actually defined on each contract
(`TruthReceipt.evidence_refs`/`obligation_refs` compared to
`KernelEvaluationRequest`, not `KernelDecision`), and corrects R10 by
replacing the multi-encoding rule with one fixed canonical preimage
profile (`cvf.sotThreeLayer.receiptHash.v1`, SHA-256, UTF-8 canonical
JSON, lexicographic collection ordering) so any two independent verifiers
produce the same digest. Round 4 found two further gaps: the canonical
preimage omitted `receipt_id` and left JSON string bytes ambiguous under
generic "standard JSON escaping" (R11), and the resolution chain did not
compare `evaluated_content_hash`/`packet_hash`, `policy_version`, or
`rule_version` across receipt, decision, and request (R12). Round 4
corrects R11 by adding `receipt_id` to the canonical preimage, replacing
generic JSON escaping with RFC 8785 JCS string serialization, and
publishing one complete test vector with its verified SHA-256 digest; and
corrects R12 by extending the resolution chain to require exact equality
of `evaluated_content_hash`/`packet_hash`, `policy_version`, and
`rule_version` across receipt, decision, and request.

Claim Update Requirement: all ten invariants and fourteen negative cases
carry an explicit fail-closed expected outcome and bound contract(s); none
remain unclassified or asserted without evidence.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude no-commit documentation-contract worker |
| Provider or surface | local authorized private provenance workspace |
| Session or invocation | SOT3-T2 canonical inter-layer contract authoring execution, 2026-07-12 |
| Working directory | repository root |
| Command or tool surface | Read, Grep, Bash read-only enumeration, git read-only |
| Target paths | accepted T0R Axis 4/6 evidence, SOT3 roadmap Known Prototype Gaps table, companion contract-chain file |
| Allowed scope source | SOT3-T2 work order Planned Worker Fulfillment Manifest |
| Before status evidence | executionBaseHead `8e318cc92`; clean worktree at worker start |
| After status evidence | this invariants and negative-case reference created; no runtime, schema, test, guard, or checker mutation |
| Diff evidence | `git status --short` and `git diff --name-status` list this file as an addition alongside the other four worker-owned outputs |
| Approval boundary | fail-closed invariant and negative-case documentation authoring only |
| Claim boundary | no runtime enforcement, test, guard, checker, provider/live proof, or readiness claim |
| Agent type | no-commit documentation-contract worker |
| Invocation ID | `sot3-t2-canonical-inter-layer-contracts-execution-2026-07-12` |
| Expected manifest | contract chain reference; invariants and negative cases reference; README; source reconciliation review; worker return |
| Actual changed set | contract chain reference; invariants and negative cases reference; README; source reconciliation review; worker return |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: create-only worker output; no source or governed artifact deleted or renamed |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | SOT three-layer invariant and negative-case documentation only |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE |
| receiptEvidence | CVF_RECEIPT_PRESENT - each negative case cites its source-backed retained-prototype gap in the Source Evidence For Failure-Mode Reality table |
| actionEvidence | ACTION_EVIDENCE_PRESENT - this file's invariant and negative-case tables are the tranche action |
| invocationBoundary | local documentation authoring only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, or runtime interception behavior claimed |
| claimLanguage | bounded documentation-only fail-closed invariant specification |
| forbiddenExpansion | runtime, schema, test, guard, checker, package implementation, direct import, provider/live proof, public-sync, release, readiness |

## Claim Boundary

This file defines fail-closed invariants and negative cases as documentation
contract language only. It does not implement a runtime check, test suite,
guard, or checker, and it does not claim that any current CVF runtime
enforces these invariants today. Enforcement is the responsibility of a
future, separately authorized implementation tranche (SOT3-T3 through T5 or
later).
