# CVF LPCI2-T3 PolicyLocal Production Corpus Pilot Plan

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-03

executionBaseHead: `6f1f6a95`

## Purpose

Define the first production-corpus pilot for PolicyLocal without pretending
that a real legal/policy corpus has already been imported.

The plan turns the local folder
`D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\` into a
registered drop-zone with strict import, classification, search, retrieval, and
sampling gates.

## Scope / Applies To

Applies to: future PolicyLocal corpus import, legal/policy document
classification, local search/filter index construction, citation-first
retrieval, and chatbot readiness checks.

Owner surface: LPCI product surface; CVF corpus intelligence plane; PolicyLocal
local workspace.

## Pilot Corpus Registration

| Field | Value |
| --- | --- |
| GC-051 id | `policylocal-production-corpus-dropzone` |
| corpusType | `POLICY_DOCUMENT` |
| displayName | `PolicyLocal Production Corpus Drop-Zone` |
| scopePath | `D:/UNG DUNG AI/TOOL AI 2026/CVF-Workspace/Policy_Local/data_input/` |
| productionUse | `true` |
| language | `vi` by default; override per document when source differs |
| jurisdiction | operator-selected per document |
| current fileCount | `0` |
| current status | `NOT_STARTED` |

The drop-zone currently contains no production corpus files. This is a planning
registration, not a scan result.

T4S update: the operator renamed the local-first folder to `data_input` and
added the first DOCX file. This plan remains the release contract; the active
GC-051 path is now `Policy_Local/data_input/`.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| GC-051 registration must precede ingestion | `docs/reference/CVF_LPCI1_T7_TEMPLATE_PACKAGING_SPEC_2026-06-03.md` | Adoption Steps | GC-051 corpus registration | LPCI1 T7 packaging | ACCEPT |
| Per-document intake needs sourceHash and normalizedPath | `docs/reference/CVF_LPCI1_T1_CORPUS_INTAKE_SPEC_2026-06-02.md` | Source Hash Policy; NR-05 normalizedPath Adoption | sourceHash | LPCI1 T1 intake | ACCEPT |
| Legal/policy classification needs domain fields | `docs/reference/CVF_LPCI1_T2_DOMAIN_CLASSIFICATION_SPEC_2026-06-03.md` | Classification Fields | documentType | LPCI1 T2 classification | ACCEPT |
| Search/filter index consumes normalizedPath and sourceHash | `docs/reference/CVF_LPCI1_T3_SEARCH_FILTER_INDEX_SPEC_2026-06-03.md` | Index Record Schema | normalizedPath | LPCI1 T3 index | ACCEPT |
| Retrieval boundary constrains answer classes | `docs/reference/CVF_LPCI1_T4_RETRIEVAL_BOUNDARY_SPEC_2026-06-03.md` | Answer Assembly Rules | ESCALATE_OR_ABSTAIN | LPCI1 T4 retrieval | ACCEPT |

## Intake Field Contract

Every real production document imported after T3 must produce a row with:

| Field | Rule |
| --- | --- |
| `sourcePath` | absolute or workspace-relative source path under registered drop-zone |
| `normalizedPath` | NR-05 canonical path, UTF-8 NFC for Vietnamese path components |
| `sourceHash` | per-file SHA-256 of raw bytes, or explicit manifest proxy exception |
| `sourceHashAlgorithm` | `sha256` when per-file hash exists |
| `documentType` | law, decree, circular, policy, notice, decision, SOP, contract, implementation_guide, or other |
| `jurisdiction` | international, national, provincial, municipal, organizational, departmental, contractual, or unknown |
| `authorityLevel` | source-backed authority tier; cannot be guessed from filename alone |
| `issuingBody` | source-backed issuer or `unknown` with reason |
| `effectiveDate` | ISO 8601 date or `unknown` with reason |
| `status` | effective, draft, amended, superseded, repealed, obsolete, or unknown |
| `sensitivityLevel` | public, restricted, confidential, classified, or unknown |
| `rawDisposition` | ACCEPT, ACCEPT_SUMMARY_ONLY, DEFER, REJECT, or BLOCKED |
| `dispositionAlias` | canonical NR-11 merge result |
| `answerClass` | DIRECT_CITED_ANSWER, SUMMARY_WITH_SOURCE, PROCEDURAL_GUIDANCE, or ESCALATE_OR_ABSTAIN |
| `evidencePointer` | article/section/page/excerpt pointer plus sourceHash |

## Import Gate

Before any PolicyLocal runtime can query this corpus:

1. Enumerate all files under the registered drop-zone with hidden-file and
   ignored-file visibility appropriate to the workspace.
2. Reject files outside the registered scope.
3. Compute per-file SHA-256 before text extraction.
4. Generate `normalizedPath` using NR-05 plus Vietnamese NFC handling.
5. Extract text with provenance notes for PDF/OCR/conversion steps.
6. Classify every file against LPCI1-T2 domain rules.
7. Run GC-047 and GC-050 structural gates on the produced packet.
8. Produce a readiness packet and completion review before any chat runtime.

## Search And Filter Readiness

The first runtime tranche must implement search/filter in this order:

1. jurisdiction and corpus selector;
2. documentType and authorityLevel filters;
3. effectiveDate/status/freshness filters;
4. answerClass post-filter;
5. text search with Vietnamese NFC normalization;
6. negative receipt when no eligible source remains.

The system must never upgrade `ESCALATE_OR_ABSTAIN` or `SUMMARY_WITH_SOURCE`
into `DIRECT_CITED_ANSWER` during query assembly.

## Sampling Plan

After import and before chat:

| Sample class | Minimum sample |
| --- | --- |
| Direct-citation candidates | 5 rows or all rows if fewer than 5 |
| Summary-only/deferred rows | 5 rows or all rows if fewer than 5 |
| Freshness-sensitive rows | all amended, superseded, repealed, or unknown-status rows up to 10 |
| Vietnamese path/text rows | 5 rows with diacritics when available |
| Negative-search probes | 5 queries expected to abstain |

Each sample must compare source text, normalizedPath, sourceHash, disposition,
answerClass, and the emitted receipt boundary.

## T4 Release Conditions

LPCI2-T4 may begin only when one of these is true:

| Release path | Condition |
| --- | --- |
| Import-first T4 | operator supplies real files in the registered drop-zone and T4 includes import/hash/classification/search receipt gates |
| Scaffold-only T4 | T4 explicitly excludes production corpus and chat answers, and only builds static app shell or local adapter skeleton |

Any broader chatbot runtime remains blocked until a later import tranche proves
real corpus enumeration, sourceHash, normalizedPath, classification, search, and
retrieval receipt evidence.

## Claim Boundary

This plan claims that the first PolicyLocal production drop-zone is registered
and that future import/runtime work has a concrete field, sampling, and release
contract.

It does not claim any real corpus has been imported, classified, indexed, or
queried. It does not claim legal answer correctness, current-law status,
production readiness, hosted readiness, provider proof, or public export.

## Finding-To-Governance Learning Disposition

Defect class: `RULE_GAP` - after T2A, PolicyLocal had a clean prototype schema
but no registered production corpus boundary for future runtime work.

Learning lane: `GOVERNANCE_CONTROL_PLANE`

Disposition: `RULE_ADDED` - T3 registers the production drop-zone and defines
the import/search/sampling release conditions.

Next control action: `CLOSED` for T3 planning; open a bounded T4 import-first
or scaffold-only work order based on whether real corpus files exist.

Runtime/provider/cost learning: `N/A_WITH_REASON`

Reason: T3 is planning and registry preparation only; no provider or runtime
execution occurs.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this plan references a private local workspace path and does not create
a public product artifact.
