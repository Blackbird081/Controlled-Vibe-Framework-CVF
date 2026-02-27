# Vibe-to-Spec Translator

> **Domain:** Non-coder Workflow
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

> Không yêu cầu — Skill này thường là bước đầu tiên khi User mô tả ý tưởng bằng ngôn ngữ thông thường.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- User mô tả app bằng cảm xúc hoặc hình ảnh ("Làm app nhìn sang trọng", "Giao diện tối giản như Apple", "Làm cho nó mượt mà")
- Cần chuyển yêu cầu mơ hồ thành thông số kỹ thuật cụ thể trước khi Design
- Phase A (Discovery) — khi "vibe" chưa thành spec

**Không phù hợp khi:**
- User đã có spec kỹ thuật chi tiết rồi
- Yêu cầu đã rõ ràng về màu sắc, font, layout cụ thể

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design |
| Authority Scope | Informational |
| Autonomy | Auto |
| Audit Hooks | Input vibe captured, Output spec generated, User confirmation required |

---

## ⛔ Execution Constraints

- AI KHÔNG ĐƯỢC tự ý chọn màu sắc, font chữ mà chưa liệt kê cho User xem
- AI KHÔNG ĐƯỢC dùng thuật ngữ kỹ thuật (CSS, Hex code, Padding) khi giải thích cho User
- AI KHÔNG ĐƯỢC bắt đầu code/design trước khi User xác nhận "Vibe Mapping"
- Chỉ hoạt động ở Phase A (Discovery) và Phase B (Design)

---

## ✅ Validation Hooks

- Check đã có ít nhất 1 từ khóa "vibe" từ User trước khi bắt đầu
- Check output Vibe Mapping Table đủ 3 cột (Từ khóa → Thuộc tính hình ảnh → Hành động cụ thể)
- Check User đã xác nhận bằng lệnh "Duyệt Vibe này" trước khi chuyển sang bước tiếp

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-non_coder_workflow-01_vibe_to_spec.md`
- UAT Objective: Skill phải tạo Vibe Mapping Table không dùng thuật ngữ kỹ thuật và phải có bước xác nhận từ User

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Vibe Description** | User mô tả cảm xúc / phong cách mong muốn | ✅ | "Tôi muốn app nhìn sang trọng, chuyên nghiệp như app ngân hàng" |
| **App Type** | Loại app đang xây dựng | ✅ | "Quản lý tài chính cá nhân", "Dashboard báo cáo" |
| **Target Users** | Ai sẽ dùng app này | ❌ | "Nhân viên văn phòng, 25-40 tuổi" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được — Bảng Vibe Mapping:**

```markdown
# Bảng Vibe Mapping

| Từ khóa của bạn | Tôi hiểu là... | Tôi sẽ làm... |
|---|---|---|
| "Sang trọng" | Màu tối, nền đen/xanh đậm, ít chi tiết thừa | Nền tối, chữ trắng, icon đơn giản |
| "Chuyên nghiệp" | Font chữ rõ ràng, bố cục ngay ngắn | Chữ thẳng hàng, menu gọn |
| "Mượt mà" | Chuyển cảnh nhẹ nhàng, không giật | Hiệu ứng mờ dần khi chuyển trang |

---
Bạn có đồng ý với cách tôi hiểu "vibe" trên không?
Gõ "Duyệt Vibe này" để tôi bắt đầu thiết kế.
```

---

## 🔍 Cách đánh giá

**Checklist Accept:**
- [ ] Bảng Vibe Mapping có đủ 3 cột
- [ ] Không có thuật ngữ kỹ thuật (CSS, hex, padding) trong bảng
- [ ] Có câu hỏi xác nhận cuối cùng từ AI
- [ ] User đã gõ "Duyệt Vibe này" trước khi tiếp tục

**Red flags (Reject):**
- ⚠️ AI tự chọn màu cụ thể mà không hỏi User
- ⚠️ Bảng Mapping dùng từ kỹ thuật như "#1A1A2E" hay "border-radius"
- ⚠️ AI bắt đầu code/thiết kế khi chưa có xác nhận

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|-----------------|
| Dùng hex color trong bảng | Dùng tên màu thông thường: "xanh đậm", "xám nhạt" |
| Bỏ qua bước xác nhận | Luôn kết thúc bảng bằng câu hỏi cho User |
| Map vibe quá chung chung | Mỗi vibe phải có hành động cụ thể có thể build được |

---

## 💡 Tips

1. **Hỏi thêm nếu vibe mơ hồ** — "Sang trọng như Rolex hay sang như Zara?"
2. **Tối đa 5 vibe keywords** — Nhiều hơn sẽ tạo ra design mâu thuẫn
3. **Vibe → Action** — Mỗi từ mô tả phải dẫn tới 1 hành động build cụ thể
4. **Không tự quyết** — User phải xác nhận từng lựa chọn

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Vibe Description: "Tôi muốn app quản lý chi tiêu nhìn chill, dễ thương như app Notion"
App Type: Quản lý tài chính cá nhân (Streamlit)
```

### Output mẫu:
```markdown
# Bảng Vibe Mapping

| Từ khóa của bạn | Tôi hiểu là... | Tôi sẽ làm... |
|---|---|---|
| "Chill" | Nhẹ nhàng, không áp lực | Màu nền trắng sữa, khoảng trống rộng |
| "Dễ thương" | Tròn trịa, thân thiện | Nút bấm bo góc, icon emoji |
| "Như Notion" | Tối giản, tập trung vào nội dung | Font chữ đơn giản, ít màu sắc |

Bạn có đồng ý không? Gõ "Duyệt Vibe này" để tôi bắt đầu thiết kế.
```

### Đánh giá:
- ✅ Không thuật ngữ kỹ thuật
- ✅ Mỗi vibe có hành động cụ thể
- ✅ Có câu hỏi xác nhận
- **Kết quả: ACCEPT**

---

## 🔗 Next Step

Sau khi có Vibe Mapping được duyệt → [Vibe Logic Mapping](./02_vibe_logic_mapping.skill.md)

---

## 🔗 Related Skills — Áp dụng vibe vào thông số kỹ thuật
- [App Requirements Spec](../app_development/01_app_requirements_spec.skill.md) — Bước tiếp theo sau khi có vibe

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-27 | Khởi tạo từ CVF-Compatible Skills intake |

---

*Vibe-to-Spec Translator — CVF v1.5.2 Non-coder Workflow Skill Library*
