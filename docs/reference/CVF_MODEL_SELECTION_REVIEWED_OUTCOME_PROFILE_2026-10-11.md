# CVF Model Selection Reviewed Outcome Offline Profile

Memory class: bounded-offline-contract
docType: reference
Status: LOCKED_OPTIONAL_PROFILE
Date: 2026-10-11
Revision: R2 - unknown terminal review clock retained before first dispatch
Profile ID: cvf.model-selection-reviewed-outcome@0.1.0
rawMemoryReleased=false

## Purpose

Join a frozen manual selection record to its declared execution, initial return, repairs, independent review and final artifacts. The consumer is the Local dispatcher/reviewer completing the existing model-selection chain. The nine-reference supplement required manual separation of initial/final evidence and worker/Local burden; this optional profile makes those relationships checkable without creating a second outcome store.

## Scope / Applies To

An explicitly supplied offline JSON projection in the task's existing evidence home. Reuse the accepted public `validate_record(record)` API from `governance/compat/model_selection_manual_record.py` without changing its locked profile or implementation. This companion does not choose/invoke a model, admit execution, open references, authenticate independent actors or source truth, score quality, deliver PLL controls, persist state or intercept the host. Original reviews/ledger remain canonical and read-only.

## Source Authority

| Source | Owner use |
|---|---|
| `docs/reference/CVF_ORCHESTRATOR_MODEL_SELECTION_CONTRACT_DESIGN_2026-10-10.md`, Record Families And Required Joins; Minimum Manual Record And Evidence Homes | ReviewedOutcomeLink, initial versus final evidence, attribution and separate units |
| `docs/reference/CVF_MODEL_SELECTION_MANUAL_RECORD_PROFILE_2026-10-11.md`, Closed Input Envelope; Identity And Join Rules | locked embedded decision, Ref, Identity, Stage and canonical JSON digest |
| `docs/reviews/CVF_WORKER_MODEL_USAGE_OBSERVATION_SUPPLEMENT_2026-10-11.md`, later observations | source-scoped initial/final and actor/clock boundaries; no new benchmark |
| `docs/reviews/CVF_MODEL_SELECTION_S2_R1_COMPLETION_2026-10-11.md` | accepted decision API and S2 repair attribution |

## Protocol / Contract / Requirements

Objects are closed: all listed fields required, no unknown keys. Strings are nonempty after stripping except explicitly nullable values; IDs and lowercase SHA-256 use the locked S2 formats. Booleans never count as numbers. Ref is exactly `{locator: string, sha256: SHA}`; no locator is followed. Identity has the locked eight dimensions and `unknownReason`. UTC/offset timestamps must use a literal T, seconds, optional fractional seconds and Z or an explicit numeric offset; impossible calendar/time values rejected. All numeric amounts finite and nonnegative. Nullable unknown amounts/timestamps require a nonempty reason; known values require reason=null.

### Closed Envelope And Objects

| Object | Exact fields |
|---|---|
| Envelope | `profileVersion` literal `cvf.model-selection-reviewed-outcome@0.1.0`; `recordId` ID; `basis` ORIGINAL_RECORD or RETROSPECTIVE_PROJECTION; `asOf` timestamp; `decisionSource` Ref; `decision` locked S2 manual record; `decisionDigest` SHA; `outcome` Outcome |
| Outcome | `outcomeId` ID; `decisionId` ID; `primaryAttemptId` ID; `attempts` Attempt[] nonempty; `failedOrAbandonedAttemptIds` ID[]; `initialReturn` Initial; `finalReturn` Ref or null; `repairs` Repair[]; `review` Review; `technicalDisposition` ACCEPTED_BOUNDED, REJECTED, HOLD or PENDING_REVIEW; `procedureDisposition` PASS, FAIL or UNKNOWN; `procedureReason` string; `acceptedArtifacts` Ref[]; `telemetry` Stage[]; `remainingParentTaskSpend` Measure[]; `deviations` Deviation[]; `limitations` string |
| Attempt | `attemptId` ID; `candidateId` ID; `executionRef` Ref; `workerActor` string; `workerInvocationId` string; `status` COMPLETED, FAILED, BLOCKED or ABANDONED; `startedAt` timestamp or null; `endedAt` timestamp or null; `clockUnknownReason` string or null; `observed` Identity; `observedBasis` UNRESOLVED or VERIFIED_RUNTIME; `runtimeEvidence` Ref or null; `configurationDisposition` UNKNOWN, PARTIAL, MATCH or DEVIATION |
| Initial | `ref` Ref or null; `artifacts` Ref[]; `firstDisposition` PENDING_REVIEW, ACCEPTED_UNREPAIRED, REJECTED, BLOCKED, FAILED, ABANDONED or NO_RETURN; `capturedAt` timestamp or null; `unknownReason` string or null |
| Repair | `repairId` ID; `attemptId` ID; `actor` string; `invocationId` string; `kind` REPAIR or ASSISTANCE; `phase` WORKER_PRE_RETURN, LOCAL_REVIEW or CLOSURE_PACKAGING; `before` Ref or null; `after` Ref or null; `reason` string; `at` timestamp or null; `clockUnknownReason` string or null |
| Review | `disposition` PENDING, ACCEPTED_BOUNDED, REJECTED or HOLD; `actor` string or null; `invocationId` string or null; `ref` Ref or null; `reviewedAt` timestamp or null; `unknownReason` string or null |
| Stage | same closed Stage fields as locked S2 plus `actor` string and `basis` MEASURED, ESTIMATED or UNKNOWN |
| Measure | `unit` locked S2 unit; `amount` number or null; `currency` string or null; `window` string; `unknownReason` string or null; `basis` MEASURED, ESTIMATED or UNKNOWN |
| Deviation | `attemptId` ID; `kind` CONFIGURATION, PROCEDURE or OTHER; `reason` string; `evidence` Ref or null |

### Decision And Attempt Joins

1. Validate the entire embedded decision with the unmodified S2 public API. Prefix its diagnostic pointers with `/decision`. A malformed embedded subtree must not crash or stop checking safe outcome siblings.
2. `decisionDigest` is SHA-256 of canonical UTF-8 `json.dumps(decision, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False)`. It is distinct from the raw file SHA in decisionSource. No silent digest repair. `outcome.decisionId` equals embedded selection.decisionId. Selection must SELECT exactly its selected candidate; held decisions cannot be represented as executions here.
3. Every Attempt candidateId equals that selected candidate. A separately selected fallback belongs in its own successor decision/bundle; this profile grants no retries. Attempt IDs and repair IDs are unique; primaryAttemptId and all repair/deviation/failed IDs resolve. `failedOrAbandonedAttemptIds` has no duplicates and equals exactly the IDs of FAILED, BLOCKED and ABANDONED attempts. This accounts for declared attempts only, not unreported history.
4. Known endedAt >= startedAt. For ORIGINAL_RECORD only, known attempt starts >= selection.decidedAt; no prospective-freeze assertion follows from RETROSPECTIVE_PROJECTION. All known event times <= asOf. Known initial capture >= primary start; known review time >= primary end and initial capture. Compare timezone-aware instants, not string ordering. If either attempt clock is null, clockUnknownReason is required; when both known it is null.

### Observed Configuration And Deviation

1. UNRESOLVED means all eight observed dimensions null, runtimeEvidence=null and unknownReason nonempty. VERIFIED_RUNTIME requires model and runtimeEvidence; other missing dimensions retain unknownReason. Full observed identity requires unknownReason=null. These are declared evidence conditions, not runtime authentication.
2. Compare observed versus the selected candidate's requested identity: any pair of known unequal dimensions requires DEVIATION; no known observed dimension requires UNKNOWN; all eight requested/observed dimensions known and equal requires MATCH; otherwise PARTIAL. Requested labels never fill unobserved fields.
3. Each DEVIATION attempt requires at least one CONFIGURATION deviation row for that attempt. Such a row is forbidden for non-DEVIATION attempts. Honest artifact acceptance remains possible after a deviation, with its disclosure; it never proves execution of the originally requested configuration or upgrades its quality.

### Initial Return, Repair And Independent Acceptance

1. NO_RETURN requires initial.ref=null, artifacts empty, capturedAt=null and unknownReason nonempty. Other first dispositions require a Ref. Initial artifact locators are unique; they pin original submitted product bytes separately from the return file. Known capture with a present Ref uses unknownReason=null; missing capture requires a reason. FinalReturn cannot exist without an initial return. An outcome with no return cannot be accepted. Initial submission is separate from pre-return worker drafts/gate attempts, which may be represented by WORKER_PRE_RETURN repair rows.
2. REPAIR requires an after Ref; before is either a different-SHA Ref or null for an explicitly attributed addition. ASSISTANCE permits null refs and does not claim a material byte change. WORKER_PRE_RETURN actor/invocation equals its Attempt worker under the same normalization rule as review independence. LOCAL_REVIEW and CLOSURE_PACKAGING may belong to any explicitly recorded actor; never infer that their effort is zero.
3. If initial and final return hashes differ, require a primary LOCAL_REVIEW REPAIR row whose before matches the initial Ref and after matches finalReturn (locator and hash). Each accepted product joins by locator to initial.artifacts. A changed product requires a primary LOCAL_REVIEW REPAIR with before equal to its initial pin and after equal to its accepted pin; a new product requires the same attribution with before=null. This is consolidated submitted-to-accepted attribution, not intermediate-edit completeness. CLOSURE_PACKAGING alone cannot substitute for product/return repair. Known primary LOCAL_REVIEW repair times >= initial capture and <= review time when known. Nonprimary repairs do not compare against the primary capture/review; CLOSURE_PACKAGING may occur later through asOf. ACCEPTED_UNREPAIRED requires all accepted product pins unchanged and finalReturn equal to the initial Ref when present; it forbids primary LOCAL_REVIEW REPAIR, but permits unrelated packaging/history repairs. Final acceptance never changes firstDisposition.
4. PENDING review has ref=null and reviewedAt=null, unknownReason nonempty; actor/invocation may be supplied together or both null. Terminal reviews require actor/invocation/ref. reviewedAt may be null with a concrete unknownReason; a known reviewedAt requires unknownReason=null. Stage clocks such as probe end, semantic verification end or record authoring are not relabelled as terminal acceptance time. Use the existing independence owner normalization: strip whitespace, insert an underscore at each lowercase-or-digit to uppercase boundary, collapse whitespace/hyphens/underscores to a single underscore, then uppercase. Both reviewer actor and invocation must differ from every Attempt worker's corresponding identity. Role names alone are no proof of separation. Source: `governance/compat/check_independent_review_probe_admission.py`, _normalize_identity; implement locally without importing private checker internals.
5. Review disposition maps exactly: PENDING -> PENDING_REVIEW, otherwise the same technicalDisposition. ACCEPTED_BOUNDED requires primary COMPLETED, a present initial Ref, finalReturn and nonempty acceptedArtifacts. Other technical dispositions require acceptedArtifacts empty. Accepted artifact locators are unique. Pending/rejected/held outcomes may retain finalReturn for review but cannot claim accepted artifacts. Procedure PASS/FAIL/UNKNOWN is independent of technical acceptance and always has a reason; do not turn procedural failure into an undisclosed success.

### Unit-Safe Telemetry And Remaining Spend

Reuse S2 units MONEY, TOKENS, QUOTA, WALL_SECONDS, WORKER_SECONDS and HUMAN_SECONDS. Known MONEY requires currency; other units require currency=null. Null amount requires basis=UNKNOWN and unknownReason; known amount requires MEASURED/ESTIMATED and unknownReason=null. Empty telemetry/remaining lists are allowed with overall limitations, never interpreted as zero.

Telemetry Stage uniqueness is `(stage, actor.strip().casefold(), unit, currency, window)`. Remaining Measure uniqueness is `(unit, currency, window)`. Stages ORCHESTRATION/PREPARATION/EXECUTION/REVIEW/REWORK remain distinct. Estimated usage is not a bill. No totals, exchange conversion, cap certification, causal effectiveness, quality upgrade or model ranking are calculated. A known zero is permitted only as a declared measured/estimated quantity, never substituted for unknown review/human effort.

## Allowed / Forbidden Actions

One standalone standard-library companion/API/CLI may read an explicitly supplied file up to 1 MiB, UTF-8 with or without BOM, and maximum container depth32. Reject duplicate keys, nonfinite constants, invalid Unicode, excessive depth/cycles, malformed fields and unknown keys with controlled diagnostics. Never follow locators, modify the old validator, write inputs, access credentials/network, register hooks/CI, score models, deliver PLL or create a persistent store.

## Interface And Failure Contract

API `validate_outcome_record(record)` returns sorted exact `{code, pointer, message}` diagnostics (pointer then code). JSON Pointer escaping matches S2. Check safe sibling subtrees after malformed objects; no TypeError/KeyError/IndexError escapes. Diagnostics never echo raw supplied values.

CLI `python governance/compat/model_selection_reviewed_outcome.py --input <file>` emits exactly `{profileVersion, disposition, executionAuthorized, errors}`. `executionAuthorized=false` always. Exit0 VALID_OUTCOME_RECORD_ONLY; exit1 INVALID_OUTCOME_RECORD; exit2 INPUT_ERROR. These are data consistency results, not acceptance or invocation authority.

Stable codes: locked S2 input/shape/type/enum/format codes; embedded decision diagnostics unchanged with pointer prefix; plus DECISION_JOIN, DECISION_DRIFT, ATTEMPT_JOIN, ATTEMPT_HISTORY, CHRONOLOGY, CONFIGURATION_DISPOSITION, RETURN_INVARIANT, REPAIR_ATTRIBUTION, REVIEW_INDEPENDENCE, OUTCOME_INVARIANT, COST_UNITS and COST_BASIS.

## Evidence / Verification Requirements

Meaningful actual API/CLI cases: valid accepted no-repair; accepted repaired with first rejection preserved; pending/rejected/held; failed/abandoned/blocked history; changed frozen decision; wrong selected/attempt/decision joins; malformed nested objects with safe sibling diagnostics; identical worker/reviewer identities; mismatch disclosed versus hidden; unknown dimensions claimed MATCH; return or acceptance laundering repair; chronology offsets/unknown clocks; duplicate IDs/refs; unknown money, unlike units, false numbers/nonfinite; duplicate JSON keys and size/encoding/depth errors. Different-actor Local oracle must test source-derived behavior independently of worker tests.

Use one source-pinned retrospective projection of the accepted S2-R1 task and its Local semantic repairs. Any minimal decision summary authored now is explicitly retrospective, not a dispatch-time freeze. Preserve S2 requested Luna/xhigh and null observed fields; the current implementing worker is separately requested Luna/max. References point to original canonical evidence, which remains unchanged. No same-task self-certification or benchmark is created.

## Claim Boundary

This is an optional bounded offline ReviewedOutcomeLink representation, not complete R3 implementation. Source truth, omitted attempts, independence authenticity, current retraction, original dispatch-time freeze, actual configuration, money and effect authority require their existing Local/runtime owners. PARENT_CONTROL/PLL, scoring, Gateway and S5 remain unopened. Non coder supplies goals/constraints; the dispatcher owns technical validation. Expense remains parked.
