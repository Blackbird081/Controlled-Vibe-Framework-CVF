# CVF CI2-T3 Enforced Cross-Corpus Index Model Schema

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-03

executionBaseHead: `7c5b8564`

## Purpose

This document is the human-readable schema reference and field glossary for
`docs/corpus-intelligence/CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json`.
It explains how the CI2-T3 enforced model extends CI1-T4 without overwriting
it, maps every enforced field to its originating standard and checker, and
records the product-readiness boundary.

## Scope

Applies to: CI2-T3 enforced cross-corpus index model schema and field
glossary. This document governs readiness packet authoring, CI2-T4 pilot
schema input, and LPCI intake bridge supplementation.

Owner surface: CVF corpus intelligence governance layer.

## Authority Chain

| Authority | Path |
| --- | --- |
| CI2 GC-018 | `docs/baselines/CVF_GC018_CI2_CORPUS_INTELLIGENCE_ENFORCEMENT_PRODUCT_READINESS_2026-06-02.md` |
| CI2 roadmap | `docs/roadmaps/CVF_CI2_CORPUS_INTELLIGENCE_ENFORCEMENT_PRODUCT_READINESS_ROADMAP_2026-06-02.md` |
| CI2-T2 checker closure | `docs/reviews/CVF_CI2_T2_PACKET_NORMALIZATION_CHECKERS_COMPLETION_2026-06-02.md` |
| CI1-T4 parent model | `docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json` |
| CI1-T7 LPCI intake bridge | `docs/reference/CVF_CI1_T7_LPCI_INTAKE_BRIDGE_2026-06-02.md` |

---

## CI1-T4 Compatibility Note

CI2-T3 supplements CI1-T4 additively. The CI1-T4 model at
`docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json` (modelId:
`cvf-cross-corpus-index-model-ci1-t4`) is **not modified** by CI2-T3. All
NR-01 through NR-10 normalization rules in CI1-T4 remain authoritative.

CI2-T3 adds:

- Checker bindings for NR-04, NR-05, NR-11 via the `ci2CheckerBindings` block.
- Explicit `fieldClass` for every field (structural-required, optional,
  structural-required-when-alias, structural-required-when-deferred,
  domain-extension).
- `rawDisposition` and `dispositionAlias` as new NR-11 fields not present in
  CI1-T4.
- `applicabilityRule` for each CI2-T2 checker to prevent false positives on
  review/completion artifacts.

---

## Field Classification Glossary

### structural-required

Fields that must be present in every classification ledger row of an
applicable readiness packet. Absence is a structural gate violation.

### structural-required-when-alias

Fields required only when another trigger field is also present (e.g.,
`rawDisposition` is required whenever `dispositionAlias` is set).

### structural-required-when-deferred

Fields required only when a row's primary disposition triggers the alias rule
(e.g., `dispositionAlias: ACCEPT_DEFERRED` is required when `disposition` is
DEFER or ACCEPT_SUMMARY_ONLY).

### optional

Fields that may be omitted without a gate violation. Recommended for clarity
when the information is available.

### domain-extension

Vocabulary-declared fields for specialized corpus types (legal/policy,
internal company, technical project, legacy absorption). Not populated in
CI2-T3. Require a separate authorized wave to populate.

---

## Field Glossary and Enforcement Source Map

| Field | Class | Checker/Rule | Standard |
| --- | --- | --- | --- |
| `sourcePath` | structural-required | GC-050 (presence) | `CVF_CORPUS_INTELLIGENCE_READINESS_PACKET_TEMPLATE_2026-06-02.md` |
| `normalizedPath` | structural-required | NR-05 `check_corpus_packet_normalized_path.py` | `CVF_CORPUS_PATH_NORMALIZATION_ALGORITHM_STANDARD_2026-06-02.md` |
| `sourceHash` | structural-required | NR-04 `check_corpus_packet_source_hash.py` | `CVF_CORPUS_SOURCE_HASH_STANDARD_2026-06-02.md` |
| `sourceHashAlgorithm` | optional | NR-04 convention | `CVF_CORPUS_SOURCE_HASH_STANDARD_2026-06-02.md` |
| `disposition` | structural-required | GC-050 | `CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md` |
| `rawDisposition` | structural-required-when-alias | NR-11 `check_corpus_packet_disposition_canonical.py` | `CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md` |
| `dispositionAlias` | structural-required-when-deferred | NR-11 `check_corpus_packet_disposition_canonical.py` | `CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md` |
| `answerClass` | structural-required | GC-050 | `CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` |
| `evidencePointer` | structural-required | GC-050 | `CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` |
| `processingStatus` | structural-required | GC-050 | `CVF_CORPUS_INTELLIGENCE_READINESS_PACKET_TEMPLATE_2026-06-02.md` |
| `knowledgeRegion` | structural-required | GC-050 | `CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md` |
| `ownerSurface` | structural-required | NR-03 convention | `CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` |
| `sourceRoot` | structural-required | GC-051 (for registered packets) | `CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` |
| `sourceFamily` | structural-required | NR-10 convention | `CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` |
| `documentType` | structural-required | NR-01 / GC-050 presence | `CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` |
| `topicTags` | structural-required | NR-02 convention | `CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` |
| `sensitivity` | structural-required | NR-06 doc-only | `CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` |
| `freshnessStatus` | structural-required | editorial convention | `CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` |
| `freshnessCheckedAt` | optional | editorial convention | `CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` |

---

## CI2-T2 Checker Binding Summary

All three CI2-T2 checkers apply to markdown files in `docs/audits/` and
`docs/reviews/` that carry `docType: audit` in their header or
`READINESS_PACKET` in their filename. They explicitly skip `docType: review`
completion artifacts to prevent false positives.

| Checker | Enforces | Claim Boundary |
| --- | --- | --- |
| `check_corpus_packet_source_hash.py` (NR-04) | `sourceHash` presence/format | Structural gate only; not hash value accuracy |
| `check_corpus_packet_normalized_path.py` (NR-05) | `normalizedPath` canonical form | Structural gate only; not filesystem path resolution |
| `check_corpus_packet_disposition_canonical.py` (NR-11) | `dispositionAlias` + `rawDisposition` discipline | Structural alias gate only; not semantic disposition correctness |

All three checkers are wired into pre-commit, pre-push, pre-implementation,
and pre-closure autorun phases.

---

## NR-11 Alias Merge Rule

When a classification ledger row carries `disposition: DEFER` or
`disposition: ACCEPT_SUMMARY_ONLY`, it MUST also carry:

- `dispositionAlias: ACCEPT_DEFERRED` — canonical alias for cross-packet
  queries.
- `rawDisposition: DEFER` or `rawDisposition: ACCEPT_SUMMARY_ONLY` — the
  original author-assigned value for traceability.

This rule is defined in
`docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md`
and machine-checked by
`governance/compat/check_corpus_packet_disposition_canonical.py`.

---

## T4 → CI2 Field Mapping

CI1-T4 NR gaps resolved in CI2:

| CI1-T4 Rule | Gap Status in CI1-T4 | Resolution in CI2 |
| --- | --- | --- |
| NR-04 `sourceHash` | `DEFER_CI1-T6` (per-file hash not computed) | Standard authored (CI2-T1); checker implemented (CI2-T2) |
| NR-05 `normalizedPath` | `DEFER_CI1-T6` (per-file normalization not applied) | Standard authored (CSA1); checker implemented (CI2-T2) |
| NR-11 `dispositionAlias` | Not in CI1-T4 | New field added; standard updated; checker implemented (CI2-T2) |

CI1-T4 normalization rules NR-01 through NR-10 remain unchanged.
`CONTROL_PLANE_ADAPTERS` vocabulary addition (NR-03-vocab correction) from
CI1-T6 remains authoritative in CI1-T4.

---

## LPCI Input Contract Supplement

LPCI-T1 must consume both CI1-T4 and this CI2-T3 enforced model as typed
inputs per `docs/reference/CVF_CI1_T7_LPCI_INTAKE_BRIDGE_2026-06-02.md`.

CI2-T3 adds to the LPCI intake contract:

- NR-04/NR-05/NR-11 checker binding contracts (`ci2CheckerBindings`).
- Explicit field classification for readiness packet authoring.
- `rawDisposition` and `dispositionAlias` NR-11 vocabulary obligation.
- Checker applicability rules for new packet authoring.

LPCI implementation remains blocked until a separate governed LPCI product
roadmap is opened after CI2-T5 closes.

---

## Claim Boundary

CI2-T3 is a schema/contract artifact only.

This schema:

- **IS** authorized for: readiness packet authoring guidance, CI2-T4 pilot
  schema input, LPCI intake bridge supplementation, and future packet
  validation reference.
- **IS NOT** authorized for: runtime index population, vector database loading,
  embedding computation, live provider query execution, LPCI chatbot
  implementation, or public catalog claims.

No runtime retrieval index, embedding pipeline, vector database, query
execution surface, or LPCI chatbot is built or claimed by CI2-T3.

---

## Finding-To-Governance Learning Disposition

Defect class: `RULE_GAP` — NR-04, NR-05, NR-11 had no enforced index model
binding prior to CI2-T3

Learning lane: `GOVERNANCE_CONTROL_PLANE`

Disposition: `RULE_ADDED` — CI2-T3 enforced model binds NR-04/NR-05/NR-11
checkers and records explicit field classification contract for downstream
packet authoring

Next control action: `CLOSED` — model is wired as T4-pilot schema input
and LPCI intake supplement; checkers already active in autorun

Runtime/provider/cost learning: `N/A_WITH_REASON`

Reason: CI2-T3 is schema/documentation only; no provider calls, runtime
behavior changes, or cost events.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: internal governance control plane; enforced index model schema is a
provenance-workspace artifact that does not belong in the public CVF product
repository.

Public-sync boundary: no artifacts from this schema document are queued for
public-sync. The public CVF repository does not consume CI2 corpus intelligence
governance artifacts directly. Next public-sync action: none required.
