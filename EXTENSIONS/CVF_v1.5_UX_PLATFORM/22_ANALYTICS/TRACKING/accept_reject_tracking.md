# ✅ Accept/Reject Tracking

**CVF v1.5 — Analytics**

---

## Overview

Track every Accept/Reject decision để hiểu quality và improve.

---

## Event Schema

```typescript
interface ExecutionEvent {
  execution_id: string;
  template_id: string;
  timestamp: Date;
  
  // Outcome
  status: 'accepted' | 'rejected' | 'retried';
  reject_reason?: string;
  
  // Timing
  execution_duration_ms: number;
  review_duration_ms: number;
  
  // Quality
  quality_score: number;
  contract_passed: boolean;
  boundary_passed: boolean;
  
  // Context (anonymized)
  session_id: string;
  is_retry: boolean;
  retry_count: number;
}
```

---

## Tracking Points

| Event | When Captured |
|-------|---------------|
| `execution_started` | User clicks Submit |
| `execution_completed` | Result is ready |
| `result_viewed` | User sees result |
| `result_accepted` | User clicks Accept |
| `result_rejected` | User clicks Reject |
| `result_retried` | User clicks Retry |

---

## Metrics Derived

### Accept Rate
```
accept_rate = accepted / (accepted + rejected) * 100
```

### First-time Accept Rate
```
first_time_accept = accepted_without_retry / total * 100
```

### Average Review Time
```
avg_review_time = sum(review_duration) / count
```

### Reject Reasons Distribution
```sql
SELECT reject_reason, COUNT(*) as count
FROM executions
WHERE status = 'rejected'
GROUP BY reject_reason
ORDER BY count DESC
```

---

## Aggregation Levels

| Level | Granularity | Use |
|-------|-------------|-----|
| Execution | Individual | Debugging |
| Session | User session | Behavior analysis |
| Template | Per template | Template quality |
| Day | Daily | Trends |
| Week | Weekly | Reporting |

---

## Database Schema

```sql
CREATE TABLE execution_events (
  id UUID PRIMARY KEY,
  execution_id UUID NOT NULL,
  template_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  status VARCHAR(20) NOT NULL,
  reject_reason TEXT,
  
  execution_duration_ms INT,
  review_duration_ms INT,
  
  quality_score DECIMAL(3,1),
  contract_passed BOOLEAN,
  boundary_passed BOOLEAN,
  
  session_id UUID,
  is_retry BOOLEAN DEFAULT FALSE,
  retry_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_template ON execution_events(template_id);
CREATE INDEX idx_status ON execution_events(status);
CREATE INDEX idx_timestamp ON execution_events(timestamp);
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/analytics/event` | Log event |
| GET | `/api/analytics/stats` | Get aggregated stats |
| GET | `/api/analytics/template/:id` | Template-specific stats |

---

## Example Queries

### Overall Accept Rate
```sql
SELECT 
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) * 100.0 / COUNT(*) as accept_rate
FROM execution_events
WHERE timestamp > NOW() - INTERVAL '7 days';
```

### Template Performance
```sql
SELECT 
  template_id,
  COUNT(*) as total,
  AVG(quality_score) as avg_quality,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) * 100.0 / COUNT(*) as accept_rate
FROM execution_events
GROUP BY template_id
ORDER BY total DESC;
```

---

*Accept/Reject Tracking — CVF v1.5 Analytics*
