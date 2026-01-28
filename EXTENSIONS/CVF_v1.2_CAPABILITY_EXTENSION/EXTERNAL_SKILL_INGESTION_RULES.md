# External Skill Ingestion Rules

## Purpose
Tài liệu này định nghĩa **quy tắc bắt buộc** khi đưa bất kỳ external skill nào
vào Controlled Vibe Framework (CVF).

Mục tiêu:
- Ngăn skill không rõ nguồn gốc xâm nhập core
- Tách biệt rõ capability và implementation
- Đảm bảo governance, audit và kiểm soát rủi ro

---

## Core Principle

> **External skills are untrusted by default.**

Không có ngoại lệ.

---

## Definition

**External Skill** là bất kỳ:
- Prompt
- Agent
- Tool
- Workflow
- Plugin
- Repo bên ngoài

không được sinh ra trực tiếp trong CVF Core.

---

## Mandatory Ingestion Pipeline

Mọi external skill **PHẢI** đi qua pipeline sau:

1. Isolation
2. Capability Extraction
3. Risk Assessment
4. Contract Declaration
5. Adapter Wrapping
6. Registry Registration

Bỏ qua bất kỳ bước nào
→ ingestion **không hợp lệ**.

---

## Phase 1 — Isolation

External skill:
- Không được chạy trực tiếp
- Không được gọi core primitive
- Không được truy cập registry

Mục tiêu:
- Quan sát
- Phân tích
- Không cho execution

---

## Phase 2 — Capability Extraction

- Tách skill thành:
  - Intent
  - Inputs
  - Outputs
  - Side effects
- Mapping sang capability độc lập

Không được:
- Import logic nguyên khối
- Copy prompt trực tiếp

---

## Phase 3 — Risk Assessment

- Đánh giá theo `CAPABILITY_RISK_MODEL.md`
- Khai báo:
  - Risk level
  - Risk dimensions
  - Required controls

Không có risk declaration
→ skill bị từ chối.

---

## Phase 4 — Contract Declaration

External skill phải được mô tả bằng:
- Capability Manifest
- Skill Contract versioned

Contract:
- Độc lập implementation
- Không chứa prompt gốc
- Không hardcode agent behavior

---

## Phase 5 — Adapter Wrapping

- External skill chỉ được gọi qua adapter
- Adapter:
  - Enforce contract
  - Enforce controls
  - Strip unauthorized behavior

Không có adapter
→ không execution.

---

## Phase 6 — Registry Registration

- Chỉ capability được đăng ký
- External skill implementation **không bao giờ** vào registry
- Registry chỉ biết:
  - Capability ID
  - Version
  - Risk

---

## Forbidden Patterns

BỊ CẤM tuyệt đối:

- Direct execution
- Hidden side effects
- Prompt injection
- Silent behavior change
- Agent-coupled logic

---

## Versioning Rules

- External skill update ≠ capability update
- Thay đổi behavior → version mới
- Không overwrite registry entry

---

## Audit Requirements

Mỗi ingestion phải lưu:
- Source reference
- Extraction notes
- Risk decision
- Contract version
- Adapter version

Thiếu log
→ ingestion không hợp lệ.

---

## Failure Handling

Nếu external skill:
- Vi phạm contract
- Vượt risk
- Bypass control

→ Adapter phải:
- Block execution
- Log đầy đủ
- Escalate theo policy

---

## Canonical Status

Tài liệu này là **chuẩn duy nhất** cho việc ingest external skill vào CVF.

Không shortcut.
Không exception.
```

