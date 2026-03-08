# CVF Phase Governance Review Archive

Trạng thái: Thư mục lưu trữ chuẩn, lâu dài cho các tài liệu đánh giá, quyết định, và roadmap xuất phát từ phần tích hợp `CVF_Phase Governance Protocol`.

## Purpose

- Giữ các tài liệu review ở `docs/` thay vì trong proposal workspace
- Làm nguồn tham chiếu ổn định cho baseline, reassessment, decision log, và roadmap nâng cấp
- Tách rõ:
  - code/integration source,
  - proposal workspace,
  - long-term review archive

## Archive Contents

- `CVF_DANH_GIA_DOC_LAP_TOAN_DIEN_2026-03-06.md`
- `CVF_EXECUTIVE_REVIEW_BASELINE_2026-03-06.md`
- `CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md`
- `CVF_PHASE_GOVERNANCE_PROTOCOL_INDEPENDENT_REVIEW_2026-03-06.md`
- `CVF_DANH_GIA_INDEPENDENT_TESTER_ASSESSMENT.md`
- `CVF_DANH_GIA_TONG_HOP_13_DE_XUAT.md`
- `CVF_IMPLEMENT_DECISION_MATRIX_2026-03-06.md`
- `CVF_QUYET_DINH_TICH_HOP_CHINH_THUC.md`
- `CVF_ROADMAP_NANG_CAP.md`
- `CVF_UPGRADE_TRACE_2026-03-07.md`
- `CVF_CONFORMANCE_TRACE_2026-03-07.md`
- `CVF_CROSS_EXTENSION_CONFORMANCE_REPORT_2026-03-07.md`
- `logs/` (scoped trace archives when a review-chain rotation guard is active)

## Storage Rule

- Các tài liệu review/assessment/decision/roadmap đã trở thành baseline hoặc evidence lâu dài phải được lưu dưới `docs/`.
- Proposal workspace không còn là nơi lưu trữ chuẩn cho các tài liệu đã được chấp nhận làm bằng chứng đối soát.
- Các tài liệu lưu trữ mới phải tuân thủ `CVF_DOCUMENT_NAMING_GUARD.md`.
- Các tài liệu lưu trữ mới cũng phải tuân thủ `CVF_DOCUMENT_STORAGE_GUARD.md` và placement map trong `docs/INDEX.md`.

## Note

Baseline gốc để đối soát toàn hệ hiện tại là:

- `CVF_DANH_GIA_DOC_LAP_TOAN_DIEN_2026-03-06.md`

Executive summary tách riêng:

- `CVF_EXECUTIVE_REVIEW_BASELINE_2026-03-06.md`

Roadmap triển khai tách riêng:

- `CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md`

Trace file cho wave hardening local hiện tại:

- `CVF_UPGRADE_TRACE_2026-03-07.md`

Conformance evidence cho W2:

- `CVF_CONFORMANCE_TRACE_2026-03-07.md`
- `CVF_CROSS_EXTENSION_CONFORMANCE_REPORT_2026-03-07.md`
- `logs/` khi conformance trace được rollover khỏi active window
