# CVF Refinery Core

Deterministic, no-AI intake-to-packet pipeline. Refinery is the sole
producer of `RefineryPacket` and the sole consumer of `SourceEnvelope`, per
`docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md`
(SOT3-T2, sections 1-2) and the bound fail-closed invariants in
`docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_INVARIANTS_AND_NEGATIVE_CASES.md`.

## No-AI boundary

This package contains no AI, agent, prompt, provider SDK, OCR, extraction,
or semantic-similarity dependency, and no network call. Every transform is a
deterministic, inspectable function over its inputs. Verified by:

```
rg -n -i "openai|anthropic|provider|prompt|agent|fetch\(|axios|randomUUID|Date\.now" EXTENSIONS/CVF_REFINERY/src
```

## No-truth boundary

A `RefineryPacket` marks material as *structurally eligible for
evaluation* only. It carries no truth, approval, or Kernel-decision field,
and `status: READY_FOR_KERNEL` is not a truth or acceptance claim - it is
an assertion that at least one Refinery stage executed, the packet's
declared schema validated, no blocking quality/integrity finding exists,
and lineage evidence is complete. Only CVF Truth Kernel (a separate,
not-yet-implemented package) may evaluate trust and issue a
`KernelDecision`.

## Determinism

`RefineryEngine` accepts an injected `Clock` and `IdFactory` at
construction. No stage or helper calls a global time or random source
(`Date.now`, `new Date()`, `Math.random`, `crypto.randomUUID`). Running the
engine twice with the same injected dependencies and the same input
produces a byte-equivalent `RefineryPacket`. Every output is deeply
detached from its input references (`structuredClone` at every hand-off).

## Required stage chain

`RefineryEngine.run` always executes the complete required chain in this
order and cannot be bypassed by a caller-supplied stage list:

```
intake -> normalize -> schema -> duplicate -> conflict -> quality -> integrity -> lineage -> packet
```

Zero `sourceEnvelopes` yields zero completed stages, which always produces
`status: BLOCKED` with `failure_tokens: ["REFINERY_NO_STAGES_EXECUTED"]`.

## Status and failure tokens

`status` is lifecycle-only: `IN_PROGRESS` (not used by this synchronous
engine; reserved for future async runs), `READY_FOR_KERNEL`,
`REVIEW_REQUIRED`, `BLOCKED`. Every failure reason lives in
`failure_tokens` instead, exactly matching the T2 contract vocabulary:
`REFINERY_NO_STAGES_EXECUTED`, `QUALITY_CHECK_FAILED`,
`INTEGRITY_CHECK_FAILED`, `SCHEMA_VALIDATION_FAILED`. `failure_tokens` is
non-empty only when `status` is `REVIEW_REQUIRED` or `BLOCKED`.

## Non-goals

No Truth Kernel or Truth Flow implementation, no direct import of the
retained legacy Refinery prototype, no automatic authoritative-value
selection from a conflict set, no package registry activation, and no
public-sync, Web/UI, or production-readiness claim. See
`docs/baselines/CVF_GC018_SOT3_T3_REFINERY_CORE_2026-07-12.md` for the
full authorization boundary.

## Usage

```ts
import {
  RefineryEngine,
  DeterministicClock,
  SequentialIdFactory,
} from "cvf-refinery";

const engine = new RefineryEngine(
  new DeterministicClock("2026-07-12T00:00:00Z"),
  new SequentialIdFactory(),
);

const { packet, completedStages } = engine.run({
  sourceEnvelopes: [/* ... */],
  rawRecords: [/* ... */],
  ruleManifest: { manifest_id: "example", version: "v1" },
});
```
