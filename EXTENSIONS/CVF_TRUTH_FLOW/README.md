# CVF Truth Flow

Deterministic, no-AI, strictly post-Kernel distribution package. CVF Truth
Flow is the sole producer of `DistributionPackage` and `FeedbackProposal`,
per `docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md`
(SOT3-T2, sections 7-8) and the bound fail-closed invariants in
`docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_INVARIANTS_AND_NEGATIVE_CASES.md`.
It consumes an already-issued, Kernel-resolved `TruthReference` by
reference only; it never evaluates trust and never produces a second
`KernelDecision`, `TruthReceipt`, or `TruthReference`. It never produces a
second `RefineryPacket`.

## No-AI boundary

This package contains no AI, agent, prompt, provider SDK, or network
call. Every routing, dose, distribution, and feedback decision is a
deterministic, inspectable function over locally registered state and the
actual injected `TruthKernel` instance's current-state resolution. Verified
by:

```
rg -n -i "openai|anthropic|provider|prompt|agent|fetch\(|axios|randomUUID|Date\.now|new Date\(\)" EXTENSIONS/CVF_TRUTH_FLOW/src
```

## Kernel authority boundary

`src/kernel-reference/kernel-authority.ts` is the only module that consults
Kernel authority. It accepts the actual `TruthKernel` instance from
`cvf-truth-kernel` (T4/T4R1, closed at `cda8fec64`) and calls only its
public ID-only `referenceState(referenceId, nowUtcIso)` method. It never
accepts a substitute resolver, never trusts a raw `TruthReference` object's
stored `reference_state` field as current authority, and never
reimplements Kernel precedence (`REVOKED > SUPERSEDED > EXPIRED > ACTIVE`).
Every routing, delivery, acknowledgement, and consumption action calls this
boundary fresh at its own action time; a creation-time `ACTIVE` result is
never reused as later authority. Verified by:

```
rg -n "KernelDecision|TruthReceipt|TruthReference" EXTENSIONS/CVF_TRUTH_FLOW/src --glob "!**/kernel-reference/**"
```

This command must return zero matches: no file outside the Kernel
authority boundary module may reference a Kernel-owned authority type.

## Distribution lifecycle

`DistributionPackage.acknowledgement_state` uses exactly four values:
`PENDING_ACKNOWLEDGEMENT`, `ACKNOWLEDGED`, `EXPIRED`, `WITHDRAWN`. There is
no Flow-local `VERIFIED`-equivalent token. Recall and retirement both use
the sole T2-valid `PENDING_ACKNOWLEDGEMENT -> WITHDRAWN` transition;
`ACKNOWLEDGED`, `EXPIRED`, and `WITHDRAWN` are terminal. Withdrawal never
mutates the underlying Kernel `TruthReceipt`/`TruthReference` record.

## Feedback is proposal-only

`FeedbackProposal.no_direct_mutation_flag` is always `true`. This package
contains no `updateSourceScore()`-class direct mutation function. Only an
`ACCEPTED` proposal may trigger a separate, governed mutation action, and
that action is explicitly outside this package's scope.

## Determinism

Every engine accepts an injected `Clock` and `IdFactory` at construction;
no engine calls a global time or random source (`Date.now`, `new Date()`,
`Math.random`, `crypto.randomUUID`). Running the same sequence of
registrations and actions twice with fresh injected dependencies produces
byte-equivalent results.

## Non-goals

No monitor, SOT index service, database, external verifier service,
Guard Contract adapter, phase-governance adapter, Truth Kernel adapter, or
caller-supplied authority boolean/string ID. No direct import of the
retained legacy Truth Flow prototype. No embedded Refinery. No package
registry activation or production-readiness claim. See
`docs/baselines/CVF_GC018_SOT3_T5_TRUTH_FLOW_2026-07-12.md` for the full
authorization boundary.

## Usage

```ts
import {
  DistributionEngine,
  FeedbackEngine,
  KernelAuthorityBoundary,
  DeterministicClock,
  SequentialIdFactory,
  validateRoutingScope,
  validateDose,
} from "cvf-truth-flow";
import { TruthKernel, DeterministicClock as KernelClock, SequentialIdFactory as KernelIds } from "cvf-truth-kernel";

const kernel = new TruthKernel(
  new KernelClock("2026-07-12T00:00:00Z"),
  new KernelIds(),
  "policy-2026-07-12",
  "rule-2026-07-12",
);
// ... register packet/evidence, evaluate(), issueReference() on kernel ...

const authority = new KernelAuthorityBoundary(kernel);
const flow = new DistributionEngine(authority, new SequentialIdFactory());

const scope = validateRoutingScope({ recipient: "r1", role: "agent", task: "t1", phase: "p1" });
const dose = validateDose("summary", "2026-08-12T00:00:00Z", "2026-07-12T00:00:01Z");

if (scope.valid && dose.valid) {
  const result = flow.create({
    recipient: "r1",
    role: "agent",
    task: "t1",
    phase: "p1",
    truthReferences: ["TREF-000001"],
    dose: "summary",
    restrictions: [],
    expiryUtc: "2026-08-12T00:00:00Z",
    actionTimeUtcIso: "2026-07-12T00:00:01Z",
  });
}
```
