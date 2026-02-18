# AGT-034: Operator Workflow Orchestrator

> **Risk Level:** R2 — Supervised  
> **Autonomy:** Supervised — connects to external business systems, executes multi-step workflows  
> **Roles:** Orchestrator, Operator, Architect  
> **Phase Gates:** Discovery (workflow mapping), Design (prompt design), Build (connector integration), Review (output verification)  
> **Version:** 1.6.6  
> **Source Inspiration:** "The Operator's Guide to Opus 4.6" (LeadPanther), CVF Business Enablement  
> **Dependencies:** AGT-018 (Agent Team Orchestrator), AGT-021 (Context Engineering Optimizer), AGT-015 (Workflow Automation Hook)

---

## Purpose

Bridge CVF governance to **business operator workflows** — enabling non-technical users (Sales, Marketing, Ops, Finance, Strategy) to leverage AI agent capabilities with proper risk management, verification gates, and audit trails.

Key innovation: Apply CVF's "Controlled Autonomy" philosophy to business automation — not just developer tooling.

---

## The Operator Paradigm

### Who Is an Operator?

| Role | Focus | CVF Value |
|------|-------|-----------|
| Head of Sales | Pipeline, forecasting, prospecting | Risk-assessed CRM automation |
| VP Marketing | Content, ad spend, distribution | Governed multi-channel workflows |
| Product Manager | Roadmap, tickets, status reports | Verified cross-tool synthesis |
| COO / Ops Lead | SOPs, incident analysis, scheduling | Context-managed document analysis |
| CFO / Finance | SEC filings, investment memos | Auditable financial analysis |
| CEO / Founder | Competitive landscape, strategy | Governed agent swarm research |

### Operator vs Developer Workflow

```
Developer Path (existing CVF):
  Code → Test → Deploy → Monitor
  Tools: AGT-002 (Execute), AGT-026 (Testing), AGT-030 (Deploy)

Operator Path (AGT-034):
  Connect → Prompt → Verify → Act
  Tools: Connectors, Prompt Templates, Verification Gates, Output Validation
```

---

## Connector Architecture

### Connector Types & Risk Mapping

| Connector Category | Examples | CVF Risk | Governance |
|-------------------|----------|----------|------------|
| **Read-Only Data** | CRM read, calendar view, ticket list | R1 | Auto — no side effects |
| **Data Synthesis** | Cross-tool reports, document analysis | R2 | Supervised — verify accuracy |
| **Write Actions** | Send email, create ticket, schedule meeting | R2 | Supervised — confirm before execute |
| **Financial Data** | SEC filings, spending reports, forecasts | R2 | Supervised — audit trail required |
| **Agent Swarms** | Parallel research, competitive analysis | R3 | Manual — review each agent output |

### Connector Security Checklist

```
□ OAuth 2.0 authentication (never API keys in prompts)
□ Permission scoping (read-only by default)
□ Data residency compliance (GDPR, CCPA)
□ User-level access control (inherit business tool permissions)
□ Audit logging enabled for all connector actions
□ PII detection before outputting results
```

---

## 10 Governed Business Workflows

### Category 1: Revenue Operations (Sales & Marketing)

#### Workflow 1: Pipeline Risk Manager
**Risk:** R2 (CRM data read + analysis)  
**Connector:** CRM (HubSpot/Salesforce)  
**Governance:** Read-only access, no deal modifications

```
Prompt Template:
┌─────────────────────────────────────────────────────────┐
│ Access [CRM]. Retrieve all active deals assigned to me  │
│ with close date in current quarter.                     │
│                                                         │
│ 1. Create table: Deal Name, Amount, Stage, Last Activity│
│ 2. Flag any deal >$[threshold] with no activity >7 days │
│ 3. Generate forecast: likely to close vs. push to next Q│
│                                                         │
│ VERIFICATION: Cross-reference deal count with CRM       │
│ dashboard total. Report any discrepancy.                │
└─────────────────────────────────────────────────────────┘
```

**CVF Addition:** Verification gate — always cross-reference AI output with source system totals.

#### Workflow 2: Signal-Based Prospecting
**Risk:** R2 (web research + email drafting)  
**Connector:** Agentic Search  
**Governance:** No sending — draft only, human reviews before send

```
Prompt Template:
┌─────────────────────────────────────────────────────────┐
│ Run signal-based prospecting campaign:                  │
│                                                         │
│ 1. Search for companies engaging with [Competitor]      │
│ 2. Filter by ICP: [industry], [size], [region]          │
│ 3. Analyze top 5 matches: tech stack via job postings   │
│ 4. Draft personalized outreach for VP of [Department]   │
│                                                         │
│ OUTPUT FORMAT: Table with columns:                      │
│ Company | Signal | Tech Stack | Draft Email | Confidence│
│                                                         │
│ GOVERNANCE: Mark confidence level (High/Medium/Low).    │
│ DO NOT auto-send. All emails require human approval.    │
└─────────────────────────────────────────────────────────┘
```

**CVF Addition:** Confidence scoring + mandatory human-in-the-loop before any outbound action.

#### Workflow 3: Ad Spend Watchdog
**Risk:** R2 (financial data analysis)  
**Connector:** Google Ads/Meta CSV upload  
**Governance:** Read-only analysis, no budget changes

```
Prompt Template:
┌─────────────────────────────────────────────────────────┐
│ Analyze uploaded Ad Spend reports:                      │
│                                                         │
│ 1. Compare yesterday CPA vs 7-day rolling average       │
│ 2. Flag campaigns where CPA increased >20% overnight    │
│ 3. Identify top 3 creatives by ROAS                     │
│ 4. Format as Slack-ready update for #marketing-team     │
│                                                         │
│ VERIFICATION GATE:                                      │
│ - Show total spend sum → verify against account total   │
│ - Show date range processed → confirm completeness      │
│ - Mark any data quality issues (missing campaigns, etc.)│
└─────────────────────────────────────────────────────────┘
```

**CVF Addition:** Data integrity verification — sum-check before reporting.

#### Workflow 4: Content Distribution Engine
**Risk:** R1 (content transformation, no external actions)  
**Connector:** None (text input)  
**Governance:** Auto-approved (read + transform only)

```
Prompt Template:
┌─────────────────────────────────────────────────────────┐
│ Read this content: [URL or paste]                       │
│                                                         │
│ Create distribution assets:                             │
│ 1. LinkedIn: PAS framework, 1200 chars max              │
│ 2. Twitter/X: 6-tweet thread, punchy sentences          │
│ 3. Newsletter: 150-word teaser driving clicks           │
│ 4. Slack: 1-sentence internal announcement              │
│                                                         │
│ QUALITY GATE:                                           │
│ - Each asset must reference source content accurately   │
│ - No hallucinated statistics or quotes                  │
│ - Maintain brand voice consistency across all 4 formats │
└─────────────────────────────────────────────────────────┘
```

---

### Category 2: Product & Operations

#### Workflow 5: Voice of Customer Engine
**Risk:** R2 (ticket system access + response drafting)  
**Connector:** Intercom/Zendesk  
**Governance:** Draft responses only — human sends

```
Prompt Template:
┌─────────────────────────────────────────────────────────┐
│ Access [Ticketing System]. Pull last 50 unassigned.     │
│                                                         │
│ 1. Categorize: Critical (billing/outage), High (bugs),  │
│    Routine (how-to)                                     │
│ 2. Routine: Draft response + link to Help Center article│
│ 3. Critical: Summarize + recommend engineer by feature  │
│                                                         │
│ GOVERNANCE RULES:                                       │
│ - Never auto-send responses                             │
│ - Flag tickets mentioning legal/compliance/security     │
│ - Escalation: Any ticket from enterprise tier → notify  │
│   account manager immediately                           │
└─────────────────────────────────────────────────────────┘
```

**CVF Addition:** Escalation rules for sensitive tickets.

#### Workflow 6: Product Manager's Weekly
**Risk:** R2 (cross-tool data synthesis)  
**Connector:** Jira + Notion  
**Governance:** Verify ticket counts against Jira dashboard

```
Prompt Template:
┌─────────────────────────────────────────────────────────┐
│ Write Weekly Product Update:                            │
│                                                         │
│ 1. Jira: Summarize tickets moved to 'Done' this week   │
│    in [Project Name]                                    │
│ 2. Notion: Read [Meeting Notes] from [Day]              │
│ 3. Combine into exec report:                            │
│    - What shipped                                       │
│    - What's blocked                                     │
│    - Timeline risks                                     │
│                                                         │
│ VERIFICATION: State total ticket count from Jira.       │
│ Cross-check: does the "shipped" list match Done count?  │
└─────────────────────────────────────────────────────────┘
```

#### Workflow 7: Process Surgeon (Large Context)
**Risk:** R2 (massive document analysis)  
**Connector:** File upload (1M token context)  
**Governance:** Context quality verification before analysis

```
Prompt Template:
┌─────────────────────────────────────────────────────────┐
│ Uploading: [N] SOP PDFs + [M] months Incident Reports  │
│                                                         │
│ CONTEXT VERIFICATION (run first):                       │
│ - Confirm total documents loaded: [expected count]      │
│ - Confirm date range of incident data: [expected range] │
│ - Flag any corrupted/unreadable documents               │
│                                                         │
│ ANALYSIS:                                               │
│ 1. Map theoretical process from SOPs                    │
│ 2. Compare to actual failures in incident reports       │
│ 3. Identify specific bottleneck step                    │
│ 4. Rewrite that SOP section to fix the issue            │
│                                                         │
│ OUTPUT: Before/After comparison of the SOP section.     │
│ EVIDENCE: Cite specific incident IDs that support each  │
│ recommendation.                                         │
└─────────────────────────────────────────────────────────┘
```

**CVF Addition:** Context verification step + evidence-based recommendations (aligns with AGT-031 Code Review principles).

#### Workflow 8: Meeting Optimizer
**Risk:** R2 (calendar access + scheduling)  
**Connector:** Google Calendar  
**Governance:** Propose only — human confirms invite

```
Prompt Template:
┌─────────────────────────────────────────────────────────┐
│ Schedule [duration] meeting: [Title]                    │
│ Participants: [Name (TZ)], [Name (TZ)], [Name (TZ)]    │
│                                                         │
│ 1. Check all calendars for next week                    │
│ 2. Find slot minimizing outside-hours pain              │
│ 3. Draft calendar invite with agenda: [Agenda]          │
│                                                         │
│ OUTPUT: 3 best slot options ranked by fairness score.   │
│ DO NOT send invite. Present options for human selection. │
└─────────────────────────────────────────────────────────┘
```

---

### Category 3: Finance & Strategy

#### Workflow 9: Financial Analysis Protocol
**Risk:** R2 (financial data, audit-critical)  
**Connector:** Financial data source / File upload  
**Governance:** Full audit trail, no investment recommendations without disclaimers

```
Prompt Template:
┌─────────────────────────────────────────────────────────┐
│ PHASE 1 — RETRIEVE:                                    │
│ Access last [N] quarters of filings for [Ticker]        │
│                                                         │
│ PHASE 2 — ANALYZE:                                     │
│ - YoY growth of [Segment]                               │
│ - Operating Margin trend vs top 2 competitors           │
│ - New Risk Factors in latest filing (vs prior year)     │
│                                                         │
│ PHASE 3 — CREATE:                                      │
│ - Investment Memo with Thesis + Bear Case               │
│                                                         │
│ GOVERNANCE:                                             │
│ - Cite exact filing source for every data point         │
│ - Flag any calculated metric that required estimation   │
│ - Include disclaimer: "AI-generated analysis, not       │
│   investment advice. Verify all figures independently." │
└─────────────────────────────────────────────────────────┘
```

**CVF Addition:** Mandatory source citation + estimation flagging + disclaimer.

#### Workflow 10: Competitive Intelligence Swarm
**Risk:** R3 (multi-agent parallel research, high autonomy)  
**Connector:** Agentic Search (swarm mode)  
**Governance:** Review each agent output individually before synthesis

```
Prompt Template:
┌─────────────────────────────────────────────────────────┐
│ Competitive landscape: [Market/Industry]                │
│                                                         │
│ Spawn 3 parallel research agents:                       │
│ • Agent A (Pricing): Map pricing tiers of [competitors] │
│ • Agent B (Sentiment): Reddit/Twitter pain points       │
│ • Agent C (Features): Release notes, last 90 days       │
│                                                         │
│ SYNTHESIS: Market Opportunity Matrix — where is the gap?│
│                                                         │
│ CVF GOVERNANCE (R3 — Manual Review Required):           │
│ 1. Each agent must cite sources with URLs               │
│ 2. Present individual agent reports BEFORE synthesis    │
│ 3. Human reviews each report for accuracy               │
│ 4. Only then proceed to synthesis                       │
│ 5. Mark confidence: Verified / Inferred / Speculative   │
└─────────────────────────────────────────────────────────┘
```

**CVF Addition:** Individual agent verification before synthesis + 3-tier confidence marking.

---

## CVF Governance Overlay

### What CVF Adds to Every Operator Workflow

| Principle | What It Means for Operators |
|-----------|---------------------------|
| **Risk Classification** | Every workflow has a risk level — know when you need supervision |
| **Verification Gates** | Don't trust output blindly — cross-check with source systems |
| **Evidence-Before-Claims** | AI must cite sources, not just assert facts |
| **Human-in-the-Loop** | Write actions (send email, schedule, modify data) always need human approval |
| **Escalation Rules** | Sensitive content (legal, financial, enterprise clients) auto-escalates |
| **Audit Trail** | Every workflow execution is logged for compliance |
| **Confidence Scoring** | Outputs marked as Verified / Inferred / Speculative |

### The Operator's Verification Checklist

```
Before acting on any AI-generated business output:

□ DATA COMPLETENESS — Did AI process all expected records?
□ SUM CHECK — Do totals match source system dashboards?
□ SOURCE CITATION — Are specific records/URLs cited?
□ CONFIDENCE LEVEL — Is each claim marked with confidence?
□ BIAS CHECK — Could the AI be optimizing for what I want to hear?
□ FRESHNESS — Is the data current (check dates)?
□ ESCALATION — Does this output touch legal/financial/enterprise?
```

---

## Anti-Patterns

### The "Auto-Pilot" Trap

| ❌ Anti-Pattern | ✅ CVF Approach |
|---------------|---------------|
| Let AI send emails directly | AI drafts, human reviews + sends |
| Trust pipeline forecast without checking | Verify deal count against CRM |
| Accept competitive analysis at face value | Review each agent's sources individually |
| Use AI financial analysis as-is | Mandatory disclaimers + independent verification |
| "It said it's done, so it's done" | AGT-031 Iron Law: no claims without fresh evidence |

---

## Integration with CVF Skills

| CVF Skill | How It Supports Operator Workflows |
|-----------|------------------------------------|
| AGT-015: Workflow Hook | Automate pre/post-workflow triggers |
| AGT-018: Agent Teams | Orchestrate parallel research swarms |
| AGT-019: Progressive Loader | Load only needed workflow templates |
| AGT-021: Context Engineering | Optimize large document uploads (1M tokens) |
| AGT-031: Code Review Gate | Verification methodology applies to ALL outputs |
| AGT-033: AI Multimodal | Process uploaded charts, PDFs, presentations |

---

## Metadata

```yaml
id: AGT-034
name: Operator Workflow Orchestrator
version: 1.6.6
risk: R2
autonomy: Supervised
roles: [Orchestrator, Operator, Architect]
phase_gates: [Discovery, Design, Build, Review]
domain: Business Operations
categories:
  - Revenue Operations (Sales & Marketing)
  - Product & Operations
  - Finance & Strategy
workflows: 10
connectors: [CRM, Ticketing, Calendar, Financial, Search, File Upload]
```
