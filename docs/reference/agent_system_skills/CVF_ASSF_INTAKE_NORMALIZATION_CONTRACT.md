# CVF ASSF External And Legacy Intake Normalization Contract

Memory class: FULL_RECORD

Status: CANDIDATE

Date: 2026-06-23

docType: reference

Batch ID: ASSF-T4

EPISTEMIC_PROCESS_NA_WITH_REASON: fixed-schema contract document; it
defines mapping rules, gate requirements, and invariants rather than
testing an evidence-comparison hypothesis.

## Purpose

Define how an external skill screening disposition and a legacy
absorption ledger disposition each map into an ASSF skill candidate,
preserving provenance, license, and security, with a reverification gate
that routes any claim not reverifiable against a CVF-governed source to a
rejected/blocked outcome. The ASSF-T3 no-self-activation invariant is
reused verbatim. Normalized output is always `CANDIDATE`. No normalizer
may set a skill `APPROVED` or `ACTIVE` without reviewer decision and UAT.

## Scope / Applies To

Applies to any future ASSF normalizer implementation (ASSF-T4 or later),
any tool, agent, or process that proposes an ASSF skill candidate from an
external skill screening disposition or a legacy absorption ledger
disposition, and any reviewer deciding on a normalized candidate.

Does not apply to direct candidate authoring by a human operator, to the
ASSF-T2 generated index or resolver, to the ASSF-T3 learning/ADIF
promotion bridge, or to any runtime/provider/live surface.

## Authority Chain

| Authority | Path |
|---|---|
| ASSF-T1 package contract (lifecycle states, provenance fields, candidate shape) | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` |
| ASSF-T3 promotion bridge contract (no-self-activation invariant, reviewer/UAT pattern) | `docs/reference/agent_system_skills/CVF_ASSF_PROMOTION_BRIDGE_CONTRACT.md` |
| External skill screening matrix (external-intake disposition vocabulary) | `docs/reference/archive/CVF_CANDIDATE7_EXTERNAL_SKILL_SOURCE_SCREENING_MATRIX_2026-05-25.md` |
| ASSF-T0.1 legacy absorption ledger (legacy-intake disposition vocabulary) | `docs/audits/CVF_ASSF_T0_1_LEGACY_SKILL_CORPUS_RESCAN_AUDIT_2026-06-23.md` |
| External knowledge absorption chain map (external-intake routing) | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Dual-agent surface accounting standard | `docs/reference/CVF_DUAL_AGENT_SURFACE_ACCOUNTING_STANDARD_2026-06-23.md` |
| ASSF roadmap (T4 tranche definition) | `docs/roadmaps/CVF_AGENT_SYSTEM_SKILLS_FOUNDATION_ROADMAP_2026-06-23.md` |

## No-Self-Activation Invariant

**This invariant is reused verbatim from the ASSF-T3 promotion bridge
contract and is equally binding on all T4-normalized candidates and on
any future normalizer that implements this contract.**

1. No normalizer, promoter, resolver, generator, agent, or automated
   process may set any skill to `APPROVED` or `ACTIVE` without an
   explicit reviewer decision recorded in a governed review artifact.
2. `autonomousMutationAuthorized=false` is invariant for all normalized
   candidates and must not be overridden by any normalizer, promoter, or
   intake tool.
3. A normalized `CANDIDATE` is evidence of a proposal only. It does not
   activate any skill, grant any agent expanded authority, open any
   package instruction body, or authorize any CLI/MCP adapter scope.
4. A reviewer or operator may advance a candidate past `CANDIDATE` only
   after the reviewer-decision gate and, for `ACTIVE`, after the UAT
   requirement are both satisfied.
5. Session-local candidate proposals that are not committed by a reviewer
   do not persist as CVF artifacts and must not be cited as CVF authority.

## Reverification Gate

Every normalized candidate must pass the reverification gate before
receiving `candidateState: CANDIDATE`. Failure routes the input to
`REJECTED_BLOCKED_UNVERIFIED`.

Gate check list:

1. **Source artifact exists**: `sourceArtifacts[0]` must resolve to a
   path present in the current workspace under a CVF-governed surface.
2. **Source is not provider-local**: the source must not be a
   provider-local memory file, a prior-session scratch artifact, or an
   uncommitted workspace-only note.
3. **Disposition is ABSORB- or ACCEPT-class**: the input disposition must
   be one of the ABSORB-class legacy dispositions or ACCEPT-class external
   screening dispositions defined in the mapping tables below. Any other
   disposition routes to REJECTED or BLOCKED.
4. **Provenance fields populated**: `originLane`, `sourceArtifacts`,
   `license`, and `security_notes` must all be explicitly set.
5. **License not UNKNOWN**: if a license cannot be stated, the source
   routes to `REJECTED_BLOCKED_UNVERIFIED` pending a license
   determination.

Reverification failure outcome: `candidateState: REJECTED_BLOCKED_UNVERIFIED`,
retained in the candidate registry with source path and failure reason,
never activated, and not selectable by any resolver.

## External Screening Disposition Mapping

Source vocabulary from:
`docs/reference/archive/CVF_CANDIDATE7_EXTERNAL_SKILL_SOURCE_SCREENING_MATRIX_2026-05-25.md`

| External screening disposition | ASSF-T1 `candidateState` | `originLane` | Reverification gate | Provenance/license/security required | Notes |
|---|---|---|---|---|---|
| `ACCEPT_AS_PATTERN` | `CANDIDATE` | `external_screening` | MUST PASS | yes -- `source_family`, `source_reference`, `license`, `security_notes` | subject to reviewer decision and UAT before APPROVED or ACTIVE |
| `MERGE_AS_PATTERN` | `CANDIDATE` (merged) | `external_screening` | MUST PASS | yes | merged into existing candidate when same root-cause group; both `sourceArtifacts` listed |
| `DEFER_RUNTIME_GATED` | `BLOCKED_PENDING_RUNTIME_GATE` | `external_screening` | BLOCKED | required before unblocking | not a normalized candidate; deferred until runtime gate resolved by a separately authorized tranche |
| `DEFER_EVOLUTION_GATED` | `BLOCKED_PENDING_EVOLUTION_GATE` | `external_screening` | BLOCKED | required before unblocking | not a normalized candidate; deferred until evolution gate resolved |
| `DEFER_CANDIDATE_SPECIFIC_SCREEN` | `BLOCKED_PENDING_SPECIFIC_SCREEN` | `external_screening` | BLOCKED | required before unblocking | requires per-candidate screening before normalization; bulk import explicitly rejected |
| rejected by screening (popularity, star count, or packaging as trust; bulk catalog import) | `REJECTED` | `external_screening` | FAILED -- rejected by screening | N/A | routes directly to REJECTED; no candidate created |

Fixed constants for all ACCEPT-class external normalized candidates:

| ASSF-T1 field | Fixed value |
|---|---|
| `status` | `"CANDIDATE"` |
| `candidateState` | `"CANDIDATE"` |
| `approvalState` | `"AWAITING_REVIEW"` |
| `uatState` | `"NOT_STARTED"` |
| `certificationState` | `"NOT_STARTED"` |
| `internalAgentDisposition` | `"CANDIDATE"` |
| `externalCliMcpDisposition` | `"DEFERRED_WITH_REASON"` |
| `adapterContract` | `"N/A with reason: no external adapter implemented"` |
| `autonomousMutationAuthorized` | `false` |

## Legacy Ledger Disposition Mapping

Source vocabulary from:
`docs/audits/CVF_ASSF_T0_1_LEGACY_SKILL_CORPUS_RESCAN_AUDIT_2026-06-23.md`
Absorption Candidate Ledger column: `Disposition`.

| Legacy ledger disposition | ASSF-T1 `candidateState` | `originLane` | `legacyRows` required | Reverification gate | Notes |
|---|---|---|---|---|---|
| `ABSORB_AS_CONTRACT_INPUT` | `CANDIDATE` | `legacy_absorption` | yes -- T0.1 ledger row path | MUST PASS | eligible for resolver after reviewer decision and UAT |
| `ABSORB_AS_LIFECYCLE_INPUT` | `CANDIDATE` | `legacy_absorption` | yes | MUST PASS | same conditions as CONTRACT_INPUT; TypeScript design-sketch files must carry `executionConstraints: "not runnable in current CVF stack"` |
| `ABSORB_AS_PACKAGE_PATTERN` | `CANDIDATE` | `legacy_absorption` | yes | MUST PASS | same conditions |
| `ABSORB_AS_TOOL_ADAPTER_INPUT` | `CANDIDATE` | `legacy_absorption` | yes | MUST PASS | flagged for T7 adapter tranche; `externalCliMcpDisposition: DEFERRED_WITH_REASON`; normalizer must note T7 routing in candidate |
| `REFERENCE_ONLY` | N/A -- NOT NORMALIZED | N/A | N/A | NOT NORMALIZED | not normalized to an ASSF candidate; retained as reference only; no candidate entry created |
| `BLOCKED_UNVERIFIED_SOURCE` | `REJECTED_BLOCKED_UNVERIFIED` | `legacy_absorption` | required once unblocked | FAILED -- source not yet verified | no candidate created until a separately authorized follow-up tranche re-reads the source and re-dispositions it as ABSORB-class |
| `DUPLICATE` | N/A -- NOT SEPARATELY NORMALIZED | N/A | N/A | NOT SEPARATELY NORMALIZED | merged into the primary candidate row; both source paths listed in primary `sourceArtifacts` |

Fixed constants for all ABSORB-class legacy normalized candidates: identical
to the external screening fixed constants table above.

## Provenance, License, And Security Preservation Requirement

Every normalized candidate, regardless of origin lane, must carry:

| Field | Rule |
|---|---|
| `originLane` | must trace to `external_screening` or `legacy_absorption`; provider-local memory is not an allowed source |
| `sourceArtifacts` | at least one path present in the current workspace under a CVF-governed surface; path must be the exact file verified by the normalizer |
| `legacyRows` | required for legacy-origin candidates; must cite the exact T0.1 ledger row path and disposition label |
| `license` | `CVF_PRIVATE_GOVERNED` for CVF-native legacy files; actual SPDX or stated license for third-party external sources; must not be `UNKNOWN` or absent |
| `security_notes` | explicit statement of any side-effect, credential, network, or execution concern; or `SECURITY_NA_WITH_REASON` if none apply |
| `sourceRevision` | git commit SHA or file modification date of the source artifact at time of normalization |

Dropping or omitting any of these fields is a contract gap violation.
The normalizer must report the gap rather than silently accepting an
incomplete candidate.

**T1 alignment note (contract-introduced fields):** `originLane`,
`sourceArtifacts`, `legacyRows`, and `license` already exist in the
ASSF-T1 Provenance field family. `security_notes` and `sourceRevision`
are introduced by this contract and are NOT yet present in the ASSF-T1
package contract (T1 carries the related `sideEffects` field under its
Risk-and-authority family, not `security_notes`, and has no
`sourceRevision`). Before an executable normalizer is implemented, a
T1-alignment tranche must either add these two fields to the ASSF-T1
schema or remap `security_notes` onto the existing T1 `sideEffects`
field. Until then these two fields are normalization-contract-local.

## Reviewer-Decision Gate

Before a normalized candidate advances beyond `CANDIDATE` to `PROPOSED`,
`APPROVED`, or `ACTIVE`:

1. A reviewer must read the candidate and record acceptance in a governed
   review artifact.
2. The review artifact path must be recorded in `reviewArtifacts`.
3. For `ACTIVE`: UAT evidence must also be recorded in `reviewArtifacts`.
4. No automated process may skip or short-circuit this gate.

## UAT Requirement

Before any normalized skill candidate may advance to `ACTIVE`, evidence of
user acceptance testing must be recorded in `reviewArtifacts`. The UAT
evidence must demonstrate the skill produces expected outputs on at least
one real workload representative of its `taskClasses`.

## REJECTED Outcome

| Field | Value for gate failure | Value for reviewer rejection |
|---|---|---|
| `candidateState` | `REJECTED_BLOCKED_UNVERIFIED` | `REJECTED` |
| `status` | `REJECTED` | `REJECTED` |
| `approvalState` | `REJECTED` | `REJECTED` |
| Registry retention | retained with source path, failure reason, and date | retained |
| Resolver exclusion | excluded from active resolver queries; not selectable | excluded |
| Reopen path | separately authorized follow-up tranche must re-verify source and re-propose | new work order required |

## Session-Local Outcome

Any normalized candidate created in a worker session that is not committed
by a reviewer:

1. does not persist as a CVF artifact;
2. must not be cited as CVF authority by any subsequent agent or session;
3. must not be referenced in a downstream work order as if it were a
   committed, governed artifact.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | the normalization contract that future internal intake tooling (T4 normalizer or later) will consume | T4 defines the mapping and gates only; no normalizer implemented; normalized output is always CANDIDATE; no authority to set APPROVED or ACTIVE | this contract document with conformance mapping; ASSF-T1 lifecycle state reuse; ASSF-T3 no-self-activation invariant reuse | no normalizer implemented in ASSF-T4 | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future CLI/MCP external-intake or candidate-review adapter | T4 records the external-agent disposition in the normalization contract; does not implement, expose, or authorize any adapter | contract External-Agent CLI/MCP Disposition; `externalCliMcpDisposition: DEFERRED_WITH_REASON` fixed in all normalized candidates | separate ASSF adapter work order required | `DEFERRED_WITH_REASON` |

## External-Agent CLI/MCP Disposition

| Field | Value |
|---|---|
| Adapter contract | N/A with reason: external CLI/MCP normalization or candidate-review adapter not yet authored; separate ASSF adapter work order required before any CLI/MCP intake scope is implemented |
| Adapter evidence | N/A with reason: no adapter implemented in ASSF-T4 |
| External mutation boundary | any external CLI/MCP consumer must not mutate candidate state directly; only a reviewer may advance a candidate through the lifecycle gate |
| Fixed constant in all normalized candidates | `externalCliMcpDisposition: DEFERRED_WITH_REASON` |

## Conformance Mapping Summary

| Source field family | Source artifact | Maps to ASSF-T1 family | Key fields mapped |
|---|---|---|---|
| External screening ACCEPT-class | `CVF_CANDIDATE7_EXTERNAL_SKILL_SOURCE_SCREENING_MATRIX_2026-05-25.md` Candidate 7 Screening Matrix | Identity, Provenance, External | `source_family->skillId` (slugified), `accepted_value->name/purpose`, `owner_surface->taskClasses` |
| External screening DEFER-class | same | Lifecycle (blocked) | `DEFER_*->candidateState=BLOCKED_PENDING_*` |
| External screening rejected value | same Deferred Or Rejected Value section | Lifecycle (rejected) | direct `status=REJECTED` |
| Legacy ABSORB-class | `CVF_ASSF_T0_1_LEGACY_SKILL_CORPUS_RESCAN_AUDIT_2026-06-23.md` Absorption Candidate Ledger | Identity, Provenance, Lifecycle | `candidate_path->sourceArtifacts[0]`, `candidate_domain->taskClasses`, `disposition->originLane` |
| Legacy BLOCKED-class | same | Lifecycle (rejected/blocked) | `BLOCKED_UNVERIFIED_SOURCE->candidateState=REJECTED_BLOCKED_UNVERIFIED` |
| Fixed bridge constants | this contract | Lifecycle, Internal/External | `status=CANDIDATE`, `approvalState=AWAITING_REVIEW`, `internalAgentDisposition=CANDIDATE`, `externalCliMcpDisposition=DEFERRED_WITH_REASON` |

## Future Tranche Routing

| Future scope | Required next action |
|---|---|
| Executable normalizer implementation | Route to a separately authorized tranche; requires GC-018 baseline and source-verified work order citing this contract as a required read |
| Normalization-conformance checker | Route to ASSF-T7 or a checker tranche; a checker should verify that normalized candidate entries carry valid reverifiable provenance back to a CVF-governed source |
| No-self-activation regression test | Route to any tranche that implements a normalizer; test must assert no normalized output has `status=APPROVED` or `status=ACTIVE` without reviewer decision |
| CLI/MCP intake adapter | Route to a separate ASSF adapter work order; this contract must be cited as a required read |
| `BLOCKED_UNVERIFIED_SOURCE` follow-up reads | Route to a dedicated follow-up tranche per the T0.1 ledger recommendation |
| ASSF-T5 Composition, Dependency, Conflict, And Capability Controls | next in roadmap after T4 closes; must not begin until T4 is closed |

This contract must be cited as a required read in any future normalizer
work order.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | ASSF-T4 normalization contract authoring only |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE -- contract-definition worker-return lane only |
| receiptEvidence | N/A with reason: no runtime execution, no normalizer invocation, no candidate files created |
| actionEvidence | ACTION_EVIDENCE_PRESENT -- normalization contract document with conformance mapping, source verification rows in work order |
| invocationBoundary | reference document authoring only; no filesystem mutation beyond creating this file |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | authorizes a bounded external-and-legacy intake normalization contract document only |
| forbiddenExpansion | no normalizer code, promoter, resolver, generator, real candidate entry, skill activation, CLI/MCP adapter, migration, runtime/provider/live, or public-sync |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this normalization contract references private legacy provenance
and external screening evidence from `.private_reference/legacy/` source
families. Public-safe intake documentation requires later redaction and
public-sync authorization. This contract is a private provenance artifact.

## Claim Boundary

This document defines the normalization contract only. It does not
implement a normalizer, promoter, resolver, generator, drift checker, or
test code. It does not create real skill candidate entries, activate any
skill, implement a CLI/MCP adapter, run a corpus scan or migration,
update session state, or authorize ASSF-T5. Reviewer/closer owns
completion review authoring, roadmap status update, session sync, and any
material commit after acceptance.
