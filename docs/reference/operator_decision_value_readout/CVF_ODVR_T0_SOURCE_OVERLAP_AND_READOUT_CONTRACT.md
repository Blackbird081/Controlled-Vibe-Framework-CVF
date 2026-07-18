# CVF ODVR-T0 Source Overlap And Readout Contract

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-12

## Scope / Applies To

This contract is a documentation/schema-only decision record for the
Operator Decision And Value Readout (ODVR) roadmap's T0 tranche. It inventories
existing owner surfaces, classifies every proposed readout field as `REUSE`,
`COMPOSE`, `OMIT`, or `BLOCKED_SOURCE_NOT_FOUND`, defines freshness and
contradiction semantics, and states the doc-only proposed JSON contract. It
does not implement a composer, CLI, UI, provider call, or new state store.

## Purpose

Answer whether ODVR has a real cross-owner composition gap before any
implementation is authorized, per
`docs/roadmaps/CVF_OPERATOR_DECISION_AND_VALUE_READOUT_ROADMAP_2026-07-12.md`
(material commit `7c6f13ab8`) and
`docs/work_orders/CVF_AGENT_WORK_ORDER_ODVR_T0_SOURCE_OVERLAP_AND_READOUT_CONTRACT_2026-07-12.md`.

## Existing Owner Source Verification Block

Independently re-verified at execution HEAD `c691e4fe4` (worktree clean, matches
committed dispatch HEAD `933f7a420` plus one session-sync commit `c691e4fe4`
that only dispatched the worker; no source drift between dispatch and
execution).

| Claimed item | Claim type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|---|
| active session generator declares current mode and next move fields | EXISTS | `governance/compat/generate_active_session_state.py` | `BOOTSTRAP_FIELDS` tuple, lines 23-32 | `currentMode`; `nextAllowedMove` | active session state generator | ACCEPT |
| compact bootstrap projection exists and carries mode/handoff/next-move/claim-boundary | EXISTS | `CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json` | top-level object | `currentMode`; `activeHandoff`; `nextAllowedMove` | active session bootstrap read model | ACCEPT |
| MAO task-graph evidence readout and freshness classifier exist | EXISTS | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/evidence.readout.contract.ts` | lines 246-320, 369-386 | `MaoEvidenceReadout`; `buildEvidenceReadout`; `classifyReadoutFreshness` | MAO-T7 evidence/readout contract | ACCEPT |
| MLW route-visible advisory decision readout exists | EXISTS | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/mlw-next-runtime-decision-readout.ts` | lines 33-54, 56-169 | `MlwNextRuntimeDecisionReadout`; `buildMlwNextRuntimeDecisionReadout` | MLW-NRD1 readout | ACCEPT |
| Web Workspace server read model exists and aggregates session mode, handoff, next move, lanes | EXISTS | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/cvf-workspace-read-model.ts` | lines 92-117, 262-353 | `CvfWorkspaceReadModel`; `getCvfWorkspaceReadModel` | Web Workspace server read model | ACCEPT |
| local workspace projection foundation is closed bounded | VALUE_SET | `CVF_SESSION/state/entries/localWorkspaceProjectionReadModelClosure20260627.json` | `value.status` | `CLOSED_PASS_BOUNDED` | active session state entry | ACCEPT |
| MAO live value verdict and quantified reopen condition exist | VALUE_SET | `docs/roadmaps/CVF_MAO_LIVE_PROVIDER_ADAPTER_VALUE_PILOT_ROADMAP_2026-07-12.md` | `Status:` line 7; `Concrete reopen condition` line 153 | `REVIEWER_ACCEPTED_VALUE_NOT_PROVEN` | MAO-LIVE roadmap | ACCEPT |

### Correction to paired baseline claim

The paired GC-018 baseline
(`docs/baselines/CVF_GC018_ODVR_T0_SOURCE_OVERLAP_AND_READOUT_CONTRACT_2026-07-12.md`,
line 70) names the owning symbol as `REQUIRED_CORE_KEYS`. Independent
re-verification at execution HEAD found no `REQUIRED_CORE_KEYS` identifier in
`governance/compat/generate_active_session_state.py`; the actual tuple
declaring `currentMode` and `nextAllowedMove` is named `BOOTSTRAP_FIELDS`
(lines 23-32). This table uses the re-verified symbol name. The underlying
claim (the generator declares these two fields) remains ACCEPT; only the
cited symbol name is corrected.

## Negative Search And Collision Discipline

| Field | Evidence |
|---|---|
| Exact search command | `rg -n -i --glob '*.ts' --glob '*.tsx' --glob '*.py' --glob '*.md' --glob '*.json' --glob '*.jsonl' -- '<term>' EXTENSIONS docs CVF_SESSION governance .private_reference` |
| Exact search roots | `EXTENSIONS`; `docs`; `CVF_SESSION`; `governance`; `.private_reference` |
| `ODVR` collision result | 93 matching lines at execution time, all inside ODVR's own roadmap/work-order/baseline/session-routing artifacts; no unrelated pre-existing owner found |
| `Decision And Value Readout` exact-token collision result | every occurrence found is inside ODVR's own roadmap, work order, and baseline text (self-reference); no independent pre-existing owner uses this exact token sequence |
| Semantic owner search result | MAO-T7 evidence readout, MLW-NRD1 decision readout, Web Workspace read model, active-session generator, and bootstrap read model are the five narrower semantic owners; none joins latest-decision plus value-verdict plus claim-boundary plus reopen-condition plus next-move across all of them in one output |
| Planned path collision result | `docs/reference/operator_decision_value_readout/` (and its three sibling files) did not exist before this execution; `Test-Path`/`test -e` confirmed clear at execution start |
| Same-token disposition | `ODVR` and `Decision And Value Readout` collisions are classification-vocabulary and self-reference occurrences only, not evidence of an unrelated full owner; absence of an unrelated owner is treated as absence for scoring purposes only after this explicit semantic check, not from bare token search alone |

## Field-Level Authority Map

Every field below is a **doc-only proposed field name** for a future ODVR
composer output. None of these field names exist today as a runtime object;
see New Doc-Only Fields table for full detail. Classification vocabulary:
`REUSE` (field value can be read verbatim from one existing owner with no
transformation), `COMPOSE` (value requires joining two or more owners, or
deriving a value no single owner currently emits), `OMIT` (roadmap's required
result is already fully answered by an existing owner at the required scope,
so ODVR must not duplicate it), `BLOCKED_SOURCE_NOT_FOUND` (no canonical owner
exists for this value; composer must fail closed rather than infer).

| Proposed field | Classification | Canonical owner(s) | Evidence |
|---|---|---|---|
| `currentMode` | REUSE | active session generator / bootstrap read model | `BOOTSTRAP_FIELDS` in `generate_active_session_state.py`; `currentMode` key in `ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json` |
| `activeHandoff` | REUSE | active session generator / bootstrap read model | `activeHandoff` key, same sources |
| `latestMaterialDecision` | COMPOSE | generated active-session entries carrying `materialCommit`, plus their cited governed artifact | no single owner emits the normalized result; deterministic selection must use the highest `stateOrder` eligible material entry, never filesystem date or directory scan |
| `terminalValueVerdict` | COMPOSE | MAO-LIVE roadmap pattern (`REVIEWER_ACCEPTED_VALUE_NOT_PROVEN`), FPC/other roadmap `Status:` lines | value verdicts exist per-roadmap in free-form `Status:` prose; no owner normalizes them into one queryable field across roadmaps |
| `claimBoundary` | COMPOSE | per-artifact `## Claim Boundary` sections | every governed artifact carries its own claim boundary section; no owner joins the claim boundary of the *latest* decision into a single readout |
| `parkedOrBlockedConditions` | COMPOSE | `nextAllowedMove` prose, Web Workspace `parkedCheckpoints` | Web Workspace read model already extracts `parkedCheckpoints` via `extractParkedCheckpoints` (lines 185-206) scoped to session `nextAllowedMove` and one handoff's next move; ODVR's proposed field would need to extend this across additional roadmap-level parked lanes, which the Web Workspace owner does not currently scope to |
| `reopenCondition` | COMPOSE | roadmap "Concrete reopen condition" / "reopen condition" free-text | present only as free prose in individual roadmaps (e.g. MAO-LIVE roadmap line 153); no owner extracts or normalizes this field |
| `canonicalNextAllowedMove` | REUSE | active session generator / bootstrap read model / Web Workspace read model | all three already expose `nextAllowedMove` verbatim from the same generated source; Web Workspace's `nextAllowedMoveFromState` (lines 178-183) is the most direct existing reuse target |
| `sourceAnchors` | COMPOSE | none (new field) | no existing owner returns a list of source-anchor pointers per answered question; each owner instead embeds its own paths inline in prose or object fields specific to its own scope |
| `aggregateFreshness` | BLOCKED_SOURCE_NOT_FOUND | none | MAO-T7's `classifyReadoutFreshness` (lines 369-386) computes freshness only for one task graph's evidence ledger; no owner computes freshness across the cross-owner join this field implies. A composer implementation must define this deterministically per this contract's Freshness Rules section before the field can move past `BLOCKED_SOURCE_NOT_FOUND` |
| `maoEvidenceSummary` | OMIT | MAO-T7 evidence readout | MAO-T7 already provides `MaoEvidenceReadout` at the correct scope (per task graph); ODVR must link to it, not duplicate its counts |
| `mlwRouteDecisionSummary` | OMIT | MLW-NRD1 readout | MLW-NRD1 already provides `MlwNextRuntimeDecisionReadout` at the correct scope (per route); ODVR must link to it, not duplicate it |
| `workspaceLaneSummary` | OMIT | Web Workspace read model | `CvfWorkspaceReadModel.laneSummaries` (lines 85-90, 242-260) already provides this; ODVR must link to it, not duplicate it |

## Freshness Rules

### Artifact Selection Within One Material Entry

When one eligible generated state entry cites multiple governed artifacts, the
single `artifactPath` uses this ratified role order: `completionReview`,
`completionReviewPath`, `roadmap`, `roadmapPath`, `baseline`, `baselinePath`,
`gc018`, `gc018Baseline`, `workOrder`, then `workOrderPath`. A sole unknown
artifact role may be used. Multiple unknown artifact roles fail closed to
`MISSING_SOURCE`; JSON insertion order is never authority.

Freshness is computed per source anchor first, then aggregated. This mirrors
the pattern already proven by MAO-T7's `classifyReadoutFreshness`
(evaluate one owner's last-recorded timestamp against an explicit
`staleAfterMs` threshold) but is not implemented by any existing owner across
multiple sources; it is defined here as a doc-only proposed rule for a future
composer.

1. **Per-source freshness**: generated active-session state is `CURRENT` only
   when `generate_active_session_state.py --check` passes. A selected material
   entry is `CURRENT` only when its cited path exists, its recorded material
   commit resolves, and its recorded status agrees with the cited artifact's
   current governed status. A mismatch is `STALE`. File age and filesystem
   modification time are never freshness authority.
2. **Aggregate freshness**: the aggregate is `CURRENT` only if every source
   anchor consulted for the answered fields is `CURRENT`. If any one source
   anchor is `STALE`, the aggregate is `STALE` and the readout must name the
   stale anchor(s) explicitly rather than silently returning a mixed-freshness
   result as `CURRENT`.
3. **Missing mandatory source**: if a field classified `COMPOSE` or `REUSE`
   above cannot locate its named canonical owner file at read time, the
   aggregate must fail closed to `MISSING_SOURCE` (not `STALE`, not a guessed
   default), and must name the specific missing owner path.

## Contradiction Rules

1. A contradiction exists when two canonical owners that both claim authority
   over the same proposed field (for example, two roadmaps both claiming to
   be the "latest material decision") return different values for it.
2. On contradiction, the aggregate freshness/result for that field must be
   `CONTRADICTED`, and the output must retain **both** source anchors and
   their respective values. The composer must never silently prefer one
   owner's value, order-of-read precedence, or most-recently-read value as a
   tie-break.
3. A `CONTRADICTED` field does not block emission of other non-contradicted
   fields in the same readout; contradiction is scoped per field, not
   per readout.
4. Resolving a `CONTRADICTED` field requires either a governance-level
   correction to one of the contradicting owners (outside ODVR's authority)
   or an explicit operator disambiguation; ODVR itself has no authority to
   resolve a contradiction automatically.

## Duplicate-Owner Stop Rule Recommendation

Per the roadmap's Stop Rules and this work order's Acceptance Criteria, this
contract's terminal recommendation is:

**Recommendation: PARTIAL_COMPOSITION_GAP_CONFIRMED, T1_PACKET_ELIGIBLE_WITH_NARROWED_SCOPE.**

Rationale: three of the twelve proposed fields (`maoEvidenceSummary`,
`mlwRouteDecisionSummary`, `workspaceLaneSummary`) are `OMIT` - full existing
owners already answer them at the correct scope, and ODVR must link rather
than duplicate. Two fields (`currentMode`, `canonicalNextAllowedMove`) are
`REUSE` - trivial passthroughs from the active-session/bootstrap owner. The
remaining seven fields (`latestMaterialDecision`, `terminalValueVerdict`,
`claimBoundary`, `parkedOrBlockedConditions`, `reopenCondition`,
`sourceAnchors`, `aggregateFreshness`) require cross-owner composition that no
single existing owner performs today; `aggregateFreshness` in particular is
`BLOCKED_SOURCE_NOT_FOUND` until a T1 composer defines it per this contract's
Freshness Rules. A T1 tranche, if separately authorized, should implement
only the `COMPOSE`-classified fields and link (not duplicate) the `OMIT`
fields; it must not build a general dashboard or new source-of-truth store.

## Roadmap-To-Contract Trace

| Roadmap T0 requirement | Contract section | Evidence |
|---|---|---|
| source and overlap inventory | Existing Owner Source Verification Block; Negative Search And Collision Discipline | five owners independently re-verified; collision search shows no unrelated full owner |
| field-level authority map | Field-Level Authority Map | 12 proposed fields classified REUSE/COMPOSE/OMIT/BLOCKED_SOURCE_NOT_FOUND |
| freshness rules | Freshness Rules | per-source plus aggregate rule, deterministic, fails closed on missing source |
| contradiction rules | Contradiction Rules | CONTRADICTED preserves both anchors, never silently resolved |
| JSON contract | `CVF_ODVR_T0_READOUT_SCHEMA.json` (sibling file) | doc-only proposed shape, no implementation claim |
| representative fixtures | schema `examples` array | current, stale, missing-source, and contradicted examples included |
| duplicate-owner stop rule | Duplicate-Owner Stop Rule Recommendation | PARTIAL_COMPOSITION_GAP_CONFIRMED verdict with narrowed T1 scope |

## New Doc-Only Fields Table

All fields below are proposed for a future implementation only. None exists as
a runtime field today. `Source derivation` states how a future T1 composer
would derive the value if authorized; it is not a claim that derivation code
exists.

| Field name | Type | Required/Optional | Source derivation | Freshness rule | Contradiction behavior |
|---|---|---|---|---|---|
| `currentMode` | string | Required | direct passthrough of active-session generator's `currentMode` | per-source freshness of the active session state file | N/A - single owner, cannot contradict itself |
| `activeHandoff` | string | Required | direct passthrough of active-session generator's `activeHandoff` | per-source freshness of the active session state file | N/A - single owner |
| `latestMaterialDecision` | object `{ artifactPath: string, status: string, materialCommit: string, stateOrder: integer }` | Required | select the highest-`stateOrder` generated active-session entry that carries a resolvable `materialCommit` and governed artifact path; directory date scans are forbidden | generator drift plus cited commit/path/status consistency | if equal-order candidates disagree or the selected entry conflicts with its cited artifact, return CONTRADICTED with both anchors |
| `terminalValueVerdict` | string enum or `null` | Optional | extract `Status:` line from the artifact identified by `latestMaterialDecision` when it encodes a value-verdict token (e.g. `REVIEWER_ACCEPTED_VALUE_NOT_PROVEN`) | tied to `latestMaterialDecision` freshness | inherits contradiction from `latestMaterialDecision` |
| `claimBoundary` | string | Required | extract `## Claim Boundary` section body from the artifact identified by `latestMaterialDecision` | tied to `latestMaterialDecision` freshness | inherits contradiction from `latestMaterialDecision` |
| `parkedOrBlockedConditions` | array of string | Optional | union of Web Workspace `parkedCheckpoints` extraction plus any roadmap-level "Stop Rules"/"parked" sentences matching the same extraction pattern | per-source freshness of each contributing owner; aggregate uses the oldest contributing source | list is additive; no single-value contradiction possible, but a duplicate entry from two owners must be deduplicated, not doubled |
| `reopenCondition` | string or `null` | Optional | extract explicit "reopen condition" or "Concrete reopen condition" sentence from the artifact identified by `latestMaterialDecision` | tied to `latestMaterialDecision` freshness | inherits contradiction from `latestMaterialDecision` |
| `canonicalNextAllowedMove` | string | Required | direct passthrough of active-session generator's `nextAllowedMove` | per-source freshness of the active session state file | N/A - single owner |
| `sourceAnchors` | array of string (repo-relative paths) | Required | list every source file consulted to answer the other fields in this readout | freshness is evaluated per listed anchor, not on this field itself | N/A - this field lists anchors, it does not hold a contestable value |
| `aggregateFreshness` | string enum `CURRENT`\|`STALE`\|`CONTRADICTED`\|`MISSING_SOURCE` | Required | computed per this contract's Freshness Rules and Contradiction Rules sections | is itself the freshness rollup | `MISSING_SOURCE` takes precedence, then `CONTRADICTED`, then `STALE` |

## Epistemic Process Block

### Expected Result / Prediction

Existing owners would cover narrow readouts while leaving a bounded cross-owner
composition gap for current material decision, value verdict, claim boundary,
reopen condition, source anchors, and aggregate freshness.

### Evidence Comparison

Direct source inspection confirmed the active-session, MAO-T7, MLW-NRD1, and
Web Workspace owners. Field comparison found three OMIT fields, two REUSE
fields, six COMPOSE fields, and one freshness field whose runtime owner is
absent but whose deterministic doc contract is defined here.

### Contradiction Or Gap Disposition

The full-owner stop rule does not trigger. T1 is packet-eligible only for the
narrow composition target and must use generated state order plus material
commit evidence rather than filesystem dates.

### Claim Update

ODVR has a bounded non-duplicate composition gap. Operator-friction value and
implementation correctness remain unproven.

## Text Encoding Exception

N/A with reason: reviewer normalized newly authored prose to ASCII; code-style
tokens and existing filenames retain their source spelling.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ODVR-T0 contract/schema work; no public-sync
artifact is produced or claimed by this document.

## Claim Boundary

This contract is a documentation/schema-only overlap and field-authority
decision for ODVR-T0. It does not implement a composer, CLI, UI, provider/live
proof, mutable state, automatic decision, session mutation, public-sync,
outside-source intake, ODVR-T1/T2, or production-readiness claim. Acceptance
and any material commit belong to the independent reviewer.
