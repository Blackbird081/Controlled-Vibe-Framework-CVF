# CVF v1.2 – Capability Extension

**Tagline:** *Agent-agnostic capability layer, governed by CVF.*

## Mục tiêu (Scope – đã khóa)

* Bổ sung **Capability / Skill Abstraction Layer** cho CVF.
* **Không phụ thuộc** agent, IDE, hay runtime cụ thể.
* **Không thay đổi** Decision model, Execution Spine, Governance rules của v1.1.
* Cho phép **wrap skills bên ngoài** (ví dụ antigravity-awesome-skills) mà **không phá kiểm soát**.

## Phi mục tiêu (Non-Goals – đã khóa)

* Không đưa prompt/tool-specific vào core.
* Không cho AI tự chọn skill.
* Không auto-trigger skill.
* Không mở rộng authority của agent.

---

## PHASE A — Architecture Extension (AUDITED)

### A1. Capability Abstraction Layer (CAL)

**Vai trò:** lớp trung gian giữa CVF Core và mọi skill thực thi.

**CAL chịu trách nhiệm:**

* Chuẩn hóa *Capability Contract* (không phải code).
* Ràng buộc *who / when / why* trước *how*.
* Đảm bảo mọi capability đi qua **Execution Spine**.

**Audit Check:**

* ❌ CAL không có quyền quyết định.
* ❌ CAL không biết runtime là gì.
* ✅ CAL chỉ mô tả contract & constraints.

---

## PHASE B — Skill Contract Specification (AUDITED)

### B1. CVF Skill Contract (chuẩn bắt buộc)

Mỗi capability **phải** được định nghĩa bằng contract này:

**Metadata**

* `Capability_ID`
* `Domain`
* `Risk_Level` (Low / Medium / High / Critical)
* `Description`

**Governance Constraints**

* `Allowed_Archetypes`
* `Allowed_Phases`
* `Required_Decisions`
* `Required_Status`

**Interface Spec**

* `Input_Spec` (typed, validated)
* `Output_Spec` (verifiable)

**Execution Rules**

* `Side_Effects`
* `Rollback_Possibility`
* `Idempotency`

**Audit & Trace**

* `Audit_Fields`
* `Failure_Modes`

**Audit Check:**

* ❌ Không có contract → không được gọi.
* ❌ Output không match spec → execution fail.
* ✅ Mọi skill đều trace được.

---

## PHASE C — Skill Registry (AUDITED)

### C1. CVF Skill Registry

Registry **không chứa implementation**, chỉ chứa **approved capability descriptors**.

**Cấu trúc logic:**

```
capabilities/
  ├─ devops/
  ├─ data/
  ├─ security/
  ├─ product/
```

**Mỗi entry:**

* Tham chiếu Skill Contract
* Đánh dấu Risk & Permission
* Mapping domain (không mapping tool)

**Audit Check:**

* ❌ Registry không gọi runtime.
* ❌ Registry không chứa prompt.
* ✅ Registry chỉ là “danh sách cho phép”.

---

## PHASE D — Agent Adapter Boundary (AUDITED)

### D1. Agent Adapter (khái niệm, không implement)

Adapter là **biên giới**, không phải thành phần core.

**Nhiệm vụ adapter:**

1. Nhận Skill Contract đã được CVF phê duyệt.
2. Map sang runtime cụ thể (Claude / GPT / IDE).
3. Validate output trả về theo Output Spec.
4. Gửi Audit Trace về CVF.

**Audit Check:**

* ❌ Adapter không được bypass CVF.
* ❌ Adapter không được cache authority.
* ✅ Có thể thay adapter mà không đổi CVF.

---

## PHASE E — Risk & Control Model (AUDITED)

### E1. Capability Risk Policy

Risk level ảnh hưởng trực tiếp đến:

* Required Decision count
* Allowed archetype
* Manual / Auto execution

**Ví dụ nguyên tắc:**

* `High / Critical` → luôn cần human decision artifact.
* `Medium` → cần status gate.
* `Low` → có thể fast-track (nhưng vẫn trace).

**Audit Check:**

* ❌ Không có risk → mặc định High.
* ✅ Risk không thể override bởi agent.

---

## PHASE F — External Skill Ingestion Rule (AUDITED)

### F1. Rule học từ antigravity-awesome-skills

* Skills bên ngoài **chỉ được xem là raw capability ideas**.
* Phải trải qua:

  1. Contract rewrite
  2. Governance mapping
  3. Risk classification
  4. Registry approval

**Audit Check:**

* ❌ Không import trực tiếp.
* ❌ Không trust behavior từ repo ngoài.
* ✅ CVF luôn là authority cuối.

---

## PHASE G — Backward Compatibility (AUDITED)

* CVF v1.1 projects **không bắt buộc** dùng v1.2.
* v1.2 là **opt-in extension**.
* Không skill nào ảnh hưởng spine cũ.

**Audit Check:**

* ❌ Không breaking change.
* ✅ CVF core vẫn standalone.

---

## KẾT LUẬN 

* **CVF v1.2 không làm CVF “mạnh hơn theo kiểu nguy hiểm”**
* Nó làm CVF **mở rộng nhưng an toàn**
* Skills được *thuần hóa*, không được *tự do*

> CVF vẫn là **governance-first framework**,
> capability chỉ là **tay chân**, không bao giờ là **bộ não**.
