# ✅ Visual Audit Spec

**CVF v1.5 — Web Interface**

---

## Overview

Visual indicators cho output validation — user thấy PASS/FAIL rõ ràng.

---

## Audit Status Types

| Status | Icon | Color | Meaning |
|--------|:----:|:-----:|---------|
| **PASS** | ✅ | Green | Output đạt contract |
| **FAIL** | ❌ | Red | Output vi phạm contract |
| **WARNING** | ⚠️ | Yellow | Cần review kỹ |
| **PENDING** | ⏳ | Gray | Đang chờ review |

---

## Result Header

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Strategy Analysis Complete                              │
│  ─────────────────────────────────────────────────────────  │
│  Contract: PASSED | Boundary: PASSED | Quality: HIGH        │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Code Review Complete                                    │
│  ─────────────────────────────────────────────────────────  │
│  Contract: PASSED | Boundary: WARNING | Quality: MEDIUM     │
└─────────────────────────────────────────────────────────────┘
```

---

## Inline Validation

Highlight trong output:

```markdown
## Analysis

✅ Output có structure đúng format
✅ Có đầy đủ sections yêu cầu
⚠️ Assumptions không được list rõ ràng
```

---

## Checklist View

```
┌─────────────────────────────────────────┐
│ Output Validation Checklist             │
│ ─────────────────────────────────────── │
│ ✅ Has title                            │
│ ✅ Has executive summary                │
│ ✅ Has recommendations                  │
│ ✅ Uses proper headings                 │
│ ⚠️ Assumptions section is brief        │
│ ✅ Actionable next steps                │
└─────────────────────────────────────────┘
```

---

## Quality Score

```
┌─────────────────────────────────────────┐
│ Quality Score                           │
│ ─────────────────────────────────────── │
│                                         │
│  Overall: ████████░░ 8.5/10            │
│                                         │
│  Structure:    ⭐⭐⭐⭐⭐               │
│  Completeness: ⭐⭐⭐⭐☆               │
│  Clarity:      ⭐⭐⭐⭐⭐               │
│  Actionability:⭐⭐⭐⭐☆               │
│                                         │
└─────────────────────────────────────────┘
```

---

## User Actions Based on Audit

| Audit Result | Recommended Action |
|--------------|-------------------|
| All PASS | Accept |
| Any WARNING | Review carefully, then Accept/Reject |
| Any FAIL | Reject + Retry |

---

*Visual Audit Spec — CVF v1.5 Web Interface*
