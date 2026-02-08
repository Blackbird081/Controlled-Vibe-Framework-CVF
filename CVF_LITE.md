# CVF Lite — 5 Phút Bắt Đầu

> Hướng dẫn nhanh nhất để áp dụng CVF cho cá nhân hoặc team nhỏ.  
> Không cần đọc toàn bộ framework. Chỉ cần trang này.

---

## Bước 1: Hiểu CVF Trong 30 Giây

**CVF = bộ quy tắc để AI viết code theo ý bạn, không phải ngược lại.**

```
Bạn ra spec → AI thực hiện → CVF kiểm tra → Kết quả đúng ý
```

3 nguyên tắc cốt lõi:
1. **Outcome > Code** — Kết quả quan trọng hơn cách viết
2. **Spec-first** — Mô tả rõ muốn gì trước khi code
3. **Risk-aware** — Biết rõ rủi ro trước khi quyết định

---

## Bước 2: Chọn 1 Skill Để Thử (1 phút)

Mở thư mục `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/` và chọn **1 skill** phù hợp:

| Bạn muốn... | Dùng skill |
|-------------|------------|
| Review code | `tech_review/01_code_review.skill.md` |
| Viết API spec | `application_development/05_api_design_spec.skill.md` |
| Phân tích tài chính | `financial_analysis/01_budget_analysis.skill.md` |
| Viết content | `content_writing/01_documentation.skill.md` |
| Thiết kế UI | `web_templates/01_landing_page.skill.md` |

> 💡 Có 124 skills trong 12 domains. Browse và chọn cái gần nhất với task của bạn.

---

## Bước 3: Đọc Skill File (1 phút)

Mỗi `.skill.md` có cấu trúc:

```
📌 Prerequisites      ← Cần gì trước?
🎯 Mục đích           ← Khi nào dùng?
📥 Form Input         ← Bạn cung cấp gì?
📤 Expected Output    ← AI trả về gì?
✅ Evaluation          ← Kiểm tra bằng cách nào?
```

**Chỉ cần đọc 📥 Form Input và 📤 Expected Output** là đủ để bắt đầu.

---

## Bước 4: Copy & Paste Vào AI (2 phút)

1. Copy phần `Form Input` từ skill file
2. Điền thông tin của bạn vào các field
3. Paste vào AI (Copilot Chat, ChatGPT, Claude, etc.)
4. Kiểm tra output theo `Expected Output`

**Ví dụ nhanh:**

```
Tôi cần review code cho file auth.py:
- Language: Python
- Focus: Security + Performance
- Risk Level: R2 (cần human review)
- Expected: Danh sách issues với severity
```

---

## Bước 5: Kiểm Tra Kết Quả (1 phút)

Dùng checklist từ `Evaluation Checklist` trong skill file:

- [ ] Output đúng format mong đợi?
- [ ] Không có thông tin bịa đặt (hallucination)?
- [ ] Nằm trong scope đã khai báo?
- [ ] Risk level phù hợp?

**Done.** Bạn vừa sử dụng CVF lần đầu. 🎉

---

## Muốn Đi Sâu Hơn?

| Level | File | Mô tả |
|-------|------|-------|
| Beginner | `START_HERE.md` | Tổng quan framework |
| Intermediate | `docs/HOW_TO_APPLY_CVF.md` | Cách áp dụng chi tiết |
| Advanced | `v1.1/USAGE.md` | Governance + phases |
| Expert | `docs/CVF_ARCHITECTURE_DIAGRAMS.md` | Kiến trúc đầy đủ |

---

## FAQ Nhanh

**Q: Có bắt buộc dùng governance (.gov.md)?**  
A: Không. Cho cá nhân, chỉ cần `.skill.md`. Governance dành cho team muốn track quality.

**Q: Tôi có thể tự tạo skill mới?**  
A: Có. Copy 1 skill file → sửa nội dung → done. Xem `v1.1/templates/` cho templates.

**Q: CVF có lock tôi vào 1 AI tool nào không?**  
A: Không. CVF là agent-agnostic. Dùng với Copilot, ChatGPT, Claude, Gemini, local LLM — đều được.

**Q: Tôi chỉ 1 người, có cần phần nào khác?**  
A: Chỉ cần: `CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/` + guide này. Bỏ qua governance, templates, architecture.
