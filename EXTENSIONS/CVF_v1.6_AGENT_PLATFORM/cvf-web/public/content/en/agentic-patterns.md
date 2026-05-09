# Agentic Patterns from Claude Quickstarts

> Lessons learned from [claude-quickstarts](https://github.com/anthropics/claude-quickstarts) — mapped to CVF governance.

## What Is Claude Quickstarts?

Anthropic's [claude-quickstarts](https://github.com/anthropics/claude-quickstarts) is a 14.2k-star collection of reference implementations showing how to build real applications with the Claude API. It contains **5 production-pattern demos**:

| Project | Pattern | Tech Stack |
|---------|---------|-----------|
| **Customer Support Agent** | RAG + Knowledge Base + Mood Detection | Next.js, Bedrock KB, Claude API |
| **Financial Data Analyst** | Data Visualization + Multi-Format Upload | Next.js, Recharts, PDF.js |
| **Agents** | Minimal Agentic Loop + MCP Tools | Python, Claude API, MCP |
| **Autonomous Coding** | Two-Agent Pattern + Session Persistence | Claude Agent SDK, Git |
| **Browser Use Demo** | Browser Automation + DOM Tools | Python, Playwright, Streamlit |

## Key Patterns & CVF Mapping

### 1. RAG (Retrieval-Augmented Generation)

**What it does:** The customer-support-agent retrieves relevant documents from Amazon Bedrock Knowledge Bases before answering, grounding responses in real data.

**Pattern:**
```
User Query → Embedding → Vector Search → Top-K Documents → Context Injection → Claude Response
```

**CVF Mapping:**
- **New Skill:** AGT-009 RAG Knowledge Retrieval (R2, Supervised)
- **Risk:** R2 because retrieved context influences AI output quality
- **Governance:** Must cite sources, log retrieved document IDs, reject hallucinated references
- **Phase Gate:** Allowed in all 4 phases — context retrieval is fundamental

**What CVF adds:** Source citation audit trail, relevance score thresholds, PII filtering on retrieved content.

---

### 2. Interactive Data Visualization

**What it does:** The financial-data-analyst generates chart configurations (line, bar, pie, area, stacked area) from uploaded financial data, rendered with Recharts.

**Pattern:**
```
Data Upload → Claude Analysis → Chart Config JSON → Recharts Render → Interactive Dashboard
```

**CVF Mapping:**
- **New Skill:** AGT-010 Data Visualization Generator (R1, Auto)
- **Risk:** R1 because output is read-only visualization, no data modification
- **Governance:** Chart configs validated against schema, no executable code in output
- **Phase Gate:** Build + Review phases

**What CVF adds:** Data sensitivity classification (public/internal/confidential), export audit logging.

---

### 3. Multi-Format Document Parsing

**What it does:** The financial-data-analyst handles text, PDF, CSV, and image uploads, extracting structured data for analysis.

**Pattern:**
```
File Upload → Type Detection → Parser (PDF.js / CSV / Vision) → Structured Data → Analysis Ready
```

**CVF Mapping:**
- **New Skill:** AGT-011 Document Parser (R1, Auto)
- **Risk:** R1 because parsing is read-only with structured output
- **Governance:** PII detection hooks, file size limits, supported format allowlist
- **Phase Gate:** All phases — document parsing serves discovery through review

**What CVF adds:** Automatic PII sanitization, file type validation, extraction schema enforcement.

---

### 4. Autonomous Agentic Loops

**What it does:** The autonomous-coding agent uses a **two-agent pattern**: an Initializer agent creates a feature list (200 test cases), then a Coding agent implements features one by one across multiple sessions, persisting progress via `feature_list.json` and git.

**Pattern:**
```
App Spec → Initializer Agent → feature_list.json (200 items)
                                        ↓
                              Coding Agent Session 1 → git commit
                                        ↓
                              Coding Agent Session 2 → git commit
                                        ↓
                              ... (auto-continues until done)
```

**Key innovation:** Progress persists across fresh context windows via git + feature list.

**CVF Mapping:**
- **New Skill:** AGT-012 Agentic Loop Controller (R3, Manual)
- **Risk:** R3 because autonomous multi-step execution with file system access
- **Governance:** Iteration limits, bash command allowlist, filesystem sandboxing, mandatory human review
- **Phase Gate:** Build + Review only — autonomous execution is too risky for Discovery/Design

**Security model (from claude-quickstarts):**
1. OS-level sandbox
2. Filesystem restricted to project directory
3. Bash allowlist: `ls`, `cat`, `head`, `tail`, `wc`, `grep`, `npm`, `node`, `git`, `ps`, `lsof`, `sleep`, `pkill`

**What CVF adds:** Per-iteration governance checks, risk escalation on repeated failures, mandatory audit trail with git commit hashes.

---

### 5. Browser Automation

**What it does:** The browser-use-demo gives Claude browser control via Playwright with DOM-aware actions: navigate, click, type, scroll, read page, fill forms, take screenshots.

**Pattern:**
```
User Instruction → Claude → Browser Tool Call → Playwright Action → Screenshot → Claude Analysis → Next Action
```

**Key innovation:** Element targeting via `ref` parameter (DOM reference) instead of brittle pixel coordinates.

**CVF Mapping:**
- **New Skill:** AGT-013 Browser Automation (R3, Manual)
- **Risk:** R3 because browser can access external systems, submit forms, navigate to arbitrary pages
- **Governance:** Containerized execution (Docker), domain allowlist, no credential input, screenshot logging
- **Phase Gate:** Build only — browser automation is execution-level activity

**Safety measures (from claude-quickstarts):**
1. Isolated Docker container with virtual display (XVFB)
2. No personal credentials or sensitive information
3. Domain allowlist recommended
4. Human confirmation for real-world consequences (financial transactions, ToS acceptance)

**What CVF adds:** Domain governance policy, action-level audit log, automated containment breach detection.

---

### 6. MCP Server Integration

**What it does:** The agents module connects to Model Context Protocol (MCP) servers for dynamic tool discovery and invocation, supporting both stdio and HTTP transports.

**Pattern:**
```python
agent = Agent(
    tools=[ThinkTool()],      # Local tools
    mcp_servers=[{            # External MCP servers
        "type": "stdio",
        "command": "python",
        "args": ["-m", "mcp_server"],
    }]
)
```

**CVF Mapping:**
- **New Skill:** AGT-014 MCP Server Connector (R2, Supervised)
- **Risk:** R2 because external server access with dynamic tool discovery
- **Governance:** Server allowlist, connection timeout limits, tool result validation
- **Phase Gate:** Build + Review phases

**What CVF adds:** Server certification requirements, tool schema validation before invocation, connection lifecycle auditing.

---

## Architecture Comparison

| Aspect | claude-quickstarts | CVF |
|--------|-------------------|-----|
| **Approach** | Minimal, unopinionated, <300 LOC core | Governance-first, structured, multi-layer |
| **Risk Management** | Per-project safety caveats | Systematic R0-R4 classification |
| **Tool Use** | Direct API tool calls | Governance-wrapped tool invocation |
| **Multi-Agent** | Two-agent pattern (init + work) | Four-role system (Orchestrator, Architect, Builder, Reviewer) |
| **Session Management** | Git commits + feature list | Phase-gated state machine |
| **Security** | Bash allowlist + Docker isolation | Risk levels + operator roles + phase gates + audit |
| **Monitoring** | Console output | Audit logger + enforcement log + factual scoring |

## What CVF Gains

### New Skills Added (AGT-009 → AGT-014)

| ID | Skill | Risk | Autonomy | Pattern Source |
|----|-------|------|----------|---------------|
| AGT-009 | RAG Knowledge Retrieval | R2 | Supervised | Customer Support Agent |
| AGT-010 | Data Visualization Generator | R1 | Auto | Financial Data Analyst |
| AGT-011 | Document Parser | R1 | Auto | Financial Data Analyst |
| AGT-012 | Agentic Loop Controller | R3 | Manual | Autonomous Coding |
| AGT-013 | Browser Automation | R3 | Manual | Browser Use Demo |
| AGT-014 | MCP Server Connector | R2 | Supervised | Agents Module |

### Updated Agent Tool Registry

| Risk Level | Before | After | Tools |
|------------|--------|-------|-------|
| **R0** | 3 | 3 | Calculator, DateTime, JSON Parse |
| **R1** | 1 | 3 | File Read, **Data Viz**, **Doc Parser** |
| **R2** | 3 | 5 | Web Search, URL Fetch, File Write, **RAG**, **MCP** |
| **R3** | 1 | 3 | Code Execute, **Agentic Loop**, **Browser Automation** |
| **Total** | 8 | 14 | +75% capability expansion |

### Key Takeaways

1. **RAG is table stakes** — Every serious AI application needs grounded context retrieval. CVF now has a governance-wrapped pattern.

2. **Autonomous loops need hard limits** — claude-quickstarts' bash allowlist + filesystem sandbox is a good security pattern. CVF adds iteration caps and per-step governance checks.

3. **Browser automation is high-risk, high-value** — Container isolation is mandatory. CVF treats it as R3 with domain allowlisting.

4. **MCP is the future of tool interop** — Dynamic tool discovery via MCP servers enables composable agent architectures. CVF wraps this with server certification.

5. **Data visualization is low-risk** — Chart generation is read-only and safe. R1 classification allows automated use with minimal overhead.

6. **Document parsing needs PII awareness** — Unlike claude-quickstarts, CVF automatically flags PII in parsed documents.

## Related Resources

- [CVF Toolkit Reference](/docs/toolkit-reference) — Governance engine implementation
- [Custom Skills](/docs/custom-skills) — Create your own CVF skills
- [Risk Model](/docs/risk-model) — R0-R3 risk classification
- [Agent Platform](/docs/agent-platform) — Multi-agent orchestration
- [claude-quickstarts on GitHub](https://github.com/anthropics/claude-quickstarts) — Original source
