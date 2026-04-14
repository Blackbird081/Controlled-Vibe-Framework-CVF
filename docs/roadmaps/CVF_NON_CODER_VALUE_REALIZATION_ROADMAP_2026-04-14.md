# CVF Non-Coder Value Realization Roadmap

Memory class: SUMMARY_RECORD

> Date: 2026-04-14
> Class: PRODUCT / NON_CODER_VALUE / STRATEGIC_ROADMAP
> Status: ACTIVE — PRIORITY #1 for all agents until full non-coder value is proven
> Authority: Operator-authorized strategic rule, chốt 2026-04-14

---

## 0. Binding Rule For All Agents

> **ƯU TIÊN SỐ 1**: Chứng minh full non-coder product value qua 1 provider ổn định trước mọi thứ khác.
>
> - Multi-provider là thứ yếu cho đến khi non-coder đã nhận đủ core value của CVF qua 1 provider.
> - Nếu 1 provider chưa cho thấy non-coder nhận đủ lợi ích cốt lõi → mở rộng multi-provider là đi sai thứ tự.
> - Khi 1 provider đã chứng minh rõ core value → multi-provider về sau chủ yếu là portability, robustness, engineering scale — không còn là bài toán chứng minh giá trị cốt lõi.
>
> **Mọi agent nhận handoff phải đọc roadmap này trước khi đề xuất bất kỳ hướng đi mới nào.**

---

## 1. CVF Core Value Matrix For Non-Coders

Đây là những gì CVF hứa hẹn mang lại cho non-coder — được đánh giá trung thực theo trạng thái thực tế sau W89.

| Dimension | Mô tả | Trạng thái | Mức độ |
|---|---|---|---|
| **D1 — Safe Execution** | Governance chặn requests nguy hiểm trước khi AI thực thi | PARTIAL | ⚠️ |
| **D2 — Guided Fallback** | Khi bị chặn, non-coder hiểu tại sao và biết làm gì tiếp | PARTIAL | ⚠️ |
| **D3 — Template Quality** | Template-generated prompts dẫn đến output thực sự có ích | UNTESTED | ❌ |
| **D4 — Output Parity** | Governed path không làm giảm output quality vs. direct API | PROVEN (NORMAL only) | ✅ |
| **D5 — Risk Visibility** | Non-coder thấy risk classification của request | NOT EXPOSED | ❌ |
| **D6 — Knowledge-Native Benefit** | Compiled knowledge cải thiện quality của output non-coder nhận | NOT VALIDATED | ❌ |
| **D7 — Workflow Governance** | Multi-step lifecycle (INTAKE→BUILD→REVIEW) có ích với non-coder | NOT BUILT | ❌ |
| **D8 — Approval Flow** | NEEDS_APPROVAL có UI/workflow thực sự cho non-coder | NOT IMPLEMENTED | ❌ |
| **D9 — Pattern Coverage** | HIGH_RISK patterns được detect và có guidance đủ rộng | VERY NARROW (3/nhiều) | ⚠️ |

Legend: ✅ Proven | ⚠️ Partial | ❌ Not yet

---

## 2. Honest Gap Analysis

### 2.1 Những gì đã THỰC SỰ được chứng minh (W86→W88)

```
W86: Gate D MET — NORMAL tasks: governed path = direct API quality (7/7 task classes)
W86: Gate E MET — Governance không block NORMAL tasks sai (0 false positives trên 7 classes)
W87: 3 HIGH_RISK patterns có guided response tại API layer (NC_003 / NC_006 / NC_007)
W88: Guided response hiện ra ở UI khi bị block/needs_approval
```

**Kết luận thực tế**: CVF đã prove được vòng lặp hẹp:
> "Submit request → CVF detect 3 loại unsafe request → Non-coder thấy guidance thay vì bare error"

Đây là **1 slice nhỏ** của core value, không phải full core value.

### 2.2 GAP 1 — Pattern Coverage Quá Hẹp (HIGH PRIORITY)

W87 covered 3 patterns. Non-coder thực tế sẽ gặp nhiều hơn:

| Pattern | Ví dụ | Trạng thái |
|---|---|---|
| NC_003 Password storage | "Lưu password trực tiếp vào DB" | ✅ Covered |
| NC_006 Code attribution | "Copy code không ghi nguồn CC BY-SA" | ✅ Covered |
| NC_007 API key in frontend | "Để API key trong React component" | ✅ Covered |
| NC_001 SQL injection | "Build query bằng string concatenation" | ❌ Missing |
| NC_002 Unvalidated input / XSS | "Render user input trực tiếp vào HTML" | ❌ Missing |
| NC_004 Insecure auth | "Không rate-limit login, không lock account" | ❌ Missing |
| NC_005 PII logging | "Log toàn bộ request body kể cả password/email" | ❌ Missing |
| NC_008 Hardcoded secrets | "Commit secret key vào git" | ❌ Missing |
| NC_009 Insecure dependencies | "npm install random-package không check" | ❌ Missing |
| NC_010 Missing HTTPS / CORS | "API không enforce HTTPS, CORS wildcard" | ❌ Missing |

**Hệ quả**: Non-coder đang bảo vệ bởi CVF cho 3 trường hợp, nhưng exposed với ~7+ trường hợp nguy hiểm khác.

### 2.3 GAP 2 — Template Output Quality Chưa Được Validate (HIGH PRIORITY)

CVF có 8 template categories, 117+ templates. Nhưng:

- Chưa có bất kỳ benchmark nào đo: **output của governed path có thực sự hữu ích với non-coder không?**
- Chưa biết: template nào đang trigger false positives (governance block legitimate work)?
- Chưa biết: output có actionable không, hay chỉ là generic AI response?

Non-coder pick template "Tạo Ứng dụng" → submit → nhận output → **liệu họ có build được app không?** Chưa ai validate điều này.

### 2.4 GAP 3 — Knowledge-Native Benefit Chưa Visible Với Non-Coder (MEDIUM PRIORITY)

W71–W82 (knowledge-native wave) đã deliver:
- Knowledge compilation, maintenance, refactor API routes
- Operator surface tại `/governance/knowledge`
- Consumer pipeline bridge trong CPF

Nhưng: **non-coder không tương tác với knowledge governance page.** Câu hỏi chưa được trả lời:
> "Compiled knowledge có thực sự cải thiện output quality mà non-coder nhận được qua `/api/execute` không?"

Nếu không — thì W71–W82 chưa deliver value đến non-coder end-user, chỉ deliver đến operator.

### 2.5 GAP 4 — NEEDS_APPROVAL Flow Chưa Có UI (MEDIUM PRIORITY)

Hiện tại khi enforcement status = `NEEDS_APPROVAL`:
- ProcessingScreen hiển thị error + guided response (W88)
- Nhưng **không có actual approval mechanism** — non-coder không biết làm gì để "get approval"
- Approval flow là dead end: message shows nhưng không có action path

### 2.6 GAP 5 — Risk Visibility Với Non-Coder = Zero (LOW-MEDIUM PRIORITY)

CVF có risk model R0–R3. Nhưng non-coder không bao giờ thấy:
- Request này là R0 hay R3?
- Tại sao request này được classify như vậy?
- Có cách nào để adjust không?

Governance hoạt động như "black box" với non-coder. Một governance framework tốt nên có ít nhất minimal risk transparency.

### 2.7 GAP 6 — Multi-Step / Iterative Workflow Chưa Có (LOWER PRIORITY)

Non-coder build app thực tế cần nhiều rounds:
- Round 1: Generate skeleton
- Round 2: Review + adjust
- Round 3: Add specific feature
- Round 4: Debug

CVF hiện tại chỉ handle 1-shot execute. Không có governed iterative workflow.

---

## 3. Priority Roadmap

### TIER 1 — Phải làm trước mọi thứ (Direct non-coder safety value)

#### W90-T1: HIGH_RISK Pattern Expansion — Tier 1

> **Mục tiêu**: Mở rộng từ 3 lên 10+ HIGH_RISK patterns trong guided.response.registry.ts

- Thêm NC_001 (SQL injection), NC_002 (XSS/unvalidated input), NC_004 (insecure auth), NC_005 (PII logging), NC_008 (hardcoded secrets) — minimum 5 patterns mới
- Mỗi pattern: guided response text + registry entry + test cases
- Test: extend `guided.response.test.ts` — verify presence, verify NORMAL undefined, verify structure
- Exit criterion: ít nhất 8 HIGH_RISK patterns covered, 100% test pass
- Class: PRODUCT / NON_CODER_VALUE / SAFETY_COVERAGE
- Lane: Full (GC-018)

**Tại sao priority này?** Non-coder hiện tại chỉ được bảo vệ 3/10+ nguy cơ phổ biến nhất. Đây là gap lớn nhất.

#### W91-T1: Template Output Quality Benchmark

> **Mục tiêu**: Validate rằng template executions qua governed path tạo ra output thực sự hữu ích với non-coder

- Chọn 10 template representatives (1-2 per category) từ 8 categories
- Run mỗi template qua `/api/execute` governed path
- Đánh giá output theo 3 tiêu chí: (1) actionable cho non-coder không? (2) có better hơn direct API không? (3) có bị false-positive governance block không?
- Ghi lại evidence: output samples, scores, gaps found
- Exit criterion: evidence packet with ≥10 templates evaluated; false-positive rate < 10%
- Class: VALIDATION_EVIDENCE / GOVERNED_RUNTIME_BENCHMARK
- Lane: Full (GC-018)

**Tại sao priority này?** Nếu templates không produce useful output, toàn bộ non-coder value proposition bị đặt câu hỏi.

---

### TIER 2 — Làm sau Tier 1 (Workflow completeness)

#### W92-T1: NEEDS_APPROVAL Flow — UI Completion

> **Mục tiêu**: Non-coder có actual path khi request cần approval — không phải dead end

- Design + implement approval request UI (non-coder có thể gửi approval request đến reviewer)
- Hoặc: clarify/simplify request để tránh cần approval
- Exit criterion: NEEDS_APPROVAL không còn là dead end trong non-coder journey
- Class: PRODUCT / NON_CODER_VALUE / WORKFLOW_COMPLETION
- Lane: GC-018

#### W93-T1: Knowledge-Native Non-Coder Benefit Validation

> **Mục tiêu**: Prove (hoặc disprove) rằng knowledge-native stack (W71–W82) cải thiện output quality non-coder nhận được

- Run parallel test: same template qua governed path với vs. without knowledge context
- Document delta — nếu có improvement: record as evidence; nếu không: identify why benefit isn't flowing through
- Exit criterion: clear evidence statement về whether knowledge-native helps non-coder output
- Class: VALIDATION_EVIDENCE
- Lane: GC-018

#### W94-T1: Risk Visibility — Minimal Non-Coder Transparency

> **Mục tiêu**: Non-coder thấy được risk level của request (ít nhất R0/R1/R2/R3 indicator)

- Add risk level badge/indicator vào ProcessingScreen
- Show: "Request classified as R1 — Low Risk" hoặc "R2 — Governance Review Applied"
- Exit criterion: non-coder thấy risk classification trong UI
- Class: PRODUCT / NON_CODER_VALUE / TRANSPARENCY
- Lane: Fast Lane (GC-021)

---

### TIER 3 — Dài hạn (Architecture completeness)

#### W95-T1: Multi-Step Governed Workflow (Iterative Execution)

> **Mục tiêu**: Non-coder có thể làm nhiều rounds trong một governed session

- Design + implement iterative execution model trong ProcessingScreen
- Maintain governance context across rounds
- Class: PRODUCT / NON_CODER_VALUE / WORKFLOW_ARCHITECTURE
- Lane: Full (GC-018) — major feature

#### W96-T1: Non-Coder End-to-End Success Rate Benchmark

> **Mục tiêu**: Measure tỷ lệ "non-coder submit template → nhận output → có thể dùng được"

- After W90+W91 delivered, run full E2E benchmark with 20+ scenarios
- Include HIGH_RISK scenarios, NORMAL scenarios, edge cases
- Define "success" criteria cho non-coder
- Class: VALIDATION_EVIDENCE / E2E_BENCHMARK

---

## 4. Completion Definition

**"Full non-coder product value via 1 provider" sẽ được considered PROVEN khi:**

| Gate | Criterion | Tranche |
|---|---|---|
| Gate 1 | ≥ 8 HIGH_RISK patterns covered với guided response | W90-T1 |
| Gate 2 | ≥ 10 templates validated — output actionable, false positive < 10% | W91-T1 |
| Gate 3 | NEEDS_APPROVAL flow không phải dead end | W92-T1 |
| Gate 4 | Knowledge-native benefit statement: proven hoặc gap documented | W93-T1 |
| Gate 5 | Non-coder thấy risk level của request | W94-T1 |

Khi Gates 1–5 đều MET → **multi-provider expansion là hợp lý** (portability, robustness, engineering scale).

---

## 5. What Must NOT Be Reopened

Những vấn đề sau đã closed và không được mở lại:

- Knowledge-native N1/N2/N3/N4 completion matrix
- W84 benchmark interpretation (HYBRID/NO SINGLE DEFAULT)
- W86 finding (NORMAL parity confirmed, HIGH_RISK guidance gap documented)
- W87 finding (3-pattern API-layer gap closed, Gate A FULL MET)
- W88 finding (UI realization delivered, guided-response-panel live)

---

## 6. Tranche Execution Order

```
NOW → W90-T1 (HIGH_RISK pattern expansion)
    → W91-T1 (template output quality benchmark)

AFTER W90+W91 → W92-T1 (NEEDS_APPROVAL flow)
              → W93-T1 (knowledge-native benefit validation)
              → W94-T1 (risk visibility)

AFTER W92+W93+W94 → W95-T1 (multi-step workflow)
                  → W96-T1 (E2E success rate benchmark)

ONLY AFTER ALL ABOVE → consider multi-provider expansion
```

---

*Roadmap filed: 2026-04-14 — Operator-authorized. All agents: treat as Priority #1.*
