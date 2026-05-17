# Finance Analysis System

> **Domain:** Finance Analytics  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-04-26

---

## 📌 Prerequisites

- A clear finance question, business context, and available data period.
- At least one input source: budget table, P&L, balance sheet, cash flow data,
  KPI export, accounting summary, or dashboard screenshot.
- Human owner identified for final business decision.

---

## 🎯 Mục đích / Purpose

Use this skill when a non-coder needs a structured finance analysis packet for
budget health, financial statements, cash flow, KPI performance, ROI, or general
business finance review.

This skill consolidates the previous finance micro-skills for budget analysis,
financial statement review, ROI review, KPI dashboard audit, and cash flow
analysis.

Not suitable when:

- the task is specifically about future forecast scenarios; use
  [Forecast & Scenario Review](./02_forecast_scenario_review.skill.md)
- the task is investment due diligence or enterprise risk; use
  [Investment & Risk Due Diligence](./03_investment_risk_due_diligence.skill.md)
- the task is final QA of a finance packet; use
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
| Audit Hooks | Input completeness, assumption register, calculation trace, decision boundary |

---

## ⛔ Execution Constraints

- Do not present analysis as certified accounting, tax, legal, or investment advice.
- Do not invent missing financial figures. Mark gaps and ask for clarification.
- Separate facts, calculations, assumptions, and recommendations.
- Include a decision boundary: what the user may decide and what needs accountant,
  finance lead, or executive approval.
- Use source currency and period consistently.
- Flag data quality issues before drawing conclusions.

---

## ✅ Validation Hooks

- Check that each conclusion traces back to a provided number or stated assumption.
- Check that material variance, liquidity, margin, and ROI claims include method.
- Check that risks and recommendations are prioritized.
- Check that the output includes next actions and owner suggestions.
- Check that no automated money movement, filing, or external submission is implied.

---

## 🧪 UAT Binding

- UAT Record: [01_finance_analysis_system](../../../governance/skill-library/uat/results/UAT-01_finance_analysis_system.md)
- UAT Objective: Produce a clear finance analysis packet with traceable numbers,
  assumptions, risks, and human decision boundaries.

---

## 📋 Form Input

| Field | Description | Required | Example |
|-------|-------------|:--------:|---------|
| Business context | Company/project/team and why analysis is needed | ✅ | "Port operations team reviewing Q1 yard cost" |
| Analysis type | Budget, P&L, cash flow, KPI, ROI, or mixed | ✅ | "Budget variance + cash flow health" |
| Data period | Time range and comparison period | ✅ | "Jan-Mar 2026 vs budget" |
| Financial data | Tables, pasted figures, exports, or summary | ✅ | "Revenue 3.2B VND, opex 2.8B VND..." |
| Decision needed | What the user must decide after analysis | ✅ | "Whether to approve extra maintenance budget" |
| Constraints | Known limits, missing data, policy constraints | ❌ | "Payroll data not finalized" |

---

## ✅ Expected Output

Return a finance analysis packet:

```markdown
# Finance Analysis Packet

## 1. Executive Summary
- Overall status:
- Main concern:
- Recommended next decision:

## 2. Data Quality Check
| Input | Status | Notes |
| --- | --- | --- |

## 3. Key Metrics
| Metric | Current | Baseline | Change | Interpretation |
| --- | ---: | ---: | ---: | --- |

## 4. Findings
1. Finding:
   - Evidence:
   - Impact:
   - Confidence:

## 5. Risk And Opportunity
| Item | Severity | Reason | Suggested action |
| --- | --- | --- | --- |

## 6. Recommendations
- Immediate:
- Next period:
- Needs human approval:

## 7. Assumptions And Open Questions
- Assumption:
- Missing data:
```

---

## 🔍 Cách đánh giá / Evaluation Criteria

**Accept Checklist:**

- [ ] Uses provided numbers and names assumptions clearly
- [ ] Explains variance, cash, margin, ROI, or KPI impact in plain language
- [ ] Prioritizes the most important risks
- [ ] Gives practical next actions
- [ ] Keeps final financial authority with the human owner

**Red Flags:**

- Claims certainty from incomplete data
- Gives generic advice with no calculation trail
- Mixes different periods or currencies without warning
- Recommends irreversible financial action without human approval

---

## ⚠️ Common Failures

| Common Error | Prevention |
|---|---|
| Treating estimates as actuals | Label estimated, actual, and assumed figures separately |
| Overloading the user with ratios | Show only ratios tied to the decision |
| Ignoring data gaps | Add a data quality section before conclusions |
| Giving finance advice too strongly | Use advisory language and human sign-off |

---

## 💡 Tips

1. Ask for the decision first; it determines which metrics matter.
2. Prefer fewer, decision-grade metrics over broad financial commentary.
3. Use tables for numbers and bullets for interpretation.
4. Always include "what would change my recommendation" for uncertain cases.

---

## 📊 Ví dụ thực tế / Example

### Input mẫu

```text
Business context: Internal operations team reviewing Q1 2026 maintenance budget.
Analysis type: Budget variance + cash flow impact.
Data period: Q1 2026 vs approved budget.
Financial data:
- Maintenance budget: 850M VND
- Actual maintenance spend: 1.05B VND
- Revenue: 4.2B VND
- Cash reserve: 1.1B VND
Decision needed: Whether to approve an extra 300M VND for preventive repairs.
Constraints: Some invoices are still pending.
```

### Output mẫu

```markdown
# Finance Analysis Packet

## Executive Summary
- Overall status: maintenance is 23.5% over budget.
- Main concern: extra approval may reduce cash reserve below the comfort level.
- Recommended next decision: approve only the urgent portion now and require
  invoice confirmation before the remaining amount.

## Key Metrics
| Metric | Current | Baseline | Change | Interpretation |
| --- | ---: | ---: | ---: | --- |
| Maintenance spend | 1.05B | 850M | +23.5% | Material overspend |
| Cash reserve | 1.1B | n/a | n/a | Must protect short-term liquidity |

## Recommendations
- Immediate: approve urgent repairs capped at 150M VND.
- Next period: create preventive maintenance reserve.
- Needs human approval: any spend above 150M VND before invoice validation.
```

---

## 🔗 Related Skills

- [Forecast & Scenario Review](./02_forecast_scenario_review.skill.md)
- [Investment & Risk Due Diligence](./03_investment_risk_due_diligence.skill.md)
- [Finance QA Checklist](./04_finance_qa_checklist.skill.md)

---

## 🔗 Next Step

Run [Finance QA Checklist](./04_finance_qa_checklist.skill.md) before using the
packet for leadership review or implementation planning.

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-26 | Canonicalized finance analysis system from prior budget, statement, ROI, KPI, and cash-flow skills. |

---

*Finance Analysis System - CVF v1.5.2 Finance Analytics Skill Library*
