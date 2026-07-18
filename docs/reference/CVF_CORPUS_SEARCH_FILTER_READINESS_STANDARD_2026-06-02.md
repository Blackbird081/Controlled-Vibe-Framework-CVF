# CVF Corpus Search And Filter Readiness Standard

Memory class: FULL_RECORD

Status: canonical corpus search/filter readiness standard

docType: reference

Date: 2026-06-02

## Purpose

Define the CVF-wide discipline for making any bounded corpus searchable,
filterable, and reviewable before an agent claims deep scan coverage,
retrieval-readiness, chatbot-readiness, knowledge absorption, migration
coverage, or project intelligence.

This standard is intentionally broader than legal/policy chatbot work. It
applies to legacy folders, user project folders, public documentation,
internal company documents, source-code documentation, SOPs, policies,
knowledge bases, release records, and any other corpus that CVF may classify or
turn into a retrieval surface.

## Scope / Applies To

Apply this standard whenever an agent:

- scans a folder or archive to produce a searchable inventory;
- claims a corpus is ready for retrieval, classification, chatbot use, or
  knowledge-map work;
- filters project data by family, topic, authority, status, owner, sensitivity,
  freshness, or answer boundary;
- claims that a term, file family, topic, owner surface, or knowledge region was
  not found;
- builds a derived index, vector store, graph, manifest, retrieval cache, or
  answer receipt from source files.

This standard complements GC-047, GC-048, and GC-050:

- GC-047 proves the bounded source corpus and processing ledger.
- GC-048 proves corpus-to-knowledge-map reconciliation.
- GC-050 proves classification ledger discipline.
- This standard proves the corpus has search/filter metadata and negative
  search evidence sufficient for reviewable retrieval or scan claims.

## Core Rule

A corpus is not search/filter ready merely because files were listed or read.
It becomes search/filter ready when CVF can trace:

source file -> corpus discovery index -> processing ledger -> facet/index row
-> query or filter plan -> included/excluded candidate set -> evidence pointer
or abstention reason.

If a task only needs corpus completeness, GC-047 may be enough. If the output
will guide retrieval, chatbot answers, absorption decisions, migration choices,
owner-surface routing, or "not found" claims, this standard applies.

## Required Capabilities

| Capability | Required evidence | Why it matters |
| --- | --- | --- |
| Corpus discovery index | root, sourcePath, normalizedPath, sourceHash, extension, size, discoveredAt, gitTracked/ignored state, unreadable reason | catches hidden, ignored, unsupported, or drifted files |
| Family/topic facets | sourceFamily, familyId, topicTags, candidate owner surface, authority/source type | prevents folder-level summaries from hiding subtopics |
| Processing ledger | READ_DEEP, READ_SHALLOW, SKIPPED_WITH_REASON, DEFERRED, BLOCKED_UNREADABLE, DUPLICATE, STALE_SNAPSHOT | makes unfinished work explicit |
| Negative search evidence | searched terms, query variants, zero-result terms, excluded folders, rejected matches, reason | prevents unsupported "not found" claims |
| Derived view trace | manifest row -> map row -> classification row -> retrieval chunk/index row -> answer receipt | preserves rebuildability |
| Faceted retrieval schema | project/domain-specific fields plus common CVF fields | avoids ranking before filtering |
| Conflict/freshness model | effective, draft, amended, superseded, repealed, obsolete, stale, unknown | prevents old or conflicting files from appearing authoritative |
| Query receipt | query text, normalized query, filters, candidate set, excluded set, rank reasons, citations, answer boundary | makes search behavior auditable |
| Adversarial sampling | accepted, deferred, rejected, zero-result, high-risk, and random rows | catches semantic and coverage errors that structural checks miss |

## Common Facet Schema

Every project may add domain-specific fields, but the common CVF search/filter
index should start from:

| Field | Meaning |
| --- | --- |
| `sourcePath` | original source file or canonical imported path |
| `normalizedPath` | path normalized for stable matching |
| `sourceHash` | drift detection |
| `sourceRoot` | corpus root or import root |
| `sourceFamily` | folder family, import batch, document collection, or project module |
| `documentType` | doc, source, policy, notice, roadmap, review, spec, SOP, contract, other |
| `topicTags` | controlled or reviewer-approved tags |
| `knowledgeRegion` | GC-050 or project-specific knowledge region |
| `ownerSurface` | owner surface or consuming plane |
| `processingStatus` | processing state from the ledger |
| `disposition` | accept, summary-only, defer, reject, blocked |
| `evidencePointer` | section, line, paragraph, article, hash, or receipt |
| `sensitivity` | public, internal, confidential, restricted, unknown |
| `freshnessStatus` | current, stale, superseded, obsolete, unknown |
| `freshnessCheckedAt` | date/time of freshness check when applicable |
| `answerClass` | direct answer, summary, procedural guidance, abstain/escalate |

## Domain Extension Examples

Legal/policy corpora may add:

- `jurisdiction`
- `authorityLevel`
- `issuingBody`
- `effectiveDate`
- `amendmentStatus`
- `sourceAuthority`

Internal company corpora may add:

- `businessUnit`
- `policyOwner`
- `approvalBody`
- `effectiveAudience`
- `confidentialityLevel`

Technical/project corpora may add:

- `module`
- `runtimeSurface`
- `interfaceName`
- `symbol`
- `testCoverage`
- `migrationStatus`

Legacy absorption corpora may add:

- `legacyFamily`
- `absorbedBy`
- `absorptionStatus`
- `remainingValue`
- `blindSpotRisk`

## Search / Filter Readiness Block

Use this block in roadmaps, reviews, work orders, or completion packets when a
task claims search/filter readiness or depends on it:

```text
## Corpus Search And Filter Readiness

- Source corpus evidence: <GC-047 artifact or N/A with reason>
- Knowledge map evidence: <GC-048 artifact or N/A with reason>
- Discovery index: <path or inline summary>
- Facet schema: <common fields + domain extensions>
- Processing ledger: <path or inline summary>
- Negative search evidence: <queries/terms/exclusions or N/A with reason>
- Derived trace: <manifest -> map -> classification -> retrieval/answer trace>
- Query receipt model: <fields captured or N/A with reason>
- Adversarial sampling plan: <accepted/deferred/rejected/zero-result samples>
- Readiness verdict: SEARCH_FILTER_READY |
  SEARCH_FILTER_READY_WITH_DECLARED_GAPS | PARTIAL | BLOCKED
```

## Minimum Query Receipt

A reviewable query or filter operation should record:

- original query;
- normalized query;
- filters applied;
- candidate count before filters;
- candidate count after filters;
- excluded candidate count and reason classes;
- selected candidate IDs or paths;
- rank reasons;
- evidence pointers;
- answer boundary or abstention reason;
- timestamp and corpus snapshot/hash reference.

## Negative Search Evidence

Negative search evidence is required before claiming "no source", "not found",
"no matching folder", "no unabsorbed concept", or "no relevant value".

Minimum record:

- exact query terms and variants;
- roots searched;
- tools/commands used;
- filters/exclusions;
- zero-result terms;
- rejected matches and why they were rejected;
- unresolved ambiguity.

## Enforcement / Verification

This is currently a CVF standard, not a dedicated hard guard. It is enforceable
through review, work-order acceptance criteria, GC-047/GC-048/GC-050 evidence,
and future structural checker work if repeated defects justify machine
enforcement.

Recommended local verification for any implementation tranche:

```powershell
python governance/compat/check_corpus_completeness_report_integrity.py --base <baseHead> --head HEAD --enforce
python governance/compat/check_corpus_to_knowledge_map_reconciliation.py --base <baseHead> --head HEAD --enforce
python governance/compat/check_corpus_intelligence_classification.py --base <baseHead> --head HEAD --enforce
```

## Claim Boundary

This standard improves discoverability, traceability, filterability, and review
discipline. It does not prove semantic correctness, retrieval quality, legal
correctness, production readiness, or answer truth. Those require domain review,
adversarial sampling, and, where runtime behavior is claimed, live proof.
