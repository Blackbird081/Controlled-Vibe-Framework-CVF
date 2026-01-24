# FAST_TRACK — CVF v1.1 FINAL
Version: 1.1 | Status: STABLE | Layer: Governance | Compatible: v1.0 baseline (additive)

## Mục tiêu
Luồng rút gọn cho nhiệm vụ nhỏ nhưng vẫn giữ Execution Spine + trace + review tối thiểu.

## Điều kiện áp dụng
- Ước lượng < 2h hoặc 1 AU đơn
- Không đổi kiến trúc/decision/intent
- Rủi ro thấp, không chạm dữ liệu nhạy cảm

## Luồng
1) Mini INPUT_SPEC (1 trang): objective, scope, constraint, output form, owner
2) Command: CVF:EXECUTE-FT; Archetype: Execution (Preset: Execution FT) hoặc Planning nhẹ nếu cần bước chuẩn bị
3) Định nghĩa AU đơn: input/output/owner/trace + stop condition
4) Thực thi cô lập (branch/folder tạm) giữ trace
5) Review nhanh: 1 reviewer ≠ executor, check OUTPUT_SPEC rút gọn
6) Merge/Apply + log trace và close AU

## Mẫu mini INPUT/OUTPUT rút gọn
- INPUT: Objective, scope in/out, constraint, expected output form, owner, date
- OUTPUT: Format, acceptance 3-5 mục, reviewer role, trace location

## Giới hạn
- Không dùng cho quyết định chiến lược hay scope thay đổi
- Không bypass review; nếu thiếu reviewer → không dùng Fast Track
- Nếu vượt scope/time → chuyển luồng đầy đủ
