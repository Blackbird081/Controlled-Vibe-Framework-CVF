# PHASE C GATE  
Controlled Vibe Framework (CVF)

---

## Mục đích
Phase C Gate xác nhận rằng:
- Thiết kế đã đủ rõ để build
- Không còn ambiguity mang tính cấu trúc
- Build có thể diễn ra mà không cần suy đoán

Không đạt Gate → **không được phép bước vào Phase C**.

---

## Phạm vi áp dụng
Áp dụng:
- Sau khi hoàn tất Phase B — Design
- Trước khi bắt đầu Phase C — Build

---

## Nguyên tắc
- Gate này **không đánh giá chất lượng code**
- Chỉ đánh giá **độ sẵn sàng để build**
- Không chấp nhận “vừa build vừa nghĩ tiếp”

---

## Điều kiện bắt buộc

### 1. Mục tiêu đã cố định
☐ Mục tiêu dự án không thay đổi so với Phase A  
☐ Không xuất hiện mục tiêu mới chưa được đánh giá  
☐ Scope đã được chốt ở mức buildable  

---

### 2. Thiết kế đã đủ chi tiết
☐ Kiến trúc tổng thể đã được mô tả  
☐ Luồng logic chính đã rõ ràng  
☐ Không còn điểm mơ hồ mang tính hệ thống  

---

### 3. Quyết định đã được ghi nhận
☐ Các quyết định quan trọng đã được log  
☐ Không có quyết định “ngầm hiểu”  
☐ Không phụ thuộc vào trí nhớ cá nhân  

---

### 4. Rủi ro đã được nhận diện
☐ Các rủi ro chính đã được liệt kê  
☐ Có hướng xử lý hoặc chấp nhận rủi ro  
☐ Không build trong trạng thái mù mờ  

---

### 5. Tính khả thi
☐ Build nằm trong khả năng thực tế  
☐ Không dựa vào giả định chưa kiểm chứng  
☐ Không kỳ vọng AI tự giải quyết mâu thuẫn  

---

### 6. Skill Preflight trước Build
☐ Đã xác định skill dự kiến dùng cho Phase C  
☐ Mỗi skill có Skill Mapping Record hợp lệ và đúng Phase/Risk hiện tại  
☐ Agent đã khai báo skill trước khi code trong trace  
☐ Nếu chưa có skill phù hợp, đã STOP và tạo intake/escalation record  

---

## Quyết định Gate

- **PASS** → Được phép bước vào Phase C  
- **FAIL** → Quay lại Phase B để làm rõ  

Không có trạng thái trung gian.

---

## Trách nhiệm
- User xác nhận PASS / FAIL  
- AI không được tự ý vượt Gate  

---

## Trạng thái
- Thuộc CVF v1.0 FINAL
- Gate bắt buộc
- Không được chỉnh sửa ở project-level

---
