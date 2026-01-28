# Capability Risk Model

## Purpose
Tài liệu này định nghĩa **mô hình đánh giá và kiểm soát rủi ro** cho mọi Capability
được đăng ký trong Controlled Vibe Framework (CVF).

Mục tiêu:
- Nhận diện rủi ro trước khi execution
- Chuẩn hóa mức độ kiểm soát
- Tránh phụ thuộc vào cảm tính hoặc đạo đức mơ hồ

---

## Core Philosophy

> **Capability ≠ Neutral**

Mỗi capability đều mang:
- Quyền lực
- Khả năng gây tác động
- Nguy cơ sai lệch

CVF coi rủi ro là **thuộc tính bắt buộc phải khai báo**,
không phải đánh giá tùy hứng.

---

## Risk Dimensions

Mỗi capability phải được đánh giá theo các trục sau:

### 1. Authority Risk
Khả năng capability:
- Override decision
- Tự động hành động
- Tạo hoặc sửa governance

---

### 2. Scope Expansion Risk
Khả năng:
- Mở rộng phạm vi hành động
- Chạy ngoài ngữ cảnh ban đầu
- Chain execution không kiểm soát

---

### 3. Irreversibility Risk
Hành động:
- Không thể hoàn tác
- Gây tác động lâu dài
- Thay đổi trạng thái vĩnh viễn

---

### 4. Interpretability Risk
Khả năng:
- Khó giải thích
- Không trace được logic
- Không audit được nguyên nhân

---

### 5. External Impact Risk
Tác động:
- Ra ngoài hệ CVF
- Gọi API, hệ thống ngoài
- Tác động thế giới thực

---

## Risk Levels

CVF định nghĩa 4 mức rủi ro:

### R0 — Passive
- Không side effect
- Không external impact
- Không authority

Ví dụ:
- Formatting
- Summarization

---

### R1 — Controlled
- Có side effect nhỏ
- Bị giới hạn rõ
- Không tự mở rộng

Ví dụ:
- Internal scoring
- Classification

---

### R2 — Elevated
- Có quyền hành động
- Có thể chain
- Cần approval rõ

Ví dụ:
- Auto-plan
- Multi-step orchestration

---

### R3 — Critical
- Thay đổi hệ thống
- Tác động bên ngoài
- Không dễ hoàn tác

Ví dụ:
- System modification
- External execution

---

## Risk Declaration Requirements

Mỗi Capability Manifest **BẮT BUỘC** khai báo:

- Risk level (R0–R3)
- Affected dimensions
- Required controls
- Escalation rules

Không khai báo → **Capability không hợp lệ**.

---

## Risk-Based Controls

| Risk Level | Required Controls |
|-----------|------------------|
| R0 | Logging |
| R1 | Logging + Scope Guard |
| R2 | Explicit Approval + Audit |
| R3 | Hard Gate + Human-in-the-loop |

---

## Escalation Rules

- Capability không được tự giảm risk level
- Risk tăng → cần version mới
- Runtime context có thể **nâng** risk level
- Không có cơ chế auto-downgrade

---

## Failure Modes

Nếu xảy ra:
- Risk misclassification
- Missing control
- Control bypass

→ Capability execution bị coi là **invalid**.

---

## Audit Expectations

Audit log phải ghi:
- Capability ID
- Version
- Risk level
- Control checks
- Approval outcome

Thiếu bất kỳ mục nào
→ audit thất bại.

---

## Canonical Status

Tài liệu này là **chuẩn đánh giá rủi ro duy nhất** cho capability trong CVF.

Không có “ngoại lệ”.
Không có “tùy trường hợp”.
```

