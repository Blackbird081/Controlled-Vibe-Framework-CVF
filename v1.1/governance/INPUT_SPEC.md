# INPUT_SPEC — CVF v1.1
Version: 1.1 | Status: STABLE | Layer: Governance | Compatible: v1.0 baseline (additive)

## Mục đích
Chuẩn hóa đầu vào cho mọi Action Unit/agent: rõ intent, scope, constraint, format. Không có INPUT_SPEC hợp lệ thì không khởi tạo AU.

## Trường bắt buộc
- Title / Objective: mục tiêu ngắn gọn, đo được.
- Problem Statement / Context: bối cảnh, người dùng, pain point.
- In/Out of Scope: liệt kê rõ, tránh suy diễn.
- Constraints: thời gian, chi phí, kỹ thuật, compliance.
- Dependencies / Known unknowns: tài nguyên, quyết định chờ, giả định.
- Expected Output Form: định dạng mong muốn (doc/code/plan), cấu trúc.
- Acceptance Criteria (input-level): tiêu chí dùng để nói “input đủ để làm”.
- Owner: người chịu trách nhiệm về tính đúng của input.
- Version / Date.

## Validation Checklist
- [ ] Scope rõ, không mơ hồ
- [ ] Không xung đột Decisions/Freeze
- [ ] Constraint cụ thể, đo được
- [ ] Output form khả thi với nguồn lực
- [ ] Dependencies/assumptions đã ghi nhận

## Ví dụ ngắn (AU: viết checklist review)
- Title: Checklist review trang đích
- Context: Trang đích chiến dịch Q1, cần checklist QA nội dung
- In/Out: In phạm vi copy + CTA; Out: triển khai code
- Constraints: 1 ngày, không sửa design
- Expected Output Form: Markdown checklist 10-15 mục
- Acceptance: Có mục kiểm tra CTA, lỗi chính tả, liên kết, tông giọng
- Owner: PM Growth

## Notes
- Thay đổi INPUT_SPEC => log lý do, cập nhật version, re-freeze scope nếu đã freeze.
