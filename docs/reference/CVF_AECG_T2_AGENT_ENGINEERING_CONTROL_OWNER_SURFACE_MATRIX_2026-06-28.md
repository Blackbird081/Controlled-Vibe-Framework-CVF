# CVF AECG-T2 Agent Engineering Control Owner Surface Matrix

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-28

Owner: Codex

rawMemoryReleased: false

## Purpose

Promote the useful subset of the Agent Engineering Control source bundle into
a CVF-owned owner-surface matrix.

This reference absorbs the source bundle as control taxonomy, not as package
code, schemas, receipts, guard registry, tools, runtime behavior, MCP support,
merge automation, hook repair, or coding-agent replacement.

## Scope / Applies To

Applies to future CVF roadmaps, GC-018 baselines, work orders, completion
reviews, and closeout packets that cite AECG-T1/AECG-T2 as agent engineering
control guidance.

Does not apply to runtime/source implementation, CodeGraph installation,
Agent Engineering Control package import, MCP/CLI adapter implementation,
watcher/daemon behavior, PR merge automation, managed-hook repair, public-sync,
provider/live proof, package activation, certification, generated aggregate
mutation, or production/readiness claims.

## Source Authority

CVF authority comes from governed owner surfaces. The retained source bundle is
external advisory input only.

| Authority class | Source | Disposition |
|---|---|---|
| CVF roadmap authority | `docs/roadmaps/CVF_AECG_T0_CODEGRAPH_AGENT_ENGINEERING_CONTROL_EXTERNAL_ABSORPTION_ROADMAP_2026-06-28.md` | ACCEPT |
| CVF triage authority | `docs/baselines/CVF_GC018_AECG_T1_SOURCE_VERIFIED_AGENT_ENGINEERING_CONTROL_TRIAGE_2026-06-28.md` | ACCEPT |
| External source input | `.private_reference/legacy/CVF_Agent_Engineering_Control_Standard/docs/standards/CVF_AGENT_ENGINEERING_CONTROL_STANDARD_2026-06-20.md` | ADVISORY_ONLY |
| External source input | `.private_reference/legacy/CVF_Agent_Engineering_Control_Standard/docs/reference/CVF_CLAUDEKIT_ENGINEER_ABSORPTION_MAPPING_2026-06-20.md` | ADVISORY_ONLY |
| Existing CVF workflow owner | `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md` | ACCEPT |
| Existing CVF closure owner | `docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md` | ACCEPT |
| Existing CVF lifecycle owner | `docs/reference/CVF_GOVERNED_WORK_LIFECYCLE_AND_DESIGN_CONTROL_STANDARD_2026-06-11.md` | ACCEPT |
| Existing CVF commit owner | `docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md` | ACCEPT |
| Existing CVF claim checker owner | `governance/compat/check_truth_foundation_claim_guard.py` | ACCEPT |

## Non-Authority Inputs

The following are not CVF authority:

- the retained Agent Engineering Control package tree;
- copied schemas, receipts, examples, guard registry, and TypeScript tools from
  that tree;
- CodeGraph runtime, MCP, watcher, daemon, SQLite index, benchmark, or agent
  auto-configuration claims;
- any provider-local memory, external-agent summary, or chat-only assertion.

## Owner Surface Matrix

| Control concept | AEC source term | CVF owner surface | CVF adaptation | Future checker posture |
|---|---|---|---|---|
| Evidence-backed review | Agent Review Evidence Gate | work-order evidence requirements; closure quality; reviewer-fast gate | use as review vocabulary and checklist lens | no new checker now |
| Root-cause certainty | Agent Debug Root Cause Standard | finding-to-governance learning, ADIF, work-order fail conditions | require root cause vs symptom language when a tranche records a defect | defer until recurring debug-only false closures appear |
| Prior work discovery | Prior Work Discovery Gate | source verification, prior absorption checks, external-intake chain map | require prior-owner and prior-absorption rows before promoting external input | no new checker now |
| Parallel implementation prevention | Parallel Implementation Guard | owner-surface mapping, no parallel core dispositions, commit steward split | classify duplicates as `REJECT_PARALLEL_CORE` or route to existing owner | no new checker now |
| Roadmap alignment | Roadmap Alignment Gate | governed lifecycle design-control gate; roadmap closure freshness | require roadmap-to-output trace and current next-move consistency | no new checker now |
| Maintenance cost | Maintenance Cost Gate | value-parked lane reopen discipline; roadmap risk/action tables | use value-now and reopen-condition columns before next-lane selection | no new checker now |
| Broad low-quality output | AI Slop Control Gate | structural completeness, literal-format checklist, truth claim guard, closure quality | use as non-canonical shorthand only; write concrete defects instead | no broad slop checker now |
| Diff content overclaim | Diff Content Lint Gate | truth foundation claim guard; Delta claim boundary guard; public export disposition; closure diff gate | map to existing claim-overreach guards before proposing another checker | candidate only; see AECG-T3 |
| Workflow artifact completeness | Workflow Artifact Gate | work-order template; closure quality; machine closure package | already absorbed; require artifacts before closure | no new checker now |
| Governed PR merge | Governed PR Merge Protocol | commit steward; push-readiness preview; public/provenance boundary | parked automation; manual governed commit only | defer with fresh operator authorization |
| Managed hooks health | Managed Hooks Health Gate | autorun workflow control; local hook catalogs; push-readiness preview | parked automation; hook health is checked through current gates | defer with fresh operator authorization |
| Agent work journal | Agent Work Journal Gate | Agent Operation Trace; active handoff; active session state | use AOT and active handoff instead of a parallel journal | no new artifact family now |
| CodeGraph affected-test routing | affected test guide | future test-selection evidence owner | advisory idea only | defer with fresh implementation GC-018 |
| CodeGraph worktree/index mismatch | stale/fallback discipline | CGE-T2 graph freshness rule; direct source-read fallback | adapt as boundary language | no runtime watcher now |
| CodeGraph single tool/MCP design | MCP server/tool docs | future MCP gateway or adapter contract | advisory UX input only | defer with MCP boundary GC-018 |

## Accepted Control Vocabulary

Future CVF artifacts may use these phrases when they are tied to the owner
surfaces above:

- evidence-backed review;
- root cause vs symptom;
- prior owner and prior absorption check;
- no parallel core;
- roadmap-to-output trace;
- maintenance-cost value filter;
- diff-content overclaim;
- workflow artifact completeness;
- handoff and AOT continuity.

## Rejected Direct Imports

| External source element | Disposition | Reason |
|---|---|---|
| AEC schemas and receipts | REJECT_DIRECT_IMPORT | CVF already owns receipt and evidence formats through governed artifacts |
| AEC guard registry | REJECT_DIRECT_IMPORT | CVF guard registry and hook catalogs are separately governed |
| AEC TypeScript tools | REJECT_DIRECT_IMPORT | no package/tool runtime is authorized |
| AEC examples/templates | ADAPT_AS_LANGUAGE_ONLY | useful examples only after conversion into CVF artifact shape |
| CodeGraph CLI/MCP/watcher/daemon | DEFER_WITH_REOPEN_CONDITION | runtime/tooling lane requires fresh authorization |
| PR merge and hook repair automation | DEFER_WITH_REOPEN_CONDITION | high-risk repository mutation automation |

## Checker Candidate Ledger

| Candidate ID | Description | Value now | Decision |
|---|---|---|---|
| AECG-CC-1 | flag diff-content overclaims that assert production/readiness/merge safety without evidence | medium | evaluate in AECG-T3 |
| AECG-CC-2 | require explicit review-evidence rows for certain completion claims | medium-low | defer; closure quality already covers most cases |
| AECG-CC-3 | detect broad "AI slop" markers | low | reject as too vague for static checking |
| AECG-CC-4 | require root-cause field for every bugfix closure | low-now | defer until a repeated defect pattern appears |
| AECG-CC-5 | enforce work-journal artifact | low | reject; AOT and handoff already own continuity |

## Agent Engineering Control Rule

CVF does not replace coding agents. CVF controls the conditions under which
agent-authored engineering work can be scoped, reviewed, committed, closed,
continued, or reopened.

Any future agent engineering control change must pass this order:

1. source-verify the external idea;
2. map it to an existing CVF owner surface;
3. reject direct import if an owner already exists;
4. record accept/adapt/defer/reject/block disposition;
5. open a fresh GC-018 before implementation;
6. run autorun and commit-steward gates before closure or commit.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this owner-surface matrix plus existing CVF work-order/review/closure surfaces | internal agents may cite the matrix for planning and review language only | AECG-T1 source verification and this matrix | N/A with reason: internal documentation/reference only | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future MCP/CLI adapter owner, if separately authorized | no current ingress, authentication, approval, mutation, raw-data release, public claim, or adapter runtime | AECG-T0/AECG-T1/AECG-T2 all defer adapter work | deferred adapter owner | `DEFERRED_WITH_REASON` |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | External repo or copied folder |
| Chain map route | External repo or copied folder -> source-verified triage -> CVF-owned owner-surface matrix -> future GC-018 only if implementation is separately authorized |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | this reference matrix |
| Disposition | ADAPT high-value AEC taxonomy to existing CVF owner surfaces and reject direct package import |
| Claim boundary | this matrix creates no runtime, package, public, provider, adapter, MCP, watcher, daemon, merge automation, hook repair, checker implementation, or universal governed-coding-control support |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | AECG-T2 owner-surface reference matrix |
| claimDisposition | N/A with reason: no Delta execution-control claim is made |
| receiptEvidence | N/A with reason: no runtime receipt is created or consumed |
| actionEvidence | ACTION_EVIDENCE_PRESENT: documentation matrix and governance gate evidence only |
| invocationBoundary | local private provenance documentation only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, Web runtime, adapter, package, watcher, or daemon interception claim |
| claimLanguage | owner-surface mapping and future-checker decision support only |
| forbiddenExpansion | no runtime, provider/live proof, public-sync, package activation, CodeGraph install/init, MCP wiring, watcher/daemon, merge automation, hook repair, checker implementation, certification, generated aggregate mutation, or universal governed-coding-control claim |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference matrix. No public-sync remote, public
commit, public artifact path, or public claim is authorized.

## Claim Boundary

This reference is an owner-surface matrix and control taxonomy only. It does
not implement or claim runtime enforcement, external CLI/MCP support, provider
behavior, public readiness, package activation, CodeGraph runtime, Agent
Engineering Control package import, merge automation, managed-hook repair,
production readiness, hosted readiness, or universal governed-coding control.
