# 📋 CHANGELOG — CVF v1.4 Usage Layer

**Status: ✅ FROZEN (01/02/2026)**

---

## [v1.4.0] — 2026-02-01

### 🎯 Mục tiêu

CVF v1.4 là lớp Usage/UX đặt trên CVF v1.3.1 (CORE – Frozen). Phiên bản này không thay đổi bất kỳ rule nào của core, chỉ bổ sung khả năng sử dụng cho end-user và nhóm nhỏ.

---

### ✨ Thêm mới (Added)

#### 10_USER_LAYER/

| File | Mục đích |
|------|----------|
| `user_intent_templates.md` | Chuẩn hóa cách khai báo intent |
| `do_and_dont_for_users.md` | Hướng dẫn hành vi đúng/sai |
| `expectation_management.md` | Quản lý kỳ vọng về AI |

#### 11_PRESET_USE_CASES/

| File | Mục đích |
|------|----------|
| `analysis_mode.md` | 📊 Preset phân tích với intent templates, output format, ví dụ |
| `decision_support.md` | 🎯 Preset hỗ trợ quyết định với comparison tables |
| `content_generation.md` | ✍️ Preset tạo nội dung với content types |
| `technical_review.md` | 🔍 Preset review kỹ thuật với severity levels |

#### 12_TOOLING/

| File | Mục đích |
|------|----------|
| `cvf_cli_user_mode.md` | CLI user mode với full commands và flow diagram |
| `web_ui_concept.md` | Web UI concept với wireframes và components |
| `api_wrapper_contract.md` | REST API contract với SDK examples |

#### 13_FAILURE_UX/

| File | Mục đích |
|------|----------|
| `user_facing_error_messages.md` | Error messages thân thiện |
| `retry_vs_reject_policy.md` | Policy retry/reject |
| `explain_failure_without_trace.md` | Giải thích lỗi không lộ trace |

#### 14_LIGHT_GOVERNANCE/

| File | Mục đích |
|------|----------|
| `role_matrix.md` | Ma trận vai trò User/Operator/Maintainer |
| `escalation_flow.md` | Luồng escalation |
| `freeze_and_upgrade_policy.md` | Policy freeze và upgrade |

---

### 🔒 Không thay đổi (Unchanged)

- CVF Core v1.3.1: Scope, Input/Output Contract, Execution Rules, Audit & Trace
- Không mở quyền can thiệp execution cho user
- Không lộ trace hoặc reasoning nội bộ

---

### 📊 Thống kê

| Metric | Value |
|--------|:-----:|
| Folders | 5 |
| Files | 16 |
| Total Lines | ~1,700 |
| Score | 9.5/10 |

---

### ✅ Kết luận Audit

- Không phát hiện drift so với CVF v1.3.1
- Treeview đầy đủ, nhất quán
- Preset use cases có depth tốt
- Tooling specs đầy đủ

**Phiên bản CVF v1.4 – Usage Layer được FREEZE ngày 01/02/2026.**

---

*Powered by CVF v1.3.1 Core (Frozen)*
