# CVF LPCI Faceted Retrieval Schema

Memory class: FULL_RECORD

Status: canonical LPCI faceted retrieval schema

docType: reference

Date: 2026-06-04

schemaVersion: `policylocal.facetSchema.t7.v1`

authoredBy: LPCI2-T7 Corpus Facet Schema Authoring

closingGaps: T6-GAP-01, T6-GAP-02, T6-GAP-03, T6-GAP-07, T6-GAP-09

## Scope / Applies To

Applies to: any LPCI search/retrieval layer consuming the PolicyLocal pilot
corpus. Extends to future LPCI corpora using the VN_NATIONAL or compatible
domain extension. Required before any search layer opens per the Corpus Search
And Filter Readiness Standard.

## Purpose

Define the CVF LPCI faceted retrieval schema for the PolicyLocal pilot corpus.
This schema governs how a search layer filters, ranks, scopes, and traces
retrieval operations against the LPCI corpus. It is required before any search
layer opens per the Corpus Search And Filter Readiness Standard.

This schema covers:
1. Common CVF facet fields (from `CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD`)
2. PolicyLocal legal/policy domain extension fields
3. Freshness state machine (all 7 states + transition rules)
4. Conflict resolution rule for overlapping amended laws
5. `topicTags` controlled vocabulary for the VN_NATIONAL_ASSEMBLY_2025 corpus

## Authority Chain

| Authority | Path | Disposition |
| --- | --- | --- |
| CVF Search/Filter Readiness Standard | `docs/reference/CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` | ACCEPT |
| T6 gap register | `docs/reviews/CVF_LPCI2_T6_SEARCH_CHAT_READINESS_GATE_COMPLETION_2026-06-04.md` §Gap Register | ACCEPT |
| LPCI1-T2 domain classification spec | `docs/reference/CVF_LPCI1_T2_DOMAIN_CLASSIFICATION_SPEC_2026-06-03.md` | ACCEPT |
| T5 corpus records | `Policy_Local/data/generated/policylocal-corpus-records.json` schemaVersion t5.v1 | ACCEPT — source of domain values |

## 1. Common CVF Facet Fields

These fields are required on every corpus record that enters the LPCI retrieval
layer. They map directly to the §Common Facet Schema in the CVF Search/Filter
Readiness Standard.

| Field | Type | Description | Required |
| --- | --- | --- | --- |
| `sourcePath` | string | Original source file path | Yes |
| `normalizedPath` | string | Lowercase, forward-slash, stable path for matching | Yes |
| `sourceHash` | string | `sha256:<hex>` — drift detection anchor | Yes |
| `sourceRoot` | string | Corpus root or import root directory | Yes |
| `sourceFamily` | string | Family grouping for multi-file corpora (e.g. `VN_NATIONAL_ASSEMBLY_2025`) | Yes |
| `familyId` | string | Stable slug for the family (e.g. `vn-national-assembly-2025`) | Yes |
| `documentType` | string | One of: `law`, `decree`, `circular`, `resolution`, `policy`, `SOP`, `contract`, `other` | Yes |
| `topicTags` | string[] | Controlled topic tags — see §Controlled Vocabulary below | Yes |
| `knowledgeRegion` | string | GC-050 or project-specific knowledge region | Yes |
| `ownerSurface` | string | Owner surface or consuming plane | Yes |
| `processingStatus` | string | One of: `READ_DEEP`, `READ_SHALLOW`, `HASHED_ONLY`, `SKIPPED_WITH_REASON`, `DEFERRED`, `BLOCKED_UNREADABLE`, `DUPLICATE`, `STALE_SNAPSHOT` | Yes |
| `disposition` | string | One of: `ACCEPT_SUMMARY_ONLY`, `ACCEPT_DEFERRED`, `DEFER`, `REJECT`, `BLOCKED` | Yes |
| `evidencePointer` | string | Section, article, hash, or receipt reference | Yes |
| `sensitivity` | string | One of: `public`, `internal`, `confidential`, `restricted`, `unknown` | Yes |
| `freshnessStatus` | string | See §Freshness State Machine | Yes |
| `freshnessCheckedAt` | string | ISO-8601 date of freshness check | Yes |
| `answerClass` | string | One of: `DIRECT_CITED_ANSWER`, `SUMMARY_WITH_SOURCE`, `PROCEDURAL_GUIDANCE`, `ESCALATE_OR_ABSTAIN` | Yes |

## 2. PolicyLocal Domain Extension Fields

These fields extend the common schema for legal/policy corpora under
Vietnamese jurisdiction.

| Field | Type | Description | Required for VN_NATIONAL |
| --- | --- | --- | --- |
| `jurisdiction` | string | `VN_NATIONAL`, `VN_PROVINCIAL`, `VN_MUNICIPAL`, or `OTHER` | Yes |
| `authorityLevel` | string | `law`, `decree`, `circular`, `resolution`, `decision` | Yes |
| `issuingBody` | string | Issuing authority (e.g. `Quoc Hoi (National Assembly of Vietnam)`) | Yes |
| `effectiveDate` | string | ISO-8601 date when law takes effect; `unknown` if not found | Yes |
| `effectiveDateDisposition` | string | `FOUND_EFFECTIVE_CLAUSE`, `CONFIRMED_NOT_FOUND_FULL_BODY`, `INFERRED_FROM_HEADER`, `unknown` | Yes |
| `amendmentStatus` | string | `original`, `amended`, `superseded`, `repealed` | Yes |
| `sourceAuthority` | string | Full name of the authority that issued the document | Yes |
| `lawNumber` | string | Official law number (e.g. `116/2025/QH15`) | Recommended |
| `sessionNumber` | string | National Assembly session (e.g. `QH15`) | Recommended |
| `amendedLaws` | string[] | Law numbers this document amends or replaces | Recommended |

## 3. Freshness State Machine

Every corpus record must carry a `freshnessStatus` value derived from the
state machine below. The state is determined at import time and must be
re-evaluated when the corpus is rescanned or when the run date crosses a
transition boundary.

### States

| State | Meaning |
| --- | --- |
| `current` | Law is in force; effectiveDate ≤ run date; not superseded or repealed |
| `not_yet_in_force` | effectiveDate > run date; law has been passed but is not yet effective |
| `stale` | Law is in force but the corpus copy has not been rescanned in > 90 days |
| `superseded` | This version of the law has been replaced by a later amendment |
| `repealed` | Law has been formally repealed; no longer in force |
| `obsolete` | Law predates the applicable period and is no longer legally operative |
| `unknown` | effectiveDate could not be determined or freshness cannot be assessed |

### Transition Rules

```
INITIAL (any new record)
  → if effectiveDate == unknown        → unknown
  → if effectiveDate > run date        → not_yet_in_force
  → if effectiveDate ≤ run date
      → if later amendment exists      → superseded
      → if repeal record exists        → repealed
      → if rescan age > 90 days        → stale
      → else                           → current

not_yet_in_force
  → when run date ≥ effectiveDate      → re-evaluate as INITIAL (typically → current)

stale
  → when rescan completes              → re-evaluate as INITIAL
```

### PolicyLocal Corpus Application (2026-06-04)

Both corpus files have `effectiveDate=2026-07-01`. Run date is 2026-06-04.
Since `2026-07-01 > 2026-06-04`, both files enter state `not_yet_in_force`.

Expected transition: on or after 2026-07-01, if no later amendment or repeal
record is found, state transitions to `current`.

## 4. Conflict Resolution Rule

When two or more corpus files amend the same base law, the following rule
applies before retrieval:

1. **Prefer later effectiveDate**: the file with the later `effectiveDate`
   supersedes earlier amendments for the same base law.
2. **Both files are returned if effectiveDate is equal**: rank by recency
   of issuance (`lawNumber` higher sequence = preferred).
3. **Mark the earlier file `superseded`** in `freshnessStatus` once the later
   amendment is confirmed in force.
4. **Return both with ESCALATE_OR_ABSTAIN** if conflict cannot be resolved
   from document metadata alone — do not guess which amendment governs.

Current corpus (2026-06-04): Law 116/2025 amends cybersecurity law
(86/2015/QH13) and Law 148/2025 amends IT law (67/2006/QH11). These amend
different base laws — no conflict between the two current files. Rule applies
if a third file amending the same base law is added.

## 5. topicTags Controlled Vocabulary

### VN_NATIONAL_ASSEMBLY_2025 Family

The controlled vocabulary for this family is derived from document content
(law numbers, amendment scope, subject matter) — no provider inference.

| Tag | Meaning | Applicable files |
| --- | --- | --- |
| `cybersecurity` | Network information security, cyber threat, information system protection | 116_2025_QH15_666020.docx |
| `network-information-security` | Luật An toàn thông tin mạng — network/internet security regulation | 116_2025_QH15_666020.docx |
| `amendment-2025` | Law passed in 2025 National Assembly session amending prior legislation | both |
| `quoc-hoi-15` | Issued by the 15th National Assembly (QH15) | both |
| `information-technology` | IT law, software, digital infrastructure, technology regulation | 148_2025_QH15_675262.docx |
| `digital-law` | Luật Công nghệ thông tin — digital/IT law framework | 148_2025_QH15_675262.docx |
| `vn-national` | Vietnamese national-level legislation | both |
| `not-yet-in-force` | Law passed but effectiveDate not yet reached | both |

### Tag Assignment Rules

1. Tags are assigned from the controlled vocabulary above.
2. New tags may be added only when: (a) a new corpus family is registered, or
   (b) a document subject area is not covered by existing tags.
3. Tags must not be inferred from model memory — structural content derivation
   only (law number, title, amendment reference).
4. Minimum 2 tags per record; maximum 10 tags per record.

## 6. Schema Version

Schema version identifier: `policylocal.facetSchema.t7.v1`

This schema applies to:
- `policylocal-corpus-records.json` schemaVersion `policylocal.corpusRecords.t7.v1`
- Any future LPCI corpus imports using the PolicyLocal pipeline

## Claim Boundary

This schema defines governance fields and rules for the LPCI retrieval layer.
It does not claim search correctness, legal correctness, production readiness,
or AI-generated legal advice. It does not implement a search index or vector
store — those are T8 scope.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY — references private corpus content and internal LPCI
governance chain. A sanitized version may be published after legal review.
