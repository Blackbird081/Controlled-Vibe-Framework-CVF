# CVF Model Selection Manual Record Profile - S2-R1

Memory class: bounded-implementation-contract
docType: reference
Status: LOCKED_BOUNDED_PROFILE
Date: 2026-10-11
Profile ID: cvf.model-selection-manual-record@0.1.0
Parent design: cvf.orchestrator-model-selection-advisory@0.2.1
rawMemoryReleased=false

## Purpose

Define a small, offline record-consistency profile for a dispatcher using the manual AGENT_SEAT chain. S4's passing structural gates did not catch an invented learning-use enum; Local corrected it. This profile gives that dispatcher a deterministic check before review. It does not select a model or admit execution.

## Scope / Applies To

This is a bounded implementation of SelectionDecision and LOCAL_OBSERVATION, with typed task, candidate, evidence, admission and cost summaries. Existing R3 doctrine/contract remain the design owners. This profile is an optional representation in a task's existing work-order/evidence home. It introduces no registry, persistent service or new outcome authority. Full ReviewedOutcomeLink, scores, PARENT_CONTROL and GATEWAY_API are deferred and must not be claimed implemented here.

The initial consumer is the internal dispatcher preparing/reviewing a manual record. The S4-derived example is a validation projection of existing canonical evidence, not a replacement S4 decision or outcome. Applying the profile to historical prose does not retroactively certify that dispatch.

## Source Authority

| Source | Scope |
|---|---|
| `docs/reference/CVF_ORCHESTRATOR_MODEL_SELECTION_DOCTRINE_DESIGN_2026-10-10.md` | existing R3 proposal: assignment, quality and uncertainty boundaries |
| `docs/reference/CVF_ORCHESTRATOR_MODEL_SELECTION_CONTRACT_DESIGN_2026-10-10.md` | existing R3 field families, decision/cost and learning semantics |
| `docs/reviews/CVF_MODEL_SELECTION_S4_R1_COMPLETION_2026-10-11.md` | actual noncanonical learning label after structural gate PASS; bounded validation demand |

## Protocol / Contract / Requirements

All objects below are closed: every listed field is required, and additional fields are invalid. Arrays may be empty unless a rule below forbids it. Null is distinct from an absent field, zero and an empty string. Strings are UTF-8 encodable and nonempty after whitespace trimming; supplied values are never silently trimmed or coerced. Booleans are not numbers. Finite numbers only; no NaN/Infinity, negative measurements or limits. IDs match `[A-Za-z0-9][A-Za-z0-9._:-]{0,127}`. SHA values are 64 lower-case hexadecimal characters. Timestamps are valid timezone-aware ISO-8601 strings; naive or impossible dates are invalid. Case-sensitive enums have no aliases. Maximum nesting is 32 containers, with the root object at depth 1; both CLI and Python API reject deeper or cyclic input in a controlled result before digest calculation.

`Ref` is exactly `{locator: string, sha256: SHA}`. Locator is retained as data: the validator never opens it or follows a URL. The hash is a declared pin, not authenticated source-byte proof.

### Closed Input Envelope

| Object | Exact fields and types |
|---|---|
| Envelope | `profileVersion` literal `cvf.model-selection-manual-record@0.1.0`; `recordId` ID; `task` Task; `candidates` Candidate[]; `evidence` Evidence[]; `selection` Selection; `admission` Admission; `cost` Cost; `learningLinks` Learning[] |
| Task | `taskId` ID; `artifact` Ref; `surface` literal `AGENT_SEAT`; `role` WORKER or REVIEWER; `outcome` string; `acceptanceFloor` Ref; `choiceAuthority` Ref; `choiceKind` EXPLICIT_ASSIGNMENT or DELEGATED; `assignedCandidateId` ID or null; `provisionalAllowed` boolean |
| Identity | `providerProduct`, `model`, `snapshot`, `channel`, `effort`, `harnessVersion`, `toolProfile`: each string or null; `role` WORKER, REVIEWER or null; `unknownReason` string or null |
| Candidate | `candidateId` ID; `requested` Identity; `requestedBasis` OPERATOR_REPORTED or OFFICIAL_CATALOG; `observed` Identity; `observedBasis` UNRESOLVED or VERIFIED_RUNTIME; `runtimeEvidence` Ref or null; `eligible` boolean; `contextDisposition` PASS, PENDING or HOLD; `availability` AVAILABLE, UNAVAILABLE or UNKNOWN |
| Evidence | `evidenceId` ID; `candidateId` ID; `evidenceClass` one of the parent R3 classes listed below; `claimKind` POSITIVE_QUALITY, METHODOLOGY_ONLY or COST_ONLY; `source` Ref; `retrievedAt` timestamp; `configurationMatch` EXACT, PARTIAL or NONTRANSFERABLE; `taskApplicability` RELEVANT, NOT_RELEVANT or UNKNOWN; `freshness` CURRENT_FOR_DECISION, STALE, CONFLICTING or UNRESOLVED; `testedConfiguration` Identity; `limitations` string |
| Selection | `decisionId` ID; `owner` literal LOCAL; `decidedAt` timestamp; `disposition` SELECT, HOLD_NO_ELIGIBLE_CANDIDATE, HOLD_EVIDENCE or HOLD_OPERATOR_CONSTRAINT; `selectedCandidateId` ID or null; `operatorAssignmentDisposition` HONORED, HONORED_WITH_EVIDENCE_GAP, BLOCKED or NOT_APPLICABLE; `qualityDisposition` SUPPORTED, PROVISIONAL or INSUFFICIENT; `evidenceIds` ID[]; `rationale` string; `executionAuthorized` literal false; `frozenDigests` Digests |
| Digests | `task`, `candidates`, `evidence`: each SHA |
| Admission | `disposition`, `authorityDisposition`, `methodDisposition`, `contextDisposition`, `budgetDisposition`, `availabilityDisposition`: each PASS, PENDING or HOLD; `refs` Ref[]; `reason` string |
| Cost | `stages` Stage[]; `hardCaps` Cap[] |
| Stage | `stage` ORCHESTRATION, PREPARATION, EXECUTION, REVIEW or REWORK; `unit` MONEY, TOKENS, QUOTA, WALL_SECONDS, WORKER_SECONDS or HUMAN_SECONDS; `amount` finite nonnegative number or null; `currency` string or null; `window` string; `unknownReason` string or null |
| Cap | `unit` same units as Stage; `limit` finite nonnegative number; `currency` string or null; `window` string; `bound` finite nonnegative number or null; `boundReason` string |
| Learning | `linkId` ID; `laterDecisionId` ID; `branch` literal LOCAL_OBSERVATION; `source` Ref; `presentSourceDisposition` ACTIVE, RETRACTED, SUPERSEDED or UNKNOWN; `currentCheckAt` timestamp; `applicability` EXACT, PARTIAL or NONTRANSFERABLE; `applicabilityReason` string; `evidenceUse` CITED, ACTION_VERIFIED or NO_CHANGE_REASONED; `actionOrReason` string or null; `verification` Ref or null |

Evidence classes: OFFICIAL_TECHNICAL_REPORT, OFFICIAL_MODEL_OR_SYSTEM_CARD, ORIGINAL_BENCHMARK_METHOD, PROVIDER_REPORTED_EVALUATION, INDEPENDENT_PUBLISHER_EVALUATION, LOCAL_REVIEWED_OUTCOME, OFFICIAL_TARIFF, MEASURED_BILLING.

### Identity And Join Rules

1. Candidate/evidence/link IDs are unique within their respective families. Candidates are nonempty. Every evidence candidate, selection evidence ID, assigned/selected candidate and laterDecisionId resolves to the declared family; laterDecisionId equals this selection's decisionId. Repeated selection evidence IDs are invalid.
2. Every Candidate has a nonempty requested model/alias and requested role equals task role. Other requested dimensions may be null. If any identity dimension is null, unknownReason is nonempty. When no dimension is null, unknownReason is null. UNRESOLVED observed identity has all eight dimensions null and runtimeEvidence=null. VERIFIED_RUNTIME requires runtimeEvidence and at least model observed; any other null dimension retains a reason. Requested labels alone never fill observed fields.
3. EXACT evidence matching requires all eight tested and requested identity dimensions known and equal. Unknown material dimensions cannot support EXACT in this intentionally narrow whole-configuration profile. PARTIAL/NONTRANSFERABLE retain limitations. No scores or source-truth assessment is implemented.
4. Freeze digest algorithm: SHA-256 of UTF-8 `json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False)` for each task/candidates/evidence value separately. Array order is material. Recompute all three and reject mismatch. This catches declared frozen-byte drift; it does not authenticate who froze the record or pin external file bytes. A changed record needs a separately authored successor, not a silent digest repair by the validator.

### Selection And Separate Admission

1. SELECT requires exactly one non-null selectedCandidateId resolving to an eligible candidate. Holds require selectedCandidateId=null. A selected candidate known UNAVAILABLE or context HOLD cannot SELECT. An explicitly assigned candidate with either known conflict requires HOLD_OPERATOR_CONSTRAINT. HOLD_NO_ELIGIBLE_CANDIDATE requires no eligible candidate; other holds may retain eligible candidates with their reasons.
2. EXPLICIT_ASSIGNMENT requires a resolving assignedCandidateId. SELECT must equal that assignment. With INSUFFICIENT quality, require HONORED_WITH_EVIDENCE_GAP; otherwise require HONORED. Explicit holds use BLOCKED. This label is not quality PASS or invocation authority.
3. DELEGATED requires assignedCandidateId=null and operatorAssignmentDisposition=NOT_APPLICABLE. SELECT with INSUFFICIENT is invalid. Generic choice authority cannot waive these requirements.
4. For either choice branch, SELECT with SUPPORTED or PROVISIONAL requires at least one referenced positive, relevant, CURRENT_FOR_DECISION, EXACT/PARTIAL evidence for the selected candidate. OFFICIAL_TARIFF/MEASURED_BILLING cannot be quality evidence. PROVISIONAL additionally requires provisionalAllowed=true. Referenced CONFLICTING positive-quality evidence for the selected candidate prevents delegated SELECT, and prevents a SUPPORTED/PROVISIONAL claim in either branch. Explicit assignment can retain INSUFFICIENT/HONORED_WITH_EVIDENCE_GAP despite missing predictive support; it cannot upgrade quality. Stale/nontransferable rows may remain context but cannot supply the required supporting row.
5. executionAuthorized is always false, including Admission PASS. Component PENDING means missing proof; component HOLD means a known failed authority/method/context/budget/availability constraint. Any component HOLD requires selection HOLD_OPERATOR_CONSTRAINT. Admission PASS requires SELECT, nonempty refs, all five component dispositions PASS, selected availability AVAILABLE and selected context PASS. Admission PENDING may accompany SELECT while proof is missing; any HOLD component forces overall Admission HOLD, and overall HOLD requires at least one HOLD component. A quality-gap label never resolves missing proof. Selected context HOLD or availability UNAVAILABLE cannot be represented as a PASS component; selected context PENDING or availability UNKNOWN cannot be represented as PASS either.

### Unit-Safe Cost

1. Unknown amount requires a nonempty unknownReason. Known amount requires unknownReason=null. MONEY with a known amount requires currency; unknown money may have currency=null with its reason. Other units require currency=null. A MONEY cap always requires currency.
2. Stages with the same `(stage, unit, currency, window)` are duplicates. Caps with the same `(unit, currency, window)` are duplicates. No stage aggregation, exchange-rate conversion, estimated invoice, savings or unknown-to-zero substitution is performed.
3. A null cap bound prevents Admission budgetDisposition=PASS; missing bound proof is PENDING unless another known budget failure requires HOLD. A bound above its limit requires budgetDisposition=HOLD and selection HOLD_OPERATOR_CONSTRAINT. A supplied bound needs at least one stage with matching unit/currency/window; cross-unit or cross-window substitution is invalid. The validator checks the declared bound relationship, not its factual reliability. Hard budgets are optional; absent monetary caps do not invent a monetary hold.

### Local Observation Learning

1. Only canonical CITED, ACTION_VERIFIED and NO_CHANGE_REASONED are allowed; review-pending state belongs in separate prose, not an invented evidenceUse token.
2. ACTION_VERIFIED/NO_CHANGE_REASONED require presentSourceDisposition=ACTIVE, applicability EXACT/PARTIAL, nonempty actionOrReason and verification Ref. These are declared receipt requirements, not independent-review authentication.
3. A RETRACTED/SUPERSEDED/UNKNOWN or NONTRANSFERABLE source may remain CITED historical/unresolved context with its applicabilityReason. It cannot carry either verified-use label. This input rejects PARENT_CONTROL and parent DELIVERY/APPLICATION fields; the existing PLL owner handles those branches.

## Allowed / Forbidden Actions

The CLI reads one explicitly supplied UTF-8 JSON file, validates shape/relationships and prints one JSON result. It may not follow refs, write files, access credentials, make network/provider calls, choose/substitute a model, admit dispatch, modify existing records or wire itself into hooks/autorun/CI. Duplicate JSON keys and nonfinite constants are input errors. Limit input to 1 MiB; malformed encoding/JSON, excessive nesting and input errors return a controlled result without a traceback or raw input echo.

## Interface And Failure Contract

Python API: `validate_record(record)` returns a list of objects exactly `{code: string, pointer: string, message: string}` sorted by pointer then code. Invalid records never escape as TypeError/KeyError/IndexError. One structural error may stop validation of its malformed subtree; check valid sibling subtrees where safe. Diagnostics identify fields, never echo raw values. No arbitrary error-count threshold is used for admission.

CLI: `python governance/compat/model_selection_manual_record.py --input <file>` prints exactly `{profileVersion, disposition, executionAuthorized, errors}`. profileVersion is the fixed supported profile, executionAuthorized=false. Exit 0: VALID_RECORD_ONLY. Exit 1: INVALID_RECORD. Exit 2: INPUT_ERROR. All three return the same closed result shape.

Stable error codes: INPUT_IO, INPUT_ENCODING, INPUT_SIZE, INPUT_JSON, DUPLICATE_KEY, NONFINITE_NUMBER, SHAPE, TYPE, ENUM, FORMAT, DUPLICATE_ID, DANGLING_REF, IDENTITY_BASIS, EXACT_MATCH, FREEZE_DRIFT, SELECTION_INVARIANT, DELEGATED_EVIDENCE, ADMISSION_INVARIANT, COST_UNITS, COST_BOUND, LEARNING_INVARIANT. For input errors pointer is the empty JSON pointer. Field pointers follow JSON Pointer escaping (`~` -> `~0`, `/` -> `~1`), without a claim to a broader external standard implementation.

## Evidence / Verification Requirements

Use one source-pinned S4-derived example that preserves requested Luna/xhigh, unknown observed identity/usage, explicit insufficient-quality assignment, PARTIAL S3 packet-mechanism evidence and reviewer-verified action. R3 doctrine/contract and original S3/S4 evidence remain read-only. Freeze digests are profile-specific, distinct from external artifact SHA-256.

Tests must meaningfully mutate positive records: actual noncanonical label, strict input shape, duplicate IDs/keys, dangling joins, invalid SELECT/hold and delegated evidence, identity promotion/EXACT unknowns, freeze drift, unsafe cost units/caps, stale verified learning and forbidden branches. Test valid explicit gaps, delegated supported/provisional, hold with null selection and selection with pending admission. Assert codes/pointers and CLI exit/result boundaries. These are offline deterministic data-validation tests; they assert no actual AI governance behavior or live provider enforcement. Independent Local review uses source-derived mutations and the real CLI separately from worker tests.

## Claim Boundary

VALID_RECORD_ONLY proves declared consistency under this bounded profile. It cannot prove source truth or reading, current freshness/retraction, real authority, model suitability/execution, authentic runtime identity, a genuine bill, independent action/result truth, or complete six-family R3 implementation. Non coder provides goals/constraints; technical validation is handled by the dispatcher. Expense and S5 remain parked.
