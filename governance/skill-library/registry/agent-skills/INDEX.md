# Agent Skills Registry Index

> Generated from v1.6 AGENT_PLATFORM
>
> Total Skills: 14

---

## Overview

This registry contains governance metadata for all agent skills (tools) defined in the CVF v1.6 AGENT_PLATFORM.

### Risk Distribution

| Risk Level | Count | Skills |
|------------|-------|--------|
| **R0 – Minimal** | 3 | Calculator, DateTime, JSON Parse |
| **R1 – Low** | 3 | File Read, Data Visualization, Document Parser |
| **R2 – Medium** | 5 | Web Search, URL Fetch, File Write, RAG Retrieval, MCP Connector |
| **R3 – High** | 3 | Code Execute, Agentic Loop, Browser Automation |
| **R4 – Critical** | 0 | — |

---

## Complete Registry

| ID | Skill Name | Risk Level | Autonomy | Roles |
|----|------------|------------|----------|-------|
| [AGT-001](AGT-001_web_search.gov.md) | Web Search | R2 | Supervised | Orchestrator, Builder |
| [AGT-002](AGT-002_code_execute.gov.md) | Code Execute | R3 | Manual | Builder |
| [AGT-003](AGT-003_calculator.gov.md) | Calculator | R0 | Auto | All |
| [AGT-004](AGT-004_datetime.gov.md) | DateTime | R0 | Auto | All |
| [AGT-005](AGT-005_json_parse.gov.md) | JSON Parse | R0 | Auto | All |
| [AGT-006](AGT-006_url_fetch.gov.md) | URL Fetch | R2 | Supervised | Orchestrator, Builder |
| [AGT-007](AGT-007_file_read.gov.md) | File Read | R1 | Auto | All |
| [AGT-008](AGT-008_file_write.gov.md) | File Write | R2 | Supervised | Orchestrator, Builder |
| [AGT-009](AGT-009_rag_knowledge_retrieval.gov.md) | RAG Knowledge Retrieval | R2 | Supervised | Orchestrator, Builder, Architect |
| [AGT-010](AGT-010_data_visualization.gov.md) | Data Visualization | R1 | Auto | Architect, Builder |
| [AGT-011](AGT-011_document_parser.gov.md) | Document Parser | R1 | Auto | All |
| [AGT-012](AGT-012_agentic_loop_controller.gov.md) | Agentic Loop Controller | R3 | Manual | Orchestrator |
| [AGT-013](AGT-013_browser_automation.gov.md) | Browser Automation | R3 | Manual | Builder |
| [AGT-014](AGT-014_mcp_server_connector.gov.md) | MCP Server Connector | R2 | Supervised | Orchestrator, Builder |

---

## By Category

### Safe Operations (R0)
Auto-approved, all roles, all phases:
- AGT-003: Calculator
- AGT-004: DateTime
- AGT-005: JSON Parse

### Data Operations (R1)
Auto-approved, read-only or output-only:
- AGT-007: File Read
- AGT-010: Data Visualization Generator
- AGT-011: Document Parser

### Workspace Operations (R2)
Requires supervision, restricted roles:
- AGT-008: File Write

### External Operations (R2)
Requires supervision, restricted roles:
- AGT-001: Web Search
- AGT-006: URL Fetch

### Knowledge & Integration Operations (R2)
Requires supervision, data-aware:
- AGT-009: RAG Knowledge Retrieval
- AGT-014: MCP Server Connector

### High-Risk Operations (R3)
Requires explicit manual approval:
- AGT-002: Code Execute (Builder only)
- AGT-012: Agentic Loop Controller (Orchestrator only, multi-step autonomous)
- AGT-013: Browser Automation (Builder only, Docker container required)

---

## Quick Reference

```
R0 (Auto):       Calculator, DateTime, JSON Parse
R1 (Auto):       File Read, Data Visualization, Document Parser
R2 (Supervised): Web Search, URL Fetch, File Write, RAG Retrieval, MCP Connector
R3 (Manual):     Code Execute, Agentic Loop, Browser Automation
```

---

## New Skills (v1.6.1)

The following 6 skills were added based on analysis of production agentic patterns:

| ID | Inspired By | Key Pattern |
|----|-------------|-------------|
| AGT-009 | Anthropic customer-support-agent | RAG with vector search |
| AGT-010 | Anthropic financial-data-analyst | Dynamic chart generation |
| AGT-011 | Anthropic financial-data-analyst | Schema-based document extraction |
| AGT-012 | Anthropic computer-use-demo | Multi-step autonomous coding |
| AGT-013 | Anthropic browser-use-demo | Playwright browser control |
| AGT-014 | Claude MCP architecture | Dynamic tool server integration |

For usage guide and examples, see: [Using Agentic Skills Tutorial](../../../../EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/content/en/using-agentic-skills.md)

---

## Governance Specs

See parent directory for full governance specifications:
- [CVF_SKILL_SPEC.md](../../specs/CVF_SKILL_SPEC.md)
- [CVF_RISK_AUTHORITY_MAPPING.md](../../specs/CVF_RISK_AUTHORITY_MAPPING.md)
