# CVF Governance Toolkit

> **Bộ tài liệu quản trị chuẩn mực cho AI Agent — đọc trước khi thực thi.**

**Version:** 1.0  
**Effective:** 12/02/2026  
**Status:** Active

---

## Mục đích

Toolkit này chứa toàn bộ rules, policies, và protocols mà bất kỳ AI Agent nào cũng **PHẢI đọc và tuân thủ** trước khi thực thi trong hệ sinh thái CVF.

> ⚠️ **NON-NEGOTIABLE:** Agent không đọc toolkit = Agent không được phép hoạt động.

---

## Mối quan hệ với CVF Core

```
CVF Cores (v1.0, v1.1)        ← Framework gốc (FROZEN)
  └── governance/
        ├── skill-library/     ← 124+ skills (execute tools)
        └── toolkit/           ← 👈 BẠN ĐANG Ở ĐÂY (governance rules)
  └── EXTENSIONS/              ← v1.5 UX + v1.6 Agent Platform
```

**Toolkit KHÔNG thay thế Core** — nó bổ sung layer governance execution cho Core.

---

## Cấu trúc (Đọc theo thứ tự)

| # | Folder | Mục đích | Bắt buộc? |
|:-:|--------|----------|:---------:|
| 01 | `01_BOOTSTRAP/` | Khởi tạo session: system prompt + project config | ✅ |
| 02 | `02_POLICY/` | Chính sách master, risk matrix, version governance | ✅ |
| 03 | `03_CONTROL/` | Agent registry, handshake, phase/authority matrix | ✅ |
| 04 | `04_TESTING/` | UAT, Self-UAT, test scripts (YAML/JSON) | ✅ |
| 05 | `05_OPERATION/` | Governance loop, audit, emergency, incident | ✅ |
| 06 | `06_EXAMPLES/` | Case studies thực tế | 📖 Recommended |
| 07 | `07_QUICKSTART/` | Bản tóm tắt workflow cho SME teams | 📖 Recommended |

---

## Dùng cho ai?

| Đối tượng | Đọc gì? |
|-----------|---------|
| **AI Agent (tự động)** | Toàn bộ 01→05 trước mỗi session |
| **Developer/Operator** | 01 + 03 + 06 |
| **Manager/Governance Board** | 02 + 05 |
| **SME/Team nhỏ** | 07 (QuickStart) + 06 (Examples) |
| **Auditor** | 02 + 04 + 05 |

Coverage policy reference: `04_TESTING/CVF_TEST_COVERAGE_POLICY.md`
Workspace bootstrap record template: `05_OPERATION/CVF_PROJECT_BOOTSTRAP_LOG_TEMPLATE.md`

---

## Agent Loading Protocol

Trước khi AI Agent thực thi bất kỳ task nào, hãy inject prompt sau:

```
Load and apply CVF Governance Toolkit from governance/toolkit/.
Read folders 01 through 05 in order.
Declare your Phase, Role, and Risk Level before acting.
If any rule is ambiguous, STOP and ask for clarification.
```

---

## Nguồn gốc

Toolkit này được tổng hợp và tối ưu hóa từ:
- `CVF_INTERNAL_LITE/` — Bản governance nhẹ cho SME (15 files)
- `HOW TO USE CVF FOR/` — Reference library đầy đủ (25 files)

Đã được merge, loại bỏ trùng lặp, và tổ chức lại theo thứ tự thực thi.
