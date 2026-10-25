# Tutorial: Using Agentic Skills (AGT-009 → AGT-014)

**Time:** 25 minutes  
**Level:** Intermediate → Advanced  
**Prerequisites:** [Agent Platform set up](agent-platform.md), [Understanding of Risk Model](risk-model.md)  
**What you'll learn:** How to invoke, configure, and govern 6 advanced agentic skills

---

## Overview

CVF v1.6 expands from **8 to 14 agent tools**. The 6 new skills bring production-grade agentic patterns into CVF's governance framework:

| Skill | What It Does | Risk | When to Use |
|-------|-------------|------|-------------|
| 🔍 **AGT-009: RAG Retrieval** | Searches knowledge bases for relevant context | R2 | When AI answers need grounding in real data |
| 📊 **AGT-010: Data Viz** | Generates chart configurations from data | R1 | When you need interactive visualizations |
| 📄 **AGT-011: Doc Parser** | Extracts structured data from PDF/CSV/images | R1 | When processing uploaded documents |
| 🔄 **AGT-012: Agentic Loop** | Runs multi-step autonomous tasks with persistence | R3 | When building large features step-by-step |
| 🌐 **AGT-013: Browser Auto** | Controls a web browser via Playwright | R3 | When testing or scraping web pages |
| 🔌 **AGT-014: MCP Connector** | Connects to external MCP tool servers | R2 | When integrating third-party tools dynamically |

---

## Understanding Risk Levels

Before using any skill, know what its risk level means:

```
R0 ─── R1 ─── R2 ─── R3 ─── R4
Safe   Low    Medium  High   Blocked
Auto   Auto   Super-  Manual  ──X──
              vised
```

| Risk | Approval | Who Can Use | Audit |
|------|----------|-------------|-------|
| **R1** (AGT-010, 011) | Automatic | All agents, all phases | Logged |
| **R2** (AGT-009, 014) | Supervised — human confirms input | Orchestrator, Builder | Logged + reviewed |
| **R3** (AGT-012, 013) | Manual — requires explicit approval | Orchestrator or Builder only, Build/Review phases only | Full audit trail |

---

## Skill 1: RAG Knowledge Retrieval (AGT-009)

### What It Does

Retrieves relevant documents from a knowledge base using vector search, then injects them as context for AI responses.

### When to Use

- Answer questions grounded in your project documentation
- Search internal wikis, specs, or compliance documents
- Avoid AI hallucination by providing real source material

### How to Invoke

**In Agent Chat:**

```
You: Search our knowledge base for authentication best practices

Agent (Orchestrator): [Invokes AGT-009]
  → Query: "authentication best practices"
  → Knowledge Base: project-docs-kb
  → Max Results: 5

Result:
  📄 Source: auth-guide.md (relevance: 0.94)
  📄 Source: security-checklist.md (relevance: 0.87)
  📄 Source: api-design.md (relevance: 0.72)
```

**In Code (TypeScript):**

```typescript
const result = await agentTools.execute('rag_retrieval', {
  query: 'authentication best practices',
  knowledgeBaseId: 'project-docs-kb',
  maxResults: 5,
  minRelevanceScore: 0.7
});

// result.data = {
//   documents: [
//     { id: 'doc-1', content: '...', source: 'auth-guide.md', score: 0.94 },
//     ...
//   ],
//   totalFound: 12,
//   queryEmbeddingModel: 'text-embedding-3-small'
// }
```

### Governance Controls

- ✅ All retrieved documents logged with IDs and relevance scores
- ✅ Source citations required in AI output
- ✅ PII filtering on retrieved content before injection
- ❌ Cannot retrieve documents without logging
- ❌ Cannot fabricate sources not in the knowledge base

### Common Mistakes

| Mistake | Fix |
|---------|-----|
| Query too vague ("tell me about the project") | Use specific terms: "JWT token refresh flow in auth module" |
| Not setting minimum relevance score | Set `minRelevanceScore: 0.7` to avoid low-quality matches |
| Ignoring source citations | Always display which documents were used |

---

## Skill 2: Data Visualization Generator (AGT-010)

### What It Does

Generates chart configuration JSON from structured data, supporting line, bar, pie, area, and stacked charts.

### When to Use

- Visualize financial data, metrics dashboards
- Create comparison charts from CSV data
- Generate progress tracking visualizations

### How to Invoke

**In Agent Chat:**

```
You: Create a bar chart comparing Q1 vs Q2 revenue by region

Agent (Builder): [Invokes AGT-010]
  → Data: [{ region: "NA", q1: 500, q2: 620 }, { region: "EU", q1: 340, q2: 410 }, ...]
  → Chart Type: bar
  → Title: "Revenue by Region: Q1 vs Q2"

Result:
  📊 Chart config generated (Recharts-compatible JSON)
  → 4 data points, 2 series
```

**In Code (TypeScript):**

```typescript
const chart = await agentTools.execute('data_viz', {
  data: [
    { region: 'North America', q1: 500000, q2: 620000 },
    { region: 'Europe', q1: 340000, q2: 410000 },
    { region: 'Asia Pacific', q1: 280000, q2: 350000 },
  ],
  chartType: 'bar',      // 'line' | 'bar' | 'pie' | 'area' | 'stacked_area'
  xAxis: 'region',
  series: ['q1', 'q2'],
  title: 'Revenue by Region',
  labels: { q1: 'Q1 2026', q2: 'Q2 2026' }
});

// result.data = {
//   config: { /* Recharts-compatible config */ },
//   chartType: 'bar',
//   dataPoints: 3,
//   series: 2
// }
```

### Governance Controls

- ✅ Read-only — data is never modified
- ✅ Chart configs validated against schema
- ✅ No executable code in output
- ❌ Cannot contain JavaScript in chart config
- ❌ Cannot export data outside the session

---

## Skill 3: Document Parser (AGT-011)

### What It Does

Parses documents (PDF, CSV, TXT, images) and extracts structured data based on a schema.

### When to Use

- Extract financial data from uploaded PDF reports
- Parse CSV files for analysis
- Extract text from images (OCR)
- Process contracts, invoices, forms

### How to Invoke

**In Agent Chat:**

```
You: [Uploads quarterly_report.pdf] Extract the revenue table from this report

Agent (Builder): [Invokes AGT-011]
  → File: quarterly_report.pdf (PDF, 2.3 MB)
  → Extraction: "revenue table"
  → Schema: { quarter: string, revenue: number, growth: string }

Result:
  📄 Extracted 4 rows from page 3, table 2
  → Q1: $1.2M (+12%), Q2: $1.4M (+16%), ...
```

**In Code (TypeScript):**

```typescript
const parsed = await agentTools.execute('doc_parse', {
  content: fileBuffer,  // ArrayBuffer or base64
  fileType: 'pdf',      // 'pdf' | 'csv' | 'txt' | 'image'
  extractionSchema: {
    fields: [
      { name: 'quarter', type: 'string' },
      { name: 'revenue', type: 'number' },
      { name: 'growth', type: 'string' }
    ]
  },
  maxPages: 10
});
```

### Governance Controls

- ✅ PII detection runs on all extracted text
- ✅ File size limits enforced (max 10 MB)
- ✅ Supported formats validated (rejects executables)
- ⚠️ PII-flagged content redacted before logging
- ❌ Cannot process executable files (.exe, .sh, .bat)

---

## Skill 4: Agentic Loop Controller (AGT-012) ⚠️ R3

### What It Does

Manages multi-step autonomous task execution. Think of it as a "cruise control" for building features — the agent works through a list of tasks, commits progress via git, and can resume across sessions.

### When to Use

- Building a large feature with 10+ subtasks
- Automated refactoring across many files
- Test generation for an entire module
- Migration workflows (database, API versions)

### ⚠️ Important: R3 Skill — Requires Approval

This skill operates autonomously and modifies files. **You must explicitly approve each session.**

### How to Invoke

**In Agent Chat:**

```
You: Build the user authentication module. Here's the spec: [uploads auth_spec.md]

Agent (Orchestrator): I'll set up an agentic loop with the following plan:
  Tasks:
    1. Create User model and migration
    2. Implement JWT token service
    3. Create login/register endpoints
    4. Add middleware for route protection
    5. Write tests for all endpoints

  Settings:
    → Max iterations: 20
    → Sandbox: project directory only
    → Allowed commands: npm, node, git, cat, ls, grep
    → Auto-commit: after each task
    → Human review: every 5 tasks

  ⚠️ Do you approve this execution plan? [Approve / Modify / Reject]

You: Approve

Agent: [Begins agentic loop...]
  ✅ Task 1/5: Created User model (commit: a3f2b1c)
  ✅ Task 2/5: JWT service implemented (commit: e7d4a9b)
  🔄 Task 3/5: Building endpoints... [in progress]
```

**In Code (TypeScript):**

```typescript
const loop = await agentTools.execute('agentic_loop', {
  taskSpec: authSpecContent,
  featureList: [
    { id: 'f1', name: 'User model', status: 'pending' },
    { id: 'f2', name: 'JWT service', status: 'pending' },
    // ...
  ],
  maxIterations: 20,
  allowedCommands: ['npm', 'node', 'git', 'cat', 'ls', 'grep'],
  projectDir: './src/auth',
  reviewInterval: 5,  // Request human review every N tasks
  autoCommit: true
});
```

### Security Model

```
┌─────────────────────────────────────┐
│  OS-Level Sandbox                   │
│  ┌───────────────────────────────┐  │
│  │  Filesystem Restriction       │  │
│  │  (project directory only)     │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  Bash Allowlist         │  │  │
│  │  │  ls, cat, npm, node,   │  │  │
│  │  │  git, grep, ps, lsof   │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Per-Iteration Governance     │  │
│  │  → Risk check                 │  │
│  │  → Approval validation        │  │
│  │  → Audit logging              │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Governance Controls

- ✅ Iteration limit mandatory (no infinite loops)
- ✅ Bash command allowlist enforced
- ✅ File operations restricted to project directory
- ✅ Progress persisted via git commits
- ✅ Human review at configurable intervals
- ⚠️ Risk auto-escalates after 3 consecutive failures
- ❌ Cannot run commands outside allowlist
- ❌ Cannot access files outside project directory

---

## Skill 5: Browser Automation (AGT-013) ⚠️ R3

### What It Does

Controls a web browser through Playwright. Can navigate pages, read DOM elements, fill forms, click buttons, scroll, search text, and take screenshots.

### When to Use

- End-to-end testing of web applications
- Scraping public data from websites
- Verifying deployment results
- Automated form submission testing

### ⚠️ Important: R3 Skill — Runs in Isolated Container

Browser automation MUST run in a Docker container. Never on your bare machine.

### How to Invoke

**In Agent Chat:**

```
You: Test the login page at http://localhost:3000/login

Agent (Builder): [Invokes AGT-013 in container]
  → Navigate: http://localhost:3000/login
  → Screenshot: login_page.png ✓
  → Read page: Found form with 2 inputs (email, password) + 1 button (Login)
  → Fill form: email="test@example.com", password="***"
  → Click: "Login" button
  → Wait: 2s
  → Screenshot: after_login.png ✓
  → Result: Redirected to /dashboard — login successful

  📸 Screenshots saved to ./test-results/
```

**In Code (TypeScript):**

```typescript
const result = await agentTools.execute('browser_auto', {
  url: 'http://localhost:3000/login',
  actions: [
    { type: 'screenshot', name: 'initial' },
    { type: 'read_page', filter: 'interactive' },
    { type: 'form_input', ref: 'email-input', value: 'test@example.com' },
    { type: 'form_input', ref: 'password-input', value: 'Test123!' },
    { type: 'left_click', ref: 'login-button' },
    { type: 'wait', duration: 2 },
    { type: 'screenshot', name: 'after-login' },
  ],
  domainAllowlist: ['localhost:3000'],
  timeout: 30000
});
```

### Safety Rules

| Rule | Enforcement |
|------|------------|
| Container isolation | Docker with XVFB virtual display |
| Domain allowlist | Only navigate to pre-approved domains |
| No credentials | Never type real passwords (use test data) |
| Action logging | Every click, type, and navigation logged |
| Time limit | Session auto-terminates after timeout |
| Human approval | Required for any domain not in allowlist |

---

## Skill 6: MCP Server Connector (AGT-014)

### What It Does

Connects to external [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers to discover and invoke third-party tools dynamically.

### When to Use

- Integrating external databases, APIs, or services
- Connecting to specialized AI tools (code analysis, search engines)
- Dynamic tool discovery without hardcoding integrations

### How to Invoke

**In Agent Chat:**

```
You: Connect to the GitHub MCP server and list my open issues

Agent (Orchestrator): [Invokes AGT-014]
  → Server: github-mcp (stdio)
  → Command: npx @modelcontextprotocol/server-github
  → Discovered tools: list_issues, create_issue, search_repos, ...
  → Invoke: list_issues(state="open", per_page=10)

Result:
  📋 5 open issues found:
  1. #42 — Fix login redirect (bug, high)
  2. #38 — Add dark mode support (feature, medium)
  ...
```

**In Code (TypeScript):**

```typescript
const result = await agentTools.execute('mcp_connect', {
  server: {
    type: 'stdio',
    command: 'npx',
    args: ['@modelcontextprotocol/server-github'],
    env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN }
  },
  toolName: 'list_issues',
  toolParams: { state: 'open', per_page: 10 },
  timeout: 15000
});
```

### Governance Controls

- ✅ Server must be in the approved server list
- ✅ Connection timeout enforced (default 15s)
- ✅ Tool schema validated before invocation
- ✅ All results logged with server ID and tool name
- ❌ Cannot connect to unapproved servers
- ❌ Cannot invoke tools without schema validation
- ❌ Cannot bypass timeout limits

---

## Quick Decision Guide

Use this flowchart to pick the right skill:

```
What do you need?
│
├── Answer questions with real data?
│   └── AGT-009: RAG Retrieval (R2)
│
├── Create charts from data?
│   └── AGT-010: Data Viz (R1)
│
├── Extract data from files?
│   └── AGT-011: Doc Parser (R1)
│
├── Build something with many steps?
│   └── AGT-012: Agentic Loop (R3) ⚠️
│
├── Test or interact with a website?
│   └── AGT-013: Browser Auto (R3) ⚠️
│
└── Connect to external tools/APIs?
    └── AGT-014: MCP Connector (R2)
```

---

## Combining Skills

These skills work best together. Common combinations:

### Document Analysis Pipeline

```
AGT-011 (Parse PDF) → AGT-010 (Visualize data) → AGT-009 (Search for context)
```

Upload a financial report → Extract tables → Create charts → Search knowledge base for comparisons.

### Automated Build Workflow

```
AGT-009 (Search specs) → AGT-012 (Agentic loop) → AGT-013 (Browser test)
```

Retrieve requirements → Build feature step-by-step → Verify in browser.

### Tool Integration Pipeline

```
AGT-014 (MCP connect) → AGT-011 (Parse results) → AGT-010 (Visualize)
```

Connect to external API → Parse response data → Create dashboard chart.

---

## Governance Summary

| Skill | Risk | Approval | Phases | Roles | Audit |
|-------|------|----------|--------|-------|-------|
| AGT-009 RAG | R2 | Supervised | All | All | Sources logged |
| AGT-010 Viz | R1 | Auto | Build, Review | Architect, Builder | Config logged |
| AGT-011 Parse | R1 | Auto | All | All | PII-filtered |
| AGT-012 Loop | R3 | **Manual** | Build, Review | **Orchestrator** | Full trail |
| AGT-013 Browser | R3 | **Manual** | **Build only** | **Builder** | Screenshots + actions |
| AGT-014 MCP | R2 | Supervised | Build, Review | Orchestrator, Builder | Server + tool logged |

---

## Related Resources

- [Agentic Patterns Analysis](/docs/agentic-patterns) — Deep dive into the patterns behind these skills
- [Risk Model](/docs/risk-model) — Understanding R0-R3 risk levels
- [Agent Platform](/docs/agent-platform) — Multi-agent workflow setup
- [Custom Skills](/docs/custom-skills) — Creating your own skills
- [Governance Model](/docs/governance-model) — How governance controls work
