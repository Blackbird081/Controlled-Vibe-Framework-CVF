# CVF CGE-T2 CodeGraph LPF/KGR Adaptation Contract

Memory class: FULL_RECORD

Status: COMPLETE_PENDING_REVIEW

docType: reference

Date: 2026-06-20

Batch ID: CGE-T2

## Purpose

Provide a source-verified adaptation contract for the CodeGraph concepts that
survived CGE-T1 triage as adapt candidates: impact vocabulary (R7), stale-index
and fallback discipline (R8), and graph receipt and query-plan templates (R9).
This contract defines how each idea maps to existing LPF/KGR owner surfaces,
normalizes external field names to CVF conventions, sets graph freshness and
fallback rules, and catalogues future checker candidates without implementing
them.

This contract does not make CodeGraph canonical CVF runtime. It does not
authorize implementation, installation, MCP wiring, watcher/daemon, benchmark,
provider/live proof, public-sync, ACE-R1, freeze, readiness, or
universal governed-coding-control claims.

## Scope / Applies-To

Applies to future CVF documentation/reference work that cites CGE-T1
CodeGraph rows R7, R8, or R9 as advisory input for LPF/KGR owner surfaces.

Does not apply to runtime/source implementation, CodeGraph installation,
`.codegraph/` creation, MCP wiring, watcher/daemon behavior, benchmark proof,
provider/live execution, public-sync, ACE-R1, freeze action, readiness claims,
or universal governed-coding-control claims.

## Source Authority

The following CVF-governed surfaces are authoritative for this contract:

| Symbol or path | File | Key section | Disposition |
|---|---|---|---|
| `GraphAuthorityReceipt` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/authority/graph-authority-gate.ts` | lines 30-44 | ACCEPT - defines advisory-only receipt with `authorityModel: "advisory_graph_context_only"` and `canBypassPolicy: false` |
| `evaluateGraphAuthorityGate` | same file | lines 86-134 | ACCEPT - policy decision dominates; graph confidence is a scoring signal, not an authority grant |
| `GraphKnowledgeService.queryImpact` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/schema/graph-schema.ts` | lines 62-70 | ACCEPT - owns query impact interface; input: `queryId`, `changedFiles`, `targetSymbols`, `maxDepth` |
| `GraphQueryResult` | same file | lines 50-60 | ACCEPT - canonical query result type with `affectedFiles`, `confidenceSummary`, `tokenBudgetEstimate`, `warnings` |
| `SymbolIndex` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge/graph/index/symbol-index.ts` | line 13 | ACCEPT - owns in-memory symbol graph |
| `buildSymbolIndexFromGraph` | same file | line 40 | ACCEPT - builds symbol index from a `DependencyGraph` |
| `createInMemoryGraphKnowledgeService` | same file | line 77 | ACCEPT - factory that returns `GraphKnowledgeService` implementation |
| `TaskQuery` | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/context_builder/graph/task-query-mapper.ts` | lines 13-19 | ACCEPT - owns query type / scope mapping contract |
| `mapTaskToQuery` | same file | lines 21-52 | ACCEPT - maps task description to `TaskQuery`; actual function name verified (dispatcher cited `mapTaskToGraphQuery` - corrected here) |
| `resolveBlastRadius` | same file | lines 54-89 | ACCEPT - resolves impact neighborhood via symbol index; actual function name verified (dispatcher cited `resolveGraphContextForTask` - corrected here) |
| Memory-derived graph boundary | `docs/reference/CVF_MEMORY_DERIVED_GRAPH_BOUNDARY_2026-06-01.md` | lines 23-43 | ACCEPT - derived views advisory, cannot overrule source authority |
| KGR pre-review | `docs/reference/CVF_KGR_ABSORPTION_PREREVIEW_2026-06-01.md` | lines 217-218 and 233 | ACCEPT - KGR1-T3/T4 own planned retrieval lane; external graph library import blocked |
| CGE-T1 triage matrix | `docs/reviews/CVF_CGE_T1_CODEGRAPH_EXTERNAL_ABSORPTION_TRIAGE_MATRIX_COMPLETION_2026-06-20.md` | lines 165-202 | ACCEPT - defines R7/R8/R9 adapt dispositions and ACE-R1 parked status |

## Non-Authority Inputs

The following are external advisory inputs only. They inform vocabulary and
template candidates but are not CVF source authority:

| Input | Source | Why not authority |
|---|---|---|
| CodeGraph impact-analysis vocabulary | local copied `CodeGraph/CVF_Code_Intelligence_Capability/` and upstream `https://github.com/colbymchenry/codegraph` | External repo/copy; not CVF canonical |
| CodeGraph `graph-staleness-service.ts` and `CVF_GRAPH_STALENESS_AND_SYNC_POLICY_2026-06-19.md` | local copied package | External advisory only; staleness discipline must be re-expressed through CVF memory-derived graph boundary |
| CodeGraph context receipt and query-plan templates | local copied `docs/templates/code-intelligence/*.template.md` and `CVF_GRAPH_CONTEXT_RECEIPT_PROTOCOL_2026-06-19.md` | External advisory only; field names require normalization to CVF camelCase before use |
| Upstream performance claims | upstream landing page FETCH_VERIFIED in CGE-T1 | Upstream-measured across external codebases; not CVF proof; blocked until separate CVF benchmark |

## LPF/KGR Owner Surface Map

Maps CGE-T1 adapt rows R7/R8/R9 to current CVF owner surfaces.

### R7 - Impact Vocabulary

| External CodeGraph concept | CVF owner surface | CVF field or symbol | Adaptation rule |
|---|---|---|---|
| "impact radius" | `GraphKnowledgeService.queryImpact` + `resolveBlastRadius` | `affectedFiles` (file-level radius) + `resolvedNodes`/`resolvedEdges` (symbol-level radius) | Adapt as vocabulary alias; do not introduce new `impactRadius` field |
| "callers/callees" | `GraphQueryResult` | `resolvedEdges` with `from`/`to` fields on each `GraphEdge` | Adapt as directional edge traversal; `from`=caller, `to`=callee |
| "files" (affected) | `GraphQueryResult` | `affectedFiles: readonly string[]` | Direct map; existing field owns this concept |
| "status" (impact freshness/confidence) | `GraphQueryResult` | `confidenceSummary: GraphConfidence` | Map status to confidence tier; `high`/`medium`/`low` |
| "query type scope" | `TaskQuery` | `queryType: TaskQueryType`, `maxDepth: number` | Map to existing `mapTaskToQuery` scope; extend `TaskQueryType` via future work order if new types needed |
| "impact analysis" | `evaluateGraphAuthorityGate` | `GraphAuthorityGateResult.receipt` | Gate remains advisory; no authority expansion |

**Adaptation decision:** `ADAPT_TO_EXISTING_LPF_GRAPH_CONTRACT`

No new LPF interface fields are created by this contract. Future work orders may
propose `TaskQueryType` extensions through a separate governed packet.

### R8 - Stale-Index and Fallback Discipline

| External CodeGraph concept | CVF owner surface | Adaptation rule |
|---|---|---|
| Stale-index warning | `GraphQueryResult.warnings` + `GraphAuthorityReceipt.evidenceWarnings` | External stale signals adapt into existing warning arrays; `"graph_context_pack_is_advisory_evidence_only"` already present |
| Confidence-gated fallback | `GraphAuthorityGateResult.requiresHumanReview` + `evaluateGraphAuthorityGate` threshold logic | When `graphScore < minimumConfidenceScore` -> `require_review`; direct source read required |
| Auto-sync trigger | Blocked | No watcher/daemon authorized; sync fallback is manual until separate runtime GC-018 |

**Adaptation rule (canonical):** When graph index confidence is `low` or graph
evidence is stale, uncertain, or in a `require_review` state, direct source
file read is required before any review, freeze, finality, or scope-expansion
claim. Graph evidence in this state is advisory input only. This rule supplements
and is consistent with the memory-derived graph boundary: "derived views cannot
overrule source authority" (`CVF_MEMORY_DERIVED_GRAPH_BOUNDARY_2026-06-01.md`
line 39).

**Adaptation decision:** `ADAPT_AS_ADVISORY_FALLBACK_RULE`

No runtime watcher/daemon or auto-sync mechanism is authorized. Staleness
handling is advisory-only pending a separate runtime GC-018.

### R9 - Graph Receipt and Query-Plan Templates

| External CodeGraph field (snake_case) | CVF normalized field (camelCase) | Owner surface | Disposition |
|---|---|---|---|
| `receipt_id` | `receiptId` | `GraphAuthorityReceipt` | ACCEPT - already camelCase in owner |
| `authority_model` | `authorityModel` | `GraphAuthorityReceipt` | ACCEPT - value `"advisory_graph_context_only"` |
| `can_bypass_policy` | `canBypassPolicy` | `GraphAuthorityReceipt` | ACCEPT - literal `false`; no external template may override |
| `policy_decision` | `policyDecision` | `GraphAuthorityReceipt` | ACCEPT - bound to `GraphAuthorityPolicyDecision` enum |
| `query_id` | `queryId` | `GraphQueryResult`, `TaskQuery`, `GraphAuthorityReceipt` | ACCEPT - present across all owner surfaces |
| `query_type` | `queryType` | `GraphQueryResult`, `TaskQuery` | ACCEPT - bound to `TaskQueryType` union |
| `affected_files` | `affectedFiles` | `GraphQueryResult`, `GraphAuthorityReceipt` | ACCEPT - `readonly string[]` |
| `confidence_summary` | `confidenceSummary` | `GraphQueryResult` | ACCEPT - `GraphConfidence` (`"high"`, `"medium"`, `"low"`) |
| `token_budget_estimate` | `tokenBudgetEstimate` | `GraphQueryResult` | ACCEPT |
| `freeze_allowed` | (none) | - | REJECT - must never appear in CVF adapted receipts; graph signals cannot grant freeze authority |
| `evidence_warnings` | `evidenceWarnings` | `GraphAuthorityReceipt` | ACCEPT - advisory array |
| `query_plan` (template header) | doc-contract only | - | DEFER - adapt as documentation template language only; not a runtime schema field until future implementation work order |
| `impact_radius` (template section) | doc-contract only | - | DEFER - use `affectedFiles` + `resolvedNodes` vocabulary in any future doc template |

**Adaptation decision:** `ADAPT_AFTER_FIELD_NORMALIZATION`

Any future documentation template that cites CodeGraph-style receipt or
query-plan structure must normalize all field names to camelCase before use.
The `freezeAllowed` field must never appear in any adapted CVF artifact.
Runtime schema extension requires a separate implementation work order.

## Field Normalization Table (Summary)

| External name | CVF normalized name | Action | Bound owner |
|---|---|---|---|
| `freeze_allowed` | - | REJECT | `graph-authority-gate.ts` `canBypassPolicy: false` |
| `impact_radius` | `affectedFiles` + `resolvedNodes` | ADAPT | `GraphQueryResult`, `resolveBlastRadius` |
| `callers_callees` | `resolvedEdges` (from/to) | ADAPT | `GraphQueryResult.resolvedEdges` |
| `query_id` | `queryId` | ADAPT | `TaskQuery`, `GraphQueryResult`, `GraphAuthorityReceipt` |
| `query_type` | `queryType` | ADAPT | `TaskQuery.queryType` |
| `confidence_summary` | `confidenceSummary` | ADAPT | `GraphQueryResult.confidenceSummary` |
| `token_budget_estimate` | `tokenBudgetEstimate` | ADAPT | `GraphQueryResult.tokenBudgetEstimate` |
| `affected_files` | `affectedFiles` | ADAPT | `GraphQueryResult.affectedFiles` |
| `receipt_id` | `receiptId` | ADAPT | `GraphAuthorityReceipt.receiptId` |
| `authority_model` | `authorityModel` | ADAPT | `GraphAuthorityReceipt.authorityModel` |
| `can_bypass_policy` | `canBypassPolicy: false` | ADAPT - literal false only | `GraphAuthorityReceipt.canBypassPolicy` |
| `query_plan` | doc-contract template | DEFER | future implementation work order |
| `stale_signal` | `warnings[]` + `confidenceSummary: "low"` | ADAPT | `GraphQueryResult.warnings`, `GraphAuthorityGateResult.requiresHumanReview` |

## Graph Freshness And Fallback Rule

**Canonical rule (governs all future lanes that reference CGE-T2):**

Graph context is advisory input only. Graph index data is a derived view built
from source files; it does not substitute for direct source authority.

When any of the following conditions are present, a direct source file read or
direct-evidence review is required before making any review, freeze, finality,
scope-expansion, or release-gate claim:

- `confidenceSummary` is `"low"` in `GraphQueryResult`;
- `requiresHumanReview` is `true` in `GraphAuthorityGateResult`;
- `warnings` contains any stale or freshness-limiting signal;
- the graph index has not been rebuilt since the relevant source changes;
- the graph index origin is unknown or unverified.

In all cases, the policy decision (`evaluateGraphAuthorityGate` input
`policyDecision`) dominates graph confidence. A passing graph score cannot
override a non-ALLOW policy decision. See `graph-authority-gate.ts` lines
100-112: `if (input.policyDecision !== "ALLOW") decision = "deny_context"`.

Source: `CVF_MEMORY_DERIVED_GRAPH_BOUNDARY_2026-06-01.md` lines 39-41 and
`graph-authority-gate.ts` lines 86-112.

## No-Authority Rule

Graph impact radius, blast radius neighborhood, and stale-index signals are
advisory evidence only. They cannot:

- grant freeze, finality, bypass, or scope-expansion authority;
- widen or narrow the allowed scope of a work order;
- replace source-file read as the basis for a review or governance claim;
- assert runtime performance or readiness without a separate CVF benchmark;
- override the `policyDominant: true` and `canBypassPolicy: false` literals in
  `GraphAuthorityReceipt`;
- trigger watcher/daemon, MCP auto-config, or provider routing changes without
  a separately authorized runtime tranche.

This rule carries forward CGE-T1-R1 (`freezeAllowed` BLOCK), CGE-T1-R2
(parallel-core REJECT), CGE-T1-R4 (performance BLOCK_UNTIL_CVF_BENCHMARK),
and the memory-derived graph boundary.

## Required Decisions (Contract Record)

| Decision | Disposition |
|---|---|
| `freezeAllowed` | `REJECT_AS_AUTHORITY_SIGNAL` - must not appear in any CVF adapted receipt; graph signals cannot grant freeze |
| Copied LPF-like graph core files | `REJECT_PARALLEL_CORE` - CVF already owns GraphKnowledgeService, SymbolIndex, GraphSQLiteStore via AIF-B/PBR04 |
| CodeGraph/KGR overlap | `DEDUP_RESOLVE_TOWARD_KGR_AND_LPF` - KGR1-T3/T4 own planned retrieval; CodeGraph is advisory vocabulary input only |
| Performance claims | `BLOCK_UNTIL_CVF_BENCHMARK` - upstream numbers are external-measured; not CVF proof |
| Watcher/daemon | `DEFER_REQUIRES_RUNTIME_GC018` - no watcher/daemon authorized in this contract |
| MCP wiring or auto-config | `DEFER_REQUIRES_MCP_BOUNDARY_WORK_ORDER` - no MCP server modification authorized |
| Impact vocabulary | `ADAPT_TO_EXISTING_LPF_GRAPH_CONTRACT` - mapped to `affectedFiles`, `resolvedNodes`, `resolvedEdges` |
| Stale-index rule | `ADAPT_AS_ADVISORY_FALLBACK_RULE` - direct source read required on stale/low-confidence graph |
| Receipt/query-plan templates | `ADAPT_AFTER_FIELD_NORMALIZATION` - all fields normalized to camelCase; `freezeAllowed` rejected |
| ACE-R1 | `PARKED` - not reopened; not a prerequisite for CGE-T2 |

## Future Checker Candidate Ledger

These are candidate machine checks only. No implementation is authorized by
this contract. Each would require a separate governed work order.

| Candidate ID | Description | Source basis | Priority signal |
|---|---|---|---|
| CC-CGE-1 | Reject any adapted CVF receipt that includes a `freezeAllowed` or equivalent freeze-grant field | `graph-authority-gate.ts` `canBypassPolicy: false` (line 36); CGE-T1-R1 BLOCK | HIGH - authority-leak blocker |
| CC-CGE-2 | Require a direct-source-read annotation or fallback evidence before any review, freeze, finality, or scope-expansion claim when `confidenceSummary` is `"low"` or `requiresHumanReview` is true | `graph-authority-gate.ts` lines 103-112; memory-derived graph boundary lines 39-41 | HIGH - freshness enforcement |
| CC-CGE-3 | Enforce camelCase normalization for all CVF adapted graph receipt and query-plan fields; reject any snake_case field in adapted artifacts | Field normalization table above | MEDIUM - convention guard |
| CC-CGE-4 | Prevent graph `affectedFiles` or blast-radius neighborhood from auto-expanding or narrowing an authorized work-order scope without separate operator authorization | CGE-T1-R1/R7; no-authority rule above | MEDIUM - scope-expansion blocker |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | CGE-T2 CodeGraph LPF/KGR adaptation contract only |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: graph receipt templates are design concepts only, not Delta receipt evidence |
| actionEvidence | N/A with reason: no execution action is claimed |
| invocationBoundary | no wrapper/proxy, mandatory invocation, direct IDE/shell/git/filesystem interception, arbitrary command execution, or EDIT/COMMIT execution |
| interceptionBoundary | no direct interception claim |
| claimLanguage | reference contract only |
| forbiddenExpansion | no runtime, MCP, watcher/daemon, benchmark, provider/live, public-sync, ACE-R1, freeze, readiness, or universal governed-coding-control claim |

## Epistemic Process Block

Expected Result / Prediction: CodeGraph R7/R8/R9 should be absorbable only as
advisory vocabulary, freshness/fallback discipline, and field-normalized
template language mapped onto existing LPF/KGR owner surfaces.

Evidence Comparison: the prediction held. `GraphKnowledgeService.queryImpact`,
`GraphQueryResult`, `SymbolIndex`, `mapTaskToQuery`, `resolveBlastRadius`, and
`GraphAuthorityReceipt.canBypassPolicy: false` already own the relevant CVF
surfaces. CGE-T1 and KGR evidence keep CodeGraph as advisory input only.

Contradiction Or Gap Disposition: the dispatch source-verification vocabulary
used two stale function names. This contract corrects them to `mapTaskToQuery`
and `resolveBlastRadius` while preserving the accepted owner-surface claim.

Claim Update: CodeGraph contributes useful reference vocabulary for CGE-T2, but
does not justify a new graph core, runtime adoption, freeze authority, MCP
wiring, watcher/daemon behavior, benchmark claim, or provider/live claim.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude worker plus Codex reviewer repair |
| Provider or surface | Claude worker workspace; Codex local reviewer |
| Session or invocation | 2026-06-20 CGE-T2 CodeGraph LPF/KGR adaptation contract and closure conversion |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | source reads, document authoring, apply_patch reviewer repair, git status evidence |
| Target paths | `docs/reference/CVF_CGE_T2_CODEGRAPH_LPF_KGR_ADAPTATION_CONTRACT_2026-06-20.md`; `docs/reviews/CVF_CGE_T2_CODEGRAPH_LPF_KGR_ADAPTATION_CONTRACT_WORKER_RETURN_2026-06-20.md`; `docs/reviews/CVF_CGE_T2_CODEGRAPH_LPF_KGR_ADAPTATION_CONTRACT_COMPLETION_2026-06-20.md` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_CGE_T2_CODEGRAPH_LPF_KGR_ADAPTATION_CONTRACT_FOR_CLAUDE_2026-06-20.md`; `docs/baselines/CVF_GC018_CGE_T2_CODEGRAPH_LPF_KGR_ADAPTATION_CONTRACT_2026-06-20.md` |
| Before status evidence | clean worker execution base `cf2db0ff` reported by worker |
| After status evidence | pending closure set contains two worker artifacts and the Codex reviewer completion review |
| Diff evidence | documentation/reference artifact, worker-return artifact, and reviewer completion artifact only |
| Approval boundary | documentation/reference adaptation contract only |
| Claim boundary | no runtime/source implementation, MCP wiring, watcher/daemon, benchmark, provider/live proof, public-sync, ACE-R1 reopening, freeze, readiness, or universal governed-coding-control claim |
| Agent type | Claude worker plus Codex reviewer |
| Invocation ID | `cge-t2-codegraph-lpf-kgr-adaptation-contract-reference-2026-06-20` |
| Expected manifest | `docs/reference/CVF_CGE_T2_CODEGRAPH_LPF_KGR_ADAPTATION_CONTRACT_2026-06-20.md`; `docs/reviews/CVF_CGE_T2_CODEGRAPH_LPF_KGR_ADAPTATION_CONTRACT_WORKER_RETURN_2026-06-20.md`; `docs/reviews/CVF_CGE_T2_CODEGRAPH_LPF_KGR_ADAPTATION_CONTRACT_COMPLETION_2026-06-20.md` |
| Actual changed set | `docs/reference/CVF_CGE_T2_CODEGRAPH_LPF_KGR_ADAPTATION_CONTRACT_2026-06-20.md`; `docs/reviews/CVF_CGE_T2_CODEGRAPH_LPF_KGR_ADAPTATION_CONTRACT_WORKER_RETURN_2026-06-20.md`; `docs/reviews/CVF_CGE_T2_CODEGRAPH_LPF_KGR_ADAPTATION_CONTRACT_COMPLETION_2026-06-20.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename authorized |

## Claim Boundary

This contract authorizes vocabulary adaptation, field normalization, a
freshness/fallback rule, a no-authority rule, and a future checker candidate
ledger. It does not authorize:

- CodeGraph runtime adoption, install, init, or `.codegraph/` creation;
- edits under runtime extension, tools, scripts, MCP, or web UI paths;
- watcher/daemon, auto-config, benchmark proof, or provider/live proof;
- public-sync or public-facing claims;
- ACE-R1 reopening;
- freeze, readiness, production, or universal governed-coding-control claims;
- implementation of the future checker candidates.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance external absorption reference-contract tranche. No
public-sync remote, public commit, public artifact path, or public claim is
authorized.
