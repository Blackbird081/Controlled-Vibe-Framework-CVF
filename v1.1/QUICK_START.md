# QUICK START — CVF v1.1
Version: 1.1 | Status: STABLE

## 5 phút bắt đầu với CVF v1.1

---

### Bước 1: Hiểu triết lý (30 giây)
- **Outcome > Code**: quan trọng là sản phẩm làm được gì
- **AI là executor, không phải decision maker**
- **Mọi action phải truy vết được**: Command → Archetype → Preset → AU → Trace

---

### Bước 2: Chọn mức độ sử dụng (30 giây)

| Cần gì? | Dùng module nào? |
|---------|------------------|
| Chỉ cần ràng buộc I/O | INPUT_SPEC + OUTPUT_SPEC |
| Cần phân vai AI | + Agent Archetype + Preset |
| Cần trace đầy đủ | + Execution Spine + AU |
| Task nhỏ nhanh | + Fast Track |

---

### Bước 3: Workflow cơ bản (2 phút)

```
1. LẬP INPUT_SPEC
   ↓
2. CHỌN COMMAND (CVF:PROPOSE / CVF:EXECUTE / ...)
   ↓
3. GÁN ARCHETYPE + PRESET (Execution Agent + Execution Policy)
   ↓
4. TẠO ACTION UNIT (AU)
   ↓
5. THỰC THI + GHI TRACE
   ↓
6. REVIEW THEO OUTPUT_SPEC
   ↓
7. MERGE / CLOSE AU
```

---

### Bước 4: Ví dụ nhanh (2 phút)

**Task:** Viết checklist QA cho landing page

**INPUT_SPEC (rút gọn):**
- Objective: Checklist QA nội dung landing page
- Scope: copy, CTA, link, brand voice
- Constraint: 1 ngày
- Output form: Markdown checklist 10-15 mục

**Command + Binding:**
- Command: CVF:EXECUTE
- Archetype: Execution Agent
- Preset: Execution Policy

**AU:**
- AU-001: Viết checklist
- Input: INPUT_SPEC trên
- Output: checklist.md
- Trace: /traces/AU-001/

**Thực thi:**
- AI viết checklist theo scope
- Ghi trace: start, assumptions, issues
- Hoàn thành → ghi end

**Review:**
- Reviewer check OUTPUT_SPEC
- Pass → merge
- Fail → feedback → sửa → review lại

---

### Bước 5: File cần đọc thêm

| Mục đích | File |
|----------|------|
| Hiểu triết lý | README.md |
| Lập input/output | governance/INPUT_SPEC.md, OUTPUT_SPEC.md |
| Phân vai agent | agents/CVF_AGENT_ARCHETYPE.md |
| Chọn command | interface/CVF_COMMANDS.md |
| Hiểu execution spine | execution/CVF_EXECUTION_LAYER.md |
| Task nhỏ | governance/FAST_TRACK.md |
| Xem mẫu | templates/*.sample.md |

---

### Checklist khởi động

- [ ] Đọc README.md
- [ ] Xác định module cần dùng
- [ ] Copy template INPUT_SPEC, OUTPUT_SPEC, AU_trace
- [ ] Lập INPUT_SPEC cho task đầu tiên
- [ ] Chọn Command + Archetype + Preset
- [ ] Tạo AU, thực thi, ghi trace
- [ ] Review và close

---

### Mẹo nhanh
- Bắt đầu với Fast Track nếu task nhỏ (< 2h)
- Luôn lập INPUT_SPEC trước khi làm bất cứ gì
- 1 agent = 1 archetype; không kiêm nhiệm
- Output chưa review = chưa xong
- Khi nghi ngờ → dừng lại, hỏi, ghi trace

---

**Sẵn sàng? Bắt đầu với task đầu tiên của bạn!**
