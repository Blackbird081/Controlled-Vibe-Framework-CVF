# CVF MSEA R29 T2 MinerU Interface Exposure Decision Matrix

Memory class: governed-reference

Status: COMPLETE_PENDING_REVIEW

Date: 2026-07-05

rawMemoryReleased: false

## Purpose

Decide whether the accepted R28 system-chain helper should be exposed through a
broader interface now or remain an internal direct-source candidate.

## Scope / Applies To

This matrix applies only to interface exposure disposition for the R28 T25
helper. It does not authorize root-barrel export, runtime hierarchy changes,
package API changes, public-sync, provider/live proof, production route release,
or use-case work.

## Source Verification Block

| Claimed item | Claim type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| T25 helper has a direct exported source symbol | EXISTS | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | exported function declaration | `buildMineruSystemChainRouteCandidate` | T25 helper | ACCEPT |
| T25 helper exposes bounded authority input fields | EXISTS | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | interface declaration | `MineruSystemChainRouteAuthority` | T25 helper | ACCEPT |
| T25 helper preserves production route unauthorized | LITERAL_INVARIANT | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/mineru-system-chain-route-candidate.ts` | result interface and returned result | `productionRouteAuthorized`; `PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY` | T25 helper | ACCEPT |
| R29 T1 keeps production/use-case gaps explicit | VALUE_SET | `docs/reference/CVF_MSEA_R29_T1_MINERU_FOUNDATION_CHAIN_CLOSURE_AUDIT_AND_GAP_REGISTER_2026-07-05.md` | Gap Register | `R29_FOUNDATION_CHAIN_GAP_REGISTER_COMPLETE_BOUNDED` | R29 T1 gap register | ACCEPT |

## Decision Options

| Option | Meaning | Disposition |
| --- | --- | --- |
| `R29_INTERFACE_EXPOSURE_INTERNAL_ONLY` | Keep direct helper evidence internal-only; no root-barrel or runtime hierarchy edit now | SELECTED |
| `R29_INTERFACE_EXPOSURE_ROOT_EXPORT_READY` | Add package/root export now | REJECT |
| `R29_INTERFACE_EXPOSURE_RUNTIME_ROUTE_READY` | Wire into runtime route now | REJECT |

## Selected Decision Disposition

`R29_INTERFACE_EXPOSURE_INTERNAL_ONLY`

## Decision Rationale

The T25 helper is source-visible and test-backed, but R28/R29 still hold
production release, retrieval, vectorization, private-output, and use-case
claims. A broader interface export would look like release surface movement
without the matching production or public boundary. Therefore R29 keeps the
helper internal-only.

## Held Tokens

- `PRODUCTION_MEMORY_RAG_ROUTE_NOT_RELEASED_BY_T25_CANDIDATE_ONLY`
- `R29_INTERFACE_EXPOSURE_INTERNAL_ONLY`
- `PRIVATE_OUTPUT_NOT_READ_OR_RELEASED`
- `USE_CASE_LANE_NOT_AUTHORIZED_BY_R29`

## Checker Source Read-Ahead Block

| Field | Value |
| --- | --- |
| applicableCheckersRead | `governance/compat/check_governed_artifact_checker_read_ahead.py`; `governance/compat/check_agent_operation_trace.py`; `governance/compat/check_epistemic_process_packet.py`; `governance/compat/check_public_export_disposition.py` |
| literalTokensReviewed | Status: COMPLETE_PENDING_REVIEW; Source Verification Block; Selected Decision Disposition; Public Export Disposition; Epistemic Process Block; Agent Operation Trace Block |
| gateRunPurpose | confirmation/evidence after checker source read-ahead; not first discovery |
| claimBoundary | checker read-ahead evidence for T2 matrix only; no runtime/provider/live/public/use-case/production release claim |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this matrix is private provenance foundation evidence only.

## Epistemic Process Block

| Field | Value |
| --- | --- |
| Expected Result / Prediction | Interface exposure should stay internal-only unless production/public boundaries are released |
| Evidence Comparison | T25 helper exists, but R29 T1 still lists production and use-case gaps |
| Contradiction Or Gap Disposition | No contradiction found; no interface wiring is released |
| Claim Update | T2 selects `R29_INTERFACE_EXPOSURE_INTERNAL_ONLY` |

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | local worker role |
| Provider or surface | local workspace |
| Session or invocation | MSEA-R29-T2 interface exposure decision, 2026-07-05 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | `Get-Content`; `rg`; `apply_patch`; `git` |
| Target paths | this T2 matrix |
| Allowed scope source | R29 work order at dispatch base `1fd8875fb` |
| Before status evidence | R29 T2 path absent before authoring |
| After status evidence | T2 matrix pending review |
| Diff evidence | `git status --short --untracked-files=all` |
| Approval boundary | docs-only interface decision |
| Claim boundary | no interface wiring, production route release, or use-case claim |
| Agent type | worker |
| Invocation ID | `msea-r29-t2-interface-decision-2026-07-05` |
| Expected manifest | T2 decision matrix |
| Actual changed set | T2 decision matrix |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This matrix selects internal-only interface disposition. It does not authorize
root-barrel export, runtime route wiring, external adapter support, public-sync,
production route release, provider/live behavior, or use-case readiness.
