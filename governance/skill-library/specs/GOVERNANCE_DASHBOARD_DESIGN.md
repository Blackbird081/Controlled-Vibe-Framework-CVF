# CVF Skill Governance Dashboard - Design Specification

> **Version:** 1.0.0  
> **Status:** Design  
> **Target:** v1.3 Implementation Toolkit

---

## 1️⃣ Design Principles

### Dashboard này KHÔNG PHẢI:
- ❌ Agent playground
- ❌ Skill marketplace
- ❌ Nơi "enable / disable cho tiện"

### Dashboard này LÀ:
- ✅ Bảng điều khiển governance
- ✅ Nơi nhìn thấy **quyền – rủi ro – trạng thái tuân thủ**

> 👉 **Không có hành động nào trên UI mà không truy ngược được về decision record**

---

## 2️⃣ Treeview Logic (Canonical)

Đây là cây logic gốc (backend truth), UI chỉ render lại.

```
CVF
├── Skill Library
│   ├── Skill ID: SK-001
│   │   ├── Identity
│   │   │   ├── Name
│   │   │   ├── Version
│   │   │   └── Owner
│   │   │
│   │   ├── Risk Profile
│   │   │   ├── Risk Level: R2
│   │   │   ├── Failure Modes
│   │   │   └── Blast Radius
│   │   │
│   │   ├── Authority Mapping
│   │   │   ├── Agent Roles
│   │   │   │   ├── Architect ✅
│   │   │   │   └── Builder ✅
│   │   │   ├── CVF Phases
│   │   │   │   └── Build ✅
│   │   │   ├── Decision Scope
│   │   │   │   └── Tactical
│   │   │   └── Autonomy
│   │   │       └── Conditional
│   │   │
│   │   ├── UAT Status
│   │   │   ├── Last UAT
│   │   │   │   ├── Date
│   │   │   │   ├── Result: PASS / FAIL
│   │   │   │   └── Tested By
│   │   │   ├── Violations
│   │   │   └── Drift Flags
│   │   │
│   │   ├── Lifecycle
│   │   │   ├── State: Active / Restricted / Deprecated
│   │   │   ├── Review Cycle
│   │   │   └── Next Review Date
│   │   │
│   │   └── Records
│   │       ├── Skill Mapping Record
│   │       ├── UAT Reports
│   │       └── Incident Logs
│   │
│   └── Skill ID: SK-002
│       └── ...
│
└── Governance Views
    ├── By Risk Level
    ├── By Agent Role
    ├── By CVF Phase
    ├── By UAT Status
    └── By Lifecycle State
```

> 📌 **Quan trọng:** Tree này không phụ thuộc agent framework. Agent chỉ là consumer bị ràng buộc bởi tree.

---

## 3️⃣ Dashboard Views

### 🔹 3.1 Skill-Centric View (Default)

> "Một skill được phép làm gì – ở đâu – với ai – hiện có an toàn không?"

| Column | Display |
|--------|---------|
| Skill ID/Name | SK-001: Code Review |
| Risk Level | 🟡 R2 |
| Allowed Roles | Builder, Reviewer |
| Allowed Phases | Build, Review |
| Last UAT | ✅ PASS (2026-02-07) |
| Drift Warning | ⚠️ / ✅ |

---

### 🔹 3.2 Risk-Centric View

> "Hệ CVF hiện đang mang bao nhiêu rủi ro?"

```
R0 ── 12 skills ── ✅ all pass
R1 ── 8 skills  ── ⚠️ 1 conditional
R2 ── 4 skills  ── ❌ 1 failed
R3 ── 1 skill   ── ⚠️ review pending
R4 ── 0 skills  ── (blocked by design)
```

> 👉 R2/R3/R4 luôn nổi bật, không được chìm.

---

### 🔹 3.3 Agent Role View

> "Agent này được phép dùng những skill nào?"

```
Orchestrator
 └── (none - by design)

Architect
 ├── SK-003
 └── SK-004

Builder
 ├── SK-001
 ├── SK-002
 └── SK-006

Reviewer
 ├── SK-001
 └── SK-009
```

> ⚠️ Nếu 1 skill xuất hiện sai role → **governance bug**

---

### 🔹 3.4 CVF Phase View

> "Ở phase này, AI đang được phép làm tới đâu?"

| Phase | Allowed Risk Levels | Skills |
|-------|---------------------|--------|
| Discovery | R0, R1 only | 5 |
| Design | R0, R1, R2 (restricted) | 8 |
| Build | R0, R1, R2 | 12 |
| Review | R0, R1 only | 4 |

---

### 🔹 3.5 UAT & Compliance View

> "Skill nào đang được phép tồn tại nhưng không còn an toàn?"

| Status | Count | Action Required |
|--------|-------|-----------------|
| ❌ FAIL UAT | 1 | Immediate review |
| ⚠️ Conditional | 2 | Human oversight |
| 🔔 Drift detected | 1 | Investigate |
| 📅 Review overdue | 3 | Schedule review |

> 👉 Đây là view dành cho **governance owner**, không phải dev.

---

## 4️⃣ Skill States (UI)

| State | Icon | Meaning |
|-------|------|---------|
| 🟢 Active | ✅ | UAT pass, đúng authority |
| 🟡 Conditional | ⚠️ | Có ràng buộc / cảnh báo |
| 🔴 Restricted | 🚫 | Bị khóa execution |
| ⚫ Deprecated | 🗑️ | Chuẩn bị loại bỏ |

> ⚠️ **Không có "Enable / Disable tuỳ hứng"**

---

## 5️⃣ Dashboard Restrictions

Dashboard KHÔNG được phép:
- ❌ Edit Risk Level trực tiếp
- ❌ Mở quyền trực tiếp
- ❌ Bypass UAT
- ❌ Cho agent tự đăng ký skill

> 👉 **Dashboard chỉ phản ánh quyết định, không tạo quyết định.**

---

## 6️⃣ Data Flow

```
Skill Mapping Record
        ↓
Agent AI UAT (test compliance)
        ↓
UAT Result (PASS/FAIL/CONDITIONAL)
        ↓
Dashboard State (reflects reality)
```

> 👉 Dashboard không được phép hiển thị thứ gì không truy ngược được về record.

---

## 7️⃣ Implementation Reference

| Component | Location |
|-----------|----------|
| Backend API | `v1.3/dashboard/api/` |
| Frontend | `v1.3/dashboard/` |
| Data Model | `SKILL_MAPPING_RECORD.md` |
| Validation | `tools/skill-validation/` |

---

## 8️⃣ Core Statement

> **Agent làm việc trong hệ thống.**  
> **Dashboard cho con người thấy hệ thống đó có còn đáng tin hay không.**
