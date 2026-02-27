# Grandma UX Test

> **Domain:** Product UX
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

- [ ] Có app hoặc UI prototype để đánh giá (Phase B Design hoặc Phase D Review)

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Phase B (Design) — đánh giá độ thân thiện của thiết kế trước khi build
- Phase D (Review) — kiểm tra UX lần cuối trước khi ship
- Muốn đảm bảo app dùng được bởi người không quen công nghệ

**Không phù hợp khi:**
- App dành riêng cho developer/chuyên gia kỹ thuật
- Chỉ cần đánh giá code logic, không phải UX

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Architect, Reviewer |
| Allowed Phases | Design, Review |
| Authority Scope | Informational |
| Autonomy | Auto |
| Audit Hooks | UX checklist applied, 3-step test documented, Issues prioritized |

---

## ⛔ Execution Constraints

- AI PHẢI liệt kê 3 bước đơn giản nhất để người mới bắt đầu dùng được app
- Ngôn ngữ đánh giá KHÔNG được dùng: "Component", "Render", "State", "API"
- Nút bấm phải to, rõ, màu chỉ dẫn (Xanh = Lưu, Đỏ = Hủy/Xóa)
- Luôn có thông báo "Đang xử lý..." hoặc "Đã xong!" khi app làm việc

---

## ✅ Validation Hooks

- Check có 3-step Quick Start cho người mới
- Check có đánh giá từng quy tắc UX (nút, ngôn ngữ, trạng thái)
- Check issues được phân loại: Phải sửa / Nên sửa / Tùy chọn

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-non_coder_workflow-04_grandma_ux_test.md`
- UAT Objective: Output phải có 3-step guide và danh sách issues với mức độ ưu tiên rõ ràng

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Mô tả app** | App làm gì, dành cho ai | ✅ | "App theo dõi chi tiêu gia đình, dành cho nội trợ" |
| **Tính năng chính** | Các tác vụ người dùng hay làm nhất | ✅ | "Ghi chép chi tiêu, xem báo cáo tháng" |
| **Screenshot/mô tả UI** | Giao diện hiện tại trông như thế nào | ❌ | "Có sidebar bên trái, bảng dữ liệu ở giữa" |

---

## ✅ Expected Output

**Kết quả bạn nhận được:**

```markdown
# Grandma UX Test Report

## 3 bước để bắt đầu (Quick Start)
1. Mở app → thấy màn hình chính với nút "Ghi chi tiêu" màu xanh lớn
2. Bấm nút xanh → điền số tiền và chọn danh mục → bấm "Lưu"
3. Bấm "Xem báo cáo" → thấy biểu đồ tháng này

## Đánh giá UX

### ✅ Đạt chuẩn
- Nút "Lưu" màu xanh, nút "Xóa" màu đỏ — rõ ràng
- Có thông báo "Đã lưu thành công!" sau khi lưu

### ⚠️ Cần cải thiện (Phải sửa)
- Ô nhập "Số tiền" không có placeholder — User không biết nhập gì
- Nút "Export" quá nhỏ, khó bấm trên điện thoại

### 💡 Nên xem xét (Tùy chọn)
- Thêm nút "Hủy" ở form nhập liệu để User không bị kẹt

## Điểm UX
🟢 Dễ dùng: 7/10 — Người không quen công nghệ có thể tự dùng sau 5 phút hướng dẫn
```

---

## 🔍 Cách đánh giá

**Checklist Accept:**
- [ ] Có đúng 3 bước Quick Start, mỗi bước ≤ 2 câu
- [ ] Issues phân loại rõ: Phải sửa / Nên sửa / Tùy chọn
- [ ] Không dùng thuật ngữ kỹ thuật trong report
- [ ] Có điểm UX tổng thể

**Red flags (Reject):**
- ⚠️ Quick Start có hơn 5 bước
- ⚠️ Report dùng từ "component", "state", "render"
- ⚠️ Không phân biệt mức độ nghiêm trọng của issues

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|-----------------|
| Quick Start quá chi tiết | Mỗi bước chỉ 1 hành động chính |
| Đánh giá quá kỹ thuật | Hỏi: "Bà ngoại 60 tuổi có làm được không?" |
| Bỏ qua mobile UX | Khi app chạy web, kiểm tra cả giao diện điện thoại |

---

## 💡 Tips

1. **Câu hỏi vàng** — "Nếu không biết gì về app này, bước đầu tiên bạn làm là gì?"
2. **Test màu sắc nút** — Xanh=Lưu/Tiếp, Đỏ=Xóa/Hủy, Xám=Phụ
3. **Kiểm tra trạng thái** — Mọi hành động phải có phản hồi (loading, success, error)
4. **Font size** — Chữ không được nhỏ hơn 14px (tương đương size M trên điện thoại)

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Mô tả app: "App theo dõi lịch uống thuốc cho người cao tuổi"
Tính năng chính: "Đặt nhắc nhở, đánh dấu đã uống, xem lịch sử"
```

### Output mẫu:
```markdown
# Grandma UX Test — App Nhắc Uống Thuốc

## 3 bước Quick Start
1. Mở app → thấy danh sách thuốc cần uống hôm nay
2. Bấm tên thuốc → bấm nút "Đã uống" màu xanh to
3. Bấm "Lịch sử" để xem những ngày trước

## Đánh giá
### ✅ Đạt
- Nút "Đã uống" đủ to, màu xanh rõ
### ⚠️ Phải sửa
- Font size quá nhỏ (12px) — người cao tuổi khó đọc
- Không có nhắc nhở khi trễ giờ uống
### 💡 Tùy chọn
- Thêm chế độ chữ to

## Điểm: 🟡 6/10 — Cần sửa font trước khi ship
```

### Đánh giá:
- ✅ 3 bước Quick Start rõ ràng
- ✅ Issues có mức độ ưu tiên
- ✅ Điểm UX cụ thể
- **Kết quả: ACCEPT**

---

## 🔗 Next Step

Sau khi pass UX Test → [Auto Documentation (VN)](./05_auto_documentation_vn.skill.md)

---

## 🔗 Related Skills — Áp dụng vibe trước khi test UX
- [Auto Documentation (VN)](./05_auto_documentation_vn.skill.md) — Viết hướng dẫn sau khi pass UX test

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-27 | Khởi tạo từ CVF-Compatible Skills intake |

---

*Grandma UX Test — CVF v1.5.2 Non-coder Workflow Skill Library*
