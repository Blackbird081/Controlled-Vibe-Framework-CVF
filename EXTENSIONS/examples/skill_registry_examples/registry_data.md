# Skill Registry Data — Example

## Purpose
Tài liệu này cung cấp **ví dụ dữ liệu registry**
phù hợp với mô hình định nghĩa trong `SKILL_REGISTRY_MODEL.md`.

File này **không phải code chạy**, mà là:
- dữ liệu mô tả
- có thể map sang JSON / YAML / DB schema

---

## Registry Metadata

- Registry Version: 1.2
- CVF Version: 1.2
- Last Updated: 2026-01-28

---

## Registered Capabilities

### Capability: DATA_VISUALIZATION_D3

- Capability ID: `DATA_VISUALIZATION_D3`
- Version: `1.0`
- Lifecycle State: `ACTIVE`
- Risk Level: `R1`
- Required Controls:
  - Input validation
  - Output size limit
- Adapter Reference: `adapter/d3_viz_adapter@1.0`
- Contract Reference: `contract/d3_viz_contract@1.0`

---

### Capability: CHANGESET_PREPARATION

- Capability ID: `CHANGESET_PREPARATION`
- Version: `1.0`
- Lifecycle State: `ACTIVE`
- Risk Level: `R1`
- Required Controls:
  - Deterministic output
  - Full audit logging
- Adapter Reference: `adapter/changeset_adapter@1.0`
- Contract Reference: `contract/changeset_contract@1.0`

---

### Capability: REPOSITORY_PUSH_REQUEST

- Capability ID: `REPOSITORY_PUSH_REQUEST`
- Version: `1.0`
- Lifecycle State: `ACTIVE`
- Risk Level: `R3`
- Required Controls:
  - Human-in-the-loop approval
  - Target confirmation
  - Dry-run verification
- Adapter Reference: `adapter/push_request_adapter@1.0`
- Contract Reference: `contract/push_request_contract@1.0`

---

## Deprecated Capabilities

### Capability: LEGACY_D3_RENDER

- Capability ID: `LEGACY_D3_RENDER`
- Version: `0.9`
- Lifecycle State: `DEPRECATED`
- Risk Level: `R1`
- Deprecation Note:
  Replaced by `DATA_VISUALIZATION_D3@1.0`
- Adapter Reference: `adapter/legacy_d3_adapter@0.9`
- Contract Reference: `contract/legacy_d3_contract@0.9`

---

## Retired Capabilities

### Capability: AUTO_GIT_PUSH

- Capability ID: `AUTO_GIT_PUSH`
- Version: `0.1`
- Lifecycle State: `RETIRED`
- Risk Level: `R3`
- Retirement Reason:
  Violates CVF external execution rules
- Adapter Reference: `none`
- Contract Reference: `none`

---

## Resolution Examples

### Example 1 — Valid Resolution

Request:
- Capability: `DATA_VISUALIZATION_D3`
- Version: `1.0`

Result:
- Resolution: SUCCESS
- Adapter: `d3_viz_adapter@1.0`

---

### Example 2 — Deprecated Capability

Request:
- Capability: `LEGACY_D3_RENDER`
- Version: `0.9`

Result:
- Resolution: SUCCESS
- Warning: Capability is deprecated

---

### Example 3 — Invalid Resolution

Request:
- Capability: `AUTO_GIT_PUSH`
- Version: `0.1`

Result:
- Resolution: FAILED
- Reason: Capability is retired

---

## Canonical Status

Tài liệu này là **ví dụ chuẩn** cho dữ liệu registry CVF v1.2.

Không dùng làm policy.
Chỉ dùng làm reference và test.
```


