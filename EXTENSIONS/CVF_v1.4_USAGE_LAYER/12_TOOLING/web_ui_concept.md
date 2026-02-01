# 🌐 Web UI Concept

**CVF v1.4 – Usage Layer**

---

## Tổng quan

Web UI tối giản cho CVF v1.4, cho phép user submit intent mà không cần CLI.

---

## Design Principles

1. **Minimal** — Chỉ những gì cần thiết
2. **Guided** — Hướng dẫn user từng bước
3. **No Trace** — Không lộ technical details
4. **Fast** — Tối ưu cho quick tasks

---

## UI Flow

```
┌─────────────────────────────────────────────┐
│  CVF v1.4 Usage Layer                       │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 1. Chọn Preset                      │    │
│  │ ┌───────┐ ┌───────┐ ┌───────┐       │    │
│  │ │Analysis│ │Decision│ │Content│ ... │    │
│  │ └───────┘ └───────┘ └───────┘       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 2. Mô tả Intent                     │    │
│  │ ┌─────────────────────────────────┐ │    │
│  │ │ Tôi muốn...                     │ │    │
│  │ │                                 │ │    │
│  │ └─────────────────────────────────┘ │    │
│  │ Optional: Add context              │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 3. Success Criteria                 │    │
│  │ ┌─────────────────────────────────┐ │    │
│  │ │ Kết quả thành công khi...       │ │    │
│  │ └─────────────────────────────────┘ │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌──────────────┐                           │
│  │   Submit     │                           │
│  └──────────────┘                           │
└─────────────────────────────────────────────┘
```

---

## Components

### 1. Preset Selector

```html
<div class="preset-selector">
  <button class="preset" data-preset="analysis">
    📊 Phân tích
  </button>
  <button class="preset" data-preset="decision">
    🎯 Quyết định
  </button>
  <button class="preset" data-preset="content">
    ✍️ Nội dung
  </button>
  <button class="preset" data-preset="technical">
    🔍 Review
  </button>
</div>
```

### 2. Intent Input

```html
<div class="intent-input">
  <label>Tôi muốn...</label>
  <textarea 
    placeholder="Mô tả điều bạn muốn đạt được (không phải cách làm)"
    maxlength="500"
  ></textarea>
  
  <details>
    <summary>+ Thêm bối cảnh</summary>
    <textarea placeholder="Context (optional)"></textarea>
  </details>
</div>
```

### 3. Success Criteria

```html
<div class="success-criteria">
  <label>Kết quả thành công khi...</label>
  <textarea 
    placeholder="Làm sao biết output đạt yêu cầu?"
  ></textarea>
</div>
```

### 4. Result Display

```html
<div class="result">
  <div class="result-header">
    <span class="status">✅ Hoàn thành</span>
    <button class="copy">📋 Copy</button>
    <button class="download">⬇️ Download</button>
  </div>
  <div class="result-content">
    <!-- Markdown rendered output -->
  </div>
</div>
```

---

## Error States

```html
<!-- Input chưa đủ -->
<div class="error-state">
  ⚠️ Yêu cầu chưa đủ thông tin
  <p>Vui lòng mô tả rõ hơn bạn muốn đạt được điều gì.</p>
</div>

<!-- Processing -->
<div class="loading-state">
  ⏳ Đang xử lý...
  <progress></progress>
</div>

<!-- Cannot process -->
<div class="reject-state">
  ❌ Không thể xử lý yêu cầu này
  <p>Yêu cầu nằm ngoài phạm vi hỗ trợ an toàn.</p>
</div>
```

---

## Technical Stack (Suggested)

| Layer | Technology |
|-------|------------|
| Frontend | React / Vue / Vanilla JS |
| Styling | TailwindCSS |
| Backend | FastAPI (wrap CVF v1.3 SDK) |
| API | REST / WebSocket |

---

## API Integration

```javascript
// Submit intent
const response = await fetch('/api/v1/submit', {
  method: 'POST',
  body: JSON.stringify({
    preset: 'analysis',
    intent: 'Phân tích rủi ro...',
    context: 'Optional context...',
    success_criteria: 'Xác định 5 rủi ro...'
  })
});

// Poll for result
const result = await fetch(`/api/v1/result/${response.taskId}`);
```

---

## Không bao gồm

Web UI **không** hiển thị:
- Trace / reasoning nội bộ
- Execution details
- Audit log
- Custom execution options

Những features này chỉ có ở Operator Edition (v1.3.1).

---

*Web UI Concept thuộc CVF v1.4 Usage Layer*