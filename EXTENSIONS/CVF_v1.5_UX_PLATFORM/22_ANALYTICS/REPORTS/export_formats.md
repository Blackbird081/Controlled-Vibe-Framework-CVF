# 📤 Export Formats

**CVF v1.5 — Analytics Reports**

---

## Overview

Export analytics data cho further analysis hoặc reporting.

---

## Supported Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| CSV | .csv | Spreadsheet analysis |
| JSON | .json | API integration |
| Excel | .xlsx | Business reports |
| PDF | .pdf | Formal reports |

---

## CSV Export

```csv
execution_id,template_id,timestamp,status,quality_score,duration_ms
exec_001,strategy_analysis,2026-02-01T15:30:00,accepted,8.5,12500
exec_002,code_review,2026-02-01T14:45:00,rejected,6.2,8300
exec_003,risk_assessment,2026-02-01T14:20:00,accepted,9.0,15200
```

---

## JSON Export

```json
{
  "export_date": "2026-02-01",
  "period": {
    "start": "2026-01-25",
    "end": "2026-02-01"
  },
  "summary": {
    "total_executions": 247,
    "accept_rate": 78.5,
    "avg_quality": 8.2
  },
  "executions": [
    {
      "id": "exec_001",
      "template": "strategy_analysis",
      "status": "accepted",
      "quality_score": 8.5
    }
  ]
}
```

---

## Excel Template

| Sheet | Contents |
|-------|----------|
| Summary | KPIs, trends |
| Executions | Raw data |
| Templates | Template stats |
| Charts | Pre-built charts |

---

## PDF Report

```
┌─────────────────────────────────────────┐
│  CVF Analytics Report                   │
│  Period: Jan 25 - Feb 1, 2026          │
├─────────────────────────────────────────┤
│                                         │
│  Executive Summary                      │
│  ──────────────────                     │
│  [Summary paragraph]                    │
│                                         │
│  Key Metrics                            │
│  ───────────                            │
│  [Table]                                │
│                                         │
│  Trends                                 │
│  ──────                                 │
│  [Chart]                                │
│                                         │
│  Recommendations                        │
│  ───────────────                        │
│  [List]                                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## API Endpoint

```
GET /api/analytics/export

Query params:
- format: csv|json|xlsx|pdf
- period: 7d|30d|90d|custom
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD
- include: summary,executions,templates
```

---

*Export Formats — CVF v1.5 Analytics*
