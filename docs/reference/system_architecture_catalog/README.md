# CVF As-Built System Architecture Catalog

Memory class: POINTER_RECORD

Status: DOC_ONLY_NEW

docType: reference

Date: 2026-07-11

Batch ID: MSEA-ASC-RW

executionBaseHead: `0a2f3c2e6`

EPISTEMIC_PROCESS_NA_WITH_REASON: family front-door/index reference; no
empirical claim or evidence-comparison work is asserted by this document
itself beyond migrating already-accepted MSEA-R90/R96 findings into the
catalog schema.

## Purpose

Front door for the CVF as-built system architecture catalog family. This
family lets a contributor or agent determine what CVF contains, who owns
each responsibility, how planes connect, which edges execute, where
evidence is retained, and which gaps are open, without reconstructing the
answer from historical reviews - per
`docs/roadmaps/CVF_AS_BUILT_ARCHITECTURE_AND_SYSTEM_CATALOG_ROADMAP_2026-07-11.md`.

**ASC-T1 through ASC-T4 (this wave) populate 22 catalog entities (5 planes,
7 modules, 2 authority sources, 8 edges) and 3 gap entries from
reviewer-accepted MSEA-R90/R96 evidence. ASC-T5 (this wave) adds a scoped
sibling freshness/drift checker. ASC-T6 (independent review and closure) has
not yet run.**

**SOT3-RAP-T0 (2026-07-12) reverse-projects the reviewer-accepted SOT3-T2
documentation-contract chain: 2 new interface entries
(`cvf.asc.interface.sot_three_layer_contract_chain.v1`,
`cvf.asc.interface.sot_three_layer_rejected_competing_shapes.v1`) and 3 new
GAP entries for the Refinery, Truth Kernel runtime, and post-Kernel Truth
Flow owner candidates, bringing the catalog to 24 entities and the gap ledger
to 6 entries. At that point no Refinery, Kernel, or Flow runtime was claimed;
see `docs/reviews/CVF_SOT3_T2_COMPLETION_REVIEW_2026-07-12.md`.**

**SOT3-CVF-PROJ-T1 (2026-07-18) adds 4 new bounded MODULE entries for the
now reviewer-accepted SOT3 private-provenance runtime owners
(`cvf.asc.module.sot3_refinery_runtime.v1`,
`cvf.asc.module.sot3_truth_kernel_runtime.v1`,
`cvf.asc.module.sot3_truth_flow_runtime.v1`,
`cvf.asc.module.sot3_three_layer_slice.v1`), bringing the catalog to 28
entities. Each module owner is `LOCAL_READY` and `ACCEPTED_REVIEW_EVIDENCE`
bounded; none is globally activated, always invoked by a production request
path, a provider boundary, publicly exported, or production-ready. Wiring
into any product request path remains governed separately by
`docs/reference/sot_three_layer/CVF_SOT3_ACTIVATION_ARCHITECTURE_DECISION.md`
and its A1-A5 proof ladder. The contract-chain interface entry is updated in
the same tranche to distinguish its own contract-only authority from these
four bounded implementation owners; see
`docs/reviews/CVF_SOT3_CVF_PROJ_T1_WORKER_RETURN_2026-07-18.md`.**

## As-Built Architecture At A Glance

The five R91 lane planes, in chain order, with their catalog-record IDs:

| Order | Plane | stableId | Posture (reused from R91) |
|---|---|---|---|
| 1 | Doctrine To Contract | `cvf.asc.plane.doctrine_to_contract.v1` | PARTIAL |
| 2 | Contract To Runtime | `cvf.asc.plane.contract_to_runtime.v1` | PARTIAL |
| 3 | Runtime To Enforcement | `cvf.asc.plane.runtime_to_enforcement.v1` | CURRENT |
| 4 | Enforcement To Evidence | `cvf.asc.plane.enforcement_to_evidence.v1` | CURRENT |
| 5 | Evidence To Operator Surface | `cvf.asc.plane.evidence_to_operator_surface.v1` | PARTIAL |

### Plane-Sequence Diagram

Every edge below resolves to a catalog `stableId` in
`docs/reference/system_architecture_catalog/entries/`. Edge style key:
`==>` DECLARED_EDGE (declared sequence only, no execution claim); `-->`
EXECUTED_AND_EVIDENCED_EDGE (CI-only visibility unless noted).

```
[Doctrine To Contract]
   cvf.asc.plane.doctrine_to_contract.v1
        | edge: cvf.asc.edge.doctrine_to_contract_to_contract_to_runtime.v1 (DECLARED_EDGE) ==>
        v
[Contract To Runtime]
   cvf.asc.plane.contract_to_runtime.v1
        | sampled edges (3-of-50, sampledOnly=true):
        |   cvf.asc.edge.gc001_registercaller.v1 (EXECUTED_AND_EVIDENCED_EDGE, CI_ONLY)
        |   cvf.asc.edge.gc009_gateway_no_caller.v1 (IMPLEMENTED_EDGE, ABSENT)
        |   cvf.asc.edge.gc011_pipeline_orchestrator.v1 (EXECUTED_AND_EVIDENCED_EDGE, CI_ONLY)
        | edge: cvf.asc.edge.contract_to_runtime_to_runtime_to_enforcement.v1 (DECLARED_EDGE) ==>
        v
[Runtime To Enforcement]
   cvf.asc.plane.runtime_to_enforcement.v1
        | edge: cvf.asc.edge.cross_family_registry_invocation.v1 (EXECUTED_AND_EVIDENCED_EDGE, CI_ONLY) -->
        | edge: cvf.asc.edge.runtime_to_enforcement_to_enforcement_to_evidence.v1 (DECLARED_EDGE) ==>
        v
[Enforcement To Evidence]
   cvf.asc.plane.enforcement_to_evidence.v1
        | edge: cvf.asc.edge.enforcement_to_evidence_to_evidence_to_operator_surface.v1 (DECLARED_EDGE) ==>
        v
[Evidence To Operator Surface]
   cvf.asc.plane.evidence_to_operator_surface.v1
        | gap: cvf.asc.gap.web_checker_inventory_not_unified.v1 (EVIDENCED_NOT_OPERATOR_VISIBLE)
```

This diagram is a generated-adjacent human projection: every node and edge
label above is a literal `stableId` present in
`docs/reference/system_architecture_catalog/CVF_AS_BUILT_SYSTEM_CATALOG_AGGREGATE.json`
after running the generator. It does not assert any edge, proof class, or
visibility beyond what that entity's own record declares.

### Open Gaps (See Full Ledger For Detail)

| gapId | Status | Front door |
|---|---|---|
| `cvf.asc.gap.l4_product_implementation_unresolved.v1` | `VALUE_PARKED_WITH_REOPEN_CONDITIONS` | `docs/reference/system_chain/gaps/README.md` |
| `cvf.asc.gap.l6_ecosystem_layer_partial.v1` | `PARTIAL_CHAIN_WITH_BOUNDARY` | `docs/reference/system_chain/gaps/README.md` |
| `cvf.asc.gap.web_checker_inventory_not_unified.v1` | `EVIDENCED_NOT_OPERATOR_VISIBLE` | `docs/reference/system_chain/gaps/README.md` |

### How To Answer Common Questions

- **"What owns X?"** Search `ownerPaths` across
  `docs/reference/system_architecture_catalog/entries/*.json` for the path.
- **"Is this edge proven or just declared?"** Read the entity's
  `edgeProofClass`, `evidenceRecency`, and `operatorVisibility` fields; never
  infer proof from file existence alone.
- **"What is not yet resolved?"** Read
  `docs/reference/system_chain/gaps/README.md`.
- **"Is this catalog itself still fresh?"** Run
  `python governance/compat/check_as_built_system_catalog_drift.py --enforce`.

## Scope / Applies To

Applies to any future ASC-T1 through ASC-T6 worker, reviewer, or operator
planning catalog implementation. Does not apply to runtime/product code.
Does not implement, modify, or supersede the R91 system-chain map family
(`docs/reference/system_chain/`), frozen doctrine, the module inventory, or
the governance control matrix.

## Family Contents

| File | Purpose | Status |
|---|---|---|
| `README.md` | this file: family front door and ASC-T4 human architecture front door | ACTIVE |
| `CVF_AS_BUILT_SYSTEM_CATALOG_SCHEMA.json` | JSON Schema contract: entity types, fields, enums, conditional constraints | ACTIVE |
| `CVF_AS_BUILT_SYSTEM_CATALOG_RECONCILIATION_CONTRACT.md` | precedence, conflict, lineage, negative-search, migration table, admission routing | ACTIVE |
| `CVF_AS_BUILT_SYSTEM_CATALOG_TOPOLOGY_DECISIONS.md` | generated-layout, freshness-ownership, and front-door topology decisions | ACTIVE |
| `entries/` | compact per-entity JSON sources (editable authority) | ACTIVE, 28 entities |
| `CVF_AS_BUILT_SYSTEM_CATALOG_AGGREGATE.json` | generated aggregate (rebuild via generator, do not hand-edit) | GENERATED |

## Relationship To The R91 System-Chain Map Family

This catalog family is **strictly additive** to
`docs/reference/system_chain/`. It does not modify, widen, or re-scope
`CVF_SYSTEM_CHAIN_MAP.json`, its `README.md` companion, the freshness
standard, or `governance/compat/check_system_chain_map_freshness.py`. See
`CVF_AS_BUILT_SYSTEM_CATALOG_TOPOLOGY_DECISIONS.md` Decision 2 and Decision 3
for the exact freshness-ownership and front-door boundary between the two
families.

If you need "is CVF's governance chain wired together for the 5 proven
lanes," read `docs/reference/system_chain/README.md` - that remains the
authority for those 5 lanes. If you need the fuller as-built plane/module/
edge/gap picture, this README (the As-Built Architecture At A Glance section
above) and the gap ledger front door now provide it for the entities
populated in this wave.

## Future Routes

| Future route | Owning tranche | Status |
|---|---|---|
| Populated catalog entities (`entries/` + generated aggregate) | ASC-T1, ASC-T2 | POPULATED this wave: 22 entities |
| Gap ledger front door and index (`docs/reference/system_chain/gaps/`) | ASC-T3 | POPULATED this wave: 3 gap entries |
| Human as-built architecture front door | ASC-T4 | POPULATED this wave: this README's At A Glance section |
| Catalog/gap-index freshness checker | ASC-T5 | POPULATED this wave: `governance/compat/check_as_built_system_catalog_drift.py` |
| Independent review and closure | ASC-T6 | not yet opened |

## Governing Documents

- Roadmap: `docs/roadmaps/CVF_AS_BUILT_ARCHITECTURE_AND_SYSTEM_CATALOG_ROADMAP_2026-07-11.md`
- External critique: `docs/reviews/CVF_MSEA_ASC_ARCHITECTURE_CATALOG_ROADMAP_CLAUDE_REBUTTAL_2026-07-11.md`
- Critique classification: `docs/reviews/CVF_MSEA_ASC_CLAUDE_REBUTTAL_CODEX_CLASSIFICATION_2026-07-11.md`
- This tranche's baseline: `docs/baselines/CVF_GC018_MSEA_ASC_T0_SOURCE_SCHEMA_AND_RECONCILIATION_CONTRACT_2026-07-11.md`
- This tranche's work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_ASC_T0_SOURCE_SCHEMA_AND_RECONCILIATION_CONTRACT_2026-07-11.md`

## Claim Boundary

This README is the family front door and the ASC-T4 human architecture front
door for the entities populated in the MSEA-ASC-RW wave (22 catalog entities,
3 gap entries) plus the SOT3-CVF-PROJ-T1 module additions (4 more entities,
28 total). It does not claim exhaustive coverage of every CVF module,
interface, or edge, does not modify the R91 system-chain map family, does not
authorize ASC-T6 independent review/closure, and does not authorize runtime,
public, provider, Web, or L4 promotion work.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance architecture-catalog wave; no public-sync authorization
exists for this family.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | delegated Claude worker |
| Provider or surface | local private provenance workspace |
| Session or invocation | SOT3-CVF-PROJ-T1 worker execution, 2026-07-18 |
| Working directory | repository root |
| Command or tool surface | governed reads, `rg`, file edits, catalog generator, governance gates |
| Target paths | this README |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_SOT3_CVF_PROJ_T1_AS_BUILT_ARCHITECTURE_CATALOG_RECONCILIATION_2026-07-18.md` |
| Before status evidence | README described 24 catalog entities and did not mention the four SOT3 module owners |
| After status evidence | README describes 28 catalog entities including the SOT3-CVF-PROJ-T1 module additions |
| Diff evidence | `git diff --name-status` before any commit |
| Approval boundary | T1 documentation/catalog worker execution only |
| Claim boundary | no runtime, provider/live, public, push, production, or session mutation |
| Agent type | delegated implementation worker |
| Invocation ID | `sot3-cvf-proj-t1-worker-execution-2026-07-18` |
| Expected manifest | this README among the ten allowed T1 paths |
| Actual changed set | this README, entity-count and As-Built summary sections only |
| Manifest delta | MATCH |
