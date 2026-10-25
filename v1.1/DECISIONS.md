# DECISIONS — CVF v1.1

> **Version:** 1.1 | **Status:** STABLE  
> **Purpose:** Ghi lại các quyết định thiết kế quan trọng của v1.1

---

## Decision Log

### DC-001: Giữ v1.0 làm Baseline bất biến

| Field | Value |
|-------|-------|
| **ID** | DC-001 |
| **Date** | 2026-01-15 |
| **Decision** | v1.0 được freeze và luôn hợp lệ. v1.1 là extension, không thay thế. |
| **Rationale** | Đảm bảo backward compatibility. User có thể chỉ dùng v1.0 mà không bị ép upgrade. Giảm risk khi adopt v1.1 từng phần. |
| **Impact** | Mọi module v1.1 phải opt-in. Không breaking change với v1.0 workflow. |
| **Status** | ✅ Approved |

---

### DC-002: Module v1.1 là Opt-in

| Field | Value |
|-------|-------|
| **ID** | DC-002 |
| **Date** | 2026-01-15 |
| **Decision** | Mỗi module v1.1 (INPUT_SPEC, Archetype, Preset...) có thể bật độc lập. |
| **Rationale** | Cho phép adoption dần dần. Team có thể bật từng module khi cần, không bắt buộc dùng full stack. |
| **Impact** | Cần document rõ dependencies giữa modules. Một số combo không hợp lệ. |
| **Status** | ✅ Approved |

---

### DC-003: Consolidate các biến thể v1.1 thành bản chính thức

| Field | Value |
|-------|-------|
| **ID** | DC-003 |
| **Date** | 2026-01-20 |
| **Decision** | Merge EGL, EIL, EL thành một bản v1.1 duy nhất. |
| **Rationale** | Nhiều biến thể gây confusion. User không biết dùng bản nào. Cần single source of truth. |
| **Impact** | Các folder EGL, EIL, EL không còn được maintain. Chỉ v1.1 được support. |
| **Status** | ✅ Approved |
| **Source** | EGL (Governance) + EIL (Interface) + EL (Execution) |

---

### DC-004: 6 Agent Archetypes là đủ

| Field | Value |
|-------|-------|
| **ID** | DC-004 |
| **Date** | 2026-01-18 |
| **Decision** | Định nghĩa 6 archetypes: Builder, Reviewer, Planner, Debugger, Researcher, Refactorer. |
| **Rationale** | Đủ cover các use case phổ biến. Thêm nữa sẽ gây overlap và confusion. Có thể extend qua EXTENSION_REGISTER nếu cần. |
| **Impact** | Mỗi archetype có preset riêng. Không tạo archetype mới ngoài 6 này. |
| **Status** | ✅ Approved |

---

### DC-005: Fast Track cho task nhỏ

| Field | Value |
|-------|-------|
| **ID** | DC-005 |
| **Date** | 2026-01-18 |
| **Decision** | Cho phép rút gọn workflow nếu task < 2h, isolated, low risk. |
| **Rationale** | Full flow quá nặng cho task nhỏ. Cần cân bằng control vs velocity. |
| **Impact** | Vẫn bắt buộc trace. Chỉ skip formal review, không skip audit trail. |
| **Status** | ✅ Approved |
| **Conditions** | Duration < 2h, Scope isolated, Risk low, No approval chain needed |

---

### DC-006: Trace là bắt buộc, không ngoại lệ

| Field | Value |
|-------|-------|
| **ID** | DC-006 |
| **Date** | 2026-01-19 |
| **Decision** | Mọi Action Unit phải có trace, kể cả Fast Track. |
| **Rationale** | Trace là cơ sở để audit, debug, và learn. Không có trace = không có accountability. |
| **Impact** | Tăng overhead nhỏ nhưng đảm bảo governance. Template AU_trace.sample.md giúp giảm effort. |
| **Status** | ✅ Approved |

---

### DC-007: MIT License

| Field | Value |
|-------|-------|
| **ID** | DC-007 |
| **Date** | 2026-01-20 |
| **Decision** | Phát hành CVF dưới MIT License. |
| **Rationale** | Khuyến khích adoption rộng rãi. Cho phép commercial use. Community-friendly. |
| **Impact** | Không restrictions cho derivative works. Attribution required. |
| **Status** | ✅ Approved |

---

## Decision Template

```markdown
### DC-XXX: [Tên quyết định]
| Field | Value |
|-------|-------|
| **ID** | DC-XXX |
| **Date** | YYYY-MM-DD |
| **Decision** | [Mô tả quyết định] |
| **Rationale** | [Lý do đưa ra quyết định này] |
| **Impact** | [Ảnh hưởng đến framework/users] |
| **Status** | 🟡 Proposed / ✅ Approved / ❌ Rejected / 🔄 Superseded |
```

---

## Xem thêm

- [CHANGELOG.md](CHANGELOG.md) — Lịch sử thay đổi
- [FRAMEWORK_FREEZE.md](FRAMEWORK_FREEZE.md) — Điều kiện freeze
- [governance/EXTENSION_REGISTER.md](governance/EXTENSION_REGISTER.md) — Đăng ký mở rộng
