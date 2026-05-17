# Finance QA Checklist

> **Domain:** Finance Analytics  
> **Difficulty:** Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-04-26

---

## 📌 Prerequisites

- A draft finance analysis, forecast, due diligence packet, dashboard review, or
  recommendation is available.
- The intended decision owner and audience are known.
- Source data or assumptions are accessible for spot checks.

---

## 🎯 Mục đích / Purpose

Use this skill as the final QA gate before a finance packet is sent to a user,
manager, leadership team, or implementation agent.

It verifies clarity, evidence, risk boundaries, non-coder readability, and
human approval requirements across all Finance Analytics outputs.

Not suitable when:

- there is no draft output to review
- the user needs primary analysis first; use
  [Finance Analysis System](./01_finance_analysis_system.skill.md)
- the user needs a new forecast or due diligence packet first

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer, Lead |
| Allowed Phases | Review |
| Authority Scope | Informational |
| Autonomy | Auto + Audit |
| Audit Hooks | Evidence trace, assumption check, risk language check, approval boundary check |

---

## ⛔ Execution Constraints

- Do not rewrite the finance packet unless asked; review first.
- Do not approve financial action. Mark readiness and blockers.
- Do not validate numbers as audited truth unless source evidence proves it.
- Distinguish "ready for discussion" from "ready for decision".
- Escalate high-risk, missing-evidence, legal, tax, or investment-advice issues.

---

## ✅ Validation Hooks

- Check every recommendation for evidence, assumption, and owner.
- Check calculations for period, currency, and denominator consistency.
- Check that risk and uncertainty language is not overconfident.
- Check that missing data is visible.
- Check that human approval boundary is explicit.

---

## 🧪 UAT Binding

- UAT Record: [04_finance_qa_checklist](../../../governance/skill-library/uat/results/UAT-04_finance_qa_checklist.md)
- UAT Objective: Review finance outputs for evidence quality, safety, clarity,
  decision readiness, and non-coder usability.

---

## 📋 Form Input

| Field | Description | Required | Example |
|-------|-------------|:--------:|---------|
| Draft output | Finance packet or recommendation to review | ✅ | "Paste analysis packet" |
| Intended audience | Who will read or decide | ✅ | "Operations manager" |
| Decision type | Discussion, approval, budget, investment, forecast | ✅ | "Budget approval" |
| Source data | Numbers or source references used by the packet | ❌ | "Budget export attached" |
| Risk tolerance | Conservative, balanced, aggressive | ❌ | "Conservative" |

---

## ✅ Expected Output

Return a QA review report:

```markdown
# Finance QA Review

## 1. Readiness Verdict
- Status: Ready / Ready with fixes / Blocked
- Reason:
- Required owner:

## 2. Evidence Check
| Claim | Evidence present | Issue | Fix |
| --- | --- | --- | --- |

## 3. Calculation And Consistency Check
| Check | Status | Notes |
| --- | --- | --- |

## 4. Risk And Boundary Check
| Risk | Severity | Required change |
| --- | --- | --- |

## 5. Non-Coder Clarity Check
- Clear:
- Confusing:
- Needs rewrite:

## 6. Required Fixes
1. Fix:
2. Fix:

## 7. Approval Boundary
- Ready for discussion:
- Ready for decision:
- Requires expert review:
```

---

## 🔍 Cách đánh giá / Evaluation Criteria

**Accept Checklist:**

- [ ] Verdict is explicit
- [ ] Evidence gaps are listed
- [ ] Calculation consistency is checked
- [ ] Human approval boundary is visible
- [ ] The user can understand what to fix next

**Red Flags:**

- QA rubber-stamps incomplete analysis
- Ignores high-risk missing data
- Fails to separate discussion readiness from decision readiness
- Rewrites content without preserving the original issue list

---

## ⚠️ Common Failures

| Common Error | Prevention |
|---|---|
| Only proofreading text | Review evidence, assumptions, and risk boundaries |
| No severity levels | Mark issues as blocker, major, or minor |
| Hidden expert dependency | Flag accountant, legal, tax, or investment review needs |
| Too much rewrite | Provide required fixes first |

---

## 💡 Tips

1. Use "Blocked" when core data is missing, even if the writing is polished.
2. Use "Ready with fixes" when only clarity or formatting issues remain.
3. Put the decision owner in the verdict.
4. Keep QA concise enough for a non-coder to act on immediately.

---

## 📊 Ví dụ thực tế / Example

### Input mẫu

```text
Draft output: A forecast packet recommending approval of 300M VND extra budget.
Intended audience: Operations manager.
Decision type: Budget approval.
Source data: budget and actual spend are included, invoice status missing.
Risk tolerance: Conservative.
```

### Output mẫu

```markdown
# Finance QA Review

## Readiness Verdict
- Status: Ready with fixes.
- Reason: core variance is explained, but invoice status is missing.
- Required owner: finance reviewer.

## Evidence Check
| Claim | Evidence present | Issue | Fix |
| --- | --- | --- | --- |
| Extra 300M needed | Partial | invoices not confirmed | add invoice status |

## Required Fixes
1. Add invoice status before approval.
2. Separate urgent spend from optional spend.
3. Add human approval boundary for any amount above 150M VND.

## Approval Boundary
- Ready for discussion: yes.
- Ready for decision: after invoice status is added.
- Requires expert review: finance reviewer.
```

---

## 🔗 Related Skills

- [Finance Analysis System](./01_finance_analysis_system.skill.md)
- [Forecast & Scenario Review](./02_forecast_scenario_review.skill.md)
- [Investment & Risk Due Diligence](./03_investment_risk_due_diligence.skill.md)

---

## 🔗 Next Step

Apply required fixes, then rerun this checklist before final handoff.

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-26 | Added canonical Finance Analytics QA gate for all finance packets. |

---

*Finance QA Checklist - CVF v1.5.2 Finance Analytics Skill Library*
