# CVF Technical Product Catalog

Status: CURRENT - updated 2026-05-24
Version: CVF v4.0.0 GA

## Purpose

This catalog gives users, developers, and agents a compact technical map
of Controlled Vibe Framework (CVF). It answers three questions:

1. What can CVF help me accomplish right now?
2. What capabilities exist and at what maturity level?
3. What does CVF explicitly not claim?

All capability claims in this catalog are backed by a public evidence
path. If no evidence path is listed, the capability is roadmap only.

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
| Governance kernel coherence | audit-equivalent - public reader baseline | `docs/reference/CVF_PUBLIC_GOVERNANCE_KERNEL_COHERENCE_2026-05-22.md`, `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`, `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md` |
| Live governance proof | proven — mandatory for release claims | `docs/evidence/latest-release-gate.md` |
| Governed execution chain (Product Brief) | proven — bounded to selected Product Brief flow | `docs/evidence/phase-e-governed-execution-chain.md` |
| Knowledge-backed execution with guards | proven — bounded execute path | `docs/evidence/cvf-16-5-runtime-absorption.md`, `docs/evidence/web-governance-path.md` |
| Non-coder governed path | proven — bounded provider lanes; Step 0 setup and small-team first-receipt guide paths available | `docs/evidence/web-governance-path.md`, `docs/guides/CVF_NON_CODER_STEP0_API_KEY_SETUP_2026-05-24.md`, `docs/guides/CVF_NON_CODER_SETUP_GUIDE_2026-05-24.md` |
| Execution diagnostics and first-value failure recovery | proven — bounded live-run failure classification and non-coder evidence-to-action surface; no provider SLA or production-readiness claim | `docs/evidence/execution-diagnostics-and-first-value-2026-05-24.md` |
| Workflow chain memory read/write proof | proven — bounded two-turn local workflow-chain proof with live Alibaba `qwen-turbo` receipts; summary-only durable memory receipt, no raw memory reinjection claim | `docs/evidence/workflow-chain-memory-proof-2026-05-24.md` |
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
| Provider method contracts (`ReasoningContract`, `JsonModeContract`, `ToolCallContract`, `EmbeddingContract`) | schema-defined — gateway contract layer; no provider execution claimed | `EXTENSIONS/CVF_MODEL_GATEWAY/src/reasoning-contract.ts`, `EXTENSIONS/CVF_MODEL_GATEWAY/src/json-mode-contract.ts`, `EXTENSIONS/CVF_MODEL_GATEWAY/src/tool-call-contract.ts`, `EXTENSIONS/CVF_MODEL_GATEWAY/src/embedding-contract.ts` |
| Governance reliability benchmark CLI (`cvf benchmark governance`, `cvf benchmark run`) | active — 12-metric offline computation against audit JSONL; `run` subcommand emits formatted reliability report | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/governance-reliability-metrics.ts`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/command.registry.ts`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/tests/governance-reliability-metrics.test.ts` |
| Governance benchmark live metrics | proven — bounded 5-call hosted Alibaba/qwen-turbo benchmark window; call-level result `5/5 PASS`; event-model metrics measured `taskCompletionRate=0.5`, `policyViolationRate=0`, `receiptIntegrityRate=0.5` because each call emits two benchmark events; no SLA or production-readiness claim | `docs/evidence/governance-benchmark-live-metrics-2026-05-24.md` |
| Offline governance reliability residual metrics (`humanCorrectionRate`, `longHorizonStabilityRate`, `rollbackSuccessRate`) | active — three additional offline metrics for human correction, long-horizon stability, and rollback success; no live-provider recovery claim | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/governance-reliability-metrics.ts`, `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/tests/governance-reliability-metrics.test.ts` |
| Memory tier classifier contract | schema-defined — single classifier contract for memory tier routing decisions; unit-tested contract surface, no provider prompt reinjection claim | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-tier-classifier.contract.ts`, `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/memory-tier-classifier.test.ts` |
| AIF operational context preview | active — public-sync summary-only preview harness with targeted and full LPF test proof; no live memory reinjection, graph authority, or provider prompt injection claim | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/aif-operational-context-preview.ts`, `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/aif-operational-context-preview.test.ts`, `docs/evidence/post-aif-operationalization-boundary-2026-05-24.md` |
| Non-coder outcome quick actions (home UI) | active — three governed pack entry points wired in home page | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/OutcomeQuickActions.tsx` |
| Runtime actor-role gate on execute path | active — `allowedActorRoles` enforced for three governed pack policies; non-permitted roles rejected with HTTP 403 before provider dispatch | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execute-role-resolver.ts`, `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` |
| Post Phase 2.B publicization readiness | proven — bounded internal coherence summary plus narrow two-window, two-provider `/api/execute` repeatability evidence; no broad stability or production readiness claim | `docs/evidence/post-phase-2b-publicization-readiness.md` |
| Provider method breadth | demand-gated | no universal provider-method parity claim |
| Async workers / subagents | roadmap | concepts exist; canonical lifecycle not claimed |
| Tool/MCP/database action governance | roadmap | guards exist; full action taxonomy not claimed |
| Graph/code-intelligence context | roadmap | no graph-native context resolver claim |

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
- bounded live non-coder value on certified provider lanes
- evidence-backed provider lanes where receipts exist
- bounded Phase 2.B publicization evidence for one governed route across
  Alibaba and DeepSeek, including second-window repeatability
- governed knowledge-backed execution in the proven execute path
- governed Product Brief workflow with role permission, step traces, and receipt
- public auditability through docs, evidence packets, guards, and release gates
- governance-kernel coherence as audit-equivalent for public reader orientation

CVF does not yet claim:

- complete Agent OS status
- universal provider parity across all methods
- full external capability marketplace readiness
- full legacy repository absorption
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
- `docs/reference/CVF_PUBLIC_CATALOG_CLAIM_BOUNDARY_2026-05-18.md`
- `docs/reference/CVF_PUBLIC_GOVERNANCE_KERNEL_COHERENCE_2026-05-22.md`
- `docs/reference/CVF_MODULE_INVENTORY.md`
- `docs/benchmark/` — QBS benchmark results
