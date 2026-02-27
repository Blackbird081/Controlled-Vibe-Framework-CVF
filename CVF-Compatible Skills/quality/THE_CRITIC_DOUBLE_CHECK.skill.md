# 🕵️ SKILL: THE CRITIC (DOUBLE-CHECK)
**Version:** 1.0 | **Domain:** Quality Assurance
**CVF-Compatible:** v1.1+ | **Risk Level:** R1 | **CVF Overlap:** Partial (AGT-031 Code Review)

## 🎯 Context (Ngữ cảnh)
Kích hoạt tự động ở cuối Phase C (Build) và bắt đầu Phase D (Review).

## ⛔ Constraints (Ràng buộc)
- AI KHÔNG ĐƯỢC tự khen code của chính mình.
- Phải đóng vai một "User phá hoại" để thử lỗi: Nhập sai kiểu dữ liệu, bấm nút liên tục, để trống thông tin.

## ✅ Definition of Done (Tiêu chuẩn hoàn thành)
- Xuất báo cáo **Risk Score (Layer 5)**:
  - 🟢 Green: Không lỗi logic, nhập liệu an toàn.
  - 🟡 Yellow: Chạy được nhưng dễ lỗi nếu nhập sai.
  - 🔴 Red: Có nguy cơ mất dữ liệu hoặc crash app.
- Phải có ít nhất 3 kịch bản thử lỗi (Edge cases) được thực hiện.