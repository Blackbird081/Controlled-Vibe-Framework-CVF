# CVF Track 5 — Deferred Architecture Readiness Assessment

Memory class: FULL_RECORD
> Document type: PRE-AUTHORIZATION ASSESSMENT (DEFERRAL BASELINE)
> Tranche context: Post-MC5 Continuation Strategy — Track 5 (Deferred Architecture)
> Date: 2026-04-08
> Re-assessment boundary: **2026-05-01**
> Authored by: CVF Agent (Strategic Audit)
> Required gate before execution: fresh `GC-018` authorization after re-assessment passes

---

## Purpose

This document serves as the canonical baseline for Track 5 of the Post-MC5 Continuation Strategy
(`docs/roadmaps/CVF_POST_MC5_CONTINUATION_STRATEGY_ROADMAP_2026-04-08.md`). It records:

1. The deferral verdict and its evidence basis
2. What foundation already exists (verified against repo)
3. What implementation gaps remain
4. The conditions a future agent must verify before opening a Track 5 GC-018
5. A proposed roadmap for execution when authorized

A future agent MUST read this document and the sources cited herein before proposing or executing
any Track 5 work. The deferral is intentional and backed by architectural evidence — it is not an
oversight.

---

## 1. Deferral Verdict

**VERDICT: DEFERRED — do not proceed before 2026-05-01 re-assessment**

| Criterion | Status | Evidence |
|---|---|---|
| Roadmap authorization | `DEFERRED` — explicitly LOW priority, post May 2026 | `CVF_POST_MC5_CONTINUATION_STRATEGY_ROADMAP_2026-04-08.md` §3 Track 5 |
| Architecture closure gap | `NONE` — all planes DONE-ready/DONE without Track 5 | `AGENT_HANDOFF.md` line 78; `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` §component-table |
| Business driver | `NOT IDENTIFIED` — no deployment target or provider requirement known | W58-T1 MC4 closure review |
| Platform dependency | `UNRESOLVED` — Sandbox isolation requires platform selection first | Whitepaper architecture diagram (Sandbox Runtime `[DEFERRED]`) |
| Re-assessment boundary | `NOT REACHED` — boundary is 2026-05-01, today is 2026-04-08 | `CVF_POST_MC5_CONTINUATION_STRATEGY_ROADMAP_2026-04-08.md` §4 item 4 |

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

---

## 4. Implementation Gaps — What Is Missing

### Gap A: Model Gateway Provider Router

**What's missing**: No component exists that:
- Selects which LLM provider to use based on policy, context, risk level, cost budget
- Manages failover/fallback between providers
- Enforces rate limits and model-specific constraints
- Routes through the governed pipeline (CPF `AIGatewayContract → ProviderRouter → LLMAdapter`)
- Produces a governed invocation receipt wired into EPF `ExecutionPipelineContract`

**Why not built yet**: CVF is a governance framework, not an LLM runtime. Provider routing
requires a live deployment context (cloud provider, API keys, model availability, cost envelope)
that is external to the governance architecture. Building the router without a deployment target
produces untestable code.

**Counter-argument space**: A future agent could argue that a *contract-only* ProviderRouter
(interface + policy declaration, zero live invocation) is sufficient for architectural completeness.
This would follow the same pattern as `ModelGatewayBoundaryContract` (boundary declaration without
provider implementation). If that argument is made, the scope should be limited to:
`ProviderRouterContract` + consumer pipeline + batch variant + ~30 tests — NO live LLM calls.

### Gap B: Sandbox Runtime Physical Isolation

**What's missing**: No component exists that:
- Creates an isolated execution environment (process, thread, or VM boundary)
- Enforces resource limits (CPU time, memory, network egress)
- Restricts filesystem access (chroot, read-only paths, temp-only write)
- Reports containment violations as governance events
- Integrates with `PolicyGateContract` to auto-route R2/R3 actions into sandbox

**Why not built yet**: Physical isolation is platform-specific. Options are:
- Node.js `worker_threads` (in-process, low overhead, limited isolation)
- Docker containers (process isolation, high overhead, requires Docker daemon)
- V8 isolates (JS-only, no filesystem)
- OS-level namespaces (Linux-specific, requires elevated permissions)

No platform decision has been made. Building without a platform target produces untestable,
potentially incompatible isolation code.

**Counter-argument space**: A future agent could argue for a `worker_threads`-based adapter as a
minimal first implementation (Node.js native, no external dependencies). This is the lowest-risk
option and aligns with the Adapter Hub pattern from `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`.

### Gap C: Agent Definition Registry

**What's missing**: A single canonical registry contract aggregating L0-L4 agent definitions.

**Why not built yet**: The relocation-class work is CLOSED-BY-DEFAULT. Opening it requires:
(1) a preservation override document, (2) a dedicated branch, (3) GC-019 + GC-039 authorization.
The architectural value does not justify this overhead at the current stage.

**Counter-argument space**: This gap has the weakest case for near-term execution. Only reopen if
a specific operational need emerges (e.g., a downstream system requires a registry API contract).

---

## 5. Re-Assessment Checklist (2026-05-01)

A future agent performing the re-assessment must verify ALL of the following before filing a GC-018:

- [ ] **R1 — Deployment context**: Is there a known deployment target that requires provider
  routing? (Cloud provider, model list, cost envelope, latency SLA)
- [ ] **R2 — Platform decision**: Has a Sandbox isolation platform been selected?
  (worker_threads / Docker / V8 isolate / other)
- [ ] **R3 — Test infrastructure**: Can the proposed implementation be tested without live LLM
  calls? (contract-only or mock-adapter approach)
- [ ] **R4 — Pre-push hook stability**: Is the `check_progress_tracker_sync.py` pre-push hook
  stable? (CP3 deferred from W61-T1 — check `AGENT_HANDOFF.md` current state)
- [ ] **R5 — CI baseline**: Are all CI jobs passing on main? (Track 1 delivered 100% CI coverage;
  verify no regression)
- [ ] **R6 — No higher-priority work**: Are Tracks 1-4 fully stable with no open remediation
  items?
- [ ] **R7 — GC-023 pre-flight**: For any new file, check line count will stay under 700 lines
  (advisory) / 1000 lines (hard) for `.ts` files; 900/1200 for `.md` files.

---

## 6. Proposed Implementation Roadmap (Conditional — post re-assessment)

This roadmap is PROPOSED ONLY. It becomes executable only after:
(a) re-assessment passes (2026-05-01+), AND
(b) a fresh GC-018 is filed and authorized.

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

## 7. Evidence Trail for Counter-Arguments

A future agent wishing to challenge the deferral should read these documents in order:

| Source | Location | Relevant claim |
|---|---|---|
| Continuation strategy roadmap | `docs/roadmaps/CVF_POST_MC5_CONTINUATION_STRATEGY_ROADMAP_2026-04-08.md` | Track 5 explicitly LOW priority, post May 2026 |
| MC4 EPF closure | `AGENT_HANDOFF.md` W58-T1 row | Model Gateway DEFERRED by design, not by accident |
| Whitepaper architecture diagram | `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (lines ~197-214) | Model Gateway `[DEFERRED]`, Sandbox Runtime `[DEFERRED]` |
| Post-MC5 quality assessment | `docs/assessments/CVF_POST_W59_CONTINUATION_QUALITY_ASSESSMENT_2026-04-07.md` | Future EPF wave requires `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` readiness + fresh GC-018 |
| Gateway boundary contract | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/model.gateway.boundary.contract.ts` | FIXED_INPUT surfaces are frozen; only IN_SCOPE surfaces are extensible |
| Mandatory Gateway | `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/mandatory-gateway.ts` | Logical governance is fully implemented; physical isolation is separate concern |
| Adapter Hub | `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/contracts/llm.adapter.interface.ts` | LLMAdapter interface exists; no router exists |
| Sandbox stub | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.mode.ts` | Only a boolean toggle; physical isolation is unimplemented |
| MC1 CPF closure | `AGENT_HANDOFF.md` W55-T1 row | Agent Definition Registry CLOSED-BY-DEFAULT |

---

## 8. Audit Conclusion

**VERDICT: DEFERRED — VALID ARCHITECTURAL DECISION**

Track 5 items were not overlooked. They were assessed during MC4 (W58-T1) and formally deferred
as *"intentionally future-facing"*. The foundation contracts (boundary declarations, adapter
interfaces, logical governance) are solid and fully tested. What is absent is the implementation
layer, which requires external decisions (deployment platform, provider selection) that are not
yet made.

**No implementation should begin before**:
1. Re-assessment on or after 2026-05-01
2. All checklist items in §5 pass
3. A fresh GC-018 is filed and authorized

**This document expires** when the first Track 5 GC-018 is authorized. At that point, the GC-018
authorization document supersedes this assessment.

---

*Authored by: CVF Agent (Strategic Audit)*
*Date: 2026-04-08*
*Governance: No GC-018 required — assessment/documentation class*
*Basis: AGENT_HANDOFF.md + CVF_MASTER_ARCHITECTURE_WHITEPAPER.md + repo code inspection*
