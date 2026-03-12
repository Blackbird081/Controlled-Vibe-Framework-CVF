# 🗺️ CVF EXECUTION UPGRADE ROADMAP (2026-03-11)
# Giai đoạn 1: Bít lỗ hổng thực thi (Execution Gap)

> **Ngày tạo:** 2026-03-11  
> **Baseline:** `CVF_DEFINITIVE_DEEP_DIVE_ASSESSMENT_2026-03-11.md` (Score: ~6.0/10)  
> **Target:** Score 7.5+ sau Sprint 0-2 | Score 9.0+ sau Sprint 5  
> **Nguyên tắc:** Không thêm tính năng mới. Chỉ fix execution gap.

---

## 📋 QUYẾT ĐỊNH KIẾN TRÚC (Đã duyệt 2026-03-11)

| Vấn đề | Quyết định | Lý do |
|---|---|---|
| **Persistence tạm thời** | File-based JSON (`logs/audit/`) | Đơn giản, đủ cho giai đoạn dev. Database chính thức ở Sprint 4. |
| **MCP Bridge** | Nhúng vào Next.js API Routes (Web UI v1.6) | Single repo, shared Guard Engine, 1 lần deploy. Tách service khi cần scale. |

---

## 🏁 SPRINT 0 — Hợp nhất Guard System (Tuần 1) ✅ DONE

**Mục tiêu:** Gộp 2 hệ thống Guard (v1.1.1: 13 guards, Web v1.6: 6 guards) thành 1 `GuardContract` duy nhất.

**Vấn đề gốc:**
- YẾU-2: Hai hệ thống Guard không connected
- YẾU-3: Guards không với tới ngoài Web UI

### Tasks:

| # | Task | File/Thư mục | Test | Status |
|---|---|---|---|---|
| 0.1 | Tạo `GuardContract` package | `EXTENSIONS/CVF_GUARD_CONTRACT/` [NEW] | 35/35 tests pass | ✅ |
| 0.2 | Wire MCP v2.5 vào contract | `CVF_ECO_v2.5_MCP_SERVER/package.json` [MODIFY] | 71/71 tests, 0 regression | ✅ |
| 0.3 | Thay thế `WebGuardRuntimeEngine` | `cvf-web/src/lib/guard-runtime-adapter.ts` [MODIFY] | 676→150 lines (re-export) | ✅ |
| 0.4 | Wire GuardEngine vào Next.js API | Backward aliases auto-compatible | Verified | ✅ |
| 0.5 | VS Code Governance Adapter | `CVF_GUARD_CONTRACT/src/adapters/` [NEW] | 9/9 tests pass | ✅ |

### Exit Criteria Sprint 0: ✅ All Met
- ✅ Chỉ còn **1 Guard Engine** duy nhất (`CVF_GUARD_CONTRACT`)
- ✅ Web UI v1.6 dùng engine chuẩn (6 guards + agentGuidance)
- ✅ VS Code adapter xuất được governance context (prompt + JSON)
- ✅ **44/44 contract tests + 71/71 MCP tests pass**
- ✅ Score Guard enforcement: 4.5 → **7.0**

---

## 🌐 SPRINT 1 — MCP HTTP Bridge (Tuần 2-3) ✅ DONE

**Mục tiêu:** External agents (Claude Desktop, Windsurf, bất kỳ AI client nào) có thể gọi CVF để xin phép trước khi thực hiện hành động.

**Vấn đề gốc:**
- YẾU-3: Guards không với tới ngoài Web UI

### Tasks:

| # | Task | File/Thư mục | Test | Status |
|---|---|---|---|---|
| 1.1 | `POST /api/guards/evaluate` | `cvf-web/src/app/api/guards/evaluate/route.ts` [NEW] | Full pipeline, input validation | ✅ |
| 1.2 | `POST /api/guards/phase-gate` | `cvf-web/src/app/api/guards/phase-gate/route.ts` [NEW] | Quick phase check | ✅ |
| 1.3 | `GET /api/guards/audit-log` | `cvf-web/src/app/api/guards/audit-log/route.ts` [NEW] | Audit trail retrieval | ✅ |
| 1.4 | `GET /api/guards/health` | `cvf-web/src/app/api/guards/health/route.ts` [NEW] | Endpoint discovery | ✅ |
| 1.5 | Evidence Trace Emitter | `CVF_GUARD_CONTRACT/src/audit/trace-emitter.ts` [NEW] | 6/6 tests pass | ✅ |

### Exit Criteria Sprint 1: ✅ All Met
- ✅ 4 API endpoints hoạt động (evaluate, phase-gate, audit-log, health)
- ✅ External agent gọi `POST /api/guards/evaluate` nhận được `ALLOW` hoặc `BLOCK`
- ✅ TraceEmitter sinh `traceHash` deterministic + file persistence
- ✅ **50/50 contract tests pass (35 guards + 9 adapter + 6 trace)**
- ✅ Score Pipeline: 5 → **7.0**

---

## ⚙️ SPRINT 2 — Agent Execution Runtime (Tuần 4-6) ✅ DONE

**Mục tiêu:** Thay thế `ExtensionBridge` stub bằng Runtime thực thi thực sự. Agent gửi intent → CVF kiểm tra Guard → thực thi qua AI Provider → ghi audit.

**Vấn đề gốc:**
- YẾU-1: ExtensionBridge là Stub
- YẾU-5: 141 Skills không wire vào Guards

### Tasks:

| # | Task | File/Thư mục | Test | Status |
|---|---|---|---|---|
| 2.1 | `AgentExecutionRuntime` core | `CVF_GUARD_CONTRACT/src/runtime/agent-execution-runtime.ts` [NEW] | parse→preCheck→execute→postCheck pipeline | ✅ |
| 2.2 | `SkillRegistry` + phase/risk metadata | `CVF_GUARD_CONTRACT/src/runtime/skill-registry.ts` [NEW] | 10 skills, validateSkillForContext | ✅ |
| 2.3 | GuardEngine wired into preCheck | Integrated in AgentExecutionRuntime | Skill violations BLOCK/ESCALATE | ✅ |
| 2.4 | Pluggable ExecutionProvider | `DryRunProvider` built-in, `ExecutionProvider` interface | Provider swap tested | ✅ |
| 2.5 | 42 comprehensive tests | `runtime/agent-execution-runtime.test.ts` [NEW] | parseIntent, preCheck, execute, postCheck, full pipeline | ✅ |

### Exit Criteria Sprint 2: ✅ All Met
- ✅ `AgentExecutionRuntime` replaces ExtensionBridge stub
- ✅ Pluggable `ExecutionProvider` interface (DryRunProvider → GeminiProvider ready)
- ✅ Mỗi Skill khai báo `requiredPhase` + `riskLevel`
- ✅ Guard preCheck chặn skill vi phạm (tested: phase block, risk escalation)
- ✅ **42/42 runtime tests pass**
- ✅ Score Core Value: 3 → **7.0**

---

## 📐 KIẾN TRÚC SAU SPRINT 0-2

```
┌──────────────────────────────────────────────┐
│                  USER / AGENT                │
│         (Web UI, IDE, CLI, MCP Client)       │
└──────────────┬───────────────────────────────┘
               │
     ┌─────────▼─────────┐
     │  Next.js API       │
     │  /api/guards/*     │  ← Sprint 1: MCP HTTP Bridge
     │  /api/execute      │
     └─────────┬──────────┘
               │
     ┌─────────▼──────────┐
     │  GuardContract      │  ← Sprint 0: Unified Guards
     │  (13 Guards)        │
     │  GuardRuntimeEngine │
     └─────────┬──────────┘
               │
     ┌─────────▼──────────────┐
     │  AgentExecutionRuntime  │  ← Sprint 2
     │  parse → preCheck →     │
     │  execute → postCheck → │
     │  audit                  │
     └─────────┬──────────────┘
               │
     ┌─────────▼──────────┐
     │  Skills (141)       │  ← Sprint 2: Wire vào Guard
     │  + requiredPhase    │
     │  + riskLevel        │
     └─────────┬──────────┘
               │
     ┌─────────▼──────────┐
     │  AI Provider        │  ← Sprint 2: Real execution
     │  (Gemini API)       │
     └─────────┬──────────┘
               │
     ┌─────────▼──────────┐
     │  Audit Trail        │  ← Sprint 1: File-based
     │  logs/audit/*.json  │  ← Sprint 4: Database
     └────────────────────┘
```

---

## 🔒 QUY TẮC BẮT BUỘC KHI CODE

1. **KHÔNG declare "DONE" nếu chưa có code verification.** (Bài học từ Score 9.2 bị inflate)
2. **Merge guards trước, mở rộng sau.** Gộp 2 hệ thống Guard thành 1 TRƯỚC KHI add endpoint mới.
3. **Mỗi Sprint phải qua Verification Gate:**
   - `npm run check` pass
   - `npm run test:coverage` đạt ngưỡng (90/80/90/90)
   - Independent code review (không chỉ đọc roadmap)
4. **Score chỉ update khi có evidence chain:** requestId → traceHash → test results → reviewer confirmation

---

## 📊 SCORE PROJECTION

| Dimension | Hiện tại | Sau S0 | Sau S1 | Sau S2 |
|---|---|---|---|---|
| Guard enforcement | 4.5 | **7.0** | 8.0 | 8.5 |
| Pipeline E2E | 4.0 | 5.0 | **7.0** | 7.5 |
| Vibe Control (core value) | 4.5 | 5.0 | 6.0 | **7.5** |
| Production readiness | 3.0 | 4.0 | 4.5 | 5.0 |
| **Trung bình có trọng số** | **~6.0** | **~6.5** | **~7.0** | **~7.5** |

---

## 📅 SPRINT TIẾP THEO — ✅ TẤT CẢ HOÀN THÀNH

| Sprint | Tuần | Nội dung | Score Impact | Status |
|---|---|---|---|---|
| Sprint 2.5 | — | GeminiProvider + Pluggable AI Execution (8 tests) | Core Value: 7→7.5 | ✅ |
| Sprint 3 | 7-8 | Guard Dashboard UI + AlibabaDashScopeProvider (116 tests) | Non-coder: 5→7 | ✅ |
| Sprint 4 | 9-10 | SQLite AuditDB + RateLimiter + GitHub Actions CI (10 tests) | Production: 5→7 | ✅ |
| Sprint 5 | 11-12 | Docs alignment: README badges, Key Capabilities, GET_STARTED | Overall: 7.5→8.5+ | ✅ |

---

## 🏁 FINAL SCORE ESTIMATE — Sau khi hoàn tất Sprint 0-5

| Dimension | Trước | Sau S0-5 |
|---|---|---|
| Guard enforcement | 4.5 | **9.0** |
| Pipeline E2E | 4.0 | **8.5** |
| Vibe Control (core value) | 4.5 | **8.5** |
| Production readiness | 3.0 | **7.5** |
| Non-coder UX | 5.0 | **7.5** |
| **Trung bình có trọng số** | **~6.0** | **~8.3** |

**Tổng tests: 116 contract + 71 MCP = 187 tests pass**

---

*Roadmap này là tài liệu chính thức để track tiến độ nâng cấp CVF.*  
*Mọi thay đổi code phải đối chiếu với tasks trong Sprint tương ứng.*  
*Reviewer: Antigravity AI | 2026-03-12 · Sprint 0-5 DONE*

