# CVF LHW3 Request Clarification Re-Intake Loop Connector Specification

Memory class: FULL_RECORD

docType: reference

Status: ACTIVE

Contract version: `cvf.requestClarificationReIntakeLoopConnector.lhw3.t2.v1`

Date: 2026-05-27

Authority: `docs/work_orders/CVF_WO_LHW3_T2_REQUEST_CLARIFICATION_RE_INTAKE_LOOP_CONNECTOR_2026-05-27.md`

---

## Purpose

Define a standard clarification packet shape that converts existing CB1/C8 and
VI2 request-context readouts into a manual re-intake loop for C8 pack selection.

## Scope / Applies-To

Applies when CB1 or VI2 exposes missing context, contamination, noise, or C8
reports `no_certified_pack_match`. Does not apply to automated routing,
provider execution, live intake queues, or runtime clarification dispatch.

## S1 - Purpose And Claim Boundary

This connector is a normative document mapping CB1 missing-signal and
contamination-flag outputs to standard clarification request packet types, with
a loop re-entry standard for returning to C8 pack selection.

CB1 `cvf.productSkillPackRequestContext.v1` is the runtime authority for
signal readout; VI2 `cvf.routeRequestContextProfile.vi2.v1` is the runtime
authority for route-level missing-signal exposure. This connector extends those
outputs to a standard clarification packet shape usable by Orchestrator and
operators.

This connector is not a CB1 or VI2 runtime extension, not a live intake
executor, and not an automated routing engine.

## S2 - CB1 Signal Class To Clarification Packet Type Mapping

| CB1 signal class | CB1 field / value | Clarification packet type | Minimum fields | Loop re-entry point |
| --- | --- | --- | --- | --- |
| Missing context | `missingSignals` non-empty | `missing_context_clarification_packet` | `actor`, `originalPackId`, `missingSignals`, `questionSet`, `returnPath: C8` | Re-submit updated request to C8 pack selection |
| Noisy or contaminated context | `contaminationFlags` non-empty | `noisy_context_clarification_packet` | `actor`, `originalPackId`, `contaminationFlags`, `noiseFlags`, `cleanupRequest`, `returnPath: C8` | Re-submit cleaned request to C8 pack selection |
| Ambiguous outcome | `readiness=needs_clarification` | `ambiguous_outcome_clarification_packet` | `actor`, `originalPackId`, `goalStatement`, `missingSignals`, `returnPath: C8` | Re-submit clarified goal to C8 pack selection |
| Unmatched request | `no_certified_pack_match` | `unmatched_request_clarification_packet` | `actor`, `requestSummary`, `candidateGoal`, `packSelectionStatus`, `returnPath: C8 re-select` | Re-select after request goal or pack family is clarified |

The packet may include VI2 `requestContextReadout.missingSignals`,
`requestContextReadout.contaminationFlags`, `requestContextReadout.noiseFlags`,
and `requestContextReadout.recommendedNextAction` when a route-level readout is
available. All field names above are source-verified in S5.

## S3 - Loop Re-Entry Standard

The clarification response closes the loop when the operator or role agent
answers the packet, removes irrelevant/noisy material where requested, and
re-submits the updated request to the C8 `cvf skill select` surface. Before
re-entry, the receiving agent must confirm `missingSignals` are resolved,
`contaminationFlags` and `noiseFlags` are resolved where present, and
`no_certified_pack_match` is retried with the updated request. The loop
re-entry is manual or operator-triggered. This connector does not claim an
automated clarification routing runtime.

## S4 - Runtime-Enforcement Boundary Table

| Behavior | Current status | Future path |
| --- | --- | --- |
| CB1 missing-signal readout | Runtime (Governance CLI) | Stable |
| VI2 route-level `missingSignals` exposure | Runtime (cvf-web route readout library) | Stable |
| C8 pack selection readout | Runtime (Governance CLI) | Stable |
| Signal-to-packet type mapping | Document-only | Future: clarification packet validator |
| Loop re-entry routing | Document-only | Future: intake loop executor |
| Automated clarification dispatch | Document-only | Future: operator notification surface |

No document-only row above is a runtime claim.

## S5 - Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `ProductSkillPackRequestContextReadiness` values | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | lines 48-52 | `ready`, `needs_clarification`, `needs_context_compaction`, `blocked_contaminated_brief` | `ProductSkillPackRequestContextReadiness` | ACCEPT |
| CB1 request-context fields | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | lines 79-92 | `missingSignals`, `contaminationFlags`, `noiseFlags`, `recommendedNextAction` | `ProductSkillPackRequestContextReadout` | ACCEPT |
| C8 selection status values | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | lines 45, 270, 274 | `selected`, `no_certified_pack_match` | `ProductSkillPackSelectionStatus` / selection readout | ACCEPT |
| VI2 contract version | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/route-request-context-readout.ts` | line 3 | `cvf.routeRequestContextProfile.vi2.v1` | VI2 route request context readout | ACCEPT |
| VI2 readiness and field names | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/route-request-context-readout.ts` | lines 7-34 | `RouteRequestContextReadiness`, `RouteRequestContextReadout`, `missingSignals`, `contaminationFlags`, `noiseFlags`, `recommendedNextAction` | VI2 readout contract | ACCEPT |
| T1 gate | `docs/reviews/CVF_LHW3_T1_OPERATIONAL_FAILURE_TREND_READOUT_CONNECTOR_COMPLETION_2026-05-27.md` | Status line | `CLOSED_PASS_BOUNDED` | T1 completion review | ACCEPT |

No `BLOCKED_SOURCE_NOT_FOUND` rows.

## Claim Boundary

This connector claims only a documentation artifact for clarification packet
formation and manual C8 re-intake. It does not claim CB1/VI2 runtime extension,
live clarification routing, automated intake re-entry, receipt envelope
extension, provider behavior, hosted readiness, production readiness, or public
release readiness.
