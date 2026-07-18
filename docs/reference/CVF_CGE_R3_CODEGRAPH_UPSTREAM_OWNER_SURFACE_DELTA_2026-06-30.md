# CVF CGE-R3 CodeGraph Upstream Owner-Surface Delta

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE_PENDING_REVIEW

docType: reference

Date: 2026-06-30

Batch ID: CGE-R3

Produced by: docs/reviews/CVF_CGE_R3_CODEGRAPH_UPSTREAM_SOURCE_MIRROR_ABSORPTION_REVIEW_2026-06-30.md

rawMemoryReleased: false

## Purpose

Record the CVF-owned delta learned from the pinned upstream CodeGraph source
mirror. This document supplements CGE-R1 and CGE-R2 with current upstream
facts, while preserving the same boundary: CodeGraph remains advisory external
material and does not become CVF runtime, package, checker, provider, public,
or production authority.

## Applies To

This reference applies to CVF agents, dispatchers, workers, reviewers, and
future work-order authors evaluating code-intelligence doctrine or CodeGraph
candidate value. It is documentation/reference only and does not create a
runtime graph engine, package root, resolver, external adapter, checker, public
artifact, or production claim.

## Source Authority

| Source | Path or value | Role | Authority boundary |
|---|---|---|---|
| CGE-R3 worker review | docs/reviews/CVF_CGE_R3_CODEGRAPH_UPSTREAM_SOURCE_MIRROR_ABSORPTION_REVIEW_2026-06-30.md | parent absorption review | CVF-owned worker return pending reviewer acceptance |
| CGE-R3 work order | docs/work_orders/CVF_AGENT_WORK_ORDER_CGE_R3_CODEGRAPH_UPSTREAM_SOURCE_MIRROR_ABSORPTION_2026-06-30.md | dispatch authority | worker scope and forbidden-scope contract |
| Source mirror index | .private_reference/source_mirrors/INDEX.md | mirror ledger | source mirror control-plane only |
| Upstream source mirror | .private_reference/source_mirrors/colbymchenry__codegraph | advisory source corpus | external source facts only; not CVF authority |
| CGE-R1 owner matrix | docs/reference/CVF_CGE_R1_CODE_INTELLIGENCE_OWNER_SURFACE_MATRIX_2026-06-29.md | prior snapshot baseline | CVF-owned prior doctrine |
| CGE-R2 correction review | docs/reviews/CVF_CGE_R2_CODEGRAPH_RESCAN_VALUE_AUDIT_AND_CORRECTION_2026-06-29.md | prior correction | rejects graph-derived freeze or approval authority |
| ASSF package contract | docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md | package lifecycle contract | candidate only; no package activation |
| Current ASSF candidate | docs/reference/agent_system_skills/registry/entries/cvf-code-intelligence-context-review.json | metadata-only package candidate | no mutation in CGE-R3 |

Provider-specific upstream guidance files and provider-local memories are not
source authority for this delta.

## Delta Table Against CGE-R1 And CGE-R2

| Prior surface | Prior position | CGE-R3 upstream delta | Disposition |
|---|---|---|---|
| CGE-R1 owner matrix | Graph context is optional advisory evidence with receipts, staleness, fallback, and no mutation authority. | Current upstream reinforces the same boundary and adds more concrete MCP/CLI/runtime design signals. | CONFIRMED_AND_EXTENDED |
| CGE-R1 allowed operations | symbol, route, caller/callee, dependency, impact, test surface, graph status, receipt planning. | Upstream CLI/MCP surfaces align with these query families and add default-one-tool exposure through `codegraph_explore`. | CONFIRMED_AND_EXTENDED |
| CGE-R1 staleness policy | absent/stale/unknown graph requires fallback and explicit warning. | Upstream has pending-file banners, connect-time catch-up, manual status/sync fallback, and watcher degradation warnings. | EXTENDED |
| CGE-R2 correction | `freezeAllowed` or any equivalent graph field cannot grant freeze/approval authority. | Upstream source does not change this; graph output remains advisory and must be checked by CVF authority. | CONFIRMED |
| CGE-R2 package candidate | metadata-only `cvf-code-intelligence-context-review` remains candidate. | Candidate can be enriched with current package identity, default MCP surface doctrine, and language/framework coverage. | PACKAGE_CANDIDATE_ONLY |
| CGE-R2 runtime lane | runtime value probe remains parked. | Upstream source gives stronger runtime family map: CLI, MCP, daemon, watcher, SQLite, extraction, resolver, installer. | RUNTIME_CANDIDATE_ONLY |
| CGE-R2 checker lane | staleness/scope/security/response-shape/checker ideas remain parked. | Add specific candidate checks for default MCP exposure, staleness/fallback, hash method, read-deny rejection, and graph evidence overclaim. | CHECKER_CANDIDATE_ONLY |

## Doctrine Additions Or Confirmations

| Doctrine | CGE-R3 statement | Status |
|---|---|---|
| Minimal default tool surface | Future CVF graph adapters should prefer a small default tool set with explicit allowlist expansion, not a broad menu by default. | DOCTRINE_ADAPTED |
| Explore-first context | A single high-context graph answer can reduce discovery chatter only when it includes enough source, call path, and blast-radius information to avoid read-back loops. | DOCTRINE_ADAPTED |
| Read-parity shape | If CVF ever exposes graph-backed file source, it should preserve line-numbered, direct-read-compatible output and still allow direct reads as fallback. | DOCTRINE_ADAPTED |
| Explicit staleness | A graph result touching pending files must visibly warn the agent and route to direct-read/manual-sync fallback. | DOCTRINE_ADAPTED |
| Connect-time catch-up | First query after session start should reconcile working tree state before graph trust is extended. | DOCTRINE_ADAPTED |
| Visible degradation | Watcher or daemon degradation should become an explicit status, not silent stale behavior. | DOCTRINE_ADAPTED |
| Output budget discipline | Graph context should scale by repo size and answer shape, with caps and metadata visibility rules. | DOCTRINE_ADAPTED |
| No graph authority escalation | Graph results cannot grant freeze, approval, scope expansion, commit, provider, public, or production authority. | CONFIRMED |
| Runtime/source separation | Upstream package existence is not CVF package activation or runtime permission. | CONFIRMED |

## Package Candidate Delta

| Candidate field family | Current candidate state | CGE-R3 enrichment candidate | Boundary |
|---|---|---|---|
| Provenance | CGE-R1/CGE-R2 source artifacts and legacy snapshot | add CGE-R3 worker review and upstream source mirror commit as later source artifacts | separate package work order required |
| Purpose and triggers | code intelligence context review, impact, test surface, stale graph fallback | add minimal-default-tool, read-parity, staleness banner, connect-time catch-up, and output-budget triggers | no registry mutation here |
| External disposition | DEFERRED_WITH_REASON | keep deferred; add explicit allowlist/default-one-tool adapter condition | no CLI/MCP adapter |
| Acceptance evidence | CGE-R2 accepted as candidate evidence | CGE-R3 can become additional evidence after reviewer acceptance | no ACTIVE state |
| Capability boundary | no runtime graph execution or MCP call | preserve and sharpen with install/init/MCP/watcher/daemon/SQLite prohibitions | no package root or SKILL.md |

Package disposition: PACKAGE_CANDIDATE only.

## Runtime Candidate Delta

| Runtime candidate | Source signal | CVF-owned interpretation |
|---|---|---|
| CLI command layer | upstream `codegraph` bin and command definitions | candidate for future local graph command adapter only under fresh work order |
| MCP server/tool layer | default `codegraph_explore`, optional narrower tools | candidate for external/internal adapter design; no current projection |
| Daemon/proxy/liveness layer | MCP daemon, proxy, ppid/liveness watchdogs | candidate runtime lifecycle concern; requires action-authority review |
| SQLite graph store | nodes/edges/files/unresolved refs/FTS/project metadata | candidate storage design input; no CVF SQLite index |
| Extraction/parser layer | tree-sitter extractors and WASM grammars | candidate source analysis engine; no binary import |
| Framework resolver layer | cross-framework and cross-language resolver families | candidate value-probe target for representative repos |
| Watch/sync layer | native watcher, pending files, catch-up, manual sync fallback | candidate freshness model; no watcher in CVF |
| Installer/agent target layer | agent config writers and install/uninstall flows | high-risk mutation surface; not imported or run |

Runtime disposition: RUNTIME_CANDIDATE only.

## Checker Candidate Delta

| Checker candidate | CVF purpose | Status |
|---|---|---|
| `check_graph_evidence_claim_boundary` | block graph result fields from granting freeze/approval/scope/commit authority | CANDIDATE_ONLY |
| `check_graph_staleness_fallback_receipt` | require index status, staleness warning, direct-read fallback, and receipt fields before graph-backed claims | CANDIDATE_ONLY |
| `check_code_intelligence_mcp_surface` | enforce minimal default tool exposure and explicit allowlist for future adapters | CANDIDATE_ONLY |
| `check_source_mirror_manifest_hash_method` | standardize path normalization and hash method for source mirror lanes | CANDIDATE_ONLY |
| `check_code_intelligence_package_runtime_separation` | prevent package identity from being used as runtime activation proof | CANDIDATE_ONLY |
| `check_no_blanket_read_deny_for_graph_context` | reject broad direct-read blocking unless a future value proof authorizes it | CANDIDATE_ONLY |

Checker disposition: CHECKER_CANDIDATE only.

## Rejected Direct Import Delta

| Source family | Rejection |
|---|---|
| Upstream TypeScript runtime source | REJECT_DIRECT_IMPORT because CVF needs native governed implementation and proof. |
| MCP server and daemon source | REJECT_DIRECT_IMPORT because adapter ingress, auth, action authority, and fallback contracts are absent. |
| SQLite schema/migrations | REJECT_DIRECT_IMPORT because storage topology and lifecycle require separate design. |
| Tree-sitter/WASM grammars | REJECT_DIRECT_IMPORT because binary/parser supply chain is out of scope. |
| Installer target writers | REJECT_DIRECT_IMPORT because they mutate local agent configuration. |
| Watcher/sync/liveness source | REJECT_DIRECT_IMPORT because background automation requires runtime authorization. |
| Benchmark/eval scripts | REJECT_DIRECT_IMPORT because upstream benchmark evidence is not CVF proof. |
| Provider-specific guidance | REJECT as CVF authority. |
| Website, assets, telemetry worker, workflows | REJECT_DIRECT_IMPORT or NO_PACKAGE_OR_RUNTIME_VALUE for CGE-R3. |

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| INTERNAL_AGENT | this owner-surface delta and CGE-R3 review | internal CVF agents may read doctrine and candidate classifications only | CGE-R3 worker review | no resolver, loader, package, runtime, or graph execution is implemented here | CONTRACT_ONLY |
| EXTERNAL_AGENT_CLI_MCP | future code-intelligence CLI/MCP adapter, not CGE-R3 | external use requires fresh adapter work order, ingress/auth/mutation/raw-data/public boundary, and tests | upstream MCP source and docs show candidate surface | no external adapter export or tool projection in CGE-R3 | DEFERRED_WITH_REASON |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md |
| Input type | external repo or copied folder |
| Chain map route | external repo or copied folder -> pinned source mirror -> external absorption core -> full manifest and processing ledger -> value conversion matrix -> CVF owner-surface delta -> future package/runtime/checker work order only if separately authorized |
| Matching local-view guard | `governance/compat/check_external_absorption_core.py`; `governance/compat/check_external_absorption_value_conversion.py`; `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_corpus_completeness_report_integrity.py`; `governance/compat/check_source_mirror_migration.py` |
| Owner surface | docs/reference/CVF_CGE_R3_CODEGRAPH_UPSTREAM_OWNER_SURFACE_DELTA_2026-06-30.md |
| Disposition | ACTIVE_REFERENCE_PENDING_REVIEW source-mirror absorption delta |
| Claim boundary | reference doctrine and candidate classification only; no runtime, package activation, checker wiring, provider/live proof, public-sync, MCP server, watcher, daemon, benchmark rerun, or production-readiness claim |

## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| MCP default-one-tool design | Minimal default agent surface reduces mis-picks and context bloat. | DOCTRINE_ADAPTED | this delta doctrine table | Use as future adapter design constraint. | No adapter implemented |
| Explore output budget source | Output budgets should scale by repo size and answer shape. | DOCTRINE_ADAPTED | this delta doctrine/checker tables | Future receipt/checker work can define budget fields. | Documentation/reference only |
| Staleness and catch-up design | Graph freshness must be visible and paired with fallback. | DOCTRINE_ADAPTED | this delta doctrine/checker tables | Future graph-evidence work order can require freshness receipts. | No watcher/sync execution |
| Package identity and current source mirror | CodeGraph remains useful package candidate input. | PACKAGE_CANDIDATE | future package candidate mutation only | Separate ASSF package work order. | No package root, SKILL.md, generated index, or activation |
| CLI/MCP/DB/extraction/resolution/watcher source | Current upstream is a strong runtime candidate. | RUNTIME_CANDIDATE | runtime candidate table | Separate runtime value-probe work order. | No install/init/index/MCP/daemon/SQLite |
| Tests and benchmark/eval material | Useful for future checker and value-probe design. | CHECKER_CANDIDATE | checker candidate table | Separate checker/value-probe work order. | No upstream tests or benchmark proof |
| Upstream implementation source | Direct import is unsafe and unauthorized. | REJECT_DIRECT_IMPORT | rejection table | Native CVF design only if later authorized. | No direct import |
| Provider-specific guidance and static assets | No CVF authority or runtime value. | NO_PACKAGE_OR_RUNTIME_VALUE | rejection/no-value rows | No follow-up needed for CGE-R3. | No runtime/package behavior |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this owner-surface delta references a private source mirror and private
provenance absorption surfaces. Public-safe export requires separate
public-sync authorization.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | CGE-R3 owner-surface delta for upstream CodeGraph source-mirror absorption |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE |
| receiptEvidence | CVF_RECEIPT_PRESENT - parent worker review records source mirror commit, manifest count, normalized worker hash, and processing ledger |
| actionEvidence | ACTION_EVIDENCE_PRESENT - this reference delta maps accepted value into CVF-owned package/runtime/checker/doctrine/rejection surfaces |
| invocationBoundary | local documentation/reference authoring only |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | CVF-owned doctrine and candidate classifications from advisory external source |
| forbiddenExpansion | no CodeGraph install/init/MCP/watcher/daemon/SQLite index, package activation, checker implementation, provider/live proof, public-sync, benchmark rerun, direct source import, or production-readiness claim |

## Epistemic Process Block

### Expected Result / Prediction

The upstream source mirror should refine CGE-R1/CGE-R2 code-intelligence
doctrine with current package/runtime details while preserving the existing
CVF authority boundary.

### Evidence Comparison

The CGE-R3 worker review verifies the mirror commit, manifest count, package
metadata, MCP tool posture, CLI surface, schema, extraction, resolver, sync,
watcher, docs, and tests. The resulting delta extends doctrine and candidate
classification but does not contradict CGE-R2's no-freeze-authority correction.

### Contradiction Or Gap Disposition

No contradiction found. The gap is operational proof: CGE-R3 did not run
CodeGraph, did not create an index, did not call MCP, and did not benchmark or
activate any CVF package/runtime/checker lane.

### Claim Update

This owner-surface delta updates only CVF-owned reference doctrine and future
candidate routing for CodeGraph.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex worker role |
| Provider or surface | local workspace |
| Session or invocation | CGE-R3 CodeGraph upstream owner-surface delta, 2026-06-30 |
| Working directory | D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF |
| Command or tool surface | source reads, git, Get-ChildItem, Select-String, apply_patch |
| Target paths | docs/reference/CVF_CGE_R3_CODEGRAPH_UPSTREAM_OWNER_SURFACE_DELTA_2026-06-30.md |
| Allowed scope source | docs/work_orders/CVF_AGENT_WORK_ORDER_CGE_R3_CODEGRAPH_UPSTREAM_SOURCE_MIRROR_ABSORPTION_2026-06-30.md |
| Agent type | worker |
| Invocation ID | cge-r3-codegraph-owner-surface-delta-2026-06-30 |
| Expected manifest | docs/reference/CVF_CGE_R3_CODEGRAPH_UPSTREAM_OWNER_SURFACE_DELTA_2026-06-30.md |
| Actual changed set | docs/reference/CVF_CGE_R3_CODEGRAPH_UPSTREAM_OWNER_SURFACE_DELTA_2026-06-30.md |
| Manifest delta | MATCH |
| Before status evidence | executionBaseHead d774a7b2 clean before worker artifact authoring |
| After status evidence | pending reviewer acceptance; no worker commit |
| Diff evidence | `git diff --name-status` before reviewer closure |
| Approval boundary | owner-surface delta only |
| Claim boundary | reference doctrine and candidate classification only; no runtime, provider/live, public, production, package activation, checker wiring, MCP server, watcher, daemon, SQLite index, benchmark rerun, or direct import |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This owner-surface delta is a CVF-owned documentation/reference artifact pending
reviewer acceptance. It does not authorize CodeGraph install, init, index,
sync, query, MCP server, watcher, daemon, SQLite index, package activation,
package root creation, ASSF registry mutation, generated index mutation,
checker implementation, CI mutation, provider/live proof, public-sync,
benchmark rerun, direct source import, automatic invocation, action authority,
or production readiness.
