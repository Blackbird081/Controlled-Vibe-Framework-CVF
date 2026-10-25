# 📡 API Wrapper Contract

**CVF v1.4 – Usage Layer**

---

## Tổng quan

API Wrapper cho phép integrate CVF v1.4 vào applications khác thông qua REST API.

API này wrap CVF v1.3.1 core với interface đơn giản hóa cho end-user applications.

---

## Base URL

```
https://api.your-domain.com/cvf/v1.4
```

---

## Authentication

```http
Authorization: Bearer <api-key>
```

---

## Endpoints

### 1. Submit Intent

```http
POST /submit
Content-Type: application/json
```

**Request:**

```json
{
  "preset": "analysis",
  "intent": "Tôi muốn hiểu rủi ro của việc migrate sang cloud",
  "context": "Hệ thống on-premise, 500 users",
  "success_criteria": "Xác định 5 rủi ro chính",
  "options": {
    "format": "markdown",
    "language": "vi"
  }
}
```

**Response:**

```json
{
  "task_id": "task_abc123",
  "status": "processing",
  "estimated_time": 30,
  "created_at": "2026-02-01T14:00:00Z"
}
```

---

### 2. Get Result

```http
GET /result/{task_id}
```

**Response (Processing):**

```json
{
  "task_id": "task_abc123",
  "status": "processing",
  "progress": 60
}
```

**Response (Complete):**

```json
{
  "task_id": "task_abc123",
  "status": "complete",
  "result": {
    "content": "## Phân tích rủi ro...",
    "format": "markdown",
    "word_count": 450
  },
  "completed_at": "2026-02-01T14:00:30Z"
}
```

**Response (Failed):**

```json
{
  "task_id": "task_abc123",
  "status": "failed",
  "error": {
    "code": "INPUT_UNCLEAR",
    "message": "Yêu cầu chưa đủ thông tin để đưa ra kết quả đáng tin cậy.",
    "suggestion": "Vui lòng bổ sung bối cảnh về hệ thống hiện tại."
  }
}
```

---

### 3. List Presets

```http
GET /presets
```

**Response:**

```json
{
  "presets": [
    {
      "id": "analysis",
      "name": "Phân tích",
      "description": "Hiểu vấn đề, không ra quyết định",
      "icon": "📊"
    },
    {
      "id": "decision",
      "name": "Hỗ trợ quyết định",
      "description": "Khuyến nghị có lý do",
      "icon": "🎯"
    },
    {
      "id": "content",
      "name": "Tạo nội dung",
      "description": "Documentation, reports",
      "icon": "✍️"
    },
    {
      "id": "technical",
      "name": "Review kỹ thuật",
      "description": "Code, architecture review",
      "icon": "🔍"
    }
  ]
}
```

---

### 4. Validate Intent (Optional)

```http
POST /validate
```

**Request:**

```json
{
  "preset": "analysis",
  "intent": "Phân tích cái này"
}
```

**Response:**

```json
{
  "valid": false,
  "issues": [
    {
      "field": "intent",
      "issue": "Too vague",
      "suggestion": "Mô tả cụ thể hơn bạn muốn phân tích điều gì"
    }
  ]
}
```

---

## Error Codes

| Code | HTTP Status | Meaning |
|------|:-----------:|---------|
| `INPUT_UNCLEAR` | 400 | Intent quá mơ hồ |
| `PRESET_NOT_FOUND` | 404 | Preset không tồn tại |
| `OUT_OF_SCOPE` | 422 | Vượt phạm vi an toàn |
| `RATE_LIMITED` | 429 | Quá nhiều requests |
| `INTERNAL_ERROR` | 500 | Lỗi hệ thống |

---

## Rate Limits

| Tier | Requests/min | Concurrent |
|------|:------------:|:----------:|
| Free | 10 | 2 |
| Pro | 60 | 10 |
| Enterprise | 300 | 50 |

---

## SDK Integration

### Python

```python
from cvf_client import CVFClient

client = CVFClient(api_key="your-api-key")

# Submit intent
task = client.submit(
    preset="analysis",
    intent="Phân tích rủi ro...",
    context="..."
)

# Wait for result
result = task.wait()
print(result.content)
```

### JavaScript

```javascript
import { CVFClient } from 'cvf-client';

const client = new CVFClient({ apiKey: 'your-api-key' });

// Submit and wait
const result = await client.submit({
  preset: 'analysis',
  intent: 'Phân tích rủi ro...'
}).waitForResult();

console.log(result.content);
```

---

## Webhook (Optional)

```http
POST /submit
```

```json
{
  "preset": "analysis",
  "intent": "...",
  "webhook_url": "https://your-app.com/cvf-callback"
}
```

Callback payload:

```json
{
  "task_id": "task_abc123",
  "status": "complete",
  "result": { ... }
}
```

---

## Security

- All endpoints require authentication
- HTTPS only
- API keys scoped to specific presets (optional)
- No trace/execution data exposed
- Rate limiting per API key

---

*API Wrapper Contract thuộc CVF v1.4 Usage Layer*  
*Powered by CVF v1.3.1 Core*
