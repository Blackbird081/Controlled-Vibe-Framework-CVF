# CVF Truth Kernel

Deterministic, no-AI trust-evaluation package. CVF Truth Kernel is the
sole producer of `KernelDecision`, `TruthReceipt`, and `TruthReference`,
per `docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md`
(SOT3-T2, sections 3-6) and the bound fail-closed invariants in
`docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_INVARIANTS_AND_NEGATIVE_CASES.md`.
It consumes an accepted, `READY_FOR_KERNEL` `RefineryPacket` reference
produced by `EXTENSIONS/CVF_REFINERY/`; it never produces a second,
competing `RefineryPacket`.

## No-AI boundary

This package contains no AI, agent, prompt, provider SDK, or network
call. Every evaluation is a deterministic, inspectable function over
locally registered evidence and obligation records. Verification results
are always Kernel-produced from those records; a caller can never supply
a verification result, approval flag, or authority boolean and have it
substitute for Kernel's own evaluation (Required Invariant 10). Verified
by:

```
rg -n -i "openai|anthropic|provider|prompt|agent|fetch\(|axios|randomUUID|Date\.now|new Date\(\)" EXTENSIONS/CVF_TRUTH_KERNEL/src
```

## Integrity is not truth

Per the truth-foundation doctrine owner
(`docs/reference/truth_foundation/CVF_TRUTH_FOUNDATION_SOURCE_PROVENANCE_AND_VERIFICATION_CONTRACT.md`),
a `receipt_hash`, `content_hash`, or `ISSUED` receipt status proves that a
recorded byte sequence or action is stable and tamper-evident within its
stated boundary. It does not prove that the underlying claim is correct,
current, or complete. `KernelDecision.decision === "ACCEPT_EVIDENCE_CANDIDATE"`
means Kernel accepted the evaluated material as an evidence-backed
candidate bound to specific evidence, obligations, and verification
results for this one evaluation - it is not a universal or final truth
claim, and it is not by itself sufficient to mint a `TruthReference` (see
Eligible-Acceptance-Only Issuance Rule below). A `TruthReceipt` recording
`REJECT`, `ESCALATE`, or `REQUIRE_ADDITIONAL_EVIDENCE` is a complete,
valid, `ISSUED` receipt (the All-outcomes recording rule); it simply can
never back a `TruthReference`.

## Determinism

`TruthKernel` accepts an injected `Clock`, `IdFactory`, and authorized
policy/rule version at construction. No evaluator, resolver, store, or
issuer in `src/` calls a global time or random source (`Date.now`,
`new Date()`, `Math.random`, `crypto.randomUUID`). Running the same
sequence of registrations and `evaluate()` calls twice with fresh
injected dependencies produces byte-equivalent decisions and receipts.
Every stored record is a deep-cloned, immutable snapshot
(`src/stores/immutable-store.ts`): `insert()` rejects overwriting an
existing key, and `get()` always returns a fresh clone.

## Canonical receipt hash profile

`src/receipt/receipt-hash.ts` implements the T2 contract chain's
`cvf.sotThreeLayer.receiptHash.v1` canonical preimage profile exactly:
SHA-256 digest of one UTF-8, RFC 8785 (JCS) canonical JSON preimage with
no insignificant whitespace, fixed named fields in fixed order
(`receipt_hash_profile`, `digest_algorithm`, `receipt_id`, `decision_id`,
`decision`, `evaluated_content_hash`, `evidence_refs`, `obligation_refs`,
`verification_result_refs`, `policy_version`, `rule_version`,
`decided_at_utc`, `issued_at_utc`, `predecessor_receipt_hash`), ISO 8601
UTC timestamps, `null` for absent scalars, `[]` for empty collections,
and evidence/obligation/verification-result arrays sorted
lexicographically before encoding. `tests/receipt-hash-vector.test.ts`
reproduces the contract chain's published 522-byte illustrative preimage
and its verified SHA-256 digest
(`bc32424380bd483ca208edd8ee18bcaaa874b109584341e8febc01b5e46ab5a3`)
byte-for-byte.

## Eligible-Acceptance-Only Issuance Rule

`src/engine/reference-issuer.ts` mints a `TruthReference` only after
resolving the immutable `KernelDecision` via `TruthReceipt.decision_id`
and the immutable `KernelEvaluationRequest` via `KernelDecision.request_id`,
then verifying: `decision` token equality, `verification_result_refs`
equality against the decision, `evidence_refs`/`obligation_refs` equality
against the request, `evaluated_content_hash`/`policy_version`/
`rule_version` equality across all three records, `decision ===
"ACCEPT_EVIDENCE_CANDIDATE"`, `failed_obligations` empty, no bound
verification result carrying a blocking `FAIL`/`BLOCKED` status, the
receipt not revoked, and a valid (`from < until`) validity interval.
Every missing record, broken link, or mismatch fails closed and returns
a typed rejection reason instead of a reference.

## Non-goals

No Truth Flow or distribution lifecycle, no retained strict/relaxed/
blocked mode compatibility, no runtime monitor, SOT index service,
database, external verifier service, adapter, or caller-supplied
authority boolean, no direct import of the retained legacy Kernel
prototype, and no package registry activation or production-readiness
claim. See `docs/baselines/CVF_GC018_SOT3_T4_TRUTH_KERNEL_HARDENING_2026-07-12.md`
for the full authorization boundary.

## Usage

```ts
import {
  TruthKernel,
  DeterministicClock,
  SequentialIdFactory,
} from "cvf-truth-kernel";

const kernel = new TruthKernel(
  new DeterministicClock("2026-07-12T00:00:00Z"),
  new SequentialIdFactory(),
  "policy-2026-07-12",
  "rule-2026-07-12",
);

kernel.registerPacket({
  refinery_packet_id: "RP-000001",
  content_hash: "sha256:...",
  declared_scope: { organization: "cvf" },
  status: "READY_FOR_KERNEL",
});

const { decision, receipt } = kernel.evaluate({
  requestId: "REQ-000001",
  packetHash: "sha256:...",
  packetReference: "RP-000001",
  policyVersion: "policy-2026-07-12",
  ruleVersion: "rule-2026-07-12",
  evidenceRefs: ["EV-000001"],
  obligationRefs: [],
  verificationMode: "STRICT",
  requestedDecisionContext: "example",
});
```
