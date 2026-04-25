# Forecast & Scenario Review

> **Domain:** Finance Analytics  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-04-26

---

## 📌 Prerequisites

- At least 3 comparable historical periods for a simple forecast.
- Clear forecast target such as revenue, expense, cash balance, margin, demand,
  or budget consumption.
- Known forecast horizon and decision threshold.

---

## 🎯 Mục đích / Purpose

Use this skill when a non-coder needs a finance forecast, scenario comparison,
stress test, or simple Monte Carlo-style risk interpretation as a decision
packet.

This skill consolidates prior revenue forecast review, trend predictor, and
Monte Carlo style guidance into one non-coder friendly packet. It does not force
the agent to produce Plotly, sklearn, or other code unless the user explicitly
asks for implementation.

Not suitable when:

- the user only needs current-period analysis; use
  [Finance Analysis System](./01_finance_analysis_system.skill.md)
- the forecast supports a material investment decision; pair with
  [Investment & Risk Due Diligence](./03_investment_risk_due_diligence.skill.md)
- the output is ready for final review; use
  [Finance QA Checklist](./04_finance_qa_checklist.skill.md)

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R2 |
| Allowed Roles | User, Reviewer, Analyst |
| Allowed Phases | Discovery, Design, Review |
| Authority Scope | Tactical |
| Autonomy | Human confirmation required |
| Audit Hooks | Data period check, assumption register, scenario trace, uncertainty disclosure |

---

## ⛔ Execution Constraints

- Do not claim prediction certainty.
- Do not use advanced models unless the user asks and provides sufficient data.
- Prefer simple methods: run-rate, moving average, linear trend, seasonality
  note, or scenario assumptions.
- Always provide base, upside, and downside scenarios when decision risk matters.
- Show the threshold that would trigger action.
- If using probability language, explain the assumptions behind it.

---

## ✅ Validation Hooks

- Check that history length is enough for the selected method.
- Check that every scenario has assumptions, numbers, and interpretation.
- Check that downside case includes mitigation.
- Check that forecast horizon is realistic for data quality.
- Check that disclaimer and human decision boundary are included.

---

## 🧪 UAT Binding

- UAT Record: [02_forecast_scenario_review](../../../governance/skill-library/uat/results/UAT-02_forecast_scenario_review.md)
- UAT Objective: Produce a forecast/scenario packet with clear assumptions,
  uncertainty, thresholds, and non-coder readable recommendations.

---

## 📋 Form Input

| Field | Description | Required | Example |
|-------|-------------|:--------:|---------|
| Forecast target | What to forecast or stress test | ✅ | "Monthly yard handling revenue" |
| Historical data | Periods and values | ✅ | "Jan-Jun revenue by month" |
| Forecast horizon | Future period to estimate | ✅ | "Next 3 months" |
| Decision threshold | Value that triggers concern/action | ✅ | "Cash below 700M VND" |
| Scenario assumptions | Base/upside/downside assumptions | ❌ | "Base: same volume, downside: -15%" |
| Known seasonality | Cycles, holidays, contracts, operations changes | ❌ | "Low volume during holiday week" |

---

## ✅ Expected Output

Return a scenario review packet:

```markdown
# Forecast & Scenario Review Packet

## 1. Forecast Summary
- Target:
- Horizon:
- Method:
- Confidence level:

## 2. Data Readiness
| Check | Status | Notes |
| --- | --- | --- |

## 3. Scenario Table
| Scenario | Assumptions | Forecast | Threshold status | Action |
| --- | --- | ---: | --- | --- |

## 4. Interpretation
- Base case:
- Upside:
- Downside:
- What could change the forecast:

## 5. Risk Triggers
| Trigger | Watch metric | Owner | Response |
| --- | --- | --- | --- |

## 6. Recommendation
- Recommended action:
- Decision owner:
- Review date:

## 7. Disclaimer
This is an estimate based on the supplied data and assumptions, not a guaranteed prediction.
```

---

## 🔍 Cách đánh giá / Evaluation Criteria

**Accept Checklist:**

- [ ] Forecast method matches data quality
- [ ] Base/upside/downside scenarios are clear
- [ ] Thresholds and trigger actions are included
- [ ] Uncertainty is disclosed in plain language
- [ ] No hidden code dependency is required for non-coder use

**Red Flags:**

- Uses a complex model without enough data
- Gives one forecast number without scenario context
- Ignores seasonality or operational constraints mentioned by the user
- Omits downside mitigation

---

## ⚠️ Common Failures

| Common Error | Prevention |
|---|---|
| Overconfident forecast | Always state assumptions and confidence |
| Missing downside case | Require base/upside/downside when money decisions are involved |
| Wrong time horizon | Shorten horizon when data is sparse |
| Code-first output | Produce packet first; code only when requested |

---

## 💡 Tips

1. For less than 6 periods, prefer simple run-rate or moving average.
2. Use scenario ranges instead of a single exact number when uncertainty is high.
3. Put trigger thresholds near the recommendation so the user can act.
4. Treat Monte Carlo as a method option, not a separate user-facing skill.

---

## 📊 Ví dụ thực tế / Example

### Input mẫu

```text
Forecast target: Monthly container handling revenue.
Historical data:
- Jan: 1.10B VND
- Feb: 1.18B VND
- Mar: 1.25B VND
- Apr: 1.20B VND
- May: 1.28B VND
- Jun: 1.34B VND
Forecast horizon: Jul-Sep 2026.
Decision threshold: below 1.15B VND requires cost freeze.
Scenario assumptions: downside is 12% volume drop from weather delays.
```

### Output mẫu

```markdown
# Forecast & Scenario Review Packet

## Forecast Summary
- Target: monthly handling revenue.
- Horizon: Jul-Sep 2026.
- Method: recent moving average plus scenario adjustment.
- Confidence level: medium because only 6 months are supplied.

## Scenario Table
| Scenario | Assumptions | Forecast | Threshold status | Action |
| --- | --- | ---: | --- | --- |
| Base | Recent trend continues | 1.30B-1.38B | Above threshold | Continue plan |
| Upside | Volume +8% | 1.40B-1.49B | Above threshold | Prepare capacity |
| Downside | Volume -12% | 1.14B-1.20B | Near threshold | Prepare cost freeze trigger |

## Recommendation
Monitor weekly volume and pre-approve a cost-freeze rule if projected revenue
falls below 1.15B VND for two consecutive weeks.
```

---

## 🔗 Related Skills

- [Finance Analysis System](./01_finance_analysis_system.skill.md)
- [Investment & Risk Due Diligence](./03_investment_risk_due_diligence.skill.md)
- [Finance QA Checklist](./04_finance_qa_checklist.skill.md)

---

## 🔗 Next Step

Use the scenario packet as input to [Finance QA Checklist](./04_finance_qa_checklist.skill.md)
before sending it to a decision owner.

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-26 | Canonicalized forecasting, scenario review, trend prediction, and Monte Carlo guidance into one packet skill. |

---

*Forecast & Scenario Review - CVF v1.5.2 Finance Analytics Skill Library*
