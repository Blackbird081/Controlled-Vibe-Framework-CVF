# 🔍 Pattern Detection

**CVF v1.5 — Analytics Insights**

---

## Overview

Tự động phát hiện patterns trong usage để identify problems và opportunities.

---

## Pattern Types

| Type | Description | Action |
|------|-------------|--------|
| **Failure Pattern** | Repeated rejects | Alert + investigate |
| **Success Pattern** | High accept clusters | Learn + replicate |
| **Anomaly** | Unusual behavior | Flag for review |
| **Trend** | Gradual change | Monitor |

---

## Failure Patterns

### Definition
```
Failure Pattern = 3+ consecutive rejects OR reject rate > 50% in 10 executions
```

### Common Failure Patterns

| Pattern ID | Name | Detection Rule |
|------------|------|----------------|
| FP-01 | Template Mismatch | Same user, different templates, all rejected |
| FP-02 | Input Poverty | Short inputs + rejects |
| FP-03 | Expectation Drift | Accept → Reject → Reject (same template) |
| FP-04 | Retry Spiral | >3 retries same execution |

### Alert Generation
```typescript
function detectFailurePatterns(events: Event[]): Alert[] {
  const alerts = [];
  
  // FP-01: Template Mismatch
  const recentRejects = events.filter(e => e.status === 'rejected').slice(-5);
  if (recentRejects.length >= 3) {
    const uniqueTemplates = new Set(recentRejects.map(e => e.template_id));
    if (uniqueTemplates.size >= 3) {
      alerts.push({
        pattern: 'FP-01',
        message: 'User may be struggling to find the right template',
        suggestion: 'Show template recommendation'
      });
    }
  }
  
  return alerts;
}
```

---

## Success Patterns

### Definition
```
Success Pattern = 5+ consecutive accepts OR accept rate > 85% in 10 executions
```

### Pattern Analysis
```sql
SELECT 
  template_id,
  AVG(LENGTH(input)) as avg_input_length,
  AVG(quality_score) as avg_quality
FROM executions
WHERE status = 'accepted'
  AND quality_score > 8
GROUP BY template_id;
```

### Success Factors
```
High Accept Rate correlates with:
- Input length > 150 chars
- Optional fields filled > 2
- Context section complete
- Specific success criteria
```

---

## Anomaly Detection

### Statistical Anomaly
```
Anomaly = value > mean + (3 * std_dev)
        OR value < mean - (3 * std_dev)
```

### Types
| Anomaly | Example |
|---------|---------|
| Time | Execution at 3am (unusual) |
| Volume | 50 executions in 1 hour |
| Duration | 30 minute review time |
| Quality | Quality score = 2 (very low) |

---

## Trend Detection

### Moving Average
```sql
SELECT 
  DATE(timestamp) as date,
  AVG(accept_rate) OVER (
    ORDER BY DATE(timestamp)
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as 7_day_avg
FROM daily_stats;
```

### Trend Categories
```
Improving:  +5% week-over-week
Stable:     ±5% week-over-week
Declining:  -5% week-over-week
```

---

*Pattern Detection — CVF v1.5 Analytics*
