# ⚙️ Enforcement Principles

**CVF v1.3.1 – Operator Edition**

---

## Nguyên tắc cốt lõi

### 1. CVF enforce RULES, không enforce nội dung

- CVF kiểm tra **cấu trúc** (có đủ fields không?)
- CVF kiểm tra **boundary** (có vượt scope không?)
- CVF **không** kiểm tra "kết quả có đúng không?"

> Đúng/sai về nội dung là trách nhiệm của Operator qua audit.

---

### 2. Fail sớm nếu vi phạm scope

```
Input không hợp lệ? → STOP ngay
Output thiếu required fields? → FAIL ngay
Trace không đủ? → FAIL ngay
```

Không có "cho qua lần này".

---

### 3. Không có exception trong enforcement

| Trạng thái | Kết quả |
|------------|---------|
| Tất cả rules pass | ✅ PASS |
| Bất kỳ 1 rule fail | ❌ FAIL |

Không có partial pass.

---

## Enforcement trong CI/CD

### Pre-execution checks

1. Validate `input_spec_minimal`
2. Check scope boundaries
3. Verify required fields

### Post-execution checks

1. Validate `output_contract`
2. Check trace completeness
3. Verify boundary declarations

---

## Enforcement tools

Tham khảo:
- `CVF_v1.3_IMPLEMENTATION_TOOLKIT/cli/` — CLI validation
- `CVF_v1.3_IMPLEMENTATION_TOOLKIT/ci_cd/` — CI/CD templates

---

*Kết thúc Enforcement Principles.*
