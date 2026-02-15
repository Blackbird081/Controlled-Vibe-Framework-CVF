# CVF cho Lập trình viên Cá nhân

**Đối tượng:** Lập trình viên cá nhân sử dụng AI để viết code  
**Thời gian đọc:** 10 phút  
**Phiên bản CVF:** v1.0 (lõi) — tùy chọn v1.6 (giao diện web)

---

## Tại sao cần CVF khi bạn code một mình?

Khi bạn code với AI (ChatGPT, Claude, Copilot, Cursor), những vấn đề này xuất hiện rất nhanh:

| Vấn đề | Điều gì xảy ra | CVF khắc phục |
|---------|----------------|---------------|
| **Phình phạm vi** | AI thêm tính năng bạn không yêu cầu | Phase A đóng băng ý định |
| **Mất ngữ cảnh** | Sau 10 prompt, AI quên mục tiêu của bạn | Tài liệu thiết kế Phase B duy trì ngữ cảnh |
| **Lỗi ẩn** | Code AI trông đúng nhưng hỏng ở các trường hợp biên | Danh sách kiểm tra Phase D |
| **Nợ kỹ thuật** | "Nó chạy được" trở thành "Tôi không bảo trì nổi" | Cấu trúc governance |
| **Lãng phí thời gian** | Giải thích lại cùng một thứ cho AI | File spec giữ ngữ cảnh |

CVF khắc phục những vấn đề này bằng **cấu trúc mà không tạo gánh nặng**. Bạn không cần team, không cần quản lý, cũng không cần công cụ đặc biệt. Chỉ cần 4 phase và vài file markdown.

---

## Bắt đầu nhanh: Dự án CVF đầu tiên (5 phút)

### Lựa chọn 1: Markdown thuần (Không cần cài đặt)

Tạo thư mục dự án với cấu trúc sau:

```
my-project/
├── specs/
│   ├── INPUT_SPEC.md      ← Bạn muốn xây dựng gì
│   └── OUTPUT_SPEC.md     ← "Hoàn thành" trông như thế nào
├── decisions/
│   └── DECISION_LOG.md    ← Tại sao chọn X thay vì Y
├── traces/
│   └── AU-001.md          ← AI thực sự đã làm gì
└── src/                   ← Code của bạn
```

**INPUT_SPEC.md** (điền trước khi yêu cầu AI bất cứ điều gì):

```markdown
# Project: [Tên]

## Objective
[Bạn muốn xây dựng gì trong 1-2 câu]

## Functional Requirements
1. [Yêu cầu 1]
2. [Yêu cầu 2]
3. [Yêu cầu 3]

## Out of Scope
- [Những gì bạn KHÔNG xây dựng]

## Tech Stack
- [Ngôn ngữ/Framework]

## Acceptance Criteria
- [ ] [Làm sao biết đã hoàn thành]
- [ ] [Làm sao biết nó hoạt động]
```

**Sau đó đưa spec cho AI:**
```
Read the attached INPUT_SPEC.md. Follow the requirements exactly.
Do not add features not listed. Do not change the tech stack.
If something is unclear, ask before proceeding.
```

Vậy là xong. Bạn đang sử dụng CVF.

---

### Lựa chọn 2: Giao diện Web (2 phút cài đặt)

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install
npm run dev
```

Mở http://localhost:3000 → Chọn template → Điền form → Xuất → Đưa cho AI.

Giao diện web sẽ hướng dẫn bạn qua 4 phase một cách tự động.

> **Lưu ý:** Bạn cần ít nhất một API key AI (OpenAI, Anthropic, hoặc Google AI). Sao chép `.env.example` thành `.env.local` và thêm key của bạn.

---

## Quy trình 4 Phase cho Lập trình viên Cá nhân

### Phase A — KHÁM PHÁ (5 phút)

**Bạn làm gì:** Viết ra những gì bạn muốn. Cụ thể nhất có thể.

```markdown
## Phase A: Discovery

**Intent:** I want a CLI tool that converts CSV files to JSON.

**Success looks like:**
- Takes a .csv file path as input
- Outputs a .json file in the same directory
- Handles headers as keys
- Handles commas in quoted fields

**Failure looks like:**
- Only works with simple CSVs (no quoted fields)
- Crashes on empty files
- No error messages for bad input

**Constraints:**
- Python 3.10+
- No external dependencies (stdlib only)
- Must handle files up to 100MB
```

**Nguyên tắc:** Đừng nhảy sang code. Hoàn thành ý định trước.

---

### Phase B — THIẾT KẾ (10 phút)

**Bạn làm gì:** Phác thảo cách tiếp cận giải pháp trước khi code.

```markdown
## Phase B: Design

**Approach:** 
- Use Python's built-in `csv` module for parsing
- Use `json` module for output
- CLI via `argparse`

**Components:**
1. CLI parser (argparse) → validates input path
2. CSV reader → reads with DictReader (handles headers)
3. JSON writer → dumps list of dicts to file
4. Error handler → catches FileNotFoundError, csv.Error

**Flow:**
CLI input → validate path → read CSV → convert to dicts → write JSON → report success

**How I'll verify (without reading code):**
- Run with sample.csv → get sample.json
- Run with empty.csv → get meaningful error
- Run with bad path → get "file not found" error
```

**Mẹo:** Phần này không cần hoàn hảo. Chỉ cần nó tồn tại để AI có thiết kế để tuân theo, chứ không phải tự nghĩ ra.

---

### Phase C — XÂY DỰNG (AI thực hiện)

**Bạn làm gì:** Đưa tài liệu Phase A + Phase B cho AI và để AI code.

```
You are an Execution agent. Follow the design exactly.

Read the attached Phase A (Discovery) and Phase B (Design) docs.
Implement the solution as designed.

Rules:
- Do NOT add features not in the spec
- Do NOT change the approach from Phase B
- If the design is not feasible, STOP and tell me why
- Do NOT optimize unless I ask

Create: src/csv_to_json.py
```

**Điều bạn KHÔNG làm:** Can thiệp giữa chừng. Để AI hoàn thành, sau đó đánh giá.

---

### Phase D — ĐÁNH GIÁ (5 phút)

**Bạn làm gì:** Kiểm tra đầu ra so với ý định Phase A.

**Danh sách kiểm tra:**

```markdown
## Phase D: Review

- [ ] Does it take a CSV path as input? → YES
- [ ] Does it output JSON in same directory? → YES
- [ ] Does it handle headers as keys? → YES
- [ ] Does it handle quoted fields? → TEST NEEDED
- [ ] Does it handle empty files gracefully? → TEST NEEDED
- [ ] Does it show errors for bad input? → YES
- [ ] Python 3.10+ only, no external deps? → YES

**Verdict:** ✅ ACCEPT (after testing quoted fields)
```

**Nếu có gì đó không đạt:** Đừng sửa trong Phase D. Quay lại Phase B (điều chỉnh thiết kế) hoặc Phase C (thực thi lại).

---

## Mẹo để Thành công khi Làm việc Một mình

### 1. Bắt đầu Đơn giản
Đừng dùng tất cả tính năng CVF cùng lúc. Bắt đầu chỉ với `INPUT_SPEC.md` và danh sách kiểm tra Phase D. Thêm cấu trúc khi bạn cần.

### 2. Sử dụng Quy tắc 2 Giờ
Nếu một tác vụ mất hơn 2 giờ, chia nhỏ thành các tác vụ nhỏ hơn. Mỗi tác vụ có spec và trace riêng.

### 3. Ghi lại Decision Log
Khi bạn chọn React thay vì Vue, hay Python thay vì Node — ghi lại. Bạn trong tương lai sẽ hỏi "tại sao mình chọn cái này?"

```markdown
## Decision: Use Python stdlib csv module

**Date:** 2026-02-15
**Context:** Need to parse CSV files
**Options:** pandas, csv module, manual parsing
**Decision:** csv module
**Reason:** No external deps, handles quoted fields, sufficient for <100MB
```

### 4. Theo dõi những gì AI đã làm
Sau mỗi phiên AI, lưu một bản trace nhanh:

```markdown
## AU-001: Implement CSV parser

**Command:** CVF:EXECUTE
**Input:** Phase A + Phase B specs
**AI Used:** Claude 3.5
**Output:** src/csv_to_json.py (87 lines)
**Review:** ACCEPT — all criteria met
**Time:** 15 minutes
```

### 5. Đừng để AI quyết định Phạm vi
AI luôn gợi ý "cải tiến". Câu trả lời của bạn:

> "Điều đó thú vị nhưng ngoài phạm vi. Hãy tuân theo spec."

---

## Khi nào nên Nâng cấp

| Tín hiệu | Hành động |
|-----------|-----------|
| Dự án mất hơn 1 ngày | Thêm Phase B (thiết kế bài bản) |
| Đầu ra AI ngày càng sai | Thêm INPUT_SPEC (ngữ cảnh rõ hơn) |
| Không nhớ tại sao xây dựng mọi thứ | Thêm Decision Log |
| Làm việc với 1-2 người khác | Chuyển sang Hướng dẫn cho Nhóm |
| Cần quản lý rủi ro | Đọc về Risk Model |
| Muốn template có sẵn | Duyệt Skill Library |

---

## Câu hỏi Thường gặp

**H: CVF có quá mức cần thiết cho dự án nhỏ không?**  
Đ: Không. CVF tối thiểu chỉ là viết ra ý định (Phase A) và kiểm tra kết quả (Phase D). Đó là 10 phút overhead giúp tiết kiệm hàng giờ làm lại.

**H: Tôi có cần giao diện web không?**  
Đ: Không. CVF lõi chỉ cần file Markdown. Giao diện web chỉ giúp điền form và quản lý template dễ hơn.

**H: Tôi có thể dùng CVF với Cursor / Windsurf / Cline không?**  
Đ: Có. CVF không phụ thuộc editor. Tài liệu Phase A + Phase B trở thành ngữ cảnh cho bất kỳ công cụ AI nào.

**H: Nếu tôi quên một phase thì sao?**  
Đ: Bắt đầu chỉ với Phase A và Phase D. Thêm B và C khi bạn cảm thấy cần. Framework thích ứng với quy trình của bạn.

**H: Cái này khác gì so với chỉ viết prompt?**  
Đ: Prompt là dùng một lần. CVF cung cấp ngữ cảnh bền vững (spec), lịch sử quyết định, và quy trình đánh giá. Khi dự án phức tạp, prompt thất bại — spec thì không.

---

## Bước tiếp theo

- 📖 Tìm hiểu 4 Phase
- 🧪 Thử Dự án CVF Đầu tiên (Hướng dẫn)
- 📚 Duyệt 114 Skill
- 🖥️ Cài đặt Giao diện Web
- 👥 Sẵn sàng cho nhóm? → Hướng dẫn cho Nhóm

---

*Cập nhật lần cuối: 15 tháng 2, 2026 | CVF v1.6*
