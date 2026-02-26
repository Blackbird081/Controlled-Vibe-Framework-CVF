CVF Core

AI Safety Runtime Kernel for Non-Coders
Safety Absolute by Default — Creative by Permission

Official Mapping Note (CVF Canonical):
- Canonical module ID: `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture`
- Version binding: CVF `v1.7.1` Safety Runtime submodule (no independent version outside CVF policy)
- Layer mapping: Safety Runtime (`Layer 2.5` in root README stack, equivalent `Layer 3` in positioning stack)
- Core compatibility rule: additive hardening only; must not mutate `v1.0/v1.1/v1.2` behavior

Status (2026-02-26):
- Stabilized local module baseline (no GitHub publish yet by owner rule).
- Pre-fix baseline: `docs/CVF_KERNEL_ARCHITECTURE_PRE_FIX_ASSESSMENT_2026-02-25.md`.
- Fix roadmap: `docs/CVF_KERNEL_ARCHITECTURE_FIX_ROADMAP_2026-02-25.md`.
- Tree docs:
  - Target: `TREEVIEW_TARGET.md`
  - Implemented: `TREEVIEW_IMPLEMENTED.md`
- Module quality gate (current): `npm run typecheck` from this folder.
- Module behavioral gate (current): `npm run test:run` from this folder.
- Module coverage gate (current): `npm run test:coverage` from this folder.
- Module integration gate (current): `npm run test:e2e` from this folder.
- Module benchmark gate (current): `npm run bench:orchestrator` from this folder.
- Module CI gate (current): `npm run ci:gate` from this folder.

Coverage Policy (team standard):
- Global minimum: `>= 80%` for statements, branches, functions, lines.
- Core branch minimum: `>= 90%` for statements, branches, functions, lines.
- Coverage scope: `kernel/**/*.ts`, `runtime/**/*.ts`, `internal_ledger/**/*.ts`.
- Coverage exclusions: `*.types.ts`, `*.schema.ts`, `domain_context_object.ts`, `refusal.registry.ts`, test assets.
- Core branches (safety-critical runtime path):
  - `runtime/execution_orchestrator.ts`
  - `runtime/kernel_runtime_entrypoint.ts`
  - `runtime/llm_adapter.ts`
  - `kernel/01_domain_lock/domain_guard.ts`
  - `kernel/02_contract_runtime/contract_runtime_engine.ts`
  - `kernel/03_contamination_guard/risk_scorer.ts`
  - `kernel/04_refusal_router/refusal.router.ts`

Latest validated snapshot (2026-02-26):
- `Tests`: 51/51 passed (13 files)
- `Coverage`: Statements 96.45%, Branches 91.41%, Functions 99.09%, Lines 97.01%
- `Integration`: 5/5 passed (`kernel` <-> `cvf-web` parity + E2E runtime path)
- `Benchmark`: avg 0.15-0.28 ms, p95 1.00 ms (40 runs, local)

Operational Notes (current implementation):
- Runtime invariants:
  - Mandatory runtime gateway: `KernelRuntimeEntrypoint` is the intended execution path.
  - Direct orchestrator construction is blocked.
  - Direct LLM adapter calls are blocked without kernel execution token.
  - LLM execution has timeout guard (configurable `llmTimeoutMs`, default `5000` ms).
  - Runtime has fail-safe error boundary (unexpected pipeline errors degrade to withheld response).
  - Domain enforcement is hard-blocking in orchestrator.
  - Domain preflight lock enforces declared/classified domain match.
  - Contract input/output checks are enforced when contracts are supplied.
  - No output path bypasses risk/refusal gate.
- CVF risk compatibility:
  - Runtime risk assessment includes `cvfRiskLevel` mapped to `R0-R4`.
  - Refusal policy uses versioned registry (`v1` currently active).
  - Refusal policy parity + golden dataset regression validated against `cvf-web` governance baseline.
- Refusal behavior:
  - `R4` => block, `R3` => needs approval, `R0-R2` => allow unless contamination drift/uncertainty requires clarification.
- Extension points:
  - `DomainLockEngine` for preflight structure lock.
  - Contract registry/consumer matrix/transformation guard in contract runtime.
  - Contamination guard (`assumption_tracker`, `drift_detector`, `risk_propagation_engine`, `rollback_controller`).
  - `ExecutionGate` for capability authorization.
  - Internal ledger snapshots for telemetry/forensics (`requestId`, `policyVersion`, `decisionCode`, `traceHash`).

I. What CVF Is

CVF is a structural safety kernel that sits between:

User → LLM → Output

It does not enhance creativity.
It does not optimize prompts.
It does not manage workflows.

It enforces:

Domain boundaries

I/O contracts

Contamination control

Refusal routing

Creative permission

Before any output reaches a non-coder.

II. Why CVF Exists

Most LLM failures are misdiagnosed as:

Hallucination

Bad input

Missing context

But many failures are structural:

Domain bleed

Unauthorized output reuse

Implicit assumption propagation

Confidence drift

CVF prevents these upstream.

III. Architectural Principles

Structure before execution

Explicit domain declaration

Enforced I/O contracts

Risk scoring before exposure

Refusal over guessing

Creative mode is opt-in

Full lineage traceability

No silent mutation.
No implicit boundary.
No automatic domain guessing.

IV. Kernel Architecture

EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/
│
├── kernel/
│   ├── 01_domain_lock/
│   ├── 02_contract_runtime/
│   ├── 03_contamination_guard/
│   ├── 04_refusal_router/
│   └── 05_creative_control/
│
├── runtime/
│   ├── execution_orchestrator.ts
│   ├── kernel_runtime_entrypoint.ts
│   ├── llm_adapter.ts
│   └── session_state.ts
│
└── internal_ledger/
    ├── lineage_tracker.ts
    ├── risk_evolution.ts
    └── boundary_snapshot.ts

V. Layer Responsibilities
01 — Domain Lock

Declares and enforces domain boundaries.
No implicit domain resolution allowed.

02 — Contract Runtime

Validates I/O schema.
Prevents unauthorized reuse.

03 — Contamination Guard

Scores risk.
Detects reasoning contamination signals.

04 — Refusal Router

Decides when to:

Block

Redirect

Degrade

Ask clarification

The system refuses instead of guessing.

05 — Creative Control

Allows controlled expansion.
Disabled by default.

VI. Runtime

Runtime orchestrates:

1 → 2 → 3 → 4 → 5

No layer can be bypassed.
LLM adapter contains no safety logic.

VII. Internal Ledger

The ledger records:

I → P → O lineage

Risk evolution across steps

Boundary snapshots

Refusal events

Ledger does not enforce.
It enables forensic traceability.

VIII. Default Profile (Non-Coder)

By default:

Domain must be declared

Risk tolerance is low

High/critical outputs are blocked

Creative mode is disabled

Capability expansion is forbidden

CVF assumes the user cannot evaluate risk.

IX. What CVF Is Not

Not a prompt engineering toolkit

Not a developer governance framework

Not an agent workflow builder

Not an alignment research project

It is structural safety hygiene.

X. Invariant Rules

These rules must never be broken:

No execution without domain validation

No output reuse without contract validation

No high-risk exposure without refusal check

No creative mode by default

No layer bypass in orchestrator

Violation of any invariant breaks CVF integrity.

XI. Design Philosophy

Context is not more text.
Context is declared structure.

The goal is not to clean output.
The goal is to defend process boundaries.

XII. Long-Term Direction (3–5 Years)

CVF aims to become:

AI Safety Runtime for Non-Coders

Embedded beneath applications, invisible to users, enforcing structure silently.
