# 📊 Dashboard Spec

**CVF v1.5 — Analytics Reports**

---

## Overview

Dashboard tổng quan cho analytics data.

---

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Analytics Dashboard                    [Last 7 days ▼]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │ Total       │ │ Accept Rate │ │ Avg Quality │ │ Active    │  │
│  │ Executions  │ │             │ │ Score       │ │ Users     │  │
│  │    247      │ │    78%      │ │    8.2      │ │    45     │  │
│  │   +12% ↑    │ │   +5% ↑     │ │   +0.3 ↑    │ │   +8% ↑   │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Accept/Reject Trend                    Template Usage          │
│  ┌─────────────────────────────┐       ┌─────────────────────┐  │
│  │     ╭──────────────         │       │ ████████████ 45%    │  │
│  │    ╱                        │       │ ████████░░░░ 32%    │  │
│  │   ╱                         │       │ █████░░░░░░░ 18%    │  │
│  │  ╱                          │       │ ██░░░░░░░░░░  5%    │  │
│  │ Mon Tue Wed Thu Fri Sat Sun │       │ Business Tech...    │  │
│  └─────────────────────────────┘       └─────────────────────┘  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Recent Activity                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ✅ Strategy Analysis    15:30    Quality: 8.5  Accepted  │  │
│  │ ❌ Code Review          14:45    Quality: 6.2  Rejected  │  │
│  │ ✅ Risk Assessment      14:20    Quality: 9.0  Accepted  │  │
│  │ ✅ Documentation        13:55    Quality: 7.8  Accepted  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## KPI Cards

| KPI | Calculation | Good | Warning |
|-----|-------------|:----:|:-------:|
| Total Executions | COUNT(*) | Any | - |
| Accept Rate | accepted/total | >75% | <60% |
| Avg Quality | AVG(quality_score) | >7.5 | <6 |
| Active Users | DISTINCT users | Growing | Declining |

---

## Charts

### Accept/Reject Trend

- Type: Line chart
- X-axis: Date (7/30/90 days)
- Y-axis: Percentage
- Lines: Accept %, Reject %

### Template Usage

- Type: Horizontal bar chart
- Bars: Template categories
- Color: By accept rate

### Quality Distribution

- Type: Histogram
- Bins: 0-2, 3-4, 5-6, 7-8, 9-10
- Color: Red → Yellow → Green

---

## Filters

| Filter | Options |
|--------|---------|
| Time Range | 7d, 30d, 90d, Custom |
| Template | All, Business, Technical, etc. |
| Status | All, Accepted, Rejected |
| User | All, Specific user |

---

## Data Refresh

```
Real-time: KPI cards
Every 5 min: Charts
On demand: Full refresh
```

---

*Dashboard Spec — CVF v1.5 Analytics*
