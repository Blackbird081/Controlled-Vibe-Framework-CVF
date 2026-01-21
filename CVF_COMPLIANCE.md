# CVF COMPLIANCE  
## Controlled Vibe Framework — v1.0 FINAL

Tài liệu này xác định các **yêu cầu tuân thủ bắt buộc** khi áp dụng Controlled Vibe Framework (CVF) phiên bản **v1.0 FINAL**.

Compliance trong CVF không nhằm kiểm soát con người,  
mà nhằm đảm bảo framework được sử dụng **đúng mục đích, đúng phạm vi và đúng tinh thần thiết kế**.

---

## 1. NGUYÊN TẮC CHUNG

Mọi project tuyên bố sử dụng CVF v1.0 bắt buộc phải:
- Tuân thủ cấu trúc framework
- Tuân thủ thứ tự phase
- Tuân thủ governance và gate
- Tuân thủ cách sử dụng AI đã định nghĩa

Không có khái niệm “áp dụng một phần CVF” ở cấp framework.

---

## 2. TUÂN THỦ CẤU TRÚC

Bắt buộc:
- Giữ nguyên toàn bộ cấu trúc thư mục CVF v1.0
- Không đổi tên file core
- Không di chuyển file giữa các tầng

Không được:
- Xoá file vì “chưa cần dùng”
- Gộp file cho “đỡ rối”
- Tạo file core mới trong root

Mọi mở rộng chỉ được thực hiện **ở cấp project**, không ở cấp framework.

---

## 3. TUÂN THỦ PHASE

Project sử dụng CVF v1.0 bắt buộc phải:
- Đi qua đầy đủ 4 phase: A → B → C → D
- Không bỏ phase
- Không đảo thứ tự phase

Không được:
- Nhảy thẳng sang build khi chưa hoàn tất discovery
- Review sản phẩm khi chưa có quyết định thiết kế

Phase không phải là hình thức,  
mà là **các trạng thái tư duy bắt buộc**.

---

## 4. TUÂN THỦ GOVERNANCE

Bắt buộc:
- Thực hiện `PROJECT_INIT_CHECKLIST.md` trước Phase A
- Thực hiện `PHASE_C_GATE.md` trước khi build hoàn chỉnh
- Tuân thủ chuẩn commit và đặt tên repository

Không được:
- Bỏ checklist vì “dự án nhỏ”
- Bypass gate vì “đang gấp”
- Tuỳ ý đổi chuẩn commit

Governance tồn tại để **chặn sai sớm**, không để sửa sai muộn.

---

## 5. TUÂN THỦ QUYẾT ĐỊNH

Trong CVF:
- Quyết định quan trọng phải được ghi nhận
- Quyết định không được ghi lại được xem là **chưa tồn tại**

Không được:
- Thay đổi quyết định mà không ghi nhận
- Tranh luận lại quyết định đã chốt nếu không có decision mới

`DECISIONS.md` là nguồn sự thật duy nhất cho các quyết định.

---

## 6. TUÂN THỦ SỬ DỤNG AI

Khi sử dụng AI trong CVF:
- AI chỉ thực thi theo bối cảnh được cung cấp
- AI không tự đặt mục tiêu
- AI không tự kết luận project đã “xong”

Bắt buộc:
- Ghi nhận vai trò AI
- Ghi log sử dụng AI ở cấp project

AI là công cụ hỗ trợ,  
không phải chủ thể chịu trách nhiệm.

---

## 7. KIỂM TRA TUÂN THỦ

Việc tuân thủ CVF được đánh giá dựa trên:
- Cấu trúc project
- Trình tự phase
- Sự tồn tại của checklist, gate và decision
- Mức độ minh bạch của quá trình

Compliance không dựa trên:
- Cảm nhận cá nhân
- Kinh nghiệm lâu năm
- Thâm niên hoặc chức danh

---

## 8. VI PHẠM COMPLIANCE

Project vi phạm compliance:
- Không được xem là áp dụng CVF
- Không được sử dụng danh nghĩa CVF để biện minh kết quả

Framework không chịu trách nhiệm cho:
- Sản phẩm sai hướng
- Quyết định thiếu kiểm soát
- Hệ quả từ việc không tuân thủ

---

## 9. HIỆU LỰC

- **Framework:** Controlled Vibe Framework (CVF)
- **Version:** v1.0 FINAL
- **Tình trạng:** Bắt buộc tuân thủ

Tài liệu này có hiệu lực cùng với `FRAMEWORK_FREEZE.md`  
và là một phần không tách rời của CVF v1.0.

---
