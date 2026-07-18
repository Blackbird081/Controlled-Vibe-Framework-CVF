# CVF Doctrine To Contract Route Map

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-11

EPISTEMIC_PROCESS_NA_WITH_REASON: this reference consolidates reviewer-accepted
MSEA-R90/R91 Lane 1 findings into one navigable route table; the L1/L2/L4/L6
rows below additionally carry reviewer-accepted MSEA-R96 evidence, the R97
L6 inventory alignment, and the bounded MSEA-R98 L2 owner decision. This reference does not itself compare new
evidence or update an empirical claim beyond that acceptance.

## Purpose

Give an operator, developer, or agent one table that starts at the frozen
doctrine's L0-L6 layer model
(`ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md`) and ends at either an active-tree
owning surface or an explicit, bounded gap record, plus a second table that
cross-references the independent non-doctrine numbering schemes already
fingerprinted by MSEA-R91 Lane 1 without inventing a false one-to-one
equivalence between them.

## Scope / Applies To

Applies to any operator, developer, or agent who needs to trace "which
active-tree location, if any, currently implements doctrine layer L0-L6" or
"how do the repository's other layer/version numbering schemes relate to the
frozen doctrine." Does not apply to runtime/product code, does not itself
implement, modify, or supersede the frozen doctrine, `ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md`,
the MSEA-R90/R91 accepted findings it consolidates, or any
`governance/compat/check_*.py` checker. Does not promote legacy-only content
(`.private_reference/legacy/CVF_Restructure/CVF_ECOSYSTEM/`) to active CVF
authority.

## Canonical Source

- Frozen doctrine: `ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md`
- MSEA-R90 Audit A: `docs/audits/CVF_MSEA_R90_SYSTEM_CHAIN_AUDIT_A_2026-07-10.md`
- MSEA-R91 machine map (Lane 1): `docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json`
- MSEA-R91 human map (Lane 1): `docs/reference/system_chain/README.md`
- MSEA-R91 reviewer acceptance: `docs/reviews/CVF_MSEA_R90_SYSTEM_CHAIN_AUDIT_A_COMPLETION_2026-07-10.md`

This reference carries only findings already accepted by the MSEA-R90/R91
reviewer closures, plus fresh direct reads of the named doctrine and
module-map sources performed for R94-T2. No claim here is stronger than that
acceptance.

## L0-L6 Doctrine Route Table

| Doctrine layer | Doctrine location | Active-tree owner | Status | Evidence |
|---|---|---|---|---|
| L0 - Doctrine | `/doctrine` | `ECOSYSTEM/doctrine/` | ACTIVE_PRESENT | direct read: `ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md` exists with the four named doctrine files |
| L1 - System Definition | `/system` | `docs/reference/system_chain/CVF_SYSTEM_DEFINITION.md` | ACTIVE_OWNER_CREATED_WITH_BOUNDARY | MSEA-R99 compact pointer owner covers system identity, core components, and agent/contributor navigation. It does not copy legacy, create `/system`, replace linked owners, create a new authority hierarchy, or inherit frozen status. |
| L2 - Build Protocol | `/protocols` | `AGENTS.md` (bounded active operational owner) | NAMED_DIFFERENTLY_ACTIVE_OWNER_WITH_BOUNDARY | MSEA-R98 decision: `AGENTS.md` actively defines agent build behavior through mandatory startup, source-verification, implementation, autorun, closure, handoff, and repository-protection controls. This satisfies the L2 responsibility under a different name/location. Boundary: it is broader than the historical protocol, is not a one-to-one textual adaptation, does not make `/protocols` exist, and does not inherit frozen-doctrine status. |
| L3 - Operating Model | `/operating-model` | `ECOSYSTEM/operating-model/` | ACTIVE_PRESENT | direct read: `ECOSYSTEM/operating-model/` exists in the active tree, matching doctrine's named contents |
| L4 - Product Implementation | `/cvf-core` | none proven as a current doctrine-equivalent owner | SOURCE_OWNER_UNRESOLVED_WITH_SEARCH_EVIDENCE | MSEA-R96 reviewer-accepted evidence: the doctrine-named `/cvf-core` location does not exist; `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/README.md` self-declares Pre-Public Status and not yet published, consistent with `docs/reference/CVF_MODULE_INVENTORY.md` listing it as `draft`/`future-facing`, which is insufficient to promote it to the active L4 doctrine owner |
| L5 - Governance Modules | `/agents`, `/policy`, `/audit`, `/identity` | `governance/` | NAMED_DIFFERENTLY_ACTIVE_OWNER | `governance/` (subfolders `compat/`, `contracts/`, `registries/`, `schemas/`, `skill-library/`, `toolkit/`) is the active-tree governance-infrastructure owner; none of the four doctrine-named folders (`/agents`, `/policy`, `/audit`, `/identity`) exist verbatim in the active tree |
| L6 - Ecosystem Layer | `/examples`, `/docs` | `docs/` plus `EXTENSIONS/examples/` and `governance/toolkit/06_EXAMPLES/` (partial) | PARTIAL_OWNER_WITH_GAP | R96 evidence plus R97 inventory alignment: `docs/` owns documentation/onboarding; `/examples` does not exist as a named root directory; `EXTENSIONS/examples/` is now inventoried as an `active-reference` L6 examples surface with 13 tracked files, while toolkit examples remain a narrower second location; responsibility is real but still distributed and unconsolidated |

Row disposition vocabulary used above:

- `ACTIVE_PRESENT`: the doctrine-named location exists verbatim in the active
  tree with matching contents.
- `LEGACY_ONLY_GAP`: doctrine-named content exists only under the legacy
  mirror (`.private_reference/legacy/`), confirming the MSEA-R91 Lane 1
  finding; this is a historical gap, not current implementation, and does not
  authorize promoting the legacy mirror to active authority.
- `NAMED_DIFFERENTLY_ACTIVE_OWNER`: the doctrine-named folder does not exist
  verbatim, but a fresh direct read confirms an active-tree module or
  directory owns the same responsibility under a different name.
- `NAMED_DIFFERENTLY_ACTIVE_OWNER_WITH_BOUNDARY`: an active differently named
  source owns the doctrine responsibility operationally, while the route map
  records that the source is broader, not textually equivalent, not located at
  the illustrative doctrine path, and does not inherit doctrine freeze status.
- `PARTIAL_ACTIVE_OWNER`: one doctrine-named location exists and matches; a
  sibling doctrine-named location under the same layer does not.
- `SOURCE_OWNER_UNRESOLVED_WITH_SEARCH_EVIDENCE`: the named location is absent
  and current CVF-governed sources do not establish an equivalent active owner.
- `ACTIVE_OWNER_CREATED_WITH_BOUNDARY`: a governed pointer now covers the
  layer responsibilities while rejecting path equivalence, copied legacy
  authority, duplicate architecture, and frozen-status transfer.
- `ADAPTATION_CANDIDATE`: historical MSEA-R96 intermediate disposition,
  superseded for L2 by the bounded MSEA-R98 owner decision.
- `PARTIAL_OWNER_WITH_GAP`: responsibility coverage is confirmed real but
  distributed across more than one unconsolidated active-tree location, none
  of which is the doctrine-named root folder itself. R97 removed the inventory
  omission for `EXTENSIONS/examples/`; the distributed/path-alignment gap remains.

## Independent Numbering Map Cross-Reference

The following schemes each use "Layer" or "L<N>" labels for their own
concerns. They are recorded here as independent, explicitly non-equivalent
schemes per MSEA-R91 Lane 1's documented-drift finding. Do not read any two
rows below as describing the same thing merely because they share a label.

| Scheme owner | Numbering basis | Layer 0 / L0 meaning | Top layer meaning | Cross-reference to frozen doctrine |
|---|---|---|---|---|
| `ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md` (frozen doctrine) | seven architectural layers, folder-keyed | L0 = Doctrine (`/doctrine`) | L6 = Ecosystem Layer (`/examples`, `/docs`) | canonical; this is the doctrine itself |
| `ARCHITECTURE.md` "System Shape" diagram | four-role stack plus a Meta layer, dependency-direction-keyed | Layer 0 = "Frozen baseline primitives and foundational rules" | Layer 3 = "Web Platform, APIs, non-coder surfaces"; Meta = "Doctrine / Operating Model / Strategy" governs all four | intentionally separate: Meta explicitly maps to doctrine/operating-model but the four numbered layers below it are a distinct implementation-dependency stack, not a doctrine L0-L6 renumbering |
| `docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md` "Full Architecture Overview (5 Layers)" | five layers, version-keyed (`v1.0` through `v1.7.2`) | Layer 1 = Core (`v1.0/v1.1/v1.2`) | Layer 5 = Safety Dashboard (`v1.7.2`) | intentionally separate: a version-release stack for the `EXTENSIONS/` product line, not a doctrine renumbering; note this scheme starts numbering at Layer 1, not Layer 0 |
| `docs/CVF_CORE_KNOWLEDGE_BASE.md` | version-keyed narrative layers (`v1.0` through `v1.7.1`) | not layer-numbered; organized by version tag | not layer-numbered; organized by version tag | intentionally separate: a version-history knowledge base for the `EXTENSIONS/` product line, not a doctrine renumbering |

## Explicit Intentional-Separation Record

Per roadmap R94-T2 requirement 4, the following separations are explicit and
intentional, not unresolved drift requiring reconciliation:

- The frozen doctrine's L0-L6 model describes **repository architectural
  layering** (what folder owns what responsibility at the whole-ecosystem
  level) and is explicitly frozen except for major architectural revision.
- `ARCHITECTURE.md`'s four-role stack and
  `docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md`'s five-layer model describe
  **engineering/product implementation structure** and are not frozen doctrine.
- No document among these four claims to supersede or renumber the others.
  MSEA-R91 Lane 1 already fingerprinted this as recorded drift, not an error
  in any individual document.

## What This Route Map Does Not Decide

This reference does not decide whether the L1/L4 unresolved-owner rows should
be closed by creating active-tree `system/` or `cvf-core/` directories, does
records the bounded L2 active owner without changing doctrine or `AGENTS.md`, does
records the R97 module-inventory alignment but does not execute L6 content
consolidation or root-path alignment, does not reconcile the independent numbering schemes
into one vocabulary, and does not change any doctrine, module-map, or
governance-control-matrix content. Per the R94 roadmap, "a separate
doctrine/architecture reconciliation decision may cross-reference or
intentionally separate the narrations; not authorized by this map." The
MSEA-R96 evidence cited in the L1/L2/L4/L6 rows is reviewer accepted; see
`docs/audits/CVF_MSEA_R96_DOCTRINE_ROUTE_GAP_RECONCILIATION_2026-07-11.md`.

## Freshness

This route map is a companion reference to the existing MSEA-R91 system-chain
map and reuses its Lane 1 fingerprints and freshness owner
(`docs/reference/system_chain/CVF_SYSTEM_CHAIN_FRESHNESS_STANDARD.md`,
`governance/compat/check_system_chain_map_freshness.py`). It does not
introduce a second freshness mechanism. If Lane 1's fingerprinted sources
change, both `docs/reference/system_chain/README.md` and this route map may
require a fresh governed review.

## Claim Boundary

This reference presents an L0-L6 doctrine route table and an independent
numbering cross-reference, built from the frozen doctrine, the active tree,
the legacy mirror (read only to confirm an already-governed L1/L2 absence,
not to absorb it), reviewer-accepted MSEA-R90/R91 Lane 1 findings, and
reviewer-accepted MSEA-R96 L1/L2/L4/L6 evidence. It does not certify architectural correctness beyond that
acceptance, does not promote legacy-only content to active CVF authority,
does not claim textual equivalence between L2 doctrine and `AGENTS.md`, does
not transfer frozen-doctrine status to `AGENTS.md`, and does not close the L6
`PARTIAL_OWNER_WITH_GAP`; it does not reconcile the independent
numbering schemes into one vocabulary, does not authorize a new active-tree
`system/`, `protocols/`, `cvf-core/`, or `examples/` directory, and does not
introduce a second freshness mechanism.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | doctrine L0-L6 route table plus independent numbering cross-reference, consolidating reviewer-accepted MSEA-R90/R91 Lane 1 findings and reviewer-accepted MSEA-R96 evidence |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: this reference has no runtime execution receipt of its own |
| actionEvidence | ACTION_EVIDENCE_PRESENT: direct reads of the frozen doctrine, active-tree directory listings, the legacy mirror, three CVF-governed independent numbering sources performed for R94-T2, and the MSEA-R96 candidate-owner search evidence in `docs/audits/CVF_MSEA_R96_DOCTRINE_ROUTE_GAP_RECONCILIATION_2026-07-11.md` |
| invocationBoundary | manually authored governed reference; no runtime, IDE, shell, or provider invocation |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, or Web interception claim |
| claimLanguage | source-backed route and cross-reference table, not a new architectural decision or doctrine change |
| forbiddenExpansion | no doctrine change, no new active-tree directory creation, no numbering-scheme reconciliation, no second freshness mechanism, no runtime/UI/provider/public-sync claim |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance R94-T2 reference; no public-sync scope was
authorized or exercised.
