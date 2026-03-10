# CVF Roadmap Fixes & Hardening (2026-03-10)

> Purpose: Single, detailed roadmap to fix issues found in the 2026-03-10 independent review and align with user requirements.
> Date: 2026-03-10
> Inputs:
> - docs/reviews/cvf_phase_governance/CVF_INDEPENDENT_SYSTEM_REVIEW_2026-03-10.md
> - docs/reviews/cvf_phase_governance/CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md
> - ECOSYSTEM/strategy/CVF_USER_REQUIREMENTS_2026-03-10.md (User Actions Required excluded)

---

## 0. Roadmap Principles

- Governance and enforcement must be machine-checkable, not only narrative.
- Any new runtime or bridge must join the release/evidence chain.
- Cross-channel guard enforcement is the highest priority gap.
- Local-ready lines must be normalized or explicitly deferred.

## 0.1 Timeline & Test Targets

| Sprint | Duration | Test Target | Score Impact |
|--------|----------|-------------|--------------|
| Sprint 0 | Week 1 | Baseline verify (MCP server: 476 tests; Web UI: 1,799 tests, 3 skipped; vitest run 2026-03-10) | 4→5 Pipeline |
| Sprint 1 | Week 2-3 | +20 HTTP bridge tests | 5→7 Pipeline |
| Sprint 2 | Week 4-6 | +40 execution runtime tests | 3→7 Core Value |
| Sprint 3 | Week 7-8 | +30 UI tests | 5→8 Non-coder UX |
| Sprint 4 | Week 9-10 | +20 production tests | 2→7 Production |
| Sprint 5 | Week 11-12 | Docs alignment pass | Overall 5→9 |

---

## Sprint 0 — Foundation Fix (P0)

### Goal
Close cross-channel guard enforcement gap and ensure release narrative consistency.

### Scope
- Unify governance enforcement between Web UI and non-UI channels.
- Normalize local-ready lines into a unified release narrative or mark as explicit defers.
- Prepare repository integration for upcoming runtime/bridge work.

### Concrete Steps (added 2026-03-10)
1. **S0.1 — Verify Netlify config**: Confirm `netlify.toml` points to correct build path (`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`).
2. **S0.2 — Setup .env.local**: Create/verify `.env.local` in cvf-web with Gemini API key.
3. **S0.3 — Verify local dev**: `npm install && npm run dev` in cvf-web, fix any build errors.
4. **✅ S0.4 — Cross-channel guard contract**: Define shared `GuardContract` TypeScript interface usable by both Web UI and MCP Server. — Vitest run 2026-03-10: 98 tests passed (49 per file)
5. **✅ S0.5 — VS Code governance adapter**: Create lightweight adapter that injects CVF governance into external agent contexts. — Vitest run 2026-03-10: 98 tests passed (49 per file)
6. **S0.6 — Release manifest update**: Normalize v1.8/v1.8.1/v1.9/v2.0 gate status.
7. **✅ S0.7 — CI extension**: Add cross-channel guard contract compat gate (`governance/compat/check_guard_contract_compat.py`) wired into documentation CI.

### Deliverables
- Cross-channel guard contract (shared prompt + runtime enforcement interface).
- Governance injection adapter for VS Code / external agents.
- Release manifest + maturity matrix updated with explicit gate status for v1.8/v1.8.1/v1.9/v2.0.
- CI / compat checks extended where needed.

### Gates
- Cross-channel guard enforcement demonstrated on Web UI and VS Code.
- Release manifest consistency check passes.
- Web UI runs locally with real Gemini AI connected.

### Decisions Needed
- Merge strategy for cvf-next → main (squash/merge/rebase).
- Netlify deployment target (v1.6 UI vs landing vs both).

---

## Sprint 1 — MCP HTTP Bridge (P0)

### Goal
Provide a controlled execution gateway that is governed and auditable.

### Scope
- Implement MCP HTTP Bridge with governance hooks.
- Decide deployment architecture (standalone service vs Next.js API route).
- Add authentication gate if needed.

### Concrete API Spec (added 2026-03-10)

```
POST /api/guards/evaluate     → Full guard pipeline
POST /api/guards/phase-gate   → Phase gate check
POST /api/guards/risk-gate    → Risk gate check
POST /api/guards/advance      → Phase advancement
GET  /api/guards/audit-log    → Audit trail
GET  /api/guards/health       → Health check
```

### Deliverables
- MCP bridge service/API with governance preflight.
- Evidence logs and trace output compatible with release packet.
- Integration tests for bridge endpoints (+20 tests).

### Gates
- Request/response flow enforces CVF phase/role/risk.
- Evidence artifacts are emitted and validated.

### Decisions Needed
- Port number (default 3001).
- Authentication mode (none/local/token/full).
- Deployment mode (separate service vs embedded API route).

---

## Sprint 2 — Agent Execution Runtime (P0)

### Goal
Enable controlled execution with HITL and policy enforcement.

### Scope
- Execution loop with explicit approval checkpoints.
- Provider selection and risk boundary definition.
- Align execution scope with CVF risk model.

### Implementation Spec (added 2026-03-10)

```typescript
class AgentExecutionRuntime {
  async parseIntent(userInput: string): Promise<ParsedVibe>
  async planActions(intent: ParsedVibe): Promise<ActionPlan>
  async preCheck(action: Action): Promise<GuardDecision>
  async execute(action: Action): Promise<ExecutionResult>
  async postCheck(result: ExecutionResult): Promise<ValidationResult>
  async audit(action: Action, result: ExecutionResult): Promise<void>
}
```

### Deliverables
- Execution runtime with policy-controlled actions (+40 tests).
- HITL approval path (modal or external signal).
- Conformance scenarios for execution flows.

### Gates
- Every execution is traceable and policy-checked.
- Release-grade evidence emitted for executions.

### Decisions Needed
- Provider scope (Gemini only vs multi-provider).
- Execution scope (text vs code vs file ops).
- HITL method (modal/email/both).
- Token limits per session.

---

## Sprint 3 — Golden Screens UI (P1)

### Goal
Deliver a stable non-coder journey with guided workflows.

### Scope
- Build Golden Screens UX for non-coder flow.
- Integrate with SpecExport and runtime.
- Validate i18n and usability.

### Deliverables
- 5 Golden Screens (mapped to core CVF phases).
- Integrated Vibe Box → SpecExport → Execution flow.
- Usability and accessibility checklist.

### Gates
- End-to-end non-coder flow works with guard enforcement.
- Regression coverage for key screens.

### Decisions Needed
- UI framework (extend Next.js vs new app).
- Default language (vi/en/auto-detect).
- Voice input (Web Speech vs Whisper vs skip).
- Intention map visualization (tree/mindmap/flowchart).

---

## Sprint 4 — Production Hardening (P1)

### Goal
Stabilize deployment, limits, and telemetry.

### Scope
- Add rate limits and safety caps.
- Harden CI/CD and operational checks.
- Define analytics scope with privacy bounds.

### Deliverables
- Rate limiting and cost control policy.
- Operational checks in CI/CD.
- Optional telemetry hooks.

### Gates
- Production build passes consistently.
- Operational regressions caught by CI.

### Decisions Needed
- Free tier limits.
- Domain strategy.
- Analytics level.

---

## Sprint 5 — Cleanup & Documentation (P2)

### Goal
Normalize repo clarity and adoption.

### Scope
- Archive or relocate legacy lines.
- Align README and onboarding guidance.
- Decide licensing direction.

### Deliverables
- Legacy strategy applied (archive/keep/separate).
- Updated README for target audience.
- Documentation consistency pass.

### Gates
- Docs and release manifest aligned.
- New user can pick correct entrypoint quickly.

### Decisions Needed
- Legacy extension strategy.
- License strategy.
- README audience focus.

---

## Cross-Sprint Risk Register

1) Governance enforcement drift between Web UI and external agents.
- Mitigation: Sprint 0 cross-channel guard contract + adapters.

2) Execution runtime bypasses governance during rapid feature growth.
- Mitigation: Sprint 1/2 require preflight and evidence gates.

3) Local-ready lines remain untracked in release narrative.
- Mitigation: Sprint 0 normalization or explicit defer list.

---

## Success Criteria (End of Roadmap)

- Single, enforced governance contract across Web UI and external agents.
- MCP bridge and execution runtime emit release-grade evidence.
- Non-coder workflows are end-to-end and governed.
- Release manifest and maturity matrix reflect actual runtime reality.

---

## Score Projection (added 2026-03-10)

| Area | Current | S0 | S1 | S2 | S3 | S4 | S5 |
|------|---------|----|----|----|----|----|----|
| Pipeline | 4 | 5 | 7 | 7 | 7 | 8 | 9 |
| Non-coder UX | 5 | 5 | 5 | 6 | 8 | 9 | 9 |
| Core Value | 3 | 3 | 4 | 7 | 8 | 9 | 9 |
| Production | 2 | 4 | 4 | 5 | 5 | 7 | 8 |
| Docs/Tests | 9 | 9 | 9 | 9 | 9 | 9 | 10 |
| Architecture | 8 | 8 | 9 | 9 | 9 | 9 | 10 |
| **Average** | **5.0** | **5.7** | **6.3** | **7.2** | **7.7** | **8.5** | **9.2** |

---

## Excluded By Request

- "User Actions Required" tasks in ECOSYSTEM/strategy/CVF_USER_REQUIREMENTS_2026-03-10.md.
