# DECISIONS  
Controlled Vibe Framework (CVF)

---

## Mục đích
File này ghi lại **tất cả các quyết định mang tính nền tảng** của CVF v1.0 FINAL.  
Mục tiêu là:
- Tránh thay đổi ngầm
- Tránh “diễn giải lại” framework theo người dùng
- Đảm bảo CVF được áp dụng nhất quán trong mọi dự án

File này **không cập nhật theo phase** và **không chứa decision của từng project cụ thể**.

---

## D-001 — CVF là framework độc lập với công nghệ
**Decision:**  
CVF không gắn với ngôn ngữ lập trình, tool, IDE, hay nền tảng AI cụ thể.

**Rationale:**  
Vibe coding tập trung vào **intent, kiểm soát và chất lượng output**, không phải kỹ thuật triển khai.

---

## D-002 — User không tham gia viết code
**Decision:**  
Người dùng CVF:
- Không cần giỏi code
- Không can thiệp trực tiếp vào code
- Chỉ đánh giá output cuối cùng so với intent ban đầu

**Rationale:**  
Giữ đúng tinh thần vibe coding: *describe → observe → evaluate*.

---

## D-003 — AI không được tự ra quyết định sản phẩm
**Decision:**  
AI:
- Không được tự thêm feature
- Không được thay đổi scope
- Không được tối ưu ngoài intent đã mô tả

**Rationale:**  
AI là executor, không phải product owner.

---

## D-004 — Tách bạch Governance và Phases
**Decision:**  
- Governance định nghĩa **điều kiện và luật**
- Phases định nghĩa **trình tự thực thi**

Hai lớp này **không trùng vai trò** và **không thay thế nhau**.

---

## D-005 — Project Init Checklist không thay thế Phase A
**Decision:**  
- `PROJECT_INIT_CHECKLIST.md` = điều kiện đủ để bắt đầu dự án
- `PHASE_A_DISCOVERY.md` = nội dung công việc khi dự án đã bắt đầu

**Rationale:**  
Checklist ≠ Discovery.

---

## D-006 — Phase Status có hai lớp
**Decision:**  
- `PHASE_STATUS.md` (root/phases): theo dõi tiến trình thực tế
- Khái niệm Phase Status tổng thể được giải thích riêng cho người mới

**Rationale:**  
Tránh hiểu nhầm giữa “định nghĩa trạng thái” và “báo cáo trạng thái”.

---

## D-007 — README không chứa chi tiết vận hành
**Decision:**  
README:
- Chỉ đóng vai trò định hướng
- Không hướng dẫn chi tiết
- Không giải thích các trường hợp đặc biệt

**Rationale:**  
Giảm cognitive load cho người mới.

---

## D-008 — Decision phải được ghi lại, không suy diễn
**Decision:**  
Mọi thay đổi hoặc điều chỉnh framework:
- Phải được ghi thành decision
- Không được áp dụng ngầm

**Rationale:**  
CVF ưu tiên tính truy vết hơn sự linh hoạt ngắn hạn.

---

## D-009 — Template phải tuân thủ framework
**Decision:**  
Mọi template đi kèm CVF:
- Không được giản lược core rules
- Không được lược bỏ decision log

**Rationale:**  
Template là công cụ nhân bản chuẩn mực.

---

## D-010 — v1.0 là phiên bản đóng băng
**Decision:**  
- Không chỉnh sửa nội dung v1.0 sau khi freeze
- Mọi cải tiến sẽ được đưa vào roadmap v1.1+

**Rationale:**  
Đảm bảo nền tảng ổn định để mở rộng.

---

## Trạng thái
- Phiên bản: **CVF v1.0 FINAL**
- Trạng thái: **FREEZE**
- Không chỉnh sửa hoặc bổ sung thêm decision cho v1.0

---
