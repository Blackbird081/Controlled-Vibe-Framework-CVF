# CVF Track 5 — Deferred Architecture Readiness Assessment

Memory class: FULL_RECORD
> Document type: PRE-AUTHORIZATION ASSESSMENT (DEFERRAL BASELINE) — **RESOLVED: 5A+5B DELIVERED W64-T1**
> Tranche context: Post-MC5 Continuation Strategy — Track 5 (Deferred Architecture)
> Date: 2026-04-08 (initial) / 2026-04-08 (updated — architectural blocker analysis + doctrine audit + implementation)
> Re-assessment boundary: ~~2026-05-01~~ — **5A+5B resolved 2026-04-08 via W64-T1; 5C remains CLOSED-BY-DEFAULT**
> Authored by: CVF Agent (Strategic Audit + Implementation)
> Required gate before execution: `GC-018 W64-T1` filed and satisfied for 5A+5B; 5C requires separate governance override
>
> **CLOSURE NOTE (2026-04-08):** Sub-items 5A and 5B have been implemented and delivered under GC-018 W64-T1 authorization. Architectural decisions were resolved via doctrine audit (§8): Option B for Model Gateway, worker_threads for Sandbox Runtime. Deliverables: `ProviderRouterContract` (CPF, 26 tests), `SandboxIsolationContract` + `WorkerThreadSandboxAdapter` (EPF, 26 tests). CPF 2955 / EPF 734 tests, 0 failures. Sub-item 5C remains CLOSED-BY-DEFAULT.

---

## Purpose

This document serves as the canonical baseline for Track 5 of the Post-MC5 Continuation Strategy
(`docs/roadmaps/CVF_POST_MC5_CONTINUATION_STRATEGY_ROADMAP_2026-04-08.md`). It records:

1. The deferral verdict and its evidence basis — differentiated per sub-item (5A/5B/5C)
2. What foundation already exists (verified against repo)
3. What implementation gaps remain — including an architectural discovery about gateway types
4. The conditions a future agent must verify before opening a Track 5 GC-018
5. A proposed roadmap for execution when authorized

A future agent MUST read this document and the sources cited herein before proposing or executing
any Track 5 work. The deferral is intentional and backed by architectural evidence — it is not an
oversight. **However, §1 identifies that the 2026-05-01 calendar boundary is NOT the binding
constraint for sub-items 5A and 5B. Their real blockers are architectural decisions, not time.**

---

## 1. Deferral Verdict

The 2026-05-01 boundary was the *default* re-assessment date from the roadmap. Code inspection
(§3D) reveals that the real blockers are architectural decisions, not calendar time. The verdict
is now differentiated per sub-item.

### 1A — Model Gateway (provider routing)

#### Verdict: BLOCKED ON ARCHITECTURAL DECISION — not calendar-blocked

The blocker is an unresolved architectural question that must be answered before any code is
written. Two incompatible options exist (see §4, Gap A). Calendar constraint is secondary.

| Criterion | Status | Evidence |
|---|---|---|
| Architecture question resolved | `NO` — Option A vs Option B undecided | §3D (code inspection finding) |
| Concrete LLM adapter implementations | `NONE` — `LLMAdapter` interface exists; zero provider implementations | `CVF_v1.7.3_RUNTIME_ADAPTER_HUB/contracts/llm.adapter.interface.ts` |
| Deployment context | `NOT IDENTIFIED` — no cloud provider, model list, or cost envelope known | W58-T1 MC4 closure review |
| Can proceed early? | `YES — after Option A/B decision` | Human decision required; see §4 Gap A |

### 1B — Sandbox Runtime (physical isolation)

#### Verdict: BLOCKED ON PLATFORM DECISION — can start immediately after decision

The wiring point already exists in EPF. `CommandRuntimeContract` already routes R3-risk entries
to `DELEGATED_TO_SANDBOX` status. What is missing is the real executor behind that wiring.
No calendar constraint applies — only a platform choice is needed.

| Criterion | Status | Evidence |
|---|---|---|
| Wiring point exists in EPF | `YES` — `DELEGATED_TO_SANDBOX` status in `CommandRuntimeContract` | `command.runtime.contract.ts` line 92; `execution.pipeline.contract.ts` line 84 |
| Physical isolation implemented | `NO` — only `sandboxEnabled` boolean toggle | `CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.mode.ts` |
| Platform selected | `NO` — worker_threads / Docker / V8 / other undecided | §4 Gap B |
| Can proceed early? | `YES — after platform decision` | Human decision required; `worker_threads` recommended |

### 1C — Agent Definition Registry (L0-L4 consolidation)

#### Verdict: HARD GOVERNANCE GATE — calendar and architectural constraint both apply

This sub-item is CLOSED-BY-DEFAULT regardless of calendar date. It requires a separate governance
override that is not part of Track 5 re-assessment.

| Criterion | Status | Evidence |
|---|---|---|
| Relocation posture | `CLOSED-BY-DEFAULT` | `AGENT_HANDOFF.md` W55-T1 row |
| Required gates | Preservation override + GC-019 + GC-039 + dedicated branch | W55-T1 MC1 closure assessment |
| Can proceed early? | `NO` — governance override must be filed independently | Not a calendar question |

### Summary

| Sub-item | Binding blocker | Calendar (2026-05-01) required? |
|---|---|---|
| 5A Model Gateway | Architectural decision: Option A vs B | No — decision unblocks it |
| 5B Sandbox Runtime | Platform decision: worker_threads vs Docker | No — decision unblocks it |
| 5C Agent Definition Registry | Governance override (GC-019+GC-039) | No — separate gate entirely |

---

## 2. Scope of Track 5

Three sub-items as defined in the roadmap:

| Sub-item | Roadmap label |
|---|---|
| A | Model Gateway (provider routing) |
| B | Sandbox Runtime (physical isolation) |
| C | Agent Definition Registry (L0-L4 consolidation) |

Sub-item C is additionally governed by the CLOSED-BY-DEFAULT relocation posture established in
W55-T1 (MC1). It requires an explicit preservation override before reopening.

**Evidence**: `AGENT_HANDOFF.md` W55-T1 row: *"agent-definition registry + L0-L4 consolidation
deferred (relocation-class, CLOSED-BY-DEFAULT)"*.

---

## 3. Foundation Inventory — What Already Exists

### 3A. Model Gateway Foundation

All of the following are FROZEN (FIXED_INPUT) — do not modify.

| File | Role | Status |
|---|---|---|
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/ai.gateway.contract.ts` | Signal normalization, PII/secret masking, env metadata | FROZEN — W1-T4 |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.contract.ts` | Token validation, expiry, revocation | FROZEN |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.pii.detection.contract.ts` | Pattern-based PII identification | FROZEN |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.consumer.contract.ts` | Generic consumer wrapper | FROZEN |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/model.gateway.boundary.contract.ts` | CPF→EPF execution authority boundary declaration | FROZEN — W8-T1 CP2 |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.gateway.barrel.ts` | Barrel export for all gateway types | FROZEN — W45-T1 |
| `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/mandatory-gateway.ts` | SDK-level MandatoryGateway — all channels MUST pass guard evaluation | FROZEN — Sprint 8.3 |
| `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/contracts/llm.adapter.interface.ts` | LLMAdapter interface (generate, stream) | FROZEN — L5 |
| `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/openclaw.adapter.ts` | OpenClaw concrete adapter | FROZEN |
| `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/picoclaw.adapter.ts` | PicoClaw concrete adapter | FROZEN |
| `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/zeroclaw.adapter.ts` | ZeroClaw concrete adapter | FROZEN |
| `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/nano.adapter.ts` | Nano concrete adapter | FROZEN |

**Batch variants** (all FROZEN, all tested in CPF 2929):
`ai.gateway.batch.contract.ts`, `gateway.auth.batch.contract.ts`,
`gateway.pii.detection.batch.contract.ts`, `gateway.consumer.batch.contract.ts`
+ corresponding consumer pipeline variants (18 files total).

**What the boundary contract declares** (from `model.gateway.boundary.contract.ts`):
- CPF owns: intent validation, phase gate enforcement, context packaging, AI Gateway signal normalization (design-time)
- EPF owns: actual model invocation, ExecutionPipelineReceipt, artifact staging, spec policy enforcement (build-time)
- Canonical handoff: `ControlPlaneConsumerPackage → ExecutionPipelineContract` (locked W7-T3 CP2)

**Evidence**: `AGENT_HANDOFF.md` W8-T1 row: *"ModelGatewayBoundaryContract canonically closed
W8-T1 2026-03-29; model gateway boundary convergence delivered"*. CPF test count 2929, 0 failures.

### 3B. Sandbox Runtime Foundation

| File | Role | Status |
|---|---|---|
| `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.mode.ts` | Boolean toggle (`sandboxEnabled`) | FROZEN — minimal stub |
| `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/tests/safety-runtime-sandbox-snapshot-policy-diff.test.ts` | Snapshot policy diff test | EXISTS |
| `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/tests/safety-runtime-domain-refusal-gateway.test.ts` | Domain refusal gateway test | EXISTS |
| EPF `DispatchContract` + `PolicyGateContract` + `CommandRuntimeContract` | Governs worker agent execution at the dispatch level | FROZEN — EPF 1301 tests |

**What currently substitutes for physical isolation**: Worker agents are governed via
`DispatchContract → PolicyGateContract → CommandRuntimeContract` pipeline. This provides
**logical isolation** (policy enforcement, authorization gating) but NOT physical process isolation,
resource limiting, or filesystem sandboxing.

**Evidence**: `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` architecture diagram: *"Sandbox Runtime
[DEFERRED] Worker agents governed via Dispatch/PolicyGate/CommandRuntime; full physical
isolation → future wave"*. Also `AGENT_HANDOFF.md` W58-T1 row.

### 3C. Agent Definition Registry Foundation

Multiple agent definition contracts exist across planes (W12-W21 tranches). The consolidation
question is whether to relocate these into a single L0-L4 registry.

**Current state**: Agent definition surfaces are in GEF (Trust & Isolation, W19-W21 contracts)
and referenced in CPF boundary declarations. No single canonical registry file exists.

**Evidence**: `AGENT_HANDOFF.md` W55-T1 row + W12-T1 through W21-T1 rows in P3-CP2 audit trail.

### 3D. Code Inspection Finding — Two Gateway Types Are Disconnected

*This section was added after direct code inspection (2026-04-08). It identifies the binding
architectural blocker for 5A and the wiring opportunity for 5B.*

CVF currently contains **two distinct and unconnected gateway systems**:

| System | Files | What it does | Connected? |
| --- | --- | --- | --- |
| **Governance Gateway** (CPF) | `ai.gateway.contract.ts`, `mandatory-gateway.ts`, all batch variants | Signal normalization, PII masking, auth gating, phase enforcement | ✅ Fully operational, 2929 tests |
| **LLM Adapter Interface** (Adapter Hub) | `llm.adapter.interface.ts`, 4 runtime adapters | Provider-facing interface (`generate`, `stream`) | ✅ Interface only — zero concrete LLM implementations |
| **Runtime Adapters** (Adapter Hub) | `openclaw.adapter.ts`, `zeroclaw.adapter.ts`, etc. | `filesystem`, `shell`, `http` capabilities | ✅ Operational — NOT LLM providers |

**Critical finding**: The 4 concrete adapters (OpenClaw/PicoClaw/ZeroClaw/Nano) implement
`RuntimeAdapter` (filesystem/shell/http), NOT `LLMAdapter` (generate/stream). They are NOT
LLM provider implementations. There are **zero concrete LLM provider adapters** in the codebase.

**Evidence**:

- `openclaw.adapter.ts` line 19: `readonly capabilities: RuntimeCapability[] = ['filesystem', 'shell', 'http']`
- `zeroclaw.adapter.ts` line 14: `readonly capabilities: RuntimeCapability[] = ['http']`
- `llm.adapter.interface.ts`: defines `LLMAdapter.generate()` — no class implements it anywhere

This means the "provider routing" gap (5A) is larger than previously documented: not only is there
no router, there are also no routable LLM provider targets.

**Sandbox wiring finding**: `CommandRuntimeContract` (`command.runtime.contract.ts` line 92) already
has a `case "sandbox"` branch that sets `status: "DELEGATED_TO_SANDBOX"`. The pipeline knows what
sandbox delegation means — it just has no real executor behind it. `ExecutionPipelineContract` line
84 already counts `sandboxedCount` in its receipt. The EPF wiring point is **complete and waiting**.

**Evidence**:

- `command.runtime.contract.ts` line 47: `const status = sandbox ? "DELEGATED_TO_SANDBOX" : "EXECUTED"`
- `command.runtime.contract.ts` line 64: notes string: *"Task delegated to sandbox execution — R3 risk level requires isolated environment"*
- `execution.pipeline.contract.ts` line 84: `sandboxedCount` tracked in pipeline receipt and hash

---

## 4. Implementation Gaps — What Is Missing

### Gap A: Model Gateway Provider Router

**Unresolved architectural question (binding blocker)**:

Before any code is written, the following question must be answered by a human decision-maker.
Two options exist and produce completely different implementations:

**Option A — CVF-as-Runtime**: CVF itself calls LLM providers directly.

- Requires: concrete `LLMAdapter` implementations for Claude, OpenAI, Gemini, etc.
- Requires: API keys, cloud credentials, cost budget management in CVF
- Scope: significant — CVF becomes an AI runtime, not just a governance layer
- Consistency: inconsistent with current CVF posture (governance framework, not runtime)

**Option B — CVF-as-Governance**: CVF governs that external agents (Claude Code, Copilot, etc.)
must pass through a policy gate before calling their own LLM providers.

- Requires: `ProviderRouterContract` that validates the *intent to call* a provider, not the call itself
- Requires: `GovernedInvocationPolicy` that specifies which providers are allowed under which conditions
- Scope: minimal — follows existing `ModelGatewayBoundaryContract` pattern (boundary declaration)
- Consistency: consistent with all existing CVF architecture

**Recommendation**: Option B. It follows the `ModelGatewayBoundaryContract` precedent exactly.
The "routing" is governance routing (which policy applies), not network routing (which server to call).

**What's missing under Option B**:

- `ProviderRouterContract.route(GatewayProcessedRequest, ProviderPolicy) → ProviderSelection`
- `ProviderSelection { allowedAdapterId, rationale, deniedReason? }`
- Consumer pipeline + batch variant per CPF pattern
- Barrel export to `control.plane.gateway.barrel.ts`
- ~30 tests — no live LLM calls needed

**What's missing under Option A** (for reference only):

- Concrete `LLMAdapter` implementations (at minimum: Claude + OpenAI)
- Secret management integration (API keys, credential rotation)
- Cost tracking, rate limiting, retry logic
- Significant new infrastructure — not recommended at this stage

### Gap B: Sandbox Runtime Physical Isolation

**Wiring point is ready — only executor is missing.**

The EPF pipeline already understands sandbox delegation (`DELEGATED_TO_SANDBOX` status,
`sandboxedCount` in receipt). The gap is exclusively the real executor behind that wiring.

**What's missing**:

- `SandboxIsolationContract` — typed contract replacing the boolean toggle in `sandbox.mode.ts`
- A concrete platform adapter wired into the `case "sandbox"` branch of `CommandRuntimeContract`
- Integration test proving R3-risk entries actually execute in isolation

**Platform options (decision required)**:

| Option | Isolation strength | External deps | Windows compatible | Recommended |
| --- | --- | --- | --- | --- |
| `worker_threads` (Node.js) | Medium — separate thread, shared memory space | None | ✅ Yes | ✅ First option |
| Docker container | High — separate process + filesystem | Docker daemon | ✅ Yes (Docker Desktop) | Second option |
| V8 isolate | Low — JS-only, no filesystem | None | ✅ Yes | Not recommended (too limited) |
| OS namespaces | High — OS-level | Linux only | ❌ No | Not recommended (platform lock) |

**Recommendation**: `worker_threads` as first implementation. Zero external dependencies, Node.js
native, works on Windows (current dev platform), consistent with Adapter Hub pattern.
Can be upgraded to Docker later via adapter swap without changing the contract.

**Path from decision to code**:

1. Human confirms `worker_threads`
2. New file: `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/contracts/sandbox.isolation.contract.ts`
3. New file: `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/worker.thread.sandbox.adapter.ts`
4. Wire adapter into `CommandRuntimeContract` `case "sandbox"` branch
5. Remove `sandbox.mode.ts` boolean toggle or deprecate it
6. ~20 tests

### Gap C: Agent Definition Registry

**What's missing**: A single canonical registry contract aggregating L0-L4 agent definitions.

**Why not built yet**: The relocation-class work is CLOSED-BY-DEFAULT. Opening it requires:
(1) a preservation override document, (2) a dedicated branch, (3) GC-019 + GC-039 authorization.
The architectural value does not justify this overhead at the current stage.

**Counter-argument space**: This gap has the weakest case for near-term execution. Only reopen if
a specific operational need emerges (e.g., a downstream system requires a registry API contract).

---

## 5. Pre-Authorization Checklist

The checklist is split by sub-item. Items marked **(HUMAN)** require a human decision and cannot
be resolved by an agent alone.

### For 5A — Model Gateway (can open GC-018 immediately after decisions are made)

- [ ] **A1 — Architecture option chosen** **(HUMAN)**: Option A (CVF calls LLM directly) or
  Option B (CVF governs intent to call)? Recommendation: Option B.
- [ ] **A2 — If Option A chosen**: Identify which providers (Claude, OpenAI, Gemini) and confirm
  API key management strategy before filing GC-018.
- [ ] **A3 — Test strategy**: Confirm mock-adapter approach for tests (no live LLM calls in CI).
- [ ] **A4 — GC-023 pre-flight**: New `.ts` file must stay under 700 lines (advisory) / 1000 (hard).

### For 5B — Sandbox Runtime (can open GC-018 immediately after decision is made)

- [ ] **B1 — Platform selected** **(HUMAN)**: `worker_threads` (recommended) / Docker / other?
- [ ] **B2 — Windows compatibility confirmed**: Platform works on Windows 11 (current dev env).
- [ ] **B3 — Wiring point reviewed**: Re-read `command.runtime.contract.ts` `case "sandbox"` before
  writing new code to ensure adapter interface matches what the pipeline expects.
- [ ] **B4 — GC-023 pre-flight**: New `.ts` files must stay under 700 lines each.

### For 5C — Agent Definition Registry (separate governance gate, not a checklist item)

- Requires: preservation override document + dedicated branch + GC-019 + GC-039
- Do not include in 5A or 5B GC-018 scope

### Shared pre-flight (for any Track 5 GC-018)

- [ ] **S1 — Re-read AGENT_HANDOFF.md**: Verify current state of main branch before starting.
- [ ] **S2 — CI baseline**: All CI jobs green on main (Track 1 delivered 100% coverage).
- [ ] **S3 — Pre-push hook**: Check `check_progress_tracker_sync.py` stability
  (CP3 deferred from W61-T1 — verify in AGENT_HANDOFF.md).
- [ ] **S4 — GC-026 sync**: Any whitepaper-touching work requires tracker sync baseline.

---

## 6. Proposed Implementation Roadmap (Conditional — post decisions)

This roadmap is PROPOSED ONLY. It becomes executable only after the human decisions in §5
are made and a fresh GC-018 is filed and authorized. The 2026-05-01 calendar date is the
default boundary; it can be bypassed once the decisions in §5 A1 and §5 B1 are made.

### Phase A: Model Gateway Provider Router (priority: HIGH if authorized)

**A1 — ProviderRouterContract** (REALIZATION, ~1 tranche)
- New file: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/provider.router.contract.ts`
- Interface: `ProviderRouterContract.route(GatewayProcessedRequest, RouterPolicy) → ProviderSelection`
- Types: `RouterPolicy { providers, fallbackChain, riskCeiling, costBudget }`, `ProviderSelection { adapterId, rationale, fallbackChain }`
- Consumer pipeline + batch variant per CPF pattern
- Target: ~30 tests, follows `ModelGatewayBoundaryContract` as pattern anchor
- Barrel: add to `control.plane.gateway.barrel.ts`

**A2 — GovernedLLMInvocation Bridge** (REALIZATION, ~1 tranche)
- New file: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/governed.llm.invocation.contract.ts`
- Wires `ProviderRouterContract` output → `LLMAdapter.generate()` from Adapter Hub
- Enforces pre-invocation: `MandatoryGateway.check()` + PII detection pass + auth validation
- Produces `GovernedInvocationReceipt` compatible with EPF `ExecutionPipelineReceipt`
- Target: ~25 tests

**A3 — Integration + Whitepaper update** (DOCUMENTATION/INTEGRATION, ~1 tranche)
- End-to-end path: `ContextPackage → AIGateway → ProviderRouter → LLMAdapter → GovernedReceipt → ExecutionPipelineContract`
- Whitepaper: Model Gateway box `[DEFERRED]` → `DELIVERED`
- GC-026 tracker sync required

### Phase B: Sandbox Runtime Physical Isolation (priority: MEDIUM if authorized)

**B1 — SandboxIsolationContract** (REALIZATION, ~1 tranche)
- New file: `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/contracts/sandbox.isolation.contract.ts`
- Replace boolean stub with typed contract: `SandboxIsolationContract.createSandbox(SandboxConfig) → SandboxInstance`
- `SandboxConfig { resourceLimits, networkPolicy, filesystemPolicy, timeoutMs }`
- `SandboxInstance.execute(command) → SandboxResult { stdout, stderr, exitCode, containmentViolations }`
- Target: ~20 tests

**B2 — Platform Adapter** (REALIZATION, ~1 tranche, platform-dependent)
- Implement one concrete adapter: `WorkerThreadSandboxAdapter` (recommended first option)
- Wire into `RuntimeAdapterInterface` from `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
- Auto-route R2/R3 risk actions from `PolicyGateContract` through sandbox
- Target: ~20 tests

**B3 — Integration + Whitepaper update** (DOCUMENTATION/INTEGRATION, ~1 tranche)
- Sandbox Runtime box `[DEFERRED]` → `DELIVERED`
- GC-026 tracker sync required

### Phase C: Agent Definition Registry (priority: LOW — CLOSED-BY-DEFAULT)

- Do not open without explicit preservation override + dedicated branch + GC-019 + GC-039
- Not included in initial re-assessment scope

---

## 7. Evidence Trail

A future agent wishing to verify claims in this document should read these sources in order:

| Source | Location | Relevant claim |
|---|---|---|
| Continuation strategy roadmap | `docs/roadmaps/CVF_POST_MC5_CONTINUATION_STRATEGY_ROADMAP_2026-04-08.md` | Track 5 LOW priority, post May 2026 — calendar default |
| MC4 EPF closure | `AGENT_HANDOFF.md` W58-T1 row | Model Gateway + Sandbox Runtime DEFERRED by design, not accident |
| Whitepaper architecture diagram | `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` lines ~197-214 | `Model Gateway [DEFERRED]`, `Sandbox Runtime [DEFERRED]` labels |
| Post-MC5 quality assessment | `docs/assessments/CVF_POST_W59_CONTINUATION_QUALITY_ASSESSMENT_2026-04-07.md` | Future EPF wave requires `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` readiness + fresh GC-018 |
| Gateway boundary contract | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/model.gateway.boundary.contract.ts` | 18 FIXED_INPUT surfaces frozen; 2 IN_SCOPE extensible; CPF/EPF authority split declared |
| Mandatory Gateway | `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/mandatory-gateway.ts` | Logical governance (check/assertAllowed) fully implemented; physical isolation separate |
| LLM adapter interface | `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/contracts/llm.adapter.interface.ts` | `LLMAdapter.generate()` interface — zero concrete implementations |
| Runtime adapters (NOT LLM) | `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/openclaw.adapter.ts` line 19 | `capabilities: ['filesystem', 'shell', 'http']` — confirms these are NOT LLM providers |
| Sandbox wiring point | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/command.runtime.contract.ts` line 92 | `case "sandbox"` branch sets `DELEGATED_TO_SANDBOX` — EPF wiring complete, executor missing |
| Pipeline sandbox count | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.pipeline.contract.ts` line 84 | `sandboxedCount` tracked in receipt and pipeline hash — EPF sandbox-aware |
| Sandbox stub | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.mode.ts` | Only a 3-line boolean toggle; not connected to EPF pipeline |
| MC1 CPF closure | `AGENT_HANDOFF.md` W55-T1 row | Agent Definition Registry CLOSED-BY-DEFAULT — relocation class |

---

## 8. Doctrine-Based Architectural Decision Audit

The following decisions are derived from the CVF Supreme Doctrine (`ECOSYSTEM/doctrine/`,
status: FROZEN) and the Master Architecture Whitepaper. They are NOT opinion — they are the
only choices consistent with the existing architectural constraints.

### 8A — Model Gateway: Option B (CVF-as-Governance) is the ONLY valid choice

**Decision: Option B — CVF governs intent to call, does NOT call LLM providers directly.**

Evidence chain (5 sources, each independently sufficient):

| # | Source | Location | What it says | Why it forces Option B |
| --- | --- | --- | --- | --- |
| 1 | Supreme Doctrine — Architectural Position | `ECOSYSTEM/doctrine/CVF_ARCHITECTURE_PRINCIPLES.md` §2 | *"CVF is not: an AI model provider"* | Option A makes CVF a model provider. Doctrine FROZEN. |
| 2 | Supreme Doctrine — Product Positioning | `ECOSYSTEM/doctrine/CVF_PRODUCT_POSITIONING.md` §3 | *"NOT: LLM platform"*, *"NOT: Agent builder"* | Option A introduces LLM platform responsibilities. |
| 3 | Supreme Doctrine — Model-Agnostic Principle | `CVF_ARCHITECTURE_PRINCIPLES.md` §9 | *"CVF must remain independent from specific AI models"* | Option A binds CVF to specific provider SDKs (OpenAI, Claude). |
| 4 | Supreme Doctrine — Strategic Law | `CVF_PRODUCT_POSITIONING.md` §10 | *"Control the rules, not the agents"* | Option A controls the agents (calls LLM for them). Option B controls the rules (governs which providers are allowed). |
| 5 | Whitepaper — Target-State Principle #4 | `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` §7.3 rule 4 | *"Agents do not call AI providers directly — Provider access qua governed Model Gateway"* | This describes agents accessing providers THROUGH the gateway, not CVF calling providers itself. The gateway GOVERNS access, it doesn't PERFORM the access. |

**Additional structural evidence:**

+ The Whitepaper architecture diagram (lines 200-207) labels Model Gateway as *"boundary gov in
  CPF W8-T1; EPF provider routing → future wave"*. The word "boundary" confirms it is a
  governance boundary, not a calling boundary.
+ `ModelGatewayBoundaryContract` (CPF) declares `FIXED_INPUT` surfaces and `IN_SCOPE` boundary
  declarations — a governance pattern, not a runtime invocation pattern.
+ `MandatoryGateway` (Guard Contract) enforces `check()` / `assertAllowed()` — it validates
  whether an action MAY proceed, not performing the action itself.
+ The Adapter Hub `LLMAdapter` interface exists at L5 (Adapter layer) for EXTERNAL consumers
  to implement, not for CVF core to fill with provider SDKs.

**What Option B produces concretely:**

+ `ProviderRouterContract.route(GatewayProcessedRequest, ProviderPolicy) → ProviderSelection`
+ This is a POLICY decision contract: "given this request and this policy, which provider(s)
  is the agent ALLOWED to use?" — not "call this provider for me"
+ Zero API keys, zero provider SDKs, zero network calls in CVF core
+ Consumer pipeline + batch variant per CPF pattern, ~30 tests
+ Consistent with `ModelGatewayBoundaryContract` precedent (governance declaration)

**Option A is architecturally invalid.** It violates 3 FROZEN doctrine principles and the
strategic law. No GC-018 can authorize it without first amending the Supreme Doctrine, which
requires explicit architectural approval per `CVF_DOCTRINE_RULES.md` §6.

### 8B — Sandbox Runtime: `worker_threads` is the architecturally correct first adapter

**Decision: `worker_threads` (Node.js native) as the first Sandbox isolation platform.**

Evidence chain:

| # | Source | Location | What it says | Why it forces `worker_threads` first |
| --- | --- | --- | --- | --- |
| 1 | Doctrine — Execution Isolation Principle | `CVF_ARCHITECTURE_PRINCIPLES.md` §7 | *"Agent execution must occur in controlled and isolated environments"* with *"runtime restrictions, environment boundaries, resource limits"* | The principle requires isolation. It does NOT specify a particular platform. The minimal implementation that satisfies the principle is valid. |
| 2 | Doctrine — Composability Principle | `CVF_ARCHITECTURE_PRINCIPLES.md` §11 | *"Core governance mechanisms should be reusable across different execution environments"* | The contract must be platform-agnostic. The adapter pattern (interface + concrete adapter) is mandatory. `worker_threads` is the first adapter; Docker can be a second adapter later. |
| 3 | Whitepaper — Model Gateway box | `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` lines 211-213 | *"Sandbox Runtime (Worker Agents) [DEFERRED] Worker agents governed via Dispatch/PolicyGate/CommandRuntime; full physical isolation → future wave"* | The diagram explicitly says "Worker Agents" — `worker_threads` is the Node.js realization of worker-level isolation. |
| 4 | EPF wiring point | `command.runtime.contract.ts` line 92 | `case "sandbox"` → `DELEGATED_TO_SANDBOX` | EPF already delegates to sandbox. The adapter MUST wire into this exact branch. No new pipeline needed — only a real executor behind the existing status. |
| 5 | Trust Isolation Boundary | `trust.isolation.boundary.contract.ts` lines 112-124 | R3 → `HARD_BLOCK` (pending human review); R2 → `ESCALATE` (governance approval); R0/R1 → `PASS` | The trust contract already defines WHEN sandbox applies: R2/R3 risk actions. The sandbox adapter must enforce this, not redefine it. |
| 6 | Current platform | Dev environment | Windows 11, Node.js ecosystem | Docker Desktop requires WSL2 or Hyper-V. `worker_threads` requires nothing beyond Node.js. OS namespaces require Linux. V8 isolates have no filesystem access. Only `worker_threads` works with zero additional setup. |

**Why NOT Docker as first adapter:**

+ Docker introduces external dependency (Docker daemon) — violates minimal-dependency principle
+ Docker is an UPGRADE path (second adapter), not the foundation adapter
+ The Adapter Hub pattern (`RuntimeAdapter` interface) allows swapping later without contract change

**Why NOT V8 isolates:**

+ No filesystem access — cannot execute `CommandRuntimeContract` actions that require file I/O
+ Too limited for the scope declared in whitepaper ("Worker Agents")

**What `worker_threads` produces concretely:**

+ `SandboxIsolationContract` — typed contract at `CVF_v1.7.1_SAFETY_RUNTIME/contracts/`
+ `WorkerThreadSandboxAdapter` — concrete adapter at `CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/`
+ Wires into `CommandRuntimeContract` `case "sandbox"` (replaces deterministic stub with real execution)
+ R2/R3 risk actions route through sandbox per `TrustIsolationBoundaryContract` policy
+ `sandbox.mode.ts` boolean toggle deprecated (replaced by typed contract)
+ ~20 tests, all in-process, no Docker required

### 8C — Agent Definition Registry: remains CLOSED-BY-DEFAULT

No doctrine evidence supports reopening. The relocation-class governance gate (GC-019+GC-039)
is independent of Track 5.

---

### Summary of Audit Decisions

| Sub-item | Decision | Doctrine basis | Implementation scope |
| --- | --- | --- | --- |
| 5A Model Gateway | **Option B** — CVF governs, does not call | §2 + §9 + §10 of Doctrine; §7.3#4 of Whitepaper | ~1-2 tranches, ~30 tests |
| 5B Sandbox Runtime | **`worker_threads`** first adapter | §7 + §11 of Doctrine; EPF wiring + Trust contract | ~1-2 tranches, ~20 tests |
| 5C Registry | **CLOSED-BY-DEFAULT** — no change | W55-T1 MC1 closure | None |

**This document expires** when the first Track 5 GC-018 is authorized. At that point, the GC-018
authorization document supersedes this assessment.

---

*Authored by: CVF Agent (Strategic Audit)*
*Date: 2026-04-08*
*Updated: 2026-04-08 — §1 per-item verdicts, §3D code inspection finding, §4 architectural
analysis, §5 decision-gated checklist, §7 expanded evidence trail, §8 doctrine-based decision
audit with 5-source evidence chain for 5A and 6-source evidence chain for 5B*
*Governance: No GC-018 required — assessment/documentation class*
*Basis: ECOSYSTEM/doctrine/ (FROZEN) + CVF_MASTER_ARCHITECTURE_WHITEPAPER.md (v3.7-W46T1) +
AGENT_HANDOFF.md + direct repo code inspection (6 source files verified)*
