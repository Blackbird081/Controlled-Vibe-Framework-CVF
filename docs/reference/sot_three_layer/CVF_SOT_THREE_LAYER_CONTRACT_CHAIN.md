# CVF SOT Three-Layer Contract Chain

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-12

Batch ID: SOT3-T2

contractVersion: `cvf.sotThreeLayer.contractChain.sot3t2.v1`

## Purpose

Define the CVF-owned, documentation-only canonical contract chain for the
accepted SOT three-layer architecture (Refinery prepares, Kernel evaluates
trust, Flow distributes post-Kernel). This is the CAP-01 new-owner-candidate
architecture family authorized by SOT3-T1's owner and novelty reconciliation
and dispatched by the SOT3-T2 work order. It defines exactly eight canonical
contract types, one sole producer and allowed-consumer set per type, field
minimums, status vocabulary, valid and invalid transitions, an authority
boundary, source provenance, and a compatibility/exclusion decision for each
type. It creates no runtime, schema, test, guard, checker, or package.

## Scope / Target / Owner Boundary

Target: the complete Refinery-to-Kernel-to-Flow contract chain:

```text
SourceEnvelope
  -> RefineryPacket
  -> KernelEvaluationRequest
  -> KernelDecision + TruthReceipt
  -> TruthReference
  -> DistributionPackage
  -> FeedbackProposal
```

Owner boundary: this file is the sole canonical producer/consumer/field/status
authority for the eight contract types listed above. It supersedes no
existing CVF owner surface. It does not create or claim a runtime symbol,
TypeScript interface, JSON Schema, database table, API endpoint, checker, or
package. `docs/reference/truth_foundation/CVF_TRUTH_FOUNDATION_SOURCE_PROVENANCE_AND_VERIFICATION_CONTRACT.md`
(TKG-T1) remains the upstream doctrine owner for source authority, provenance
labels, evidence/obligation/verification-result minimums, and claim-movement
semantics; this chain narrows TKG-T1's single governing chain into the
three-module topology and binds each doctrine concept to a concrete contract
type and field set. `docs/reference/agent_system_skills/CVF_SKILL_SOURCE_OF_TRUTH_PACKET_STANDARD.md`
remains the owner for ASSF skill-package truth packets, a narrower vertical
slice this chain does not replace.

## Canonical Authority Rule

Exactly one contract type owns each stage-to-stage handoff. No contract type
may be produced by more than one layer. Kernel is the sole issuer of
`KernelDecision`, `TruthReceipt`, and `TruthReference`; no other layer may
mint, forge, or restate these types. Refinery never declares truth. Flow
never evaluates trust and never re-implements a second `RefineryPacket`
producer. Feedback is proposal-only and can never directly mutate a
`TruthReceipt`, `TruthReference`, evidence record, or source score.

## Contract Inventory (8/8)

| # | Contract type | Sole producer | Layer |
|---|---|---|---|
| 1 | `SourceEnvelope` | governed intake adapter | pre-Refinery boundary |
| 2 | `RefineryPacket` | CVF Refinery | Refinery |
| 3 | `KernelEvaluationRequest` | Kernel adapter (Refinery-side submission boundary) | Refinery-to-Kernel boundary |
| 4 | `KernelDecision` | CVF Truth Kernel | Kernel |
| 5 | `TruthReceipt` | CVF Truth Kernel | Kernel |
| 6 | `TruthReference` | CVF Truth Kernel | Kernel |
| 7 | `DistributionPackage` | CVF Truth Flow | Flow |
| 8 | `FeedbackProposal` | CVF Truth Flow or a governed consumer, under policy | Flow |

## 1. SourceEnvelope

- **Sole producer:** governed intake adapter (outside Refinery; captures raw
  or extracted material before any normalization).
- **Allowed consumers:** CVF Refinery only.
- **Required field minimums:** `source_id`, `source_type`, `owner`,
  `captured_at_utc`, `scope`, `purpose`, `confidentiality`, `content_hash`,
  `raw_reference`.
- **Status vocabulary:** `CAPTURED`, `REJECTED_AT_INTAKE`.
- **Valid transitions:** `CAPTURED -> (consumed by Refinery, envelope
  persists by reference in lineage)`.
- **Invalid transitions:** `CAPTURED -> KERNEL_READY` (SourceEnvelope cannot
  skip Refinery); any transition that discards `content_hash` or
  `raw_reference` before Refinery consumes it.
- **Authority boundary:** SourceEnvelope establishes identity only. It
  carries no trust, approval, or quality judgment. Refinery, Kernel, and Flow
  must not produce a second, competing SourceEnvelope for the same raw
  material.
- **Source provenance:** `docs/reviews/CVF_SOT3_T0R_THREE_LAYER_ARCHITECTURE_DECISION_RECOMMENDATION_2026-07-12.md`,
  Producer/Consumer Packet And Receipt Mapping table, `SourceEnvelope` row
  (fields per retained `SOURCE_ENVELOPE_SPEC.md`, cited by T0R Axis 2).
- **Compatibility/exclusion decision:** `ADAPT` - field list adapted from the
  retained spec's mandatory validation fields; the retained Flow-side
  `attach-source.ts` `SourceAttachment`/`IntakeRecord` second capture point is
  excluded (`REJECT_DIRECT_IMPORT`) because it duplicates this sole-producer
  role inside Flow, which T0R Axis 2/5 resolved against.

## 2. RefineryPacket

- **Sole producer:** CVF Refinery.
- **Allowed consumers:** CVF Truth Kernel only (via `KernelEvaluationRequest`
  submission).
- **Required field minimums:** `refinery_packet_id`, `source_envelopes`,
  `normalized_records`, `duplicate_groups`, `conflict_sets`,
  `quality_findings`, `integrity_results`, `transformation_lineage`,
  `declared_scope`, `declared_owner`, `rule_manifest`, `status`,
  `failure_tokens`, `created_at_utc`.
- **Status vocabulary (`status` field, lifecycle only):** `IN_PROGRESS`,
  `READY_FOR_KERNEL`, `REVIEW_REQUIRED`, `BLOCKED`. `status` never carries an
  error or reason code; every failure reason belongs in `failure_tokens`
  instead (see field minimums above).
- **`failure_tokens` vocabulary (reason codes, not lifecycle states):**
  `REFINERY_NO_STAGES_EXECUTED`, `QUALITY_CHECK_FAILED`,
  `INTEGRITY_CHECK_FAILED`, `SCHEMA_VALIDATION_FAILED`. `failure_tokens` is
  populated whenever `status` is `REVIEW_REQUIRED` or `BLOCKED`, and remains
  empty when `status` is `IN_PROGRESS` or `READY_FOR_KERNEL`.
- **Valid transitions:** `IN_PROGRESS -> READY_FOR_KERNEL` (only when at
  least one Refinery stage executed and `transformation_lineage` is
  non-empty, and no failure token was recorded); `IN_PROGRESS ->
  REVIEW_REQUIRED` (a quality or integrity finding needs human/governed
  review before the packet can proceed, `failure_tokens` records
  `QUALITY_CHECK_FAILED` and/or `INTEGRITY_CHECK_FAILED`); `IN_PROGRESS ->
  BLOCKED` (a hard failure makes the packet permanently ineligible for this
  run, including zero executed stages, `failure_tokens` records the specific
  reason, for example `REFINERY_NO_STAGES_EXECUTED`).
- **Invalid transitions:** `IN_PROGRESS -> READY_FOR_KERNEL` when
  `transformation_lineage` is empty or zero stages executed - this case must
  instead reach `BLOCKED` with `failure_tokens` containing
  `REFINERY_NO_STAGES_EXECUTED` (see Invariant 3 in the companion invariants
  file); any transition that sets `status` to `READY_FOR_KERNEL` while
  `duplicate_groups` or `conflict_sets` were never evaluated for records that
  require them; any `READY_FOR_KERNEL` or `IN_PROGRESS` packet carrying a
  non-empty `failure_tokens` (a non-empty `failure_tokens` requires `status`
  to be `REVIEW_REQUIRED` or `BLOCKED`).
- **Authority boundary:** RefineryPacket marks material as structurally
  eligible for evaluation. It is not trusted, canonical, or truth-approved.
  Refinery must contain no AI, agent, prompt, provider-SDK, or authority
  decision; RefineryPacket must never carry a truth-approval or
  Kernel-decision field.
- **Source provenance:** T0R Producer/Consumer table, `RefineryPacket` row
  (fields per retained `REFINERY_PACKET_SPEC.md`, snake_case canonical form).
- **Compatibility/exclusion decision:** `ADAPT` - canonical snake_case field
  set adapted from `REFINERY_PACKET_SPEC.md`. The retained Flow-embedded
  `refinery-engine.ts` `RefineryPacket` (`packetId`, camelCase,
  `READY_FOR_VERIFICATION` status) is `REJECT_DIRECT_IMPORT` per T0R Axis 5/7:
  it is a second, incompatible producer of the same contract type and is
  retired, not merged.

### RefineryPacket Packet-Binding Hash Canonical Profile (`cvf.sotThreeLayer.refineryPacketHash.v1`)

`RefineryPacket` has no top-level `content_hash` field of its own, but
`KernelEvaluationRequest.packet_hash` and its Kernel-side registered
`RefineryPacketRef.content_hash` both require a binding-identity value
comparable at Kernel admission (see section 3, Invalid Transitions, and
Negative Case NC-04). CVF Refinery is the sole owner of the canonical
algorithm that derives this binding identity from a `RefineryPacket`, since
Refinery is the sole producer of `RefineryPacket` itself.

- **Owning package:** `EXTENSIONS/CVF_REFINERY/src/packet-hash/packet-hash.ts`,
  exported from `EXTENSIONS/CVF_REFINERY/src/index.ts` as
  `computeRefineryPacketHash`, `buildRefineryPacketHashPreimage`,
  `REFINERY_PACKET_HASH_PROFILE`, and `REFINERY_PACKET_HASH_DIGEST_ALGORITHM`.
- **Included field projection:** all fourteen `RefineryPacket` field
  minimums listed above (`refinery_packet_id`, `source_envelopes`,
  `normalized_records`, `duplicate_groups`, `conflict_sets`,
  `quality_findings`, `integrity_results`, `transformation_lineage`,
  `declared_scope`, `declared_owner`, `rule_manifest`, `status`,
  `failure_tokens`, `created_at_utc`), named explicitly rather than derived
  from an arbitrary enumerable-property walk.
- **Canonicalization:** object keys are sorted lexicographically at every
  nesting level (construction-order independence for objects); array
  element order is preserved exactly, since every `RefineryPacket` array
  field is a semantically ordered list of records or events, not an
  unordered reference set (this differs from the sibling
  `cvf.sotThreeLayer.receiptHash.v1` profile, whose `evidence_refs`/
  `obligation_refs`/`verification_result_refs` are unordered reference sets
  and are therefore sorted). String scalars use the same RFC 8785
  (JCS)-style minimal-escaping serialization as
  `cvf.sotThreeLayer.receiptHash.v1`.
- **Digest format:** SHA-256 over the UTF-8 canonical-JSON preimage bytes,
  returned as `sha256:<lowercase-hex>` (matching the format already used by
  Refinery's own integrity-stage content hash and by the Kernel-side
  `RefineryPacketRef.content_hash`/`KernelEvaluationRequest.packet_hash`
  fields this value is compared against; this differs from
  `cvf.sotThreeLayer.receiptHash.v1`, which returns a bare hex digest).
- **Rejection rule:** `undefined`, functions, symbols, `bigint`, and
  non-finite numbers (`NaN`/`Infinity`) are rejected by throwing
  `UnsupportedPacketHashValueError` rather than being silently dropped or
  coerced by generic `JSON.stringify` behavior.
- **Versioning:** the profile identifier
  (`cvf.sotThreeLayer.refineryPacketHash.v1`) is bound into the preimage
  itself as `refinery_packet_hash_profile`, so a future `.v2` profile change
  is guaranteed to produce a different digest even if the field projection
  is otherwise unchanged. No caller-selectable profile parameter exists;
  the owner API always computes exactly this one profile.
- **Published test vector:** `EXTENSIONS/CVF_REFINERY/tests/packet-hash-vector.test.ts`
  fixes one canonical `RefineryPacket`, its exact 1337-byte UTF-8 preimage,
  and its SHA-256 digest
  (`sha256:3854d51f58485b3672032dfdc478cfb2ad41402f2a6255aff36932bf19888ee9`),
  reproduced byte-for-byte by any independent implementation of this
  profile.
- **Consumer migration:** `EXTENSIONS/CVF_SOT_THREE_LAYER_SLICE/` (the T6
  three-layer integration slice) consumes `computeRefineryPacketHash`
  directly from `cvf-refinery`; it retains no independent packet-hash
  algorithm of its own.

## 3. KernelEvaluationRequest

- **Sole producer:** the Kernel adapter at the Refinery-to-Kernel submission
  boundary (this adapter packages an accepted `RefineryPacket` for Kernel; it
  does not evaluate trust and is not a second Refinery).
- **Allowed consumers:** CVF Truth Kernel only.
- **Required field minimums:** `request_id`, `packet_hash`,
  `packet_reference`, `policy_version`, `rule_version`, `evidence_refs`,
  `obligation_refs`, `verification_mode`, `requested_decision_context`,
  `submitted_at_utc`.
- **Verification-result ownership and transport model:** `KernelEvaluationRequest`
  never carries a `verification_results` or `verification_result_refs`
  field. Kernel is the sole owner of verification: Kernel consumes the
  request's `evidence_refs`, `obligation_refs`, and `verification_mode` as
  its evaluation inputs, then Kernel itself performs verification and
  produces the resulting verification results as output of that evaluation,
  binding them into `KernelDecision.verification_result_refs` and
  `TruthReceipt.verification_result_refs` (see those contracts below). No
  contract in this chain claims that verification results are "referenced by
  the request" - they do not exist until Kernel produces them during
  evaluation of this request.
- **Status vocabulary:** `SUBMITTED`, `WITHDRAWN`.
- **Valid transitions:** `SUBMITTED -> (consumed exactly once by Kernel,
  yielding one KernelDecision)`.
- **Invalid transitions:** `SUBMITTED -> SUBMITTED` with a mutated
  `packet_hash` (a changed packet requires a new request, not a silent
  resubmission); any consumption of a request whose `packet_hash` does not
  match the referenced `RefineryPacket`'s current content (see Negative Case
  NC-04, packet-hash mismatch, in the companion invariants file); any
  evaluation that proceeds when the request's `evidence_refs` collection is
  empty (see Negative Case NC-02, empty evidence).
- **Authority boundary:** the request binds the complete packet content, the
  input evidence/obligation references, and the requested verification mode;
  it grants no trust, approval, or verification result by itself. Only
  Kernel may act on a `KernelEvaluationRequest` to produce a decision and its
  bound verification results.
- **Source provenance:** work order New Doc-Only Fields table
  (`docs/work_orders/CVF_AGENT_WORK_ORDER_SOT3_T2_CANONICAL_INTER_LAYER_CONTRACTS_2026-07-12.md`);
  roadmap Cross-Layer Contract Plan, `KernelEvaluationRequest` row
  (`docs/roadmaps/CVF_SOT_THREE_LAYER_ABSORPTION_ROADMAP_2026-07-12.md`).
- **Compatibility/exclusion decision:** `NEW_DOC_ONLY` - no retained or
  current-CVF runtime symbol exists under this name; this is a roadmap design
  label formalized into a full contract by this tranche.

## 4. KernelDecision

- **Sole producer:** CVF Truth Kernel.
- **Allowed consumers:** Refinery adapter (for resubmission guidance), CVF
  Truth Flow, governance/audit surfaces.
- **Required field minimums:** `decision_id`, `request_id`, `packet_hash`,
  `decision`, `reasons`, `failed_obligations`, `verification_result_refs`,
  `policy_version`, `rule_version`, `decided_at_utc`. `verification_result_refs`
  identifies the verification results Kernel itself produced while
  evaluating this request (see the Verification-result ownership and
  transport model in `KernelEvaluationRequest` above); it is never a
  restatement of a request-supplied field, because the request supplies no
  such field.
- **Status vocabulary (the `decision` field):** `ACCEPT_EVIDENCE_CANDIDATE`,
  `REJECT`, `ESCALATE`, `REQUIRE_ADDITIONAL_EVIDENCE`.
  `ACCEPT_EVIDENCE_CANDIDATE` means Kernel accepts the evaluated material as
  an evidence-backed candidate bound to this decision's evidence,
  obligations, and verification results; it is not a universal or final
  truth claim, and it is not by itself sufficient to mint a `TruthReference`
  (see `TruthReceipt` and `TruthReference` below for the additional
  eligibility conditions).
- **Valid transitions:** `SUBMITTED request -> ACCEPT_EVIDENCE_CANDIDATE`
  (only when `evidence_refs` is non-empty and the verification results
  Kernel produced for this evaluation are non-empty and pass); `SUBMITTED
  request -> REJECT` (failed obligation or verification); `SUBMITTED request
  -> ESCALATE` (ambiguous or policy-flagged case); `SUBMITTED request ->
  REQUIRE_ADDITIONAL_EVIDENCE` (insufficient evidence, not yet a rejection).
- **Invalid transitions:** `SUBMITTED request -> ACCEPT_EVIDENCE_CANDIDATE`
  when the request's `evidence_refs` is empty, or when the verification
  results Kernel produced for this evaluation are empty (fail-closed; see
  Invariant 4); any decision produced by a layer other than Kernel; any
  decision that omits `failed_obligations` when `decision` is `REJECT`; any
  decision that omits `verification_result_refs` regardless of outcome.
- **Authority boundary:** KernelDecision is Kernel's exclusive output. No
  Refinery or Flow process may synthesize, infer, or restate a
  `KernelDecision` on Kernel's behalf, including via a caller-supplied
  boolean (see Negative Case NC-11, caller-supplied approval boolean).
- **Source provenance:** T0R Producer/Consumer table, "Kernel adapter
  response" row (`ACCEPT_EVIDENCE_CANDIDATE | REJECT | ESCALATE |
  REQUIRE_ADDITIONAL_EVIDENCE`, per retained `CVF_REFINERY_BINDING_SPEC.md`);
  baseline Contract Invariants 4 and 7
  (`docs/baselines/CVF_GC018_SOT3_T2_CANONICAL_INTER_LAYER_CONTRACTS_2026-07-12.md`).
- **Compatibility/exclusion decision:** `ADAPT` - the retained
  `ACCEPT_EVIDENCE_CANDIDATE` token is retained verbatim, not renamed, to
  preserve the bounded evidence-candidate acceptance boundary T0R's source
  evidence names; `REJECT`, `ESCALATE`, and `REQUIRE_ADDITIONAL_EVIDENCE` are
  also retained verbatim as required by the work order's New Doc-Only Fields
  table. `verification_result_refs` is a new doc-only field added to bind
  Kernel's own evaluation output, per the Verification-result ownership and
  transport model above.

## 5. TruthReceipt

- **Sole producer:** CVF Truth Kernel.
- **Allowed consumers:** CVF Truth Flow, CVF guards, other governed
  consumers that need action evidence for a Kernel decision.
- **Required field minimums:** `receipt_id`, `evaluated_content_hash`,
  `decision_id`, `decision`, `evidence_refs`, `obligation_refs`,
  `verification_result_refs`, `policy_version`, `rule_version`,
  `decided_at_utc`, `issued_at_utc`, `predecessor_receipt_hash`,
  `receipt_hash`. `decision` carries the same
  `ACCEPT_EVIDENCE_CANDIDATE | REJECT | ESCALATE |
  REQUIRE_ADDITIONAL_EVIDENCE` value that `KernelDecision.decision` recorded
  for this evaluation; `verification_result_refs` is copied from
  `KernelDecision.verification_result_refs`, the same Kernel-produced
  verification results described in `KernelEvaluationRequest`'s
  Verification-result ownership and transport model, not a
  request-supplied field.
- **All-outcomes recording rule:** a `TruthReceipt` is issued for every
  `KernelDecision` outcome, not only `ACCEPT_EVIDENCE_CANDIDATE`. A receipt
  recording `REJECT`, `ESCALATE`, or `REQUIRE_ADDITIONAL_EVIDENCE` is a
  complete, valid, `ISSUED` receipt; it is simply not eligible to back a
  `TruthReference` (see the Eligible-Acceptance-Only Issuance Rule under
  `TruthReference` below).
- **Status vocabulary:** `ISSUED`, `SUPERSEDED`, `REVOKED`.
- **Valid transitions:** `ISSUED -> SUPERSEDED` (a later receipt for the same
  scope supersedes this one, predecessor hash recorded on the new receipt);
  `ISSUED -> REVOKED` (Kernel withdraws the receipt; downstream `TruthReference`
  consumers must treat it as invalid).
- **Invalid transitions:** any receipt reaching `ISSUED` with
  `verification_result_refs` empty (fail-closed; see Invariant 4 and Negative
  Case NC-03); any receipt whose `receipt_hash` does not bind every
  authority-bearing receipt field - `decision_id`, `decision`,
  `evaluated_content_hash`, `evidence_refs`, `obligation_refs`,
  `verification_result_refs`, `policy_version`, `rule_version`,
  `decided_at_utc`, `issued_at_utc`, and `predecessor_receipt_hash` - per
  the Receipt Hash Canonical Preimage Profile below (see Negative Case
  NC-05, receipt-content mismatch); re-issuing an already-`ISSUED` receipt
  for the same `decision_id` (see Negative Case NC-08, replayed receipt).
- **Receipt Hash Canonical Preimage Profile
  (`cvf.sotThreeLayer.receiptHash.v1`):** `receipt_hash` is the SHA-256
  digest of exactly one canonical preimage byte sequence. This contract
  defines exactly one profile; a future implementation tranche must not
  choose a different encoding, digest, field order, or collection
  representation. The preimage is a canonical JSON text encoded as UTF-8
  with no insignificant whitespace (no spaces, tabs, or newlines outside
  string values), using the following fixed rules:
  - **Profile identifier:** the preimage JSON object includes a
    `receipt_hash_profile` field set to the exact string
    `cvf.sotThreeLayer.receiptHash.v1`, so the profile version is bound
    into the hash and a future profile change is detectable.
  - **Digest algorithm:** SHA-256, identified by the literal string
    `sha256` in the preimage's `digest_algorithm` field.
  - **Canonical JSON standard:** string serialization follows RFC 8785
    (JSON Canonicalization Scheme, JCS). Under JCS, each string scalar
    is serialized with the minimal-escaping rule defined by RFC 8785
    section 3.2.2.2: characters U+0000 through U+001F are escaped as
    `\uXXXX` (lowercase hex), the double-quote and backslash characters
    are escaped as `\"` and `\\` respectively, and all other characters
    (including non-ASCII Unicode) are emitted as their literal UTF-8
    bytes without `\u` escaping. This removes the ambiguity between
    literal Unicode and escaped forms that generic "standard JSON
    escaping" permits.
  - **Unicode normalization:** string values are NOT pre-normalized to
    NFC or any other Unicode normalization form before serialization;
    the receipt stores strings as-is and JCS serializes them as-is. Two
    implementations must produce identical bytes for identical input
    strings because JCS fixes the escaping rule; normalization is the
    caller's responsibility, not the hash profile's.
  - **Field order and tags:** the preimage is a JSON object with exactly
    these named fields in exactly this order:
    `receipt_hash_profile`, `digest_algorithm`, `receipt_id`,
    `decision_id`, `decision`, `evaluated_content_hash`, `evidence_refs`,
    `obligation_refs`, `verification_result_refs`, `policy_version`,
    `rule_version`, `decided_at_utc`, `issued_at_utc`,
    `predecessor_receipt_hash`. `receipt_id` is the receipt's required
    identity and an authority-bearing field; omitting it from the
    preimage would allow receipt identity substitution without digest
    failure.
  - **Scalar normalization:** string scalars are encoded as JCS-canonical
    JSON strings per the rule above; no trailing whitespace; no
    surrounding quotes beyond JSON syntax. Numeric scalars, if any, are
    encoded per RFC 8785 section 3.2.2.3 (shortest round-trip
    representation); this profile defines no numeric fields, so the rule
    is stated for completeness only.
  - **UTC timestamp normalization:** `decided_at_utc` and `issued_at_utc`
    are encoded as JSON strings in ISO 8601 UTC form
    `YYYY-MM-DDTHH:MM:SSZ` (zero-padded, seconds precision, `Z` suffix,
    no fractional seconds, no timezone offset).
  - **Null versus empty representation:** an absent or null scalar is
    encoded as JSON `null`; an empty collection is encoded as JSON `[]`
    (empty array), not `null`; a non-empty collection is encoded as a
    JSON array of string elements.
  - **Collection sorting:** `evidence_refs`, `obligation_refs`, and
    `verification_result_refs` arrays are sorted lexicographically by
    reference identifier (Unicode code point order, ascending) before
    encoding; reordering the same collection contents does not produce a
    different hash.
  - **Element and field boundaries:** JSON object keys and array element
    boundaries provide unambiguous separation; no length-prefix or
    delimiter ambiguity exists.
  - **receipt_hash exclusion:** `receipt_hash` itself is excluded from
    its own preimage (it is the output, not an input); including it
    would create a circular dependency.
  - **predecessor_receipt_hash inclusion:** `predecessor_receipt_hash`
    is included as a JSON string; for the first receipt in a chain it is
    `null`.

  Omitting any authority-bearing field (including `receipt_id`) from the
  preimage, using a different digest, a different encoding, a different
  field order, a different timestamp form, a different null/empty
  representation, a different collection ordering, or a non-JCS string
  escaping rule does not satisfy this contract. This remains a
  documentation-contract-level specification; it does not authorize
  runtime implementation, but it removes encoding choice so that any two
  independent verifiers computing `receipt_hash` from the same receipt
  field values produce the same digest.

  **Illustrative canonical preimage and expected digest:** the following
  complete canonical preimage byte sequence (522 bytes, UTF-8, JCS,
  no insignificant whitespace) produces the SHA-256 digest shown below
  it. A future implementation tranche must reproduce this digest from
  this exact preimage as a profile conformance test.

  ```text
  {"receipt_hash_profile":"cvf.sotThreeLayer.receiptHash.v1","digest_algorithm":"sha256","receipt_id":"receipt-001","decision_id":"decision-001","decision":"ACCEPT_EVIDENCE_CANDIDATE","evaluated_content_hash":"sha256:abc123def456","evidence_refs":["ev-001","ev-002"],"obligation_refs":["ob-001"],"verification_result_refs":["vr-001","vr-002"],"policy_version":"policy-2026-07-12","rule_version":"rule-2026-07-12","decided_at_utc":"2026-07-12T10:00:00Z","issued_at_utc":"2026-07-12T10:00:01Z","predecessor_receipt_hash":null}
  ```

  Expected SHA-256 digest (lowercase hex):
  `bc32424380bd483ca208edd8ee18bcaaa874b109584341e8febc01b5e46ab5a3`

  This digest was computed and verified locally with
  `python -c "import hashlib; ..."` (SHA-256 of the exact 522-byte UTF-8
  preimage above) before being recorded in this contract.
- **Authority boundary:** the receipt is Kernel's exclusive, tamper-evident
  record binding evaluated content, decision identity, decision outcome,
  evidence/obligation/verification-result bindings, versions, timestamps,
  and lineage. A receipt is action evidence for the recorded evaluation
  only; it is not by itself proof that the underlying claim is true,
  current, or complete beyond the stated evaluation boundary, consistent
  with TKG-T1's Integrity Is Not Truth doctrine. Recording a non-acceptance
  outcome does not grant distribution authority (see `TruthReference`
  below). The receipt's `decision_id` is the authoritative link to the
  immutable `KernelDecision` that produced it; the decision's
  `request_id` links onward to the immutable `KernelEvaluationRequest`
  that supplied the evidence and obligation references. The receipt does
  not copy `KernelDecision.failed_obligations` (see the
  Decision-Resolution Model under `TruthReference` below for the full
  resolution chain that verifies `failed_obligations` and binding
  consistency before reference issuance).
- **Source provenance:** T0R Producer/Consumer table, `TruthReceipt` row
  (hash bound to full evaluated packet content, not receipt metadata only;
  `status` must not be `pass` on empty `verification_results`); baseline
  Contract Invariant 5; TKG-T1 Integrity Is Not Truth section.
- **Compatibility/exclusion decision:** `ADAPT` - retained `truth-receipt.ts`
  structure is adapted with the fail-open empty-results defect closed and the
  hash binding widened from receipt-metadata-only to every authority-bearing
  receipt field (receipt identity, decision identity, decision outcome,
  evaluated content, evidence/obligation/verification-result bindings,
  versions, timestamps, and predecessor hash) under one fixed canonical
  preimage profile (`cvf.sotThreeLayer.receiptHash.v1`, SHA-256, UTF-8
  JCS-canonical JSON per RFC 8785, lexicographic collection ordering) with
  one published test vector.

## 6. TruthReference

- **Sole producer:** CVF Truth Kernel.
- **Allowed consumers:** CVF Truth Flow and other governed consumers
  authorized to cite verified material.
- **Required field minimums:** `reference_id`, `receipt_id`, `scope`,
  `version`, `valid_from_utc`, `valid_until_utc`, `reference_state`.
  `reference_state` is the single lifecycle field for this contract; there
  are no separate `supersession_state`/`revocation_state` fields.
- **Status vocabulary (`reference_state`, one field, exact values):**
  `ACTIVE`, `SUPERSEDED`, `REVOKED`, `EXPIRED`. Exactly one value applies at
  any read time; there is no composite or multi-field state.
- **Precedence rule when more than one condition could apply:** `REVOKED` >
  `SUPERSEDED` > `EXPIRED` > `ACTIVE`, evaluated in that order. If Kernel has
  revoked the reference or its underlying receipt, `reference_state` reads
  `REVOKED` regardless of expiry or supersession. Otherwise, if a newer
  `TruthReference` for the same `scope` exists, `reference_state` reads
  `SUPERSEDED` regardless of expiry. Otherwise, if `valid_until_utc` has
  passed, `reference_state` reads `EXPIRED`. Otherwise `reference_state`
  reads `ACTIVE`.
- **Expiry storage model:** expiry is derived, not stored as an independent
  mutable flag. `valid_until_utc` is the single stored expiry boundary;
  `reference_state` computes `EXPIRED` by comparing the current evaluation
  time to `valid_until_utc` under the precedence rule above, rather than a
  separate process writing an `EXPIRED` value into storage. `REVOKED` and
  `SUPERSEDED`, by contrast, are stored transitions Kernel writes explicitly
  when it revokes a receipt/reference or issues a superseding reference.
- **Decision-Resolution Model (failed_obligations and binding authority
  path):** `TruthReceipt` does not carry a `failed_obligations` field;
  `failed_obligations` belongs to `KernelDecision` only. `KernelDecision`
  does not carry `evidence_refs` or `obligation_refs`; those belong to
  `KernelEvaluationRequest` only. Before issuing a `TruthReference`,
  Kernel must resolve the following immutable chain and verify every link:

  1. Resolve the immutable `KernelDecision` identified by
     `TruthReceipt.decision_id`.
  2. Resolve the immutable `KernelEvaluationRequest` identified by
     `KernelDecision.request_id`.

  Then verify all of the following:
  - (a) both the `KernelDecision` and the `KernelEvaluationRequest` exist
    and are found;
  - (b) `TruthReceipt.decision` exactly matches `KernelDecision.decision`;
  - (c) `TruthReceipt.verification_result_refs` exactly matches
    `KernelDecision.verification_result_refs`;
  - (d) `TruthReceipt.evidence_refs` exactly matches
    `KernelEvaluationRequest.evidence_refs`;
  - (e) `TruthReceipt.obligation_refs` exactly matches
    `KernelEvaluationRequest.obligation_refs`;
  - (f) `TruthReceipt.evaluated_content_hash` exactly matches
    `KernelDecision.packet_hash` and `KernelEvaluationRequest.packet_hash`
    (all three values must be equal);
  - (g) `TruthReceipt.policy_version` exactly matches
    `KernelDecision.policy_version` and
    `KernelEvaluationRequest.policy_version` (all three values must be
    equal);
  - (h) `TruthReceipt.rule_version` exactly matches
    `KernelDecision.rule_version` and
    `KernelEvaluationRequest.rule_version` (all three values must be
    equal);
  - (i) `KernelDecision.failed_obligations` is empty.

  Every missing record, broken link, or field mismatch fails closed and
  blocks reference issuance (see Negative Case NC-04B, decision-resolution
  mismatch, broken link, or non-empty failed_obligations).
- **Eligible-Acceptance-Only Issuance Rule:** Kernel may issue a
  `TruthReference` only from a `TruthReceipt` that satisfies all four
  conditions at issuance time: (1) Kernel resolves the immutable
  `KernelDecision` via `TruthReceipt.decision_id` and the immutable
  `KernelEvaluationRequest` via `KernelDecision.request_id`, and confirms
  `TruthReceipt.decision` matches `KernelDecision.decision`,
  `TruthReceipt.verification_result_refs` matches
  `KernelDecision.verification_result_refs`,
  `TruthReceipt.evidence_refs` matches
  `KernelEvaluationRequest.evidence_refs`,
  `TruthReceipt.obligation_refs` matches
  `KernelEvaluationRequest.obligation_refs`,
  `TruthReceipt.evaluated_content_hash` matches both
  `KernelDecision.packet_hash` and `KernelEvaluationRequest.packet_hash`,
  `TruthReceipt.policy_version` matches both
  `KernelDecision.policy_version` and
  `KernelEvaluationRequest.policy_version`, and
  `TruthReceipt.rule_version` matches both
  `KernelDecision.rule_version` and
  `KernelEvaluationRequest.rule_version` - any missing record, broken
  link, or field mismatch fails closed and blocks reference issuance
  (see Negative Case NC-04B, decision-resolution mismatch or broken
  link); (2) `TruthReceipt.decision` (and the resolved
  `KernelDecision.decision`) is exactly `ACCEPT_EVIDENCE_CANDIDATE`;
  (3) the resolved `KernelDecision.failed_obligations` is empty - any
  non-empty `failed_obligations` fails closed and blocks reference
  issuance, regardless of the decision token; (4) no verification result
  bound to that receipt via `verification_result_refs` carries a blocking
  `FAIL` or `BLOCKED` status (per TKG-T1's Verification Result Minimum
  status vocabulary). A `TruthReceipt` recording `REJECT`, `ESCALATE`, or
  `REQUIRE_ADDITIONAL_EVIDENCE` never satisfies condition (2) and can
  never back a `TruthReference`, regardless of its `ISSUED`/non-revoked
  status (see Negative Case NC-04A, non-acceptance receipt
  reference-issuance attempt).
- **Valid transitions:** `ACTIVE -> SUPERSEDED` (a newer `TruthReference` for
  the same scope exists); `ACTIVE -> REVOKED` (Kernel revokes the underlying
  receipt or reference); `ACTIVE -> EXPIRED` (derived: `valid_until_utc`
  passed, computed at read time per the precedence rule above).
- **Invalid transitions:** any `TruthReference` created without a bound
  `receipt_id` pointing to a `TruthReceipt` that passes the
  Eligible-Acceptance-Only Issuance Rule above; any reference still treated
  as `ACTIVE` past `valid_until_utc` (see Negative Case NC-09, expired
  TruthReference); any reference used for distribution when
  `reference_state` is not `ACTIVE` (see Negative Case NC-10,
  revoked/superseded reference); any `TruthReference` issued from a receipt
  whose `decision` is not `ACCEPT_EVIDENCE_CANDIDATE` (see Negative Case
  NC-04A); any `TruthReference` issued when the resolved `KernelDecision`
  or `KernelEvaluationRequest` cannot be found, when any
  receipt-to-decision or decision-to-request binding mismatches (including
  `evaluated_content_hash`/`packet_hash`, `policy_version`, or
  `rule_version` mismatch across receipt, decision, and request), or when
  `KernelDecision.failed_obligations` is non-empty (see Negative Case
  NC-04B, decision-resolution mismatch, broken link, or non-empty
  failed_obligations).
- **Authority boundary:** only Kernel creates `TruthReference`, and only from
  a receipt meeting the Eligible-Acceptance-Only Issuance Rule. Flow may
  read, cite, and route references but must never mint, alter, or extend the
  validity window of a reference it consumes.
- **Source provenance:** T0R Producer/Consumer table, `TruthReference` row
  (scoped, versioned, time-bounded, supersession-aware; roadmap design label,
  no current runtime symbol found); roadmap Cross-Layer Contract Plan,
  `TruthReference` row; baseline Contract Invariant 6; T2 completion review
  R4/R5/R7/R8/R9/R12 bounded-repair requirements.
- **Compatibility/exclusion decision:** `NEW_DOC_ONLY` - no retained or
  current-CVF runtime symbol exists under this name; this contract is
  authored fresh from the T0R-recommended field set.

## 7. DistributionPackage

- **Sole producer:** CVF Truth Flow.
- **Allowed consumers:** the governed recipient named in the package
  (application, human, workflow, agent, or tool, per the SOT3 roadmap's
  Findings / Position distribution list).
- **Required field minimums:** `package_id`, `recipient`, `role`, `task`,
  `phase`, `truth_references`, `dose`, `restrictions`, `expiry_utc`,
  `routing_decision`, `acknowledgement_state`.
- **Status vocabulary:** `PENDING_ACKNOWLEDGEMENT`, `ACKNOWLEDGED`,
  `EXPIRED`, `WITHDRAWN`.
- **Valid transitions:** `PENDING_ACKNOWLEDGEMENT -> ACKNOWLEDGED` (recipient
  confirms receipt); `PENDING_ACKNOWLEDGEMENT -> EXPIRED` (`expiry_utc`
  passed unacknowledged); `PENDING_ACKNOWLEDGEMENT -> WITHDRAWN` (Flow
  withdraws before acknowledgement, for example on upstream revocation).
- **Invalid transitions:** any `DistributionPackage` created with
  `truth_references` empty, or with a `truth_references` entry whose
  `TruthReference` is not `ACTIVE` at creation time (see Invariant 8 and
  Negative Case NC-10); any package whose `routing_decision` is derived from
  a caller-supplied boolean instead of a bound `TruthReference` (see Negative
  Case NC-11).
- **Authority boundary:** distribution requires a valid, non-expired,
  non-revoked `TruthReference`. Flow owns routing, dose, and lifecycle only;
  it must not evaluate trust or issue a decision, receipt, or reference of
  its own.
- **Source provenance:** T0R Producer/Consumer table, `DistributionPackage`
  row (must include a bound `TruthReceipt` reference per
  `CONTEXT_DISTRIBUTION.md` line 3, not a caller-supplied boolean); roadmap
  Layer Boundary Decisions table, Truth Flow row.
- **Compatibility/exclusion decision:** `ADAPT` - retained
  `publish-gate.ts` `PublishGateInput.truthKernelAccepted: boolean` is
  `REJECT_DIRECT_IMPORT`; the canonical field replaces the boolean with a
  bound, resolvable `truth_references` collection.

## 8. FeedbackProposal

- **Sole producer:** CVF Truth Flow or a governed consumer, acting under
  policy (not an unconstrained direct-write path).
- **Allowed consumers:** a governed reviewer or owner surface responsible for
  the target the feedback concerns (for example, a source-score or evidence
  owner process, per the target reference below).
- **Required field minimums:** `proposal_id`, `observation`,
  `target_reference`, `proposed_change`, `evidence_refs`, `proposer`,
  `review_status`, `no_direct_mutation_flag`.
- **Status vocabulary (`review_status`):** `SUBMITTED`, `UNDER_REVIEW`,
  `ACCEPTED`, `REJECTED`.
- **Valid transitions:** `SUBMITTED -> UNDER_REVIEW -> ACCEPTED` (only an
  accepted proposal may trigger a separate, governed mutation action owned by
  the target surface, outside this contract's scope); `SUBMITTED ->
  UNDER_REVIEW -> REJECTED`.
- **Invalid transitions:** `SUBMITTED -> (any target mutation)` without
  passing through `ACCEPTED` (see Invariant 9 and Negative Case NC-12, direct
  feedback mutation); any `FeedbackProposal` with `no_direct_mutation_flag`
  set to false or absent; any proposal that mutates a `TruthReceipt`,
  `TruthReference`, evidence record, or source score directly instead of
  proposing a change for separate governed acceptance.
- **Authority boundary:** feedback is proposal-only. It can never mutate
  truth, evidence, receipts, references, or a source score directly; it can
  only request that the owning governed surface consider a change.
- **Source provenance:** T0R Producer/Consumer table, `FeedbackProposal` row
  (proposal-only; a `source_score` change must require an approved proposal
  per `FEEDBACK_LOOP.md` line 5-7); baseline Contract Invariant 9.
- **Compatibility/exclusion decision:** `ADAPT` - retained
  `source-score.ts` `updateSourceScore()` direct mutation is
  `REJECT_DIRECT_IMPORT`; the canonical contract requires
  `review_status: ACCEPTED` before any separate, governed mutation action may
  occur, and that mutation action itself remains outside this chain's scope.

## Producer/Consumer Uniqueness Table

| Contract | Sole producer | Forbidden producer |
|---|---|---|
| `SourceEnvelope` | governed intake adapter | Refinery, Kernel, Flow |
| `RefineryPacket` | Refinery | Kernel, Flow, governed intake adapter |
| `KernelEvaluationRequest` | Kernel adapter | Refinery, Flow, Kernel itself |
| `KernelDecision` | Kernel | Refinery, Flow |
| `TruthReceipt` | Kernel | Refinery, Flow, caller |
| `TruthReference` | Kernel | Refinery, Flow |
| `DistributionPackage` | Flow | Kernel, Refinery |
| `FeedbackProposal` | Flow / governed consumer under policy | direct authority store mutation |

No contract type appears with more than one sole producer in this table,
satisfying the no-duplicate-authority requirement.

## Chain-Wide Fail-Closed Cross-Reference

Empty required collections, mismatched hashes/versions, replayed receipts,
expired or revoked references, and direct feedback mutation must fail closed
at every stage listed above. The complete invariant list and at least twelve
concrete negative cases are defined in the companion file:
`docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_INVARIANTS_AND_NEGATIVE_CASES.md`.

## TKG-T1 Compatibility Statement

This chain narrows TKG-T1's single governing chain (`source authority ->
provenance label -> evidence or obligation record -> verification result ->
bounded claim movement`) into three modules and eight typed handoffs.
`KernelEvaluationRequest.evidence_refs`/`obligation_refs` and
`TruthReceipt.evidence_refs`/`obligation_refs` are intended to resolve to
TKG-T1's Evidence Record Minimum and Obligation Record Minimum field shapes;
full field-by-field reconciliation of that mapping is deferred to a future
TKG-T2-style tranche, as recorded in the companion source reconciliation
review. This chain does not restate, replace, or narrow TKG-T1's provenance
label vocabulary or claim-movement semantics; it references them by relation.

## Epistemic Process Block

Epistemic Process Applicability: HIGH_EVIDENCE

Expected Result / Prediction: one canonical chain can preserve TKG-T1
doctrine while adding the missing three-module boundaries without duplicate
authority, per the work order's stated prediction.

Evidence Comparison Requirement: every contract's producer, consumer, and
field set was compared against `docs/reviews/CVF_SOT3_T0R_THREE_LAYER_ARCHITECTURE_DECISION_RECOMMENDATION_2026-07-12.md`'s
Producer/Consumer Packet And Receipt Mapping table, the SOT3 roadmap's
Cross-Layer Contract Plan, and TKG-T1's governing chain.

Contradiction Or Gap Disposition: all eight contract types resolved to
exactly one sole producer with no overlap; every retained competing shape
named in the T0R evidence was recorded `REJECT_DIRECT_IMPORT`, not merged.
The TKG-T1 field-by-field reconciliation for `evidence_refs`/`obligation_refs`
remains an explicitly deferred gap, not a contradiction, consistent with
SOT3-T1's CAP-04 finding. The reviewer's completion review found ten
genuine semantic contradictions/gaps across three bounded-repair rounds
(R1-R6 in round 1: a false ADAPT count, RefineryPacket status conflated
with failure tokens, an undefined verification-result ownership/transport
boundary, a rejected/escalated receipt able to mint a TruthReference, an
unimplementable TruthReference composite state model, and an unqualified
`ACCEPT` token weakening the bounded evidence-candidate claim; R7-R8 in
round 2: the receipt hash did not bind the evidence/obligation/verification-
result decision basis, and the reference eligibility rule cited an
unresolved `failed_obligations` field with no defined owner path; R9-R10
in round 3: the decision-resolution comparison targeted fields
`KernelDecision` does not define, and the receipt hash serialization
permitted multiple encodings that produce different digests for the same
receipt; R11-R12 in round 4: the canonical preimage omitted `receipt_id`
and left JSON string bytes ambiguous under generic "standard JSON
escaping", and the resolution chain did not compare
`evaluated_content_hash`/`packet_hash`, `policy_version`, or
`rule_version` across receipt, decision, and request); this fourth
bounded repair round corrects R11 and R12 directly in this file's
contract definitions, adding `receipt_id` to the canonical preimage,
replacing generic JSON escaping with RFC 8785 JCS string serialization,
publishing one complete test vector with its verified SHA-256 digest,
and extending the resolution chain to require exact equality of
`evaluated_content_hash`/`packet_hash`, `policy_version`, and
`rule_version` across receipt, decision, and request.

Claim Update Requirement: every one of the 8 contracts carries an explicit
sole producer, allowed consumers, field minimums, status vocabulary,
transitions, authority boundary, source provenance, and compatibility/
exclusion decision; none remain unclassified.

## Claim Boundary

This file is a documentation-only canonical contract definition. It does not
implement a TypeScript interface, JSON Schema, database table, API endpoint,
runtime module, checker, guard, test, or package. Field names, status
vocabularies, and transitions are contract-language specifications for a
future source-verified implementation tranche (SOT3-T3 through T5 or later),
not claims that a matching runtime symbol exists today. No claim in this file
authorizes package activation, provider/live proof, public-sync, release, or
production readiness.
