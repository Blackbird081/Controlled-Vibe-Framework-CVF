# CVF LHW9-T2 Noncoder Friction Advisory Connector Spec

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

Contract version: `cvf.noncoderFrictionAdvisory.lhw9.t2.v1`

docType: connector_spec

Date: 2026-05-28

---

## Purpose

This connector spec normalizes how CB1 `ProductSkillPackRequestContextReadout`
(`missingSignals`, `contaminationFlags`, `readiness`), C8
`ProductSkillPackSelectionStatus`, and LHW3-T2 clarification packet types are
combined into a noncoder friction advisory packet. Closes the gap where no
standard maps CB1 friction signals + C8 selection failure to a named
`frictionAdvisoryType` with an `antiOverconstraintRecommendation`.

LH1 triggers: `AI-first vs Human-first` (PARTIALLY_ABSORBED — reopen for
noncoder friction scoring or anti-overconstraint UX), `Human System Harness`
(PARTIALLY_ABSORBED — reopen for noncoder request clarification).

## Scope / Applies To

Documentation-only connector. Applies when a non-coder session encounters CB1
friction signals or C8 pack selection failure. Does not apply to automated
clarification routing, memory injection, or provider execution.

---

## S1 — Purpose and Claim Boundary

**Gap addressed:** CB1 `readiness` (`ready`, `needs_clarification`,
`needs_context_compaction`, `blocked_contaminated_brief`) + `missingSignals`
+ `contaminationFlags` expose friction posture; C8 `ProductSkillPackSelectionStatus`
reports whether a pack was matched; LHW3-T2 defines 4 clarification packet
types. No standard maps these to a named `frictionAdvisoryType` advisory.

**This connector does not inject memory into the prompt or automate
clarification dispatch.** `canReinject=false` and `rawMemoryReleased=false`
are preserved.

**Invariants:**

- `canReinject=false`
- `rawMemoryReleased=false`

## S2 — CB1 Readiness × C8 Selection → Friction Advisory Mapping

| CB1 `readiness` | C8 `ProductSkillPackSelectionStatus` | CB1 friction signal | `frictionAdvisoryType` | `antiOverconstraintRecommendation` | LHW3-T2 packet type |
| --- | --- | --- | --- | --- | --- |
| `ready` | `selected` | none | `friction_none` | None — proceed with selected pack | N/A |
| `needs_clarification` | `selected` | `missingSignals` non-empty | `friction_missing_context` | Offer signal prompts; do not block pack execution | `missing_context_clarification_packet` |
| `needs_clarification` | `no_certified_pack_match` | `missingSignals` non-empty | `friction_missing_context_no_match` | Ask operator to clarify goal; suggest nearest pack family | `ambiguous_outcome_clarification_packet` |
| `needs_context_compaction` | any | context too large | `friction_context_too_large` | Ask operator to shorten or focus request | `noisy_context_clarification_packet` |
| `blocked_contaminated_brief` | any | `contaminationFlags` non-empty | `friction_contaminated_brief` | Ask operator to remove contradictory or conflicting context | `noisy_context_clarification_packet` |
| `ready` | `no_certified_pack_match` | none | `friction_no_pack_match` | Guide operator to rephrase or select nearest goal family | `unmatched_request_clarification_packet` |

Key invariant: `frictionAdvisoryType` is advisory only. This connector does
not block pack execution, enforce clarification, or dispatch re-intake.
Anti-overconstraint principle: signal friction, not block.

## S3 — Noncoder Friction Advisory Packet Minimum Fields

| Field | Source | Invariant | Notes |
| --- | --- | --- | --- |
| `readiness` | CB1 `ProductSkillPackRequestContextReadout.readiness` | — | One of 4 readiness values verbatim |
| `missingSignals` | CB1 `ProductSkillPackRequestContextReadout.missingSignals` | — | List from CB1 |
| `contaminationFlags` | CB1 `ProductSkillPackRequestContextReadout.contaminationFlags` | — | List from CB1 |
| `selectionStatus` | C8 `ProductSkillPackSelectionStatus` | — | `selected` or `no_certified_pack_match` |
| `frictionAdvisoryType` | N/A — new doc-only | — | Advisory type from S2 mapping |
| `antiOverconstraintRecommendation` | N/A — new doc-only | — | Plain-language guidance for operator |
| `reIntakePacketTypeRecommended` | LHW3-T2 packet type | — | One of 4 LHW3-T2 values or N/A |
| `canReinject` | — | `=false` | Preserved invariant |
| `rawMemoryReleased` | — | `=false` | Preserved invariant |

## S4 — Boundary Table

| Surface | Status | Notes |
| --- | --- | --- |
| CB1 `ProductSkillPackRequestContextReadiness` (4 values) | Runtime-proven | Source: `product-outcome.runtime.ts` lines 48–52 |
| CB1 `missingSignals` | Runtime-proven | Source: `product-outcome.runtime.ts` line 88 |
| CB1 `contaminationFlags` | Runtime-proven | Source: `product-outcome.runtime.ts` line 89 |
| C8 `ProductSkillPackSelectionStatus` (2 values) | Runtime-proven | Source: `product-outcome.runtime.ts` line 45 |
| LHW3-T2 clarification packet types (4 values) | Doc-proven | Source: LHW3-T2 spec S2 lines 47–50 |
| `frictionAdvisoryType` (new) | Doc-only | Defined in this connector |
| `antiOverconstraintRecommendation` (new) | Doc-only | Defined in this connector |
| Memory injection | Not authorized | `canReinject=false` preserved |
| Automated re-intake dispatch | Not authorized | Advisory only |

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `ProductSkillPackSelectionStatus` type | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | line 45 | `ProductSkillPackSelectionStatus` | `ProductSkillPackSelectionStatus` | ACCEPT |
| `selected` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | line 45 | `ProductSkillPackSelectionStatus` value | `ProductSkillPackSelectionStatus` | ACCEPT |
| `no_certified_pack_match` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | line 45 | `ProductSkillPackSelectionStatus` value | `ProductSkillPackSelectionStatus` | ACCEPT |
| `ProductSkillPackRequestContextReadiness` type | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | lines 48–52 | `ProductSkillPackRequestContextReadiness` | `ProductSkillPackRequestContextReadiness` | ACCEPT |
| `ready` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | line 49 | `ProductSkillPackRequestContextReadiness` value | `ProductSkillPackRequestContextReadiness` | ACCEPT |
| `needs_clarification` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | line 50 | `ProductSkillPackRequestContextReadiness` value | `ProductSkillPackRequestContextReadiness` | ACCEPT |
| `needs_context_compaction` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | line 51 | `ProductSkillPackRequestContextReadiness` value | `ProductSkillPackRequestContextReadiness` | ACCEPT |
| `blocked_contaminated_brief` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | line 52 | `ProductSkillPackRequestContextReadiness` value | `ProductSkillPackRequestContextReadiness` | ACCEPT |
| `ProductSkillPackRequestContextReadout.missingSignals` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | line 88 | `missingSignals` | `ProductSkillPackRequestContextReadout` | ACCEPT |
| `ProductSkillPackRequestContextReadout.contaminationFlags` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/product-outcome.runtime.ts` | line 89 | `contaminationFlags` | `ProductSkillPackRequestContextReadout` | ACCEPT |
| `missing_context_clarification_packet` | `docs/reference/archive/CVF_LHW3_REQUEST_CLARIFICATION_RE_INTAKE_LOOP_CONNECTOR_SPEC_2026-05-27.md` | S2 line 47 | clarification packet type | LHW3-T2 packet | ACCEPT |
| `noisy_context_clarification_packet` | `docs/reference/archive/CVF_LHW3_REQUEST_CLARIFICATION_RE_INTAKE_LOOP_CONNECTOR_SPEC_2026-05-27.md` | S2 line 48 | clarification packet type | LHW3-T2 packet | ACCEPT |
| `ambiguous_outcome_clarification_packet` | `docs/reference/archive/CVF_LHW3_REQUEST_CLARIFICATION_RE_INTAKE_LOOP_CONNECTOR_SPEC_2026-05-27.md` | S2 line 49 | clarification packet type | LHW3-T2 packet | ACCEPT |
| `unmatched_request_clarification_packet` | `docs/reference/archive/CVF_LHW3_REQUEST_CLARIFICATION_RE_INTAKE_LOOP_CONNECTOR_SPEC_2026-05-27.md` | S2 line 50 | clarification packet type | LHW3-T2 packet | ACCEPT |
| New doc-only `frictionAdvisoryType` | N/A — doc-only | S3 new fields | doc-only | Noncoder friction advisory packet | ACCEPT |
| New doc-only `antiOverconstraintRecommendation` | N/A — doc-only | S3 new fields | doc-only | Noncoder friction advisory packet | ACCEPT |

---

## Claim Boundary

`cvf.noncoderFrictionAdvisory.lhw9.t2.v1` is a documentation-only connector.
It does not claim CB1/C8/LHW3-T2 runtime extension, memory injection,
raw memory release, automated re-intake, receipt envelope extension, provider
behavior, hosted readiness, production readiness, or public release readiness.
