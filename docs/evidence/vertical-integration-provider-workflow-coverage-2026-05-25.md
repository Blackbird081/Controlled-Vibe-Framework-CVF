# CVF Vertical Integration Provider and Workflow Coverage - 2026-05-25

Memory class: PUBLIC_EVIDENCE_SUMMARY

Status: PUBLIC_SUMMARY

## Purpose

Record the public-safe evidence boundary for the May 25 vertical integration
wave without exposing raw private provenance material, secrets, or full live
run payloads.

## Scope / Target / Owner Boundary

Scope: response-level vertical integration evidence on the governed
`/api/execute` route.

Target readers: external reviewers, developers, and agents deciding what CVF
can already prove after the private VI1-VI4/D/C wave.

Owner boundary: this is a curated public summary. The canonical raw evidence,
closure reviews, and live specs remain in the private provenance repository.

## Source / Predecessor Evidence

Private provenance anchors:

- `docs/reviews/CVF_VI1_W_SERIES_VERTICAL_EXECUTE_CHAIN_COMPLETION_2026-05-25.md`
- `docs/reviews/CVF_VI4_VERTICAL_EVIDENCE_SURFACE_EXPANSION_COMPLETION_2026-05-25.md`
- `docs/reviews/CVF_D_PROVIDER_SCALE_LIVE_VI_PROOF_COMPLETION_2026-05-25.md`
- `docs/reviews/CVF_C_WORKFLOW_SCALE_VI_PROOF_COMPLETION_2026-05-25.md`

Public predecessor evidence:

- `docs/evidence/workflow-chain-memory-proof-2026-05-24.md`
- `docs/evidence/provider-lanes.md`
- `docs/evidence/governance-benchmark-live-metrics-2026-05-24.md`

## Decision / Baseline / Proposed Tranche

Decision: the vertical integration wave is public-catalog eligible as a bounded
capability update because it produced live governed receipts and exposed a
single response-level readout spanning governance receipt, workflow state,
workflow recovery, request context, memory event hook, tool/action readout,
provider-method posture, operational scorecard, artifact verification, and
operational metrics where present.

Baseline: before this wave, public evidence showed Product Brief execution,
provider lanes, benchmark metrics, and a bounded workflow-chain memory proof,
but not a consolidated API/operator readout across provider and workflow
surfaces.

Proposed public boundary: publish only the bounded response-level readout and
coverage evidence. Keep route enforcement changes, tool execution, broad
workflow engine, broad provider stability, and production readiness out of the
public claim surface.

## Evidence / Verification

The private provenance repository closed three bounded follow-on proofs:

- VI4: added `cvf.verticalEvidencePackage.vi4.v1` inside the existing vertical
  integration readout.
- D: proved the VI4 package on live DeepSeek and OpenAI lanes.
- C: proved workflow binding coverage for three non-Product-Brief workflows on
  the live Alibaba lane.

The public-safe claim is narrow:

- VI4 separates call-level result from the event-model denominator so readers
  do not confuse one route call with multiple evidence events.
- The W3/TA1 tool/action surfaces are readouts only and preserve
  `runtimeExecutionAuthorized=false`.
- The W5 provider-method surface reports readiness/fallback posture; it does
  not change provider routing or adapters.
- Workflow recovery remains reviewer-gated; it does not auto-advance or block
  route transitions.
- No raw secret values were printed.

## Live Proof Summary

Vertical integration chain, Alibaba `qwen-turbo`:

- turn 1 receipt: `rcpt-env-mpkkmldw-j6hzrr`
- turn 2 receipt: `rcpt-env-mpkkmvtx-szulhn`
- result: PASS
- claim: VI4 package exposed on a two-turn governed route chain

Multi-provider VI4 breadth:

- DeepSeek `deepseek-chat`: receipt `rcpt-env-mpkl3fnx-c8dlwj`, trace
  `env-mpkl3fnx-c8dlwj`, result PASS
- OpenAI `gpt-4o`: receipt `rcpt-env-mpkl3yqb-zxzn84`, trace
  `env-mpkl3yqb-zxzn84`, result PASS

Multi-workflow VI coverage, Alibaba `qwen-turbo`:

- `strategy_analysis`: receipt `rcpt-env-mpkllvuc-ob4af6`, result PASS
- `marketing_campaign_wizard`: receipt `rcpt-env-mpklmhlb-sj4uju`, result PASS
- `brand_voice`: receipt `rcpt-env-mpklmr3d-pkhoeb`, result PASS

Verification in the provenance workspace passed:

- focused vertical integration and route tests: PASS
- focused workflow resolver tests: PASS 6/6
- `cvf-web` TypeScript check: PASS
- active session state guard: PASS
- handoff guard: PASS
- pre-commit governance hooks: PASS

## Claim Boundary

This evidence proves only response-level vertical integration packaging on the
named provider/model lanes and named workflow templates.

It does not claim broad provider stability, universal provider parity, all
workflow/template coverage, a broad workflow engine, workflow transition
enforcement, route behavior changes, provider router/adapter changes, tool or
MCP execution, database execution, prompt mutation, receipt-envelope changes,
hosted readiness, production readiness, or global freeze release.
