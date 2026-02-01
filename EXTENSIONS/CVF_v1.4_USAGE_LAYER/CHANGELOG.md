CVF v1.4 – Usage Layer

Status: Frozen after audit

Tổng quan

CVF v1.4 là lớp Usage/UX đặt trên CVF v1.3.1 (CORE – Frozen). Phiên bản này không thay đổi bất kỳ rule nào của core, chỉ bổ sung khả năng sử dụng cho end-user và nhóm nhỏ.

Thêm mới (Added)
User Layer

10_USER_LAYER/user_intent_templates.md: Chuẩn hóa cách người dùng khai báo intent.

10_USER_LAYER/do_and_dont_for_users.md: Hướng dẫn hành vi đúng/sai khi sử dụng CVF.

10_USER_LAYER/expectation_management.md: Quản lý kỳ vọng, chống hiểu lầm về AI.

Preset Use Cases

11_PRESET_USE_CASES/analysis_mode.md

11_PRESET_USE_CASES/decision_support.md

11_PRESET_USE_CASES/content_generation.md

11_PRESET_USE_CASES/technical_review.md

Tooling (Wrapper Layer)

12_TOOLING/cvf_cli_user_mode.md: CLI cho user, intent + preset.

12_TOOLING/web_ui_concept.md: Khái niệm UI tối giản.

12_TOOLING/api_wrapper_contract.md: Contract wrapper API.

Failure UX

13_FAILURE_UX/user_facing_error_messages.md

13_FAILURE_UX/retry_vs_reject_policy.md

13_FAILURE_UX/explain_failure_without_trace.md

Light Governance

14_LIGHT_GOVERNANCE/role_matrix.md

14_LIGHT_GOVERNANCE/escalation_flow.md

14_LIGHT_GOVERNANCE/freeze_and_upgrade_policy.md

Không thay đổi (Unchanged)

CVF Core v1.3.1: Scope, Input/Output Contract, Execution Rules, Audit & Trace.

Không mở quyền can thiệp execution cho user.

Nguyên tắc bất biến

Usage Layer không override core rules.

Không lộ trace hoặc reasoning nội bộ.

Người dùng chỉ chịu trách nhiệm về intent, không về execution.

Kết luận audit

Không phát hiện drift so với CVF v1.3.1.

Treeview đầy đủ, nhất quán.

Phiên bản CVF v1.4 – Usage Layer được freeze.