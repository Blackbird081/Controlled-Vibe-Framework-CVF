# CVF Completion Roadmap — Từ Prototype → Production

**Ngày lập:** 2026-03-09  
**Căn cứ:** CVF Independent Expert Assessment 2026-03-09  
**Mục tiêu cuối:** Non-coder nói "làm app X" → Agent tự thực hiện trong CVF → User nhận kết quả đã được govern  
**Trạng thái khởi điểm:** v1.6 complete, score 6.2/10  
**Mục tiêu score:** 9.0/10

---

## Tổng Quan Các Milestone

| Milestone | Version | Mục tiêu | Thời gian ước tính | Priority |
|---|---|---|---|---|
| **M1** | v1.7 | CVF MCP Server + Guard Persistence | 3–4 tuần | 🔴 Critical |
| **M2** | v1.7.1 | CVF System Prompt + CLI Wrapper | 1–2 tuần | 🔴 Critical |
| **M3** | v1.8 | Merge Guard Systems + Skill-Guard Wire | 3–4 tuần | 🟡 High |
| **M4** | v1.8.1 | Agent NL Guidance + Real Workflow Exec | 2–3 tuần | 🟡 High |
| **M5** | v1.9 | CVF Agent SDK + Cross-session Memory | 4–5 tuần | 🟡 High |
| **M6** | v2.0 | Observability Dashboard + LangGraph Adapter | 4–6 tuần | 🟢 Medium |
| **M7** | v2.1 | Non-coder First Product — Full Vibe Control | 3–4 tuần | 🟢 Medium |

---

## M1 — CVF MCP Server + Guard Persistence (v1.7)

**Mục tiêu:** Guards hoạt động trong Windsurf/Cursor IDE, audit log không mất khi restart.

**Lý do critical:** Đây là điều kiện để CVF thoát khỏi web UI và cover trường hợp dùng thực tế.

### Track M1.1 — CVF MCP Server

**Kết quả:** Windsurf/Cursor tự động gọi CVF guards như MCP tools.

| Task | Mô tả | File đích | Ước tính test |
|---|---|---|---|
| M1.1.1 | Tạo MCP server entry point | `mcp-server/src/index.ts` | — |
| M1.1.2 | Expose `cvf_check_phase_gate` tool | `mcp-server/src/tools/phase-gate.tool.ts` | 15 |
| M1.1.3 | Expose `cvf_check_risk_gate` tool | `mcp-server/src/tools/risk-gate.tool.ts` | 12 |
| M1.1.4 | Expose `cvf_check_authority` tool | `mcp-server/src/tools/authority.tool.ts` | 10 |
| M1.1.5 | Expose `cvf_validate_output` tool | `mcp-server/src/tools/output-validate.tool.ts` | 15 |
| M1.1.6 | Expose `cvf_advance_phase` tool | `mcp-server/src/tools/phase-advance.tool.ts` | 10 |
| M1.1.7 | Expose `cvf_get_audit_log` tool | `mcp-server/src/tools/audit-log.tool.ts` | 8 |
| M1.1.8 | MCP server config + README | `mcp-server/mcp.config.json` | — |
| M1.1.9 | Integration test — Windsurf call simulation | `mcp-server/src/index.test.ts` | 20 |

**Ước tính tests M1.1:** ~90 tests  
**Verification:** Agent trong Windsurf gọi `cvf_check_phase_gate` trả về ALLOW/BLOCK/ESCALATE với NL explanation

---

### Track M1.2 — Guard Persistence

**Kết quả:** Audit log và pipeline state persist qua server restarts.

| Task | Mô tả | File đích | Ước tính test |
|---|---|---|---|
| M1.2.1 | Thiết kế persistence adapter interface | `src/lib/persistence/persistence.interface.ts` | — |
| M1.2.2 | SQLite adapter (mặc định) | `src/lib/persistence/sqlite.adapter.ts` | 20 |
| M1.2.3 | JSON file adapter (fallback) | `src/lib/persistence/json-file.adapter.ts` | 15 |
| M1.2.4 | Wrap GuardRuntimeEngine với persistence | `src/lib/persistence/persistent-guard-engine.ts` | 25 |
| M1.2.5 | Migrate audit log API endpoint | `src/app/api/audit/route.ts` | 10 |
| M1.2.6 | Session restore on startup | `src/lib/persistence/session-restore.ts` | 15 |

**Ước tính tests M1.2:** ~85 tests  
**Verification:** Restart server → audit log vẫn còn nguyên

---

**M1 Done When:**

- [ ] Windsurf/Cursor agent gọi được CVF MCP tools
- [ ] Guards trả về natural language explanation (không chỉ code)
- [ ] Audit log persist qua restart
- [ ] +175 tests, 0 regressions

---

## M2 — CVF System Prompt + CLI Wrapper (v1.7.1)

**Mục tiêu:** Non-coder có thể dùng CVF ngay mà không cần code hoặc IDE.

### Track M2.1 — CVF Master System Prompt

**Kết quả:** File prompt chuẩn mà bất kỳ ai có thể paste vào Claude/GPT để bật CVF mode.

| Task | Mô tả | File đích |
|---|---|---|
| M2.1.1 | CVF rules → natural language encoding | `prompts/CVF_MASTER_SYSTEM_PROMPT.md` |
| M2.1.2 | Phase gate rules (DISCOVERY → REVIEW) | Phần của M2.1.1 |
| M2.1.3 | Risk model (R0–R3) in plain language | Phần của M2.1.1 |
| M2.1.4 | Authority boundaries (AI vs Human) | Phần của M2.1.1 |
| M2.1.5 | Self-check checklist agent phải follow | Phần của M2.1.1 |
| M2.1.6 | Vietnamese version | `prompts/CVF_MASTER_SYSTEM_PROMPT_VI.md` |
| M2.1.7 | Prompt testing guide | `prompts/PROMPT_TESTING_GUIDE.md` |

**Verification:** Copy prompt → paste vào Claude → Claude tự follow 4-phase workflow

---

### Track M2.2 — CVF CLI Wrapper

**Kết quả:** `cvf run "mô tả dự án"` → CVF orchestrate agent qua các phases.

| Task | Mô tả | File đích | Ước tính test |
|---|---|---|---|
| M2.2.1 | CLI entry point | `cli/src/index.ts` | — |
| M2.2.2 | `cvf run` command | `cli/src/commands/run.command.ts` | 15 |
| M2.2.3 | `cvf status` command | `cli/src/commands/status.command.ts` | 10 |
| M2.2.4 | `cvf phase next` command | `cli/src/commands/phase.command.ts` | 10 |
| M2.2.5 | `cvf audit` command | `cli/src/commands/audit.command.ts` | 8 |
| M2.2.6 | Config file support (`cvf.config.json`) | `cli/src/config.ts` | 10 |
| M2.2.7 | CLI README + usage guide | `cli/README.md` | — |

**Ước tính tests M2.2:** ~53 tests  
**Verification:** `cvf run "tạo landing page"` → agent được phân bổ phases, guard chạy ẩn

---

**M2 Done When:**

- [ ] System prompt file hoàn chỉnh (vi + en)
- [ ] `cvf run` hoạt động end-to-end
- [ ] Non-coder có thể dùng mà không cần mở IDE
- [ ] +53 tests, 0 regressions

---

## M3 — Merge Guard Systems + Skill-Guard Wire (v1.8)

**Mục tiêu:** Một codebase guard duy nhất, 141 skills được govern bởi guards.

### Track M3.1 — Unify Guard Systems

**Vấn đề:** v1.1.1 có 13 guards (production), v1.6 web có 6 guards (ported copy). Hai hệ thống sẽ diverge.

| Task | Mô tả | File đích | Ước tính test |
|---|---|---|---|
| M3.1.1 | Audit diff giữa v1.1.1 và v1.6 guard types | (analysis doc) | — |
| M3.1.2 | Extract shared guard interface package | `packages/cvf-guard-core/src/index.ts` | — |
| M3.1.3 | Port 7 remaining guards vào web adapter | `src/lib/guard-runtime-adapter.ts` | 35 |
| M3.1.4 | Deprecate v1.1.1 guard copies | Refactor imports | — |
| M3.1.5 | Single source of truth test suite | `src/lib/guard-runtime-adapter.test.ts` | 20 |

**Ước tính tests M3.1:** ~55 tests  
**Verification:** `guard-runtime-adapter.ts` contains all 13 guards, v1.1.1 imports from shared core

---

### Track M3.2 — Skill-Guard Integration

**Vấn đề:** 141 skills không bị govern — agent có thể dùng sai skill cho sai phase.

| Task | Mô tả | File đích | Ước tính test |
|---|---|---|---|
| M3.2.1 | Tạo skill-phase mapping table | `src/lib/skill-phase-map.ts` | — |
| M3.2.2 | Gán mỗi skill vào 1+ phases được phép | Phần M3.2.1 | — |
| M3.2.3 | Gán mỗi skill vào risk level phù hợp | Phần M3.2.1 | — |
| M3.2.4 | SkillGuard — kiểm tra skill vs current phase | `src/lib/guards/skill.guard.ts` | 20 |
| M3.2.5 | Wire SkillGuard vào GuardRuntimeEngine | `src/lib/guard-runtime-adapter.ts` | 15 |
| M3.2.6 | Skill invocation API endpoint | `src/app/api/skill/route.ts` | 12 |
| M3.2.7 | Tests for skill-phase enforcement | `src/lib/guards/skill.guard.test.ts` | 25 |

**Ước tính tests M3.2:** ~72 tests  
**Verification:** Dùng skill `code_review` trong DISCOVERY phase → guard BLOCK với friendly message

---

**M3 Done When:**

- [ ] Single guard codebase, no duplicates
- [ ] 14 guards total (13 existing + SkillGuard)
- [ ] All 141 skills mapped to phases and risk levels
- [ ] +127 tests, 0 regressions

---

## M4 — Agent NL Guidance + Real Workflow Execution (v1.8.1)

**Mục tiêu:** Guards nói chuyện được với agent bằng ngôn ngữ tự nhiên; workflows thực sự execute.

### Track M4.1 — Agent-Readable Guard Responses

**Vấn đề:** Guards chỉ trả về `ALLOW/BLOCK/ESCALATE` — agent không biết tại sao và phải làm gì tiếp.

| Task | Mô tả | File đích | Ước tính test |
|---|---|---|---|
| M4.1.1 | Mở rộng `GuardResult` với `agentGuidance` field | `src/lib/guard-runtime-adapter.ts` | — |
| M4.1.2 | Thêm `suggestedAction` vào mỗi BLOCK result | Mỗi guard file | — |
| M4.1.3 | Viết NL guidance template cho mỗi guard | `src/lib/guard-guidance-templates.ts` | 20 |
| M4.1.4 | Bilingual guidance (vi/en) | Phần M4.1.3 | — |
| M4.1.5 | Guidance formatter utility | `src/lib/guard-guidance-formatter.ts` | 15 |
| M4.1.6 | Tests cho guidance quality | `src/lib/guard-guidance.test.ts` | 20 |

**Ước tính tests M4.1:** ~55 tests

---

### Track M4.2 — Real Workflow Execution

**Vấn đề:** `ExtensionBridge.advanceWorkflow()` là stub — không thực sự execute gì.

| Task | Mô tả | File đích | Ước tính test |
|---|---|---|---|
| M4.2.1 | Thiết kế AgentExecutor interface | `src/lib/workflow/agent-executor.interface.ts` | — |
| M4.2.2 | WebAgentExecutor — gọi `/api/execute` | `src/lib/workflow/web-agent-executor.ts` | 20 |
| M4.2.3 | Replace stub trong `advanceWorkflow()` | `extension.bridge.ts` | — |
| M4.2.4 | Workflow state machine (PENDING→RUNNING→DONE) | `src/lib/workflow/workflow-state.ts` | 25 |
| M4.2.5 | Error handling + retry logic | Phần M4.2.4 | — |
| M4.2.6 | Workflow execution tests | `src/lib/workflow/workflow-execution.test.ts` | 30 |

**Ước tính tests M4.2:** ~75 tests

---

**M4 Done When:**

- [ ] Guard BLOCK trả về "Bạn cần làm X trước khi Y" cho agent
- [ ] `advanceWorkflow()` thực sự gọi agent và nhận output
- [ ] Workflow state transitions correctly
- [ ] +130 tests, 0 regressions

---

## M5 — CVF Agent SDK + Cross-session Memory (v1.9)

**Mục tiêu:** Bất kỳ agent nào có thể import CVF SDK và tự động được govern.

### Track M5.1 — CVF Agent SDK

**Kết quả:** `npm install @cvf/sdk` → agent tự động chạy trong CVF boundaries.

| Task | Mô tả | File đích | Ước tính test |
|---|---|---|---|
| M5.1.1 | SDK package scaffold | `packages/cvf-sdk/package.json` | — |
| M5.1.2 | `CVFAgent` class — wraps any agent with guards | `packages/cvf-sdk/src/cvf-agent.ts` | 30 |
| M5.1.3 | `CVFSession` — manages phase + state | `packages/cvf-sdk/src/cvf-session.ts` | 25 |
| M5.1.4 | `CVFContext` — carries request metadata | `packages/cvf-sdk/src/cvf-context.ts` | 15 |
| M5.1.5 | Guard middleware pipeline | `packages/cvf-sdk/src/middleware/guard.middleware.ts` | 25 |
| M5.1.6 | Auto-phase detection from task description | `packages/cvf-sdk/src/phase-detector.ts` | 20 |
| M5.1.7 | SDK usage examples + README | `packages/cvf-sdk/README.md` | — |
| M5.1.8 | Full integration tests | `packages/cvf-sdk/src/index.test.ts` | 40 |

**Ước tính tests M5.1:** ~155 tests

---

### Track M5.2 — Cross-session Memory

**Vấn đề:** Agent không nhớ gì sau khi session kết thúc. Mỗi lần dùng CVF là lại từ đầu.

| Task | Mô tả | File đích | Ước tính test |
|---|---|---|---|
| M5.2.1 | Session storage interface | `src/lib/memory/session-storage.interface.ts` | — |
| M5.2.2 | LocalStorage adapter (web) | `src/lib/memory/localstorage.adapter.ts` | 15 |
| M5.2.3 | SQLite adapter (server) | `src/lib/memory/sqlite-memory.adapter.ts` | 20 |
| M5.2.4 | Session memory API | `src/app/api/session/route.ts` | 12 |
| M5.2.5 | Resume session from history | `src/lib/memory/session-restore.ts` | 15 |
| M5.2.6 | Memory-aware template recommender | Update `src/lib/template-recommender.ts` | 10 |

**Ước tính tests M5.2:** ~72 tests

---

**M5 Done When:**

- [ ] `import { CVFAgent } from '@cvf/sdk'` hoạt động
- [ ] Agent wrapped bởi SDK tự động bị govern
- [ ] Session nhớ context qua các lần dùng
- [ ] +227 tests, 0 regressions

---

## M6 — Observability Dashboard + LangGraph Adapter (v2.0)

**Mục tiêu:** Người dùng thấy toàn bộ pipeline visually; CVF có thể govern LangGraph workflows.

### Track M6.1 — CVF Observability Dashboard

| Task | Mô tả | File đích | Ước tính test |
|---|---|---|---|
| M6.1.1 | Dashboard page layout | `src/app/dashboard/page.tsx` | — |
| M6.1.2 | Pipeline trace visualizer | `src/components/PipelineTrace.tsx` | 15 |
| M6.1.3 | Guard decision timeline | `src/components/GuardTimeline.tsx` | 15 |
| M6.1.4 | Real-time session monitor | `src/components/SessionMonitor.tsx` | 10 |
| M6.1.5 | Risk level heatmap | `src/components/RiskHeatmap.tsx` | 10 |
| M6.1.6 | Audit log viewer | `src/components/AuditLogViewer.tsx` | 12 |
| M6.1.7 | Export audit report | `src/app/api/audit/export/route.ts` | 10 |

**Ước tính tests M6.1:** ~72 tests

---

### Track M6.2 — LangGraph / AutoGen Adapter

| Task | Mô tả | File đích | Ước tính test |
|---|---|---|---|
| M6.2.1 | LangGraph node wrapper với CVF guards | `packages/cvf-langgraph/src/cvf-node.ts` | 25 |
| M6.2.2 | AutoGen agent wrapper với CVF guards | `packages/cvf-autogen/src/cvf-agent.ts` | 25 |
| M6.2.3 | Adapter tests | Mỗi package | 30 |
| M6.2.4 | Migration guide từ LangGraph thuần | `docs/guides/langgraph-to-cvf.md` | — |

**Ước tính tests M6.2:** ~80 tests

---

**M6 Done When:**

- [ ] Dashboard hiển thị pipeline trace real-time
- [ ] LangGraph workflow có thể được governed bởi CVF
- [ ] Independent re-assessment: score ≥ 8.0/10
- [ ] +152 tests, 0 regressions

---

## M7 — Non-coder First Product: Full Vibe Control (v2.1)

**Mục tiêu:** Sản phẩm hoàn chỉnh cho non-coder — user chỉ mô tả, CVF lo phần còn lại.

### Track M7.1 — Intent → Full Project Flow

| Task | Mô tả |
|---|---|
| M7.1.1 | Onboarding wizard: "Bạn muốn làm gì?" |
| M7.1.2 | Auto-detect project type → template suggestion |
| M7.1.3 | CVF tự tạo DISCOVERY brief từ user intent |
| M7.1.4 | DESIGN draft được generate tự động |
| M7.1.5 | BUILD agent được giao task từng bước |
| M7.1.6 | REVIEW checklist tự động generate |
| M7.1.7 | User nhận kết quả + audit report |

### Track M7.2 — Non-coder UX Polish

| Task | Mô tả |
|---|---|
| M7.2.1 | Progress story (không phải progress bar) |
| M7.2.2 | "Vibe score" — đo mức độ kiểm soát |
| M7.2.3 | One-click project restart |
| M7.2.4 | Share project link |
| M7.2.5 | Mobile-responsive dashboard |

---

**M7 Done When:**

- [ ] Non-coder hoàn thành 1 project từ đầu đến cuối không cần code
- [ ] Vibe Control đạt 90%+ (all 10 criteria in assessment)
- [ ] Independent re-assessment: score ≥ 9.0/10

---

## Tổng Hợp Kế Hoạch

### Tổng Tests Dự Kiến

| Milestone | Tests mới | Tổng cộng |
|---|---|---|
| Hiện tại (v1.6) | — | 1,799 |
| M1 (v1.7) | +175 | ~1,974 |
| M2 (v1.7.1) | +53 | ~2,027 |
| M3 (v1.8) | +127 | ~2,154 |
| M4 (v1.8.1) | +130 | ~2,284 |
| M5 (v1.9) | +227 | ~2,511 |
| M6 (v2.0) | +152 | ~2,663 |
| M7 (v2.1) | ~100 | ~2,763 |

### Timeline Ước Tính

```
Tháng 3/2026:  M1 — MCP Server + Persistence (ĐANG LÀM)
Tháng 4/2026:  M2 — System Prompt + CLI
Tháng 5/2026:  M3 — Merge Guards + Skill Wire
Tháng 5/2026:  M4 — NL Guidance + Real Execution
Tháng 6/2026:  M5 — Agent SDK + Memory
Tháng 7/2026:  M6 — Dashboard + LangGraph
Tháng 8/2026:  M7 — Non-coder First Product
```

### Score Progression

| Version | Score | Milestone achieved |
|---|---|---|
| v1.6 (current) | 6.2/10 | Non-coder UX, web guards |
| v1.7 | 7.0/10 | MCP server, persistence |
| v1.7.1 | 7.3/10 | System prompt, CLI |
| v1.8 | 7.8/10 | Unified guards, skill wire |
| v1.8.1 | 8.2/10 | Real execution, NL guidance |
| v1.9 | 8.7/10 | SDK, memory |
| v2.0 | 9.0/10 | Dashboard, adapters |
| v2.1 | 9.5/10 | Full Vibe Control |

---

## Governance Rules Cho Roadmap Này

1. **Không skip milestone** — M1 phải xong trước M2
2. **Mỗi milestone có verification criteria rõ ràng** — không mark done khi chưa verify
3. **0 regressions** — full test suite phải pass trước mỗi milestone release
4. **Independent re-assessment tại M6 và M7** — không tự đánh giá
5. **Non-coder usability test thực tế** — ít nhất 1 người thực sự dùng trước M7 complete

---

## Phần Bổ Sung — Non-coder.md Integration

> **Lưu ý:** File `CVF_Restructure/Information for non_coder.md` bị gitignore và chưa đọc được.  
> Mục này sẽ được cập nhật sau khi đọc file đó.  
> **Action required:** Bổ sung các ý kiến từ file đó vào các tracks liên quan (M2, M7).

---

*Tài liệu này được tạo dựa trên CVF Independent Expert Assessment 2026-03-09.*  
*Cập nhật khi có thay đổi scope hoặc sau mỗi milestone.*
