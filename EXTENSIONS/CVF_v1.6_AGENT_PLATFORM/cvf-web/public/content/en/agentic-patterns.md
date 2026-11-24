# Agentic Patterns from Claude Quickstarts

> Lessons learned from [claude-quickstarts](https://github.com/anthropics/claude-quickstarts) for planning agent workflows.

## What Is Claude Quickstarts?

Anthropic's [claude-quickstarts](https://github.com/anthropics/claude-quickstarts) is a 14.2k-star collection of reference implementations showing how to build real applications with the Claude API. It contains **5 production-pattern demos**:

| Project | Pattern | Tech Stack |
|---------|---------|-----------|
| **Customer Support Agent** | RAG + Knowledge Base + Mood Detection | Next.js, Bedrock KB, Claude API |
| **Financial Data Analyst** | Data Visualization + Multi-Format Upload | Next.js, Recharts, PDF.js |
| **Agents** | Minimal Agentic Loop + MCP Tools | Python, Claude API, MCP |
| **Autonomous Coding** | Two-Agent Pattern + Session Persistence | Claude Agent SDK, Git |
| **Browser Use Demo** | Browser Automation + DOM Tools | Python, Playwright, Streamlit |

## Design patterns

### 1. RAG (Retrieval-Augmented Generation)

**What it does:** The customer-support-agent retrieves relevant documents from Amazon Bedrock Knowledge Bases before answering, grounding responses in real data.

**Pattern:**

```
User Query → Embedding → Vector Search → Top-K Documents → Context Injection → Claude Response
```

---

### 2. Interactive Data Visualization

**What it does:** The financial-data-analyst generates chart configurations (line, bar, pie, area, stacked area) from uploaded financial data, rendered with Recharts.

**Pattern:**

```
Data Upload → Claude Analysis → Chart Config JSON → Recharts Render → Interactive Dashboard
```

---

### 3. Multi-Format Document Parsing

**What it does:** The financial-data-analyst handles text, PDF, CSV, and image uploads, extracting structured data for analysis.

**Pattern:**

```
File Upload → Type Detection → Parser (PDF.js / CSV / Vision) → Structured Data → Analysis Ready
```

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

**Security model (from claude-quickstarts):**

1. OS-level sandbox
2. Filesystem restricted to project directory
3. Bash allowlist: `ls`, `cat`, `head`, `tail`, `wc`, `grep`, `npm`, `node`, `git`, `ps`, `lsof`, `sleep`, `pkill`

---

### 5. Browser Automation

**What it does:** The browser-use-demo gives Claude browser control via Playwright with DOM-aware actions: navigate, click, type, scroll, read page, fill forms, take screenshots.

**Pattern:**

```
User Instruction → Claude → Browser Tool Call → Playwright Action → Screenshot → Claude Analysis → Next Action
```

**Key innovation:** Element targeting via `ref` parameter (DOM reference) instead of brittle pixel coordinates.

**Safety measures (from claude-quickstarts):**

1. Isolated Docker container with virtual display (XVFB)
2. No personal credentials or sensitive information
3. Domain allowlist recommended
4. Human confirmation for real-world consequences (financial transactions, ToS acceptance)

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

---

The examples describe design patterns. Choosing a pattern does not determine the permission or risk for a real action. Those depend on the work, the data, and the allowed scope.

[Browse packages for agents](/skills) or [start a specification from a template](/home).
