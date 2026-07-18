# CVF Guard Orientation Index

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-20

**Applies to:** all roles before material governed CVF work.

EPISTEMIC_PROCESS_NA_WITH_REASON: orientation index - no evidence claims or source-backed assertions are made or updated by this document.

## Purpose

Provide a task-first guard map that any new or resumed role can read before
authoring governed CVF artifacts. This index names which guard surfaces to read,
what blocks or outputs are required, what failure patterns to avoid, and which
fast command applies for each common task class.

This is an orientation layer only. Canonical standards, work orders, machine
checkers, and current session state still control. This index does not change
checker semantics, runtime behavior, provider behavior, or public-sync state.

## Read This First

1. Complete the startup acknowledgment from `AGENTS.md` (current mode, active
   handoff, next allowed move, parked checkpoint) before any material governed
   work.
2. Confirm `git rev-parse --short HEAD` and `git status --short`. Record both
   in any worker return or closure packet.
3. Identify the active work order or task class.
4. Look up the task class row in the Task Class Guard Map below.
5. Before writing the first governed artifact section, identify the
   applicable `governance/compat/check_*.py` files, read their constants and
   regex-sensitive required tokens, and record that in
   `## Checker Source Read-Ahead Block` when the artifact is under
   `docs/baselines`, `docs/work_orders`, `docs/reviews`, or `docs/roadmaps`.
6. Read the guard surfaces named in the "Read first" column before editing.

## Role-Neutrality Rule

Normative instructions in CVF governed artifacts must name roles and required
work, not a specific agent, provider, or model.

Allowed role terms:

- operator, dispatcher, dispatch author
- worker
- reviewer, closer, reviewer/closer
- session-sync steward
- external reviewer

Forbidden normative patterns:

- naming a specific provider, model, or agent as the required worker;
- citing a provider-specific memory file as CVF source authority;
- binding future work to one provider surface when the route is role-based.

## Role Glossary

| Role | Responsibility |
|---|---|
| Operator | Authorizes scope, approves checkpoints, owns configuration keys. |
| Dispatcher / dispatch author | Authors GC-018 baseline and work order; runs pre-dispatch gate. |
| Worker | Executes work order; returns `COMPLETE_PENDING_REVIEW`; must not commit. |
| Reviewer | Reviews worker return; may repair allowed-scope defects; closes if accepted. |
| Closer | Commits closure artifacts; updates session-sync surfaces. |
| Reviewer/closer | Combined reviewer and closer in single-role tranches. |
| Session-sync steward | Updates active handoff, session state, and next-move after closure. |
| External reviewer | Reviews CVF from outside the repository; absorbed as input, not authority. |

## Task Class Guard Map

| Task class | Active role | Read first | Required blocks or outputs | Common failure to avoid | Fast command or gate | Boundary |
|---|---|---|---|---|---|---|
| Startup / resume | Any | `CVF_SESSION_MEMORY.md`; `CVF_SESSION/ACTIVE_SESSION_STATE.json`; active handoff named by registry | Startup acknowledgment (mode, handoff, next-move, parked checkpoint) | Skipping acknowledgment; appending status to archived handoffs | `git rev-parse --short HEAD; git status --short` | Session memory and active handoff are the only sources of truth; provider memory files are not CVF authority |
| Work-order authoring / dispatch | Dispatcher | `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`; `docs/reference/CVF_TRANCHE_COMMIT_CHOREOGRAPHY_STANDARD_2026-06-03.md`; `docs/reference/CVF_DUAL_AGENT_SURFACE_ACCOUNTING_STANDARD_2026-06-23.md`; `AGENTS.md` Mandatory Work Order Source Verification section; applicable `governance/compat/check_*.py` sources | Source Verification Block (ACCEPT/REJECT/BLOCKED_SOURCE_NOT_FOUND per item); Checker Source Read-Ahead Block; Agent Handoff Contract Control Block; Dual Agent Surface Matrix with `INTERNAL_AGENT`, `EXTERNAL_AGENT_CLI_MCP`, and adapter boundary; Reviewer Closure Conversion; Commit Prompt Readiness | ACCEPT row cites no source file; work order dispatched without pre-dispatch gate; internal-only design omits external-agent disposition; using gate failures to discover required literal tokens | `python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-dispatch` | Source facts require file and line/section before dispatch; doc-only fields must be separated from source facts; external CLI/MCP support requires separate source-verified authorization |
| Worker execution (`WORKER_MUST_NOT_COMMIT`) | Worker | This index; governing GC-018 baseline; the work order; source files named in Source Verification Block; applicable `governance/compat/check_*.py` sources for each output artifact's `docType`, path family, and conditional content class | Worker-return packet: Purpose, Target / Source, Scope / Methodology, Findings / Position, Risk / Corrective Action, Claim Boundary, Checker Source Read-Ahead Block, Agent Operation Trace Block, Delta Execution Claim Boundary Control Block, Public Export Disposition, executionBaseHead, git status; N/A-with-reason for conditional sections (External Knowledge Intake Routing, Rescan Intelligence Hardening, Corpus Completeness And Report Integrity, Finding-To-Governance Learning Disposition, Epistemic Process Block, Machine Closure Package); companion `docs/reference` outputs must also satisfy their own reference structural headings and checker tokens | Committing before reviewer accepts; missing required packet shape sections; recording git status as clean when the worker-return file is untracked; ACCEPT rows using bare filename instead of full repo path; using the dispatch packet checklist as a substitute for output-artifact checker source read-ahead; writing plausible prose before reading checker literal requirements | `python governance/compat/run_agent_automation_assist.py --base <base> --head HEAD --json --enforce`; `python governance/compat/run_worker_return_fast_gate.py` | Worker must not commit; all artifacts remain uncommitted until reviewer accepts |
| Reviewer-return review | Reviewer | Work order; worker-return packet; GC-018 baseline; `docs/reference/CVF_DUAL_AGENT_SURFACE_ACCOUNTING_STANDARD_2026-06-23.md`; `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0026.md` for dependency-bearing contracts | Reviewer decision; reviewer-fast pass; single-pass dependency-closure matrix before first repair; review-cost telemetry after the first repair | Accepting without reviewer-fast; optional closeout overbuild; sequential predictable findings; repeated repairs without value/cost measurement | `python governance/compat/run_agent_commit_steward_preflight.py --mode reviewer-return --base <closureBase> --head HEAD --enforce` | Classify contract blockers versus implementation deferrals; escalate at repair round three; park low-incremental-value branches with a concrete reopen condition |
| Closure | Closer | Worker return or required completion review; active session state; `docs/reference/CVF_TRANCHE_COMMIT_CHOREOGRAPHY_STANDARD_2026-06-03.md`; `docs/reference/CVF_DUAL_AGENT_SURFACE_ACCOUNTING_STANDARD_2026-06-23.md`; applicable `governance/compat/check_*.py` sources | Committed material artifacts; completion review only when required or necessary; Checker Source Read-Ahead Block on any changed closeout artifact; session-sync surfaces updated separately if mode or next allowed move changes | Mixing closure commits with worker changes; creating closure-shape artifacts that are optional; updating generated state source files without a separate state-generator run; closing with no external-agent disposition or no adapter boundary; discovering machine closure shape by repeated gate failures | `python governance/compat/run_agent_commit_steward_preflight.py --mode reviewer-return --base <closureBase> --head HEAD --enforce` | Closer commits material paths first, then session-sync paths separately; closure does not convert `CONTRACT_ONLY` or deferred adapter rows into runtime support |
| Session-sync | Session-sync steward | Active handoff; `CVF_SESSION/ACTIVE_SESSION_STATE.json` | Updated handoff, session state, and next-move surfaces; no change to archived handoffs | Appending new status to superseded handoffs; updating generated state without running the generator | `python governance/compat/generate_active_session_state.py` | Only the active handoff named by the registry receives new status |
| Push-readiness preview | Reviewer / closer / session-sync steward | `docs/reference/CVF_AGENT_PUSH_READINESS_PREVIEW_STANDARD_2026-06-27.md`; `docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md` | Read-only preview readout before full pre-push gate; upstream push-debt status; commit-shape split recommendation; final base/head range recorded | Discovering GC-020, front-door marker, active-window, review-retention, repository-lifecycle, pre-public P3, knowledge-absorption, or upstream push-debt defects only after multiple tranches have accumulated | `python governance/compat/run_agent_push_readiness_preview.py --base <baseHead> --head HEAD --enforce` | Preview is diagnostic only; canonical pre-push autorun gate remains required before push |
| ADIF entry authoring | Worker / reviewer / closer | `docs/reference/agent_defect_intelligence/CVF_ADIF_ENTRY_TEMPLATE.md`; `governance/compat/check_adif_entry_integrity.py`; this index | Entry field block; Canonical Sources; Remediation; complete Agent Operation Trace Block with `Diff evidence`; Public Export Disposition; Claim Boundary | Copying the template without all trace labels; adding an entry to record an entry-authoring error without a recurrence/latency threshold; mixing ADIF material entries with active handoff/session-sync paths | `python governance/compat/check_adif_entry_integrity.py --enforce` | ADIF entries are material learning records; session-sync surfaces must be committed separately by the session-sync steward |
| External knowledge absorption | Worker / dispatch author / reviewer | `docs/reference/external_agent_review/README.md`; `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md`; `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md`; `.private_reference/source_mirrors/INDEX.md`; `AGENTS.md` Mandatory External Repository Absorption Entry Rule section | External Repository Absorption Entry Control block (source type, upstream/source-mirror disposition, enumeration/manifest plan, per-file terminal-ledger plan, owner/overlap route, value-disposition route, claim boundary) declared at entry, before an absorption artifact exists; External Knowledge Intake Routing table (chain map, input type, route, local guard, disposition, claim boundary); absorb / adapt / defer / reject classification per item; Overlap And Novelty Classification table comparing source value to existing CVF owner surfaces; source-mirror migration control when legacy `.private_reference/external_repos/` is cited; reviewer semantic value audit of `DEFERRED`, `REJECTED`, and `NO_NEW_VALUE` groups after fast gates pass | Treating external input as CVF authority without source verification; absorbing without classification; opening duplicate owner surfaces for value already owned by CVF; accepting all-gates-pass as proof that value-bearing files were fully converted; continuing to cite legacy external clones without source-mirror migration evidence; waiting until an absorption artifact already exists before declaring entry evidence | Classify each external item before authoring a CVF-owned reference; fill `## Overlap And Novelty Classification` with `CONFIRMED_EXISTING`, `ENRICH_EXISTING`, `NEW_FINDING`, `REJECT_DIRECT_IMPORT`, `NO_NEW_VALUE`, or `OWNER_SURFACE_NOT_FOUND`; run fast gates, then audit the ledger for latent doctrine/package/runtime/checker value; run `python governance/compat/check_source_mirror_migration.py --base <base> --head HEAD --enforce`; run `python governance/compat/check_absorption_blindspot_control_presence.py --base <base> --head HEAD --enforce` | CVF remains source of truth; external material is reference input only; source mirrors are authority inputs, not runtime dependencies; the entry control block does not create a second absorption mechanism or checker |
| Absorption reverse architecture projection | Worker / dispatch author / reviewer / closer | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0027.md`; architecture catalog and system-chain GAP front doors; applicable generated-aggregate standard | Reverse Architecture Projection Matrix with Catalog/GAP owner check, disposition, target source, claim class, and evidence | Treating absorption as knowledge-only; leaving accepted new capability/GAP undiscoverable; promoting pending output to as-built; editing aggregate-only | Resolve `UPDATE_EXISTING`, `ADD_CATALOG_ENTRY`, `ADD_GAP_ENTRY`, `DEFER_PENDING_ACCEPTANCE`, or `NOT_APPLICABLE_WITH_REASON` before closure | Apply only after architecture-impact review; pending output is not as-built authority; generated sources control aggregate updates |
| Public-sync | Session-sync steward / operator | `AGENTS.md` critical repository boundary section; `git remote -v` output | Confirmed `origin` points to public-sync clone, not provenance repository | Pushing provenance tree to the public repository; running public push from the provenance clone | `git remote -v` (confirm remote before push) | Never push provenance archive to the public repository; public-sync requires separate authorization |
| Runtime / provider / live proof | Dispatcher and operator checkpoint | `AGENTS.md` Mandatory Live Governance Proof section; governing GC-018 baseline authorizing live proof | Live governance proof command output with stage, class, retryability, HTTP status; API key loaded from `.env.local`; pass/fail evidence | Claiming live proof from mock mode; repeating unclear tests without a failure diagnostic; counting event ratios as execution pass rate | `python scripts/run_cvf_release_gate_bundle.py --json` | Live proof requires a real API call; mock mode is for UI-only structure checks only |
| Guard / checker maintenance | Worker | `governance/toolkit/05_OPERATION/CVF_GUARD_REGISTRY_GUARD.md`; `AGENTS.md`; this index | Core Guard Self-Protection Authorization block in the changed doc set listing every protected path, authorized scope, operator authorization, and rollback boundary | Editing `governance/compat/*.py` or `AGENTS.md` without an authorization block that lists every protected path | `python governance/compat/check_core_guard_self_protection.py` | Each protected path must be listed explicitly in the authorization block |
| Project role / provider-lane delegation setup | Operator and dispatch author | `docs/reference/project_role_provider_delegation/README.md`; `docs/reference/CVF_AGENT_ROLE_ASSIGNMENT_MATRIX_2026-05-19.md`; `docs/reference/CVF_AGENT_DELEGATION_AND_SUBAGENT_BOUNDARY_STANDARD_2026-05-19.md` | Operator-approved project profile: role lanes, allowed/forbidden tools, provider lane, cost/quota ceiling, evidence log, reapproval triggers | Letting an agent self-select a provider lane or self-widen scope; treating the public provider-routing guide as CVF source authority | review the delegation envelope before assigning roles | Documentation/reference envelope only; not an automated provider selector or runtime router; provider/live, runtime routing, and public-sync need fresh GC-018 |

## Common Failure Patterns

| Failure | Gate that catches it | Prevention |
|---|---|---|
| Worker commits before reviewer accepts | Core guard self-protection; tranche commit choreography | Check commit mode in work order; always use `WORKER_MUST_NOT_COMMIT` |
| A governed artifact touches a source-mirror path or uses explicit external-repository/copied-folder intake language but omits R85-style entry evidence, and no artifact yet claims completeness so the claim-triggered guards stay silent | `check_absorption_blindspot_control_presence.py` (ADIF-0014, extended by R95) | Add `## External Repository Absorption Entry Control` naming source type, upstream/source-mirror disposition, enumeration/manifest plan, per-file terminal-ledger plan, owner/overlap route, value-disposition route, and claim boundary before absorption planning proceeds; use `NOT_APPLICABLE_WITH_REASON` or the narrow `COMPARISON_ONLY_NO_ABSORPTION` disposition only when genuinely applicable |
| Source Verification ACCEPT row uses bare filename, not full repo path | `check_work_order_dispatch_quality.py` | Use path starting from repo root (e.g., `governance/compat/foo.py`) |
| Worker-return records `git status --short` as clean when the packet itself is untracked | `check_work_order_dispatch_quality.py` | Record actual pending paths in the git status field at COMPLETE_PENDING_REVIEW |
| Rescan Intelligence Hardening section overbuilt for true non-rescan packets | `check_rescan_intelligence_hardening.py` | Use compact `NOT_APPLICABLE_WITH_REASON` plus a concrete reason for non-rescan worker-return/report packets; include the full delta / routing / sampling vocabulary only for real rescan or intake-refresh outputs |
| Evidence-heavy packet missing Epistemic Process required fields | `check_epistemic_process_packet.py` | Include Evidence Comparison (capital C on Comparison), Contradiction or Gap Disposition, and Claim Update; use EPISTEMIC_PROCESS_NA_WITH_REASON when truly not applicable |
| Corpus Completeness enumeration command is unsafe | `check_corpus_completeness_report_integrity.py` | Use `filesystem-backed direct file reads` or a fully qualified safe enumeration command; bare `rg --files` without `--hidden --no-ignore` is rejected |
| AGENTS.md or governance/compat files changed without authorization | `check_core_guard_self_protection.py` | Include Core Guard Self-Protection Authorization block in a docs/reviews/, docs/work_orders/, or AGENT_HANDOFF*.md file in the same changed set |
| Provider-specific memory file cited as CVF source authority | `check_work_order_dispatch_quality.py`; manual review | Use only CVF-governed surfaces; re-verify against runtime source before promoting any claim |
| INDEX artifact missing required metadata block | `governance/compat/check_index_classification.py` | Any artifact that declares `INDEX type:` must also include all seven required fields: `INDEX type:`, `Source authority:`, `Status:`, `Date:`, `Human-reviewable:`, `Claim boundary:`, `Public Export Disposition:` |
| Roadmap, work order, or closure omits external-agent disposition | machine-check candidate in `docs/reference/CVF_DUAL_AGENT_SURFACE_ACCOUNTING_STANDARD_2026-06-23.md` | Include a six-column Dual Agent Surface Matrix with `INTERNAL_AGENT`, `EXTERNAL_AGENT_CLI_MCP`, interface, authority/risk boundary, evidence, adapter boundary, and allowed disposition |
| ADIF entry trace table omits `Diff evidence` or another exact label | `check_adif_entry_integrity.py` | Copy the trace block from `CVF_ADIF_ENTRY_TEMPLATE.md`; run the ADIF integrity guard before commit |
| ADIF material entry is committed with active handoff/session state | commit steward preflight | Split into material entry commit first, then a dedicated session-sync or handoff-sync commit |
| Optional completion review is created when worker-return evidence is enough | closure-shape gates after the optional file exists | Read Reviewer Closure Conversion first; if completion review is optional, repair evidence inside the worker return and commit material paths without creating a new closed-equivalent artifact |
| Reviewer repeats predictable findings without measuring incremental value or cost | ADIF-0026 guidance; operation-trace and worker-return evidence | Record repair rounds, worker turns, root-cause lineage, elapsed time, provider calls, available token/quota usage, and value delta; escalate at round three and park low-value branches |
| Accepted absorption adds architecture knowledge but leaves Catalog/GAP/README/Index unchanged | ADIF-0027 guidance; manual closure verification | Resolve a Reverse Architecture Projection Matrix; update source entries after acceptance or record bounded defer/non-applicability; never promote pending output to as-built |
| Commit shape is discovered by failed commit attempts | commit steward preflight | Run `git status --short`, classify material versus session/handoff paths, and choose the steward lane before staging, stashing, or attempting a commit |
| Push readiness relies only on the full late pre-push gate | push-readiness preview helper; pre-push autorun gate | Run `python governance/compat/run_agent_push_readiness_preview.py --base <baseHead> --head HEAD --enforce` before the full pre-push gate, repair local marker/continuity findings first, and split material from protected session/handoff paths |
| Multiple governed tranches accumulate locally before any upstream push | push-readiness preview helper | Treat more than 2 commits ahead of upstream as push debt; push the completed safe pair, rebuild/split a malformed unpushed range, or record a concrete blocker before starting another tranche |
| Worker-return fast gates pass but external absorption still over-defers value-bearing files | ADIF-0019; external absorption value conversion guard is only a partial check | After gates pass, reviewer must audit `DEFERRED`, `REJECTED`, and `NO_NEW_VALUE` ledger groups for latent doctrine, package, runtime, or checker value before accepting closeout |
| External absorption opens overlapping doctrine/package/runtime/checker lanes | `check_external_absorption_overlap_discipline.py` | Compare every source group against existing CVF owner surfaces; enrich existing surfaces when possible and use `OWNER_SURFACE_NOT_FOUND` only when no owner exists |
| Changed absorption artifact keeps citing `.private_reference/external_repos/` without migration evidence | `check_source_mirror_migration.py` | Add `## Source Mirror Migration Control`, migrate source authority to `.private_reference/source_mirrors/`, or record `BLOCKED_SOURCE_MIRROR_WITH_REASON` |
| Governed artifact is written before checker source and literal tokens are read | `check_governed_artifact_checker_read_ahead.py` | Read applicable `governance/compat/check_*.py` files first; record `applicableCheckersRead`, `literalTokensReviewed`, `gateRunPurpose`, and `claimBoundary` in `## Checker Source Read-Ahead Block`; use the gate as confirmation evidence |
| Worker output assumes dispatch packet checklist is enough | ADIF-0023; structural, worker-return, corpus, value-conversion, and rescan gates | For each worker-created output file, derive required headings, table labels, marker lines, and enum tokens from checker source by `docType`, path family, and conditional content class before writing the first section |
| Work-order authoring burns time on known literal-shape traps | `check_work_order_dispatch_quality.py`; `check_agent_operation_trace.py`; `check_agent_handoff_boundary.py`; `check_dispatch_packet_lifecycle_hygiene.py` | Use `governance/compat/build_dispatch_packet_scaffold.py` before drafting. Preserve its scalar Evidence Reuse fields, exact negative-search command/root/query row, Worker Output Checker Read-Ahead Mandate, and handoff contract exception wording. In shape contracts, list section names without `##`; avoid exact `BLOCKED_SOURCE_NOT_FOUND` in `literalTokensReviewed`; avoid `after ... closure` wording unless paired with accepted dependency evidence. |

## Claim Boundary

This index is an orientation layer only. It does not claim enforcement authority,
replace canonical guards or standards, change checker semantics, authorize
runtime execution, prove live provider behavior, claim public-sync readiness,
or claim universal governed-coding control.

Canonical standards, work orders, machine checkers, and current session state
still control.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | AAF-T3 guard-orientation index - documentation and routing only |
| claimDisposition | N/A with reason: no Delta execution-control claim is made by this index |
| receiptEvidence | N/A with reason: no Delta receipt evidence is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | cooperating local role reads this index manually |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | orientation index and navigation layer only |
| forbiddenExpansion | enforcement wrapper, proxy enforcement, interception, arbitrary-command execution, EDIT/COMMIT execution, provider/live, public-sync, queue/daemon, watcher, readiness claims, full-hook equivalence, and universal control remain out of scope |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | reviewer/closer |
| Provider or surface | local private provenance repository |
| Session or invocation | SOT3 reviewer-cost and reverse-projection learning, 2026-07-12 |
| Working directory | repository root |
| Command or tool surface | governed reads, rg, apply_patch, ADIF resolver/integrity checks, governance gates |
| Target paths | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0026.md`; `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0027.md`; `docs/reference/agent_defect_intelligence/entries/README.md`; `docs/reference/guard_orientation/README.md` |
| Allowed scope source | operator instruction to make reviewer-cost stop control and absorption reverse projection mandatory shared learning |
| Before status evidence | reviewer findings cascaded across repeated SOT3-T2 repair rounds and accepted absorption had no mandatory Catalog/GAP reverse-projection disposition |
| After status evidence | ADIF-0026 and ADIF-0027 are resolver-discoverable and this orientation index routes both rules |
| Diff evidence | exact four-path material batch shown by `git diff --cached --name-status` |
| Approval boundary | shared guidance only; no checker, runtime, provider/live, public-sync, or SOT3 implementation authorization |
| Claim boundary | agent-enforced reviewer and absorption guidance; no machine semantic-completeness claim |
| Agent type | reviewer/closer |
| Invocation ID | `sot3-review-cost-reverse-projection-learning-2026-07-12` |
| Expected manifest | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0026.md`; `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0027.md`; `docs/reference/agent_defect_intelligence/entries/README.md`; `docs/reference/guard_orientation/README.md` |
| Actual changed set | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0026.md`; `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0027.md`; `docs/reference/agent_defect_intelligence/entries/README.md`; `docs/reference/guard_orientation/README.md` |
| Manifest delta | MATCH |

## Related Surfaces

- `CVF_SESSION/REQUIRED_STARTUP_GUARDS.md` - startup guard router
- `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md` - task-trigger lookup table
- `AGENTS.md` - root agent instructions and mandatory acknowledgment
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md` - work order template
- `docs/reference/CVF_TRANCHE_COMMIT_CHOREOGRAPHY_STANDARD_2026-06-03.md` - commit choreography
- `docs/reference/CVF_DUAL_AGENT_SURFACE_ACCOUNTING_STANDARD_2026-06-23.md` - internal/external agent surface accounting and matrix checker candidate
- `governance/compat/run_agent_automation_assist.py` - AAF helper smoke command
- `governance/compat/run_worker_return_fast_gate.py` - worker-return fast gate
- `governance/compat/run_agent_autorun_workflow_gate.py` - pre-dispatch gate
- `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` - external knowledge intake routing
- `governance/compat/check_index_classification.py` - INDEX classification gate (INDEX-T1)
- `docs/reference/CVF_INDEX_CLASSIFICATION_STANDARD_2026-06-21.md` - accepted forward-only INDEX classification standard
