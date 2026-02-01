# 🌐 Web Interface

**CVF v1.5 — User Experience Platform**

---

## Mục tiêu

Cung cấp giao diện web đơn giản để user sử dụng CVF mà không cần CLI hoặc kiến thức kỹ thuật.

---

## Design Principles

1. **Zero Learning Curve** — User dùng được ngay
2. **Form-based Input** — Không cần viết prompt
3. **Guided Flow** — Hướng dẫn từng bước
4. **Clear Output** — Kết quả dễ hiểu

---

## Core Screens

```
┌─────────────────────────────────────────┐
│  1. Home / Template Selection           │
│     → Choose domain & template          │
├─────────────────────────────────────────┤
│  2. Input Form                          │
│     → Fill form fields                  │
├─────────────────────────────────────────┤
│  3. Processing                          │
│     → Wait for result                   │
├─────────────────────────────────────────┤
│  4. Result Display                      │
│     → View & Accept/Reject              │
├─────────────────────────────────────────┤
│  5. History / Analytics                 │
│     → Past executions                   │
└─────────────────────────────────────────┘
```

---

## Directory Structure

```
20_WEB_INTERFACE/
├── README.md                 ← (file này)
│
├── DESIGN/
│   ├── ui_principles.md      ← Design philosophy
│   ├── wireframes.md         ← UI sketches
│   ├── component_library.md  ← Reusable components
│   └── user_flows.md         ← Navigation flows
│
├── SPECS/
│   ├── form_builder_spec.md  ← Input form specs
│   ├── result_display_spec.md← Output display specs
│   ├── visual_audit_spec.md  ← PASS/FAIL visualization
│   └── export_spec.md        ← PDF/DOCX export
│
└── IMPLEMENTATION/
    ├── tech_stack.md         ← Technology choices
    ├── api_integration.md    ← Connect to CVF SDK
    └── deployment.md         ← Hosting options
```

---

## User Journey

```
User opens Web UI
       ↓
Select Template (Business/Tech/Content/Research)
       ↓
Fill Form (replace placeholders)
       ↓
Submit
       ↓
Wait (loading indicator)
       ↓
View Result
       ↓
Accept / Reject
       ↓
Export (optional)
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| Template Picker | Browse & search templates |
| Smart Form | Dynamic form từ template |
| Live Preview | Preview intent trước submit |
| Result Viewer | Markdown rendered output |
| One-click Export | PDF, DOCX, Markdown |
| History | View past executions |

---

## Non-Features

Web Interface **KHÔNG** có:
- ❌ Trace/audit view (Operator only)
- ❌ Custom execution rules
- ❌ Direct prompt input
- ❌ AI configuration

---

*Web Interface — CVF v1.5 UX Platform*
