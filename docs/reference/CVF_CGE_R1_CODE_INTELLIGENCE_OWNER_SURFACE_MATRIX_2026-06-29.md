# CVF CGE-R1 Code Intelligence Owner-Surface Matrix

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE_PENDING_REVIEW

docType: reference

Date: 2026-06-29

Batch ID: CGE-R1

rawMemoryReleased: false

Produced by: docs/reviews/CVF_CGE_R1_CODEGRAPH_FULL_REABSORPTION_REVIEW_2026-06-29.md

## Purpose

Provide a CVF-owned, CVF-language reference for code-intelligence concepts
absorbed from the CodeGraph local snapshot at
`.private_reference/legacy/CVF 28.06/CodeGraph/CVF_Code_Intelligence_Capability`.

This document does NOT activate any CodeGraph capability. It is a documentation
and reference artifact only. All concepts are expressed in CVF language.
No CodeGraph-specific tooling, runtime, or package is required to read or
apply this document.

## Applies To

This reference document applies to all CVF agents, workers, reviewers, and orchestrators
operating on code-intelligence tasks in the CVF private provenance workspace.
Coverage: all concepts absorbed from the CodeGraph local snapshot (89 files) via CGE-R1.
Scope boundary: documentation and governance doctrine only; no runtime or package activation.

EPISTEMIC_PROCESS_NA_WITH_REASON: reference/documentation artifact; no worker return or completion claim; no predictions requiring evidence comparison or contradiction disposition; epistemic evidence-block pattern is not applicable for a CVF-owned reference surface document.

## Source Authority

| Source | Path or value | Role |
|---|---|---|
| CGE-R1 reabsorption review | docs/reviews/CVF_CGE_R1_CODEGRAPH_FULL_REABSORPTION_REVIEW_2026-06-29.md | Parent absorption review |
| CGE-T2 adaptation contract | docs/reference/CVF_CGE_T2_CODEGRAPH_LPF_KGR_ADAPTATION_CONTRACT_2026-06-20.md | Prior CGE adaptation record |
| CGE-T1 triage completion | docs/reviews/CVF_CGE_T1_CODEGRAPH_EXTERNAL_ABSORPTION_TRIAGE_MATRIX_COMPLETION_2026-06-20.md | Prior CGE triage record |
| Local snapshot | .private_reference/legacy/CVF 28.06/CodeGraph/CVF_Code_Intelligence_Capability | Bounded source corpus (89 files) |
| Active work order | docs/work_orders/CVF_AGENT_WORK_ORDER_CGE_R1_CODEGRAPH_FULL_REABSORPTION_REVIEW_2026-06-29.md | Dispatch authority |

## CVF Code Intelligence Capability Principles

These principles are expressed in CVF language, absorbed from `README.md` and
`docs/reference/CVF_CODE_INTELLIGENCE_CAPABILITY_PACKAGE_2026-06-19.md`.

**Root principle:** CVF governance is the source of trust. Graph-assisted
code-intelligence is an optional enhancement; it does not replace CVF governed
evidence or override CVF approval flow.

**Allowed query operations:**
- symbol_lookup: locate a named symbol in the codebase
- route_lookup: find the handler for an API route
- callers: find callers of a symbol
- callees: find callees of a symbol
- dependency_trace: trace the dependency chain for a path
- impact_radius: find all files affected by a change to a symbol or path
- test_surface: find tests covering a symbol or path
- risky_change_surface: find high-risk change areas
- graph_status: report current index status
- graph_receipt_create: produce a timestamped graph context receipt

**Forbidden operations:**
- direct_file_mutation: code intelligence is read-only
- auto_commit: graph results must not drive automated commits
- auto_merge: graph results must not drive automated merges
- direct_provider_call_without_cvf: all provider calls must route through CVF
- query_outside_work_order_scope: queries must be bounded by work order scope
- trusted_freeze_with_stale_graph: stale index must not be used for freeze trust

## Claim Boundary Doctrine

Absorbed from `docs/reference/CVF_CODE_INTELLIGENCE_CLAIM_BOUNDARY_2026-06-19.md`.

A CVF-governed code-intelligence claim is only valid when:
1. A live graph index is available (indexStatus = fresh or stale-with-fallback).
2. A graph context receipt has been produced and attached to the work order.
3. The query scope is bounded by the active work order.
4. No mutation or commit has been triggered by the graph result.

If no graph index exists, the worker must not claim graph-backed impact analysis.
The worker may use static file inspection as fallback evidence and must label it
as `FALLBACK_STATIC_EVIDENCE` in the work order packet.

Overclaim prevention: do not claim "no other files affected" based on graph
results alone. Graph results are advisory; the worker must cross-check against
worktree diff and known dependency patterns.

## Graph Index Staleness Policy

Absorbed from `docs/reference/CVF_GRAPH_STALENESS_AND_SYNC_POLICY_2026-06-19.md`.

### Index States

| State | Meaning | Worker action |
|---|---|---|
| fresh | Index is current; last reindex within acceptable window | Query permitted; receipt required |
| stale | Index exists but may be outdated (new commits since last index) | Query permitted with fallback evidence; receipt must include staleness warning |
| unknown | Index status cannot be determined | Treat as stale; require fallback evidence |
| absent | No index exists | Graph query blocked; use fallback static evidence; label FALLBACK_STATIC_EVIDENCE |

### Block Conditions

Graph-assisted freeze is BLOCKED when:
- indexStatus = absent
- indexStatus = stale AND fallbackEvidenceExists = false
- Requested phase = FREEZE AND indexStatus != fresh

### Fallback Discipline

When graph index is absent or stale without fallback, the worker must:
1. State `FALLBACK_STATIC_EVIDENCE` in the work order packet.
2. List the static files inspected as the basis for impact claim.
3. Not claim graph-backed confidence.

## Query Type Taxonomy and Receipt Vocabulary

Absorbed from `docs/reference/CVF_GRAPH_CONTEXT_QUERY_SCHEMA_2026-06-19.md`
and `docs/reference/CVF_GRAPH_CONTEXT_RECEIPT_PROTOCOL_2026-06-19.md`.

### Required Receipt Fields

| Field | Description |
|---|---|
| receiptId | Unique identifier for this graph context receipt |
| createdAt | ISO-8601 timestamp of receipt creation |
| cvfSessionId | Active CVF session identifier |
| workOrderId | Work order this receipt is attached to |
| repoHash | Git hash of repo at query time |
| indexId | Identifier of the graph index used |
| indexVersion | Version of the graph index |
| indexStatus | fresh / stale / unknown / absent |
| queryType | One of the allowed query operation types above |
| queryInput | Structured input (symbol, path, route, etc.) |
| scopeBoundary | Allowed paths / forbidden paths from work order |
| resultSummary | Human-readable summary of query result |
| confidence | high / medium / low / none |
| freezeAllowed | REJECTED_AS_AUTHORITY_SIGNAL: do not use as a CVF receipt authority field; freeze trust must come from CVF review/freeze evidence outside the graph receipt |

### Receipt Requirement Rule

Every graph-assisted code task must produce a receipt before any freeze-gate
trust is extended. A receipt not attached to a work order is not CVF-governed
evidence. Receipts are one-shot: re-querying after index change requires a new
receipt.

## Freeze Protocol Doctrine

Absorbed from `docs/protocols/CVF_CODE_INTELLIGENCE_FREEZE_PROTOCOL.md`.

A graph-assisted task must NOT proceed to the freeze phase unless:
1. indexStatus = fresh (or stale with accepted fallback evidence).
2. A graph context receipt is attached to the work order.
3. The reviewer verifies direct-read fallback, scope, affected files, and test
   surface evidence under CVF freeze/review authority.

The source pack contains a prototype `freezeAllowed` field, but CGE-T2 already
rejected any `freezeAllowed` or equivalent field as a freeze-grant authority
signal. CGE-R2 confirms the correction: future CVF-owned receipts may record
graph confidence, warning, fallback, reviewRequired, and decisionSupported
fields, but no graph receipt field may grant freeze, closure, approval, or
scope expansion.

If these conditions are not met, the task is FREEZE_BLOCKED_STALE_GRAPH.
The worker must either wait for a fresh index or proceed with FALLBACK_STATIC_EVIDENCE
and explicit FREEZE_BLOCKED_GRAPH_ABSENT label.

## Work Order Integration Protocol

Absorbed from `docs/protocols/CVF_CODE_INTELLIGENCE_WORK_ORDER_PROTOCOL.md`.

Work orders that require graph-assisted analysis must include a header block:

```
code_intelligence_required: true
graph_query_plan: <inline table or artifact path>
receipt_attachment_required: true
```

Workers executing graph-assisted work orders must:
1. Check index status before beginning query planning.
2. Produce a graph query plan with query type, input, scope, and fallback.
3. Execute queries within the bounded scope only.
4. Attach the resulting receipt to the work order packet.

## Review Protocol Doctrine

Absorbed from `docs/protocols/CVF_GRAPH_BACKED_REVIEW_PROTOCOL.md`.

Graph-backed reviews must include an impact-radius check before sign-off.
The reviewer must verify:
1. Receipt is present and indexStatus is acceptable for the phase.
2. Impact-radius result does not include files outside the declared work order scope.
3. If impact radius is wider than expected, the reviewer must request a scope expansion
   work order or reject the review.

## Artifact Shape Doctrine

Absorbed from the six `docs/templates/**` files and four example artifacts.

Code-intelligence evidence must be split into bounded artifact families instead
of a single broad prose claim:

| Artifact family | Required CVF meaning | Required boundary |
|---|---|---|
| Graph context receipt | proves which graph query was run, against which repo hash/index, within which scope boundary, and with which confidence | advisory evidence only; direct reads still required before modification |
| Graph query plan | lists query type, input, reason, allowed scope, max depth, expected output, and fallback | no query outside work-order scope |
| Impact radius report | records target, primary impact, secondary impact, tests, routes/APIs, shared dependencies, risks, unknowns, and review recommendation | cannot claim exhaustive impact without fallback/direct-read support |
| Stale index warning | records stale/unknown/branch-changed/metadata-missing triggers, affected scope, required fallback, resolution evidence, and final status | freeze remains blocked unless staleness is resolved or fallback is accepted |
| Test surface report | records existing tests, missing tests, suggested tests, required action, notes, and confidence | does not replace actual test execution evidence |
| Code-intelligence work order context | binds objective, scope boundary, query plan, receipts, expected affected files, direct reads, forbidden actions, test surface, fallback plan, review checklist, freeze conditions, and claim boundary | graph context remains advisory and may not mutate files or expand scope |

Template/example values are adapted as doctrine only. The external templates and
example data are not imported, copied as CVF templates, or made executable in
this tranche.

## Schema Vocabulary Doctrine

Absorbed from the six JSON schema files under
`EXTENSIONS/CVF_CODE_INTELLIGENCE_CAPABILITY/src/schemas/`.

Future CVF graph-assisted work should preserve these field families when a
separate runtime or package tranche is authorized:

| Schema family | Required field families | Key enums or constants |
|---|---|---|
| Graph context receipt | receiptId, createdAt, cvfSessionId, workOrderId, repoHash, indexId, indexVersion, indexStatus, queryType, queryInput, scopeBoundary, resultSummary, affectedFiles, confidence, warnings, fallbackAction, usedInPhase, decisionSupported, reviewRequired | indexStatus=fresh/stale/partial/missing/unknown; confidence=high/medium/low/unknown; source `freezeAllowed` is rejected as an authority field |
| Graph query | queryId, queryType, input, scopeBoundary, usedInPhase | queryType=symbol_lookup/route_lookup/callers/callees/dependency_trace/impact_radius/test_surface/risky_change_surface/graph_status; usedInPhase=INTAKE/DESIGN/SPEC/WORK_ORDER/BUILD/REVIEW/FREEZE |
| Graph query result | queryId, resultId, affectedFiles, nodes, edges, confidence, warnings, optional routes/tests/tokenBudgetEstimate | confidence=high/medium/low/unknown |
| Impact radius | reportId, workOrderId, target, primaryFiles, secondaryFiles, testFiles, routes, sharedDependencies, riskNotes, confidence, recommendation | recommendation=pass_to_work_order/require_direct_read/require_scope_revision/block_freeze |
| Staleness warning | warningId, indexId, indexVersion, detectedAt, severity, trigger, affectedScope, requiredFallback, finalStatus | severity=low/medium/high/blocking; requiredFallback=refresh_index/direct_file_read/manual_review/narrow_scope/block_freeze; source `freezeAllowed=false` adapts only as blocked-freeze doctrine, not as a field to preserve |

## Query Planning And Fallback Doctrine

CGE-R2 re-scan read the previously rejected TypeScript planner, confidence,
packager, policy, service, and fixture scaffolds. Direct import remains
rejected, but the following CVF-native doctrine is retained.

### Task-Type Query Planning Heuristic

Absorbed from
`EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/context_builder/graph/graph-query-planner.ts`.

| Task class | Recommended graph-query plan when a future graph lane is authorized | CVF boundary |
|---|---|---|
| `debug` | symbol lookup, impact radius, test surface | advisory only; direct source read still required before edit/review claims |
| `refactor` | dependency trace, impact radius, test surface | advisory only; no automatic scope expansion |
| `review` or `change_risk` | impact radius and risky-change surface | reviewer must verify changed paths against work-order scope |
| `test` | test surface | does not replace actual test execution evidence |
| `onboarding` | symbol lookup | orientation only; no freeze or implementation authority |

Default max-depth guidance from the source planner is 2. The source scope
policy blocks maxDepth greater than 4. CVF adopts this as future work-order
planning doctrine only; no query runner or max-depth checker is implemented by
CGE-R2.

### Confidence And Direct-Read Fallback Rule

Absorbed from `graph-confidence-evaluator.ts` and `graph-context-packager.ts`.

| Source condition | CVF-adapted confidence meaning | Required CVF action |
|---|---|---|
| indexStatus is `missing` or `unknown` | unknown | direct-read fallback required; no graph-backed claim |
| indexStatus is `stale` or `partial` | low | direct-read fallback required; review/freeze trust blocked until fallback is accepted |
| unsupported language | low | direct-read fallback required |
| warnings are present | medium at best | direct-read fallback required before review/freeze claim |
| affectedFilesCount is zero on a fresh index | medium, not exhaustive proof | do not claim no impact without direct-read or diff evidence |
| clean fresh graph with affected files | high advisory confidence | still advisory; cannot bypass policy, review, or tests |

Direct-read-required rule: future graph-context packages must set the practical
equivalent of directReadRequired when confidence is not high or warnings are
present. This is doctrine only in CGE-R2; no runtime package is active.

### Trace Field Minimum

Absorbed from `graph-to-work-order-trace-policy.ts`.

Future graph-supported code decisions should trace at least:
`graphQueryId`, `graphResultId`, `receiptId`, `workOrderStepId`,
`changedFile`, and `reviewCheckId`. `freezeRecordId` may appear only as a
separate CVF freeze-evidence reference; it must not turn graph output into
freeze authority.

### Staleness Trigger Vocabulary

Absorbed from `staleness-warning.ts` and `graph-staleness-service.ts`.

Future staleness records should recognize these trigger labels:
`file_modified_after_index`, `new_file_not_indexed`,
`deleted_file_still_in_index`, `git_branch_changed`, `lockfile_changed`,
`framework_config_changed`, `route_config_changed`, `test_config_changed`,
`index_metadata_missing`, and `unknown`.

Missing index metadata is treated as `unknown` plus blocking fallback
requirement, not as permission to continue with graph-backed confidence.

### Value-Probe Fixture Blueprint

The source fixture READMEs are placeholders, but their scenario list is useful
for a future CGE-R2 value probe. A bounded value probe should include at least
one small TypeScript app, one small Python/FastAPI app, and one stale-index
case covering symbol lookup, route lookup, dependency trace, impact radius,
test surface detection, and stale index detection.

This blueprint does not import fixture code and does not authorize benchmark,
runtime, or CI wiring.
| Test surface | reportId, workOrderId, target, existingTests, missingTests, suggestedTests, requiredAction, confidence | requiredAction=run_existing/add_or_update/document_not_available/manual_review |

Schema values are not imported as validation schemas in CGE-R1. They are
captured as CVF-owned vocabulary and future contract candidates only.

## Guard Doctrine

Absorbed from `governance/guards/*.md` and `governance/registry/code-intelligence-guard-registry.json`.

### Code Intelligence Boundary Guard

Source: `governance/guards/CVF_CODE_INTELLIGENCE_BOUNDARY_GUARD.md`

Rule: Code intelligence is read-only. Any operation that includes mutation=true is BLOCKED.
Default policy: read_only=true, mutation_allowed=false, receipt_required=true.

CVF application: workers may not use graph context to drive direct file mutations,
auto-commits, or auto-merges. All graph results are advisory inputs to the worker's
governed decision.

### Graph Context Staleness Guard

Source: `governance/guards/CVF_GRAPH_CONTEXT_STALENESS_GUARD.md`

Rule: A work order may not proceed to the freeze phase if the graph index is stale
or absent without accepted fallback evidence. StalenessGuard blocks freeze when
indexStatus != fresh AND fallbackEvidenceExists = false.

CVF application: work orders using graph context must carry staleness check evidence
before freeze sign-off.

### Graph Query Scope Guard

Source: `governance/guards/CVF_GRAPH_QUERY_SCOPE_GUARD.md`

Rule: All graph queries must be bounded by the scope declared in the active work order
(allowedPaths, forbiddenPaths, maxDepth). Queries outside the declared scope are blocked.

CVF application: graph query plans in work orders must declare explicit scope boundaries.
Workers must not execute queries against paths not covered by the work order scope.

### Graph-to-Work-Order Trace Guard

Source: `governance/guards/CVF_GRAPH_TO_WORK_ORDER_TRACE_GUARD.md`

Rule: Every graph query result used in a work order must be traceable to an authorizing
work order. Untraced graph results must not be cited as evidence.

CVF application: receipts must carry workOrderId. If a graph result is used in a
work order packet, the receipt must be attached or cited by receiptId.

## Benchmark Discipline

Absorbed from `docs/reference/CVF_CODE_INTELLIGENCE_BENCHMARK_PLAN_2026-06-19.md`.

**Rule:** No benchmark claim about code intelligence speed, accuracy, or coverage
may be made without a live graph index and a recorded benchmark receipt.

**CVF application:** mock-mode or scaffold-only benchmark results are not valid
CVF-governed performance evidence. Any code intelligence benchmark must use a
real graph index against a real codebase fixture and produce a receipt.

This benchmark discipline is consistent with CVF's broader Mandatory Live
Governance Proof requirement (AGENTS.md).

## Capability Package Manifest Doctrine

Absorbed from `EXTENSIONS/CVF_CODE_INTELLIGENCE_CAPABILITY/package.manifest.json`.

| Field | Value in snapshot |
|---|---|
| capability_id | cvf.code_intelligence |
| version | 2026.06.19 |
| status | spec_prototype_scaffold |
| root_principle | CVF governance remains the source of trust |

The `status: spec_prototype_scaffold` confirms this is NOT a production-ready
capability. Any future activation must go through ASSF package activation
work order and be authorized by a GC-018 baseline.

## Owner-Surface Matrix

The following table maps CVF code-intelligence concept domains to their
CVF owner surfaces as established by CGE-R1.

| Concept domain | CVF owner surface (this doc) | Prior surface | Surface status |
|---|---|---|---|
| Claim boundary doctrine (no graph = no graph claim) | Section: Claim Boundary Doctrine | CGE-T1/T2 (partial) | ACTIVE_REFERENCE |
| Index staleness states and block conditions | Section: Graph Index Staleness Policy | CGE-T2 adaptation contract | ACTIVE_REFERENCE |
| Receipt protocol: required fields and one-shot rule | Section: Query Type Taxonomy and Receipt Vocabulary | CGE-T2 adaptation contract | ACTIVE_REFERENCE |
| Freeze protocol: receipt required before freeze trust | Section: Freeze Protocol Doctrine | New (not in CGE-T1/T2) | ACTIVE_REFERENCE |
| Work order integration header and query plan | Section: Work Order Integration Protocol | New (not in CGE-T1/T2) | ACTIVE_REFERENCE |
| Review protocol: impact-radius check before sign-off | Section: Review Protocol Doctrine | New (not in CGE-T1/T2) | ACTIVE_REFERENCE |
| Guard doctrine: boundary, staleness, scope, trace | Section: Guard Doctrine | New (not in CGE-T1/T2) | ACTIVE_REFERENCE |
| Benchmark discipline | Section: Benchmark Discipline | New (not in CGE-T1/T2) | ACTIVE_REFERENCE |
| Capability package manifest structure | Section: Capability Package Manifest Doctrine | New (not in CGE-T1/T2) | ACTIVE_REFERENCE |
| Allowed/forbidden operations | Section: CVF Code Intelligence Capability Principles | CGE-T1/T2 (partial) | ACTIVE_REFERENCE |
| Template structures (6 files) | Sections: Artifact Shape Doctrine and Schema Vocabulary Doctrine | Fully adapted in CGE-R1 reviewer repair | ACTIVE_REFERENCE |
| Example artifacts (4 files) | Section: Artifact Shape Doctrine | Fully adapted in CGE-R1 reviewer repair | ACTIVE_REFERENCE |
| JSON schema definitions (6 files) | Section: Schema Vocabulary Doctrine | Fully adapted in CGE-R1 reviewer repair | ACTIVE_REFERENCE |
| Runtime TypeScript scaffolds (54 files) | REJECTED_DIRECT_IMPORT | CGE-T1 REJECT | REJECTED |

## Package Candidate Ledger

| Candidate | Status | Activation path |
|---|---|---|
| cvf.code_intelligence (package.manifest.json) | PACKAGE_CANDIDATE; converted by CGE-R2 into metadata-only ASSF registry candidate `cvf-code-intelligence-context-review`; not activated | Separate ASSF package promotion, package-root, resolver, runtime, and activation work orders required before use |

## Runtime Candidate Ledger

| Candidate | Source file | Status | Activation path |
|---|---|---|---|
| GraphContextResolver | src/services/graph-context-resolver.ts | RUNTIME_CANDIDATE; not activated | Separate runtime work order + live proof |
| ImpactAnalysisService | src/services/impact-analysis-service.ts | RUNTIME_CANDIDATE; not activated | Same |
| GraphStalenessService | src/services/graph-staleness-service.ts | RUNTIME_CANDIDATE; not activated | Same |
| CodeGraphAdapter | src/adapters/codegraph-adapter.ts | RUNTIME_CANDIDATE; not activated | Same + external CodeGraph install |
| MCPGraphQueryAdapter | src/adapters/mcp-graph-query-adapter.ts | RUNTIME_CANDIDATE; not activated | Same + MCP-compatible server |

## Checker Candidate Ledger

| Candidate | Source guard | Status | Implementation path |
|---|---|---|---|
| Code intelligence boundary checker | CVF_CODE_INTELLIGENCE_BOUNDARY_GUARD.md | CHECKER_CANDIDATE; not implemented | Separate GC-018 + machine-gate work order |
| Graph staleness checker | CVF_GRAPH_CONTEXT_STALENESS_GUARD.md | CHECKER_CANDIDATE; not implemented | Same |
| Graph query scope checker | CVF_GRAPH_QUERY_SCOPE_GUARD.md | CHECKER_CANDIDATE; not implemented | Same |
| Graph-to-work-order trace checker | CVF_GRAPH_TO_WORK_ORDER_TRACE_GUARD.md | CHECKER_CANDIDATE; not implemented | Same |

## Rejected Direct Import Ledger

All 54 TypeScript source files and 1 CI workflow from the snapshot were REJECTED
for direct import. See the full rejection list in the parent review artifact
`docs/reviews/CVF_CGE_R1_CODEGRAPH_FULL_REABSORPTION_REVIEW_2026-06-29.md`,
Direct Import Rejection Ledger section.

Rejection principle: CVF does not import external TypeScript scaffolds directly
into its runtime extensions, governance checkers, or CI configuration without
an authorized, governed work order that explicitly activates each component.

## External Knowledge Intake Routing

Source: operator-provided external folder (local snapshot)

Routing: `.private_reference/legacy/CVF 28.06/CodeGraph/CVF_Code_Intelligence_Capability`
absorbed through CGE-T0 -> CGE-T1 -> CGE-T2 -> CGE-R1 chain.

CGE-R1 extends prior coverage to all 89 snapshot files. No prior CGE tranche
decision is contradicted. All new ADAPTED items are captured in this artifact.

## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| docs/reference/*.md (7 files) | Claim boundary, staleness policy, receipt vocabulary, benchmark doctrine, capability principles, absorption mapping | DOCTRINE_ADAPTED | This document (sections above) | No further action; owner-surface matrix is the CVF surface | Not a runtime or package artifact |
| governance/guards/*.md (4 files) | Guard doctrine for boundary, staleness, scope, trace | DOCTRINE_ADAPTED | This document (Guard Doctrine section) | No further action for doctrine; checker implementation deferred | Not a runtime or package artifact |
| governance/registry/*.json (1 file) | Default policy: read_only=true, mutation_allowed=false, receipt_required=true | DOCTRINE_ADAPTED | This document (Guard Doctrine / Boundary Guard subsection) | No further action | Not a runtime or package artifact |
| docs/protocols/*.md (3 files) | Freeze, work order, and review protocol doctrine | DOCTRINE_ADAPTED | This document (protocol sections) | No further action | Not a runtime or package artifact |
| docs/templates/**/*.template.md and docs/templates/work-orders/*.template.md | Evidence artifact shapes for receipts, query plans, impact reports, stale warnings, test-surface reports, and graph-context work orders | DOCTRINE_ADAPTED | This document (Artifact Shape Doctrine) | No further action; do not copy external templates directly | Not a runtime or package artifact |
| examples/* | Concrete examples of scope-bounded query planning, receipt attachment, direct-read fallback, and freeze conditions | DOCTRINE_ADAPTED | This document (Artifact Shape Doctrine) | No further action; example data is not imported | Not a runtime or package artifact |
| src/schemas/*.schema.json | Schema field families and enums for graph receipt/query/result/impact/staleness/test-surface artifacts | DOCTRINE_ADAPTED | This document (Schema Vocabulary Doctrine) | No further action; no schema validator is implemented | Not a runtime or package artifact |
| README.md + package.manifest.json | Root principle, allowed/forbidden ops, capability_id, status=spec_prototype_scaffold | DOCTRINE_ADAPTED | This document (Principles and Capability sections) | No further action for doctrine | Not a runtime artifact |
| package.manifest.json (capability structure) | capability_id and manifest structure | PACKAGE_CANDIDATE | `docs/reference/agent_system_skills/registry/entries/cvf-code-intelligence-context-review.json` plus this document | Metadata-only ASSF candidate added by CGE-R2; promotion/activation still requires fresh governed work | Candidate only; not activated |
| LPF query planner, confidence evaluator, packager, trace policy, staleness service, and fixture READMEs | task-type query plan, direct-read-required rule, trace minimum, staleness trigger vocabulary, and value-probe fixture blueprint | DOCTRINE_ADAPTED | This document (Query Planning And Fallback Doctrine) | Use as source-backed planning doctrine; future value probe may consume it | No runtime, query execution, checker, CI, or package activation |
| src/services/*.ts (7 files) | GraphContextResolver, ImpactAnalysisService, etc. as runtime service concepts | RUNTIME_CANDIDATE | This document (Runtime Candidate Ledger) | Separate runtime work order with live proof | REJECTED direct import; runtime candidate only |
| governance/guards/*.md (checker logic) | Guard enforcement logic maps to CVF Python checker candidates | CHECKER_CANDIDATE | This document (Checker Candidate Ledger) | Separate GC-018 + machine-gate work order | Not a runtime artifact |
| .github/workflows/code-intelligence-check.yml | External CI workflow | REJECT_DIRECT_IMPORT | None | No CVF action | No package or runtime value |
| TREEVIEW.md + EXTENSIONS README | Structural inventory only; no new concepts | NO_PACKAGE_OR_RUNTIME_VALUE | None | No action | None |

## Template Example And Schema Adaptation Ledger

These 16 files were initially deferred by the worker, then reviewer-read and
adapted into the doctrine sections above.

| Group | Count | Adapted value | Remaining action |
|---|---|---|---|
| docs/templates (6 files) | 6 | artifact families, required evidence sections, fallback rules, freeze conditions, direct-read requirement | No follow-up required for doctrine; executable template creation requires a fresh work order |
| examples (4 files) | 4 | scope-bounded query examples, receipt attachment, direct-read fallback, freeze-condition examples | No follow-up required for doctrine; onboarding examples require a fresh public-safe work order |
| src/schemas (6 JSON schema files) | 6 | field families and enums for receipt, query, result, impact, staleness, and test-surface artifacts | No follow-up required for doctrine; schema validator implementation requires a fresh runtime/checker work order |

Total deferred: 0 files. Total reviewer-adapted from this group: 16 files.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

This artifact references `.private_reference/legacy/` source content and is
produced from the private provenance repository only. No public-sync, public
catalog claim, or public README update was made. Next action: reviewer determines
if this owner-surface matrix is suitable for public-sync after review acceptance.

## Claim Boundary

This document is documentation-only. No CodeGraph capability is activated,
installed, or wired by this artifact. No runtime, package, checker, resolver,
CLI adapter, MCP adapter, or production deployment is claimed.

The concepts in this document represent CVF-owned documentation of code-intelligence
governance doctrine absorbed from the bounded local snapshot. They are valid
reference material for future CVF work orders that choose to implement graph-assisted
code intelligence under proper governed activation.

governance/compat/check_markdown_structural_completeness.py
