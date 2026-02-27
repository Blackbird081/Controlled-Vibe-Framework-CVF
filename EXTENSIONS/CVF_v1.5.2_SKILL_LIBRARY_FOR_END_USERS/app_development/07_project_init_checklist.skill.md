# Project Init Checklist (Non-coder)

> **Domain:** App Development
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

> Đây là skill đầu tiên trong mọi dự án — không có prerequisite.
> Chạy TRƯỚC Phase A (Discovery).

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Bắt đầu bất kỳ dự án mới nào với AI
- Muốn đảm bảo mọi thứ sẵn sàng trước khi AI bắt đầu làm việc
- Dùng như "bài kiểm tra sức khỏe" trước khi khởi động dự án CVF

**Không phù hợp khi:**
- Dự án đã đang chạy giữa chừng (bỏ qua và dùng Skills phù hợp ở phase hiện tại)

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Orchestrator |
| Allowed Phases | Discovery (Pre-Phase A) |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Checklist passed ≥ 80%, User confirmed, Tracking file initialized |

---

## ⛔ Execution Constraints

- AI KHÔNG ĐƯỢC bắt đầu thảo luận nội dung dự án nếu chưa vượt qua ≥ 80% checklist
- AI KHÔNG ĐƯỢC tự ý tick vào các ô thay cho User
- AI PHẢI khởi tạo file `governance/THEO_DOI_TIEN_DO.md` sau khi User xác nhận "Checklist Pass"

---

## ✅ Validation Hooks

- Check ≥ 80% checklist items được tick trước khi tiếp tục
- Check User đã gõ "Checklist Pass" hoặc "Bắt đầu"
- Check file `governance/THEO_DOI_TIEN_DO.md` được tạo

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-non_coder_workflow-07_project_init_checklist.md`
- UAT Objective: AI không được bắt đầu dự án khi checklist pass < 80%; phải tạo tracking file sau confirmation

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Tên dự án** | Tên ngắn gọn | ✅ | "FinanceTracker" |
| **Mô tả 1 câu** | App làm gì | ✅ | "Theo dõi chi tiêu gia đình offline" |
| **Hệ điều hành** | Máy tính đang dùng | ✅ | "Windows 11" |
| **Python đã cài chưa** | Có / Không | ✅ | "Có — Python 3.11" |

---

## ✅ Expected Output

**Checklist AI xuất ra cho User tích:**

```markdown
# ✅ CVF Project Init Checklist — FinanceTracker

## 1. Nền tảng (Foundation)
- [ ] Thư mục dự án đã tạo trên máy tính?
- [ ] Thư mục `governance/` đã có trong thư mục dự án?
- [ ] Python đã cài sẵn trên máy? (Hoặc AI có quyền thực thi?)

## 2. Ý tưởng (The Vibe)
- [ ] Bạn đã nói rõ app sẽ làm gì chưa?
- [ ] Đây là dự án offline/local (không cần server)? ✅ Phù hợp CVF
- [ ] Có yêu cầu đặc biệt về hệ điều hành không? (VD: chỉ chạy Windows)

## 3. Quy tắc CVF (Compliance)
- [ ] Bạn đồng ý làm theo 4 bước: Khám phá → Thiết kế → Build → Kiểm tra?
- [ ] Tôi sẽ dùng 🟢🟡🟠🔴 để báo mức độ rủi ro — bạn đồng ý?

---
Kết quả: [X]/8 items ✅

Gõ **"Checklist Pass"** để bắt đầu, hoặc cho tôi biết item nào chưa sẵn sàng.
```

**Sau khi User xác nhận — tạo file tracking:**
```markdown
# THEO DÕI TIẾN ĐỘ — FinanceTracker
Ngày bắt đầu: 2026-02-27
Phase hiện tại: A — Discovery
Trạng thái: 🟢 Đang làm
```

---

## 🔍 Cách đánh giá

**Checklist Accept:**
- [ ] 8 items checklist đủ và rõ ràng
- [ ] Hiển thị số đã tick: "[X]/8 items"
- [ ] Có hướng dẫn rõ cách xác nhận ("Gõ Checklist Pass")
- [ ] File `THEO_DOI_TIEN_DO.md` được tạo sau xác nhận

**Red flags (Reject):**
- ⚠️ AI bắt đầu hỏi về spec khi checklist chưa pass
- ⚠️ AI tự tick vào ô thay cho User
- ⚠️ Không tạo tracking file sau confirmation

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|-----------------|
| Bỏ qua checklist vì User vội | Nhắc nhẹ: "Chỉ tốn 2 phút, giúp tránh vấn đề sau này" |
| User không biết tạo thư mục governance | Hướng dẫn từng bước: "Bấm chuột phải → New Folder → đặt tên governance" |

---

## 💡 Tips

1. **Nhanh nhưng đúng** — Checklist chỉ mất 2 phút nhưng tránh được nhiều lỗi sau
2. **Tracking file là bộ nhớ** — Luôn cập nhật `THEO_DOI_TIEN_DO.md` sau mỗi phase
3. **Offline-first** — CVF hoạt động tốt nhất với dự án local, không cần server
4. **≥ 80% là đủ** — Không cần 100% hoàn hảo để bắt đầu

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Tên dự án: "SalesTracker"
Mô tả: "Theo dõi doanh số nhân viên bán hàng"
Hệ điều hành: Windows 11
Python: Đã cài Python 3.11
```

### Output mẫu:
- Checklist 8 items hiện ra
- User tick 7/8 (bỏ qua "thư mục governance" chưa tạo)
- AI hướng dẫn tạo thư mục governance (30 giây)
- User gõ "Checklist Pass" → file `THEO_DOI_TIEN_DO.md` được tạo
- **Kết quả: ACCEPT** — Bắt đầu Phase A

---

## 🔗 Next Step

Sau khi Checklist Pass → [Vibe-to-Spec Translator](./01_vibe_to_spec.skill.md) — bắt đầu Phase A

---

## 🔗 Related Skills — Skill đầu tiên trong Phase A
- [App Requirements Spec](../app_development/01_app_requirements_spec.skill.md) — Bước tiếp theo sau Init

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-27 | Khởi tạo từ CVF-Compatible Skills intake |

---

*Project Init Checklist — CVF v1.5.2 Non-coder Workflow Skill Library*
