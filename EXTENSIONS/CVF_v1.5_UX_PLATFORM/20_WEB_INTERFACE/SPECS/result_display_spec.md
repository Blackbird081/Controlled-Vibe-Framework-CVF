# 📊 Result Display Spec

**CVF v1.5 — Web Interface**

---

## Overview

Hiển thị output từ CVF một cách clear và actionable.

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
│  ──────────────────────────────────────────────────────────│
│  ✅ [Template Name] Complete           [Export ▼] [Copy 📋]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Content Area                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [Markdown rendered output]                         │   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Actions                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [✅ Accept]      [❌ Reject]      [↻ Retry]         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Markdown Rendering

Hỗ trợ render:

| Element | Supported |
|---------|:---------:|
| Headers (H1-H6) | ✅ |
| Bold / Italic | ✅ |
| Lists (ordered/unordered) | ✅ |
| Tables | ✅ |
| Code blocks | ✅ |
| Links | ✅ |
| Blockquotes | ✅ |
| Horizontal rules | ✅ |

---

## Table Enhancement

Tables được render với:

- Sortable columns
- Alternating row colors
- Responsive scrolling

```
┌──────────────────────────────────────────────────┐
│ Phương án │ Ưu điểm │ Nhược điểm │ Rủi ro [▼]   │
├──────────────────────────────────────────────────┤
│ A         │ ...     │ ...        │ Trung bình   │
│ B         │ ...     │ ...        │ Thấp         │
└──────────────────────────────────────────────────┘
```

---

## Actions

### Accept

```javascript
async function acceptResult(executionId) {
  await api.updateStatus(executionId, 'accepted');
  showToast('Result accepted');
  navigate('/history');
}
```

### Reject

```javascript
async function rejectResult(executionId) {
  const reason = await showRejectDialog();
  await api.updateStatus(executionId, 'rejected', reason);
  navigate('/form', { prefill: originalInput });
}
```

### Retry

```javascript
async function retryExecution(input) {
  navigate('/form', { prefill: input, autoSubmit: true });
}
```

---

## Export Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| PDF | .pdf | Formal reports |
| Word | .docx | Editable documents |
| Markdown | .md | Developer-friendly |
| HTML | .html | Web sharing |

---

## Copy Features

- Copy full result
- Copy section (on section hover)
- Copy table (as markdown or CSV)

---

## Metadata Display

```
┌─────────────────────────────────────┐
│ ℹ️ Execution Details                │
│ ─────────────────────────────────── │
│ Template: Strategy Analysis         │
│ Executed: 2026-02-01 15:20:30      │
│ Duration: 12.5 seconds              │
│ Status: Completed                   │
└─────────────────────────────────────┘
```

---

*Result Display Spec — CVF v1.5 Web Interface*
