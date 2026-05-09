# Tutorial: New Skills from claude-code-templates Analysis (AGT-015 → AGT-020)

**Time:** 30 minutes  
**Level:** Intermediate → Advanced  
**Prerequisites:** [Agent Platform set up](agent-platform.md), [Using Agentic Skills v1 (AGT-009–014)](using-agentic-skills.md)  
**What you'll learn:** How to use 6 new skills inspired by claude-code-templates patterns — hooks, scientific research, document conversion, agent teams, progressive loading, and analytics

---

## Overview

CVF v1.6.2 expands from **14 to 20 agent tools** after analyzing the [claude-code-templates](https://github.com/davila7/claude-code-templates) ecosystem (500+ components). These 6 new skills bring powerful patterns into CVF's governance framework:

| Skill | What It Does | Risk | When to Use |
|-------|-------------|------|-------------|
| ⚡ **AGT-015: Workflow Hook** | Pre/post-tool automation triggers | R2 | When you need CI/CD, security scanning, auto-testing |
| 🔬 **AGT-016: Scientific Research** | Literature review, data analysis, hypothesis generation | R1 | When working on research workflows |
| 📄 **AGT-017: Document Converter** | PDF, DOCX, XLSX, PPTX creation and conversion | R1 | When processing or creating documents |
| 👥 **AGT-018: Agent Team** | Multi-agent coordination and orchestration | R3 | When complex tasks need multiple specialized agents |
| 📦 **AGT-019: Progressive Loader** | Dynamic skill loading with context budget management | R0 | Automatic — manages how skills load into context |
| 📊 **AGT-020: Analytics Dashboard** | Real-time session monitoring and metrics | R1 | When tracking AI agent performance and compliance |

---

## Understanding the New Risk Distribution

```
R0 (4 skills) ─── R1 (6 skills) ─── R2 (6 skills) ─── R3 (4 skills)
Safe/Auto         Low/Auto          Medium/Supervised   High/Manual
```

| Risk | New Skills | Approval | Who Can Use |
|------|------------|----------|-------------|
| **R0** (AGT-019) | Skill Progressive Loader | Automatic | All |
| **R1** (AGT-016, 017, 020) | Scientific Research, Doc Converter, Analytics | Automatic | All |
| **R2** (AGT-015) | Workflow Automation Hook | Supervised | Orchestrator, Builder |
| **R3** (AGT-018) | Agent Team Orchestrator | Manual | Orchestrator only |

---

## Skill 1: Workflow Automation Hook (AGT-015)

### What It Does
Manages automation hooks that trigger before or after AI tool actions — similar to git hooks but for AI workflows. Inspired by claude-code-templates' 10-category hook system.

### When to Use
- Secret scanning before code commits
- Auto-running tests after code changes
- Sending notifications (Slack, Telegram) on events
- Linting/validation before tool execution
- Monitoring and logging pipelines

### Chat Prompt Examples
```
"Set up a pre-commit hook that scans for secrets before allowing code commits"
"Add a post-tool hook that runs tests whenever File Write completes"
"Configure a notification hook to alert Slack when deployment finishes"
```

### TypeScript Integration
```typescript
import { WorkflowHookManager } from '@cvf/agent-skills';

const hookManager = new WorkflowHookManager({
  governance: { risk: 'R2', approval: 'supervised' }
});

// Register a pre-tool hook
hookManager.register({
  name: 'secret-scanner',
  event: 'PreToolUse',
  tool: 'file-write',
  priority: 1,
  timeout: 10000,
  action: async (context) => {
    const secrets = scanForSecrets(context.content);
    if (secrets.length > 0) {
      return { block: true, reason: `Found ${secrets.length} potential secrets` };
    }
    return { block: false };
  }
});

// Register a post-tool hook
hookManager.register({
  name: 'auto-test-runner',
  event: 'PostToolUse',
  tool: 'file-write',
  priority: 2,
  action: async (context) => {
    const results = await runTests(context.affectedFiles);
    return { status: results.passed ? 'pass' : 'fail', results };
  }
});
```

### Hook Event Types
| Event | When | Use Case |
|-------|------|----------|
| `PreToolUse` | Before any tool executes | Validation, security scanning |
| `PostToolUse` | After tool completes | Testing, notifications, logging |
| `PreCommit` | Before git commit | Lint checking, format validation |
| `PostCommit` | After git commit | CI trigger, notification |
| `OnError` | When tool encounters error | Error reporting, fallback logic |

### Governance Controls
- **Approval:** Human must approve hook registration
- **Timeout:** 10s max per hook (configurable down, not up)
- **Blocking:** Pre-tool hooks can block execution (fail-open/fail-closed)
- **Audit:** All hook executions logged with full context

---

## Skill 2: Scientific Research Assistant (AGT-016)

### What It Does
Assists with structured scientific research workflows. Inspired by K-Dense-AI's 139 scientific skills covering biology, chemistry, medicine, physics, and computational science.

### When to Use
- Literature reviews with proper citations
- Hypothesis generation from existing evidence
- Statistical analysis methodology selection
- Research paper structuring (IMRaD format)
- Scientific visualization

### Chat Prompt Examples
```
"Perform a literature review on CRISPR gene editing techniques published in 2025"
"Help me design a statistical analysis plan for a clinical trial with 3 treatment arms"
"Structure my research findings into IMRaD format with proper citations"
"Generate a scientific diagram showing the protein folding pathway"
```

### TypeScript Integration
```typescript
import { ScientificResearchAssistant } from '@cvf/agent-skills';

const researcher = new ScientificResearchAssistant({
  governance: { risk: 'R1', approval: 'auto' }
});

// Literature review
const review = await researcher.literatureReview({
  topic: 'machine learning in drug discovery',
  databases: ['pubmed', 'arxiv', 'biorxiv'],
  yearRange: { from: 2023, to: 2026 },
  maxResults: 50,
  citationFormat: 'APA'
});

// Hypothesis generation
const hypotheses = await researcher.generateHypotheses({
  evidence: review.findings,
  domain: 'computational-biology',
  maxHypotheses: 5
});

// Statistical analysis plan
const analysisPlan = await researcher.designAnalysis({
  studyType: 'randomized-controlled-trial',
  sampleSize: 200,
  treatmentArms: 3,
  primaryEndpoint: 'response-rate',
  significanceLevel: 0.05
});
```

### Supported Disciplines
| Discipline | Capabilities |
|-----------|-------------|
| Biology | Genomics, proteomics, phylogenetics, cell biology |
| Chemistry | Molecular design, reaction pathways, QSAR |
| Medicine | Clinical trials, epidemiology, treatment plans |
| Physics | Quantum computing, computational physics |
| Data Science | Statistical methods, ML pipelines, visualization |

---

## Skill 3: Document Format Converter (AGT-017)

### What It Does
Creates, converts, and analyzes documents across PDF, Word, Excel, PowerPoint, and Markdown formats. Inspired by Anthropic's document processing toolkit.

### When to Use
- Extract tables and text from PDF documents
- Create professional Word documents or presentations
- Convert between document formats
- Analyze spreadsheet data
- Perform OCR on scanned documents

### Chat Prompt Examples
```
"Extract all tables from this PDF and convert them to CSV"
"Create a PowerPoint presentation from this Markdown outline"
"Convert this Word document to Markdown format"
"Analyze this Excel spreadsheet and create a summary report"
```

### TypeScript Integration
```typescript
import { DocumentFormatConverter } from '@cvf/agent-skills';

const converter = new DocumentFormatConverter({
  governance: { risk: 'R1', approval: 'auto' }
});

// PDF extraction
const extracted = await converter.extractFromPDF({
  source: './report.pdf',
  extract: ['text', 'tables', 'metadata'],
  ocrEnabled: true,
  ocrConfidenceThreshold: 0.85
});

// Format conversion
const result = await converter.convert({
  source: './document.docx',
  targetFormat: 'markdown',
  preserveFormatting: true,
  logLostElements: true  // Track what formatting was lost
});

// Spreadsheet analysis
const analysis = await converter.analyzeSpreadsheet({
  source: './data.xlsx',
  sheets: ['Sheet1', 'Summary'],
  operations: ['describe', 'correlations', 'outliers']
});
```

---

## Skill 4: Agent Team Orchestrator (AGT-018)

### What It Does
Coordinates multiple specialized sub-agents working together as a team. Inspired by claude-code-templates' agent team patterns (deep-research-team, development-team, mcp-dev-team).

### When to Use
- Complex tasks requiring multiple expertise areas
- Research projects needing plan → execute → review cycles
- Development workflows with design → code → test → review
- Content pipelines with write → edit → format → publish

### Chat Prompt Examples
```
"Assemble a research team: one agent for literature review, one for data analysis, one for writing"
"Create a development team to design, implement, test, and review a new API endpoint"
"Set up a content team to write, edit, and format a technical blog post"
```

### Team Patterns

```
┌──────────────────────────────────────┐
│       Agent Team Orchestrator         │
│         (AGT-018, R3)                │
├──────────┬──────────┬────────────────┤
│ Planner  │ Executor │   Reviewer     │
│  Agent   │  Agent   │    Agent       │
│ (AGT-012)│(AGT-002) │  (AGT-001,007)│
└──────────┴──────────┴────────────────┘
```

### TypeScript Integration
```typescript
import { AgentTeamOrchestrator } from '@cvf/agent-skills';

const teamOrchestrator = new AgentTeamOrchestrator({
  governance: { risk: 'R3', approval: 'manual' }
});

// Define a research team
const team = await teamOrchestrator.createTeam({
  name: 'Research Analysis Team',
  pattern: 'research',  // research | development | review | content
  agents: [
    { role: 'planner', skills: ['AGT-016'], task: 'Design research methodology' },
    { role: 'executor', skills: ['AGT-016', 'AGT-010'], task: 'Execute analysis and visualize' },
    { role: 'reviewer', skills: ['AGT-016'], task: 'Review findings and suggest improvements' }
  ],
  // --- Requires human approval ---
  maxIterations: 3,
  conflictResolution: 'escalate-to-human'
});

// Execute team workflow
const results = await team.execute({
  objective: 'Analyze market trends in AI-powered healthcare 2024-2026',
  onConflict: (agentA, agentB, issue) => {
    console.log(`Conflict between ${agentA.role} and ${agentB.role}: ${issue}`);
    // Escalated to human for resolution
  },
  onProgress: (step, total) => console.log(`Step ${step}/${total}`)
});
```

### Governance Controls
- **Approval:** Team composition AND task plan require manual human approval
- **Sub-agents:** Each sub-agent operates under its own governance rules
- **Conflicts:** Escalated to human (never auto-resolved for critical matters)
- **Limits:** Max agents per team (default 5), max iterations (default 3)
- **Audit:** Full execution trace with per-agent attribution

---

## Skill 5: Skill Progressive Loader (AGT-019)

### What It Does
Manages how skill definitions load into the AI's context window using progressive disclosure. Only loads what's needed, when it's needed — keeping the context lean. Inspired by Anthropic's skill architecture.

### How It Works (Automatic)

```
┌─────────────────────────────────────┐
│ Always in context (~7K tokens):      │
│ Metadata for all 20 agent skills     │
│ (name, description, risk, triggers)  │
├─────────────────────────────────────┤
│ Loaded on activation (~1-2K each):   │
│ Instructions for 2-3 active skills   │
├─────────────────────────────────────┤
│ Loaded on demand (~3-5K each):       │
│ Resources, examples, templates       │
├─────────────────────────────────────┤
│ Never loaded (0 tokens):             │
│ Scripts — referenced by path only    │
└─────────────────────────────────────┘
```

### Context Budget Savings

| Loading Strategy | Total Context Used |
|------------------|-------------------|
| **Load all 20 skills fully** | ~200,000 tokens |
| **Progressive disclosure** | ~12,200 tokens |
| **Savings** | **93.9%** |

### No Chat Prompts Needed
AGT-019 operates automatically. When you invoke any skill, the Progressive Loader handles:
1. Looking up the skill's metadata catalog
2. Loading only the activated skill's instructions
3. Fetching resources only if explicitly needed
4. Referencing scripts by path without loading code

---

## Skill 6: Analytics Dashboard Generator (AGT-020)

### What It Does
Generates real-time analytics dashboards for monitoring AI agent sessions, tracking skill usage, governance compliance, and system health. Inspired by claude-code-templates' analytics dashboard and Sentry integration.

### When to Use
- Monitor which skills are used most frequently
- Track governance compliance across sessions
- Visualize token usage and cost estimates
- Detect anomalies in agent behavior
- Generate health check reports

### Chat Prompt Examples
```
"Generate a dashboard showing skill usage over the past 7 days"
"Show me governance compliance metrics for this project"
"Create a health check report with actionable recommendations"
"Track token usage and estimated costs by skill category"
```

### TypeScript Integration
```typescript
import { AnalyticsDashboardGenerator } from '@cvf/agent-skills';

const analytics = new AnalyticsDashboardGenerator({
  governance: { risk: 'R1', approval: 'auto' }
});

// Generate session analytics
const dashboard = await analytics.generateDashboard({
  timeRange: { from: '2026-02-11', to: '2026-02-18' },
  metrics: ['skill-usage', 'governance-compliance', 'token-costs'],
  format: 'html',  // html | json | csv
  redactPrompts: true  // Privacy: user prompts redacted by default
});

// Health check
const health = await analytics.healthCheck({
  checks: ['skill-availability', 'governance-rules', 'performance'],
  recommendations: true
});

// Usage trends
const trends = await analytics.usageTrends({
  groupBy: 'skill-category',  // skill-category | risk-level | role
  period: 'daily',
  topN: 10
});
```

### Dashboard Metrics
| Metric | Description |
|--------|------------|
| **Skill Usage** | Frequency and duration of each skill invocation |
| **Governance Compliance** | % of actions that passed governance checks |
| **Token Budget** | Tokens used per session, per skill, trending |
| **Error Rate** | Failed skill invocations with error categories |
| **Response Time** | Latency per skill and per session |
| **Risk Distribution** | Actions by risk level over time |

---

## Skill Combination Pipelines

### Pipeline 1: Automated Research → Report
```
AGT-016 (Scientific Research)
    → AGT-010 (Data Visualization)
    → AGT-017 (Document Converter → PDF)
    → AGT-020 (Analytics → track usage)
```

### Pipeline 2: CI/CD with Governance
```
AGT-015 (Pre-commit Hook → security scan)
    → AGT-008 (File Write → save changes)
    → AGT-015 (Post-tool Hook → run tests)
    → AGT-020 (Analytics → log compliance)
```

### Pipeline 3: Multi-Agent Development
```
AGT-018 (Agent Team → plan + code + review)
    → AGT-012 (Agentic Loop → iterate)
    → AGT-015 (Hooks → auto-test)
    → AGT-020 (Analytics → team performance)
```

---

## Common Mistakes

| Mistake | Correct Approach |
|---------|-----------------|
| Using AGT-018 for simple tasks | Use individual skills — teams are for complex multi-step work |
| Skipping hook registration approval | All hooks require human approval before activation |
| Loading all skill resources eagerly | AGT-019 handles this — trust progressive disclosure |
| Using AGT-016 for medical advice | Scientific Research is advisory only — no clinical recommendations |
| Setting hook timeout too high | Keep hooks under 10s — longer tasks should be async |
| Auto-resolving team conflicts | Critical conflicts MUST escalate to human |

---

## Security Model

| Skill | Data Access | External Access | Audit Level |
|-------|------------|-----------------|-------------|
| AGT-015 | Workspace content | Notification endpoints | Full trace |
| AGT-016 | Read-only analysis | None | Logged |
| AGT-017 | Document files | None | Logged |
| AGT-018 | Via sub-agents | Via sub-agents | Full trace + per-agent |
| AGT-019 | Skill catalog (read) | None | Minimal |
| AGT-020 | Session logs (read) | None | Logged |

---

## Next Steps

- **[Progressive Disclosure Guide](progressive-disclosure-guide.md)** — Deep dive into the 4-layer skill loading pattern
- **[Full Analysis Report](claude-code-templates-analysis.md)** — Complete gap analysis and architectural recommendations
- **[Using Agentic Skills v1](using-agentic-skills.md)** — Tutorial for AGT-009 → AGT-014
- **[Governance Registry](https://github.com/your-org/CVF/tree/main/governance/skill-library/registry/agent-skills)** — All .gov.md governance records
