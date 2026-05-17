# 📝 Form Builder Spec

**CVF v1.5 — Web Interface**

---

## Overview

Form Builder tự động generate form từ template specification.

---

## Form Schema

Mỗi template define form fields như sau:

```json
{
  "template_id": "business_strategy_analysis",
  "fields": [
    {
      "id": "topic",
      "type": "text",
      "label": "Chủ đề chiến lược",
      "placeholder": "Nhập chủ đề...",
      "required": true,
      "maxLength": 200
    },
    {
      "id": "context",
      "type": "textarea",
      "label": "Bối cảnh",
      "placeholder": "Mô tả ngành, quy mô, thị trường...",
      "required": true,
      "rows": 5
    },
    {
      "id": "options",
      "type": "textarea",
      "label": "Các phương án",
      "placeholder": "Liệt kê options (nếu có)...",
      "required": false,
      "section": "advanced"
    },
    {
      "id": "priority",
      "type": "select",
      "label": "Ưu tiên",
      "options": ["Growth", "Stability", "Cost"],
      "default": "Growth",
      "required": false,
      "section": "advanced"
    }
  ]
}
```

---

## Field Types

| Type | Component | Use Case |
|------|-----------|----------|
| `text` | TextField | Short input |
| `textarea` | TextArea | Long text |
| `select` | Dropdown | Single choice |
| `multiselect` | Chips | Multiple choice |
| `number` | NumberInput | Numeric values |
| `file` | FileUpload | Attachments |

---

## Validation Rules

```json
{
  "id": "topic",
  "validation": {
    "required": true,
    "minLength": 10,
    "maxLength": 200,
    "pattern": null,
    "errorMessage": "Chủ đề phải từ 10-200 ký tự"
  }
}
```

---

## Section Grouping

```
┌─────────────────────────────────────┐
│ Required Fields (visible by default)│
│ ─────────────────────────────────── │
│ [Chủ đề]                            │
│ [Bối cảnh]                          │
└─────────────────────────────────────┘

▼ More Options (collapsed by default)
┌─────────────────────────────────────┐
│ [Các phương án]                     │
│ [Ràng buộc]                         │
│ [Ưu tiên]                           │
└─────────────────────────────────────┘
```

---

## Intent Generation

Form values → Intent pattern:

```javascript
function generateIntent(formValues, template) {
  return template.intentPattern
    .replace('[topic]', formValues.topic)
    .replace('[context]', formValues.context)
    .replace('[options]', formValues.options || 'N/A');
}
```

---

## Live Preview

Real-time preview của generated intent:

```
┌─────────────────────────────────────┐
│ Preview                             │
│ ─────────────────────────────────── │
│ INTENT:                             │
│ Tôi muốn phân tích chiến lược       │
│ mở rộng thị trường miền Trung.      │
│                                     │
│ CONTEXT:                            │
│ - Ngành: Bán lẻ thực phẩm          │
│ - Quy mô: 50 cửa hàng              │
│ ...                                 │
└─────────────────────────────────────┘
```

---

## Auto-save

- Draft saved to localStorage every 30s
- Restored on page reload
- Cleared on submit

---

*Form Builder Spec — CVF v1.5 Web Interface*
