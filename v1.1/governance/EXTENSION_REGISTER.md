# EXTENSION_REGISTER — CVF v1.1
Version: 1.1 | Status: STABLE | Layer: Governance | Compatible: v1.0 baseline (additive)

Mục đích: Danh mục extension hợp lệ (Input/Process/Output). Không phải log sử dụng.

## Nguyên tắc
- Không ghi project-specific, không ghi bật/tắt.
- Extension ≠ bắt buộc; chỉ hợp lệ để được phép dùng.

## Template Entry
- Name:
- ID:
- Type: (Input / Process / Output)
- Purpose:
- Scope:
- Affected Phases:
- Requires Code Knowledge: (Yes/No)
- Compatibility Notes:
- Status: (Active/Deprecated/Experimental)

## Danh sách hiện tại
1) CVF_INPUT_ENHANCER — ID: EXT-IN-001 — Type: Input — Purpose: Chuẩn hóa input — Phases: A,B — Requires Code: No — Status: Active
2) CVF_OUTPUT_REVIEWER — ID: EXT-OUT-001 — Type: Output — Purpose: Đánh giá output so với intent — Phases: D — Requires Code: No — Status: Active
3) CVF_PROCESS_TRACKER — ID: EXT-PR-001 — Type: Process — Purpose: Theo dõi tiến độ chi tiết — Phases: B,C — Requires Code: No — Status: Experimental
4) CVF_GOVERNANCE_ENGINE — ID: EXT-PR-002 — Type: Process — Purpose: AI Governance pipeline (policy enforcement, risk scoring, approval workflow, compliance, brand safety, immutable ledger) — Phases: B,C,D — Requires Code: Yes — Compatibility: CVF v1.6+ — Status: Active

## Notes
- Thêm/sửa extension phải qua quyết định governance.
- Extension không được vượt quyền CVF Core.
