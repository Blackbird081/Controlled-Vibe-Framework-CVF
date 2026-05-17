# PHASE C — BUILD  
Controlled Vibe Framework (CVF)

---

## Mục tiêu của Phase C
Phase C nhằm:
- Thực thi giải pháp đã được thiết kế ở Phase B
- Tạo ra output cụ thể để user đánh giá
- Đảm bảo việc thực thi không lệch intent

Nếu Phase C chưa hoàn tất → **không được chuyển sang Phase D**.

---

## Bản chất của Phase C
Phase C **là giai đoạn hành động**, nhưng:
- Không phải nơi ra quyết định sản phẩm
- Không phải nơi thay đổi design
- Không phải nơi mở rộng scope

Phase C chỉ trả lời câu hỏi:
> “Thiết kế đã thống nhất được triển khai như thế nào?”

---

## Điều kiện bắt buộc trước khi bắt đầu
Phase C chỉ được phép bắt đầu khi:
- Phase A đã hoàn tất
- Phase B đã hoàn tất
- Không có intent mơ hồ
- Không có design chưa rõ

Nếu điều kiện chưa đủ → AI **phải dừng**.

---

## Nội dung thực thi trong Phase C

### 1. Triển khai theo design
AI phải:
- Bám sát approach đã thiết kế
- Không tự thay đổi cấu trúc
- Không thêm logic mới ngoài Phase B

---

### 2. Kiểm soát sai lệch
Trong quá trình build:
- Nếu phát hiện design không khả thi
- Nếu cần thay đổi cách tiếp cận

AI phải:
- Dừng Phase C
- Ghi nhận issue
- Quay lại Phase B (không tự xử lý)

---

### 3. Ghi nhận artifact
Mọi output tạo ra phải:
- Có thể truy vết ngược về design
- So sánh được với intent ban đầu
- Phục vụ cho việc review ở Phase D

---

## Vai trò của user trong Phase C
User:
- Không can thiệp chi tiết thực thi
- Không chỉnh sửa artifact trung gian
- Chỉ chờ output để đánh giá

---

## Vai trò của AI trong Phase C
AI:
- Thực thi chính xác design
- Không tối ưu ngoài phạm vi
- Không “làm cho đẹp” nếu không được yêu cầu

---

## Điều kiện hoàn tất Phase C
Phase C hoàn tất khi:
- Artifact đã được tạo ra đầy đủ
- Output có thể đánh giá bằng tiêu chí đã định
- Không còn hành động build dang dở

---

## Quan hệ với các file khác
- Bị ràng buộc bởi `PHASE_C_GATE.md`
- Dựa hoàn toàn trên Phase B Design
- Không thay thế Phase D Review

---

## Quy tắc
- Không chỉnh design trong Phase C
- Không bỏ qua gate
- Không tiếp tục nếu phát hiện lệch intent

---

## Trạng thái
- Thuộc CVF v1.0 FINAL
- Nội dung bắt buộc cho mọi dự án
- Không freeze ở project-level

---
