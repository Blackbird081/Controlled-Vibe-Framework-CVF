# CVF CI1-T7 LPCI Intake Bridge

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-02

executionBaseHead: `137ed506`

## Purpose

Map the CI1 corpus-intelligence chain (T2–T6) into a typed LPCI product
intake specification. This document is the terminal tranche of CI1 and the
authoritative governance gate that must be satisfied before any LPCI chatbot
implementation, runtime route, or product roadmap begins.

## Scope

Applies to: CI1-T7 LPCI Intake Bridge — the terminal tranche of the CI1
Corpus Intelligence Operationalization chain. This document maps the CI1
evidence corpus (T2–T6) into a typed intake specification for LPCI-T1.

Downstream applicability: LPCI product roadmap authoring; any agent or
operator who proposes to open a governed LPCI implementation roadmap must
satisfy the intake contract defined here before implementation begins.

Owner surface: CVF corpus intelligence governance layer; LPCI product intake
gate.

## Authority Chain

| Authority | Path |
| --- | --- |
| CI1-T7 GC-018 | `docs/baselines/CVF_GC018_CI1_T7_LPCI_INTAKE_BRIDGE_2026-06-02.md` |
| CI1-T7 work order | `docs/work_orders/CVF_WO_CI1_T7_LPCI_INTAKE_BRIDGE_2026-06-02.md` |
| CI1-T6 decision | `docs/reference/CVF_CI1_T6_CHECKER_DECISION_2026-06-02.md` |
| T4 cross-corpus index model | `docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json` |
| T5 sampling results | `docs/corpus-intelligence/CVF_CI1_T5_CLASSIFICATION_SAMPLING_RESULTS.json` |
| CI1 roadmap | `docs/roadmaps/CVF_CI1_CORPUS_INTELLIGENCE_OPERATIONALIZATION_ROADMAP_2026-06-02.md` |

---

## CI1 Chain Closure Statement

The following CI1 tranches are fully closed at the `CLOSED_PASS_BOUNDED`
boundary before LPCI intake begins:

| Tranche | Goal | Status | Evidence |
| --- | --- | --- | --- |
| CI1-T1 | Readiness Packet Template | CLOSED_PASS_BOUNDED | `docs/reference/CVF_CORPUS_INTELLIGENCE_READINESS_PACKET_TEMPLATE_2026-06-02.md` |
| CI1-T2 | Legacy Rescan Pilot — Graphify | CLOSED_PASS_BOUNDED | `docs/audits/CVF_CI1_T2_GRAPHIFY_READINESS_PACKET_2026-06-02.md` |
| CI1-T3 | Legacy Rescan Pilot 2 — Graph Governance | CLOSED_PASS_BOUNDED | `docs/audits/CVF_CI1_T3_GRAPH_GOVERNANCE_CORPUS_READINESS_PACKET_2026-06-02.md` |
| CI1-T4 | Cross-Corpus Index Model | CLOSED_PASS_BOUNDED | `docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json` |
| CI1-T5 | Classification Sampling Protocol | CLOSED_PASS_BOUNDED | `docs/corpus-intelligence/CVF_CI1_T5_CLASSIFICATION_SAMPLING_RESULTS.json` |
| CI1-T6 | Checker Decision | CLOSED_PASS_BOUNDED | `docs/reference/CVF_CI1_T6_CHECKER_DECISION_2026-06-02.md` |
| CI1-T7 | LPCI Intake Bridge | CLOSED_PASS_BOUNDED | this document |

All seven tranches are closed. The CI1 corpus-intelligence operationalization
chain is complete. LPCI may now be proposed as a separate governed product
roadmap.

---

## Corpus Input Contract

LPCI-T1 must consume the following CI1 artifacts as typed inputs. These are
the authoritative governance inputs for any LPCI implementation proposal.

### Primary Inputs

| Input | Artifact | Required fields |
| --- | --- | --- |
| Cross-corpus index model | `docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json` | `commonFacets`, `normalizationRules` (NR-01–NR-10 + NR-03-vocab extension), `sourceMappings`, `claimBoundary` |
| Classification sampling results | `docs/corpus-intelligence/CVF_CI1_T5_CLASSIFICATION_SAMPLING_RESULTS.json` | `sampleRecords`, `normalizationGaps`, `t6Inputs`, `overallVerdict`, `claimBoundary` |
| Checker decision table | `docs/reference/CVF_CI1_T6_CHECKER_DECISION_2026-06-02.md` | Decision table (6 gap rows), checker spec stubs, gap acknowledgment, CI1-T7 gate |
| Scan packet — Graphify | `docs/audits/CVF_CI1_T2_GRAPHIFY_READINESS_PACKET_2026-06-02.md` | classification ledger, adversarial samples, negative search evidence, disposition matrix |
| Scan packet — Graph Governance | `docs/audits/CVF_CI1_T3_GRAPH_GOVERNANCE_CORPUS_READINESS_PACKET_2026-06-02.md` | classification ledger, adversarial samples, negative search evidence, GC-052 finding packet |

### Secondary Inputs (advisory)

| Input | Artifact | Purpose |
| --- | --- | --- |
| Corpus scan registry | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` | registered pilot root boundaries |
| Readiness packet template | `docs/reference/CVF_CORPUS_INTELLIGENCE_READINESS_PACKET_TEMPLATE_2026-06-02.md` | future packet authoring standard |
| Search/filter readiness standard | `docs/reference/CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` | facet schema definition |

### Input Consumption Rules

1. LPCI-T1 must read the T4 model `claimBoundary` field before authoring any
   capability claim.
2. LPCI-T1 must acknowledge all six T6 gap decisions before proposing
   implementation scope that touches normalization, hash, path, or disposition
   handling.
3. LPCI-T1 must not expand the two registered pilot roots
   (`.private_reference/legacy/CVF_Important/Knowledge Base_Graphify/` and
   `.private_reference/legacy/CVF ADD/code-review-graph/`) without a new
   GC-051 scan registration.

---

## Claim Boundary Inheritance

The following claim boundaries from T4/T5/T6 carry forward into all LPCI
tranches. Any LPCI artifact that makes a claim outside these boundaries
requires explicit operator authorization.

### From T4 (Cross-Corpus Index Model)

The T4 model does **not** claim:

- runtime retrieval behavior or query execution;
- semantic correctness of classifications beyond what adversarial sampling
  verifies;
- production readiness, hosted readiness, or public readiness;
- automatic roadmap creation or autonomous mutation;
- LPCI implementation authorization.

**LPCI must inherit this boundary.** The index model is an advisory governance
artifact, not a runtime retrieval engine.

### From T5 (Classification Sampling)

The T5 sampling result (`PASSED_SAMPLING_WITH_GAPS`) verifies classification
discipline and claim boundaries only. It does **not** prove:

- semantic correctness of all classifications;
- runtime indexing, retrieval, or chatbot behavior;
- legal correctness or production readiness.

**LPCI must not cite T5 PASS verdict as retrieval accuracy proof.**

### From T6 (Checker Decision)

The T6 `T7_READY` verdict unlocks CI1-T7 dispatch only. It does **not** prove:

- checker implementation for NR-04/NR-05/NR-11;
- runtime enforcement of gap decisions;
- LPCI implementation authorization beyond intake bridge design.

At CI1-T7 closure time, LPCI had to treat T6 checker stubs as deferred
obligations, not completed controls. The post-CI2 update below supersedes that
downstream interpretation for current work.

### Post-CI2 Update (2026-06-03)

The T6 boundary above remains true for CI1-T7 closure history. For current
downstream consumption, CI2 has since closed the deferred controls:

- CI2-T1 authored the NR-04 source-hash standard.
- CSA1 authored the NR-05 path-normalization standard and NR-11 disposition
  merge rule.
- CI2-T2 implemented structural checkers for NR-04, NR-05, and NR-11 and wired
  them into hook/autorun governance.

Current LPCI and CI2 successors must cite the CI2 standards and checker closure
instead of treating NR-04/NR-05/NR-11 as unresolved T6-only stubs.

---

## Gap Acknowledgment

LPCI-T1 must explicitly acknowledge the following three T6 gaps and their
post-CI2 dispositions in its GC-018 baseline before implementation begins.
These are governance obligations that LPCI inherits from CI1 and CI2.

| gapId | T6 decision | LPCI impact | Required acknowledgment |
| --- | --- | --- | --- |
| NR-04 | STRUCTURAL_CHECK_REQUIRED — satisfied by CI2-T1/T2 | LPCI ingestion integrity — per-file hash or explicit manifest proxy is now structurally enforced for changed readiness packets. | LPCI-T1 GC-018 must cite `docs/reference/CVF_CORPUS_SOURCE_HASH_STANDARD_2026-06-02.md` and state whether runtime ingest requires per-file hash or accepts documented manifest proxy. |
| NR-05 | STANDARD_REQUIRED_FIRST — satisfied by CSA1/CI2-T2 | LPCI query routing — canonical `normalizedPath` is now defined and structurally checked for changed readiness packets. | LPCI-T1 GC-018 must cite `docs/reference/CVF_CORPUS_PATH_NORMALIZATION_ALGORITHM_STANDARD_2026-06-02.md` and adopt the same normalizedPath algorithm. |
| NR-11 | STANDARD_REQUIRED_FIRST — satisfied by CSA1/CI2-T2 | LPCI classification routing — `DEFER` and `ACCEPT_SUMMARY_ONLY` now merge through `dispositionAlias: ACCEPT_DEFERRED` while preserving `rawDisposition`. | LPCI-T1 GC-018 must cite `docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md` and consume `rawDisposition` plus `dispositionAlias`. |

Non-blocking gaps (LPCI may proceed without pre-authoring these standards):

| gapId | T6 decision | LPCI guidance |
| --- | --- | --- |
| NR-03-vocab | VOCABULARY_EXTENSION_REQUIRED — **extension applied** | CONTROL_PLANE_ADAPTERS is now in the T4 vocabulary; LPCI may use it. |
| NR-06 | DOCUMENTATION_ONLY | LPCI must declare per-row sensitivity for any mixed-sensitivity corpus. |
| NR-07 | DOCUMENTATION_ONLY | LPCI may use optional `primaryLanguage` / `secondaryLanguages` fields per T6 template guidance. |

---

## Governance Gate Requirements

Before any LPCI implementation tranche begins, the following CVF gates must
be satisfied:

| Gate | Requirement | Status at CI1-T7 closure |
| --- | --- | --- |
| GC-018 LPCI baseline | A new GC-018 baseline naming the LPCI product scope, claim boundary, forbidden scope, and GC-051/GC-052 wiring | NOT YET AUTHORED — required for LPCI-T1 |
| GC-047 corpus completeness | Any new corpus scanned for LPCI must pass GC-047 completeness check | Active standard — apply to each new corpus |
| GC-048 knowledge-map reconciliation | Any corpus-derived knowledge map must satisfy GC-048 reconciliation | Active standard |
| GC-050 intelligence classification | Any classified corpus must pass GC-050 classification standard | Active standard |
| GC-051 scan registry | New corpora must be registered in `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` before scanning | Active registry |
| GC-052 interlock | LPCI pipeline stages must be wired as GC-052 connections before claiming cross-stage governance | Active registry |
| NR-04 standard/checker | Before LPCI ingest implementation, per-file sourceHash or manifest proxy must be structurally enforced | SATISFIED_BY_CI2_T1_T2 |
| NR-05 algorithm/checker | Before LPCI path-matching implementation, CVF Corpus Path Normalization Algorithm must be authored and structurally enforced | SATISFIED_BY_CSA1_CI2_T2 |
| NR-11 merge rule/checker | Before LPCI disposition-based routing, canonical DEFER/ACCEPT_SUMMARY_ONLY merge rule must be authored and structurally enforced | SATISFIED_BY_CSA1_CI2_T2 |

---

## Blocked Scope

The following LPCI implementation work is **blocked** until the named
condition is satisfied:

| Blocked work | Blocking condition |
| --- | --- |
| LPCI chatbot runtime (any UI, API route, or conversation flow) | Separate governed LPCI roadmap with GC-018 baseline required |
| LPCI vector database or embedding pipeline | Separate governed LPCI roadmap with GC-018 baseline required |
| LPCI query execution against any corpus | Separate governed LPCI roadmap; corpus must be GC-051 registered and GC-047/GC-050 verified |
| Future NR-04/NR-05/NR-11 checker modification | Separate guard-maintenance or checker roadmap; CI2-T2 implementation already exists |
| Broad legacy rescan beyond the two registered pilot roots | New GC-051 scan registration + GC-018 per new corpus |
| Public-sync of any CI1 artifact | Separate public-sync authorization per CVF public-sync rule |

---

## Downstream Routing

After CI1-T7 closes, the following routes are open:

| Route | Description | Precondition |
| --- | --- | --- |
| LPCI product roadmap proposal | Operator may propose an LPCI-T1 GC-018 baseline for chatbot product implementation | CI1-T7 CLOSED_PASS_BOUNDED (satisfied by this document) |
| NR-04/NR-05/NR-11 maintenance | Future governance maintenance for packet-normalization controls | Separate guard-maintenance or checker roadmap |
| Additional corpus scans | Apply CI1 workflow to new corpora (company policy docs, user project files, etc.) | New GC-051 registration + GC-047/GC-048/GC-050 per new corpus |
| Public catalog update | Add CI1 corpus intelligence chain to public technical catalog | Separate public-sync authorization |

---

## Finding-To-Governance Learning Disposition

Runtime/provider/cost learning lane: N/A_WITH_REASON — CI1-T7 is a
documentation-only design synthesis with no provider calls, no live proof,
and no runtime behavior changes.

| Finding | Defect class | Learning lane | Disposition | Next action |
| --- | --- | --- | --- | --- |
| CI1 chain complete — LPCI intake bridge closes the loop | RULE_GAP | GOVERNANCE_CONTROL_PLANE | RULE_ADDED | CI1-T7 bridge spec is the governance gate before LPCI implementation; operator may now propose LPCI roadmap |
| NR-04/NR-05/NR-11 obligations inherited by LPCI | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_ADDED | CI2 standards and checkers now exist; LPCI-T1 GC-018 must cite and consume them instead of treating T6 stubs as unresolved |
| Blocked scope catalog established | ORCHESTRATOR_PACKET_GAP | GOVERNANCE_CONTROL_PLANE | RULE_ADDED | Blocked scope table in this document is the authoritative list; LPCI roadmap author must cite and satisfy it |

---

## Claim Boundary

CI1-T7 maps the CI1 chain into a typed LPCI intake specification only. It
does not:

- implement any LPCI chatbot, runtime route, API endpoint, UI component,
  embedding pipeline, or vector database;
- implement any checker, guard, or test file;
- modify runtime source (`EXTENSIONS/`, `governance/compat/`);
- authorize provider calls, live proof, or public-sync;
- claim production readiness, hosted readiness, legal correctness, or
  semantic completeness of any CI1 artifact;
- grant runtime execution authorization to any CVF control beyond what the
  prior CI1 tranches established.

LPCI implementation authority requires a separate governed product roadmap
with its own GC-018 baseline, work order, and review chain.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY
