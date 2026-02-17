# AGT-024: MCP Context Isolation Manager

> **Version:** 1.0.0  
> **Status:** Active  
> **Risk Level:** R2 – Medium  
> **Autonomy:** Supervised  
> **Category:** External Operations  
> **Provenance:** claudekit-skills/mcp-management + mcp-manager subagent (mrgoonie/claudekit-skills)

---

## 📋 Overview

Architectural pattern for delegating MCP (Model Context Protocol) tool calls to a dedicated subagent, keeping the main agent's context clean and focused. Solves the "context bloat" problem where loading multiple MCP servers pollutes the primary context window.

**Key Principle:** MCP tool discovery and execution happen in an isolated subagent context. The main agent only receives the result, not the 1000+ tool definitions.

---

## 🎯 Capabilities

### Architecture

```
┌──────────────────────────┐
│     Main Agent           │
│  (clean context)         │
│                          │
│  "I need to use MCP X"   │
│         │                │
│         ▼                │
│  ┌──────────────┐        │
│  │ Dispatch to   │        │
│  │ MCP Subagent   │        │
│  └──────┬───────┘        │
│         │                │
└─────────┼────────────────┘
          ▼
┌──────────────────────────┐
│   MCP Manager Subagent   │
│  (isolated context)      │
│                          │
│  1. Load .mcp.json       │
│  2. Initialize servers   │
│  3. Discover tools       │
│  4. Select best tool     │
│  5. Execute tool         │
│  6. Return result only   │
│                          │
└──────────────────────────┘
```

### Core Functions
1. **Context Isolation** — MCP tool definitions never enter main context
2. **Intelligent Tool Selection** — Subagent analyzes available tools and selects optimal match
3. **Multi-Server Management** — Handle 10-80+ MCP servers without context cost
4. **Result Summarization** — Return only relevant output to main agent
5. **Server Health Monitoring** — Track MCP server availability and latency

### Benefits
| Metric | Without Isolation | With Isolation |
|--------|-------------------|----------------|
| Context overhead per MCP server | ~500-2000 tokens | ~0 tokens (main) |
| 10 MCP servers cost | ~10,000 tokens | ~50 tokens (dispatch message) |
| Tool discovery time | Immediate (but bloated) | On-demand (clean) |
| Main context quality | Degraded | Preserved |

---

## 🔐 CVF Governance

### Authority Mapping
| Role | Permission |
|------|-----------|
| Orchestrator | Full: configure isolation, manage MCP servers |
| Builder | Execute: request MCP tool calls via subagent |
| Reviewer | Audit: review MCP call logs and results |
| Architect | Design: define MCP server configurations |

### Phase Applicability
| Phase | Usage |
|-------|-------|
| B – Design | Configure MCP server topology |
| C – Build | Execute MCP tools via isolated subagent |
| D – Review | Audit MCP usage logs |

### Constraints
- MUST NOT load MCP tool definitions in main agent context
- MUST log all MCP tool calls for audit trail
- MUST validate MCP server authentication before delegation
- MUST timeout subagent calls after configurable threshold (default: 30s)
- MUST sanitize MCP results before returning to main context
- R2 classification: external I/O, requires supervision

### Security Model
- MCP credentials managed via environment variables, never in context
- Subagent has limited permissions: execute MCP tools only
- Results filtered for sensitive data before return
- Server allowlist enforced via governance configuration

---

## 🔗 Dependencies
- **AGT-014** (MCP Server Connector) — Base MCP connectivity
- **AGT-018** (Agent Team Orchestrator) — Subagent delegation pattern
- **AGT-021** (Context Engineering Optimizer) — Context quality preservation

---

## 📊 Validation

### Success Criteria
| Criterion | Target |
|-----------|--------|
| Main context token savings | ≥95% reduction vs direct MCP loading |
| MCP tool call success rate | ≥98% |
| Average subagent round-trip | <5 seconds |
| Context quality preservation | Main context relevance ≥90% |

### UAT Link
`governance/skill-library/uat/results/UAT-AGT-024.md`

---

## 📚 Attribution
- **Source:** [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills) — mcp-management skill + mcp-manager subagent pattern
- **Article:** [Anthropic "Code execution with MCP"](https://www.anthropic.com/engineering/code-execution-with-mcp)
- **Pattern Type:** Framework-level architectural pattern for context isolation
- **CVF Adaptation:** Added governance constraints, security model, monitoring, audit trail
- **License:** MIT (source) → CC BY-NC-ND 4.0 (CVF adaptation)

---

*Last Updated: February 18, 2026*
