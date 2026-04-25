# Investment & Risk Due Diligence

> **Domain:** Finance Analytics  
> **Difficulty:** Advanced  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-04-26

---

## 📌 Prerequisites

- Clear target investment, project, vendor, asset, partnership, or strategic
  finance decision.
- Known amount at risk, expected return, time horizon, and decision owner.
- Available financial, operational, legal/compliance, and risk context.

---

## 🎯 Mục đích / Purpose

Use this skill when a non-coder needs a due diligence packet for investment,
project approval, vendor commitment, M&A screening, capital allocation, or
financial risk review.

This skill consolidates the previous investment due diligence and financial
risk assessment skills into a single decision-grade packet.

Not suitable when:

- the user only needs routine budget or KPI analysis; use
  [Finance Analysis System](./01_finance_analysis_system.skill.md)
- the user only needs forecast scenarios; use
  [Forecast & Scenario Review](./02_forecast_scenario_review.skill.md)
- the task asks for guaranteed investment advice or trade execution; refuse and
  provide a safe review framework instead

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R3 |
| Allowed Roles | User, Reviewer, Analyst, Lead |
| Allowed Phases | Discovery, Design, Review |
| Authority Scope | Strategic |
| Autonomy | Human approval required |
| Audit Hooks | Risk register, assumption trace, approval boundary, evidence completeness |

---

## ⛔ Execution Constraints

- Do not make or execute investment decisions.
- Do not guarantee returns or risk outcomes.
- Do not treat incomplete diligence as approval.
- Separate financial, operational, legal/compliance, market, people, and data
  risks.
- Flag missing evidence as a blocker when it affects decision quality.
- Include "go / conditional go / no-go / hold" as a recommendation category, not
  an autonomous decision.

---

## ✅ Validation Hooks

- Check that amount at risk, time horizon, and expected return are stated.
- Check that risk severity includes likelihood, impact, and mitigation.
- Check that assumptions and missing documents are listed.
- Check that recommendation has conditions and approval owner.
- Check that high-risk claims include evidence or are marked unverified.

---

## 🧪 UAT Binding

- UAT Record: [03_investment_risk_due_diligence](../../../governance/skill-library/uat/results/UAT-03_investment_risk_due_diligence.md)
- UAT Objective: Produce a decision-grade due diligence packet with risk
  register, evidence gaps, conditions, and human approval boundary.

---

## 📋 Form Input

| Field | Description | Required | Example |
|-------|-------------|:--------:|---------|
| Target | Investment, project, vendor, or asset | ✅ | "New crane maintenance vendor contract" |
| Amount at risk | Capital, budget, or exposure | ✅ | "2.5B VND annual contract" |
| Expected benefit | Return, savings, growth, or risk reduction | ✅ | "Reduce downtime by 12%" |
| Time horizon | Payback/hold/contract period | ✅ | "24 months" |
| Evidence supplied | Financials, quotes, references, contracts, reports | ✅ | "3 vendor quotes + downtime history" |
| Known risks | User-known concerns | ❌ | "Single supplier dependency" |
| Decision deadline | When decision is needed | ❌ | "Before May procurement meeting" |

---

## ✅ Expected Output

Return an investment and risk due diligence packet:

```markdown
# Investment & Risk Due Diligence Packet

## 1. Decision Summary
- Target:
- Amount at risk:
- Expected benefit:
- Recommendation category: Go / Conditional Go / Hold / No-Go

## 2. Evidence Inventory
| Evidence | Provided | Quality | Gap |
| --- | --- | --- | --- |

## 3. Financial Case
| Metric | Estimate | Basis | Confidence |
| --- | ---: | --- | --- |

## 4. Risk Register
| Risk | Likelihood | Impact | Severity | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- |

## 5. Conditions Before Approval
- Condition:
- Evidence needed:
- Owner:

## 6. Decision Boundary
- Agent recommendation:
- Human approval required from:
- Do not proceed until:

## 7. Follow-up Questions
- Question:
```

---

## 🔍 Cách đánh giá / Evaluation Criteria

**Accept Checklist:**

- [ ] Decision summary is clear enough for leadership review
- [ ] Financial case and risk register are separated
- [ ] Missing evidence is visible
- [ ] Conditions before approval are concrete
- [ ] No autonomous financial commitment is implied

**Red Flags:**

- Recommends approval despite missing core evidence
- Ignores downside or non-financial risks
- Treats estimates as verified facts
- Provides investment instructions instead of due diligence framing

---

## ⚠️ Common Failures

| Common Error | Prevention |
|---|---|
| Optimism bias | Include a downside and failure case |
| Risk list without owners | Assign each mitigation to an owner role |
| No approval boundary | State who must approve and what evidence is needed |
| Overfocus on ROI | Include operational, legal, people, and execution risks |

---

## 💡 Tips

1. Use "conditional go" more often than simple "go" when evidence is incomplete.
2. Ask for the amount at risk early; it controls review depth.
3. Add a hold recommendation when missing evidence is material.
4. Keep the packet decision-grade, not spreadsheet-heavy.

---

## 📊 Ví dụ thực tế / Example

### Input mẫu

```text
Target: Annual maintenance contract with Vendor A.
Amount at risk: 2.5B VND.
Expected benefit: reduce equipment downtime by 12%.
Time horizon: 24 months.
Evidence supplied: current downtime cost, vendor quote, two references.
Known risks: vendor depends on one specialist technician.
Decision deadline: next procurement meeting.
```

### Output mẫu

```markdown
# Investment & Risk Due Diligence Packet

## Decision Summary
- Target: Vendor A annual maintenance contract.
- Amount at risk: 2.5B VND.
- Expected benefit: lower downtime and faster repair response.
- Recommendation category: Conditional Go.

## Risk Register
| Risk | Likelihood | Impact | Severity | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- |
| Key technician dependency | Medium | High | High | Require backup technician clause | Procurement |
| Savings unverified | Medium | Medium | Medium | Validate downtime baseline | Finance |

## Conditions Before Approval
- Add backup technician SLA to contract.
- Validate downtime baseline with operations log.
- Confirm penalty clause for missed response time.

## Decision Boundary
Agent recommendation is advisory. Final approval remains with procurement and
finance leadership.
```

---

## 🔗 Related Skills

- [Finance Analysis System](./01_finance_analysis_system.skill.md)
- [Forecast & Scenario Review](./02_forecast_scenario_review.skill.md)
- [Finance QA Checklist](./04_finance_qa_checklist.skill.md)

---

## 🔗 Next Step

Run [Finance QA Checklist](./04_finance_qa_checklist.skill.md) before submitting
the packet for approval.

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-26 | Canonicalized investment due diligence and financial risk assessment into one decision-grade skill. |

---

*Investment & Risk Due Diligence - CVF v1.5.2 Finance Analytics Skill Library*
