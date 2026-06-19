# CVF Technical Product Catalog

Memory class: POINTER_RECORD

Status: CURRENT - updated 2026-06-19
Version: CVF v4.0.0 GA

## Purpose

This catalog gives users, developers, and agents a compact technical map
of Controlled Vibe Framework (CVF). It answers three questions:

1. What can CVF help me accomplish right now?
2. What capabilities exist and at what maturity level?
3. What does CVF explicitly not claim?

All capability claims in this catalog are backed by a public evidence
path. If no evidence path is listed, the capability is roadmap only.

## Owner / Source

Owner: CVF public documentation surface.

Source: public-safe repository files only.

## Scope

This catalog is the public capability index for users, developers, and agents.
It does not mirror private provenance, hidden IDE sessions, operator-only logs,
raw provider transcripts, or private roadmap packets unless a public-safe
artifact exists in this repository.

## Protocol / Contract / Requirements

Every capability row must cite an existing public-sync path or explicitly mark
the capability as roadmap-only. Public claims must preserve bounded evidence
language and must not convert private provenance status into a public runtime,
provider, hosted-readiness, production-readiness, or cost-optimization claim.
Public-source evaluation must also follow
`docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`.

## Enforcement / Verification

Before changing this catalog, run the public documentation gates:

```bash
python governance/compat/check_docs_governance_compat.py
python governance/compat/check_markdown_structural_completeness.py
```

---

## What CVF Is

CVF is a governance-first control framework for AI-assisted execution.

It places a governed control plane between user intent, agent actions,
provider calls, policy checks, and evidence receipts. Its practical
purpose is to make AI work safer, more auditable, and more repeatable
for both developers and non-coders.

The core operating loop is:

```text
INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE
```

---

## Maturity and Delivery History

CVF v4.0.0 GA was released 2026-05-16. The framework reached GA through
130+ incremental delivery tranches covering: knowledge retrieval pipeline,
certified provider lanes, skill governance engine, template marketplace,
non-coder UX, governance CLI, benchmark infrastructure, and a fully
governed execution chain (role permission → workflow binding → provider
call → receipt emission).

All release claims are backed by live provider proof. Mock-only tests
are not accepted as governance evidence.

Release gate: `scripts/run_cvf_release_gate_bundle.py`
Latest result: `docs/evidence/latest-release-gate.md`

On 2026-05-20, the public code subset added bounded read-only CLI wrappers,
expanded offline governance reliability metrics, and a memory tier classifier
contract. This catalog update cites only paths verified in the public-sync
clone. The canonical role catalog remains a public-sync coverage gap until a
public-safe reference file is added.

On 2026-05-21, the public evidence set added and then hardened a
post-Phase 2.B bounded publicization summary: internal runtime coherence was
closed in private provenance, the release gate passed, and narrow
two-window, two-provider governed `/api/execute` repeatability evidence passed
on Alibaba `qwen-turbo` and DeepSeek `deepseek-chat`. This is not a broad
provider stability or production readiness claim.

On 2026-05-22, a public-safe A2 coherence readout was added for agent and
developer readers. It records that governance-kernel coherence is
audit-equivalent for the current public orientation baseline through existing
public surfaces: the governance control matrix, session governance bootstrap,
Guard Contract runtime workflow, orchestrator and policy-decision contracts,
and the live-proof release gate. This is not a freeze lift or new runtime
claim.

Also on 2026-05-22, the P1 public developer onboarding proof verified the
local-first web setup path and non-live static gate for agent/developer
readers. The proof corrected public docs that referenced non-exported setup
scripts, then passed `npm ci`, `npm run check`, and the 7/7 static CI gate.
Evidence: `docs/evidence/public-developer-onboarding-proof-2026-05-22.md`

The dependency-audit residual from that onboarding proof was then closed on
2026-05-22. The public web package now has a clean `npm audit --json` result
after bounded dependency updates and a 7/7 static CI gate rerun. Evidence:
`docs/evidence/public-dependency-audit-triage-2026-05-22.md`

On 2026-05-24, the private provenance repository closed a Post-AIF
Operationalization tranche and the public-sync subset added the summary-only
AIF operational context preview harness with bounded tests. The public-safe
boundary remains narrow: no live memory reinjection, graph authority, provider
prompt injection, broad provider stability, or hosted production readiness is
claimed. Evidence:
`docs/evidence/post-aif-operationalization-boundary-2026-05-24.md`

Also on 2026-05-24, the public-sync subset added public-safe non-coder Step 0
provider-key setup and first-receipt guides for small teams. Private
provenance evidence records one live hosted governed `/api/execute` receipt
for the trusted `strategy_analysis` path, but the public catalog claim remains
bounded to the guide path and does not claim enterprise SaaS, multi-tenant
hosted GA, universal provider stability, or broad production readiness.
Evidence: `docs/guides/CVF_NON_CODER_STEP0_API_KEY_SETUP_2026-05-24.md`,
`docs/guides/CVF_NON_CODER_SETUP_GUIDE_2026-05-24.md`

On 2026-05-25, the private provenance repository closed a bounded vertical
integration wave and the public-sync subset added a curated evidence summary.
The wave proves response-level vertical integration packaging, not a new
workflow engine or production-readiness posture: VI4 exposes a consolidated
evidence package, DeepSeek and OpenAI were added to the live VI4 proof surface,
and three non-Product-Brief workflows now expose workflow state/recovery
readouts through the existing governed route. Evidence:
`docs/evidence/vertical-integration-provider-workflow-coverage-2026-05-25.md`

On 2026-05-26, the public web export surface added bounded English-mode i18n
coverage for the `app_builder_complete` Surface 1 markdown export. The export
now localizes template chrome, input labels, task intent, and protocol chrome
while preserving user-entered Vietnamese values as source evidence. This is a
deterministic renderer/i18n claim only; it does not claim universal translation
quality, all-template coverage, provider behavior, or live governance behavior.
Evidence: `docs/evidence/surface1-web-export-i18n-coverage-2026-05-26.md`

On 2026-05-27, the public documentation set added LHW3 workflow connector
standards. These standards bind existing CVF evidence surfaces into three
doc-only chains: operational failure trend readout, clarification re-intake,
and spec-change workflow packet handoff. This is a schema/documentation claim
only; it does not claim runtime enforcement or provider behavior.

On 2026-05-28, the public documentation set added quality-fixed LHW5 connector
standards for database-action boundaries, artifact-export advisory packets, and
failure-simulation scenario packets. These are documentation connector standards
only; they do not claim database execution, artifact export blocking, live
simulation execution, provider behavior, receipt-envelope changes, hosted
readiness, or production readiness.

On 2026-05-29, the public front door was simplified and the detailed
multi-agent/provider routing material was moved into a dedicated guide for
agent, developer, and non-coder operator readers. The guide explains when to
use lower-cost, balanced, or premium model lanes across intake, orchestration,
worker, reviewer, and closure roles. It is an operator routing and cost-posture
guide only; it does not prove model output quality, provider cost optimization,
governed-route behavior, public release readiness, hosted readiness, or
production readiness.
Evidence: `docs/guides/CVF_MULTI_AGENT_PROVIDER_ROUTING.md`

On 2026-05-30, the public-sync subset exported a bounded CVF 28.05 capability
batch for Delta, WCE, EL, PM, LHW15, and LHW16. The export includes public-safe
reference specs, provider-method evidence records, and a curated evidence
summary. It does not publish runtime source/tests as a build-clean public
artifact set, private session handoffs, ignored roadmaps/reviews/baselines as
product surface, hidden IDE histories, or raw operator/provider transcripts.
Evidence:
`docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`

Also on 2026-05-31 (second batch), the public documentation set added LHW20
CVF_Important Deep Scan Wave connector standards. These cover three additional
advisory surfaces from the full 97-file deep scan of the CVF_Important legacy
folder: (1) Security Hardening Checklist Full — six additional hardening items
(H4-H9: Capability Hierarchy, Secret TTL, Context Isolation, Agent Comm
Restriction, Severity Classification, Cross-Check Detection), completing the
full 9-item checklist (H1-H3 from LHW17); (2) Execution Strategy Model — a
five-pattern taxonomy (SINGLE_SHOT/ITERATIVE/MULTI_STEP/PARALLEL/TREE) plus
five enhancement techniques and strategy selection rules; (3) Adaptation Policy
Engine — six mandatory safety constraints (A1-A6: Risk Budget, Confidence
Gating, Multi-Signal, Cooldown, Tiered Authority, Rollback) that are required
prerequisites before Learning Plane activation. All three are documentation
connector standards only; they do not claim runtime enforcement, receipt-envelope
changes, provider behavior, hosted readiness, or production readiness.
Evidence: `docs/reference/CVF_LHW20_T1_*`, `docs/reference/CVF_LHW20_T2_*`,
`docs/reference/CVF_LHW20_T3_*` connector spec files.

On 2026-05-31, the public-sync subset added three batches of new capability:
(1) CBP-1 Context Budget Policy — a governed advisory module that exposes a
`contextBudgetReadout` field in `/api/execute` ALLOW responses. The readout
surfaces task-class-scoped token budget posture per CVFRole. This is an advisory
readout only; it does not block execution or enforce context limits.
Evidence: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/context-budget-policy.ts`,
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/context-budget-readout.ts`
(2) INT-1 Generic MCP Adapter — two new MCP tools (`cvf_validate_plan`,
`cvf_emit_agent_event`) that close the CP2 Plan Validator gap and provide
a generic event emission entry point for external agent frameworks. Both tools
are advisory only; they do not block execution. Integration guide now available.
Evidence: `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts`,
`docs/guides/CVF_GENERIC_MCP_ADAPTER_INTEGRATION_GUIDE_2026-05-31.md`
(3) LHW17-19 connector standard batch — nine documentation-only advisory
connector specs covering Trust & Isolation hardening, Model Gateway unification,
Learning Plane Truth/Reputation advisory, Failure Simulation gap-map, CVF
Positioning governance-layer advisory, Context Management strategy, Integration
Architecture control points, Event Model governance, and Strategic Compass.
No runtime enforcement, receipt-envelope extension, or production-readiness
claim. Evidence: `docs/reference/CVF_LHW17_*`, `docs/reference/CVF_LHW18_*`,
`docs/reference/CVF_LHW19_*` connector spec files.

On 2026-06-04, the public front door added an explicit public evaluation claim
boundary for external agents and GitHub readers. It clarifies that route source
files, CI badges, mock/demo data, and documentation-only connector specs are
not governance proof unless linked evidence supports the claim. It also
separates static CI hygiene from protected live release-gate proof.
Evidence: `docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`

Also on 2026-06-04, the public documentation set added an External Review
Hardening public-sync summary. The summary calibrates external-agent review
after private follow-up work on route-governance proof and CI
public-evaluation posture. It is a bounded summary only: no complete API-route
coverage, ordinary live CI, hosted freshness, production readiness, dependency
clearance, auth migration, or public release readiness is claimed. Evidence:
`docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md`

On 2026-06-05, that ERH public summary was refreshed after private follow-up
on review rescan discipline, safety workflow hardening, and evidence durability
triage. The public-facing boundary remains explicit: these summaries improve
external-agent calibration, but they do not claim advanced ML DLP, universal
jailbreak detection, a default production database, live Redis/DB durability,
multi-instance consensus, tamper-proof audit retention, hosted readiness, or
public release readiness. Evidence:
`docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md`,
`docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md`

On 2026-06-16, the public front door and technical catalog were refreshed after
private provenance foundation work on agent work-order governance. The public
claim is deliberately narrow: CVF records three reusable authoring-time lessons
for public readers and agents. Dispatch prompts should appear read-first in
work orders; reusable agent lessons must be captured in CVF-governed artifacts
rather than provider-only memory; stale continuity text must not redispatch a
target that has already closed. This is a public documentation and catalog
calibration update only. It does not export private worker returns, private
handoffs, private session state, runtime behavior, provider behavior, live
proof, production readiness, or public release readiness. Evidence:
`docs/evidence/cvf-16-06-public-front-door-catalog-sync.md`

On 2026-06-19, the public external-review catalog posture was refreshed for
current public repository evaluation. The update adds a public-safe review
snapshot that tells external agents which public files to read first, how to
classify findings, and which claims remain out of bounds. This is an external
review calibration and catalog pointer update only. It does not export private
provenance packets, in-progress worker tranches, raw provider logs, secrets,
runtime behavior, provider behavior, hosted readiness, production readiness, or
universal governed-coding control. Evidence:
`docs/evidence/public-external-review-snapshot-2026-06-19.md`

---

## What CVF Can Do Today

The following outcomes are proven on at least one certified provider
lane and backed by a public evidence path. Each is bounded — CVF does
not claim these as universal across all templates, providers, or
deployment configurations.

**1. Generate a governed Product Brief through a bounded governed execution chain.**
A Developer-role user submits a product brief request. CVF resolves
their role to `BUILDER`, checks output permission, binds the workflow,
dispatches ordered steps (intake → retrieval → provider call → receipt
emission), and returns a response with step traces, a governance
evidence receipt, and a workflow audit payload. This is the selected
Product Brief flow — not a universal claim across all templates.
Evidence: `docs/evidence/phase-e-governed-execution-chain.md`

**2. Run a live governance proof across the full release gate.**
CVF executes a seven-check release gate covering: web build, guard
contract TypeScript, provider readiness, secrets scan, RC docs
governance, Playwright UI mock E2E, and Playwright live governance E2E.
All seven must pass before a release claim is made.
Evidence: `docs/evidence/latest-release-gate.md`

**3. Execute knowledge-backed AI with DLP, quota, and guard controls.**
The governed execute path applies DLP filtering, team quota checks, a
guard engine policy evaluation, and scoped knowledge retrieval before
dispatching to the provider. Output is validated and wrapped in a
governance envelope with an evidence receipt.
Evidence: `docs/evidence/web-governance-path.md`,
`docs/evidence/cvf-16-5-runtime-absorption.md`

**4. Audit an AI session or workflow with the governance CLI.**
The governance CLI (`cvf-guard`) supports four commands: `evaluate`
(run a guard policy check), `audit` (generate a session audit report),
`session` (inspect session continuity state), `report` (export
governance evidence). Suitable for developer and operator use cases.
Evidence: `ARCHITECTURE.md`, `docs/reference/CVF_MODULE_INVENTORY.md`

**5. Benchmark provider output against the CVF Quality Baseline.**
CVF's benchmark infrastructure supports preregistered quality runs
across provider lanes. Benchmark results are recorded as public
evidence and cited in release decisions.
Evidence: `docs/evidence/current-cvf-quality-status.md`,
`docs/benchmark/`

**6. Inspect a consolidated vertical integration evidence package from a governed route call.**
For selected live `/api/execute` calls, CVF returns a response-level VI4
package that separates call-level pass rate from multi-surface event counts
and exposes governance receipt, workflow state/recovery, request context,
memory-event posture, tool/action readouts, provider-method readiness,
operational scorecard, and available artifact/metric surfaces. This is an
API/operator evidence readout — not a route-blocking workflow engine.
Evidence:
`docs/evidence/vertical-integration-provider-workflow-coverage-2026-05-25.md`

---

## Capability Catalog

**Status vocabulary**

| Status | Meaning |
| --- | --- |
| `proven` | Live-tested on at least one certified provider lane; evidence receipt exists |
| `partially proven` | Core path tested; not all configurations or flows covered |
| `partially absorbed` | Contract or design exists; not wired into the live execute path |
| `schema-defined` | Concrete schema/policy/spec artifacts exist; runtime binding and live proof are not claimed |
| `active` | Implemented and used; evidence exists but not as a formal governance proof |
| `audit-equivalent` | A reviewed public orientation posture is covered by existing owner surfaces; no new runtime behavior is claimed |
| `demand-gated` | Ready when a concrete consuming flow is named; not built speculatively |
| `roadmap` | Designed or scoped; no current implementation or evidence |

| Capability | Status | Evidence |
| --- | --- | --- |
| Governance control plane | proven | `ARCHITECTURE.md`, `GOVERNANCE.md` |
| Public evaluation claim boundary | active — external-agent calibration for route coverage, static CI, mock/demo data, connector specs, evidence durability, and provider parity boundaries; no new runtime behavior claimed | `docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md` |
| Public external review snapshot | active — dated public-safe review entry point for external agents; calibrates source order, finding format, live-proof boundary, and private/public separation; no private provenance export or runtime claim | `docs/evidence/public-external-review-snapshot-2026-06-19.md`, `docs/guides/external-agent-review-guide.md` |
| External Review Hardening public summary | active — public-safe calibration for external review rescan, route/CI posture, safety workflow hardening, dependency/auth boundaries, and evidence durability limitations; no private packet export or production-readiness claim | `docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md`, `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md` |
| Governance kernel coherence | audit-equivalent - public reader baseline | `docs/reference/CVF_PUBLIC_GOVERNANCE_KERNEL_COHERENCE_2026-05-22.md`, `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`, `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md` |
| Live governance proof | proven — mandatory for release claims | `docs/evidence/latest-release-gate.md` |
| Governed execution chain (Product Brief) | proven — bounded to selected Product Brief flow | `docs/evidence/phase-e-governed-execution-chain.md` |
| Knowledge-backed execution with guards | proven — bounded execute path | `docs/evidence/cvf-16-5-runtime-absorption.md`, `docs/evidence/web-governance-path.md` |
| Non-coder governed path | proven — bounded provider lanes; Step 0 setup and small-team first-receipt guide paths available | `docs/evidence/web-governance-path.md`, `docs/guides/CVF_NON_CODER_STEP0_API_KEY_SETUP_2026-05-24.md`, `docs/guides/CVF_NON_CODER_SETUP_GUIDE_2026-05-24.md` |
| Surface 1 English web export i18n (`app_builder_complete`) | active — bounded deterministic renderer coverage for English-mode markdown export chrome; preserves user source values; no universal translation or all-template claim | `docs/evidence/surface1-web-export-i18n-coverage-2026-05-26.md`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SpecExport.tsx`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/template-i18n.ts` |
| Execution diagnostics and first-value failure recovery | proven — bounded live-run failure classification and non-coder evidence-to-action surface; no provider SLA or production-readiness claim | `docs/evidence/execution-diagnostics-and-first-value-2026-05-24.md` |
| Workflow chain memory read/write proof | proven — bounded two-turn local workflow-chain proof with live Alibaba `qwen-turbo` receipts; summary-only durable memory receipt, no raw memory reinjection claim | `docs/evidence/workflow-chain-memory-proof-2026-05-24.md` |
| Vertical integration chain readout (VI4) | proven — response-level package on selected live `/api/execute` calls; separates call-level pass rate from event-model denominator; no route-blocking or workflow-engine claim | `docs/evidence/vertical-integration-provider-workflow-coverage-2026-05-25.md` |
| Multi-provider VI4 coverage | proven — bounded live VI4 package proof on Alibaba `qwen-turbo`, DeepSeek `deepseek-chat`, and OpenAI `gpt-4o`; no broad provider stability or parity claim | `docs/evidence/vertical-integration-provider-workflow-coverage-2026-05-25.md`, `docs/evidence/provider-lanes.md` |
| Multi-agent provider routing guide | active — public operator/developer guidance for assigning provider/model lanes by role, effort, and cost posture; includes green/blue/red cost markers; no autonomous routing, model-quality, or cost-optimization proof claimed | `docs/guides/CVF_MULTI_AGENT_PROVIDER_ROUTING.md` |
| Delta advisory execution readouts and MCP/CLI wire-in | active boundary documented — additive pipeline-chain readout on selected `/api/execute` responses plus local MCP write/submit tools and whitelisted in-process CLI bridge; no arbitrary shell execution, hosted readiness, production claim, or public-build-ready source export claim | `docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`, `docs/reference/CVF_DELTA_D2_MCP_WRITE_TOOLS_SECURITY_BOUNDARY_2026-05-29.md`, `docs/reference/CVF_DELTA_D3_SANDBOX_BOUNDARY_SPEC_2026-05-29.md` |
| Workflow-chain CLI execution and per-role provider payload routing | active boundary documented — local CLI workflow chaining, MA1 packet serialization, and per-role provider-map payload construction; no autonomous provider scheduling, IDE-tab orchestration, or public-build-ready source export claim | `docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`, `docs/reference/CVF_WCE_W2_MA1_CLI_SERIALIZATION_CONNECTOR_SPEC_2026-05-29.md` |
| Execution-layer advisory timeout/deadlock readouts | bounded evidence documented — additive worker-timeout and reviewer-deadlock readout boundary on governed `/api/execute` ALLOW responses; no automatic model escalation, work-order decomposition execution, or public-build-ready source export claim | `docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`, `docs/reference/evidence/execution-layer/CVF_EL2_WORKER_TIMEOUT_EVIDENCE_2026-05-29.md` |
| Provider-method live proof expansion | partially proven — bounded method capability proofs for Alibaba streaming, DeepSeek json mode, and provider-tool-call boundary records; no universal provider parity, end-user SSE delivery, governed-route proof, hosted readiness, or cost optimization claim | `docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`, `docs/reference/evidence/provider-methods/json-mode/CVF_PM1_JSON_MODE_DEEPSEEK_CHAT_EVIDENCE_2026-05-29.md`, `docs/reference/evidence/provider-methods/json-mode/CVF_PM1_JSON_MODE_GPT4O_EVIDENCE_2026-05-29.md`, `docs/reference/evidence/provider-methods/streaming/CVF_PM2_STREAMING_QWEN_TURBO_EVIDENCE_2026-05-29.md`, `docs/reference/evidence/provider-methods/tool-call/CVF_PM3_TOOL_CALL_BOUNDARY_RECORD_2026-05-29.md` |
| LHW15/LHW16 workflow connector standards | schema-defined — documentation-only connector standards for runtime observability trend, workflow resume, context profile packaging, database-action proof, MCP approval proof, and code-intelligence adapter boundary; no runtime execution or receipt-envelope claim | `docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`, `docs/reference/CVF_LHW15_T1_RUNTIME_OBSERVABILITY_TREND_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`, `docs/reference/CVF_LHW16_T1_DATABASE_ACTION_PROOF_ADVISORY_CONNECTOR_SPEC_2026-05-30.md` |
| Learning Plane route readouts and finding-to-learning intake | active source subset exported — `/api/execute` returns additive advisory readouts, `/api/learning-plane/readout` normalizes finding-to-learning records, and the file-size guard rejects near-hard compressed route changes; advisory only, no autonomous mutation or full enterprise-source export claim | `docs/evidence/cvf-31-05-public-runtime-source-sync-2026-05-31.md`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route-response-readouts.ts`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/learning-plane/readout/route.ts`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/finding-to-learning-bridge.ts`, `governance/compat/check_governed_file_size.py` |
| Multi-workflow VI coverage | proven — bounded workflow state/recovery readouts for `strategy_analysis`, `marketing_campaign_wizard`, and `brand_voice`; no all-template workflow-engine claim | `docs/evidence/vertical-integration-provider-workflow-coverage-2026-05-25.md` |
| LHW3 workflow connector standards | schema-defined — doc-only connector standards for operational failure trend readout, clarification re-intake, and spec-change workflow packet handoff; no runtime enforcement or provider behavior claim | `docs/roadmaps/CVF_LHW3_WORKFLOW_CONNECTOR_WAVE3_ROADMAP_2026-05-27.md`, `docs/reference/CVF_LHW3_OPERATIONAL_FAILURE_TREND_READOUT_CONNECTOR_SPEC_2026-05-27.md`, `docs/reference/CVF_LHW3_REQUEST_CLARIFICATION_RE_INTAKE_LOOP_CONNECTOR_SPEC_2026-05-27.md`, `docs/reference/CVF_LHW3_SPEC_CHANGE_WORKFLOW_PACKET_CONNECTOR_SPEC_2026-05-27.md` |
| LHW5 boundary connector standards | schema-defined — doc-only connector standards for database-action boundary records, artifact-export advisory records, and failure-simulation scenario packets; no database execution, export blocking, simulation execution, provider behavior, or receipt-envelope claim | `docs/reference/CVF_LHW5_DATABASE_ACTION_BOUNDARY_CONNECTOR_SPEC_2026-05-27.md`, `docs/reference/CVF_LHW5_ARTIFACT_EXPORT_BOUNDARY_ADVISORY_CONNECTOR_SPEC_2026-05-27.md`, `docs/reference/CVF_LHW5_FAILURE_SIMULATION_SCENARIO_PACKET_CONNECTOR_SPEC_2026-05-27.md` |
| Governance CLI (`cvf-guard`, `cvf execute`) | active; `execute` caller is mock-tested and delegates to the web execute route | `ARCHITECTURE.md`, `docs/reference/CVF_MODULE_INVENTORY.md`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/execute.client.ts`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/tests/execute.client.test.ts` |
| Governance CLI read-only wrappers (`cvf run`, `cvf skill`, `cvf receipt`, `cvf trace`, `cvf provider`) | active — read-only developer/operator wrappers over existing execution, skill, receipt, trace, and provider inspection surfaces; no new provider behavior claimed | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/command.registry.ts`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/tests/commands/cvf-run.test.ts`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/tests/commands/cvf-skill.test.ts`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/tests/commands/cvf-receipt.test.ts`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/tests/commands/cvf-trace.test.ts`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/tests/commands/cvf-provider.test.ts` |
| Certified provider lanes | proven where evidence exists | `docs/evidence/provider-lanes.md` |
| Skill governance engine | active | `docs/reference/CVF_MODULE_INVENTORY.md` |
| Template marketplace | active | `docs/evidence/web-governance-path.md` |
| Deliverable packs and evidence export | active — web product path | `docs/evidence/web-governance-path.md` |
| Workflow capability packs | schema-defined + typed registry — 3 packs completed with `FailureRecoveryPolicy`, `WorkflowPackRegistry` typed loader, and `getGovernedPack()` resolver | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-packs/app_builder_complete/workflow.spec.md`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-packs/strategy_analysis/workflow.spec.md`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-packs/documentation/workflow.spec.md`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-packs/index.ts`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/types/workflow-pack.ts` |
| Benchmark infrastructure (QBS) | active | `docs/evidence/current-cvf-quality-status.md`, `docs/benchmark/` |
| Role and agent governance | partially proven — selected flow | `docs/evidence/phase-e-governed-execution-chain.md` |
| Memory and continuity contracts | partially proven — execute-route audit memory receipts plus one bounded two-turn live workflow-chain read/write proof; no provider prompt reinjection claim | `docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.ts`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/audit-memory-receipt.test.ts`, `docs/evidence/workflow-chain-memory-proof-2026-05-24.md` |
| Operational observability | partially absorbed | `docs/evidence/cvf-16-5-runtime-absorption.md` |
| External asset/capability governance | partially productized | `docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md` |
| Provider streaming contract (`StreamContract`) | schema-defined — bounded to governed pack policy flag | `EXTENSIONS/CVF_MODEL_GATEWAY/src/stream-contract.ts`, `EXTENSIONS/CVF_MODEL_GATEWAY/tests/stream-contract.test.ts` |
| Context budget advisory readout (`contextBudgetReadout`) | active — additive advisory field in `/api/execute` ALLOW responses; surfaces task-class token budget posture per CVFRole; advisory only, no execution blocking | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/context-budget-policy.ts`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/context-budget-readout.ts` |
| Generic MCP adapter tools (`cvf_validate_plan`, `cvf_emit_agent_event`) | active — advisory plan validation (CP2) and generic agent lifecycle event emitter for external frameworks; advisory only, no execution blocking | `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts`, `docs/guides/CVF_GENERIC_MCP_ADAPTER_INTEGRATION_GUIDE_2026-05-31.md` |
| LHW17-19 advisory connector standards | schema-defined — nine doc-only connector specs covering Trust & Isolation hardening, Model Gateway unification, Learning Plane Truth/Reputation advisory, Failure Simulation gap-map, CVF Positioning, Context Management strategy, Integration Architecture control points, Event Model governance, and Strategic Compass; no runtime enforcement or receipt-envelope claim | `docs/reference/CVF_LHW17_T1_TRUST_ISOLATION_HARDENING_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`, `docs/reference/CVF_LHW18_T2_CVF_POSITIONING_GOVERNANCE_LAYER_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`, `docs/reference/CVF_LHW19_T1_INTEGRATION_ARCHITECTURE_CONTROL_POINTS_ADVISORY_CONNECTOR_SPEC_2026-05-30.md` |
| Provider method contracts (`ReasoningContract`, `JsonModeContract`, `ToolCallContract`, `EmbeddingContract`) | schema-defined — gateway contract layer; no provider execution claimed | `EXTENSIONS/CVF_MODEL_GATEWAY/src/reasoning-contract.ts`, `EXTENSIONS/CVF_MODEL_GATEWAY/src/json-mode-contract.ts`, `EXTENSIONS/CVF_MODEL_GATEWAY/src/tool-call-contract.ts`, `EXTENSIONS/CVF_MODEL_GATEWAY/src/embedding-contract.ts` |
| Governance reliability benchmark CLI (`cvf benchmark governance`, `cvf benchmark run`) | active — 12-metric offline computation against audit JSONL; `run` subcommand emits formatted reliability report | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/governance-reliability-metrics.ts`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/command.registry.ts`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/tests/governance-reliability-metrics.test.ts` |
| Governance benchmark live metrics | proven — bounded 5-call hosted Alibaba/qwen-turbo benchmark window; call-level result `5/5 PASS`; event-model metrics measured `taskCompletionRate=0.5`, `policyViolationRate=0`, `receiptIntegrityRate=0.5` because each call emits two benchmark events; no SLA or production-readiness claim | `docs/evidence/governance-benchmark-live-metrics-2026-05-24.md` |
| Offline governance reliability residual metrics (`humanCorrectionRate`, `longHorizonStabilityRate`, `rollbackSuccessRate`) | active — three additional offline metrics for human correction, long-horizon stability, and rollback success; no live-provider recovery claim | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/governance-reliability-metrics.ts`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/tests/governance-reliability-metrics.test.ts` |
| Memory tier classifier contract | schema-defined — single classifier contract for memory tier routing decisions; unit-tested contract surface, no provider prompt reinjection claim | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-tier-classifier.contract.ts`, `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/memory-tier-classifier.test.ts` |
| AIF operational context preview | active — public-sync summary-only preview harness with targeted and full LPF test proof; no live memory reinjection, graph authority, or provider prompt injection claim | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/aif-operational-context-preview.ts`, `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/aif-operational-context-preview.test.ts`, `docs/evidence/post-aif-operationalization-boundary-2026-05-24.md` |
| Non-coder outcome quick actions (home UI) | active — three governed pack entry points wired in home page | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/OutcomeQuickActions.tsx` |
| Runtime actor-role gate on execute path | active — `allowedActorRoles` enforced for three governed pack policies; non-permitted roles rejected with HTTP 403 before provider dispatch | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execute-role-resolver.ts`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` |
| Post Phase 2.B publicization readiness | proven — bounded internal coherence summary plus narrow two-window, two-provider `/api/execute` repeatability evidence; no broad stability or production readiness claim | `docs/evidence/post-phase-2b-publicization-readiness.md` |
| Provider method breadth | partially proven — VI4 provider-method readout exists for named live route calls; no universal provider-method parity claim | `docs/evidence/vertical-integration-provider-workflow-coverage-2026-05-25.md` |
| Async workers / subagents | roadmap | concepts exist; canonical lifecycle not claimed |
| Tool/MCP/database action governance | roadmap | guards exist; full action taxonomy not claimed |
| Graph/code-intelligence context | roadmap | no graph-native context resolver claim |

---

## Risk-Tier Public Claim Posture

The public catalog uses risk-tier language only where evidence exists. These
tiers describe current public claim posture, not a promise that every request
in a tier will pass.

| Risk tier | Current public posture | Evidence |
| --- | --- | --- |
| `R1` | Best-evidenced public lane. The bounded non-coder Strategy path, VI4 package, provider breadth proof, and multi-workflow proof are all R1-compatible route evidence. | `docs/evidence/vertical-integration-provider-workflow-coverage-2026-05-25.md`, `docs/guides/CVF_NON_CODER_SETUP_GUIDE_2026-05-24.md` |
| `R2` | Governed/approval-aware posture only. CVF may classify and gate higher-risk work, but this catalog does not claim broad R2 hosted/provider execution readiness. | `docs/evidence/web-governance-path.md`, `docs/evidence/claim-boundaries.md` |
| `R3` | Policy-boundary and denial/escalation posture only. No public claim is made that R3 requests can be executed through provider lanes. | `GOVERNANCE.md`, `docs/evidence/claim-boundaries.md` |

Boundary: moving a capability from R1 to R2/R3 execution readiness requires a
fresh live evidence packet and catalog update. The May 25 VI wave does not lift
that boundary.

---

## Key Extensions

CVF is built from modular extensions. Each is self-contained with its
own tests. This table gives readers enough context to understand what
already exists before proposing new work.

| Extension | What it does | Status |
| --- | --- | --- |
| `CVF_v1.6_AGENT_PLATFORM` | Web UI: governed execute path, template marketplace, role-based access, analytics, safety dashboard | active |
| `CVF_GUARD_CONTRACT` | Governance contract SDK: role-permission, runtime-workflow, orchestrator, memory-continuity contracts | active |
| `CVF_ECO_v2.2_GOVERNANCE_CLI` | Governance CLI: `cvf-guard evaluate`, `audit`, `session`, `report` | active |
| `CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE` | Skill lifecycle: fusion, evolution, probation, deprecation, ranking, governed registry | active |
| `CVF_MODEL_GATEWAY` | Provider adapter hub: LLM, tool, and memory adapters with routing policy, fallback policy, gateway receipt | active |
| `CVF_LEARNING_PLANE_FOUNDATION` | Memory governance: controlled memory gateway, retention policy events, tier contracts | active |
| `CVF_ECO_v3.0_TASK_MARKETPLACE` | Task marketplace: governed task registry, template binding, outcome-oriented task packs | active |
| `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` | Phase governance: deterministic orchestration, guard runtime pipeline, hardened session protocol | active |

Full extension inventory: `docs/reference/CVF_MODULE_INVENTORY.md`

---

## What Users Can Expect

**Non-coders:** CVF is strongest where the request enters a trusted
form or bounded governed workflow. The platform resolves your role,
selects the right workflow, runs provider and policy checks, and
returns a governed artifact with an evidence receipt — not a raw chat
response.

**Developers:** CVF is strongest where phase, guard, policy, and
evidence contracts are respected by the repository workflow. The
governance CLI, release gate, and guard contract SDK are the primary
developer surfaces.

**Agents:** Treat this repository as a governed workspace, not a
free-form coding sandbox. Read the front-door instructions before
changing files. Do not claim governance behavior without live proof.
Use roadmap and approval gates for substantial continuation.

For governance-kernel coherence, read
`docs/reference/CVF_PUBLIC_GOVERNANCE_KERNEL_COHERENCE_2026-05-22.md` before
creating new kernel-law, runtime-authority, execution-state, or core-ontology
documents. The current public posture is audit-equivalent through existing
owner surfaces unless a future review proves a concrete missing surface.

---

## What Developers Can Verify

```bash
# Start here
cat README.md
cat ARCHITECTURE.md
cat docs/GET_STARTED.md

# Evidence
cat docs/evidence/README.md
cat docs/evidence/latest-release-gate.md
cat docs/evidence/provider-lanes.md
cat docs/evidence/web-governance-path.md
cat docs/evidence/phase-e-governed-execution-chain.md
cat docs/evidence/vertical-integration-provider-workflow-coverage-2026-05-25.md
cat docs/evidence/surface1-web-export-i18n-coverage-2026-05-26.md
cat docs/reference/CVF_PUBLIC_GOVERNANCE_KERNEL_COHERENCE_2026-05-22.md

# Run the full release gate
python scripts/run_cvf_release_gate_bundle.py --json
```

Mock-only UI checks are not sufficient for claims that CVF controls AI
or provider behavior. Live provider proof is required.

---

## Claim Boundary

CVF may claim:

- governance-first AI control framework
- public evaluation calibration for external agents through
  `docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`
- bounded live non-coder value on certified provider lanes
- evidence-backed provider lanes where receipts exist
- bounded Phase 2.B publicization evidence for one governed route across
  Alibaba and DeepSeek, including second-window repeatability
- response-level vertical integration packaging on named provider/model lanes
  and selected workflow templates
- public guidance for multi-agent/provider role routing and cost-posture
  selection through the dedicated provider-routing guide
- bounded CVF 28.05 public-sync capability export for Delta/WCE/EL/PM and
  LHW15/LHW16 through reference specs, public evidence records, and curated
  evidence summary
- governed knowledge-backed execution in the proven execute path
- governed Product Brief workflow with role permission, step traces, and receipt
- bounded workflow state/recovery readouts for Product Brief,
  `strategy_analysis`, `marketing_campaign_wizard`, and `brand_voice`
- schema-defined LHW3 documentation connector standards for failure trends,
  clarification re-intake, and spec-change packet handoff
- schema-defined LHW5 documentation connector standards for database-action
  boundaries, artifact-export advisories, and failure-simulation scenario
  packets
- bounded English-mode Surface 1 markdown export i18n for
  `app_builder_complete`
- public auditability through docs, evidence packets, guards, and release gates
- governance-kernel coherence as audit-equivalent for public reader orientation
- public external-review calibration through
  `docs/evidence/public-external-review-snapshot-2026-06-19.md`

CVF does not yet claim:

- complete Agent OS status
- universal provider parity across all methods
- automatic route governance coverage merely because a public route file exists
- that static CI/public-surface checks prove live AI governance behavior
- automatic provider/model assignment across external IDE extensions or hidden
  agent tabs based only on the public provider-routing guide
- full external capability marketplace readiness
- full legacy repository absorption
- all-template workflow runtime or broad workflow engine status
- public-build-ready runtime source/test export for Delta/WCE/EL/PM
- that ignored internal roadmaps, reviews, baselines, hidden IDE histories, or
  session handoffs are public product artifacts
- runtime enforcement of LHW3/LHW5 connector standards, live failure alerting,
  automatic clarification re-entry, automatic spec-change mutation, database
  execution, export blocking, or live failure-simulation execution
- complete role-permission, memory-reinjection, async-worker,
  graph-context, database-action, or provider-method coverage
- broad provider stability, persistence/database readiness, Maika
  child-data/photo/vision proof, kernel-owner replacement, or global freeze
  lift
- that A2 coherence documentation proves new runtime, provider, tool,
  database, or subagent governance behavior

Full boundary document: `docs/reference/CVF_PUBLIC_CATALOG_CLAIM_BOUNDARY_2026-05-18.md`

---

## Catalog Update Rule

This catalog must be updated when a capability tranche is closed. The
update rules:

1. New proven capability → add a row with `proven` status and an
   evidence path verified in the public-sync clone.
2. New or extended extension → add or update the extension table row.
3. Row status upgrade (`roadmap` → `partially absorbed` → `proven`) →
   update status and replace with a concrete evidence link.
4. Every new path must exist in the public-sync clone and pass
   `Test-Path` before being cited. Do not copy provenance paths
   without re-verifying them here — broken links have occurred this way.

---

## Related Artifacts

- `README.md` — entry point
- `ARCHITECTURE.md` — system shape and layer model
- `GOVERNANCE.md` — governance posture
- `docs/GET_STARTED.md` — getting started guide
- `docs/evidence/README.md` — evidence index
- `docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`
- `docs/evidence/public-external-review-snapshot-2026-06-19.md`
- `docs/reference/CVF_PUBLIC_CATALOG_CLAIM_BOUNDARY_2026-05-18.md`
- `docs/reference/CVF_PUBLIC_GOVERNANCE_KERNEL_COHERENCE_2026-05-22.md`
- `docs/reference/CVF_MODULE_INVENTORY.md`
- `docs/guides/CVF_MULTI_AGENT_PROVIDER_ROUTING.md`
- `docs/benchmark/` — QBS benchmark results
