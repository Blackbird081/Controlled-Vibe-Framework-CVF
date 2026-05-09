# Operator Workflows — 10 Governed Business Templates

**Time:** 20 minutes  
**Level:** Beginner → Intermediate (no coding required)  
**Prerequisites:** [Getting Started](getting-started), basic understanding of CVF risk levels  
**What you'll learn:** How to run business automation workflows with CVF governance — verification gates, confidence scoring, and human-in-the-loop controls

---

## The Operator Paradigm

CVF was built for developers. But the same governance principles — **risk classification, verification gates, evidence-before-claims** — apply perfectly to business operations.

This tutorial gives you **10 ready-to-use prompt templates** for Sales, Marketing, Product, Ops, Finance, and Strategy — each wrapped in CVF governance.

### What CVF Adds (That Raw AI Doesn't)

| Raw AI | CVF-Governed |
|--------|-------------|
| "Here are your deals" | "Here are your deals. Total: 47. CRM dashboard shows 47. ✅ Verified." |
| "I drafted 5 emails" | "5 drafts ready. Confidence: 3 High, 2 Medium. ⚠️ Requires human review before send." |
| "Revenue forecast: $2.1M" | "Forecast: $2.1M. Source: 23 deals, 8 flagged stale. ⚠️ 3 estimates used." |

---

## Quick Start: Pick Your Workflow

| # | Workflow | For | Risk |
|---|---------|-----|------|
| 1 | [Pipeline Risk Manager](#workflow-1) | Sales | R2 |
| 2 | [Signal-Based Prospecting](#workflow-2) | Sales | R2 |
| 3 | [Ad Spend Watchdog](#workflow-3) | Marketing | R2 |
| 4 | [Content Distribution Engine](#workflow-4) | Marketing | R1 |
| 5 | [Voice of Customer Engine](#workflow-5) | Support | R2 |
| 6 | [Product Manager's Weekly](#workflow-6) | Product | R2 |
| 7 | [Process Surgeon](#workflow-7) | Operations | R2 |
| 8 | [Meeting Optimizer](#workflow-8) | All | R2 |
| 9 | [Financial Analysis Protocol](#workflow-9) | Finance | R2 |
| 10 | [Competitive Intelligence Swarm](#workflow-10) | Strategy | R3 |

---

## Revenue Operations

### Workflow 1: Pipeline Risk Manager {#workflow-1}
**Risk:** R2 | **Connector:** CRM (HubSpot/Salesforce)

**Copy this prompt:**
```
Access [CRM]. Retrieve all active deals assigned to me
with close date in current quarter.

1. Create table: Deal Name, Amount, Stage, Last Activity Date
2. Flag any deal >$[threshold] with no activity in 7+ days
3. Generate forecast: likely to close this month vs. push to next Q

VERIFICATION (required):
- State total deal count. Cross-check against CRM dashboard.
- Report any discrepancy between your count and dashboard.
- Mark stale deals clearly with ⚠️
```

**Why the verification step matters:** AI can miss deals or double-count. The cross-check catches errors before they hit your forecast.

---

### Workflow 2: Signal-Based Prospecting {#workflow-2}
**Risk:** R2 | **Connector:** Web Search

**Copy this prompt:**
```
Run signal-based prospecting campaign:

1. Search for companies engaging with [Competitor Name]
2. Filter by ICP: [industry], [employee count], [region]
3. Analyze top 5: tech stack via job postings
4. Draft personalized outreach for VP of [Department]

OUTPUT FORMAT — Table with columns:
Company | Signal Found | Tech Stack | Draft Email | Confidence

GOVERNANCE:
- Confidence: High (direct evidence) / Medium (inferred) / Low (speculation)
- DO NOT auto-send. All emails require my approval.
- Flag any company where data is >30 days old.
```

---

### Workflow 3: Ad Spend Watchdog {#workflow-3}
**Risk:** R2 | **Connector:** CSV Upload

**Copy this prompt:**
```
Analyze uploaded Ad Spend reports (Google Ads + Meta):

1. Compare yesterday's CPA vs 7-day rolling average
2. Flag campaigns where CPA increased >20% overnight
3. Identify top 3 creatives by ROAS
4. Format as Slack-ready update for #marketing-team

DATA INTEGRITY CHECK:
- Show total spend sum → I will verify against account
- Show date range processed → confirm completeness
- Mark any missing campaigns or data gaps with ⚠️
```

---

### Workflow 4: Content Distribution Engine {#workflow-4}
**Risk:** R1 (read + transform only — no external actions)

**Copy this prompt:**
```
Read this content: [paste blog post or URL]

Create distribution assets:
1. LinkedIn: PAS (Problem-Agitate-Solution) framework, 1200 chars max
2. Twitter/X: 6-tweet thread, punchy short sentences
3. Newsletter: 150-word teaser that drives clicks
4. Slack: 1-sentence internal announcement

QUALITY CHECK:
- Each asset must reference source content accurately
- No hallucinated statistics or quotes
- Maintain consistent brand voice across all 4 formats
```

---

## Product & Operations

### Workflow 5: Voice of Customer Engine {#workflow-5}
**Risk:** R2 | **Connector:** Intercom/Zendesk

**Copy this prompt:**
```
Access [Ticketing System]. Pull last 50 unassigned tickets.

1. Categorize:
   🔴 Critical (billing, outages)
   🟡 High (bug reports)
   🟢 Routine (how-to questions)

2. Routine: Draft response + link to Help Center article
3. Critical: Summarize + recommend engineer by feature area

GOVERNANCE:
- Never auto-send responses — draft only
- Flag tickets mentioning legal/compliance/security
- Enterprise tier tickets → notify account manager
- Show categorization counts for my verification
```

---

### Workflow 6: Product Manager's Weekly {#workflow-6}
**Risk:** R2 | **Connector:** Jira + Notion

**Copy this prompt:**
```
Write Weekly Product Update:

1. Jira: Summarize tickets moved to 'Done' this week in [Project]
2. Notion: Read [Meeting Notes] from [Day]
3. Combine into exec report:
   - ✅ What shipped (with ticket IDs)
   - 🚧 What's blocked (with owners)
   - ⚠️ Timeline risks

VERIFICATION:
- State total 'Done' ticket count from Jira
- Cross-check: does shipped list match that count?
- Flag any ticket that moved to Done without QA sign-off
```

---

### Workflow 7: Process Surgeon {#workflow-7}
**Risk:** R2 | **Connector:** File Upload (large context)

**Copy this prompt:**
```
Uploading: [N] SOP PDFs + [M] months of Incident Reports

CONTEXT VERIFICATION (run first):
- Confirm total documents loaded: [expected count]
- Confirm date range of incident data
- Flag any corrupted or unreadable documents

ANALYSIS:
1. Map theoretical process from SOPs
2. Compare to actual failures in incident reports
3. Identify the specific bottleneck step
4. Rewrite that SOP section with the fix

OUTPUT:
- Before/After comparison of the SOP section
- Cite specific incident IDs supporting each recommendation
- Confidence: which findings are data-backed vs. inferred
```

---

### Workflow 8: Meeting Optimizer {#workflow-8}
**Risk:** R2 | **Connector:** Google Calendar

**Copy this prompt:**
```
Schedule [duration] meeting: [Title]
Participants: [Name (timezone)] × N

1. Check all calendars for next week
2. Find slot minimizing outside-hours impact
3. Present 3 best options ranked by fairness score

DO NOT send invite.
Present options → I choose → then draft the invite.
Include suggested agenda: [your agenda here]
```

---

## Finance & Strategy

### Workflow 9: Financial Analysis Protocol {#workflow-9}
**Risk:** R2 | **Connector:** Financial Data / File Upload

**Copy this prompt:**
```
PHASE 1 — RETRIEVE:
Access last [N] quarters of filings for [Company/Ticker]

PHASE 2 — ANALYZE:
- YoY growth of [Business Segment]
- Operating Margin trend vs top 2 competitors
- New Risk Factors in latest filing (vs prior year)

PHASE 3 — CREATE:
- Investment Memo with Thesis + Bear Case

MANDATORY GOVERNANCE:
- Cite exact filing source for every data point
- Flag any metric that required estimation with ⚠️
- Include disclaimer: "AI-generated analysis. Not investment
  advice. Verify all figures independently."
```

---

### Workflow 10: Competitive Intelligence Swarm {#workflow-10}
**Risk:** R3 (multi-agent — requires manual review)

**Copy this prompt:**
```
Competitive landscape analysis: [Market/Industry]

Spawn 3 parallel research agents:
• Agent A (Pricing): Map pricing tiers of [3 competitors]
• Agent B (Sentiment): Reddit/Twitter pain points, last 30 days
• Agent C (Features): Release notes, last 90 days

R3 GOVERNANCE (mandatory):
1. Present each agent's report SEPARATELY first
2. Each report must cite sources with URLs
3. I review each report for accuracy ← REQUIRED STEP
4. Only then proceed to synthesis
5. Mark all claims: ✅ Verified | 🟡 Inferred | 🔴 Speculative

SYNTHESIS: Market Opportunity Matrix — where is the gap?
```

---

## The Operator's Verification Checklist

Use this **before acting on any AI-generated business output**:

```
□ DATA COMPLETENESS — Did AI process all expected records?
□ SUM CHECK — Do totals match source system dashboards?
□ SOURCE CITATION — Are specific records/URLs cited?
□ CONFIDENCE LEVEL — Is each claim marked with confidence?
□ BIAS CHECK — Could AI be optimizing for what I want to hear?
□ FRESHNESS — Is the data current (check dates)?
□ ESCALATION — Does this touch legal/financial/enterprise?
```

---

## What's Next?

- See the full governance spec: [AGT-034 Operator Workflow Orchestrator](../../../governance/skill-library/registry/agent-skills/AGT-034_OPERATOR_WORKFLOW_ORCHESTRATOR.gov.md)
- Browse all 34 skills: [Agent Skills Catalog](agent-skills-catalog)
- Learn CVF risk model: [Risk Model](risk-model)
