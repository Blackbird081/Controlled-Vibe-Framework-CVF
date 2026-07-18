# CVF LPCI1-T4 Retrieval Boundary Specification

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-03

executionBaseHead: `818fe435`

## Purpose

Define the retrieval boundary specification for LPCI1. This document
formalizes:

- the retrieval pipeline contract: how T3 filter stages feed answer assembly;
- the answer assembly rules: per-`answerClass` response format constraints;
- the conflict resolution protocol: handling multiple records on the same topic;
- the freshness/currency warning protocol: handling amended or superseded records;
- the AuditReceipt schema: the canonical output record from every LPCI query;
- the response boundary contract: the formal constraints the T5 chatbot
  prototype must satisfy.

This is a documentation artifact only. No runtime code, real corpus retrieval,
vector search, embedding pipeline, or provider calls are created.

---

## Source

| Authority | Path | Verified state |
| --- | --- | --- |
| T1 architecture — retrieval flow pseudocode | `docs/reference/CVF_LPCI1_T1_ARCHITECTURE_2026-06-02.md` | ACTIVE — `RetrievalReceipt`, `AuditReceipt`, `conflict_flag`, `freshness_flag` from `### Retrieval Flow` |
| T1 architecture — answer boundary contract | `docs/reference/CVF_LPCI1_T1_ARCHITECTURE_2026-06-02.md` | ACTIVE — `### Answer Boundary Contract` table |
| T3 query filter contract | `docs/reference/CVF_LPCI1_T3_SEARCH_FILTER_INDEX_SPEC_2026-06-03.md` | ACTIVE — five-stage filter, Stage 4 post-filter, negative receipts |
| T2 domain classification spec | `docs/reference/CVF_LPCI1_T2_DOMAIN_CLASSIFICATION_SPEC_2026-06-03.md` | ACTIVE — answerClass criteria, dispositionAlias, decision matrix |

---

## Scope

Applies to: LPCI1 T5 chatbot prototype implementation and all future runtime
tranches. T4 establishes the contract that T5 must satisfy.

Out of scope: implementation of the retrieval pipeline, LLM call, or UI. Those
are T5 scope.

---

## Retrieval Pipeline Contract

The LPCI1 retrieval pipeline consists of two sequential phases:

### Phase 1 — Index Query and Filtering (T3 contract)

Governed by `docs/reference/CVF_LPCI1_T3_SEARCH_FILTER_INDEX_SPEC_2026-06-03.md`.

Mandatory execution order:

1. Stage 1 — Sensitivity pre-filter
2. Stage 2 — Status filter (default: `effective` only)
3. Stage 3 — Fulltext / semantic search
4. Stage 4 — answerClass post-filter (**mandatory; non-overridable**)
5. Stage 5 — Client facet filters

Phase 1 output is a ranked result set of index records. If Phase 1 produces a
negative receipt (`NO_RESULTS`, `FILTERED_OUT`, `ESCALATED`), the pipeline
terminates at Phase 1 and returns that receipt. Phase 2 is not invoked.

### Phase 2 — Answer Assembly (T4 contract, defined here)

Phase 2 receives the Phase 1 ranked result set and produces:

1. A `RetrievalReceipt` (pre-LLM context payload).
2. An LLM context assembly instruction (the answer boundary prompt).
3. An `AuditReceipt` (post-LLM output record).

**Phase 2 must only be invoked when Phase 1 returns a non-empty ranked result
set with at least one `answerClass ≠ ESCALATE_OR_ABSTAIN` record.**

---

## RetrievalReceipt Schema

The `RetrievalReceipt` is the structured context payload passed to the LLM.
Fields match T1 architecture retrieval flow (step 4), formalized here:

| Field | Type | Rule |
| --- | --- | --- |
| `matched_paths` | string[] | all `normalizedPath` values from Phase 1 result set |
| `answer_class` | enum | **most restrictive** answerClass in result set (precedence: `ESCALATE_OR_ABSTAIN` > `PROCEDURAL_GUIDANCE` > `SUMMARY_WITH_SOURCE` > `DIRECT_CITED_ANSWER`) |
| `freshness_flag` | boolean | `true` if any matched record has `status = amended` or `superseded` |
| `conflict_flag` | boolean | `true` if ≥2 records cover the same topic with different `effectiveDate` or `authorityLevel` |
| `matched_records` | object[] | full classification ledger rows for each matched path (read-only; not modified by Phase 2) |
| `query` | string | original query string |
| `query_timestamp` | string (ISO 8601) | timestamp at query execution |

### answerClass Precedence Rule

When the result set contains records with mixed `answerClass` values, the
`RetrievalReceipt.answer_class` must be the most restrictive:

```
ESCALATE_OR_ABSTAIN > PROCEDURAL_GUIDANCE > SUMMARY_WITH_SOURCE > DIRECT_CITED_ANSWER
```

Example: if result set contains one `DIRECT_CITED_ANSWER` and one
`SUMMARY_WITH_SOURCE` record, `answer_class = SUMMARY_WITH_SOURCE`.

---

## Answer Assembly Rules

The LLM receives the `RetrievalReceipt` and an explicit answer boundary
instruction. The assembly rules derive from T1 architecture answer boundary
contract:

### Rule A1 — Per-answerClass Response Constraint

| answerClass (from RetrievalReceipt.answer_class) | Allowed LLM response |
| --- | --- |
| `DIRECT_CITED_ANSWER` | direct citation + bounded explanation; must name at least one `normalizedPath` and `effectiveDate` |
| `SUMMARY_WITH_SOURCE` | summary of retrieved text only; must name at least one `normalizedPath`; no independent legal claim |
| `PROCEDURAL_GUIDANCE` | procedural guidance grounded in retrieved source; must name `normalizedPath`; no legal judgment |
| `ESCALATE_OR_ABSTAIN` | abstention message only; return `ESCALATED` receipt from T3; LLM must NOT attempt an answer |

### Rule A2 — Freshness Obligation

If `RetrievalReceipt.freshness_flag = true`, the response must append a
freshness warning citing the stale records. The LLM answer boundary instruction
must include:

> "One or more sources may not be current. Append: [FRESHNESS WARNING — source
> at `<normalizedPath>` has status `<amended|superseded>` as of `<effectiveDate>`.]"

The freshness warning must appear at the end of the response, not in-line.

### Rule A3 — Conflict Obligation

If `RetrievalReceipt.conflict_flag = true`, the LLM must list all conflicting
records and explicitly defer resolution to the operator:

> "Two or more sources conflict on this topic. Sources: [`<normalizedPath_1>`,
> `<normalizedPath_2>`]. Resolution requires operator judgment."

The LLM must NOT attempt to resolve the conflict or rank one source over another
based on content reasoning. Authoritative resolution is by `authorityLevel` only,
and must be stated as such if the operator asks.

### Rule A4 — No Legal Advice

The LLM must not:

- assert compliance status for any jurisdiction;
- advise on legal strategy or risk;
- interpret legislative intent beyond retrieved text;
- claim that retrieved text constitutes legal advice.

Every response must carry an implicit or explicit scope marker: "Based on
retrieved documents only."

---

## Conflict Resolution Protocol

Two records are **in conflict** when both:

1. match the same query topic (same keyword or semantic cluster), AND
2. differ on `effectiveDate` OR `authorityLevel`.

### Conflict Resolution Rules

| Condition | Resolution |
| --- | --- |
| Two records, same `authorityLevel`, different `effectiveDate` | cite the later `effectiveDate` record as primary; flag the earlier as potentially superseded |
| Two records, different `authorityLevel`, same topic | cite the higher `authorityLevel` record as primary; flag the lower as advisory only |
| Two records, both `authorityLevel` unknown | set `conflict_flag = true`; do not resolve; list both; defer to operator |
| ≥3 conflicting records | set `conflict_flag = true`; list all; rank by `authorityLevel` DESC then `effectiveDate` DESC; state ranking method |
| Conflict involves a `status = superseded` record | treat superseded record as `ESCALATE_OR_ABSTAIN` class; exclude from direct answer; include in conflict notice only |

**Conflict resolution by LLM content reasoning is prohibited.** Resolution is
by `authorityLevel` and `effectiveDate` fields only.

---

## Freshness / Currency Warning Protocol

| Record status | Freshness handling |
| --- | --- |
| `effective` | no warning |
| `amended` | set `freshness_flag = true`; append freshness warning in response |
| `superseded` | set `freshness_flag = true`; downgrade `answerClass` to `ESCALATE_OR_ABSTAIN` for that record; note successor document if available |
| `repealed` / `obsolete` | excluded at Stage 4 post-filter; not in result set; no freshness warning needed |
| `draft` | excluded at Stage 4 post-filter; not in result set |
| `unknown` | excluded at Stage 4 post-filter (ESCALATE_OR_ABSTAIN); not in result set |

**Note**: `amended` records remain in the result set (they are still effective);
only a warning is appended. `superseded` records are downgraded to
`ESCALATE_OR_ABSTAIN` individually before the `RetrievalReceipt.answer_class`
precedence rule is applied.

---

## AuditReceipt Schema

The `AuditReceipt` is the canonical output record from every LPCI query. It is
written after the response outcome is known and is the authoritative audit
trail. For Phase 2 answers, it is written after LLM response generation. For
Phase 1 negative receipts, it is written after the negative receipt is returned
without invoking the LLM. Fields formalize T1 architecture step 7 (`RETURN
AuditReceipt`):

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `auditId` | string (UUID) | yes | unique per query execution |
| `query` | string | yes | original query string |
| `query_timestamp` | string (ISO 8601) | yes | time of query execution |
| `matched_paths` | string[] | yes | from `RetrievalReceipt.matched_paths` |
| `answer_class` | enum | yes | from `RetrievalReceipt.answer_class` (most restrictive) |
| `freshness_flag` | boolean | yes | from `RetrievalReceipt.freshness_flag` |
| `conflict_flag` | boolean | yes | from `RetrievalReceipt.conflict_flag` |
| `model_response_hash` | string | yes | SHA-256 of the emitted response text or negative receipt payload (hex); computed after outcome generation; not `null` |
| `response_boundary_class` | enum | yes | one of: `ANSWER_EMITTED`, `ABSTAINED`, `ESCALATED`, `NEGATIVE_RECEIPT` |
| `phase1_receipt_type` | string | conditional | required if Phase 1 returned a negative receipt; one of: `NO_RESULTS`, `FILTERED_OUT`, `ESCALATED` |
| `applied_filters` | object | yes | serialized T3 filter parameters as applied |
| `sensitivity_pre_filter_applied` | boolean | yes | `true` if Stage 1 sensitivity pre-filter ran |
| `stale_records` | object[] | conditional | required if `freshness_flag = true`; list of `{normalizedPath, status, effectiveDate}` |
| `conflict_records` | object[] | conditional | required if `conflict_flag = true`; list of `{normalizedPath, authorityLevel, effectiveDate}` |

### response_boundary_class Values

| Value | Condition |
| --- | --- |
| `ANSWER_EMITTED` | LLM produced a valid bounded answer within `answerClass` constraint |
| `ABSTAINED` | `answer_class = ESCALATE_OR_ABSTAIN`; LLM returned abstention message |
| `ESCALATED` | Phase 2 determined all records require operator escalation |
| `NEGATIVE_RECEIPT` | Phase 1 returned `NO_RESULTS`, `FILTERED_OUT`, or `ESCALATED` receipt; Phase 2 not invoked |

---

## Response Boundary Contract

The formal contract the T5 chatbot prototype must satisfy for every query:

| Obligation | Rule |
| --- | --- |
| C1 — Citation-first | every non-abstention response must name at least one `normalizedPath` and `effectiveDate` |
| C2 — answerClass enforcement | LLM response must not exceed the allowed response type for `RetrievalReceipt.answer_class` |
| C3 — No legal advice | LLM must not assert compliance status, legal strategy, or risk beyond retrieved text |
| C4 — Freshness warning | if `freshness_flag = true`, freshness warning must appear in the response |
| C5 — Conflict notice | if `conflict_flag = true`, conflict notice with both sources must appear; no LLM-driven resolution |
| C6 — Abstention on ESCALATE_OR_ABSTAIN | if `answer_class = ESCALATE_OR_ABSTAIN`, LLM must return abstention message only |
| C7 — AuditReceipt written | every query must produce a valid `AuditReceipt` regardless of outcome |
| C8 — model_response_hash populated | SHA-256 of LLM response text must be computed and stored in `AuditReceipt` |
| C9 — Phase 1 negative receipt passthrough | if Phase 1 returns a negative receipt, it must be returned to the client unchanged; Phase 2 not invoked |

---

## Requirements

| Requirement | Applicable to |
| --- | --- |
| Phase 1 must complete before Phase 2 is invoked | all LPCI query executions |
| Phase 2 invoked only on non-empty result set with ≥1 non-ESCALATE record | all LPCI query executions |
| RetrievalReceipt.answer_class = most restrictive in result set | all LPCI query executions |
| C1–C9 response boundary obligations satisfied | T5 implementation |
| AuditReceipt written for every query | T5 implementation |
| model_response_hash = SHA-256 of LLM response | T5 implementation |
| Conflict resolution by authorityLevel and effectiveDate only | T5 implementation |
| Freshness warning appended if freshness_flag = true | T5 implementation |
| Abstention if answer_class = ESCALATE_OR_ABSTAIN | T5 implementation |

---

## Enforcement

| Rule | Checker / gate |
| --- | --- |
| T2 answerClass / dispositionAlias consistency | `governance/compat/check_corpus_intelligence_classification.py` (GC-050) at corpus packet close |
| T3 five-stage filter mandatory Stage 4 | T5 implementation review; dedicated checker candidate for T5 scope |
| AuditReceipt schema completeness | T5 implementation review gate |
| Governance structural completeness | `governance/compat/check_markdown_structural_completeness.py` |
| Pre-implementation autorun | `governance/compat/run_agent_autorun_workflow_gate.py` |

**Future enforcement note**: response boundary contract (C1–C9), AuditReceipt
schema, conflict resolution, and freshness warning are specification constraints
only in this tranche. Runtime enforcement code is T5 implementation scope.

---

## Verification

This specification is a planning artifact. Verification at this tranche:

- `RetrievalReceipt` fields cross-checked against T1 architecture retrieval
  flow pseudocode (step 4: `matched_paths`, `answer_class`, `freshness_flag`,
  `conflict_flag`).
- `AuditReceipt` fields extend T1 architecture step 7 (`query`, `matched_paths`,
  `answer_class`, `model_response_hash`) with governance fields.
- Answer assembly rules derived directly from T1 answer boundary contract table.
- Conflict resolution and freshness protocol consistent with T1 design principles.
- No real retrieval executed; all schemas are planning-level.

Runtime retrieval correctness and AuditReceipt emission verified at T5
implementation gate after operator commits and T4 closes.

---

## Non-Goals

- Implement any runtime retrieval or LLM call code.
- Run any real corpus retrieval test.
- Implement the AuditReceipt database schema or storage.
- Define a production-ready caching or rate-limiting strategy.
- Provide tested retrieval accuracy or response quality metrics.
- Add new NR rules.

---

## Claim Boundary

This document claims:

- retrieval pipeline contract (Phase 1 → Phase 2 flow) consistent with T3
  filter and T1 architecture;
- `RetrievalReceipt` schema formalizing T1 pseudocode fields;
- answer assembly rules A1–A4 aligned with T1 answer boundary contract;
- conflict resolution protocol (authorityLevel + effectiveDate; no LLM-driven);
- freshness/currency warning protocol per T1 design principles;
- `AuditReceipt` schema with all T1 fields plus governance fields;
- response boundary contract C1–C9.

This document does NOT claim:

- runtime retrieval correctness or tested behavior;
- LLM response quality or legal answer accuracy;
- production readiness;
- tested AuditReceipt emission.

---

## Finding-To-Governance Learning Disposition

Defect class: `RULE_GAP` — no LPCI1 retrieval boundary specification existed
before this tranche

Learning lane: `GOVERNANCE_CONTROL_PLANE`

Disposition: `RULE_ADDED` — LPCI1-T4 establishes the retrieval pipeline
contract, answer assembly rules, conflict resolution, freshness protocol,
AuditReceipt schema, and response boundary contract

Next control action: `OPEN` — LPCI1-T5 chatbot prototype is the first runtime
tranche; requires separate GC-018/work order and must cite T4 closure as
dependency

Runtime/provider/cost learning: `N/A_WITH_REASON`

Reason: documentation and specification artifact only; no provider calls,
runtime behavior changes, or cost events.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: spec references private corpus intelligence governance chain.

Public-sync boundary: no artifacts from this batch are queued for public-sync.

---

## Related

- `docs/reference/CVF_LPCI1_T1_ARCHITECTURE_2026-06-02.md`
- `docs/reference/CVF_LPCI1_T3_SEARCH_FILTER_INDEX_SPEC_2026-06-03.md`
- `docs/reference/CVF_LPCI1_T2_DOMAIN_CLASSIFICATION_SPEC_2026-06-03.md`
- `docs/work_orders/CVF_WO_LPCI1_T4_RETRIEVAL_BOUNDARY_2026-06-03.md`
