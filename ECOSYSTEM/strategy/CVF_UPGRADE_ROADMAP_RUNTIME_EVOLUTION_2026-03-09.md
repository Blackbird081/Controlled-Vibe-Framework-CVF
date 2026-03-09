# 🗺️ CVF UPGRADE ROADMAP — Runtime Evolution Track (2026-03-09)

> **Developed by Tien - Tan Thuan Port@2026**
>
> **Baseline:** [`CVF_INDEPENDENT_SYSTEM_ASSESSMENT_2026-03-09.md`](../../docs/assessments/CVF_INDEPENDENT_SYSTEM_ASSESSMENT_2026-03-09.md)
> **Mục tiêu:** Nâng CVF từ **governance framework** lên **governance-enforced runtime platform**
> **Phương châm:** Từ "documented governance" → "runtime-enforced governance" → "vibe control experience"
> **Score mục tiêu:** 7.8/10 → **9.2/10**

---

## DASHBOARD

| Track | Phase | Tên | Trạng thái | Score Impact |
|---|---|---|---|---|
| II | A | Guard Runtime Engine | ✅ DONE | 6.5 → 8.5 |
| II | B | Agent Conformance & Cross-Extension Wiring | ✅ DONE | 7.5 → 8.5 |
| II | C | Adoption Simplification & SDK | ✅ DONE | 7.0 → 8.5 |
| II | D | Observability & Feedback Loop | ✅ DONE | 7.8 → 9.0 |
| II | E | Cloud-Ready & Multi-Agent Runtime | ✅ DONE | 5.5 → 8.0 |

---

## PHASE A — Guard Runtime Engine (🔴 Critical Priority)

> **Mục tiêu:** Chuyển 100% governance guards từ document-only thành machine-enforceable runtime gates
> **Closes:** GAP-GUARD-01, GAP-GUARD-04, GAP-PIPE-01
> **Score target:** Guard enforcement 6.5 → 8.5

### A.1 — CVF Guard Runtime Middleware

**Mô tả:** Xây dựng một runtime middleware layer nằm giữa user request và agent execution. Mọi action phải đi qua Guard Runtime trước khi agent được phép thực thi.

**Architecture:**

```
User Request
    ↓
┌─────────────────────────────────┐
│  CVF GUARD RUNTIME              │
│  ┌───────────┐ ┌──────────────┐ │
│  │ Phase Gate │ │ Risk Gate    │ │
│  └───────────┘ └──────────────┘ │
│  ┌───────────┐ ┌──────────────┐ │
│  │ Auth Gate  │ │ Mutation Gate│ │
│  └───────────┘ └──────────────┘ │
│  ┌───────────┐ ┌──────────────┐ │
│  │ Scope Gate│ │ Audit Gate   │ │
│  └───────────┘ └──────────────┘ │
│  → ALLOW / BLOCK / ESCALATE     │
└─────────────────────────────────┘
    ↓ (if ALLOW)
Agent Execution (Safety Kernel)
    ↓
CVF Post-Check
    ↓
Response to User
```

**Deliverables:**

| # | Task | File/Location | Tests | Priority |
|---|---|---|---|---|
| A.1.1 | Design `GuardRuntime` interface & types | `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/guard.runtime.types.ts` | — | P0 |
| A.1.2 | Implement `GuardRuntimeEngine` class | `governance/guard_runtime/guard.runtime.engine.ts` | 20+ | P0 |
| A.1.3 | Implement `PhaseGateGuard` (runtime) | `governance/guard_runtime/guards/phase.gate.guard.ts` | 10+ | P0 |
| A.1.4 | Implement `RiskGateGuard` (runtime) | `governance/guard_runtime/guards/risk.gate.guard.ts` | 10+ | P0 |
| A.1.5 | Implement `AuthorityGateGuard` (runtime) | `governance/guard_runtime/guards/authority.gate.guard.ts` | 8+ | P0 |
| A.1.6 | Implement `MutationBudgetGuard` (runtime) | `governance/guard_runtime/guards/mutation.budget.guard.ts` | 8+ | P1 |
| A.1.7 | Implement `ScopeGuard` (runtime) | `governance/guard_runtime/guards/scope.guard.ts` | 8+ | P1 |
| A.1.8 | Implement `AuditTrailGuard` (runtime) | `governance/guard_runtime/guards/audit.trail.guard.ts` | 6+ | P1 |
| A.1.9 | Integration test: full guard pipeline | `tests/guard.runtime.integration.test.ts` | 15+ | P0 |
| A.1.10 | Export from index.ts + barrel test | `index.ts` | 3+ | P2 |

**Success Criteria:**
- [ ] 100% guards có runtime implementation (không chỉ document)
- [ ] GuardRuntimeEngine xử lý request → ALLOW/BLOCK/ESCALATE trong <50ms
- [ ] Integration test cover full pipeline: request → guard chain → decision
- [ ] 85+ tests PASS cho toàn bộ guard runtime

### A.2 — Document Guards → Code Guards Migration

**Mô tả:** Chuyển đổi 8 guards hiện chỉ có document thành code-enforceable.

| Guard hiện tại (doc-only) | Runtime implementation cần tạo | Tests |
|---|---|---|
| `CVF_ADR_GUARD.md` | `adr.guard.ts` — check ADR entry exists before feat/refactor commit | 6+ |
| `CVF_DEPTH_AUDIT_GUARD.md` | `depth.audit.guard.ts` — 5-question scoring, hard-stop at <5 | 8+ |
| `CVF_ARCHITECTURE_CHECK_GUARD.md` | `architecture.check.guard.ts` — validate 9-checkbox before implement | 8+ |
| `CVF_DOCUMENT_NAMING_GUARD.md` | `document.naming.guard.ts` — validate CVF_ prefix convention | 5+ |
| `CVF_DOCUMENT_STORAGE_GUARD.md` | `document.storage.guard.ts` — validate taxonomy per INDEX.md | 5+ |
| `CVF_WORKSPACE_ISOLATION_GUARD.md` | `workspace.isolation.guard.ts` — validate sibling workspace only | 5+ |
| `CVF_DIAGRAM_VALIDATION_GUARD.md` | `diagram.validation.guard.ts` — (enhance existing placeholder) | 6+ |
| `CVF_GUARD_REGISTRY_GUARD.md` | `guard.registry.guard.ts` — validate guard registered in KB + README | 5+ |

**Success Criteria:**
- [ ] 8/8 document guards converted to runtime code
- [ ] Each guard: document (human-readable) + code (machine-enforceable)
- [ ] 48+ new tests PASS
- [ ] Guard Registry updated in CVF_CORE_KNOWLEDGE_BASE.md

### A.3 — E2E Governance Pipeline Runtime

**Mô tả:** Xây dựng orchestration engine chạy E2E flow: `intent → design → build → review → audit → rollback`

| # | Task | Mô tả | Tests |
|---|---|---|---|
| A.3.1 | `PipelineOrchestrator` class | Manage full lifecycle từ intent → completion/rollback | 15+ |
| A.3.2 | Phase transition engine | Enforce gate checks trước khi chuyển phase | 10+ |
| A.3.3 | Rollback coordinator | Wire WorkflowCoordinator vào pipeline | 8+ |
| A.3.4 | Pipeline event emitter | Real-time events cho monitoring | 6+ |
| A.3.5 | E2E integration test | Full pipeline run: intent → build → review → complete | 10+ |

**Success Criteria:**
- [ ] Pipeline chạy được end-to-end từ code
- [ ] Phase transitions có gate enforcement
- [ ] Rollback hoạt động ở bất kỳ phase nào
- [ ] 49+ tests PASS

### Phase A Tổng kết

| Metric | Target |
|---|---|
| **New modules** | 20+ files |
| **New tests** | 180+ |
| **Guards machine-enforced** | 18/18 (100%) |
| **Score impact** | Guard: 6.5→8.5, Pipeline: 7.5→8.5 |

---

## PHASE B — Agent Conformance & Cross-Extension Wiring (🟡 High Priority)

> **Mục tiêu:** Chứng minh rằng agent thực sự tuân thủ CVF, và wiring cross-extension hoạt động thật
> **Closes:** GAP-GUARD-02, GAP-GUARD-03, GAP-PIPE-02
> **Dependency:** Phase A (Guard Runtime phải có trước)

### B.1 — Agent Conformance Test Suite

**Mô tả:** Tạo bộ test xác minh agent có tuân thủ CVF governance hay không. Tương tự "Acid Test" cho browsers.

**Deliverables:**

| # | Task | Mô tả | Tests |
|---|---|---|---|
| B.1.1 | Design conformance scenario schema | JSON schema cho test scenarios | — |
| B.1.2 | Phase boundary tests (10 scenarios) | Agent có dừng ở phase boundary không? | 10 |
| B.1.3 | Risk escalation tests (8 scenarios) | Agent có escalate R2/R3 tasks đúng không? | 8 |
| B.1.4 | Authority boundary tests (8 scenarios) | Agent có vượt authority không? | 8 |
| B.1.5 | Audit trail tests (6 scenarios) | Agent có log đúng format không? | 6 |
| B.1.6 | Safety kernel bypass tests (8 scenarios) | Agent có bypass được Safety Kernel không? | 8 |
| B.1.7 | Deviation handling tests (5 scenarios) | Agent có xử lý deviation đúng không? | 5 |
| B.1.8 | Conformance runner + report generator | `cvf-conformance-agent run --provider claude` | 5 |
| B.1.9 | Golden baseline cho agent conformance | Expected behavior baseline | — |

**Success Criteria:**
- [ ] 45+ agent conformance scenarios defined
- [ ] Runner chạy được với mock agent
- [ ] Report format: "Agent X đạt Y% CVF conformance"
- [ ] Golden baseline established

### B.2 — Multi-Entry Guard Enforcement (CLI / MCP / Direct)

**Mô tả:** Mở rộng guard enforcement từ chỉ cvf-web sang tất cả entry points.

| # | Task | Mô tả | Tests |
|---|---|---|---|
| B.2.1 | Guard middleware cho CLI (`cvf-validate`) | Inject guard checks vào CLI flow | 10+ |
| B.2.2 | Guard middleware cho MCP server | MCP tool calls đi qua guard runtime | 10+ |
| B.2.3 | Guard middleware cho direct API | HTTP middleware cho REST/SDK calls | 8+ |
| B.2.4 | Unified guard config | Một config file cho tất cả entry points | 5+ |
| B.2.5 | Integration tests cross-entry | Same guard, different entry → same result | 10+ |

**Success Criteria:**
- [ ] Guards enforce ở 4 entry points: Web, CLI, MCP, API
- [ ] Unified config: thay đổi 1 nơi, áp dụng mọi nơi
- [ ] 43+ tests PASS

### B.3 — Cross-Extension Workflow Wiring

**Mô tả:** Wire `WorkflowCoordinator` (Phase 4 đã implement) vào ecosystem thật.

| # | Task | Mô tả | Tests |
|---|---|---|---|
| B.3.1 | Wire WorkflowCoordinator vào Agent Platform | Multi-agent workflow qua coordinator | 8+ |
| B.3.2 | Cross-extension state sharing | Shared state giữa extensions via coordinator | 8+ |
| B.3.3 | Extension dependency resolver | Auto-resolve extension dependencies cho workflow | 6+ |
| B.3.4 | E2E cross-extension test | 3+ extensions chạy trong 1 workflow | 10+ |

**Success Criteria:**
- [ ] WorkflowCoordinator chạy thật với 3+ extensions
- [ ] State sharing giữa extensions hoạt động
- [ ] 32+ tests PASS

### Phase B Tổng kết

| Metric | Target |
|---|---|
| **New modules** | 15+ files |
| **New tests** | 120+ |
| **Agent conformance scenarios** | 45+ |
| **Guard entry points** | 4 (Web, CLI, MCP, API) |
| **Score impact** | Pipeline: 7.5→8.5, Guard: 8.5→9.0 |

---

## PHASE C — Adoption Simplification & SDK (🟡 High Priority)

> **Mục tiêu:** Giảm barrier adoption từ "hàng giờ" xuống "15 phút"
> **Closes:** GAP-GUARD-05, GAP-VIBE-01, GAP-PIPE-03
> **Dependency:** Phase A (Guard Runtime phải có trước)

### C.1 — CVF Governance SDK (`cvf-governance` npm package)

**Mô tả:** Tạo lightweight SDK để downstream projects adopt CVF governance nhanh chóng.

| # | Task | Mô tả | Tests |
|---|---|---|---|
| C.1.1 | Package scaffolding | `packages/cvf-governance/` với package.json, tsconfig | — |
| C.1.2 | Core exports: PhaseGate, RiskCheck, AuditLog | 3 modules thiết yếu cho downstream | 15+ |
| C.1.3 | `createCVFGovernance(config)` factory | One-call setup cho downstream project | 8+ |
| C.1.4 | Middleware adapters: Express, Next.js, Fastify | HTTP middleware inject guards | 12+ |
| C.1.5 | Configuration schema + validation | `cvf.config.json` cho downstream | 6+ |
| C.1.6 | README + Quick Start cho SDK | "CVF Governance in 5 minutes" | — |
| C.1.7 | Publish preparation (npm pack dry run) | Ensure publishable | 3+ |

**Success Criteria:**
- [ ] `npm install cvf-governance` → working governance trong 5 phút
- [ ] 3 core modules: PhaseGate, RiskCheck, AuditLog
- [ ] Framework adapters: Express, Next.js, Fastify
- [ ] 44+ tests PASS

### C.2 — Template Project Generator

**Mô tả:** Scaffold tool tạo project mới với CVF governance đã wire sẵn.

| # | Task | Mô tả | Tests |
|---|---|---|---|
| C.2.1 | `create-cvf-project` CLI tool | `npx create-cvf-project my-app` | 8+ |
| C.2.2 | Template: Express + CVF Governance | Backend template | 5+ |
| C.2.3 | Template: Next.js + CVF Governance | Fullstack template | 5+ |
| C.2.4 | Template: Agent Workflow + CVF | Multi-agent template | 5+ |
| C.2.5 | Post-scaffold validation | Verify generated project passes CVF compat | 6+ |

**Success Criteria:**
- [ ] `npx create-cvf-project` → working project trong 2 phút
- [ ] 3 templates: Backend, Fullstack, Agent
- [ ] Generated project passes CVF governance checks out-of-box
- [ ] 29+ tests PASS

### C.3 — CI/CD Remote Enforcement

**Mô tả:** Chuyển enforcement từ local-only sang CI-proven.

| # | Task | Mô tả |
|---|---|---|
| C.3.1 | GitHub Actions: conformance gate | `.github/workflows/cvf-conformance.yml` |
| C.3.2 | GitHub Actions: guard runtime check | `.github/workflows/cvf-guard-check.yml` |
| C.3.3 | GitHub Actions: release gate | `.github/workflows/cvf-release-gate.yml` |
| C.3.4 | Pre-commit hooks | Guard checks trước mỗi commit |
| C.3.5 | Badge generation | Auto-update conformance + test badges |

**Success Criteria:**
- [ ] 3 GitHub Actions workflows chạy trên push/PR
- [ ] Pre-commit hooks enforce guards locally
- [ ] Badges auto-updated từ CI results

### Phase C Tổng kết

| Metric | Target |
|---|---|
| **New packages** | 2 (cvf-governance, create-cvf-project) |
| **New tests** | 73+ |
| **CI workflows** | 3 |
| **Adoption time** | Hours → 15 minutes |
| **Score impact** | Vibe Control: 7.0→8.5, Adoption: ⭐⭐→⭐⭐⭐⭐ |

---

## PHASE D — Observability & Feedback Loop (🟢 Medium Priority)

> **Mục tiêu:** Real-time monitoring + user feedback → adaptive governance
> **Closes:** GAP-PIPE-04, GAP-VIBE-02, GAP-VIBE-03
> **Dependency:** Phase A, B

### D.1 — Real-time Pipeline Monitor

| # | Task | Mô tả | Tests |
|---|---|---|---|
| D.1.1 | Pipeline telemetry collector | Collect phase timing, guard decisions, risk events | 10+ |
| D.1.2 | Governance metrics dashboard | Live view: phase flow, guard hit rate, risk distribution | 8+ |
| D.1.3 | Alert system | Alert on: guard bypass attempt, risk escalation, phase violation | 6+ |
| D.1.4 | Conformance drift detector | Detect when extensions drift from baseline | 8+ |

### D.2 — User Satisfaction Feedback Loop

| # | Task | Mô tả | Tests |
|---|---|---|---|
| D.2.1 | Feedback collector API | User rates: output quality, governance friction, vibe accuracy | 6+ |
| D.2.2 | Satisfaction → Governance adjuster | Auto-adjust: mode strictness, creative range, gate sensitivity | 10+ |
| D.2.3 | Governance effectiveness report | Weekly report: guard hit rate, user satisfaction, risk prevented | 5+ |
| D.2.4 | A/B governance testing | Test different governance levels on different workflows | 8+ |

### D.3 — Vibe Control Dashboard

| # | Task | Mô tả | Tests |
|---|---|---|---|
| D.3.1 | "Vibe Meter" widget | Real-time visualization: current vibe level (SAFE→CREATIVE) | 5+ |
| D.3.2 | Vibe history timeline | Timeline view: how vibe changed during session | 5+ |
| D.3.3 | One-click vibe adjustment | User slides vibe → governance auto-adjusts | 6+ |
| D.3.4 | Vibe presets | Preset profiles: "Strict Enterprise", "Balanced Team", "Creative Solo" | 4+ |

### Phase D Tổng kết

| Metric | Target |
|---|---|
| **New modules** | 12+ files |
| **New tests** | 81+ |
| **Dashboard widgets** | 5+ |
| **Score impact** | Vibe Control: 8.5→9.0, Overall: 8.5→9.0 |

---

## PHASE E — Cloud-Ready & Multi-Agent Runtime (🔵 Strategic)

> **Mục tiêu:** Nâng CVF từ local framework lên cloud-ready platform với multi-agent orchestration
> **Closes:** GAP-VIBE-04
> **Dependency:** Phase A, B, C

### E.1 — Multi-Agent Runtime Orchestration

| # | Task | Mô tả | Tests |
|---|---|---|---|
| E.1.1 | Agent Session Manager | Track agent state, phase, risk level real-time | 12+ |
| E.1.2 | Agent-to-Agent communication protocol | Structured message passing with governance check | 10+ |
| E.1.3 | Parallel agent execution engine | Run agents in parallel with shared governance | 10+ |
| E.1.4 | Agent handoff protocol | Transfer context between agents with audit trail | 8+ |
| E.1.5 | Multi-agent workflow templates | Architect → Builder → Reviewer pattern | 6+ |

### E.2 — CVF Cloud Service

| # | Task | Mô tả |
|---|---|---|
| E.2.1 | CVF Governance API (REST) | Cloud API cho remote governance checks |
| E.2.2 | Cloud dashboard | Web dashboard cho team governance monitoring |
| E.2.3 | Team management | Multi-user governance with role-based access |
| E.2.4 | Audit log cloud storage | Persistent audit trail in cloud |
| E.2.5 | Webhook integrations | Slack, Teams, Discord notifications cho guard events |

### E.3 — Runtime Framework Adapters

| # | Task | Mô tả | Tests |
|---|---|---|---|
| E.3.1 | LangGraph adapter | CVF governance layer cho LangGraph workflows | 10+ |
| E.3.2 | AutoGen adapter | CVF governance layer cho AutoGen agents | 10+ |
| E.3.3 | CrewAI adapter | CVF governance layer cho CrewAI crews | 8+ |
| E.3.4 | OpenAI Agents SDK adapter | CVF governance cho OpenAI agent handoffs | 8+ |
| E.3.5 | Universal adapter interface | Common interface cho tất cả runtime frameworks | 6+ |

### Phase E Tổng kết

| Metric | Target |
|---|---|
| **New modules** | 20+ files |
| **New tests** | 98+ |
| **Runtime adapters** | 4 (LangGraph, AutoGen, CrewAI, OpenAI) |
| **Cloud features** | 5 (API, Dashboard, Teams, Audit, Webhooks) |
| **Score impact** | Runtime: 5.5→8.0, Multi-agent: ⭐⭐→⭐⭐⭐⭐ |

---

## TIMELINE TỔNG HỢP

```
Phase A: Guard Runtime Engine ────────── [Week 1-3]
    ├── A.1 Guard Runtime Middleware      [Week 1-2]
    ├── A.2 Doc→Code Guard Migration     [Week 2]
    └── A.3 E2E Pipeline Runtime         [Week 2-3]

Phase B: Agent Conformance ───────────── [Week 3-5]
    ├── B.1 Agent Conformance Suite      [Week 3-4]
    ├── B.2 Multi-Entry Enforcement      [Week 4]
    └── B.3 Cross-Extension Wiring       [Week 4-5]

Phase C: Adoption SDK ───────────────── [Week 5-7]
    ├── C.1 CVF Governance SDK           [Week 5-6]
    ├── C.2 Template Generator           [Week 6]
    └── C.3 CI/CD Remote Enforcement     [Week 6-7]

Phase D: Observability ──────────────── [Week 7-9]
    ├── D.1 Pipeline Monitor             [Week 7-8]
    ├── D.2 Feedback Loop                [Week 8]
    └── D.3 Vibe Dashboard               [Week 8-9]

Phase E: Cloud & Multi-Agent ────────── [Week 9-12]
    ├── E.1 Multi-Agent Runtime          [Week 9-10]
    ├── E.2 Cloud Service                [Week 10-11]
    └── E.3 Framework Adapters           [Week 11-12]
```

---

## SCORE EVOLUTION TARGET

| Phase | Guard | Pipeline | Vibe | Runtime | Enterprise | Total |
|---|---|---|---|---|---|---|
| **Current** | 6.5 | 7.5 | 7.0 | 5.5 | 7.5 | **7.8** |
| **After A** | 8.5 | 8.5 | 7.5 | 6.5 | 8.0 | **8.3** |
| **After B** | 9.0 | 8.5 | 8.0 | 7.0 | 8.5 | **8.6** |
| **After C** | 9.0 | 9.0 | 8.5 | 7.5 | 9.0 | **8.9** |
| **After D** | 9.0 | 9.0 | 9.0 | 8.0 | 9.0 | **9.0** |
| **After E** | 9.0 | 9.5 | 9.0 | 8.5 | 9.5 | **9.2** |

---

## TEST BUDGET TỔNG HỢP

| Phase | New Tests | Cumulative |
|---|---|---|
| Phase A | 180+ | 180+ |
| Phase B | 120+ | 300+ |
| Phase C | 73+ | 373+ |
| Phase D | 81+ | 454+ |
| Phase E | 98+ | 552+ |
| **Total new tests** | **552+** | **~2,982+ total (existing 2,430 + new 552)** |

---

## EXIT CRITERIA (Toàn roadmap)

| # | Criterion | Measurement |
|---|---|---|
| 1 | 100% guards machine-enforceable | 18/18 guards có runtime code |
| 2 | Agent conformance test suite | 45+ scenarios, runner functional |
| 3 | Guard enforcement ở mọi entry point | Web, CLI, MCP, API — unified |
| 4 | E2E pipeline chạy thật | intent → design → build → review → audit → rollback |
| 5 | SDK adoption <15 phút | `npm install cvf-governance` → working governance |
| 6 | CI/CD remote enforcement | 3+ GitHub Actions workflows |
| 7 | Real-time observability | Pipeline monitor + vibe dashboard |
| 8 | Multi-agent runtime | 3+ agents orchestrated with governance |
| 9 | Runtime framework adapters | 2+ adapters (LangGraph, AutoGen) |
| 10 | Overall score ≥ 9.0/10 | Independent re-assessment |

---

## UPDATED — v1.6 Non-Coder Enhancement Complete

**Date:** 2026-03-09  
**Status:** ✅ All runtime guards ported to web, 1799 tests passing, 0 regressions

### v1.6 Web Adapter Implementation

| Module | Purpose | Tests | Status |
|--------|---------|-------|--------|
| `guard-runtime-adapter.ts` | WebGuardRuntimeEngine + 6 core guards (PhaseGate, RiskGate, AuthorityGate, MutationBudget, Scope, AuditTrail) | 74 | ✅ Complete |
| `output-validator.ts` | Post-response validation + auto-retry (max 2 retries, invisible to user) | 30 | ✅ Complete |
| `non-coder-language.ts` | Friendly labels, error humanization, quality hints (vi/en) | 44 | ✅ Complete |
| `template-recommender.ts` | Intent-based template suggestion + usage history | 24 | ✅ Complete |
| `wizard-progress.ts` | Wizard progress tracking, time estimation, context tips | 34 | ✅ Complete |
| `agent-handoff-validator.ts` | Agent-to-agent handoff validation with friendly messages | 25 | ✅ Complete |
| `workflow-monitor.ts` | Simplified workflow status for non-coders | 23 | ✅ Complete |

### Integration Points

| Integration | File | Changes |
|-------------|------|---------|
| API Execute Route | `src/app/api/execute/route.ts` | Added guard pipeline (pre-guards) + output validation with auto-retry (post-guards) |
| API Execute Test | `src/app/api/execute/route.test.ts` | Fixed mock output to pass new validation (no regression) |

### Test Results

- **254 new tests** across 7 new test files  
- **1799 total tests passing**, 0 regressions  
- Full suite verified clean

### Runtime Evolution Impact

| Criterion | Before | After | Delta |
|-----------|--------|-------|-------|
| **Web guard enforcement** | None | 6 guards ported + auto-retry | +6 |
| **Non-coder accessibility** | Technical only | Friendly bilingual UI | +3.5 |
| **Output quality assurance** | None | Auto-retry with validation | +2 |
| **Template discovery** | Manual browsing | Intent-based suggestions | +2 |
| **Wizard UX** | Basic steps | Progress + tips + time estimates | +2 |
| **Multi-agent clarity** | Internal status | Human-readable summaries | +2 |

---

## GOVERNANCE RULES CHO ROADMAP NÀY

1. **Mỗi phase phải có independent re-assessment** trước khi chuyển sang phase tiếp
2. **Không skip phase** — Phase B phụ thuộc Phase A, Phase E phụ thuộc A+B+C
3. **Depth Audit apply** — nếu một sub-phase vượt 3x estimated tests, trigger depth audit
4. **Backward compat bắt buộc** — mọi module mới không được phá module cũ
5. **Baseline preservation** — append delta vào assessment file sau mỗi phase
6. **Test-first discipline** — viết test structure trước khi implement
