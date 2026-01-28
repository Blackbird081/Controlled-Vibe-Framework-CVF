
## 1. Purpose

Tài liệu này định nghĩa **chuẩn bắt buộc** để mô tả mọi *capability/skill* khi sử dụng trong CVF v1.2.
Không có Skill Contract → **không có execution**.

## 2. Position in CVF

* Skill Contract **không phải code**
* Skill Contract **không phải prompt**
* Skill Contract là **governance artifact**
* Skill Contract **luôn đi sau Decision** và **trước Execution**

## 3. Contract Structure (BẮT BUỘC)

Mọi Skill Contract **PHẢI** có đầy đủ các mục sau, theo đúng thứ tự.

---

### 3.1 Capability Metadata

**Mục đích:** định danh & phân loại

* `CAPABILITY_ID` (unique, immutable)
* `DOMAIN` (devops / data / security / product / etc.)
* `DESCRIPTION` (1–2 đoạn, không marketing)
* `RISK_LEVEL` (Low | Medium | High | Critical)

---

### 3.2 Governance Constraints

**Mục đích:** khóa quyền sử dụng

* `ALLOWED_ARCHETYPES`
* `ALLOWED_PHASES`
* `REQUIRED_DECISIONS`
* `REQUIRED_STATUS`

**Rule cứng:**

* Thiếu bất kỳ constraint nào → mặc định **DENY**

---

### 3.3 Input Specification

**Mục đích:** chặn hallucination & scope drift

* `INPUT_FIELDS`

  * name
  * type
  * validation rule
  * optional / required

**Rule cứng:**

* Không có Input Spec → không execution
* Input ngoài spec → reject

---

### 3.4 Output Specification

**Mục đích:** kiểm soát kết quả & audit

* `OUTPUT_FIELDS`

  * name
  * type
  * success criteria
  * failure signals

**Rule cứng:**

* Output không match spec → execution failed
* Không có output → không được coi là thành công

---

### 3.5 Execution Properties

**Mục đích:** hiểu rủi ro hành vi

* `SIDE_EFFECTS`
* `ROLLBACK_POSSIBILITY`
* `IDEMPOTENCY`
* `EXPECTED_DURATION`

---

### 3.6 Failure & Risk Notes

**Mục đích:** buộc người dùng *ý thức rủi ro*

* `KNOWN_FAILURE_MODES`
* `WORST_CASE_IMPACT`
* `HUMAN_INTERVENTION_REQUIRED` (Yes/No)

---

### 3.7 Audit & Trace Requirements

**Mục đích:** truy vết & trách nhiệm

* `AUDIT_FIELDS`

  * timestamp
  * actor
  * inputs
  * outputs
  * affected_resources
* `TRACE_LEVEL` (Basic | Full)

---
### 3.8 Execution Type
EXECUTION_TYPE:
- EXECUTABLE
- NON_EXECUTABLE

Rules

NON_EXECUTABLE:

Không side effects

Không mutation

Không rollback

Registry KHÔNG trigger execution

Dùng cho:

Analysis

Review

Validation

Assessment

📌 NON_EXECUTABLE vẫn PHẢI:

Có Input / Output spec

Có Audit

### 3.9 Dependencies

DEPENDENCIES:
- CAPABILITY_ID
Rules

Dependency là logic dependency, không execution

Không auto-trigger

Không chain

Chỉ dùng cho:

Audit

Flow reasoning

Design clarity

📌 Dependency không được override governance


## 4. Hard Prohibitions (KHÔNG ĐƯỢC PHÉP)

Skill Contract **KHÔNG ĐƯỢC**:

* Chứa prompt
* Chứa tool / API name
* Chứa logic agent-specific
* Mở rộng scope ngoài contract
* Tự trigger skill khác

---

## 5. Authority Rules

* CVF Core **luôn là authority cuối**
* Agent Adapter **không được sửa contract**
* Skill implementation **không được override governance**

---

## 6. Validation Checklist (AUDIT GATE)

Một Skill Contract chỉ được coi là **VALID** khi:

* [ ] Có đủ 7 section bắt buộc
* [ ] Risk level được khai báo
* [ ] Có ít nhất 1 Required Decision (trừ Low risk)
* [ ] Input & Output spec rõ ràng
* [ ] Audit fields đầy đủ
* [ ] Không chứa agent/tool reference

---

## 7. Canonical Status

* Tài liệu này là **chuẩn chính thức** của CVF v1.2
* Mọi capability **PHẢI tuân theo**
* Vi phạm chuẩn = **outside CVF**

---

### Kết luận ngắn

> Skill Contract không giúp AI “làm được nhiều hơn”
> mà giúp **con người kiểm soát được điều AI đang làm**

