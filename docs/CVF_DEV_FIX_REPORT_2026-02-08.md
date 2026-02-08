# CVF — Dev Fix Report (từ Tester Report 08/02/2026)

> **Mục đích:** Danh sách bugs + design issues cần khắc phục, sắp theo priority  
> **Nguồn:** [CVF_TESTER_REPORT_2026-02-08.md](CVF_TESTER_REPORT_2026-02-08.md)  
> **Trạng thái:** Sprint 1 COMPLETED (08/02/2026)  

---

## SPRINT 1 — Critical Fixes (ước lượng: 10h)

### BUG-001 🔴 `code_execute` bypass sandbox

- **File:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/agent-tools.tsx`
- **Vấn đề:** Tool `code_execute` dùng `new Function(code)()` trực tiếp, KHÔNG đi qua `createSandbox()` đã có trong `security.ts`. Hai đường sandbox tồn tại song song, tool dùng đường yếu hơn.
- **Impact:** Code do AI sinh ra chạy không bị sandbox. User có thể bị XSS hoặc data leak.
- **Fix:**
  ```diff
  // agent-tools.tsx — code_execute handler
  - const result = new Function(code)();
  + import { createSandbox } from './security';
  + const sandbox = createSandbox({ timeout: 5000 });
  + const result = sandbox.execute(code);
  ```
- **Test cần thêm:** Unit test verify `code_execute` gọi `createSandbox()`, test timeout enforcement, test blocked APIs (fetch, localStorage, document).
- **Effort:** 2h

---

### BUG-002 🔴 `web_search` mock hiển thị như thật

- **File:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/agent-tools.tsx`
- **Vấn đề:** Tool `web_search` trả về hardcoded results (mock data) nhưng UI hiển thị cho user như kết quả tìm kiếm thật. Không có indicator nào cho biết đây là mock.
- **Impact:** User tin vào thông tin giả. Đặc biệt nguy hiểm cho non-coders — họ không biết phân biệt.
- **Fix (chọn 1 trong 2):**
  - **Option A:** Disable tool (khuyên dùng cho production):
    ```ts
    // Loại web_search khỏi available tools list
    ```
  - **Option B:** Label rõ mock:
    ```ts
    return { results: mockResults, disclaimer: "⚠️ [MOCK DATA] Kết quả mô phỏng, không phải tìm kiếm thật." };
    ```
- **Effort:** 1h

---

### TST-001 🔴 Multi-agent: ZERO tests

- **File cần test:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/multi-agent.tsx`
- **Vấn đề:** Module multi-agent workflow không có test nào. Bao gồm 4-agent sequential pipeline, state management, task allocation.
- **Tests cần viết:**
  1. Workflow state transitions (idle → running → phase_n → complete)
  2. Agent role assignment (Orchestrator, Architect, Builder, Reviewer)
  3. Sequential pipeline execution order
  4. Error handling khi 1 agent fail mid-pipeline
  5. Phase gate integration giữa các agents
- **Effort:** 4h

---

### TST-002 🔴 Agent-tools: ZERO tests

- **File cần test:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/agent-tools.tsx`
- **Tests cần viết:**
  1. Mỗi tool (8 tools) có ít nhất 1 happy path + 1 error case
  2. `code_execute` → verify sandbox enforcement
  3. `calculator` → verify input sanitization
  4. `web_search` → verify mock label hoặc disabled
  5. `url_fetch` → verify URL validation
  6. Tool timeout behavior
- **Effort:** 3h

---

## SPRINT 2 — High Priority (ước lượng: 15h)

### BUG-003 🟡 Sandbox timeout post-hoc

- **File:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/security.ts`
- **Vấn đề:** Timeout check dùng `Date.now() - startTime > timeout` SAU khi code chạy xong. Nếu code có vòng lặp vô hạn → hang browser, timeout không bao giờ trigger.
- **Fix:** Dùng Web Worker hoặc `AbortController`:
  ```ts
  // Option: Web Worker with timeout
  const worker = new Worker(sandboxWorkerUrl);
  const timer = setTimeout(() => worker.terminate(), timeout);
  worker.postMessage({ code });
  ```
- **Effort:** 4h

---

### BUG-004 🟡 Mode detection bằng keyword

- **File:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/agent-chat.ts` (hàm `detectSpecMode()`)
- **Vấn đề:** Detect governance mode bằng exact string match ("CVF FULL MODE PROTOCOL"). User viết khác 1 chữ → sai mode.
- **Fix:** Thay keyword detection bằng **UI dropdown/selector**:
  ```tsx
  // Thêm ModeSelector component
  <select value={mode} onChange={setMode}>
    <option value="simple">Simple</option>
    <option value="governance">Governance</option>
    <option value="full">CVF Full</option>
  </select>
  ```
  Và giữ keyword detection như fallback (không phải primary).
- **Effort:** 3h

---

### BUG-005 🟡 Quality scoring heuristic-only

- **File:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governance.ts`
- **Vấn đề:** Quality Score 4D (Completeness, Clarity, Actionability, Compliance) dùng regex/heuristic — chỉ check format (có heading? có list? có code block?). Response format đẹp nhưng nội dung sai vẫn score cao. Không detect hallucination.
- **Impact:** Non-coders tin quality score number. Score 85/100 cho một response chứa thông tin sai → nguy hiểm.
- **Fix (phân phase):**
  - **Phase 1 (ngắn hạn):** Thêm disclaimer: "⚠️ Điểm chất lượng đánh giá format và cấu trúc, KHÔNG đánh giá tính chính xác nội dung."
  - **Phase 2 (dài hạn):** Thêm factual verification layer (cross-check response với context/source).
- **Effort:** Phase 1: 1h | Phase 2: 12h

---

### DSG-005 🟡 R0-R3 absent at runtime

- **Files liên quan:**
  - Spec: `EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/CAPABILITY_RISK_MODEL.md`
  - Skills: `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/skills/*/`
  - Runtime: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/`
- **Vấn đề:** Risk model R0-R3 defined đầy đủ (v1.2), mỗi skill có risk_level trong metadata (v1.5.2), nhưng v1.6 runtime KHÔNG check risk level trước khi execute.
- **Fix:** Thêm risk-level check middleware:
  ```ts
  function checkRiskLevel(skill: Skill, mode: GovernanceMode): boolean {
    if (skill.riskLevel >= 'R2' && mode === 'simple') {
      return false; // Block R2+ skills in Simple mode
    }
    if (skill.riskLevel === 'R3') {
      // Require explicit human approval
      return await requestHumanApproval(skill);
    }
    return true;
  }
  ```
- **Effort:** 6h

---

### BUG-007 🟡 `url_fetch` không có URL restriction

- **File:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/agent-tools.tsx`
- **Vấn đề:** Tool `url_fetch` cho phép fetch bất kỳ URL nào. AI có thể fetch internal network URLs, localhost, metadata endpoints.
- **Fix:** Thêm URL allowlist + block private IPs:
  ```ts
  const BLOCKED_PATTERNS = [/^https?:\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2|3[01]))/];
  function isUrlAllowed(url: string): boolean {
    return !BLOCKED_PATTERNS.some(p => p.test(url));
  }
  ```
- **Effort:** 2h

---

## SPRINT 3 — Design Alignment (ước lượng: 12h)

### DSG-002 🟡 "No Shared Thinking" conflict

- **Spec:** `EXTENSIONS/CVF_v1.3.1_OPERATOR_EDITION/` — Cấm user tương tác AI mid-execution
- **Runtime:** v1.6 là chat app — user freely chat, retry, refine
- **Action:** Chọn 1 chiến lược:
  - **A)** Thêm "Operator Mode" trong v1.6: lock chat input khi agent đang execute, chỉ cho phép Cancel
  - **B)** Update v1.3.1 docs: "No Shared Thinking" chỉ áp dụng cho batch execution, không áp dụng cho interactive chat
- **Effort:** 4h

---

### DSG-003 🟡 Agent architecture mismatch

- **v1.1:** 6 archetypes (Analysis/Decision/Planning/Execution/Supervisor/Exploration)
- **v1.6:** 4 roles (Orchestrator/Architect/Builder/Reviewer)
- **Action:** Map v1.6 roles → v1.1 archetypes hoặc document sự khác biệt rõ ràng.
  - Orchestrator → Supervisor archetype
  - Architect → Planning archetype
  - Builder → Execution archetype
  - Reviewer → Analysis archetype
- **Effort:** 4h

---

### DSG-004 🟢 v1.5 / v1.6 platform fork

- **Vấn đề:** Hai Next.js apps riêng biệt, không share code
- **Action (dài hạn):** Tạo shared component library hoặc merge v1.5 features vào v1.6
- **Effort:** 4h (planning) + 20h (execution)

---

## SPRINT 4 — Non-Coder Accessibility (ước lượng: 10h)

### ACC-001 🟡 v1.6 cần hosted deployment

- **Vấn đề:** Non-coders không thể `npm install && npm run dev`
- **Action:** Deploy v1.6 lên Vercel/Netlify với pre-configured environment
- **Effort:** 4h

---

### ACC-002 🟡 API key setup barrier

- **Vấn đề:** Non-coders phải tạo API key từ Google/OpenAI — phức tạp, dễ lộ key
- **Action:**
  - Thêm step-by-step wizard (ảnh + video)
  - Hoặc proxy mode: server-side API key, user chỉ login
- **Effort:** 6h

---

## Checklist Tổng Hợp

| Sprint | ID | Mô tả | Effort | Status |
|:------:|:--:|-------|:------:|:------:|
| 1 | BUG-001 | Fix code_execute sandbox | 2h | ✅ DONE |
| 1 | BUG-002 | Fix/disable web_search mock | 1h | ✅ DONE |
| 1 | TST-001 | Tests cho multi-agent | 4h | ✅ DONE |
| 1 | TST-002 | Tests cho agent-tools | 3h | ✅ DONE |
| 2 | BUG-003 | Preemptive sandbox timeout | 4h | ✅ DONE |
| 2 | BUG-004 | Mode selector UI | 3h | ✅ DONE (flexible matching) |
| 2 | BUG-005 | Quality score disclaimer | 1h | ✅ DONE |
| 2 | DSG-005 | R0-R3 runtime check | 6h | ✅ DONE |
| 2 | BUG-007 | URL allowlist cho url_fetch | 2h | ✅ DONE |
| 3 | DSG-002 | Reconcile No Shared Thinking | 4h | ✅ DONE |
| 3 | DSG-003 | Map agent archetypes | 4h | ⬜ |
| 3 | DSG-004 | Platform consolidation plan | 4h | ⬜ |
| 4 | ACC-001 | Hosted deployment | 4h | ✅ DONE (guide + config) |
| 4 | ACC-002 | API key wizard / proxy | 6h | ✅ DONE |

**Tổng effort ước lượng: ~47h (~6 ngày dev)**

---

*Báo cáo trích từ Tester Report. Xem chi tiết đầy đủ tại [CVF_TESTER_REPORT_2026-02-08.md](CVF_TESTER_REPORT_2026-02-08.md)*
