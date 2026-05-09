# Agent Skills Catalog — 34 Skills by Domain

**Total:** 34 skills | **Risk:** R0(5) R1(11) R2(14) R3(4)

All agent skills organized into **7 domains** by function, with relationship mapping between skills.

---

## Risk Legend

| Level | Meaning | Approval |
|-------|---------|----------|
| **R0** | Safe — no side effects | Auto |
| **R1** | Low — read-only or advisory | Auto |
| **R2** | Medium — writes, external calls, costs | Supervised |
| **R3** | High — autonomous execution, system access | Manual |

---

## Domain 1: Foundation & Utilities

> Core tools that other skills depend on. Present since v1.0.

| # | Skill | Risk | What It Does |
|---|-------|------|-------------|
| AGT-001 | **Web Search** | R2 | Search the web for information |
| AGT-002 | **Code Execute** | R3 | Run code in a sandboxed environment |
| AGT-003 | **Calculator** | R0 | Math operations, unit conversions |
| AGT-004 | **DateTime** | R0 | Date/time parsing, timezone conversions |
| AGT-005 | **JSON Parse** | R0 | Parse and transform JSON structures |
| AGT-006 | **URL Fetch** | R2 | Fetch content from URLs |
| AGT-007 | **File Read** | R1 | Read files from the project |
| AGT-008 | **File Write** | R2 | Write/modify project files |

**Relationships:**
- AGT-007 + AGT-008 are used by almost all other skills (file I/O)
- AGT-001 + AGT-006 provide data for AGT-009 (RAG), AGT-016 (Research)
- AGT-002 is the execution engine for AGT-012 (Agentic Loop), AGT-026 (Testing)

---

## Domain 2: Agentic Patterns

> AI-powered patterns from Anthropic's Claude Quickstarts. Build intelligent data pipelines, autonomous loops, and tool integrations.

| # | Skill | Risk | What It Does |
|---|-------|------|-------------|
| AGT-009 | **RAG Knowledge Retrieval** | R2 | Vector search + knowledge base retrieval |
| AGT-010 | **Data Visualization** | R1 | Generate charts and visual dashboards |
| AGT-011 | **Document Parser** | R1 | Extract structured data from documents |
| AGT-012 | **Agentic Loop Controller** | R3 | Multi-step autonomous task execution |
| AGT-013 | **Browser Automation** | R3 | Playwright-based web interaction |
| AGT-014 | **MCP Server Connector** | R2 | Connect to external MCP tool servers |

**Relationships:**
- AGT-009 (RAG) ← uses AGT-001 (Search) + AGT-006 (Fetch) for data
- AGT-012 (Loop) ← uses AGT-002 (Execute) for code steps
- AGT-013 (Browser) ← often orchestrated by AGT-012 (Loop)
- AGT-014 (MCP) → extended by AGT-024 (Isolation) and AGT-032 (Builder)

> **Detailed tutorial:** [Using Agentic Skills](using-agentic-skills)

---

## Domain 3: Workflow & Research

> Automation hooks, scientific research workflows, document conversion, multi-agent coordination, and analytics.

| # | Skill | Risk | What It Does |
|---|-------|------|-------------|
| AGT-015 | **Workflow Automation Hook** | R2 | Pre/post-tool automation triggers |
| AGT-016 | **Scientific Research Assistant** | R1 | Structured research methodology |
| AGT-017 | **Document Format Converter** | R1 | Convert between PDF, DOCX, XLSX, etc. |
| AGT-018 | **Agent Team Orchestrator** | R3 | Coordinate multiple specialized agents |
| AGT-019 | **Skill Progressive Loader** | R0 | Load skills on-demand by context |
| AGT-020 | **Analytics Dashboard Generator** | R1 | Real-time session monitoring dashboards |

**Relationships:**
- AGT-018 (Teams) ← coordinates AGT-012 (Loop) instances as sub-agents
- AGT-019 (Loader) → manages loading of ALL other skills dynamically
- AGT-020 (Analytics) ← uses AGT-010 (Visualization) for chart rendering
- AGT-015 (Hook) → triggers before/after any skill execution
- AGT-016 (Research) ← feeds AGT-009 (RAG) and AGT-011 (Parser)

> **Detailed tutorial:** [Workflow & Research Skills](using-new-skills-v2)

---

## Domain 4: Intelligence & Problem-Solving

> Meta-reasoning capabilities — optimize context, choose strategies, debug systematically, and isolate tool environments.

| # | Skill | Risk | What It Does |
|---|-------|------|-------------|
| AGT-021 | **Context Engineering Optimizer** | R1 | Optimize token usage, detect degradation |
| AGT-022 | **Problem-Solving Framework Router** | R0 | Match stuck-type to solving technique |
| AGT-023 | **Systematic Debugging Engine** | R2 | 4-phase debugging with verification |
| AGT-024 | **MCP Context Isolation Manager** | R2 | Sandbox MCP tools via dedicated subagent |

**Relationships:**
- AGT-022 (Router) → dispatches to AGT-023 (Debug) when stuck-type = "bug"
- AGT-023 (Debug) ← uses AGT-002 (Execute) to verify fixes
- AGT-024 (Isolation) ← wraps AGT-014 (MCP Connector) in sandbox
- AGT-021 (Context) → improves performance of all R2/R3 skills via token management
- AGT-023 (Debug) → validated by AGT-031 (Code Review) for evidence

> **Detailed tutorial:** [Intelligence Skills](intelligence-skills-v3)

---

## Domain 5: Full-Stack Development

> Design APIs, build frontends, manage databases, enforce security, and run comprehensive tests.

| # | Skill | Risk | What It Does |
|---|-------|------|-------------|
| AGT-025 | **API Architecture Designer** | R1 | REST/GraphQL/gRPC design methodology |
| AGT-026 | **Full-Stack Testing Engine** | R2 | Testing pyramid 70-20-10, CI gates |
| AGT-027 | **Security & Auth Guard** | R2 | OWASP Top 10, OAuth 2.1, auth strategy |
| AGT-028 | **Database Schema Architect** | R1 | Schema patterns, DB selection, migration |
| AGT-029 | **Frontend Component Forge** | R1 | Component architecture, Suspense patterns |

**Relationships:**
- **Design trio:** AGT-025 (API) → AGT-028 (Database) → AGT-029 (Frontend) — design flows top-down
- AGT-026 (Testing) ← validates ALL other skills in this domain
- AGT-027 (Security) ← protects AGT-025 (API) and AGT-028 (Database)
- AGT-025 (API) → feeds AGT-030 (Deployment) for infra planning
- AGT-026 (Testing) → validated by AGT-031 (Code Review)

> **Detailed tutorial:** [App Development Skills](app-dev-skills-v4)

---

## Domain 6: DevOps & AI Integration

> Deploy to cloud, enforce code review standards, build MCP servers, and process multimedia with AI.

| # | Skill | Risk | What It Does |
|---|-------|------|-------------|
| AGT-030 | **Cloud Deployment Strategist** | R2 | Platform selection, Docker, K8s, GitOps |
| AGT-031 | **Code Review & Verification Gate** | R1 | Evidence-before-claims review methodology |
| AGT-032 | **MCP Server Builder** | R2 | Build production MCP servers (Python/TS) |
| AGT-033 | **AI Multimodal Processor** | R2 | Audio/image/video/document AI processing |

**Relationships:**
- AGT-030 (Deploy) ← takes output from AGT-025→029 (Development domain)
- AGT-031 (Review) ← validates AGT-023 (Debug) and AGT-026 (Testing) claims
- AGT-032 (MCP Builder) ← extends AGT-014 (Connector) and AGT-024 (Isolation)
- AGT-033 (Multimodal) ← uses AGT-025 (API) for endpoint design and AGT-028 (DB) for storage

> **Detailed tutorial:** [DevOps & AI Skills](devops-ai-skills-v5)

---

## Domain 7: Business Operations

> Governed workflows for non-technical operators — Sales, Marketing, Product, Ops, Finance, Strategy. Inspired by "The Operator's Guide to Opus 4.6".

| # | Skill | Risk | What It Does |
|---|-------|------|-------------|
| AGT-034 | **Operator Workflow Orchestrator** | R2 | 10 governed business workflows with verification gates |

### 10 Workflow Templates

| # | Workflow | Category | Connector | Risk |
|---|---------|----------|-----------|------|
| 1 | Pipeline Risk Manager | Revenue | CRM (HubSpot/Salesforce) | R2 |
| 2 | Signal-Based Prospecting | Revenue | Agentic Search | R2 |
| 3 | Ad Spend Watchdog | Revenue | Google/Meta CSV | R2 |
| 4 | Content Distribution Engine | Revenue | Text input | R1 |
| 5 | Voice of Customer Engine | Product & Ops | Intercom/Zendesk | R2 |
| 6 | Product Manager's Weekly | Product & Ops | Jira + Notion | R2 |
| 7 | Process Surgeon | Product & Ops | File upload (1M tokens) | R2 |
| 8 | Meeting Optimizer | Product & Ops | Google Calendar | R2 |
| 9 | Financial Analysis Protocol | Finance | SEC filings / uploads | R2 |
| 10 | Competitive Intelligence Swarm | Strategy | Agentic Search (swarm) | R3 |

**CVF Governance overlay on every workflow:**
- Verification gates (cross-check AI output with source systems)
- Confidence scoring (Verified / Inferred / Speculative)
- Human-in-the-loop for all write actions (no auto-send emails, no auto-schedule)
- Escalation rules for sensitive content (legal, financial, enterprise)
- Audit trail for compliance

**Relationships:**
- AGT-034 ← uses AGT-018 (Agent Teams) for swarm workflows (#10)
- AGT-034 ← uses AGT-021 (Context Engineering) for large document analysis (#7)
- AGT-034 ← uses AGT-031 (Code Review) verification methodology for all outputs
- AGT-034 ← uses AGT-015 (Workflow Hook) for pre/post-workflow automation

> **Detailed tutorial:** [Operator Workflows](operator-workflows)

---

## Complete Relationship Map

```
                    ┌─────────────────────────────────────────┐
                    │     Domain 1: Foundation & Utilities     │
                    │  AGT-001→008 (search, execute, files…)  │
                    └──────────┬──────────┬───────────────────┘
                               │          │
              ┌────────────────┘          └────────────────┐
              ▼                                            ▼
 ┌────────────────────────┐              ┌────────────────────────────┐
 │ Domain 2: Agentic      │              │ Domain 3: Workflow         │
 │ AGT-009→014            │◄────────────►│ AGT-015→020               │
 │ RAG, Viz, Parser,      │  orchestrate │ Hooks, Research, Teams,   │
 │ Loop, Browser, MCP     │              │ Loader, Analytics         │
 └──────────┬─────────────┘              └────────────┬──────────────┘
            │                                         │
            ▼                                         ▼
 ┌────────────────────────┐              ┌────────────────────────────┐
 │ Domain 4: Intelligence │              │ Domain 5: Development     │
 │ AGT-021→024            │◄────────────►│ AGT-025→029               │
 │ Context, Router,       │   debug+test │ API, Testing, Security,   │
 │ Debug, Isolation       │              │ Database, Frontend        │
 └──────────┬─────────────┘              └────────────┬──────────────┘
            │                                         │
            └────────────────┐   ┌────────────────────┘
                             ▼   ▼
              ┌────────────────────────────┐
              │ Domain 6: DevOps & AI     │
              │ AGT-030→033               │
              │ Deploy, Review, MCP Build, │
              │ Multimodal                │
              └────────────────────────────┘
```

---

## By Risk Level

### R0 — Auto (5 skills)
Calculator, DateTime, JSON Parse, Skill Progressive Loader, Problem-Solving Router

### R1 — Auto (11 skills)
File Read, Data Viz, Doc Parser, Scientific Research, Doc Converter, Analytics Dashboard, Context Optimizer, API Architecture, Database Schema, Frontend Forge, Code Review Gate

### R2 — Supervised (14 skills)
Web Search, URL Fetch, File Write, RAG Retrieval, MCP Connector, Workflow Hook, Systematic Debug, MCP Isolation, Full-Stack Testing, Security Guard, Cloud Deploy, MCP Builder, AI Multimodal, Operator Workflow

### R3 — Manual (4 skills)
Code Execute, Agentic Loop, Browser Automation, Agent Team Orchestrator
