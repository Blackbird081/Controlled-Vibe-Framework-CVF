# CVF Lite — Bắt Đầu Nhanh

> **Tài liệu này đã được thay thế bởi hướng dẫn toàn diện.**

**→ 📖 Đi tới Hướng Dẫn Bắt Đầu**

---

## Liên Kết Nhanh

| Bạn là ai? | Đi tới |
|-----------|-------|
| 🆕 **Mới dùng CVF?** | CVF trong 5 phút |
| 👤 **Developer cá nhân?** | Solo Guide (sắp có) |
| 👥 **Team lead?** | Team Setup (sắp có) |
| 🏢 **Enterprise?** | Enterprise Guide (sắp có) |
| 📚 [**Thư viện kỹ năng**](/skills) | Xem các gói dành cho agent và giới hạn sử dụng |
| 🚀 **Web UI** | v1.6 Agent Platform |

---

## Tại Sao Thay Đổi?

Chúng tôi hợp nhất nhiều điểm vào (START_HERE, CVF_LITE, QUICK_START) thành một hướng dẫn toàn diện tại `docs/GET_STARTED.md`.

**Trước đây:** 3+ entry points → rối, overlap  
**Bây giờ:** 1 entry point → rõ ràng

Điều này giảm confusion và giúp onboarding nhanh hơn.

### Có Gì Mới (15/02/2026)

✅ **docs/GET_STARTED.md** - Hướng dẫn toàn diện  
✅ **docs/guides/** - Hướng dẫn theo vai trò (đang viết)  
✅ **docs/tutorials/** - Hướng dẫn từng bước (đang viết)  
✅ **docs/concepts/** - Giải thích chuyên sâu (đang viết)  
✅ **docs/cheatsheets/** - Tham khảo nhanh  
✅ **scripts/quick-start.sh** - Cài đặt 1 lệnh

Xem: Bắt Đầu

---

## Cấu Trúc Tài Liệu Mới

```
docs/
├── GET_STARTED.md          ← ⭐ BẮT ĐẦU Ở ĐÂY
├── guides/                 ← Hướng dẫn theo vai trò
│   ├── solo-developer.md
│   ├── team-setup.md
│   └── enterprise.md
├── tutorials/              ← Từng bước
│   ├── first-project.md
│   ├── web-ui-setup.md
│   ├── agent-platform.md
│   └── custom-skills.md
├── concepts/               ← Chuyên sâu
│   ├── core-philosophy.md
│   ├── lifecycle.md
│   ├── governance-model.md
│   └── ...
└── cheatsheets/            ← Tham khảo
    ├── version-picker.md
    └── troubleshooting.md
```

---

## Nội Dung Cũ (Đã Archive)

Nội dung CVF_LITE trước đây (hướng dẫn 5 phút) đã được tích hợp vào docs/GET_STARTED.md với nội dung phong phú hơn.

**Đánh giá thực tế hiện tại:** 7.5/10

---

*Cập nhật: 15/02/2026*

**➡️ Đi tới GET_STARTED.md ngay**

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

<!-- Text Encoding Exception: retains localized reader text and navigation symbols. -->
