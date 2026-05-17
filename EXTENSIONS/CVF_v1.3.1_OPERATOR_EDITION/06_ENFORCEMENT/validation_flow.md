# 🔄 Validation Flow

**CVF v1.3.1 – Operator Edition**

---

## Mục tiêu

Cho phép validate nhanh CVF flow, có thể tích hợp vào CLI hoặc CI/CD.

---

## Validation Flow chuẩn

```
┌─────────────────┐
│  1. Load Input  │
└────────┬────────┘
         ▼
┌─────────────────────────┐
│  2. Validate input_spec │
│     ❌ FAIL → STOP      │
└────────┬────────────────┘
         ▼
┌─────────────────────────┐
│  3. Execute AI          │
│     (No intervention)   │
└────────┬────────────────┘
         ▼
┌──────────────────────────────┐
│  4. Validate output_contract │
│     ❌ FAIL → Log F3         │
└────────┬─────────────────────┘
         ▼
┌─────────────────────────┐
│  5. Validate trace      │
│     ❌ FAIL → Log F2    │
└────────┬────────────────┘
         ▼
┌─────────────────────────┐
│  6. Emit audit log      │
│     PASS/FAIL + type    │
└─────────────────────────┘
```

---

## Validation checkpoints

### Step 2: Input Validation

| Check | Rule |
|-------|------|
| Objective exists | Required |
| Output contract defined | Required |
| No ambiguous requirements | Required |
| No "how to" instructions | Required |

---

### Step 4: Output Validation

| Check | Rule |
|-------|------|
| Final Result exists | Required |
| Assumption Summary exists | Required |
| Constraint Compliance exists | Required |
| No intervention requests | Required |

---

### Step 5: Trace Validation

| Check | Rule |
|-------|------|
| Decision Summary exists | Required |
| Execution Confirmation exists | Required |
| Boundary Declaration exists | Required |
| No over-explanation | Required |

---

## CLI Usage Example

```bash
# Validate input before execution
cvf-validate input task_input.yaml

# Validate output after execution
cvf-validate output task_output.yaml

# Full flow validation
cvf-validate flow task_input.yaml task_output.yaml
```

---

## CI/CD Integration

```yaml
# .github/workflows/cvf-validate.yml
jobs:
  validate:
    steps:
      - name: Validate CVF Flow
        run: cvf-validate flow $INPUT $OUTPUT
```

---

*Kết thúc Validation Flow.*
