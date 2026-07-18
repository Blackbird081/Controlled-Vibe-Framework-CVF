# CVF As-Built System Catalog Reconciliation Contract

Memory class: FULL_RECORD

Status: DOC_ONLY_NEW

docType: reference

Date: 2026-07-11

Batch ID: MSEA-ASC-T0

executionBaseHead: `928bab031`

EPISTEMIC_PROCESS_NA_WITH_REASON: schema/reconciliation contract definition;
no empirical claim, corpus classification, or evidence-comparison work is
asserted by this reference itself.

## Purpose

Define how the future as-built system catalog (schema:
`CVF_AS_BUILT_SYSTEM_CATALOG_SCHEMA.json`) reconciles against every current
CVF-governed source view without silently declaring one view universally
superior. This contract is design-time only: it does not populate any
catalog record, and no generator, checker, or gap index exists yet (see
`CVF_AS_BUILT_SYSTEM_CATALOG_TOPOLOGY_DECISIONS.md` for implementation
deferral).

## Scope / Applies To

Applies to a future ASC-T1+ worker or reviewer populating catalog entities
from current CVF-governed sources. Does not apply to runtime/product code.
Does not itself implement, modify, or supersede any cited source, checker, or
doctrine document. Does not authorize catalog population, a generator, a
checker, or a gap index in this T0 tranche.

## Authority And View Ownership

Per the roadmap's requirement (ASC-T0 exit condition: "reconciliation rules
against system map, module inventory, control matrix, doctrine route map, and
gap index"), this contract distinguishes **authority sources** (which decide
what is true) from **view sources** (which describe or summarize what is
true from one angle). A view source disagreeing with an authority source is a
staleness defect in the view, not evidence against the authority. Two
authority sources of different `authorityClass` disagreeing is a real
conflict requiring the precedence order below.

| Source | Path | Role | authorityClass |
|---|---|---|---|
| Frozen doctrine | `ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md` | Authority for layer naming and freeze boundary | `FROZEN_DOCTRINE` |
| Architecture front door | `ARCHITECTURE.md` | View: engineering-structure narration, not doctrine restatement | `HISTORICAL_NARRATION` |
| Doctrine route map | `docs/reference/system_chain/CVF_DOCTRINE_TO_CONTRACT_ROUTE_MAP.md` | Authority for current L0-L6 doctrine-to-active-owner routing | `ACCEPTED_REVIEW_EVIDENCE` |
| System-chain map (R91) | `docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json` + `README.md` | Authority for the 5 proven chain lanes; freshness-owned | `ACCEPTED_REVIEW_EVIDENCE` |
| Module inventory | `docs/reference/CVF_MODULE_INVENTORY.md` | Authority for module maturity/operational-status classification | `ACTIVE_GOVERNED_STANDARD` |
| Governance control matrix | `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md` | Authority for GC-NNN rule-to-owner mapping | `ACTIVE_GOVERNED_STANDARD` |
| Accepted reviews (R90-R99 and later) | `docs/reviews/*_COMPLETION_*.md`, `docs/audits/*.md` | Authority for the specific finding each review accepts; not a blanket authority over unrelated claims | `ACCEPTED_REVIEW_EVIDENCE` |
| Runtime source (`.ts`/`.py` implementation files) | e.g. `EXTENSIONS/CVF_GUARD_CONTRACT/src/...` | Authority for whether a symbol/caller/test actually exists, for runtime-fact claims only | `ACTIVE_IMPLEMENTATION_SOURCE` |
| Future catalog/gap-index sources | reserved, not yet implemented | View: will summarize the above once populated | not yet assigned |
| Legacy mirror | `.private_reference/legacy/...` | Historical evidence only; never authority | `LEGACY_EVIDENCE_ONLY` |

## Precedence Rules

1. **Frozen doctrine outranks all other classes for layer-naming and
   architectural-freeze claims.** No other source, including a runtime file
   or an accepted review, may override what a layer is named or whether a
   layer's content is frozen. This mirrors `ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md`
   Repository Integrity Rule 3 and the doctrine route map's own
   Claim Boundary ("does not authorize a new active-tree `system/` or
   `protocols/` directory").
2. **Runtime source outranks narrative claims for runtime facts.** Whether a
   caller exists, whether a test imports the cited symbol, or whether a
   checker enforces a given constant is decided by direct read of the `.ts`/
   `.py` file, never by a prose summary alone. This mirrors MSEA-R90 Audit A
   Lane 2's method (tracing GC-001/GC-009/GC-011 past file existence to
   actual caller/test pairing).
3. **A more recent accepted review does not override runtime source for
   runtime facts, but does override an older accepted review or route-map row
   for ownership/disposition facts.** R98/R99 correctly superseded R96's L1/L2
   dispositions because they are later accepted reviews of the *same*
   ownership question; neither R98 nor R99 claims to have re-verified R90's
   runtime-caller findings, so those remain governed by R90/R94's own
   citations until a fresh runtime-fact review supersedes them.
4. **`ACCEPTED_REVIEW_EVIDENCE` outranks `HISTORICAL_NARRATION`.** The R91
   system-chain map outranks `ARCHITECTURE.md`'s or
   `docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md`'s undifferentiated diagrams
   for connectivity claims, per the existing route map's own
   "Independent Numbering Map Cross-Reference" (these narrations are
   "intentionally separate," not competing authority).
5. **`LEGACY_EVIDENCE_ONLY` is never promoted to a higher class by catalog
   admission alone.** A legacy file may only support a `boundaryCaveat` or
   `priorDisposition` narrative field; it cannot become the cited authority
   for a `MODULE` or `PLANE` record's `ownerPaths`.
6. **A catalog record's own citation is not authority; it is a pointer.**
   The catalog never becomes a fourth independent numbering scheme by citing
   sources; per the route map's Explicit Intentional-Separation Record, the
   catalog must attribute every claim to one of the rows above, not assert a
   new authority of its own.

## Conflict Disposition Requirement

When two `authorityClass`-equal-or-higher sources disagree on the same
claim, the catalog record MUST carry a `boundaryCaveat` naming both sources
and the precedence rule applied, and MUST NOT silently pick one without
recording the disagreement. This mirrors MSEA-R90 Audit A's own
Contradiction Ledger method (CL-01, CL-02): contradictions are logged with an
authority-precedence resolution, not silently resolved.

## Lineage And Supersession

Every catalog record whose subject has a prior terminal disposition (for
example L1/L2/L4/L6 across R94, R96, R97, R98, R99) MUST populate
`priorDisposition` with the immediately preceding token and `supersededBy`
only on the record it replaces. A chain of supersessions is read by
following `supersededBy` forward or `priorDisposition` backward; the catalog
does not flatten history into the newest record alone, so a future agent can
audit *why* a disposition changed, matching the R96/R98/R99 evidentiary-
upgrade-versus-reversal distinction (see
`docs/audits/CVF_MSEA_R96_DOCTRINE_ROUTE_GAP_RECONCILIATION_2026-07-11.md`
Epistemic Process Block "Claim Update" section for the worked example this
pattern generalizes).

## Negative-Search Discipline

A record whose `currentStatus`/disposition implies "no owner was found" MUST
carry either `rejectedCandidates` (candidates examined and rejected by
responsibility mismatch) or `negativeSearchEvidence` (an executed absence
check, e.g. `test -d <path>` returning not-found), per the R96 method
("File existence alone is insufficient proof of ownership" -
`docs/baselines/CVF_GC018_MSEA_R96_DOCTRINE_ROUTE_GAP_RECONCILIATION_2026-07-11.md`
Evidence / Verification section). A bare absence of a positive claim, with no
recorded search, is not sufficient to mark a `GAP` terminal.

## Migration Table (R90-R99 Evidence To Future Catalog Entities)

This table records the bounded migration plan the roadmap requires. It is
descriptive of what a future ASC-T1 worker would map; **no entity below is
created by this T0 tranche.**

| Current accepted source | Prospective catalog entity type | Prospective stableId slug (illustrative, DOC_ONLY_NEW) | Notes |
|---|---|---|---|
| R91 map lane `DOCTRINE_TO_CONTRACT` | `PLANE` | `plane.doctrine_to_contract` | 5-lane R91 map remains authority; catalog PLANE record would cite it, not restate it |
| R91 map lane `CONTRACT_TO_RUNTIME` | `PLANE` | `plane.contract_to_runtime` | same |
| R91 map lane `RUNTIME_TO_ENFORCEMENT` | `PLANE` | `plane.runtime_to_enforcement` | same |
| R91 map lane `ENFORCEMENT_TO_EVIDENCE` | `PLANE` | `plane.enforcement_to_evidence` | same |
| R91 map lane `EVIDENCE_TO_OPERATOR_SURFACE` | `PLANE` | `plane.evidence_to_operator_surface` | same |
| R99 L1 owner (`docs/reference/system_chain/CVF_SYSTEM_DEFINITION.md`) | `MODULE` | `module.l1_system_definition_pointer` | `currentStatus: ACTIVE_OWNER_CREATED_WITH_BOUNDARY`; `boundaryCaveat` required |
| R98 L2 owner (`AGENTS.md`) | `MODULE` | `module.l2_build_protocol_active_owner` | `currentStatus: NAMED_DIFFERENTLY_ACTIVE_OWNER_WITH_BOUNDARY`; `boundaryCaveat` required |
| L4 (`EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/`) | `GAP` | `gap.l4_product_implementation_unresolved` | `currentStatus: VALUE_PARKED_WITH_REOPEN_CONDITIONS` per roadmap ASC-T3 requirement; reopen condition ties to the module's own pre-public-status exit, not to catalog work |
| L6 distributed owners (`docs/`, `EXTENSIONS/examples/`, `governance/toolkit/06_EXAMPLES/`) | `GAP` plus 3x `MODULE` | `gap.l6_ecosystem_layer_partial`; `module.docs_root`; `module.extensions_examples`; `module.toolkit_examples` | `currentStatus: PARTIAL_CHAIN_WITH_BOUNDARY` |
| GC-001/GC-009/GC-011 (R90 Lane 2 sample) | 3x `EDGE` | `edge.gc001_registercaller`; `edge.gc009_gateway_no_caller`; `edge.gc011_pipeline_orchestrator` | `sampledOnly: true`; GC-009's edge carries `edgeProofClass: IMPLEMENTED_EDGE` per R94-T1B downgrade, not `INVOKED_EDGE` |
| CF-076..CF-084 registry-driven chain (R90 Lane 3) | `EDGE` | `edge.cross_family_registry_invocation` | `edgeProofClass: EXECUTED_AND_EVIDENCED_EDGE`; `evidenceRecency: HISTORICAL_TRACE` (per-checker historical PASS rows) plus a live re-run would upgrade to `LIVE_RECEIPT`; `operatorVisibility: CI_ONLY` |
| Web governance dashboard route | `OPERATOR_SURFACE` | `operator_surface.web_governance_dashboard` | RUNTIME_GUARD class only; does not cover 186 checkers |
| `run_agent_autorun_workflow_gate.py` / `run_local_governance_hook_chain.py` CLI output | `OPERATOR_SURFACE` | `operator_surface.autorun_cli`; `operator_surface.hook_chain_cli` | CI_REPO_GATE class, per-checker PASS/FAIL text confirmed by R90 |
| `ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md` | `AUTHORITY_SOURCE` | `authority_source.frozen_layer_model` | `frozen: true` |
| `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md` | `AUTHORITY_SOURCE` | `authority_source.governance_control_matrix` | `frozen: false`, `authorityClass: ACTIVE_GOVERNED_STANDARD` |

## Catalog Admission Rules (Reused From Roadmap)

Any future change that adds or materially remaps a plane, layer, module,
interface, execution edge, evidence owner, operator surface, or absorbed
owner MUST include one of the seven `admissionDisposition` enum values
(`ENRICH_EXISTING_OWNER`, `NEW_OWNER_JUSTIFIED`, `REFERENCE_ONLY`,
`IMPLEMENTATION_CANDIDATE`, `INTENTIONAL_SEPARATION`, `DUPLICATE_REJECTED`,
`VALUE_PARKED_WITH_REOPEN_CONDITIONS`), reused verbatim from the roadmap
(lines 175-181) and defined in the schema's `admissionDisposition` enum.

### Doctrine-Change Trigger Rule (Claude rebuttal F8 fold)

A frozen-doctrine revision (a change to
`ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md` or another `AUTHORITY_SOURCE` record
with `frozen: true`) is a downstream dependency trigger: it MUST cause a
mandatory catalog reconciliation pass over every `PLANE`, `MODULE`, and `GAP`
record whose `authorityClass` cites that doctrine source, before any other
catalog admission proceeds. This is the inverse direction of the doctrine's
own dependency rule ("Higher layers define principles and rules, while lower
layers contain implementation and usage" -
`ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md` Layer Overview) applied to catalog
freshness: the catalog is a lower-layer view and must react to, not
independently decide, a doctrine change.

### External-Absorption Admission Routing Rule (Claude rebuttal F8 fold)

External-absorption admission for a `NEW_OWNER_JUSTIFIED` catalog entity MUST
route through the existing binding absorption controls
(`governance/compat/check_absorption_blindspot_control_presence.py`, the
External Repository Absorption Entry Control block, and
`governance/compat/check_source_mirror_migration.py`) as a **consumer** of
their accepted disposition, not as a restatement or a parallel gate. A
catalog admission packet citing external-absorption value MUST cite the
already-accepted absorption-entry evidence rather than re-deciding
overlap/novelty classification itself.

## Fail Conditions (Reused From Roadmap, Reconciliation-Specific)

- promoting a `HISTORICAL_NARRATION` source to override `ACCEPTED_REVIEW_EVIDENCE`
  or `FROZEN_DOCTRINE` for the same claim;
- recording a `GAP` as `SOURCE_OWNER_UNRESOLVED_WITH_SEARCH_EVIDENCE` without
  `rejectedCandidates` or `negativeSearchEvidence`;
- recording `ACTIVE_OWNER_CREATED_WITH_BOUNDARY` or
  `NAMED_DIFFERENTLY_ACTIVE_OWNER_WITH_BOUNDARY` without a `boundaryCaveat`;
- flattening a lineage chain by omitting `priorDisposition`/`supersededBy`
  when a documented prior disposition exists;
- treating a legacy mirror path as authority for `ownerPaths`;
- creating a second absorption-admission gate instead of routing through the
  existing absorption controls.

## Claim Boundary

This contract defines reconciliation precedence, conflict handling, lineage,
negative-search discipline, a migration table, and admission routing rules
for a future as-built system catalog. It does not populate any catalog
record, does not implement a generator or checker, does not change any
doctrine, module inventory, control matrix, route map, or R91 freshness
content, and does not authorize ASC-T1 or later tranches.
