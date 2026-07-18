# CVF INDEX Classification Standard

Memory class: FULL_RECORD

Status: ACTIVE_FORWARD_ONLY

docType: reference

Date: 2026-06-21

## Purpose

Define the vocabulary, type taxonomy, metadata requirements, and usage rules for
INDEX artifacts in the Controlled Vibe Framework. This standard is
forward-only: it applies to new index artifacts authored after 2026-06-21. It
does not retroactively reclassify, relabel, or alter historical CVF governed
documents.

## Authority Chain

| Authority | Evidence | Disposition |
|---|---|---|
| Operator | 2026-06-21 instruction to execute MPI-T0 and author the INDEX classification standard | ACCEPT |
| GC-018 | `docs/baselines/CVF_GC018_MPI_T0_INDEX_LEGACY_MEMORY_GRAPH_RECHECK_2026-06-21.md` | ACCEPT |
| Work order | `docs/work_orders/CVF_WO_MPI_T0_INDEX_LEGACY_MEMORY_GRAPH_RECHECK_2026-06-21.md` | ACCEPT |
| MPI roadmap | `docs/roadmaps/CVF_MPI_MEMORY_PLANE_INTEGRATION_ROADMAP_2026-06-21.md` | ACCEPT — DRAFT_FOR_OPERATOR_SELECTION context |
| Codex rebuttal | `docs/reviews/CVF_MPI_MEMORY_PLANE_INTEGRATION_ROADMAP_CODEX_REBUTTAL_2026-06-21.md` | ACCEPT — ACCEPT_VALUE_RECOMMEND_MPI_T1_FIRST |

## Scope / Applies-To

Applies to:

- any agent or operator creating a new index artifact in `docs/`, `governance/`,
  `docs/corpus-intelligence/`, or `EXTENSIONS/`;
- MPI-T1 front-door map authoring — the plane/owner map is IDX-2 under this
  standard;
- INDEX-T1 checker design — the checker must verify compliance with this
  standard (INDEX-T1 is a separate post-MPI-T0 tranche; no checker is
  implemented here);
- future audit, absorption, and scan packets that produce index artifacts as
  outputs.

Does not apply to:

- historical CVF governed documents (roadmaps, baselines, work orders, reviews,
  canonical references) — do not relabel these as INDEX artifacts;
- runtime source files, TypeScript implementation, or generated aggregates;
- provider-specific memory stores or agent memory APIs not under CVF governance.

## Core Distinction: GOVERNED_DOC vs INDEX_ARTIFACT vs RAW_LEGACY

| Class | Description | CVF authority? |
|---|---|---|
| `GOVERNED_DOC` | Canonical CVF authority artifacts authorized by GC-018 operator instruction; cited as authority in work orders, baselines, and reviews | YES — primary source of truth |
| `INDEX_ARTIFACT` | A named, governed index that maps, enumerates, projects, or classifies CVF state; cites GOVERNED_DOC source authority; does not replace it | SECONDARY — cross-reference only |
| `RAW_LEGACY` | Unabsorbed or partially absorbed private legacy files under `.private_reference/` | NO — not CVF authority |

### Rules for each class

A `GOVERNED_DOC` must never be labeled as an INDEX type. Roadmaps, baselines,
work orders, completion reviews, and canonical references remain GOVERNED_DOC.

An `INDEX_ARTIFACT` must:

- carry one INDEX type label from the taxonomy below;
- cite its GOVERNED_DOC source authority explicitly;
- not be used as a substitute for its source authority in closure proof, source
  verification tables, or public claims;
- be human-reviewable or carry an explicit `Human-reviewable: PARTIAL` or `NO`
  declaration with reason.

A `RAW_LEGACY` file must be classified using a disposition from the
Classification Dispositions table before any concept from it is promoted to
GOVERNED_DOC or INDEX_ARTIFACT status.

## INDEX Type Taxonomy

### IDX-1: CORPUS_FAMILY_INDEX

Definition: Enumerates files in a specific corpus family, legacy folder, or
scan-wave output. Captures file counts, sizes, manifest hashes, scan waves,
verdicts, and terminal disposition per entry.

Examples:

- `docs/corpus-intelligence/registry/entries/legacy-cvf-important-graphify.json`
- `docs/audits/CVF_LHW_RESCAN_A_CVF_IMPORTANT_CORPUS_MANIFEST_2026-06-01.json`

| Attribute | Value |
|---|---|
| Human-reviewable | YES — reviewer must verify manifest against actual filesystem |
| Machine-readable | YES — JSON or structured format |
| Source authority | GOVERNED_DOC audit or scan packet that produced this index |
| Runtime authority | NONE |
| Claim boundary | Enumerates files and scan outcomes only; does not assert absorption depth beyond declared disposition |

### IDX-2: PLANE_OWNER_MAP

Definition: Maps CVF concepts, vocabulary, or legacy symbols to the current
authoritative CVF source file, schema, route, or receipt that owns them.
Includes accepted/rejected/blocked rows with cited source evidence.

Examples:

- `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md`
- MPI-T1 Memory Plane front-door map (future)

| Attribute | Value |
|---|---|
| Human-reviewable | YES — all claimed items must be directly verifiable against cited source |
| Machine-readable | PARTIAL — table format; machine checker can verify required columns |
| Source authority | GOVERNED_DOC work order, baseline, or review that authorized the map |
| Runtime authority | NONE — a plane/owner map is a cross-reference only; it does not grant permission |
| Claim boundary | Source symbol cross-reference only; no runtime behavior is asserted |

### IDX-3: STRUCTURAL_GRAPH_INDEX

Definition: A structural relationship map of CVF artifacts, codebase entities,
or knowledge domains. Expresses nodes (files, modules, concepts) and edges
(dependencies, relationships, absorptions, impact arcs). Includes eligibility
rules for context use.

Examples:

- `docs/reference/CVF_LEGACY_ABSORPTION_COVERAGE_INDEX_2026-06-13.md`
- KGR local in-process output from `knowledge-graph-store.ts` (advisory,
  runtime-readout class when generated at runtime; IDX-5 as a design document)
- Markdown vault node/edge schema (tolaria pattern)

| Attribute | Value |
|---|---|
| Human-reviewable | YES — must be human-readable in table or graph form |
| Machine-readable | YES for JSON outputs; PARTIAL for markdown tables |
| Source authority | GOVERNED_DOC scan, review, or work order that authorized the graph index |
| Runtime authority | NONE — structural graph indexes are context and navigation aids, not policy authorities |
| Claim boundary | Relationship map only; graph-derived signals may inform governance but may not make final authorization decisions |

### IDX-4: RUNTIME_READOUT

Definition: A machine-generated or agent-generated projection of current
runtime state derived from governed sources. Reflects a point-in-time snapshot.
Not itself a source of authority.

Examples:

- `CVF_SESSION/ACTIVE_SESSION_STATE.json` (session state projection)
- Memory advisory readout output from `memory-readout-eligibility-policy.ts`
- KGR readout from `knowledge-graph-store.ts` at query time

| Attribute | Value |
|---|---|
| Human-reviewable | PARTIAL — raw projection may not be fully human-readable; a governed summary accompanies critical claims |
| Machine-readable | YES — JSON or structured format |
| Source authority | Governed runtime source that generated the readout |
| Runtime authority | ADVISORY ONLY — a runtime readout does not override governed policy; it informs it |
| Claim boundary | Point-in-time projection only; must not be cited as stable CVF authority across sessions |

### IDX-5: EXTERNAL_AGENT_ACCESS_INDEX

Definition: An index that records what information is accessible to external or
resumed agents — other providers, sessions, Claude instances, Codex instances —
including governed boundary, commit mode, parked checkpoints, and next allowed
move. Enables reproducible agent handoff without granting new permissions.

Examples:

- `AGENT_HANDOFF_V20_2026-06-19.md` (active handoff)
- `CVF_SESSION_MEMORY.md` (compact front door for resumed agents)

| Attribute | Value |
|---|---|
| Human-reviewable | YES — must state claim boundary, commit mode, and parked checkpoints explicitly |
| Machine-readable | PARTIAL — structured sections; not JSON |
| Source authority | Active handoff and session state registry (`CVF_SESSION/ACTIVE_SESSION_STATE.json`) |
| Runtime authority | ADVISORY ONLY — access index does not grant permissions; governed policies and baselines do |
| Claim boundary | Handoff and session context only; no execution authorization; no new lane opening |

### IDX-6: ABSORPTION_DISPOSITION_INDEX

Definition: An index that records the classification and absorption disposition
of legacy sources or external knowledge inputs against CVF governed surfaces.
Used during legacy recheck and knowledge intake cycles to prevent redundant
absorption and missed legacy material.

Examples:

- `docs/reference/CVF_LEGACY_ABSORPTION_COVERAGE_INDEX_2026-06-13.md` (coverage
  tracking for CI1-T11/MLW sources)
- The Processing Ledger in any MPI-T0-class worker-return artifact

| Attribute | Value |
|---|---|
| Human-reviewable | YES — every entry must have a human-verifiable disposition and next action |
| Machine-readable | PARTIAL — table format |
| Source authority | GOVERNED_DOC work order, baseline, or review that authorized the recheck |
| Runtime authority | NONE — disposition index does not authorize absorption or runtime promotion |
| Claim boundary | Classification and next-action routing only; ACCEPT_AS_INDEX_INPUT does not authorize implementation |

### IDX-7: PROVIDER_PRIVATE_MEMORY_INDEX

Definition: A provider-specific or agent-private memory artifact used as an
execution aid for the agent or provider that owns it. Not a CVF source of truth.
Not governed by CVF. Not eligible for citation as CVF authority.

Examples:

- `CLAUDE.md` (Claude provider-specific agent memory)
- Codex memory files, IDE side-channel summaries, provider-local memories

| Attribute | Value |
|---|---|
| Human-reviewable | NOT_APPLICABLE — not a CVF governed artifact |
| Machine-readable | NOT_APPLICABLE for CVF purposes |
| Source authority | NONE for CVF governance |
| Runtime authority | NONE for CVF governance |
| Claim boundary | Provider-private only; any source fact learned from an IDX-7 artifact must be re-verified against a CVF governed surface before use as CVF evidence |

## Required Metadata Per INDEX Artifact

Each `INDEX_ARTIFACT` must include the following fields in its header or
metadata block:

| Field | Required | Notes |
|---|---|---|
| `INDEX type` | YES | One of IDX-1 through IDX-6; IDX-7 is not governed by CVF |
| `Source authority` | YES | Cite the GOVERNED_DOC that authorizes this index |
| `Status` | YES | e.g., ACTIVE, DRAFT, SUPERSEDED |
| `Date` | YES | ISO date of authoring |
| `Human-reviewable` | YES | YES / PARTIAL (with reason) / NO (with reason) |
| `Claim boundary` | YES | What this index may and may not assert |
| `Public Export Disposition` | YES | EXPORTED / DEFERRED_PRIVATE_ONLY / BLOCKED_MISSING_PUBLIC_ARTIFACTS |

## Classification Dispositions For Legacy Inputs

During bounded legacy recheck (MPI-T0 class and successors), classify each
source using exactly one of these dispositions:

| Disposition | Meaning |
|---|---|
| `ACCEPT_AS_INDEX_INPUT` | Source is readable, not yet terminally absorbed, and relevant to a future INDEX or absorption tranche. Record as input. Do not promote to runtime authority. |
| `ALREADY_ABSORBED_CURRENT_OWNER` | Source concepts are verifiably owned by a current CVF governed surface (source file, schema, reference doc). Cite the current owner. No new absorption required. |
| `PARTIAL_RECHECK_REQUIRED` | Source is partially absorbed or partially mapped. Gaps exist. A follow-on tranche must reconcile before claiming full coverage. |
| `DEFER_TO_SEPARATE_GC018` | Source is useful but requires a new operator-authorized GC-018 baseline before any absorption or implementation work begins. |
| `REJECT_DIRECT_RUNTIME_PROMOTION` | Source must not be promoted directly to runtime authority without a full governed absorption cycle. |
| `BLOCKED_UNREADABLE` | Source cannot be read: absent from filesystem, gitignored without override, corrupted, or access-denied. Record exact path and reason. |
| `SKIPPED_WITH_REASON` | Source was not read; explicit reason stated and accepted by reviewer. |

## Forward-Only Application Rules

1. This standard applies only to new artifacts created on or after 2026-06-21.
2. Do not retroactively relabel historical CVF governed documents.
3. INDEX-T1 checker implementation is a separate post-MPI-T0 tranche. This
   standard does not authorize checker implementation, hook-chain wiring, or
   governance/compat test expansion.
4. An `INDEX_ARTIFACT` cited in a governed document is a cross-reference only.
   It must not be promoted as a source of authority for CVF governance decisions.
5. Any `INDEX_ARTIFACT` that asserts a claim about runtime behavior must meet
   the same live-proof standards as any other runtime claim.
6. `REJECT_DIRECT_RUNTIME_PROMOTION` is a terminal block. A source with this
   disposition may not be used in any subsequent source verification table as
   evidence without first opening a formal absorption tranche.

## Existing Index Artifacts Mapped To This Standard

The following pre-existing CVF artifacts are recognized as INDEX_ARTIFACTs under
this standard, retroactive classification being documentary only (the artifacts
themselves are not edited):

| Artifact | INDEX type | Status |
|---|---|---|
| `docs/reference/CVF_LEGACY_ABSORPTION_COVERAGE_INDEX_2026-06-13.md` | IDX-6 ABSORPTION_DISPOSITION_INDEX + IDX-3 STRUCTURAL_GRAPH_INDEX | ACTIVE |
| `docs/reference/CVF_MLW0_CURRENT_SOURCE_VERIFICATION_MAP_2026-06-05.md` | IDX-2 PLANE_OWNER_MAP | ACTIVE |
| `docs/corpus-intelligence/registry/entries/legacy-cvf-important-graphify.json` | IDX-1 CORPUS_FAMILY_INDEX | ACTIVE |
| `CVF_SESSION/ACTIVE_SESSION_STATE.json` | IDX-4 RUNTIME_READOUT | ACTIVE |
| `AGENT_HANDOFF_V20_2026-06-19.md` | IDX-5 EXTERNAL_AGENT_ACCESS_INDEX | ACTIVE |
| `CVF_SESSION_MEMORY.md` | IDX-5 EXTERNAL_AGENT_ACCESS_INDEX | ACTIVE |
| `CLAUDE.md` | IDX-7 PROVIDER_PRIVATE_MEMORY_INDEX | NOT_CVF_SOURCE — provider-specific memory boundary per AGENTS.md |

This table is documentary mapping only. The artifacts listed are not modified.

## Relationship To Other Standards

| Standard | Relationship |
|---|---|
| `CVF_PUBLIC_EXPORT_DISPOSITION_STANDARD_2026-05-30.md` | Governs the `Public Export Disposition` field required on every INDEX artifact |
| `CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md` | Applies when an INDEX artifact is generated by or asserts a live run |
| `CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md` | Work orders that create INDEX artifacts must include a Source Verification Block citing this standard |
| `CVF_KGR_ABSORPTION_PREREVIEW_2026-06-01.md` | A GOVERNED_DOC pre-absorption analysis; its KGR readout maps to IDX-4 RUNTIME_READOUT at runtime |
| `AGENTS.md` (mandatory boundary: provider-specific memory) | CLAUDE.md and other agent-private continuity files are IDX-7; not cited as CVF authority |

Text Encoding Exception: arrow (U+2192) and em-dash (U+2014) characters used in this standard per CVF documentation authoring convention; no code or executable content.
EPISTEMIC_PROCESS_NA_WITH_REASON: classification vocabulary and forward-only contract; all content is definitional taxonomy without experimental prediction, evidence comparison, or hypothesis testing; no observable outcome was predicted or measured

## Claim Boundary

This standard is a classification vocabulary and metadata contract only. It does
not:

- authorize runtime implementation, vector DB, embedding store, graph
  persistence, KGR CLI, provider/live proof, or public-sync;
- create a registry, generated aggregate, or machine-readable manifest;
- implement an INDEX checker (INDEX-T1 is a separate post-MPI-T0 tranche);
- retroactively reclassify or alter historical CVF governed artifacts;
- authorize any MPI-T1/T2/T3/T4 work.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance INDEX classification standard. No public-sync remote,
public commit, public artifact path, or public claim is authorized. Public
export requires a separate operator decision and public-safe summary.
