# PHASE A — DISCOVERY  
Controlled Vibe Framework (CVF)

---

## Mục tiêu của Phase A
Phase A nhằm đảm bảo:
- AI hiểu đúng intent của user
- Phạm vi dự án được xác định rõ
- Không có giả định ngầm trước khi thực thi

Nếu Phase A chưa hoàn tất → **không được chuyển sang Phase B**.

---

## Bản chất của Phase A
Phase A **không phải**:
- Thu thập yêu cầu kỹ thuật
- Viết đặc tả chi tiết
- Định nghĩa solution

Phase A là:
- Làm rõ **vấn đề cần giải quyết**
- Xác định **kết quả mong muốn**
- Nhận diện **giới hạn và ràng buộc**

---

## Nội dung bắt buộc phải làm rõ

### 1. Intent cốt lõi
AI phải xác định được:
- User đang muốn đạt điều gì
- Thành công được đo bằng tiêu chí nào
- Điều gì bị xem là thất bại

Intent phải được diễn đạt bằng ngôn ngữ:
- Dễ hiểu
- Không mơ hồ
- Có thể kiểm chứng ở Phase D

---

### 2. Phạm vi (Scope)
Phải làm rõ:
- Những gì **nằm trong phạm vi**
- Những gì **nằm ngoài phạm vi**

Không được:
- Mở rộng scope vì “thấy hợp lý”
- Đề xuất thêm feature ngoài intent

---

### 3. Giả định & điều kiện
AI phải nêu rõ:
- Những giả định đang được dùng
- Điều kiện tiên quyết để giải pháp có hiệu lực

Giả định không rõ → phải dừng lại.

---

### 4. Ràng buộc
Bao gồm nhưng không giới hạn:
- Thời gian
- Nguồn lực
- Mức độ can thiệp của user
- Giới hạn kỹ thuật (nếu có)

---

## Vai trò của user trong Phase A
User:
- Cung cấp intent ban đầu
- Trả lời các câu hỏi làm rõ (nếu được hỏi)
- Không cần diễn đạt kỹ thuật
- Không cần đưa solution

---

## Vai trò của AI trong Phase A
AI:
- Không đề xuất solution
- Không viết code
- Không tối ưu

AI phải:
- Làm rõ vấn đề
- Phản hồi khi intent mơ hồ
- Từ chối chuyển phase nếu thiếu thông tin

---

## Điều kiện hoàn tất Phase A
Phase A được xem là hoàn tất khi:
- Intent được ghi nhận rõ ràng
- Scope được xác định
- Giả định & ràng buộc đã được nêu

Kết quả Phase A phải:
- Được ghi lại
- Có thể tham chiếu ở các phase sau

---

## Quan hệ với các file khác
- Không trùng vai với `PROJECT_INIT_CHECKLIST.md`
- Không thay thế decision log
- Là đầu vào bắt buộc cho Phase B

---

## Quy tắc
- Không rút ngắn Phase A
- Không gộp Phase A với Phase B
- Không suy diễn intent thay user

---

## Trạng thái
- Thuộc CVF v1.0 FINAL
- Nội dung bắt buộc cho mọi dự án
- Không freeze ở project-level

---
