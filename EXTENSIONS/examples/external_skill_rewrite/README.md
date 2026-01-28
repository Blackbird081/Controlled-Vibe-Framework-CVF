# External Skill Rewrite Examples

## Purpose
Thư mục này chứa các **ví dụ minh họa** cách chuyển hóa (rewrite) một *external skill*
sang chuẩn **Capability + Skill Contract** của **Controlled Vibe Framework (CVF)**.

Đây **KHÔNG PHẢI** là capability native của CVF.

---

## What These Files Are
- Ví dụ *refactor / rewrite* skill bên ngoài
- Minh họa cách:
  - Tách skill khỏi agent
  - Loại bỏ prompt / tool coupling
  - Đưa skill vào governance bằng Skill Contract

---

## What These Files Are NOT
- ❌ Không phải canonical capability
- ❌ Không phải skill được registry chính thức
- ❌ Không phải execution-ready artifact
- ❌ Không thuộc CVF core hay CVF extension

---

## Relationship to CVF v1.2
Các ví dụ này nhằm chứng minh rằng:
- CVF **có thể hấp thụ** skill từ framework khác
- Việc hấp thụ luôn phải:
  1. Rewrite theo Skill Contract Spec
  2. Áp governance đầy đủ
  3. Đăng ký lại qua Skill Registry (nếu muốn dùng)

Không có rewrite → **không có execution trong CVF**.

---

## Source Context
Các file trong thư mục này được lấy cảm hứng từ
external repositories (ví dụ: *antigravity-awesome-skills*),
nhưng đã được **tái cấu trúc hoàn toàn** để phù hợp với CVF.

---

## Canonical Status
- Status: Example only
- Governance: None
- Execution: Not allowed

