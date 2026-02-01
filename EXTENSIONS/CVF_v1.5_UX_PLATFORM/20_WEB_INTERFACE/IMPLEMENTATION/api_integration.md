# 🔌 API Integration

**CVF v1.5 — Web Interface Implementation**

---

## Overview

Web UI talks to CVF SDK via REST API.

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/templates` | List all templates |
| GET | `/api/templates/:id` | Get template schema |
| POST | `/api/execute` | Execute intent |
| GET | `/api/executions/:id` | Get execution result |
| GET | `/api/history` | List past executions |
| PATCH | `/api/executions/:id` | Update status (accept/reject) |

---

## Request/Response Examples

### Execute Intent

**Request:**
```json
POST /api/execute
{
  "template_id": "business_strategy_analysis",
  "input": {
    "topic": "Mở rộng thị trường miền Trung",
    "context": "Ngành bán lẻ, 50 cửa hàng...",
    "options": null,
    "priority": "Growth"
  }
}
```

**Response:**
```json
{
  "execution_id": "exec_abc123",
  "status": "processing",
  "estimated_time": 15
}
```

### Get Result

**Request:**
```json
GET /api/executions/exec_abc123
```

**Response:**
```json
{
  "execution_id": "exec_abc123",
  "status": "completed",
  "template_id": "business_strategy_analysis",
  "output": "## Phân tích chiến lược...\n\n...",
  "audit": {
    "contract_passed": true,
    "boundary_passed": true,
    "quality_score": 8.5
  },
  "created_at": "2026-02-01T15:20:30Z",
  "duration_ms": 12500
}
```

---

## SDK Wrapper

```typescript
// lib/cvf-sdk.ts

class CVFClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async execute(templateId: string, input: Record<string, any>) {
    const res = await fetch(`${this.baseUrl}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ template_id: templateId, input })
    });
    return res.json();
  }

  async getResult(executionId: string) {
    const res = await fetch(`${this.baseUrl}/api/executions/${executionId}`);
    return res.json();
  }

  async updateStatus(executionId: string, status: 'accepted' | 'rejected') {
    const res = await fetch(`${this.baseUrl}/api/executions/${executionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return res.json();
  }
}

export const cvf = new CVFClient(
  process.env.CVF_SDK_URL!,
  process.env.CVF_API_KEY!
);
```

---

## Polling for Result

```typescript
async function waitForResult(executionId: string) {
  while (true) {
    const result = await cvf.getResult(executionId);
    
    if (result.status === 'completed') {
      return result;
    }
    
    if (result.status === 'failed') {
      throw new Error(result.error);
    }
    
    await sleep(1000); // Poll every second
  }
}
```

---

## Error Handling

```typescript
try {
  const result = await cvf.execute(templateId, input);
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    showValidationErrors(error.details);
  } else if (error.code === 'RATE_LIMITED') {
    showRateLimitMessage();
  } else {
    showGenericError();
  }
}
```

---

*API Integration — CVF v1.5 Web Interface*
