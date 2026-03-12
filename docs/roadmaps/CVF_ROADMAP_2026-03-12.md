# 🗺️ CVF DEFINITIVE ROADMAP (2026-03-12)
# The Single Source of Truth — Từ đây trở đi, chỉ cần đọc file này

> **⚠️ ĐÂY LÀ ROADMAP MỚI NHẤT VÀ DUY NHẤT.**  
> Người đi sau chỉ cần đọc 3 files:
> 1. **File này** — Roadmap chi tiết + task list
> 2. [`CVF_INDEPENDENT_POSTFIX_REVIEW_2026-03-12.md`](../reviews/CVF_INDEPENDENT_POSTFIX_REVIEW_2026-03-12.md) — Evidence-based checkpoint (7 gaps identified)
> 3. [`CVF_INDEPENDENT_EXPERT_REVIEW_POST_SPRINT_2026-03-12.md`](../reviews/CVF_INDEPENDENT_EXPERT_REVIEW_POST_SPRINT_2026-03-12.md) — Đánh giá độc lập 5 chiều (score 7.5/10)
>
> Roadmap cũ (`CVF_EXECUTION_UPGRADE_ROADMAP_2026-03-11.md`) nên coi là lịch sử. Sprint 0-5 đã DONE.

---

## 📍 TRẠNG THÁI HIỆN TẠI (Ngày 2026-03-12)

| Metric | Giá trị |
|---|---|
| **Score tổng** | **7.5/10** (từ 6.0 baseline ngày 11/03) |
| **Tests** | 1912 pass (1799 Web UI + 113 Guard Contract) |
| **Coverage** | 92% Stmts, 80% Branch, 91% Funcs |
| **Providers** | 5 (Gemini, OpenAI, Claude, Alibaba DashScope ✅ tested live, OpenRouter) |
| **Guards** | 13 unified guards trong 1 GuardContract |
| **Sprint 0-5** | ✅ TẤT CẢ DONE |
| **Branch** | `cvf-next` — all pushed to GitHub |

### 🟢 Đã xong (Sprint 0-5):
- ✅ Unified Guard Contract (13 guards, 1 engine)
- ✅ MCP HTTP Bridge (4 endpoints)
- ✅ Agent Execution Runtime (parse→preCheck→execute→postCheck→audit)
- ✅ GeminiProvider + AlibabaDashScopeProvider (live tested)
- ✅ SQLite AuditDB + Rate Limiter
- ✅ VS Code Governance Adapter
- ✅ Guard Dashboard UI
- ✅ 5 AI Providers in Web UI

### 🔴 Còn thiếu (3 wiring gaps + UX gaps):
1. `/api/execute` bypass `AgentExecutionRuntime` — gọi `executeAI()` trực tiếp
2. `AuditDatabase` (SQLite) chưa wired vào guard evaluation pipeline
3. Skill registry chỉ có 10 sample, chưa map 141 skills
4. Non-coder phải hiểu CVF concepts (Phase, Risk) — chưa có auto-intent
5. E2E Playwright tests timeout (3 tests)
6. 2 files "single source of truth" cho guard contract → drift risk

---

## 🏁 SPRINT 6 — The Wiring Sprint (Ưu tiên 🔴 P0)

**Mục tiêu:** Connect tất cả modules đã có thành pipeline xuyên suốt. KHÔNG tạo code mới — chỉ wiring.

**Score target:** 7.5 → **8.5**

### Tasks:

| # | Task | File cần sửa | Chi tiết | Priority |
|---|---|---|---|---|
| 6.1 | Route `/api/execute` qua `AgentExecutionRuntime` | `cvf-web/src/app/api/execute/route.ts` | Thay `executeAI()` bằng `AgentExecutionRuntime.execute()`. Guard preCheck sẽ chạy tự động trước mọi AI call. | 🔴 P0 |
| 6.2 | Wire `AuditDatabase` vào guard evaluation | `cvf-web/src/app/api/guards/evaluate/route.ts` | Sau mỗi `guardEngine.evaluate()`, gọi `persistTraceEntry()` → SQLite. Endpoints audit-log phải đọc từ DB, không từ in-memory. | 🔴 P0 |
| 6.3 | Consolidate guard contract files | `governance/contracts/cross-channel-guard-contract.ts` → DELETE hoặc re-export | Chỉ giữ `CVF_GUARD_CONTRACT/src/types.ts` là single source of truth. File kia thành re-export alias. | 🟡 P1 |
| 6.4 | Wire rate limiter vào `/api/guards/evaluate` | `cvf-web/src/app/api/guards/evaluate/route.ts` | Import `guardsRateLimiter` đã có, thêm `.consume()` call trước evaluation. | 🟡 P1 |
| 6.5 | Singleton guard engine (shared across routes) | `cvf-web/src/lib/guard-engine-singleton.ts` [NEW — nhỏ] | Tạo shared singleton thay vì per-route `let engine = null`. Fix audit log fragmentation. | 🟡 P1 |
| 6.6 | Fix E2E Playwright login timeout | `cvf-web/e2e/` | Fix `utils.ts:29` login selector timeout. 3 tests cần pass. | 🟡 P1 |

### Exit Criteria Sprint 6:
- [ ] `/api/execute` gọi `AgentExecutionRuntime` → guard preCheck chạy tự động
- [ ] Guard evaluation writes to SQLite — restart server không mất audit
- [ ] Chỉ có 1 guard contract source of truth
- [ ] Rate limiter active trên guard endpoints
- [ ] E2E tests pass (hoặc skip với lý do documented)
- [ ] Tests: tất cả 1912+ tests vẫn pass, coverage ≥ 90%

### Verification:
```bash
# CVF Guard Contract
cd EXTENSIONS/CVF_GUARD_CONTRACT && npx vitest run

# CVF Web UI
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run test:run

# E2E
npm run test:e2e
```

---

## 🎯 SPRINT 7 — The Non-coder Sprint

**Mục tiêu:** Biến CVF từ "developer tool" thành "anyone can use". User chỉ cần nói yêu cầu, CVF tự lo phần còn lại.

**Score target:** 8.5 → **9.0**

### Tasks:

| # | Task | File/Thư mục | Chi tiết | Priority |
|---|---|---|---|---|
| 7.1 | Auto-intent detection | `cvf-web/src/lib/intent-detector.ts` [NEW] | User nói tự nhiên → CVF tự detect Phase (A/B/C/D), Risk level, Template phù hợp. Dùng LLM hoặc rule-based. | 🔴 P0 |
| 7.2 | Server-side session persistence | `cvf-web/src/lib/session-store.ts` [NEW] | Lưu conversation history server-side (SQLite hoặc file). Cross-session continuity. | 🔴 P0 |
| 7.3 | Progress dashboard | `cvf-web/src/components/ProjectProgress.tsx` [NEW] | Visual "dự án đang ở Phase nào", history of decisions, guard log timeline. | 🟡 P1 |
| 7.4 | Smart template auto-suggest | `cvf-web/src/components/TemplateSuggester.tsx` [NEW] | Dựa trên intent detected → suggest top 3 templates thay vì user phải browse marketplace. | 🟡 P1 |
| 7.5 | Simplified onboarding (3 steps) | `cvf-web/src/components/QuickStart.tsx` [NEW] | Step 1: Chọn provider + paste API key. Step 2: Nói yêu cầu. Step 3: Review kết quả. Xong. | 🟡 P1 |
| 7.6 | Hide CVF internals | UI throughout | Ẩn "Phase", "Risk Level", "Guard" labels. Thay bằng friendly language: "Kiểm tra an toàn ✅", "Đang phân tích yêu cầu..." | 🟢 P2 |

### Exit Criteria Sprint 7:
- [ ] User nói 1 câu → CVF tự chọn Phase/Risk/Template → execute → return result
- [ ] Conversation history persist across browser sessions
- [ ] Non-coder không cần biết "Phase A" hay "Risk R2" là gì
- [ ] Onboarding từ 0 → first result trong < 2 phút

---

## 🌐 SPRINT 8 — The Ecosystem Sprint

**Mục tiêu:** CVF trở thành governance layer mà bất kỳ agent framework nào cũng có thể dùng.

**Score target:** 9.0 → **9.5+**

### Tasks:

| # | Task | Chi tiết | Priority |
|---|---|---|---|
| 8.1 | CVF SDK package | `npm install @cvf/guard-sdk` — standalone package cho LangGraph, AutoGen, CrewAI gọi CVF guards. | 🔴 P0 |
| 8.2 | Full skill registry (141 skills) | Auto-generate từ `public/data/skills-index.json`. Mỗi skill có `requiredPhase`, `riskLevel`, `domain`. | 🔴 P0 |
| 8.3 | Mandatory gateway mode | Config option: tất cả channels MUST pass qua CVF guard trước khi execute. SDK-level enforcement. | 🟡 P1 |
| 8.4 | GitHub Actions CI | Remote CI chạy full test suite on every PR. Coverage gate. Auto-deploy to Netlify. | 🟡 P1 |
| 8.5 | API documentation (OpenAPI) | Auto-generated OpenAPI spec cho MCP HTTP Bridge. `GET /api/guards/openapi.json` | 🟢 P2 |
| 8.6 | Enterprise features (future) | Team roles, approval workflows, compliance reports, SSO. | 🟢 P3 |

### Exit Criteria Sprint 8:
- [ ] `@cvf/guard-sdk` published trên npm, usable from any Node.js project
- [ ] 141 skills mapped với phase/risk metadata
- [ ] CI chạy trên GitHub Actions, coverage gate enforced
- [ ] OpenAPI doc available

---

## 📊 SCORE PROJECTION

| Dimension | Hiện tại | Sau S6 | Sau S7 | Sau S8 |
|---|---|---|---|---|
| Guard enforcement | 8.0 | **9.0** | 9.0 | 9.5 |
| Pipeline E2E | 7.0 | **9.0** | 9.0 | 9.5 |
| Vibe Control (core value) | 7.0 | **8.0** | **9.5** | 9.5 |
| Production readiness | 6.5 | **8.0** | 8.5 | **9.0** |
| Non-coder UX | 7.0 | 7.0 | **9.0** | 9.0 |
| **Trung bình có trọng số** | **~7.5** | **~8.5** | **~9.0** | **~9.5** |

---

## 🔒 QUY TẮC BẮT BUỘC (Kế thừa từ Sprint 0-5)

1. **KHÔNG declare "DONE" nếu chưa có test verification.** Score inflation đã xảy ra 1 lần (9.2 vs 6.2 cùng ngày).
2. **Mỗi Sprint phải qua Verification Gate:**
   - `npx vitest run` pass cho Guard Contract
   - `npm run test:run` pass cho Web UI
   - Coverage ≥ 90% Stmts, 80% Branch
   - Independent code review (đọc code, không chỉ đọc roadmap)
3. **Score chỉ update khi có evidence chain:** test results → coverage report → reviewer sign-off.
4. **KHÔNG tạo module mới nếu module cũ chưa wired.** Sprint 6 = chỉ wiring.
5. **API keys KHÔNG commit vào git.** Dùng env vars hoặc `.env.local`.

---

## 📂 FILES THAM KHẢO

| File | Vai trò |
|---|---|
| **`docs/roadmaps/CVF_ROADMAP_2026-03-12.md`** | ⭐ Roadmap duy nhất — file này |
| [`docs/reviews/CVF_INDEPENDENT_POSTFIX_REVIEW_2026-03-12.md`](../reviews/CVF_INDEPENDENT_POSTFIX_REVIEW_2026-03-12.md) | Evidence-based checkpoint: 7 gaps identified |
| [`docs/reviews/CVF_INDEPENDENT_EXPERT_REVIEW_POST_SPRINT_2026-03-12.md`](../reviews/CVF_INDEPENDENT_EXPERT_REVIEW_POST_SPRINT_2026-03-12.md) | Đánh giá 5 chiều: pipeline, UX, vibe control, so sánh industry, hướng đi |
| `docs/roadmaps/CVF_EXECUTION_UPGRADE_ROADMAP_2026-03-11.md` | Lịch sử — Sprint 0-5 (DONE) |
| `docs/assessments/CVF_DEFINITIVE_DEEP_DIVE_ASSESSMENT_2026-03-11.md` | Baseline assessment (score 6.0 trước upgrade) |

---

## 🏁 BẮT ĐẦU SPRINT 6

Khi bắt đầu Sprint 6, chỉ cần chạy:

```bash
# 1. Verify baseline — tất cả tests hiện tại phải pass
cd EXTENSIONS/CVF_GUARD_CONTRACT && npx vitest run
cd ../CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run test:run

# 2. Bắt đầu từ Task 6.1: Route /api/execute qua AgentExecutionRuntime
# File: cvf-web/src/app/api/execute/route.ts
# Thay: executeAI(provider, apiKey, userPrompt)
# Bằng: new AgentExecutionRuntime(guardEngine, provider).execute(intent)

# 3. Sau mỗi task, chạy lại tests để verify không regression
```

---

*Roadmap này là tài liệu CHÍNH THỨC và DUY NHẤT cho tất cả công việc từ ngày 2026-03-12 trở đi.*  
*Mọi thay đổi code phải đối chiếu với tasks trong Sprint tương ứng.*  
*Reviewer: Antigravity AI | 2026-03-12*
