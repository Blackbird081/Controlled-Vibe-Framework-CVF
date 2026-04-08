# CVF W64-T1 — Track 5 Deferred Architecture (5A+5B) — Execution Plan

Memory class: SUMMARY_RECORD

> Tranche: W64-T1
> Class: REALIZATION
> Lane: Full Lane (GC-019)
> Date: 2026-04-08
> Authorization: docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W64_T1_TRACK5_DEFERRED_ARCHITECTURE_2026-04-08.md
> Baseline: v3.7-W46T1 (CLOSURE-ASSESSED); W63-T1 CLOSED DELIVERED

---

## 1. Objective

Implement Track 5 Deferred Architecture sub-items 5A and 5B from the Post-MC5 Continuation Strategy:

- **5A — Model Gateway Provider Router (Option B)**: Governance routing contract enforcing which LLM providers an agent is ALLOWED to use. CVF governs intent; does not call providers directly (doctrine §2, §9, §10).
- **5B — Sandbox Runtime Physical Isolation (worker_threads)**: Typed isolation contract replacing boolean stub, with `worker_threads` adapter wired per doctrine §7, §11.

Sub-item 5C (Agent Definition Registry) remains CLOSED-BY-DEFAULT per W55-T1.

---

## 2. Scope

### In Scope

| Component | Location | Class |
|-----------|----------|-------|
| `ProviderRouterContract` | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/provider.router.contract.ts` | CPF |
| `provider.router.contract.test.ts` | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/` | CPF tests |
| `SandboxIsolationContract` | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.isolation.contract.ts` | Safety Runtime |
| `sandbox.isolation.contract.test.ts` | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/tests/` | Safety Runtime tests |
| `WorkerThreadSandboxAdapter` | `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/worker.thread.sandbox.adapter.ts` | Adapter Hub |
| Barrel export wiring | `control.plane.gateway.barrel.ts` | CPF |
| Whitepaper update | `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` | DOCUMENTATION |

### Out of Scope

- Concrete LLM provider API calls (Option A — ruled out by doctrine)
- API key management, cost tracking
- Docker adapter (second wave)
- Agent Definition Registry consolidation (5C — CLOSED-BY-DEFAULT)
- Modification of any FIXED_INPUT gateway surface

---

## 3. Control Points

### CP1 — Track 5A+5B Full Implementation (Single-Pass Full Lane)

**Scope**:
1. Implement `ProviderRouterContract` with governance routing logic (Option B)
   - `ProviderDecision`: ALLOW | DENY | ESCALATE
   - Risk ceiling enforcement (R0-R3)
   - Provider filtering (risk, cost tier, capabilities)
   - Explicit approval gate
   - Deterministic hash: `"w64-t1-provider-router"` / `"w64-t1-provider-router-id"`
2. Implement `SandboxIsolationContract` with typed governance contract
   - Replaces boolean stub in `sandbox.mode.ts`
   - Adapter interface (`SandboxExecutor`) for composable wiring
   - Config validation: timeouts, resource limits, filesystem/network policy
   - Stub executor for deterministic testing
3. Implement `WorkerThreadSandboxAdapter` (`CVF_v1.7.3_RUNTIME_ADAPTER_HUB`)
   - `worker_threads` concrete executor
   - Pre-execution policy checks
   - Timeout enforcement
   - Resource limit post-checks
4. Wire barrel exports (CPF gateway barrel)
5. Update whitepaper: Model Gateway `[DEFERRED]` → `DELIVERED`, Sandbox Runtime `[DEFERRED]` → `DELIVERED`

**Governance**: GC-019 Full Lane (concept-to-module creation)

**Tests**:
- CPF: +26 (provider router → `provider.router.contract.test.ts`)
- Safety Runtime: +26 (sandbox isolation → `sandbox.isolation.contract.test.ts`)

**Exit Criteria**:
- CPF: 2929 → 2955 (0 failures)
- Safety Runtime sandbox tests: 26 pass
- No EPF/GEF/LPF regressions

---

## 4. Execution Order

```
CP1: 5A ProviderRouterContract → 5B SandboxIsolationContract → 5B WorkerThreadSandboxAdapter
     ↓
     Barrel wiring + Whitepaper update
     ↓
     Regression verification (CPF + EPF)
     ↓
     Tranche closure (audit + review + delta + GC-026 syncs + quality assessment)
```

---

## 5. File Manifest

| Action | File | Impact |
|--------|------|--------|
| CREATE | `CVF_CONTROL_PLANE_FOUNDATION/src/provider.router.contract.ts` | 5A governance routing |
| CREATE | `CVF_CONTROL_PLANE_FOUNDATION/tests/provider.router.contract.test.ts` | 26 CPF tests |
| CREATE | `CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.isolation.contract.ts` | 5B typed contract |
| CREATE | `CVF_v1.7.1_SAFETY_RUNTIME/tests/sandbox.isolation.contract.test.ts` | 26 sandbox tests |
| CREATE | `CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/worker.thread.sandbox.adapter.ts` | 5B adapter |
| MODIFY | `CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.gateway.barrel.ts` | Barrel export |
| MODIFY | `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` | [DEFERRED] → DELIVERED |

---

## 6. Governance Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| GC-018 Authorization | `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W64_T1_TRACK5_DEFERRED_ARCHITECTURE_2026-04-08.md` | ✅ FILED |
| Execution Plan | `docs/roadmaps/CVF_W64_T1_TRACK5_DEFERRED_ARCHITECTURE_EXECUTION_PLAN_2026-04-08.md` | ✅ This doc |
| GC-026 Auth Sync | `docs/baselines/CVF_GC026_TRACKER_SYNC_W64_T1_AUTHORIZATION_2026-04-08.md` | ⬜ Required |
| CP1 Audit | `docs/audits/CVF_W64_T1_CP1_TRACK5_IMPLEMENTATION_AUDIT_2026-04-08.md` | ⬜ Required |
| CP1 Review | `docs/reviews/CVF_GC019_W64_T1_CP1_TRACK5_IMPLEMENTATION_REVIEW_2026-04-08.md` | ⬜ Required |
| CP1 Delta | `docs/baselines/CVF_W64_T1_CP1_TRACK5_DELTA_2026-04-08.md` | ⬜ Required |
| GC-026 CP1 Sync | `docs/baselines/CVF_GC026_TRACKER_SYNC_W64_T1_CP1_DELIVERED_2026-04-08.md` | ⬜ Required |
| Tranche Closure Review | `docs/reviews/CVF_W64_T1_TRANCHE_CLOSURE_REVIEW_2026-04-08.md` | ⬜ Required |
| GC-026 Closed Sync | `docs/baselines/CVF_GC026_TRACKER_SYNC_W64_T1_CLOSED_2026-04-08.md` | ⬜ Required |
| Post-W64 Assessment | `docs/assessments/CVF_POST_W64_CONTINUATION_QUALITY_ASSESSMENT_2026-04-08.md` | ⬜ Required |

---

## 7. Risk Assessment

**Risk Level**: LOW-MEDIUM

| Risk | Mitigation |
|------|-----------|
| Doctrine violation on Model Gateway | Option B (CVF-as-Governance) confirmed by 5 doctrine sources |
| EPF regression from sandbox wiring | SandboxIsolationContract is additive; stub executor used in tests |
| Worker threads platform constraint | Windows 11 dev env confirmed; `worker_threads` native in Node.js |
| CPF size limit | `provider.router.contract.ts` under GC-023 700-line advisory |

---

*Generated: 2026-04-08*
*Tranche: W64-T1 — Track 5 Deferred Architecture (5A+5B)*
*Authorization: GC-018 REALIZATION class*
