# CVF LHW4 Noncoder Friction Advisory Packet Connector Spec

Memory class: FULL_RECORD

docType: reference

Contract version: `cvf.noncoderFrictionAdvisoryPacket.lhw4.t3.v1`

Date: 2026-05-27

Status: CLOSED_PASS_BOUNDED

---

## Purpose

This connector defines the noncoder friction advisory packet standard: how
LHW3-T1 trend signals and CB1/C8 readout fields are translated into
plain-language advisories that tell a non-coder what friction was detected
and what to try next — without exposing technical field names.

It is not a LHW3-T1 or CB1 runtime extension. It is not a live friction
scoring engine or workflow blocker. `advisoryBlocking=false` is invariant.

## Scope / Applies-To

Applies to future documentation, packet design, and implementation planning
for noncoder-facing friction advisories across LHW3-T1 trend signals, CB1
missing-signal readout, and C8 pack selection outcomes.

Does not apply to runtime provider calls, workflow execution gating, UX
enforcement, receipt envelope changes, hosted readiness, production readiness,
or public release readiness.

## S1 — Purpose and Claim Boundary

This connector is a normative documentation standard mapping LHW3-T1 trend
signals and CB1 advisory readout into a plain-language friction advisory
packet for non-coders — a human-readable record of what friction was detected
and what to try next.

What this connector is not:

- Not a LHW3-T1 or CB1 runtime extension.
- Not a live friction scoring engine.
- Not a workflow blocker.

Explicit statement: "This connector does not block workflow execution. The
advisory packet is a non-blocking governance record. An operator or agent
may read it to improve their next request, but ignoring it does not prevent
a workflow from running." `advisoryBlocking=false` is invariant throughout.

---

## S2 — Trend Signal + CB1 Signal To Advisory Packet Type Mapping

Column definitions: `LHW3-T1 trend signal` | `CB1 field / value` |
`Advisory packet type` | `Plain-language message template` | `Suggested next step`

| LHW3-T1 trend signal | CB1 field / value | Advisory packet type | Plain-language message template | Suggested next step |
| --- | --- | --- | --- | --- |
| `overconstraint signal` | `policyViolationRate` high | **Overconstraint Advisory** (`overconstraint`) | "CVF declined this action because it doesn't match the current safety rules." | "Try a lower-risk request or contact your administrator to adjust the policy." |
| `underspecification signal` | `missingSignals` non-empty | **Missing Context Advisory** (`missing_context`) | "Your request is missing some information CVF needs to match a workflow." | "Add the missing details and try again." → reference `missing_context_clarification_packet` (LHW3-T2 re-intake loop) |
| `provider instability signal` | `retryCount` high | **Provider Instability Advisory** (`instability`) | "CVF had trouble reaching the AI provider." | "Wait a moment and try again, or ask your administrator about provider status." |
| `degraded-output or drift signal` | `humanCorrectionCount` high | **Output Drift Advisory** (`output_drift`) | "The AI output needed human corrections recently." | "Review the output carefully and provide more specific instructions next time." |
| `no_certified_pack_match` (C8 outcome) | `readiness=needs_clarification` or `missingSignals` non-empty | **No Match Advisory** (`no_match`) | "CVF could not find a workflow that matches your request." | "Try rephrasing your goal or use the clarification option." → reference `unmatched_request_clarification_packet` (LHW3-T2 re-intake loop) |

All signal labels used verbatim from LHW3-T1 S2 and CB1/C8 source-verified
fields. Plain-language templates are documentation examples; implementers may
adjust wording but must preserve the signal source and next-step link.

---

## S3 — Advisory Packet Minimum Fields

Every friction advisory packet must contain the following fields.
These are documentation-only minimum requirements. `advisoryBlocking=false`
is invariant. The advisory packet does not extend `GovernanceEvidenceReceipt`
or any existing receipt envelope.

- `advisoryId`: unique token for this advisory (doc-only)
- `advisoryType`: one of `overconstraint` | `missing_context` | `instability` | `output_drift` | `no_match` (doc-only)
- `signalSource`: the LHW3-T1 trend signal label or C8 `no_certified_pack_match` that triggered the advisory
- `plainLanguageMessage`: non-technical human-readable message
- `suggestedNextStep`: one-sentence action for the operator or non-coder
- `nextStepLoopRef`: optional — LHW3-T2 clarification packet type token when applicable (doc-only)
- `advisoryBlocking`: always `false` (doc-only)

---

## S4 — Runtime-Enforcement Boundary Table

| Behavior | Current status | Future path |
| --- | --- | --- |
| LHW3-T1 trend signal computation | Document-only (LHW3-T1) | Future: trend aggregator |
| CB1 missing-signal readout (`missingSignals`) | Runtime (Governance CLI) | Stable |
| C8 pack selection `no_certified_pack_match` | Runtime (Governance CLI) | Stable |
| Signal-to-advisory-type mapping | Document-only | Future: friction advisory engine |
| Plain-language message rendering | Document-only | Future: operator-facing UI |
| Advisory packet dispatch | Document-only | Future: notification surface |

No doc-only row is labeled Runtime. CB1 and C8 fields are proven closed runtime
surfaces (stable); their advisory interpretation is document-only.

---

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| LHW3-T1 trend signal labels | `docs/reference/CVF_LHW3_OPERATIONAL_FAILURE_TREND_READOUT_CONNECTOR_SPEC_2026-05-27.md` | lines 46–52, S2 table | `overconstraint signal`, `provider instability signal`, `underspecification signal`, `degraded-output or drift signal`, `audit gap signal` | LHW3-T1 S2 trend mapping | ACCEPT |
| W4 metric fields (`policyViolationRate`, `retryCount`, `humanCorrectionCount`) | `docs/reference/CVF_LHW3_OPERATIONAL_FAILURE_TREND_READOUT_CONNECTOR_SPEC_2026-05-27.md` | lines 48–52, S2 table | W4 metric fields verified in LHW3-T1 S2; inherited as signal context | LHW3-T1 S2 (W4 field citations) | ACCEPT |
| VI2 `missingSignals`, `contaminationFlags`, `noiseFlags`, `readiness`, `recommendedNextAction` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/route-request-context-readout.ts` | lines 17–34 | `RouteRequestContextReadout.missingSignals`, `.contaminationFlags`, `.noiseFlags`, `.readiness`, `.recommendedNextAction` | `RouteRequestContextReadout` | ACCEPT |
| C8 `missingSignals`, `contaminationFlags`, `noiseFlags`, `readiness`, `recommendedNextAction` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | lines 79–93 | `ProductSkillPackRequestContextReadout.missingSignals`, `.contaminationFlags`, `.noiseFlags`, `.readiness`, `.recommendedNextAction` | `ProductSkillPackRequestContextReadout` | ACCEPT |
| C8 `no_certified_pack_match` token | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | lines 45, 270, 274 | `ProductSkillPackSelectionStatus`: `no_certified_pack_match` | `ProductSkillPackSelectionStatus` | ACCEPT |
| LHW3-T2 clarification packet types | `docs/reference/CVF_LHW3_REQUEST_CLARIFICATION_RE_INTAKE_LOOP_CONNECTOR_SPEC_2026-05-27.md` | lines 47–50, S2 table | `missing_context_clarification_packet`, `noisy_context_clarification_packet`, `ambiguous_outcome_clarification_packet`, `unmatched_request_clarification_packet` | LHW3-T2 S2 packet type mapping | ACCEPT |

No `BLOCKED_SOURCE_NOT_FOUND` rows. All claimed items are ACCEPT.

---

## Claim Boundary

This connector is documentation-only. It does not claim LHW3-T1 or CB1
runtime extension, live friction scoring, UX enforcement, workflow blocking,
receipt envelope extension, provider behavior, hosted readiness, production
readiness, or public release readiness.
