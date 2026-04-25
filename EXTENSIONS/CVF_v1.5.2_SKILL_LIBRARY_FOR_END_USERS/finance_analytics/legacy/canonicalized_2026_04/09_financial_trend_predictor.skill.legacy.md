# Financial Trend Predictor

> **Domain:** Finance Analytics
> **Difficulty:** ⭐⭐ Medium
> **CVF Version:** v1.5.2
> **Skill Version:** 1.1.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

- [ ] At least 3 months of historical data (income / expenses / revenue)
- [ ] Data stored in SQLite or Excel
- [ ] Skill [Database Schema Design](../app_development/04_database_schema_design.skill.md) completed (if using SQLite)

---

## 🎯 Purpose

**When to use this skill:**
- Phase B (Design) — upgrading a dashboard from "static reports" to "intelligent forecasting"
- Have ≥ 3 months of historical data and want to see future trends
- Want to add alerts when spending or revenue approaches a danger threshold

**Not suitable when:**
- Fewer than 3 months of data available (results would be unreliable)
- Complex forecasting is needed (ML models, advanced time-series) — use AGT-016

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Architect, Builder |
| Allowed Phases | Design, Build |
| Authority Scope | Informational |
| Autonomy | Auto + Audit |
| Audit Hooks | Data source verified, Algorithm declared, Disclaimer shown to user |

---

## ⛔ Execution Constraints

- AI MUST use `Plotly` with dashed lines (`dash`) for the forecast portion
- AI MUST use simple algorithms only: Linear Regression or Moving Average — no complex ML
- If the forecast line touches 0 or goes negative, the zone MUST be colored red (Red Zone)
- AI MUST explain in plain language: "Based on the past X months, I forecast..."
- MUST display a disclaimer: "This is an estimate, not a guaranteed prediction"

---

## ✅ Validation Hooks

- Check that input data has ≥ 3 data points (months)
- Check that the chart visually distinguishes two parts: historical (solid line) and forecast (dashed line)
- Check that a Red Zone appears when forecast value ≤ 0
- Check that the explanation is in plain language with specific numbers
- Check that a disclaimer is included

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-finance_analytics-09_financial_trend_predictor.md`
- UAT Objective: Chart must clearly separate historical from forecast data, explanation in plain language, Red Zone when forecast is negative

---

## 📋 Form Input

| Field | Description | Required | Example |
|-------|-------------|:--------:|---------|
| **Data Type** | What to forecast | ✅ | "Monthly expenses" / "Revenue" / "Income" |
| **Historical Months** | How many months of data available | ✅ | "6 months" |
| **Forecast Months** | How far ahead to forecast | ✅ | "Next 3 months" |
| **Alert Threshold** | When to trigger a red warning | ❌ | "When expenses > 15,000,000 / month" |
| **Data Source** | SQLite / Excel / CSV | ✅ | "SQLite — expenses table" |

---

## ✅ Expected Output

**Plotly chart + plain-language explanation:**

```python
# Generated code
import plotly.graph_objects as go
import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np

# Historical data (solid blue line)
# Forecast data (dashed light blue line)
# Red Zone when forecast ≤ 0 (red region)

fig.add_trace(go.Scatter(
    x=past_months, y=past_values,
    mode='lines', name='Actual',
    line=dict(color='royalblue', width=2)
))
fig.add_trace(go.Scatter(
    x=future_months, y=predicted_values,
    mode='lines', name='Forecast',
    line=dict(color='royalblue', width=2, dash='dash')
))
```

**Auto-generated explanation:**
```
📊 Spending Trend Forecast

Based on the past 6 months (average 12,500,000 / month, increasing ~8% per month):

→ August 2026:  estimated ~13,500,000
→ September 2026: estimated ~14,600,000
→ October 2026: estimated ~15,800,000 ⚠️ Approaching alert threshold

⚠️ Note: This is an estimate based on current trends,
not a guaranteed prediction. Many factors can change.
```

---

## 🔍 Evaluation Criteria

**Accept Checklist:**
- [ ] Chart has 2 distinct parts: solid line (historical) + dashed (forecast)
- [ ] Red Zone appears when forecast ≤ 0 or exceeds threshold
- [ ] Plain-language explanation with specific numbers
- [ ] Disclaimer is clearly shown
- [ ] Algorithm used is Linear Regression or Moving Average

**Red Flags (Reject):**
- ⚠️ Complex ML model used without explanation
- ⚠️ No disclaimer included
- ⚠️ Chart does not distinguish historical from forecast

---

## ⚠️ Common Failures

| Common Error | Prevention |
|---|---|
| Data < 3 months | Inform User: "More data is needed for a reliable forecast" |
| Overly optimistic trendline | Use Moving Average instead of Linear Regression when data fluctuates |
| No Red Zone | Always check min(predicted_values) ≤ 0 |

---

## 💡 Tips

1. **Moving Average beats Linear Regression for volatile data** — Linear Regression is better for steady trends
2. **3 months ahead is optimal** — Further forecasts lose accuracy rapidly
3. **Explain in percentages, not absolutes** — "Up 8% per month" is clearer than "up 1,200,000"
4. **Consistent color coding** — Blue = actual, Light blue/dashed = forecast, Red = warning

---

## 📊 Example

### Sample Input:
```
Data Type: Monthly expenses
Historical Months: 6 months (Jan–Jun 2026)
Forecast Months: 3 months
Alert Threshold: 20,000,000 / month
Data Source: SQLite — monthly_expenses table
```

### Sample Output:
- Plotly chart with solid line (Jan–Jun) + dashed (Jul–Sep)
- Forecast Jul: 17.2M, Aug: 18.9M, Sep: 20.7M ⚠️ (exceeds threshold)
- Plain-language explanation: "September 2026 is projected to exceed the threshold..."
- Full disclaimer included

### Evaluation:
- ✅ Chart clearly has 2 distinct parts
- ✅ Red Zone in September
- ✅ Plain-language explanation with specific numbers
- **Result: ACCEPT**

---

## 🔗 Next Step

After obtaining the chart → Embed into main Dashboard in Phase C (Build)

---

## 🔗 Related Skills

- [Database Schema Design](../app_development/04_database_schema_design.skill.md) — Prepare data structure first
- [Budget Analysis](./01_budget_analysis.skill.md) — Deeper financial analysis

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-02-27 | Translated to English; domain corrected to Finance Analytics |
| 1.0.0 | 2026-02-27 | Initial creation from CVF-Compatible Skills intake |

---

*Financial Trend Predictor — CVF v1.5.2 Finance Analytics Skill Library*
