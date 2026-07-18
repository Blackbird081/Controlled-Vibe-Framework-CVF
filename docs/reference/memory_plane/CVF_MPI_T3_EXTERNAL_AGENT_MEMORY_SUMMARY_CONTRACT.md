# CVF MPI-T3 External Agent Memory Summary Contract

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-22

Index classification: GOVERNED_DOC (not an INDEX_ARTIFACT). This is a canonical
reference contract authorized by the MPI-T3 GC-018 baseline. Per the INDEX
classification standard, a GOVERNED_DOC is not labeled with an INDEX type.

`adapterContractOnly=true`. This contract defines IO shape and boundaries for an
external agent memory summary read. It does not implement a CLI/MCP adapter, MCP
tool, service route, web route, authenticated runtime access, durable store,
vector DB, graph store, provider call, live proof, public-sync, worker apply
mode, or commit automation.

EPISTEMIC_PROCESS_NA_WITH_REASON: reference contract - it defines the IO shape
and boundary of a summary-only external-agent memory read; it makes no evidence
comparison claim requiring the full epistemic process block.

## Purpose

MPI-T2 delivered a deterministic scan-registry episodic read projection helper
that is summary-only and not route-wired. The existing Memory readout route
(`POST /api/memory/readout`) authenticates callers and enforces
`rawMemoryReleased=false` and `canReinject=false` on every response. LSC-T6
defined the write-side external-agent signal IO contract.

MPI-T3 defines the read-side counterpart: a summary-only External Agent Memory
Summary Contract that tells a future external agent, CLI tool, or MCP client:

- who may request a memory summary;
- which source surfaces may be consulted;
- which request fields are allowed;
- which response fields are allowed;
- how raw content, reinjection, route mutation, registry mutation, and adapter
  execution remain blocked;
- how worker-return findings are routed to reviewer/closer under RSE.

MPI-T3 is the contract-first tranche that must exist before any federated
helper (MPI-T4), memory-claim checker (MPI-T5), or runtime decision packet
(MPI-T6) is authorized.

## Scope

**Applies to:** future authors of external-agent adapters, CLI tools, or MCP
clients who need a stable read-side contract boundary before any adapter is
built. Applies to governance reviewers verifying that MPI-T4 helper proposals
stay within the contract.

**Does not apply to:** the current authenticated Memory readout route
(`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts`),
which remains the runtime owner of request/response schema and auth; the
MPI-T2 scan-registry projection helper
(`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/scan-registry-memory-projection.ts`),
which remains a caller-driven helper not auto-wired into the route; the LSC
ledger store, which is not yet implemented.

## Relationship To Existing Memory Plane Records

| Memory Plane record | Relationship to MPI-T3 |
|---|---|
| Memory Plane Map `docs/reference/CVF_MEMORY_PLANE_MAP.md` | **Front-door authority.** MPI-T3 read contract is a named surface in the Memory Plane Map. MPI-T3 inherits the map's plane-level inventory without modifying it. |
| MPI-T2 Scan Registry Episodic Read Projection `docs/reference/CVF_MPI_T2_SCAN_REGISTRY_EPISODIC_READ_PROJECTION.md` | **Derived projection boundary.** MPI-T2 establishes that the scan-registry projection is summary-only and not route-wired. MPI-T3 consumes this boundary as a read-side source surface; it does not replace or override it. |
| Memory readout route `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | **Runtime route authority.** MPI-T3 inherits the existing auth and response flags from the route. The contract does not change the route, its schema, or its auth. |
| Memory runtime readout projection `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/memory-runtime-readout.ts` | **Summary-only sanitization authority.** MPI-T3 inherits the `rawMemoryReleased=false`, `canReinject=false`, and `content`-omission invariants from this helper. The contract does not modify the helper. |
| LSC-T6 External Agent CLI/MCP Signal Contract `docs/reference/learning_signal_chain/CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT.md` | **Write-side counterpart.** LSC-T6 defines the write-side external-agent signal IO using `adapterContractOnly=true`. MPI-T3 mirrors this pattern for the read side. The two contracts are complementary; neither replaces the other. |
| RSE-T1 Operator Question Boundary Addendum | **Finding routing authority.** Question-classification vocabulary (`ASK_OPERATOR`, `ASK_REVIEWER_OR_CLOSER`, `SELF_HANDLE_WITHIN_SCOPE`, `RETURN_BLOCKED_WITH_REASON`) governs how worker findings from MPI-T3 are routed. |
| RSE-T2 Worker Return Jurisdiction Block Addendum | **Worker-return routing authority.** The Worker Return Jurisdiction Block fields govern how the MPI-T3 worker return records findings and routes out-of-scope promotion candidates to the reviewer or closer. |

## Inherited Invariants

The following invariants are set by the existing runtime surface and are
inherited unchanged by this contract. A future tranche that would weaken,
remove, or conditionally flip any of these invariants requires a new
source-verified GC-018 and operator authorization.

| Invariant | Source location | Value |
|---|---|---|
| `rawMemoryReleased` is always false in the route response | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` lines 202-203 | `rawMemoryReleased: false` |
| `canReinject` is always false in the route response | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` lines 202-203 | `canReinject: false` |
| `rawMemoryReleased` is forced false in the runtime projection | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/memory-runtime-readout.ts` lines 41-42 in `sanitizeWorkflowResult` | `rawMemoryReleased: false` |
| `canReinject` is forced false in the runtime projection | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/memory-runtime-readout.ts` line 42 in `sanitizeWorkflowResult` | `canReinject: false` |
| `content` field is stripped from every candidate before readout | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/memory-runtime-readout.ts` lines 15-23 in `sanitizeCandidates` (destructuring omits `content`) | `content` absent from projected candidates |
| Route requires service token or session before readout | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` lines 148-163 (`verifyServiceTokenRequest`; `verifySessionCookie`) | 401 if neither passes |
| MPI-T2 projection is summary-only and not route-wired | `docs/reference/CVF_MPI_T2_SCAN_REGISTRY_EPISODIC_READ_PROJECTION.md` Route Wiring Status section | caller-supplied only |

## memorySummaryRequest Field Set

`memorySummaryRequest` is a new doc-only field set. It names the allowed fields
that a future external agent may carry in a memory summary read request. These
fields do not exist in the current route body schema and must not be used as if
they do. They become real only if a future source-verified work order implements
them.

| Field | Type | Status | Description |
|---|---|---|---|
| `taskContext` | string | DOC_ONLY_NEW | brief description of the task for which memory summary is requested; maximum 500 characters; no raw session content |
| `queryTopic` | string | DOC_ONLY_NEW | the specific topic, symbol, or concern to be addressed by the memory summary |
| `sourceScopeSelector` | string or string[] | DOC_ONLY_NEW | names which allowed source surfaces may be consulted; must be drawn from the Allowed Source Surfaces table below |
| `roleIdentity` | string | DOC_ONLY_NEW | role of the external agent making the request (for example `worker`, `reviewer`, `external_agent`); used for audit and routing only; does not expand read permissions |
| `maxCandidateCount` | number | DOC_ONLY_NEW | maximum number of summary candidates to return; advisory only; implementation may apply lower bounds |

**Mandatory constraints on the request:**
- `taskContext` and `queryTopic` must not contain raw chat context, provider
  session content, or secret-like values.
- `roleIdentity` records the requestor role for audit; it does not grant access
  beyond what the current route auth already allows.
- `sourceScopeSelector` must only name surfaces listed in the Allowed Source
  Surfaces section. Requesting a surface outside that list must be rejected as
  `FORBIDDEN_SOURCE_SURFACE`.

## memorySummaryResponse Field Set

`memorySummaryResponse` is a new doc-only field set. It names the allowed fields
that a future external agent may receive in a memory summary read response. These
fields do not exist in the current route response schema and must not be used as
if they do. They become real only if a future source-verified work order
implements them.

| Field | Type | Status | Description |
|---|---|---|---|
| `summaries` | array | DOC_ONLY_NEW | bounded list of summary-only records; each record carries `id`, `scope`, `summary`, `source`, `lifecycleState`, and `confidence`; no `content` field |
| `sourceAttribution` | string | DOC_ONLY_NEW | names which source surfaces were consulted to build the summaries |
| `confidence` | string | DOC_ONLY_NEW | advisory disposition from the projection (`HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`); not a production quality guarantee |
| `freshness` | string or number | DOC_ONLY_NEW | advisory freshness indicator drawn from `createdAt` or scan date of the underlying records; not a freshness guarantee |
| `forbiddenFieldFlags` | object | DOC_ONLY_NEW | records the blocked invariants: `rawMemoryReleased: false`, `canReinject: false`, `rawContentPresent: false` |

**Mandatory constraints on the response:**
- `summaries[].summary` must be bounded (maximum 280 characters per summary
  record, consistent with the MPI-T2 projection output contract).
- `summaries` must not include a `content` field on any record.
- `forbiddenFieldFlags` must always be present and must always record
  `rawMemoryReleased: false`, `canReinject: false`, and `rawContentPresent: false`.
- Confidence and freshness fields are advisory only; they must not be used as
  a production quality guarantee or source authority.

## Forbidden Fields And Actions

The following are explicitly forbidden by this contract and by the inherited
runtime invariants. No future tranche may authorize them without a new
operator-approved source-verified GC-018.

| Forbidden item | Reason |
|---|---|
| `content` field on any summary candidate | stripped by `sanitizeCandidates` in `memory-runtime-readout.ts` lines 15-23; must never be re-added |
| `rawMemoryReleased: true` | locked false at `route.ts` lines 202-203 and `memory-runtime-readout.ts` lines 41-42 |
| `canReinject: true` | locked false at `route.ts` line 203 and `memory-runtime-readout.ts` line 42 |
| Context reinjection into a prompt, agent memory, or session | derives from `canReinject=false`; no adapter may auto-inject summary output back into context |
| Durable write triggered by a summary read request | no durable store write is authorized by a read request |
| Route mutation or route schema change | no MPI-T3 artifact may edit the Memory readout route or its schema |
| Registry source or aggregate mutation | no MPI-T3 artifact may write registry entries, run the registry generator, or edit the registry aggregate |
| External command execution driven by summary output | summary output must not trigger shell commands, file system mutations, git operations, or provider calls |
| MCP tool claim or CLI adapter implementation | this contract is `adapterContractOnly=true`; no MCP tool, CLI adapter, or bridge is implemented |
| Provider/live proof | no live API call, provider call, or external network request is authorized |
| Public-sync or public repository push | private provenance only |

## Allowed Source Surfaces

A `memorySummaryRequest` may name only these surfaces in `sourceScopeSelector`.
Consulting any other surface is a contract violation and must be rejected.

| Allowed surface | Path or identifier | Role in a summary read |
|---|---|---|
| Memory Plane Map | `docs/reference/CVF_MEMORY_PLANE_MAP.md` | directory of active, parked, and contract-only Memory Plane surfaces |
| MPI-T2 Scan Registry Projection Contract | `docs/reference/CVF_MPI_T2_SCAN_REGISTRY_EPISODIC_READ_PROJECTION.md` | boundary definition for caller-supplied projection; not route-wired |
| MPI-T2 Scan Registry Projection Helper | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/scan-registry-memory-projection.ts` | caller may invoke `projectScanRegistryFindings` with parsed registry entries to produce summary candidates |
| LSC-T6 External Agent CLI/MCP Signal Contract | `docs/reference/learning_signal_chain/CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT.md` | write-side counterpart; readout-relationship section defines how advisory readout output is structured |
| RSE-T1 Operator Question Boundary Addendum | `docs/reference/role_switch_envelope/CVF_RSE_T1_OPERATOR_QUESTION_BOUNDARY_ADDENDUM.md` | question-class routing vocabulary for worker findings |
| RSE-T2 Worker Return Jurisdiction Block Addendum | `docs/reference/role_switch_envelope/CVF_RSE_T2_WORKER_RETURN_JURISDICTION_BLOCK_ADDENDUM.md` | worker-return routing block field definitions |

Surfaces that are **not** allowed source surfaces for this contract:

- vector databases, durable stores, graph persistence, or KGR legacy knowledge
  promoted to runtime memory authority;
- raw `content` fields from any source;
- provider-private memory, chat-only context, or session snapshots;
- public repository files or public-sync artifacts.

## External Knowledge Intake Routing

| Field | Disposition |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation about external-agent memory access patterns |
| Chain map route | ADAPT into CVF-owned MPI-T3 contract vocabulary via the roadmap and this work order |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; reviewer-fast gate must pass before acceptance |
| Owner surface | this MPI-T3 contract |
| Disposition | ADAPT as bounded summary-only read contract; no runtime promotion, adapter implementation, or source authority promotion |
| Claim boundary | external observations and returned output are absorbed planning input only; CVF-governed source verification (route, projection, Memory Plane map, LSC-T6, RSE references) controls the contract |

Any external agent that returns output summarizing CVF memory access patterns must
route that output through the external knowledge absorption chain before it can
become an `EXTERNAL_AGENT_CRITIQUE` signal under LSC-T2. It does not
automatically become a source authority for this contract.

## RSE Routing Rules

The following routing rules apply to any finding or promotion candidate that
arises during authoring, review, or use of this contract. Rules are drawn from
RSE-T1 (`ASK_OPERATOR`, `ASK_REVIEWER_OR_CLOSER`, `SELF_HANDLE_WITHIN_SCOPE`)
and RSE-T2 (`Worker Return Jurisdiction Block`, `operatorActionRequired`).

| Finding or decision class | RSE-T1 class | Required action |
|---|---|---|
| A required finding discovered during worker execution that is within allowed scope | `SELF_HANDLE_WITHIN_SCOPE` | capture in the worker return; do not ask operator or reviewer |
| A repair of an allowed-scope gate defect during worker execution | `SELF_HANDLE_WITHIN_SCOPE` | perform repair and rerun the gate; do not ask |
| Acceptance, rejection, or repair of the worker-return packet | `ASK_REVIEWER_OR_CLOSER` | state in the worker return and route to reviewer/closer; do not ask operator |
| Promotion of a finding to a shared reference, checker, or roadmap | `ASK_REVIEWER_OR_CLOSER` | record in the Worker Return Jurisdiction Block; route `outOfScopePromotionRoute` to reviewer/closer |
| Scope expansion beyond allowed artifacts, route edits, helper implementation, registry writes, provider/live proof, public-sync, MPI-T4/T5/T6 | `ASK_OPERATOR` | stop and require explicit operator authorization; do not proceed |
| Required source does not exist or required gate fails outside allowed repair scope | `RETURN_BLOCKED_WITH_REASON` | return `BLOCKED_WITH_REASON` naming the exact source or gate |

`operatorActionRequired` is true only when an `ASK_OPERATOR` class applies.
Routine reviewer or closer decisions must not be raised to the operator.
Finding capture and finding promotion are always separate actions.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| Route sets `rawMemoryReleased: false` in every response | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | lines 202-203 | `rawMemoryReleased` | Memory readout route POST handler | LITERAL_INVARIANT | ACCEPT |
| Route sets `canReinject: false` in every response | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | lines 202-203 | `canReinject` | Memory readout route POST handler | LITERAL_INVARIANT | ACCEPT |
| `sanitizeWorkflowResult` forces `rawMemoryReleased: false` and `canReinject: false` in the projection | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/memory-runtime-readout.ts` | lines 35-54 `sanitizeWorkflowResult` | `rawMemoryReleased`; `canReinject` | memory runtime readout projection | LITERAL_INVARIANT | ACCEPT |
| `sanitizeCandidates` strips the `content` field by destructuring omission | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/memory-runtime-readout.ts` | lines 15-23 `sanitizeCandidates` | `content` destructured and voided | memory runtime readout projection | LITERAL_INVARIANT | ACCEPT |
| Route authenticates via service token or session before readout | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts` | lines 148-163 | `verifyServiceTokenRequest`; `verifySessionCookie` | Memory readout route POST handler | EXISTS | ACCEPT |
| MPI-T2 projection helper is summary-only and not route-wired | `docs/reference/CVF_MPI_T2_SCAN_REGISTRY_EPISODIC_READ_PROJECTION.md` | Route Wiring Status section | caller-supplied projection; no auto-wire | MPI-T2 reference contract | VALUE_SET | ACCEPT |
| MPI-T2 projection preserves `rawMemoryReleased=false` and `canReinject=false` when passed to `buildMemoryRuntimeReadout` | `docs/reference/CVF_MPI_T2_SCAN_REGISTRY_EPISODIC_READ_PROJECTION.md` | Readout Compatibility section | `rawMemoryReleased`; `canReinject` | MPI-T2 reference contract | LITERAL_INVARIANT | ACCEPT |
| LSC-T6 uses `adapterContractOnly=true` as the write-side pattern | `docs/reference/learning_signal_chain/CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT.md` | line 38 | `adapterContractOnly` | LSC-T6 external signal contract | LITERAL_INVARIANT | ACCEPT |
| RSE-T1 defines four question classes for routing worker findings | `docs/reference/role_switch_envelope/CVF_RSE_T1_OPERATOR_QUESTION_BOUNDARY_ADDENDUM.md` | Question Classification table | `ASK_OPERATOR`; `ASK_REVIEWER_OR_CLOSER`; `SELF_HANDLE_WITHIN_SCOPE`; `RETURN_BLOCKED_WITH_REASON` | RSE-T1 addendum | VALUE_SET | ACCEPT |
| RSE-T2 defines the Worker Return Jurisdiction Block and `operatorActionRequired` | `docs/reference/role_switch_envelope/CVF_RSE_T2_WORKER_RETURN_JURISDICTION_BLOCK_ADDENDUM.md` | The Worker Return Jurisdiction Block; field table | `Worker Return Jurisdiction Block`; `operatorActionRequired` | RSE-T2 addendum | VALUE_SET | ACCEPT |
| INDEX standard requires GOVERNED_DOC to not carry an INDEX type label | `docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md` | Core Distinction; line 54-55 | `GOVERNED_DOC`; `INDEX_ARTIFACT` | INDEX classification standard | VALUE_SET | ACCEPT |
| `memorySummaryRequest`, `memorySummaryResponse`, `sourceScopeSelector`, `forbiddenFieldFlags` are new doc-only terms | `docs/work_orders/CVF_AGENT_WORK_ORDER_MPI_T3_EXTERNAL_AGENT_MEMORY_SUMMARY_CONTRACT_FOR_WORKER_2026-06-22.md` | New Doc-Only Terms section | `memorySummaryRequest`; `memorySummaryResponse`; `sourceScopeSelector`; `forbiddenFieldFlags` | MPI-T3 work order | DOC_ONLY_NEW | ACCEPT |

## Claim Boundary

This contract defines the External Agent Memory Summary read IO shape and
boundaries as documentation and reference only. It does not authorize Memory
readout route edits, route schema changes, helper or checker implementation,
registry writes, durable writes, registry generator changes, provider/live proof,
public-sync, actual CLI/MCP adapter behavior, MCP tool implementation, vector DB,
graph persistence, reinjection, direct interception, queue/daemon, watcher,
readiness, cost optimization, or universal governed-coding control.

The `memorySummaryRequest` and `memorySummaryResponse` field sets are new
doc-only fields. They have no current runtime presence. They become real only
when a future source-verified work order implements them.

MPI-T4, MPI-T5, and MPI-T6 remain parked until their prerequisite evidence
exists and a separate operator-authorized source-verified work order is authored.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance MPI-T3 reference contract. No public-sync remote,
public commit, public artifact path, public README/catalog claim, or public
repository mutation is authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | MPI-T3 external agent memory summary contract documentation only |
| claimDisposition | N/A with reason: no Delta execution-control behavior is implemented or claimed |
| receiptEvidence | N/A with reason: no Delta receipt is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | documentation-only reference contract; no route wiring, helper, or adapter |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | summary-only external memory read contract documentation only |
| forbiddenExpansion | route edit, route schema change, helper implementation, checker, registry write, durable write, provider/live, public-sync, CLI/MCP adapter, vector DB, graph persistence, reinjection, queue/daemon, watcher, readiness, full-hook equivalence, cost optimization, and universal control remain out of scope |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | worker role |
| Provider or surface | local workspace |
| Session or invocation | MPI-T3 worker execution, 2026-06-22 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | documentation authoring; source reads |
| Target paths | this contract; `docs/reference/memory_plane/README.md`; worker-return artifact |
| Allowed scope source | MPI-T3 work order and paired GC-018 baseline |
| Before status evidence | executionBaseHead `ef6df616`; clean worktree before worker edits |
| After status evidence | contract and README created, pending no-commit return |
| Diff evidence | worker records `git status --short` in the worker return |
| Approval boundary | worker created allowed-scope artifacts and committed nothing |
| Claim boundary | documentation-only contract; no route edit, helper, registry write, durable write, provider/live, public-sync, or adapter behavior |
| Agent type | worker role |
| Invocation ID | `mpi-t3-external-agent-memory-summary-contract-worker-2026-06-22` |
| Expected manifest | this contract; `docs/reference/memory_plane/README.md`; worker-return artifact |
| Actual changed set | worker records in the worker return |
| Manifest delta | worker records in the worker return |
