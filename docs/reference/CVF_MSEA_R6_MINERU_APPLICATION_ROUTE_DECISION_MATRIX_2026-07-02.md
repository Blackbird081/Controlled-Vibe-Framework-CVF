# CVF MSEA-R6 MinerU Application Route Decision Matrix

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-02

EPISTEMIC_PROCESS_NA_WITH_REASON: this reference records a source-backed route
decision derived from accepted MSEA-R4/R5 evidence; it does not itself assert a
new empirical corpus result, runtime behavior, or provider behavior claim.

## Purpose

Record the MSEA-R6 route decision matrix that selects exactly one allowed
routing outcome for the next MinerU application lane, using MSEA-R4 and MSEA-R5
source-backed evidence, MSEA-T2/T3 owner surfaces, and the conditional reopen
index. This is a decision-only reference artifact; it does not implement,
install, execute, or authorize any MinerU capability.

## Scope / Applies To

Applies to any future CVF work that considers reopening or extending the MSEA
MinerU absorption lane after MSEA-R6. Does not apply to runtime, package,
checker, or public-sync work, all of which require a separate fresh GC-018 and,
where behavior is claimed, live/provider proof.

## Selected Routing Outcome

`OPEN_RECEIPT_SCHEMA_CONTRACT_DRAFT`

Rationale: `OPEN_RECEIPT_SCHEMA_CONTRACT_DRAFT` is the lowest-risk, highest-
immediate-CVF-value route for detailed document/layer scan use cases. It is
documentation/reference work only (R0), requires no runtime execution, provider
calls, credentials, S3 access, RAG writes, model downloads, Docker, or checker
implementation. MSEA-R5's deep read of `docs/en/reference/output_files.md`
provided upstream's own exhaustive receipt schema (`layout.pdf`, `span.pdf`,
`model.json`, `middle.json`, `content_list.json`, `content_list_v2.json`) with
concrete block-type taxonomies, page/layer hierarchy, and dual-backend (pipeline
vs VLM) output variants. This schema maps almost directly onto MSEA-T2's
existing receipt vocabulary and sharpens it with concrete field names. A
CVF-owned receipt schema contract draft would enrich MSEA-T2 without requiring
any runtime behavior, making it the safest and most immediately useful next
step.

## Route Candidate Evaluation Matrix

| Route candidate | Source-backed input | Risk level | Immediate CVF value | Reopen condition status | Disposition |
|---|---|---|---|---|---|
| `OPEN_RECEIPT_SCHEMA_CONTRACT_DRAFT` | `output_files.md` receipt schema (layout.pdf, span.pdf, model.json, middle.json, content_list.json, content_list_v2.json); MSEA-T2 receipt vocabulary; MSEA-R5 owner-surface delta | R0 documentation only | HIGH - enriches MSEA-T2 receipt vocabulary with concrete field-level schema; directly serves detailed document/layer scan use cases | Reopen condition met: operator named detailed document/layer scan as high-value; MSEA-R5 provides concrete schema evidence; fresh GC-018 would authorize contract drafting only | SELECTED |
| `OPEN_LOCAL_PARSER_ADAPTER_VALUE_PROBE` | CLI/API/backend evidence from MSEA-R4/R5 (`mineru/cli/*.py`, `mineru/backend/*`) | R2+ runtime - requires model download, execution, live proof | MEDIUM - would prove local parser value but requires runtime execution | Reopen condition not met: requires operator-named downstream use case requiring MinerU document parsing plus fresh GC-018 authorizing model download, execution, and live/provider proof | DEFERRED |
| `OPEN_RAG_HANDOFF_ROUTE_PROBE` | RagFlow integration evidence (`docs/zh/usage/plugin/RagFlow.md`); MSEA-T2 RAG-handoff doctrine | R2+ runtime - requires RAG index write, plugin wiring | MEDIUM-HIGH - concrete shipped RAG-integration evidence (RagFlow) but RAG handoff requires runtime RAG index mutation | Reopen condition not met: requires operator-named downstream RAG use case plus fresh GC-018 authorizing RAG index write and adapter execution | DEFERRED |
| `OPEN_PROVIDER_ASSISTED_TITLE_CORRECTION_PROBE` | `mineru/utils/llm_aided.py` OpenAI-compatible client (`OpenAI`, `api_key`, `base_url`) | R3+ - requires provider/live proof, credentials | MEDIUM - config-gated LLM-assisted title correction is a distinct provider-call surface | Reopen condition not met: requires operator-named downstream use case requiring LLM-assisted title correction plus fresh GC-018 authorizing provider/live-proof boundary | DEFERRED |
| `OPEN_STORAGE_CREDENTIAL_BOUNDARY_PROBE` | `mineru/data/io/s3.py` S3Reader (`ak`, `sk`, `endpoint_url`, `boto3`) | R3+ - requires credentials, S3 connection | LOW-MEDIUM - credential-requiring remote storage surface | Reopen condition not met: requires operator-named downstream use case requiring remote S3-compatible storage plus fresh GC-018 authorizing credential-handling boundary | DEFERRED |
| `OPEN_CHECKER_CANDIDATE_VALUE_PROBE` | MSEA-T3 and conditional reopen index checker rows (`MSEA-document-truth-overclaim-checker`, `MSEA-runtime-readiness-overclaim-checker`, `MSEA-rag-handoff-checker`) | R1+ - requires checker implementation | LOW - all three checker candidates have overlapping coverage with existing CVF gates | Reopen condition not met: all three rows remain `PARKED_UNTIL_CONDITION`; no repeated real misses or authorized RAG ingestion tranche has occurred | DEFERRED |
| `HOLD_ALL_IMPLEMENTATION_LANES` | No source-backed route outranks hold | R0 | NONE - would park all lanes despite a source-backed documentation route being ready | N/A - selected only if no route has source-backed value sufficient for a next governed tranche | NOT SELECTED - `OPEN_RECEIPT_SCHEMA_CONTRACT_DRAFT` has sufficient source-backed value |

## Selection Rule Application

Per the work order selection rule: "if multiple routes are valuable, choose the
route with the lowest risk and highest immediate CVF value for detailed
document/layer scan use cases. In this dispatch, documentation/receipt-contract
work is lower risk than runtime/provider/S3/Docker/checker implementation."

`OPEN_RECEIPT_SCHEMA_CONTRACT_DRAFT` is the only R0 documentation-only route
with HIGH immediate CVF value. All other routes require runtime execution,
provider calls, credentials, S3 access, RAG writes, model downloads, Docker, or
checker implementation, making them higher risk and not immediately actionable
without operator checkpoints and fresh GC-018 authorization for behavior claims.

## Alternative Routes And Reopen Conditions

| Alternative route | Concrete reopen condition | Forbidden until reopened |
|---|---|---|
| `OPEN_LOCAL_PARSER_ADAPTER_VALUE_PROBE` | Operator names a concrete downstream use case requiring MinerU document parsing; fresh GC-018 authorizes model download, execution, and live/provider proof for the specific backend needed | install, model download, execution, API/router/Gradio/server startup, provider/live proof |
| `OPEN_RAG_HANDOFF_ROUTE_PROBE` | Operator names a concrete downstream RAG use case; fresh GC-018 authorizes RAG index write and adapter execution | RAG index write, plugin wiring, adapter execution |
| `OPEN_PROVIDER_ASSISTED_TITLE_CORRECTION_PROBE` | Operator names a concrete downstream use case requiring LLM-assisted title correction; fresh GC-018 authorizes provider/live-proof boundary for the specific OpenAI-compatible endpoint used | any live call to `openai.OpenAI` inside this code path, credential provisioning |
| `OPEN_STORAGE_CREDENTIAL_BOUNDARY_PROBE` | Operator names a concrete downstream use case requiring remote S3-compatible storage; fresh GC-018 authorizes credential-handling boundary (secret storage, rotation, access scope) | any live S3 connection, credential storage, or remote IO |
| `OPEN_CHECKER_CANDIDATE_VALUE_PROBE` | Two or more real overclaim misses are not caught by existing claim, closure, or export gates (for `MSEA-document-truth-overclaim-checker`); repeated claims that MinerU is installed/active/production-ready without proof (for `MSEA-runtime-readiness-overclaim-checker`); repeated RAG/context bypass claims or an authorized RAG ingestion tranche (for `MSEA-rag-handoff-checker`) | checker implementation, hook wiring |
| `HOLD_ALL_IMPLEMENTATION_LANES` | N/A - this is the default hold if no route has source-backed value | N/A |

## Next Action Boundary

The selected route `OPEN_RECEIPT_SCHEMA_CONTRACT_DRAFT` authorizes only a
future documentation/reference lane: drafting a CVF-owned receipt schema
contract informed by (not copied from) `output_files.md`. It does not authorize:

- schema implementation or parser runtime behavior;
- direct import or copy of upstream MinerU source into CVF implementation;
- MinerU install, model download, OCR/VLM/hybrid/parser execution;
- API/router/Gradio service, Docker deployment, RAG indexing;
- provider/live proof, S3 access, credential handling;
- checker implementation, package activation, public-sync;
- Web/MCP/model-router/action-authority, automatic invocation, benchmark;
- production-readiness or hosted-readiness claims.

Any future implementation route still requires a later fresh GC-018 and
source-verified work order before execution.

## Source Verification

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| Receipt schema route has source-backed upstream evidence | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/reference/output_files.md` | lines 17, 35, 62, 109, 292, 396, 730-742 | `layout.pdf`; `span.pdf`; `model.json`; `middle.json`; `content_list.json`; `content_list_v2.json` | upstream output-file reference | VALUE_SET | ACCEPT |
| MSEA-T2 owns receipt vocabulary and is enrichable | `docs/reference/CVF_MSEA_T2_DOCUMENT_EXTRACTION_CLAIM_BOUNDARY_RECEIPT_QUALITY_AND_RAG_HANDOFF_ADVISORY_2026-06-28.md` | Owner Surface Matrix; Receipt Advisory | `MSEA-CC-4` | MSEA-T2 reference | VALUE_SET | ACCEPT |
| MSEA-R5 confirmed output_files.md as highest-value receipt schema file | `docs/reviews/CVF_MSEA_R5_MINERU_DEEP_DOCUMENT_LAYER_SCAN_ABSORPTION_WORKER_RETURN_2026-07-02.md` | Findings / Position; Targeted Deep Ledger | `output_files.md` | MSEA-R5 worker return | VALUE_SET | ACCEPT |
| MSEA-R5 owner delta parks receipt schema adoption behind fresh GC-018 | `docs/reference/CVF_MSEA_R5_MINERU_DEEP_DOCUMENT_LAYER_SCAN_OWNER_SURFACE_DELTA_2026-07-02.md` | Conditional Reopen Candidates | `Document-extraction receipt schema adoption into a CVF-native receipt contract` | MSEA-R5 owner-surface delta | VALUE_SET | ACCEPT |
| RagFlow route has source-backed integration evidence | `.private_reference/source_mirrors/opendatalab__MinerU/docs/zh/usage/plugin/RagFlow.md` | lines 1-68 | `RagFlow`; `MINERU_EXECUTABLE` | upstream RagFlow plugin guide | VALUE_SET | ACCEPT |
| Provider-assisted title route has source-backed provider-call evidence | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/utils/llm_aided.py` | lines 6; 164-166 | `OpenAI`; `api_key`; `base_url` | MinerU LLM-aided title utility | EXISTS | ACCEPT |
| Storage route has source-backed credential and S3 evidence | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/data/io/s3.py` | lines 6-15; 18-45; 90-113 | `S3Reader`; `ak`; `sk`; `endpoint_url`; `boto3` | MinerU S3 IO layer | EXISTS | ACCEPT |
| Checker route candidates remain parked behind concrete reopen conditions | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md` | rows `MSEA-document-truth-overclaim-checker`, `MSEA-runtime-readiness-overclaim-checker`, `MSEA-rag-handoff-checker` | `PARKED_UNTIL_CONDITION` | external absorption conditional reopen index | VALUE_SET | ACCEPT |
| MSEA-T3 no-checker-now decision stands | `docs/reviews/CVF_MSEA_T3_STATIC_CHECKER_VALUE_DECISION_AND_LANE_CLOSEOUT_2026-06-28.md` | Review Decision; Remaining Value Matrix | `CLOSE_MSEA_ABSORPTION_LANE_NO_CHECKER_NOW` | MSEA-T3 closeout | VALUE_SET | ACCEPT |
| Source mirror is pinned and matches expected commit | `.private_reference/source_mirrors/INDEX.md` | Mirror Ledger row `opendatalab__MinerU` | `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491` | source mirror index | VALUE_SET | ACCEPT |

## Claim Boundary

This route decision matrix is a decision-only reference artifact. It does not
authorize or claim MinerU runtime integration, parser execution, OCR execution,
VLM/hybrid backend routing, remote backend processing, model download,
API/router/Gradio service, Docker deployment, RAG indexing, provider/live proof,
S3 access, credential handling, document truth verification, parser accuracy,
table/formula correctness, public-sync export, checker enforcement, package
activation, certification, generated aggregate mutation, production readiness,
hosted readiness, model-router behavior, action authority, or universal document
intelligence.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: MSEA-R6 route decision matrix is private provenance route-decision work
derived from private source-mirror absorption evidence. No public-sync artifact
is created or authorized by this reference.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | MSEA-R6 route decision matrix reference |
| claimDisposition | CLAIM_REJECTED: no Delta runtime execution-control claim is made |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: no runtime receipt is created or consumed |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no runtime action is executed or observed |
| invocationBoundary | local authoring and source verification only |
| interceptionBoundary | no runtime interception, parser execution, provider invocation, S3 access, or action-control behavior |
| claimLanguage | source-backed decision-route selection only |
| forbiddenExpansion | no runtime/provider/live/public/package/Web/MCP/model-router/action-authority, automatic invocation, checker implementation, source import, credential handling, or production-readiness claim |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | no-commit worker role |
| Provider or surface | local workspace |
| Session or invocation | MSEA-R6 route decision matrix authoring, 2026-07-02 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Read, Get-Content, git, governance checkers |
| Target paths | `docs/reference/CVF_MSEA_R6_MINERU_APPLICATION_ROUTE_DECISION_MATRIX_2026-07-02.md` |
| Allowed scope source | MSEA-R6 work order and paired GC-018 baseline |
| Before status evidence | file did not exist before this worker return |
| After status evidence | one new untracked file |
| Diff evidence | `git diff --name-status` shows no tracked-file mutations |
| Approval boundary | route decision matrix documentation only |
| Claim boundary | no runtime/provider/live/public/package/checker/source-import/Web/MCP/model-router/action-authority claim |
| Agent type | worker |
| Invocation ID | `msea-r6-route-decision-matrix-2026-07-02` |
| Expected manifest | this file |
| Actual changed set | this file |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename; one new file created |