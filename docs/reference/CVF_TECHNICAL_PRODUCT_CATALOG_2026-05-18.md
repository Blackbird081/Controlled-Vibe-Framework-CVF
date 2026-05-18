# CVF Technical Product Catalog

Status: CURRENT — updated 2026-05-19
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

---

## What CVF Can Do Today

The following outcomes are proven on at least one certified provider
lane and backed by a public evidence path. Each is bounded — CVF does
not claim these as universal across all templates, providers, or
deployment configurations.

**1. Generate a governed Product Brief with full execution chain.**
A Developer-role user submits a product brief request. CVF resolves
their role to `BUILDER`, checks output permission, binds the workflow,
dispatches ordered steps (intake → retrieval → provider call → receipt
emission), and returns a response with step traces, a governance
evidence receipt, and a workflow audit payload.
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
Evidence: `ARCHITECTURE.md`

**5. Benchmark provider output against the CVF Quality Baseline.**
CVF's benchmark infrastructure supports preregistered quality runs
across provider lanes. Benchmark results are recorded as public
evidence and cited in release decisions.
Evidence: `docs/evidence/current-cvf-quality-status.md`,
`docs/benchmark/`

---

## Capability Catalog

| Capability | Status | Evidence |
| --- | --- | --- |
| Governance control plane | proven | `ARCHITECTURE.md`, `GOVERNANCE.md` |
| Live governance proof | proven — mandatory for release claims | `docs/evidence/latest-release-gate.md` |
| Governed execution chain (Product Brief) | proven — selected flow | `docs/evidence/phase-e-governed-execution-chain.md` |
| Knowledge-backed execution with guards | proven — bounded execute path | `docs/evidence/cvf-16-5-runtime-absorption.md`, `docs/evidence/web-governance-path.md` |
| Non-coder governed path | proven — bounded provider lanes | `docs/evidence/web-governance-path.md` |
| Governance CLI (`cvf-guard`) | active | `ARCHITECTURE.md` |
| Certified provider lanes | proven where evidence exists | `docs/evidence/provider-lanes.md` |
| Skill governance engine | active | `docs/reference/CVF_MODULE_INVENTORY.md` |
| Template marketplace | active | `docs/evidence/web-governance-path.md` |
| Deliverable packs and evidence export | active — web product path | `docs/evidence/web-governance-path.md` |
| Benchmark infrastructure (QBS) | active | `docs/evidence/current-cvf-quality-status.md`, `docs/benchmark/` |
| Role and agent governance | partially proven — selected flow | `docs/evidence/phase-e-governed-execution-chain.md` |
| Memory and continuity contracts | partially absorbed — contract-local | `docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md` |
| Operational observability | partially absorbed | `docs/evidence/cvf-16-5-runtime-absorption.md` |
| External asset/capability governance | partially productized | `docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md` |
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
- governed knowledge-backed execution in the proven execute path
- governed Product Brief workflow with role permission, step traces, and receipt
- public auditability through docs, evidence packets, guards, and release gates

CVF does not yet claim:

- complete Agent OS status
- universal provider parity across all methods
- full external capability marketplace readiness
- full legacy repository absorption
- complete role-permission, memory-reinjection, async-worker,
  graph-context, database-action, or provider-method coverage

Full boundary document: `docs/reference/CVF_PUBLIC_CATALOG_CLAIM_BOUNDARY_2026-05-18.md`

---

## Catalog Update Rule

This catalog must be updated when a capability tranche is closed. The
update rules:

1. New proven capability → add a row with `proven` status and an
   evidence path verified in this repository.
2. New or extended extension → add or update the extension table row.
3. Row status upgrade (`roadmap` → `partially absorbed` → `proven`) →
   update status and replace with a concrete evidence link.
4. Every new path must exist in this repository before being cited.

---

## Related Artifacts

- `README.md` — entry point
- `ARCHITECTURE.md` — system shape and layer model
- `GOVERNANCE.md` — governance posture
- `docs/GET_STARTED.md` — getting started guide
- `docs/evidence/README.md` — evidence index
- `docs/reference/CVF_PUBLIC_CATALOG_CLAIM_BOUNDARY_2026-05-18.md`
- `docs/reference/CVF_MODULE_INVENTORY.md`
- `docs/benchmark/` — QBS benchmark results
