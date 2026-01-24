# EXAMPLE PROJECT — Mini Landing Page QA
Version: 1.1 | Type: Example | Status: Complete

## Mô tả project
Tạo checklist QA nội dung cho landing page chiến dịch Q1.

---

## 1. INPUT_SPEC

```yaml
Title: Checklist QA nội dung landing page Q1
Context: Landing page ra mắt sản phẩm mới, cần QA trước khi publish
In Scope:
  - Copy (headline, body, CTA)
  - Liên kết (internal, external)
  - Brand voice & tone
  - SEO basics (title, meta)
Out of Scope:
  - Code/technical review
  - Design/UI review
  - Performance testing
Constraints:
  - Thời gian: 4 giờ
  - Không sửa design
  - Ngôn ngữ: Tiếng Việt
Dependencies:
  - DC-001: Quyết định thông điệp chính
  - Asset: Bản draft landing page
Expected Output: Markdown checklist 12-15 mục, có thể tick được
Owner: PM Growth
Version: 1.0
Date: 2026-01-24
```

---

## 2. OUTPUT_SPEC

```yaml
Output Description: Checklist QA nội dung landing page
Format: Markdown file với checkbox
Acceptance Criteria:
  - Có mục kiểm tra headline, body copy, CTA
  - Có mục kiểm tra liên kết
  - Có mục kiểm tra brand voice
  - Có mục kiểm tra SEO basics
  - Tổng 12-15 mục
  - Ngôn ngữ rõ ràng, hành động được
Quality Bar:
  - Không lỗi chính tả
  - Mỗi mục là 1 câu hỏi/kiểm tra cụ thể
  - Có thể dùng ngay không cần giải thích thêm
Reviewer: Content Lead
Trace: /traces/AU-001/
Dependencies: INPUT_SPEC trên
Version: 1.0
Date: 2026-01-24
```

---

## 3. DECISION RECORD

```yaml
ID: DC-001
Date: 2026-01-24
Decision: Tập trung QA nội dung, không QA kỹ thuật
Rationale: Team kỹ thuật có quy trình riêng; checklist này cho content team
Impact: Scope chỉ bao gồm copy, link, brand, SEO cơ bản
Status: Approved
```

---

## 4. ACTION UNIT

```yaml
AU-ID: AU-001
Command: CVF:EXECUTE
Objective: Viết checklist QA nội dung landing page
Archetype: Execution Agent
Preset: Execution Policy

Inputs:
  - INPUT_SPEC (trên)
  - DC-001

Outputs:
  - checklist-qa-landing-page.md

Constraints:
  - 4 giờ
  - Không sửa design

Stop Conditions:
  - Thiếu INPUT_SPEC
  - Scope thay đổi
  - Reviewer không sẵn sàng

Trace Path: /traces/AU-001/
Status: Complete
```

---

## 5. TRACE LOG

```yaml
AU-ID: AU-001
Start: 2026-01-24 09:00
End: 2026-01-24 11:30

Assumptions:
  - Landing page draft đã có sẵn
  - Brand guideline đã rõ

Issues:
  - Không có

Execution Notes:
  - Đọc INPUT_SPEC
  - Review draft landing page
  - Soạn checklist theo scope
  - Self-review trước khi submit

Output: checklist-qa-landing-page.md (14 mục)

Review:
  - Reviewer: Content Lead
  - Date: 2026-01-24 14:00
  - Result: PASS
  - Notes: Đủ coverage, rõ ràng

Status: Closed
```

---

## 6. OUTPUT — Checklist QA Landing Page

```markdown
# Checklist QA Nội Dung Landing Page Q1

## Headline & Copy
- [ ] Headline rõ ràng, truyền tải value proposition chính?
- [ ] Subheadline bổ trợ headline, không lặp ý?
- [ ] Body copy ngắn gọn, dễ scan?
- [ ] Không lỗi chính tả, ngữ pháp?

## Call-to-Action (CTA)
- [ ] CTA button text rõ hành động (ví dụ: "Đăng ký ngay")?
- [ ] CTA nổi bật, dễ nhìn?
- [ ] Có CTA phụ cho người chưa sẵn sàng commit?

## Liên kết
- [ ] Tất cả link internal hoạt động?
- [ ] Tất cả link external mở tab mới?
- [ ] Không có link broken?

## Brand Voice & Tone
- [ ] Giọng văn nhất quán với brand guideline?
- [ ] Tone phù hợp đối tượng mục tiêu?

## SEO Basics
- [ ] Title tag có keyword chính?
- [ ] Meta description hấp dẫn, đủ thông tin?
```

---

## 7. Kết luận

Project mẫu này minh họa:
- Luồng INPUT_SPEC → OUTPUT_SPEC → Decision → AU → Trace → Output
- Binding: CVF:EXECUTE → Execution Agent → Execution Policy
- Trace đầy đủ từ start đến close
- Review pass trước khi merge

Có thể dùng làm template cho các project tương tự.
