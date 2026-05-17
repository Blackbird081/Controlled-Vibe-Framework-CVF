# 📊 Analytics Module

**CVF v1.5 — User Experience Platform**

---

## Mục tiêu

Analytics giúp CVF tự cải thiện theo thời gian dựa trên Accept/Reject của user.

---

## Philosophy

```
"Learn from usage, not from training"
```

- Track behavior, not control it
- Suggest improvements, not enforce them
- Respect user privacy

---

## Core Metrics

| Metric | Description | Usage |
|--------|-------------|-------|
| **Accept Rate** | % executions accepted | Quality indicator |
| **Reject Rate** | % executions rejected | Problem indicator |
| **Time to Accept** | How long user reviews | Complexity indicator |
| **Template Popularity** | Most used templates | Content planning |
| **Retry Frequency** | How often users retry | Quality signal |

---

## Module Structure

```
22_ANALYTICS/
├── README.md                 ← (file này)
│
├── TRACKING/
│   ├── accept_reject_tracking.md
│   ├── usage_patterns.md
│   └── operator_behavior.md
│
├── INSIGHTS/
│   ├── pattern_detection.md
│   ├── quality_scoring.md
│   └── improvement_suggestions.md
│
└── REPORTS/
    ├── dashboard_spec.md
    ├── weekly_digest.md
    └── export_formats.md
```

---

## Data Flow

```
User Action (Accept/Reject)
         ↓
Event Captured
         ↓
Stored in Database
         ↓
Aggregated into Metrics
         ↓
Analyzed for Patterns
         ↓
Displayed in Dashboard
         ↓
Suggestions Generated
```

---

## Privacy Principles

✅ **No PII storage** — Only aggregate metrics  
✅ **Local first** — Analytics optional for self-hosted  
✅ **Transparent** — User can view what's tracked  
✅ **Opt-out** — User can disable analytics  

---

## Key Features

| Feature | Status |
|---------|:------:|
| Accept/Reject Tracking | ✅ Spec |
| Template Popularity | ✅ Spec |
| Quality Scoring | ✅ Spec |
| Pattern Detection | ✅ Spec |
| Auto Suggestions | ✅ Spec |
| Dashboard | ✅ Spec |

---

## Implementation Notes (v1.5)

- **Local tracking** via browser storage (no PII, opt-out by clearing storage).
- Events captured: template selection, execution created/completed, accept/reject, retry.
- Analytics dashboard shows recent tracking events.

---

*Analytics Module — CVF v1.5 UX Platform*
