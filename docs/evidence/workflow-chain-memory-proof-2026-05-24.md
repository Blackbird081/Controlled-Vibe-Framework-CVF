# CVF Workflow Chain Memory Proof - 2026-05-24

Memory class: PUBLIC_EVIDENCE_SUMMARY

Status: PUBLIC_SUMMARY

## Purpose

Record the public-safe evidence boundary for the WC-1 workflow-chain memory
proof without exposing raw private provenance material, secrets, or full live
run payloads.

## Scope / Target / Owner Boundary

Scope: a bounded two-turn workflow-chain proof using the existing governed
`/api/execute` path, Alibaba `qwen-turbo`, and a temporary local durable-memory
store.

Target: public catalog readers who need to know what was proven and what remains
out of scope.

Owner boundary: this is a curated public evidence summary. The canonical raw
evidence, closure review, and script live in the private provenance repository.

## Source / Predecessor Evidence

Private provenance anchors:

- `docs/reviews/CVF_WC1_WORKFLOW_CHAIN_PROOF_COMPLETION_2026-05-24.md`
- `docs/reviews/CVF_WC1_WORKFLOW_CHAIN_PROOF_EVIDENCE_2026-05-24.json`
- `scripts/run_cvf_wc1_workflow_chain_probe.mjs`

Public predecessor evidence:

- `docs/evidence/execution-diagnostics-and-first-value-2026-05-24.md`
- `docs/evidence/post-aif-operationalization-boundary-2026-05-24.md`

## Decision / Baseline / Proposed Tranche

Decision: WC-1 is public-catalog eligible as a bounded proven capability because
it produced two live governed receipts and verified receipt-level durable-memory
write/read evidence.

Baseline: before WC-1, the public catalog described memory and continuity
contracts as partially runtime-wired through audit-memory receipt surfaces only.

Proposed tranche boundary: publish only the bounded read/write proof and keep
all hosted/cloud persistence, autonomous memory, and raw reinjection claims out
of the public claim surface.

## Evidence / Verification

The private provenance repository closed a bounded WC-1 workflow-chain proof.
The proof used two signed live `/api/execute` calls on the Alibaba
`qwen-turbo` lane with a temporary local durable-memory store.

The public-safe claim is narrow:

- turn 1 completed a live governed execution and wrote one summary-only memory
  record;
- turn 2 completed a live governed execution and read the same memory id through
  durable-memory receipt evidence;
- the memory receipt preserved `summaryOnly=true`, `rawMemoryReleased=false`,
  and `canReinject=false`;
- no raw secret values were printed.

## Live Proof Summary

Turn 1:

- provider lane: Alibaba `qwen-turbo`
- status: `success=true`
- evidence mode: `live`
- receipt: `rcpt-env-mpjrwfuh-opgp5q`
- trace: `env-mpjrwfuh-opgp5q`
- memory id: `s1-4da7cc23-8a60-4005-9084-a85787ed3660`
- durable write decision: `allowed`

Turn 2:

- provider lane: Alibaba `qwen-turbo`
- status: `success=true`
- evidence mode: `live`
- receipt: `rcpt-env-mpjrwowf-omx3d7`
- trace: `env-mpjrwowf-omx3d7`
- durable read decision: `allowed`
- memory ids included: `s1-4da7cc23-8a60-4005-9084-a85787ed3660`

Verification in the provenance workspace passed:

- WC-1 live probe: PASS
- web TypeScript check: PASS
- markdown structural completeness: PASS
- docs governance: PASS
- mandatory release gate bundle: 7/7 PASS

## Claim Boundary

This evidence does not claim hosted or cloud memory persistence, autonomous
memory write, raw memory prompt injection, `canReinject=true`, universal
workflow orchestration, broad provider stability, provider SLA, production
readiness, enterprise readiness, or freeze release. It proves only one bounded
two-turn local workflow-chain read/write loop with live governed provider calls.
