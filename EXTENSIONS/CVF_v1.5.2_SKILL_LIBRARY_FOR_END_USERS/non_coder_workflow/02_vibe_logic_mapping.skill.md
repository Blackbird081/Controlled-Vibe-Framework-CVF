# Vibe Logic Mapping

> **Domain:** Non-coder Workflow
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

- [ ] Đã chạy Skill [Vibe-to-Spec Translator](./01_vibe_to_spec.skill.md) và có "Vibe Mapping" được User duyệt

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Phase B (Design) — sau khi đã có Vibe Mapping được duyệt
- Cần chuyển "vibe" đã xác nhận thành thông số kỹ thuật cụ thể (font, màu, layout) để AI dùng khi build
- Muốn đảm bảo UI/UX nhất quán xuyên suốt toàn bộ app

**Không phù hợp khi:**
- Chưa có Vibe Mapping được User xác nhận
- App không có UI (CLI thuần, API backend)

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Architect, Builder |
| Allowed Phases | Design, Build |
| Authority Scope | Informational |
| Autonomy | Auto |
| Audit Hooks | Vibe source confirmed, Technical spec generated, Applied changes documented |

---

## ⛔ Execution Constraints

- AI PHẢI liệt kê rõ: "Vì bạn muốn [Vibe], tôi đã áp dụng [Thông số X, Y, Z]"
- AI KHÔNG ĐƯỢC tự ý thay đổi vibe đã được User duyệt
- Kết quả Build phải thể hiện đúng sự thay đổi về mặt thị giác (Visual changes)

---

## ✅ Validation Hooks

- Check Vibe source đã có từ Skill 01 (Vibe-to-Spec)
- Check output có đủ mapping: Vibe keyword → Font → Màu → Layout → Hiệu ứng
- Check mỗi thông số kỹ thuật có thể áp dụng ngay vào code (actionable)

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-non_coder_workflow-02_vibe_logic_mapping.md`
- UAT Objective: Mapping phải nhất quán, mỗi vibe phải dẫn đến thông số kỹ thuật cụ thể có thể implement

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Vibe đã duyệt** | Vibe Mapping đã được User xác nhận từ Skill 01 | ✅ | "Chuyên nghiệp, Tối giản" |
| **Tech Stack** | Công nghệ đang dùng để build | ✅ | "Streamlit", "Next.js", "HTML/CSS" |
| **App Type** | Loại app | ❌ | "Dashboard", "Form app", "Report viewer" |

---

## ✅ Expected Output

**Kết quả bạn nhận được — Bảng kỹ thuật theo Vibe:**

```markdown
# Vibe Technical Spec

## Vibe: "Chuyên nghiệp" (Professional)
| Thành phần | Thông số |
|---|---|
| Font chính | Inter (hoặc tương đương) |
| Màu nền | Xám đậm / Trắng xanh nhạt |
| Màu chữ | Trắng (nền tối) / Đen đậm (nền sáng) |
| Layout | Cột đôi, khoảng cách rộng, căn lề nghiêm |
| Biểu đồ | Donut chart, màu xanh đậm + xám |
| Hiệu ứng | Tối thiểu — chỉ highlight khi hover |

## Vibe: "Chill / Nhẹ nhàng"
| Thành phần | Thông số |
|---|---|
| Font chính | Rounded (Nunito hoặc tương đương) |
| Màu nền | Trắng sữa / Pastel xanh nhạt |
| Nút bấm | Bo góc lớn (rất tròn) |
| Icon | Emoji-based hoặc outline mỏng |
| Hiệu ứng | Fade-in nhẹ, không flash |

## Vibe: "Nhanh / Mạnh"
| Thành phần | Thông số |
|---|---|
| Menu | Sidebar thu gọn, chỉ icon |
| Phím tắt | Ưu tiên keyboard shortcuts |
| Loading | Skeleton loader thay thế spinner |
| Màu accent | Đỏ cam hoặc xanh điện |
```

---

## 🔍 Cách đánh giá

**Checklist Accept:**
- [ ] Mỗi vibe có ít nhất 4 thông số kỹ thuật
- [ ] Thông số đủ cụ thể để implement ngay (không mơ hồ)
- [ ] AI đã ghi rõ lý do: "Vì bạn muốn [X], tôi chọn [Y]"
- [ ] Không mâu thuẫn giữa các vibe với nhau

**Red flags (Reject):**
- ⚠️ Thông số quá chung chung: "màu đẹp", "font dễ đọc"
- ⚠️ Vibe khác nhau nhưng cho ra thông số giống nhau
- ⚠️ Không có lý do cho từng lựa chọn

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|-----------------|
| Thông số quá chung chung | Mỗi field phải có giá trị cụ thể đủ để code |
| Thiếu loại biểu đồ | Luôn khai báo chart type nếu app có data viz |
| Không ghi lý do | Dùng mẫu: "Vì [Vibe] → tôi chọn [Thông số]" |

---

## 💡 Tips

1. **Ưu tiên 3 vibe phổ biến** — Professional, Chill, Fast là 3 preset tốt nhất cho Non-coder
2. **Streamlit users** — Primary color `#FF4B4B`, dùng `st.columns` và `st.tabs`
3. **Ghi rõ lý do** — User sẽ tin tưởng AI hơn khi thấy logic đằng sau mỗi lựa chọn
4. **Giữ nhất quán** — Một app chỉ dùng 1-2 vibe, không mix nhiều vibe mâu thuẫn

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Vibe đã duyệt: "Chuyên nghiệp + Tối giản"
Tech Stack: Streamlit (Python)
App Type: Dashboard quản lý chi tiêu
```

### Output mẫu:
```markdown
# Vibe Technical Spec — "Chuyên nghiệp + Tối giản"

| Thành phần | Thông số | Lý do |
|---|---|---|
| Font | Inter (via custom CSS) | Vì "Chuyên nghiệp" — font Business chuẩn |
| Primary color | #262730 (xám Streamlit đậm) | Vì "Tối giản" — nền tối tập trung |
| Layout | st.columns(2) + st.expander | Vì "Chuyên nghiệp" — bố cục có cấu trúc |
| Biểu đồ | Donut chart (plotly) | Vì "Tối giản" — 1 chart đủ thông tin |
| Màu accent | #00B4D8 (xanh) | Nhấn mạnh số quan trọng, không chói |
| Hiệu ứng | st.spinner chỉ khi load | Vì "Tối giản" — không animation thừa |
```

### Đánh giá:
- ✅ Mỗi thông số có lý do rõ ràng
- ✅ Đủ cụ thể để implement ngay
- ✅ Không có mâu thuẫn giữa 2 vibe
- **Kết quả: ACCEPT**

---

## 🔗 Next Step

Sau khi có Technical Spec → [Grandma UX Test](./04_grandma_ux_test.skill.md)

---

## 🔗 Related Skills — Bước trước (tạo Vibe Mapping)
- [Grandma UX Test](./04_grandma_ux_test.skill.md) — Bước sau (kiểm tra UX)

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-27 | Khởi tạo từ CVF-Compatible Skills intake |

---

*Vibe Logic Mapping — CVF v1.5.2 Non-coder Workflow Skill Library*
