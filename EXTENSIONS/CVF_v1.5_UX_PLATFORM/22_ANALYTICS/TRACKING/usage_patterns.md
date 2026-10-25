# 📈 Usage Patterns

**CVF v1.5 — Analytics**

---

## Overview

Phân tích cách user sử dụng CVF để optimize UX.

---

## Pattern Categories

| Pattern | Description |
|---------|-------------|
| **Template Usage** | Templates nào phổ biến |
| **Time Patterns** | Khi nào user dùng |
| **Session Patterns** | Cách user navigate |
| **Input Patterns** | User nhập gì |

---

## Template Usage Metrics

### Popularity

```sql
SELECT 
  template_id,
  COUNT(*) as usage_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM executions
GROUP BY template_id
ORDER BY usage_count DESC;
```

### Template Heatmap

```
Business Templates:      ████████████ 45%
Technical Templates:     ████████░░░░ 32%
Content Templates:       █████░░░░░░░ 18%
Research Templates:      ██░░░░░░░░░░  5%
```

---

## Time Patterns

### By Hour

```
00-06: ░░░░░░░░░░░░  5%  (Night)
06-09: ████░░░░░░░░ 15%  (Morning)
09-12: ████████████ 35%  (Peak AM)
12-14: ████░░░░░░░░ 12%  (Lunch)
14-18: ██████████░░ 28%  (Peak PM)
18-00: ██░░░░░░░░░░  5%  (Evening)
```

### By Day

```
Mon: ████████░░ 18%
Tue: ██████████ 22%
Wed: █████████░ 20%
Thu: █████████░ 19%
Fri: ████████░░ 16%
Sat: ██░░░░░░░░  3%
Sun: ██░░░░░░░░  2%
```

---

## Session Patterns

### Average Session

```
Avg templates per session: 2.3
Avg executions per session: 3.1
Avg session duration: 12 minutes
```

### Common Flows

```
1. Home → Template → Form → Result → Accept (65%)
2. Home → Template → Form → Result → Reject → Retry → Accept (20%)
3. Home → History → View → Export (10%)
4. Other (5%)
```

---

## Input Patterns

### Field Completion

```
Required fields: 100% (enforced)
Optional fields: 43% (user choice)
Advanced options: 12% (power users)
```

### Input Length

```
Short (<100 chars):  25%
Medium (100-500):    55%
Long (>500):         20%
```

---

## Insights Generation

```typescript
function generateUsageInsights(data: UsageData): Insight[] {
  const insights = [];
  
  // Low-performing template
  if (data.templateAcceptRate < 70) {
    insights.push({
      type: 'warning',
      message: `${data.templateName} has low accept rate (${data.acceptRate}%)`,
      action: 'Review template design'
    });
  }
  
  // Unused template
  if (data.templateUsage < 5) {
    insights.push({
      type: 'info',
      message: `${data.templateName} is rarely used`,
      action: 'Consider promoting or removing'
    });
  }
  
  return insights;
}
```

---

*Usage Patterns — CVF v1.5 Analytics*
