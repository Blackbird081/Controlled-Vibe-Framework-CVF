# CVF LPCI1-T1 Corpus Intake Specification

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-03

executionBaseHead: `a155f505`

## Purpose

Define the corpus intake specification for LPCI1. This document states the
corpus prerequisites, declares the NR-04 hash policy adoption, describes the
manifest format, and cites the three inherited gaps from CI2-T4 that LPCI must
carry forward.

This spec is an architecture planning artifact. It does not implement corpus
ingestion code. Runtime ingestion logic must be created in a separate work
order (T3 or later) after T1 architecture review closes.

---

## Source

| Authority | Path |
| --- | --- |
| LPCI1 GC-018 | `docs/baselines/CVF_GC018_LPCI1_LEGAL_POLICY_CORPUS_INTELLIGENCE_PRODUCT_MVP_2026-06-02.md` |
| NR-04 standard | `docs/reference/CVF_CORPUS_SOURCE_HASH_STANDARD_2026-06-02.md` |
| NR-05 standard | `docs/reference/CVF_CORPUS_PATH_NORMALIZATION_ALGORITHM_STANDARD_2026-06-02.md` |
| NR-11 standard | `docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md` |
| CI2-T4 pilot pack | `docs/corpus-intelligence/CVF_CI2_T4_PRODUCT_READINESS_PILOT_CORPUS_PACK.json` |
| CI1-T7 LPCI intake bridge | `docs/reference/CVF_CI1_T7_LPCI_INTAKE_BRIDGE_2026-06-02.md` |

---

## Scope

Applies to: all LPCI1 corpus intake tranches (T2 onwards), and to any operator
who prepares a legal/policy corpus for LPCI1 ingestion.

Out of scope: governance pilot corpus (`GOVERNANCE_PILOT_NO_LEGAL_CORPUS`);
the CI2-T4 pilot pack is schema proof only and does not require re-ingestion.

---

## Corpus Prerequisites

Before any LPCI1 corpus intake scan begins, the following prerequisites must
be satisfied by the operator:

| Prerequisite | Standard | Enforcement |
| --- | --- | --- |
| GC-051 corpus registration | `docs/reference/CVF_CORPUS_SCAN_REGISTRY_STANDARD_2026-06-02.md` | registry entry in `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` |
| Corpus completeness check (GC-047) | `docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md` | autorun gate per corpus |
| Knowledge-map reconciliation (GC-048) | `docs/reference/CVF_CORPUS_TO_KNOWLEDGE_MAP_RECONCILIATION_STANDARD_2026-06-01.md` | autorun gate per corpus |
| Corpus classification (GC-050) | `docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md` | autorun gate per corpus |
| Operator-authored manifest | see Manifest Format below | required before any intake run |

---

## NR-04 Hash Policy Adoption

**Adopted policy: per-file SHA-256 preferred; manifest proxy accepted with
documented exception.**

Per `docs/reference/CVF_CORPUS_SOURCE_HASH_STANDARD_2026-06-02.md`:

- **Preferred**: compute SHA-256 hash for each source file at intake time and
  record in the intake record `sourceHash` field.
- **Accepted proxy**: if the operator cannot compute per-file hashes (e.g.,
  corpus delivered as a pre-scanned archive), the operator must provide a
  signed manifest listing each file with at minimum filename and file size.
  The intake record must set `sourceHash: MANIFEST_PROXY` and record
  `manifestRef` pointing to the signed manifest path.
- **Forbidden**: omitting `sourceHash` entirely without a documented proxy is
  a BLOCK violation per `governance/compat/check_corpus_packet_source_hash.py`.

Reason for proxy allowance: consistent with CI2-T4 precedent
(`manifestHashProxy: true`, `manifestHashProxyException` documented) and
CI1-T7 intake bridge NR-04 guidance.

---

## NR-05 normalizedPath Adoption

**Adopted policy: CI2-T2 normalizedPath algorithm.**

Per `docs/reference/CVF_CORPUS_PATH_NORMALIZATION_ALGORITHM_STANDARD_2026-06-02.md`:

- All source file paths must be normalized using the CVF Corpus Path
  Normalization Algorithm before recording in the intake record.
- This algorithm is already structurally enforced by
  `governance/compat/check_corpus_packet_normalized_path.py`.
- LPCI intake adopts the same algorithm without modification.

---

## NR-11 dispositionAlias Adoption

**Adopted policy: preserve `rawDisposition`; add `dispositionAlias` per CI2-T2.**

Per `docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md`:

- `rawDisposition` must be preserved as-is from the classification step.
- `dispositionAlias: ACCEPT_DEFERRED` must be added for any row where
  `rawDisposition` is `DEFER` or `ACCEPT_SUMMARY_ONLY`.
- `dispositionAlias: ACCEPT` for all other accepted rows.
- Enforcement: `governance/compat/check_corpus_packet_disposition_canonical.py`.

---

## Inherited Gaps from CI2-T4 (must be addressed per tranche)

The CI2-T4 pilot pack carried the following known gaps that LPCI must handle:

| Gap ID | Field | CI2-T4 mitigation | LPCI obligation |
| --- | --- | --- | --- |
| G1 | `sourceHash` per-file | `manifestHashProxy: true` with exception note | LPCI real corpus intake must declare per-file SHA-256 or signed manifest proxy per NR-04 standard above |
| G2 | `ownerSurface` alias | CI2-T4 accepted `GOVERNANCE_PILOT` alias with NR-03 boundary | LPCI real corpus must use canonical `ownerSurface` enum values from CI2-T3 index model; pilot alias is not valid for legal corpus packets |
| G3 | `legalPolicy` domain fields | Intentionally absent in governance pilot (not a legal corpus) | LPCI T2 must populate all legalPolicy domain extension fields (`jurisdiction`, `authorityLevel`, `issuingBody`, `effectiveDate`, `status`, `documentType`) for every legal corpus intake record |

---

## Manifest Format

Operator-authored corpus manifest (JSON, no executable code):

```json
{
  "corpusId": "<GC-051 registered corpus ID>",
  "corpusRoot": "<absolute local path to corpus directory>",
  "manifestDate": "<ISO 8601 date>",
  "hashPolicy": "PER_FILE_SHA256 | MANIFEST_PROXY",
  "manifestProxyException": "<reason if hashPolicy is MANIFEST_PROXY>",
  "files": [
    {
      "relativePath": "<path relative to corpusRoot>",
      "documentType": "law | decree | circular | policy | notice | decision | SOP | contract | other",
      "jurisdiction": "<country/state/org>",
      "sha256": "<hex string | null if MANIFEST_PROXY>",
      "fileSizeBytes": <integer>,
      "effectiveDate": "<ISO 8601 date | null>",
      "status": "effective | draft | amended | superseded | repealed | obsolete | unknown"
    }
  ]
}
```

---

## Requirements

| Requirement | Applicable tranche |
| --- | --- |
| Per-file SHA-256 or documented manifest proxy (`sourceHash`) | T2 intake, all LPCI corpus packets |
| `normalizedPath` per NR-05 algorithm | T2 intake, all LPCI corpus packets |
| `dispositionAlias` added per NR-11 | T2 classification, all LPCI corpus packets |
| `legalPolicy` domain fields populated | T2 onwards with real legal corpus |
| Canonical `ownerSurface` enum (no pilot alias) | T2 onwards |
| GC-051 registration exists before scan | T2 scan trigger |
| GC-047/GC-048/GC-050 gates pass per corpus | T2 close gate |

---

## Enforcement

Governance checkers that enforce this spec at runtime:

| Checker | Gate |
| --- | --- |
| `governance/compat/check_corpus_packet_source_hash.py` | NR-04 per intake packet |
| `governance/compat/check_corpus_packet_normalized_path.py` | NR-05 per intake packet |
| `governance/compat/check_corpus_packet_disposition_canonical.py` | NR-11 per intake packet |
| `governance/compat/run_agent_autorun_workflow_gate.py` | full pre-implementation and pre-closure autorun |

---

## Claim Boundary

This document claims:

- corpus intake prerequisite rules, NR-04/NR-05/NR-11 adoption, inherited
  gap obligations, and manifest format for LPCI1 planning.

This document does NOT claim:

- runtime intake correctness or tested ingestion behavior;
- legal corpus completeness or currentness;
- production-quality corpus validation results.

---

## Verification

This document is verified by the T1 completion review:
`docs/reviews/CVF_LPCI1_T1_PRODUCT_INTAKE_AND_ARCHITECTURE_COMPLETION_2026-06-02.md`.

Runtime intake verification will be performed in the T2 classification
tranche after this architecture review closes.

---

## Related

- `docs/reference/CVF_LPCI1_T1_ARCHITECTURE_2026-06-02.md`
- `docs/baselines/CVF_GC018_LPCI1_T1_SUPPLEMENT_2026-06-02.md`
- `docs/reference/CVF_CORPUS_SOURCE_HASH_STANDARD_2026-06-02.md`
- `docs/reference/CVF_CORPUS_PATH_NORMALIZATION_ALGORITHM_STANDARD_2026-06-02.md`
- `docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md`
- `docs/corpus-intelligence/CVF_CI2_T4_PRODUCT_READINESS_PILOT_CORPUS_PACK.json`

---

## Finding-To-Governance Learning Disposition

Defect class: `RULE_GAP` — no LPCI1 corpus intake specification existed
before this tranche

Learning lane: `GOVERNANCE_CONTROL_PLANE`

Disposition: `RULE_ADDED` — LPCI1-T1 defines hash policy, normalizedPath
adoption, dispositionAlias adoption, and inherited-gap obligations for
all future LPCI corpus intake tranches

Next control action: `OPEN` — T2 domain classification enforces this spec

Runtime/provider/cost learning: `N/A_WITH_REASON`

Reason: architecture planning document only; no provider calls, runtime
changes, or cost events.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: spec references internal CI2 evidence and private pilot corpus data;
not suitable for public CVF repository at this stage.

Public-sync boundary: no artifacts from this batch are queued for public-sync.
