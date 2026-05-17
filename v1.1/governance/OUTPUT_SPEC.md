# OUTPUT_SPEC — CVF v1.1
Version: 1.1 | Status: STABLE | Layer: Governance | Compatible: v1.0 baseline (additive)

## Mục đích
Định nghĩa output hợp lệ: định dạng, chất lượng, reviewer, điều kiện chấp nhận. Output chưa review = non-authoritative.

## Trường bắt buộc
- Output Description: kết quả mong đợi, phạm vi rõ.
- Format / Deliverable type: ví dụ Markdown, docx, code file, diagram.
- Acceptance Criteria (đo được): tiêu chí pass/fail, càng định lượng càng tốt.
- Quality Bar: chuẩn tối thiểu (style, lint, test, voice & tone).
- Reviewer Role: ai được quyền duyệt, tách biệt executor.
- Trace Requirements: nơi lưu log, liên kết AU, decision, input.
- Dependencies: INPUT_SPEC/decision tham chiếu.
- Non-Goals / Out of scope.
- Version / Date.

## Review Checklist
- [ ] Khớp INPUT_SPEC tham chiếu
- [ ] Đúng format/structure yêu cầu
- [ ] Đạt quality bar và acceptance criteria
- [ ] Trace rõ: Command → Archetype/Preset → AU → Output
- [ ] Reviewer ký nhận (tên/role/time)

## Ví dụ ngắn (AU: checklist review trang đích)
- Output Description: Checklist QA nội dung trang đích Q1
- Format: Markdown checklist, 12 mục
- Acceptance: Có mục CTA, liên kết, chính tả, brand voice, ngày phát hành
- Quality bar: Không lỗi chính tả, cấu trúc rõ, bullet ngắn
- Reviewer: Supervisor (Content Lead)
- Trace: lưu tại /traces/AU-001.md, link decision DC-01

## Notes
- Nếu scope đổi, cập nhật OUTPUT_SPEC và quyết định liên quan.
