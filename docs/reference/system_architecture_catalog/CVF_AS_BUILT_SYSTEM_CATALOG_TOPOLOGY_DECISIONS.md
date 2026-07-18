# CVF As-Built System Catalog Topology Decisions

Memory class: FULL_RECORD

Status: DOC_ONLY_NEW

docType: reference

Date: 2026-07-11

Batch ID: MSEA-ASC-T0

executionBaseHead: `928bab031`

EPISTEMIC_PROCESS_NA_WITH_REASON: topology decision record; no empirical
claim or evidence-comparison work is asserted by this reference itself.

## Purpose

Record the terminal T0 decisions for (1) generated-source layout and
determinism, (2) freshness ownership boundary between the R91 five-lane
system-chain map and the future catalog/gap-index, and (3) human
architecture front-door boundary between the R91 README and a future
as-built front door. Each decision names the selected option, the rejected
alternative, the owner boundary, reserved future paths, and an explicit
implementation-deferred statement. No generator, checker, gap index, or
front-door content is created by this T0 tranche.

## Scope / Applies To

Applies to a future ASC-T3 (gap index), ASC-T4 (front door), and ASC-T5
(freshness/admission) worker or reviewer. Does not apply to runtime/product
code. Does not implement, modify, or supersede
`governance/compat/check_system_chain_map_freshness.py`,
`docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json`, or
`docs/reference/system_chain/README.md`.

## Decision 1 - Generated-Source Layout And Determinism

### Selected option

Compact-source-plus-generated-aggregate, per
`docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md`.
When the catalog is populated (ASC-T1+), each entity record is authored as
one small JSON source file under a reserved `entries/` directory; a
deterministic generator assembles the aggregate `entities` array consumed by
the schema in `CVF_AS_BUILT_SYSTEM_CATALOG_SCHEMA.json`; a drift checker
fails when the aggregate does not match a fresh rebuild from sources.

### Rejected alternative

Hand-maintaining one large `entities` array directly in a single populated
JSON file. Rejected because the aggregate-discipline standard's own Rule
states "a large governed JSON aggregate should not be hand-edited once a
generated source layout exists," and the catalog is explicitly expected to
receive repeated append-only entries across ASC-T1 through ASC-T3, matching
the standard's own Scope criteria ("edited by agents across sessions,"
"likely to receive repeated append-only entries").

### Determinism contract (reserved, not implemented)

Mirrors MSEA-R90 Audit A's manifest-hash method
(`docs/audits/CVF_MSEA_R90_SYSTEM_CHAIN_AUDIT_A_2026-07-10.md` Corpus
Completeness And Report Integrity section): normalize as UTF-8, LF line
endings, no trailing whitespace per line, single trailing newline, entries
sorted by `stableId` in the generated aggregate regardless of source-file
creation order, and a `sha256` recomputed over that normalized form for
drift detection. Source-only metadata (for example an entry's on-disk
filename or creation-order hint) must be stripped from the generated
aggregate unless the schema explicitly requires it, per the aggregate
standard's Source File Discipline section.

### Owner boundary

The future generator and checker are owned by whichever tranche implements
them (ASC-T3 for the gap index generator, a later packet for the full
catalog generator if entity population is large enough to warrant one). This
T0 tranche reserves the path family only; it does not assign an
implementation date.

### Reserved future paths (not created by T0)

- `docs/reference/system_architecture_catalog/entries/` (compact per-entity
  JSON sources)
- `docs/reference/system_architecture_catalog/CVF_AS_BUILT_SYSTEM_CATALOG_AGGREGATE.json`
  (generated aggregate; distinct from the schema file, which is hand-authored
  contract, not generated data)
- `governance/compat/generate_as_built_system_catalog.py` (reserved generator
  name, illustrative)
- `governance/compat/check_as_built_system_catalog_drift.py` (reserved
  checker name, illustrative)
- `docs/reference/system_chain/gaps/README.md`,
  `docs/reference/system_chain/gaps/CVF_SYSTEM_CHAIN_GAP_INDEX.json`,
  `docs/reference/system_chain/gaps/entries/` (roadmap ASC-T3 paths; reserved,
  not created)

### Implementation-deferred statement

No generator, checker, or `entries/` directory exists after this T0
tranche. `entities` in `CVF_AS_BUILT_SYSTEM_CATALOG_SCHEMA.json` remains an
empty-by-convention array in the schema contract itself (the schema defines
the shape; it is not itself a populated aggregate).

## Decision 2 - Freshness Ownership Boundary

### Selected option

**Scoped sibling freshness family**, not a widening of the existing R91
checker. A future `check_as_built_system_catalog_drift.py` (or equivalently
named checker) will own freshness detection for the catalog/gap-index family
exclusively, with its own fingerprint set, its own review-age contract, and
its own local/CI/weekly wiring pattern (mirroring R91's wiring method in
`docs/reference/system_chain/CVF_SYSTEM_CHAIN_FRESHNESS_STANDARD.md`
Local/CI/Weekly Wiring section, but pointed at a distinct aggregate path).
This checker is a **new checker for a family R91 does not own**, not a
second owner of R91's five-lane family - `governance/compat/check_system_chain_map_freshness.py`
continues to own only `docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json`
and its exact 5 `CANONICAL_LANE_IDS`, unchanged.

### Rejected alternative

Formally versioning/widening `check_system_chain_map_freshness.py` and
`CVF_SYSTEM_CHAIN_MAP.json`'s schema to also carry catalog/gap-index
fingerprints. Rejected for T0 because:

- `governance/compat/check_system_chain_map_freshness.py` line 65 hardwires
  `EXPECTED_LANE_COUNT = 5` and line 67 hardwires a fixed
  `CANONICAL_LANE_IDS` tuple; widening it to an N-entity catalog is a
  structural-invariant change to an existing, tested, CI/weekly-wired
  checker, not a schema-time decision;
- `docs/reference/system_chain/CVF_SYSTEM_CHAIN_FRESHNESS_STANDARD.md` Scope
  section (lines 21-27) explicitly binds the standard to "one reference
  family" (the system-chain map JSON plus its README companion); widening it
  would change what "one reference family" means for an existing standard
  without a dedicated review of that standard itself;
- the roadmap's own Non-Goals forbids "no second independent freshness
  owner" - a scoped sibling family for a *distinct* reference family
  (catalog/gap-index, not the five-lane chain) is not a second owner of the
  *same* family, so it satisfies the Non-Goal rather than violating it.

This rejection is a T0 design decision, not a permanent prohibition: a
future, separately authorized packet may still choose to widen R91 instead,
if evidence at that time shows the sibling-family approach caused
duplication in practice.

### Owner boundary

R91's freshness owner (`governance/compat/check_system_chain_map_freshness.py`)
retains exclusive ownership of `docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json`
and its 5 canonical lanes. The future catalog/gap-index freshness owner
(reserved name above) will own exclusively the catalog aggregate and gap
index paths reserved in Decision 1. Neither checker fingerprints the other's
owned aggregate.

### Reserved future paths (not created by T0)

See Decision 1's reserved paths; the freshness checker itself is the same
reserved `governance/compat/check_as_built_system_catalog_drift.py` name.

### Implementation-deferred statement

No freshness checker, hook-chain wiring, CI workflow step, or weekly
reminder workflow exists for the catalog/gap-index family after this T0
tranche. `governance/compat/check_system_chain_map_freshness.py` is
unmodified; this document does not change its `MAP_PATH`,
`EXPECTED_LANE_COUNT`, or `CANONICAL_LANE_IDS` in any way.

## Decision 3 - Human Front-Door Boundary

### Selected option

**Dedicated as-built front door**, at a new reserved path (not created by
T0), that links to but does not replace or absorb
`docs/reference/system_chain/README.md`. The R91 README remains the human
companion for the five-lane system-chain map exactly as
`docs/reference/system_chain/CVF_SYSTEM_CHAIN_FRESHNESS_STANDARD.md`'s
`MAP_DRIFT` state defines it (lines 36, 70: "README lane IDs or verdict
wording disagree with the JSON `lanes` array" / "Compare the README's lane
IDs and verdict tokens against the JSON's `lanes` array").

### Rejected alternative

Expanding `docs/reference/system_chain/README.md` itself into the full
plane/module/edge/gap architecture front door, as the roadmap's ASC-T4 text
(line 234) originally proposed ("Reconcile `docs/reference/system_chain/README.md`
as the human architecture front door"). Rejected for T0 because the R91
freshness checker's `MAP_DRIFT` state compares that exact README's lane IDs
and verdict tokens against the 5-lane JSON; expanding the README's content
and structure risks either breaking `MAP_DRIFT` detection or silently
constraining the as-built front door back down to the 5-lane shape, which
would defeat the roadmap's own architecture-catalog ambition (Claude rebuttal
F5).

### Owner boundary

`docs/reference/system_chain/README.md` remains owned by the R91 freshness
contract and is not edited by any future catalog tranche except to add a
cross-link to the new as-built front door once it exists. The new as-built
front door is owned by whichever tranche implements ASC-T4.

### Reserved future path (not created by T0)

`docs/reference/system_architecture_catalog/README.md` is created by this T0
tranche as the **catalog family's own README** (describing the T0 contract
family itself, per the Work-Order Fulfillment Manifest requirement "describe
T0 contract family, boundaries, future routes"). This is distinct from, and
does not itself claim to be, the full ASC-T4 human architecture front door;
ASC-T4 may choose to use this same path as its front door or a different
reserved path, decided when ASC-T4 is authorized.

### Implementation-deferred statement

No diagrams, plane/module/edge tables, or gap-retrieval front-door content
exist after this T0 tranche. `docs/reference/system_chain/README.md` is
unmodified by this tranche.

## Cross-Decision Consistency Check

All three decisions keep the catalog family (`docs/reference/system_architecture_catalog/`)
strictly additive to the R91 family
(`docs/reference/system_chain/`): no R91-owned path
(`CVF_SYSTEM_CHAIN_MAP.json`, `README.md`,
`CVF_SYSTEM_CHAIN_FRESHNESS_STANDARD.md`,
`check_system_chain_map_freshness.py`) is modified, widened, or re-scoped by
this T0 tranche or by the decisions it records for future tranches.

## Claim Boundary

This document records three terminal T0 topology decisions with rejected
alternatives, owner boundaries, reserved future paths, and explicit
implementation-deferred statements. It does not implement a generator,
checker, front door, or gap index, and does not modify any R91-owned file.
