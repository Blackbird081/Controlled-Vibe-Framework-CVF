# CVF Corpus Intelligence Readiness Packet Template

Memory class: POINTER_RECORD

Status: ACTIVE_TEMPLATE

docType: reference

Date: 2026-06-02

Authority: `docs/baselines/CVF_GC018_CI1_CORPUS_INTELLIGENCE_OPERATIONALIZATION_2026-06-02.md`

## Purpose

This template defines the required sections a worker must fill before CVF claims
deep scan coverage, retrieval readiness, chatbot readiness, knowledge absorption,
or project intelligence for any bounded corpus.

Apply this template to:

- legacy folder rescans (`LHW-RESCAN-*` pattern);
- user project corpus scans;
- internal policy or company document corpora;
- source-code documentation corpora;
- any corpus that will feed a retrieval surface, chatbot, or advisory agent.

Do not begin a broad corpus scan until this packet is initialized and its corpus
boundary section is reviewed.

## Scope / Target / Owner Boundary

Owner surface: CVF corpus intelligence operating workflow. This template is
consumed by agents, workers, and orchestrators preparing corpus scans and
readiness claims. It does not own corpus content, domain judgment, or semantic
classification decisions.

Target: any bounded document corpus that CVF will inventory, classify, map, or
prepare for retrieval.

Boundary: this template governs structural evidence discipline only. Semantic
correctness, domain authority, and runtime behavior remain outside this
template's scope.

## Scope / Applies To

Apply this template whenever a CVF agent or work order:

- scans a folder or archive to produce a searchable inventory;
- claims a corpus is ready for retrieval, classification, chatbot use, or
  knowledge-map work;
- filters project data by family, topic, authority, status, owner, sensitivity,
  freshness, or answer boundary;
- claims that a term, file family, topic, owner surface, or knowledge region was
  not found;
- builds a derived index, vector store, graph, manifest, retrieval cache, or
  answer receipt from source files.

This template is corpus-type agnostic. It applies equally to CVF legacy
absorption rescans, legal/policy document corpora, internal company document
sets, source-code documentation, and any other bounded corpus.


## How To Use This Template

1. Copy this file to a task-specific path under `docs/audits/` named for the
   corpus (e.g., `CVF_RESCAN_D_GRAPHIFY_CORPUS_READINESS_PACKET_<date>.md`).
   Completion reviews belong under `docs/reviews/`; filled readiness packets do
   not.
2. Replace every `<placeholder>` with actual values.
3. Fill required evidence blocks in order: GC-047 → GC-048 → Search/Filter
   Readiness → GC-050.
4. Run required gates before claiming any readiness verdict.
5. Return the packet to the orchestrator or reviewer before continuing to scan.

Section headings marked `[REQUIRED]` must be present in the filled packet.
Section headings marked `[REQUIRED IF APPLICABLE]` must be present when the
stated condition applies. Do not delete required sections; fill them with
`N/A with reason` if they genuinely do not apply.

### Packet Identity Rule

Every new filled corpus intelligence readiness packet MUST use:

- path prefix: `docs/audits/`
- filename marker: `READINESS_PACKET`
- `docType: audit`

`docType: baseline` is allowed only for historical packet artifacts created
before this rule was clarified. New workers must not use `docType: baseline`
for readiness packets. Completion reviews, reviewer notes, and closure packets
must use `docType: review` and must not be named as readiness packets.

The packet-normalization guards are backward-compatible with historical
`READINESS_PACKET` files, but new packet authoring is governed by this stricter
identity rule.

## Claim Boundary For This Template

This template only creates structure. A filled packet that passes all gates still
does not prove semantic correctness, retrieval quality, legal correctness,
production readiness, or hosted readiness. Those require domain review,
adversarial sampling, and, where runtime behavior is claimed, live proof.

---

## [REQUIRED] 1. Corpus Boundary

### 1.1 Corpus Identity

- Packet path: `<docs/audits/...READINESS_PACKET_<date>.md>`
- Packet `docType`: `audit`
- Corpus name: `<short human-readable name>`
- Corpus root path(s): `<absolute or repo-relative path(s)>`
- Corpus description: `<one paragraph: what documents are in scope>`
- Corpus owner surface(s): `<e.g., LEGAL_ADVISORY | PRIVATE_PROVENANCE | OTHER>`
- Task class: `KNOWLEDGE_ABSORPTION | REPORT | INVENTORY | RETRIEVAL_READINESS |
  CHATBOT_READINESS | OTHER`

### 1.2 Corpus Boundary Constraints

- Included scope: `<explicit folder/file patterns>`
- Excluded scope: `<explicit exclusions with reasons>`
- Sensitivity class: `<public | internal | confidential | restricted | unknown>`
- Authorization artifact: `<GC-018 path or operator instruction date and summary>`

### 1.3 Snapshot Reference

- Snapshot time: `<timestamp of filesystem enumeration>`
- Repository HEAD at snapshot: `<git rev-parse --short HEAD output>`
- Drift risk: `<LOW | MEDIUM | HIGH — reason if not LOW>`

---

## [REQUIRED] 2. Source Corpus Evidence (GC-047)

Fill using the canonical evidence block from
`docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md`.

### Corpus Completeness And Report Integrity

- Corpus task class: `<INVENTORY | REPORT | EXTRACTION | COMPARISON | AUDIT |
  MIGRATION | KNOWLEDGE_ABSORPTION | OTHER>`
- Corpus root: `<path or explicit bounded list>`
- Snapshot time: `<timestamp>`
- Enumeration command: `<exact shell command — must include --hidden and
  --no-ignore if using rg, or equivalent filesystem-complete method>`
- Manifest artifact or inline manifest: `<path or inline table>`
- Manifest hash: `<hash or N/A with reason>`
- Processing ledger artifact or inline ledger: `<path or inline table>`
- Allowed terminal statuses: `READ | SKIPPED_WITH_REASON | DEFERRED |
  BLOCKED_UNREADABLE`
- Reconciliation: `manifest=<N>; ledger_terminal=<N>; exclusions=<N>;
  unresolved=<N>`
- Unresolved files: `<0 or explicit paths>`
- Declared exclusions: `<none or paths + reasons>`
- Unreadable or unsupported files: `<none or paths + reasons>`
- Aggregation check: `<PASS or bounded reason>`
- Drift check: `<PASS, STALE_SNAPSHOT, or N/A with reason>`
- Output traceability: `<source locator evidence>`
- Adversarial verification: `<sample/recompute evidence or N/A with reason>`
- Corpus verdict: `COMPLETE_VERIFIED | COMPLETE_WITH_DECLARED_EXCLUSIONS |
  PARTIAL | BLOCKED | STALE_SNAPSHOT`

### 2.1 Filesystem Discovery Index

Paste or link raw enumeration output. Self-reported counts without shell output
are not valid evidence (per GC-047 Gate 1 and Blind-Spot Gate 1 rule).

```text
<paste raw Get-ChildItem or equivalent shell enumeration output here>
```

- Total subfolders: `<N from shell output>`
- Total visible files: `<N from shell output>`
- Files by extension (top 5): `<extension: N, ...>`
- Ignored or hidden items detected: `<YES/NO — if YES, list>`

### 2.2 Processing Ledger Summary

| sourcePath | processingStatus | parser/tool | extractedFact | disposition | notes |
| --- | --- | --- | --- | --- | --- |
| `<path>` | `READ` | `<tool>` | `<key fact or NO_NEW_VALUE>` | `ACCEPT` | |
| `<path>` | `SKIPPED_WITH_REASON` | `N/A` | `N/A` | `SKIPPED` | `<reason>` |
| `<path>` | `DEFERRED` | `N/A` | `N/A` | `DEFER` | `<follow-up lane>` |
| `<path>` | `BLOCKED_UNREADABLE` | `N/A` | `N/A` | `BLOCKED` | `<reason>` |

---

## [REQUIRED] 3. Knowledge-Map Reconciliation (GC-048)

Fill using the canonical evidence block from
`docs/reference/CVF_CORPUS_TO_KNOWLEDGE_MAP_RECONCILIATION_STANDARD_2026-06-01.md`.

### Knowledge System Reconciliation

- Knowledge task class: `<ARCHITECTURE_MAP | SEMANTIC_REGION_MAP |
  MEMORY_SYNTHESIS | GRAPHIFICATION | RETRIEVAL_READINESS | CORPUS_ABSORPTION |
  OTHER>`
- Source manifest: `<path or inline manifest>`
- Source manifest hash: `<hash or N/A with reason>`
- Enumeration safety: `<filesystem-backed command or structured complete API
  evidence>`
- Intake registry or ledger: `<path or inline ledger>`
- Authority assets: `<N source-backed assets or ledger evidence>`
- Derived views: `<graph, regions, Palace, summary, cache, snapshot, or N/A with
  reason>`
- Semantic region ledger: `<path or inline ledger>`
- Region reconciliation: `assets=<N>; mapped=<N>; deferred=<N>; unmapped=<N>`
- Orphan or unmapped assets: `<none or explicit paths>`
- Cross-region links: `<evidence or N/A with reason>`
- Drift check: `<PASS, STALE_MAP, or N/A with reason>`
- Rebuildability check: `<PASS or bounded reason>`
- Retrieval boundary: `<bounded capability and deeper-review lane>`
- Adversarial verification: `<recomputed totals and challenged risks>`
- Knowledge-map verdict: `RECONCILED_VERIFIED | RECONCILED_WITH_DECLARED_GAPS |
  PARTIAL | BLOCKED | STALE_MAP`

### 3.1 Semantic Region Ledger

| semanticRegion | mappedAssets | deferredAssets | unmappedAssets | notes |
| --- | --- | --- | --- | --- |
| `<region name>` | `<N>` | `<N>` | `0` | |

---

## [REQUIRED] 4. Corpus Search And Filter Readiness

Fill using the canonical block from
`docs/reference/CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md`.

### Corpus Search And Filter Readiness

- Source corpus evidence: `<GC-047 artifact path or N/A with reason>`
- Knowledge map evidence: `<GC-048 artifact path or N/A with reason>`
- Discovery index: `<path or inline summary>`
- Facet schema: `<list common fields + domain extensions in use>`
- Processing ledger: `<path or inline summary>`
- Negative search evidence: `<queries/terms/exclusions or N/A with reason>`
- Derived trace: `<manifest → map → classification → retrieval/answer trace>`
- Query receipt model: `<fields captured or N/A with reason>`
- Adversarial sampling plan: `<accepted/deferred/rejected/zero-result samples>`
- Readiness verdict: `SEARCH_FILTER_READY | SEARCH_FILTER_READY_WITH_DECLARED_GAPS
  | PARTIAL | BLOCKED`

### 4.1 Common Facet Schema

Every row in the discovery index should carry these fields. Add domain extensions
in section 4.2.

| Field | Value class | Notes |
| --- | --- | --- |
| `sourcePath` | string | original source file path |
| `normalizedPath` | string | path normalized for stable matching |
| `sourceHash` | string | SHA-256 or equivalent |
| `sourceRoot` | string | corpus root |
| `sourceFamily` | string | folder family or import batch |
| `documentType` | enum | doc, source, policy, notice, roadmap, review, spec, SOP, contract, other |
| `topicTags` | list | controlled or reviewer-approved tags |
| `knowledgeRegion` | enum | GC-050 region or project-specific |
| `ownerSurface` | enum | from GC-050 owner surfaces |
| `processingStatus` | enum | READ_DEEP / READ_SHALLOW / SKIPPED_WITH_REASON / DEFERRED / BLOCKED_UNREADABLE |
| `disposition` | enum | accept / summary-only / defer / reject / blocked |
| `evidencePointer` | string | section, line, paragraph, article, hash, or receipt |
| `sensitivity` | enum | public / internal / confidential / restricted / unknown |
| `freshnessStatus` | enum | current / stale / superseded / obsolete / unknown |
| `freshnessCheckedAt` | timestamp | when checked |
| `answerClass` | enum | DIRECT_CITED_ANSWER / SUMMARY_WITH_SOURCE / PROCEDURAL_GUIDANCE / ESCALATE_OR_ABSTAIN |
| `primaryLanguage` | string | ISO 639-1 code, e.g. `vi`, `en` (optional) |
| `secondaryLanguages` | list | ISO 639-1 codes for non-primary languages (optional) |

### 4.2 Domain Extensions

`[REQUIRED IF APPLICABLE]` — fill if this corpus type applies:

**Legal / policy corpora** (if `Legal/policy corpus: YES`):

| Field | Notes |
| --- | --- |
| `jurisdiction` | legal jurisdiction or N/A |
| `authorityLevel` | statute / decree / circular / guideline / policy / other |
| `issuingBody` | issuing authority |
| `effectiveDate` | effective date or date range |
| `amendmentStatus` | original / amended / repealed / consolidated / unknown |
| `sourceAuthority` | canonical source document path or URL |

**Internal company corpora**:

| Field | Notes |
| --- | --- |
| `businessUnit` | owning unit |
| `policyOwner` | responsible person or team |
| `approvalBody` | who approved this document |
| `effectiveAudience` | target audience |
| `confidentialityLevel` | public / internal / confidential / restricted |

**Technical / project corpora**:

| Field | Notes |
| --- | --- |
| `module` | module or package name |
| `runtimeSurface` | route / CLI / MCP / SDK / other |
| `interfaceName` | owning interface or class |
| `symbol` | function, type, or key symbol |
| `testCoverage` | PASS / FAIL / MISSING / N/A |
| `migrationStatus` | current / legacy / deprecated / migrated |

**Legacy absorption corpora**:

| Field | Notes |
| --- | --- |
| `legacyFamily` | legacy root folder or batch name |
| `absorbedBy` | work order or tranche that absorbed this file |
| `absorptionStatus` | ABSORBED / PARTIALLY_ABSORBED / DEFERRED / REJECTED |
| `remainingValue` | HIGH / MEDIUM / LOW / NONE |
| `blindSpotRisk` | HIGH / MEDIUM / LOW |

### 4.3 Conflict And Freshness Model

| Status | Meaning |
| --- | --- |
| `effective` | Current and binding |
| `draft` | Not yet effective |
| `amended` | Modified from original; use latest amended version |
| `superseded` | Replaced by a later document |
| `repealed` | No longer in force |
| `obsolete` | Outdated but not formally repealed |
| `stale` | Corpus snapshot is older than a meaningful change period |
| `unknown` | Freshness not yet verified |

### 4.4 NR-04 Source Hash Rule

Every row in the classification ledger MUST include a non-empty `sourceHash`
field (SHA-256 of source file byte content, hex-encoded lowercase), OR the
packet MUST declare `manifestHashProxy: true` at packet level with a non-empty
`manifestProxyException` string.

**`sourceHash`** — SHA-256 of the raw byte content of the source file, hex-
encoded, lowercase. Proves per-file drift resistance between scan time and
retrieval or ingestion time.

**`sourceHashAlgorithm`** — companion field recording the hash algorithm used.
Default value: `"sha256"`. Include this field when using a non-default
algorithm. When omitted, reviewers assume SHA-256 for packets produced under
this standard.

**`manifestProxyException`** — required when `manifestHashProxy: true`. Must be
a human-readable string naming both the reason per-file hashes are unavailable
AND the coverage limitation (manifest hash covers the manifest file only, not
individual file content). A bare reason without the coverage limitation does not
satisfy this rule.

Canonical rule: `docs/reference/CVF_CORPUS_SOURCE_HASH_STANDARD_2026-06-02.md`

### 4.5 NR-06 Sensitivity Rule

Corpora with uniform sensitivity classification across all files may declare
sensitivity at corpus level by setting `uniformSensitivity: true` in the packet
header. In this case, per-row `sensitivity` field in the classification ledger
may be omitted.

Corpora with mixed sensitivity (different files have different sensitivity
levels) MUST provide a per-row `sensitivity` field in the classification ledger.
Omitting per-row sensitivity on a mixed-sensitivity corpus is not permitted.

When in doubt about whether sensitivity is uniform, treat the corpus as
mixed-sensitivity and record per-row values.

### 4.6 NR-11 Disposition Alias Rule

When a classification ledger row uses `DEFER` or `ACCEPT_SUMMARY_ONLY` to mean
bounded acceptance with deferred implementation, the row MUST include:

- `rawDisposition` — the original row value (`DEFER` or `ACCEPT_SUMMARY_ONLY`);
- `dispositionAlias` — the canonical cross-packet value `ACCEPT_DEFERRED`.

Rows with `ACCEPT`, `REJECT`, `BLOCKED_SOURCE_NOT_FOUND`, or
`BLOCKED_UNREADABLE` do not need `dispositionAlias` unless a future standard
explicitly defines one.

Canonical rule:
`docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md`

---

## [REQUIRED] 5. Negative Search Evidence

`[REQUIRED]` — Must be filled before any "not found", "no source", "no
matching folder", "no relevant value", or "no unabsorbed concept" claim.

Machine gates do not verify this section; reviewer and adversarial sampling do.

### 5.1 Zero-Result Terms

| Query term / variant | Roots searched | Tool / command used | Filters / exclusions | Result | Rejected matches | Unresolved ambiguity |
| --- | --- | --- | --- | --- | --- | --- |
| `<term>` | `<root>` | `<command>` | `<none>` | ZERO_RESULT | `<none>` | `<none>` |
| `<term>` | `<root>` | `<command>` | `<pattern excluded>` | ZERO_RESULT | `<path: reason>` | `<ambiguous match: TBD>` |

### 5.2 Excluded Folders And Files

| Excluded path | Reason for exclusion |
| --- | --- |
| `<path>` | `<reason>` |

---

## [REQUIRED] 6. Derived Trace

Trace the full path from source file to any downstream artifact that claims to
represent it. This preserves rebuildability.

### 6.1 Trace Table

| Manifest row | Map row | Classification row | Retrieval / index row | Answer receipt | Notes |
| --- | --- | --- | --- | --- | --- |
| `<sourcePath>` | `<semantic region>` | `<ledger row>` | `<index or chunk ID>` | `<receipt ID or N/A>` | |

### 6.2 Rebuildability Statement

`<State whether each derived view (graph, index, summary, retrieval cache) can
be rebuilt from the governed authority assets. Name any views that cannot be
rebuilt and the reason.>`

---

## [REQUIRED] 7. Query Receipt Model

Fill when the corpus will be queried or used for retrieval, chatbot, or
advisory answers.

### 7.1 Minimum Query Receipt Fields

Each query or filter operation against this corpus should record:

| Field | Filled |
| --- | --- |
| Original query | `<yes / no>` |
| Normalized query | `<yes / no>` |
| Filters applied | `<yes / no>` |
| Candidate count before filters | `<yes / no>` |
| Candidate count after filters | `<yes / no>` |
| Excluded candidate count and reason classes | `<yes / no>` |
| Selected candidate IDs or paths | `<yes / no>` |
| Rank reasons | `<yes / no>` |
| Evidence pointers | `<yes / no>` |
| Answer boundary or abstention reason | `<yes / no>` |
| Timestamp and corpus snapshot hash | `<yes / no>` |

### 7.2 Sample Query Receipt

```text
Query: <original query>
Normalized: <normalized query>
Filters: <filter list>
Candidates before filters: <N>
Candidates after filters: <N>
Excluded: <N> (<reason class>)
Selected: <ID or path list>
Rank reasons: <reason list>
Evidence pointers: <section/line/hash list>
Answer boundary: <DIRECT_CITED_ANSWER | SUMMARY_WITH_SOURCE |
  PROCEDURAL_GUIDANCE | ESCALATE_OR_ABSTAIN>
Abstention reason: <if ESCALATE_OR_ABSTAIN>
Corpus snapshot hash: <manifest hash>
Timestamp: <ISO-8601>
```

---

## [REQUIRED] 8. Adversarial Sampling Plan

Semantic correctness is **not** proven by structural machine checks. This section
requires the worker or reviewer to manually verify a representative sample before
claiming scan or retrieval coverage.

### 8.1 Sample Categories

| Category | Required minimum | Actual count | Status |
| --- | --- | --- | --- |
| Accepted rows (randomly selected) | 3 | `<N>` | `<done / pending>` |
| Deferred rows (random selection) | 2 | `<N>` | `<done / pending>` |
| Rejected rows (document why rejected) | 2 | `<N>` | `<done / pending>` |
| Zero-result queries (verify genuinely absent) | 2 | `<N>` | `<done / pending>` |
| High-risk rows (potential authority confusion) | 2 | `<N>` | `<done / pending>` |

### 8.2 Adversarial Sample Records

`[REQUIRED]` — Minimum 5 rows total across all categories.

| sampleId | category | sourcePath | query | expectedBehavior | actualBehavior | verdict | notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | ACCEPTED | `<path>` | `<query>` | `<expected answer>` | `<actual result>` | `PASS / FAIL` | |
| S2 | DEFERRED | `<path>` | `<query>` | `ESCALATE_OR_ABSTAIN` | `<actual result>` | `PASS / FAIL` | |
| S3 | REJECTED | `<path>` | `<query>` | `BLOCKED` | `<actual result>` | `PASS / FAIL` | |
| S4 | ZERO_RESULT | `<query>` | `N/A` | `ZERO_RESULT` | `<actual result>` | `PASS / FAIL` | |
| S5 | HIGH_RISK | `<path>` | `<query>` | `ESCALATE_OR_ABSTAIN` | `<actual result>` | `PASS / FAIL` | |

### 8.3 Adversarial Sampling Verdict

`<PASSED_SAMPLING | FAILED_SAMPLING | PARTIAL_SAMPLING_N_OF_M | NOT_YET_RUN>`

Semantic correctness remains review work. This sampling plan does not replace
domain expert review for high-stakes corpora.

---

## [REQUIRED] 9. Corpus Intelligence Classification (GC-050)

Fill using the canonical evidence block from
`docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md`.

### Corpus Intelligence Classification

- Classification task class: `LEGAL_POLICY_QA | INTERNAL_DECISION_QA |
  COMPANY_NOTICE_QA | TECHNICAL_QA | GOVERNANCE_QA | MIXED_CORPUS | OTHER`
- Source corpus evidence: `<GC-047 manifest/report path or N/A with reason>`
- Knowledge map evidence: `<GC-048 reconciliation path or N/A with reason>`
- Classification ledger: `<inline table below or artifact path>`
- Legal/policy corpus: `YES | NO`
- Domain fields: `<jurisdiction, authorityLevel, effectiveDate, sourceAuthority,
  answerBoundary — or N/A with reason>`
- Response Boundary: DIRECT_CITED_ANSWER | SUMMARY_WITH_SOURCE | PROCEDURAL_GUIDANCE | ESCALATE_OR_ABSTAIN (fill applicable value)
- Adversarial sampling plan: `<see Section 8 or N/A with reason>`
- Classification verdict: `CLASSIFIED_STRUCTURAL_PASS |
  CLASSIFIED_WITH_DECLARED_GAPS | PARTIAL | BLOCKED`

### Corpus Intelligence Classification Ledger

| sourcePath | normalizedPath | sourceHash | sourceHashAlgorithm | processingStatus | knowledgeRegion | ownerSurface | disposition | rawDisposition | dispositionAlias | evidencePointer | answerClass | domainFields |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fill-source-path | fill-normalized-path | fill-sha256 | sha256 | READ_DEEP | GOVERNANCE | PRIVATE_PROVENANCE | ACCEPT | ACCEPT | N/A | section/line | SUMMARY_WITH_SOURCE | N/A — not a legal/policy corpus |
| fill-deferred-source-path | fill-normalized-path | fill-sha256 | sha256 | READ_DEEP | GOVERNANCE | ROADMAP_BACKLOG | ACCEPT_SUMMARY_ONLY | ACCEPT_SUMMARY_ONLY | ACCEPT_DEFERRED | section/line | SUMMARY_WITH_SOURCE | N/A — not a legal/policy corpus |

---

## [REQUIRED] 10. Disposition Matrix

| sourcePath | sourceFamily | processingStatus | knowledgeRegion | ownerSurface | disposition | answerClass | readinessVerdict | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `<path>` | `<family>` | `READ_DEEP` | `<region>` | `<surface>` | `ACCEPT` | `DIRECT_CITED_ANSWER` | `SEARCH_FILTER_READY` | |
| `<path>` | `<family>` | `READ_SHALLOW` | `<region>` | `<surface>` | `ACCEPT_SUMMARY_ONLY` | `SUMMARY_WITH_SOURCE` | `SEARCH_FILTER_READY_WITH_DECLARED_GAPS` | |
| `<path>` | `<family>` | `DEFERRED` | `<region>` | `<surface>` | `DEFER` | `ESCALATE_OR_ABSTAIN` | `PARTIAL` | `<reason>` |
| `<path>` | `<family>` | `BLOCKED_UNREADABLE` | `<region>` | `<surface>` | `BLOCKED_UNREADABLE` | `ESCALATE_OR_ABSTAIN` | `BLOCKED` | `<reason>` |

---

## [REQUIRED] 11. Gate Commands

Workers must run these commands before claiming any readiness verdict.
Record exact output in the completion review.

Record execution state before running gates:

- Commit mode: `<WORKER_MAY_COMMIT | WORKER_MUST_NOT_COMMIT>`
- `dispatchBaseHead`: `<orchestrator audit anchor>`
- `executionBaseHead`: `<git rev-parse --short HEAD immediately before edits>`
- `closureBaseHead`: `<reviewer / committer stage or N/A - pending review>`

For `WORKER_MUST_NOT_COMMIT`, run the working-tree-aware component gates below,
repair allowed-scope defects, record actual `git status --short`, and return
`COMPLETE_PENDING_REVIEW`. Do not claim autorun `pre-closure` PASS. Reviewer /
committer runs committed-range `pre-closure` after review disposition and
commit.

```powershell
# Step 1: Capture base HEAD before any file changes
git rev-parse --short HEAD

# Step 2: Check current working tree
git status --short

# Step 3: Markdown structural completeness (on changed files)
python governance/compat/check_markdown_structural_completeness.py --base <baseHead> --head HEAD --enforce

# Step 4: Work-order dispatch quality (on changed files)
python governance/compat/check_work_order_dispatch_quality.py --base <baseHead> --head HEAD --enforce

# Step 5: Corpus intelligence classification structural check (on changed files)
python governance/compat/check_corpus_intelligence_classification.py --base <baseHead> --head HEAD --enforce

# Step 6: Core guard self-protection
python governance/compat/check_core_guard_self_protection.py --enforce

# [REQUIRED IF APPLICABLE] Step 7: Corpus completeness (for tasks reading actual corpus files)
python governance/compat/check_corpus_completeness_report_integrity.py --base <baseHead> --head HEAD --enforce

# [REQUIRED IF APPLICABLE] Step 8: Knowledge-map reconciliation (for tasks producing knowledge maps)
python governance/compat/check_corpus_to_knowledge_map_reconciliation.py --base <baseHead> --head HEAD --enforce

# [REQUIRED IF APPLICABLE] Step 9: Corpus registry routing (for scan/classification tasks)
python governance/compat/check_corpus_scan_registry.py --base <baseHead> --head HEAD --enforce

# [REQUIRED IF APPLICABLE] Step 10: Scan-loop to learning-loop interlock
python governance/compat/check_system_loop_interlock.py --base <baseHead> --head HEAD --enforce

# [REQUIRED IF APPLICABLE] Step 11: Finding-to-governance routing
python governance/compat/check_finding_to_governance_learning.py --base <baseHead> --head HEAD --enforce

# Reviewer / committer stage after approved commit:
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-closure --base <closureBaseHead> --head HEAD
```

---

## [REQUIRED] 12. System Loop Interlock Routing

`[REQUIRED IF APPLICABLE]` - required when findings, negative-search evidence,
deferred items, blocked items, or downstream roadmap candidates exist.

- Upstream loop: `SCAN_LOOP_GC051`
- Output artifact: `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json`
- Finding packet: `<docs/corpus-intelligence/findings/<corpus-id>.md>`
- Downstream loop: `LEARNING_LOOP_F2G`
- Input artifact:
  `docs/reference/archive/CVF_FINDING_TO_GOVERNANCE_LEARNING_TRIGGER_STANDARD_2026-05-29.md`
- Routing rule: findings must carry `defectClass`, `learningLane`,
  `nextAction`, and action evidence through `f2gRef`, `roadmapRef`, or
  `workOrderRef` when deferred or blocked
- Autonomous mutation boundary: routing records learning candidates only; it
  does not authorize automatic rule, runtime, provider, or public changes

---

## [REQUIRED] 13. Final Readiness Summary

### 13.1 Gate Evidence

| Gate | Command | Result | Notes |
| --- | --- | --- | --- |
| GC-047 corpus completeness | `check_corpus_completeness_report_integrity.py` | `<PASS / FAIL / N/A with reason>` | |
| GC-048 knowledge-map reconciliation | `check_corpus_to_knowledge_map_reconciliation.py` | `<PASS / FAIL / N/A with reason>` | |
| GC-050 classification structural | `check_corpus_intelligence_classification.py` | `<PASS / FAIL / N/A with reason>` | |
| GC-051 corpus registry | `check_corpus_scan_registry.py` | `<PASS / FAIL / N/A with reason>` | |
| GC-052 system loop interlock | `check_system_loop_interlock.py` | `<PASS / FAIL / N/A with reason>` | |
| Finding-to-governance learning | `check_finding_to_governance_learning.py` | `<PASS / FAIL / N/A with reason>` | |
| Markdown structural | `check_markdown_structural_completeness.py` | `<PASS / FAIL>` | |
| Dispatch quality | `check_work_order_dispatch_quality.py` | `<PASS / FAIL>` | |
| Core guard self-protection | `check_core_guard_self_protection.py` | `<PASS / FAIL>` | |
| Autorun pre-closure | `run_agent_autorun_workflow_gate.py --phase pre-closure` | `<PASS after approved commit / N/A - pending review>` | never claim PASS from an empty committed range |

### 13.2 Corpus Readiness Verdicts

| Layer | Verdict |
| --- | --- |
| GC-047 corpus completeness | `COMPLETE_VERIFIED / COMPLETE_WITH_DECLARED_EXCLUSIONS / PARTIAL / BLOCKED / STALE_SNAPSHOT` |
| GC-048 knowledge map | `RECONCILED_VERIFIED / RECONCILED_WITH_DECLARED_GAPS / PARTIAL / BLOCKED / STALE_MAP` |
| Search/filter readiness | `SEARCH_FILTER_READY / SEARCH_FILTER_READY_WITH_DECLARED_GAPS / PARTIAL / BLOCKED` |
| GC-050 classification | `CLASSIFIED_STRUCTURAL_PASS / CLASSIFIED_WITH_DECLARED_GAPS / PARTIAL / BLOCKED` |
| Adversarial sampling | `PASSED_SAMPLING / FAILED_SAMPLING / PARTIAL_SAMPLING_N_OF_M / NOT_YET_RUN` |

### 13.3 Open Items

| Item | Owner lane | Status |
| --- | --- | --- |
| `<e.g., deep semantic interpretation of family X>` | `<documentation-only / runtime-behavior / domain-review>` | `OPEN / DEFERRED / CLOSED` |

### 13.4 Semantic Correctness Notice

**Semantic correctness remains review work.** Machine gates verify structural
discipline, required sections, ledger columns, and evidence shapes. They do not
prove that classifications are correct, that answers are legally accurate, that
ranking is optimal, or that no relevant document was misclassified. Domain expert
review and adversarial sampling remain required for high-stakes uses.

---

## [REQUIRED] 14. Public Export Disposition

`DEFERRED_PRIVATE_ONLY | EXPORTED | BLOCKED_MISSING_PUBLIC_ARTIFACTS`

Reason: `<state whether this packet references private legacy content, internal
documents, or restricted corpora that cannot be public-synced>`

---

## [REQUIRED] 15. Finding-To-Governance Learning Disposition

`[REQUIRED IF APPLICABLE]` — required if this packet records findings, known
issues, quality findings, defects, or post-run problems.

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| `<finding description>` | `<RULE_GAP / RUNTIME_SIGNAL / PROVIDER_OUTPUT / COST / DOC_ONLY>` | `<governance_control_plane / runtime_behavior / provider_output / cost_economics / documentation_only>` | `<NOT_ESCALATED / ESCALATED_PENDING>` | `<action description>` |

---

## [REQUIRED] 16. Claim / Final / Verification Boundary

This packet claims:

- `<list what is claimed — e.g., inventory completeness for the named corpus>`

This packet does NOT claim:

- semantic correctness of any classification;
- retrieval quality, ranking precision, or answer truth;
- legal correctness or legal advice;
- production readiness, hosted readiness, or public readiness;
- runtime retrieval implementation;
- any claim outside the bounded corpus root named in Section 1.

Worker autonomy boundary: the worker filling this template must not scan
`.private_reference/legacy/` without a dispatched LHW or equivalent governed
tranche, must not modify runtime TypeScript or Python checker code, must not
touch guard or hook chain files, and must not commit without orchestrator review.
