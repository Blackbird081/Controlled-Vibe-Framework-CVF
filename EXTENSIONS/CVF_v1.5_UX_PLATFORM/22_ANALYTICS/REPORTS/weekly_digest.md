# 📧 Weekly Digest

**CVF v1.5 — Analytics Reports**

---

## Overview

Báo cáo tự động gửi hàng tuần qua email hoặc hiển thị trong app.

---

## Email Template

```
Subject: Your CVF Weekly Digest - Feb 1-7, 2026

┌─────────────────────────────────────────┐
│  📊 Weekly Summary                      │
│                                         │
│  This week you had:                     │
│  • 24 executions (+15% vs last week)    │
│  • 82% accept rate (+7%)                │
│  • 8.4 avg quality score (+0.2)         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🏆 Top Performing Templates            │
│  1. Risk Assessment     - 95% accept    │
│  2. Strategy Analysis   - 88% accept    │
│  3. Code Review         - 80% accept    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  💡 Insights                            │
│  • Your accept rate improved this week  │
│  • Try adding more context to improve   │
│    Documentation template results       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [View Full Dashboard →]                │
│                                         │
└─────────────────────────────────────────┘
```

---

## Content Sections

### Summary Stats

```typescript
interface WeeklySummary {
  period: { start: Date; end: Date };
  totalExecutions: number;
  executionChange: number;
  acceptRate: number;
  acceptRateChange: number;
  avgQuality: number;
  qualityChange: number;
}
```

### Top Templates

```sql
SELECT template_id, accept_rate
FROM weekly_stats
WHERE week = CURRENT_WEEK
ORDER BY total_executions DESC
LIMIT 5;
```

### Insights

```typescript
function generateInsights(data: WeeklyData): Insight[] {
  const insights = [];
  
  if (data.acceptRateChange > 5) {
    insights.push('Your accept rate improved this week! 🎉');
  }
  
  if (data.lowestTemplate) {
    insights.push(`Try improving input for ${data.lowestTemplate}`);
  }
  
  return insights.slice(0, 3);
}
```

---

## Delivery

| Method | Frequency | Timing |
|--------|-----------|--------|
| Email | Weekly | Monday 9:00 AM |
| In-app | Weekly | On login |
| Push | Weekly | Monday 9:00 AM |

---

## Preferences

```
┌─────────────────────────────────────────┐
│ Digest Preferences                      │
│ ─────────────────────────────────────── │
│ ☑ Email weekly digest                  │
│ ☐ Push notification                    │
│ ☑ Show in-app summary                  │
│                                         │
│ Day: [Monday ▼]  Time: [9:00 AM ▼]    │
└─────────────────────────────────────────┘
```

---

*Weekly Digest — CVF v1.5 Analytics*
