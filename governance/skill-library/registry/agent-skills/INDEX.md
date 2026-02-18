# Agent Skills Registry Index

> Generated from v1.6 AGENT_PLATFORM
>
> Total Skills: 34

---

## Overview

This registry contains governance metadata for all agent skills (tools) defined in the CVF v1.6 AGENT_PLATFORM.

### Risk Distribution

| Risk Level | Count | Skills |
|------------|-------|--------|
| **R0 – Minimal** | 5 | Calculator, DateTime, JSON Parse, Skill Progressive Loader, Problem-Solving Router |
| **R1 – Low** | 11 | File Read, Data Visualization, Document Parser, Scientific Research, Document Converter, Analytics Dashboard, Context Engineering Optimizer, API Architecture Designer, Database Schema Architect, Frontend Component Forge, Code Review & Verification Gate |
| **R2 – Medium** | 14 | Web Search, URL Fetch, File Write, RAG Retrieval, MCP Connector, Workflow Hook, Systematic Debugging, MCP Context Isolation, Full-Stack Testing Engine, Security & Auth Guard, Cloud Deployment Strategist, MCP Server Builder, AI Multimodal Processor, Operator Workflow Orchestrator |
| **R3 – High** | 4 | Code Execute, Agentic Loop, Browser Automation, Agent Team Orchestrator |
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
| [AGT-015](AGT-015_WORKFLOW_AUTOMATION_HOOK.gov.md) | Workflow Automation Hook | R2 | Supervised | Orchestrator, Builder |
| [AGT-016](AGT-016_SCIENTIFIC_RESEARCH_ASSISTANT.gov.md) | Scientific Research Assistant | R1 | Auto | All |
| [AGT-017](AGT-017_DOCUMENT_FORMAT_CONVERTER.gov.md) | Document Format Converter | R1 | Auto | All |
| [AGT-018](AGT-018_AGENT_TEAM_ORCHESTRATOR.gov.md) | Agent Team Orchestrator | R3 | Manual | Orchestrator |
| [AGT-019](AGT-019_SKILL_PROGRESSIVE_LOADER.gov.md) | Skill Progressive Loader | R0 | Auto | All |
| [AGT-020](AGT-020_ANALYTICS_DASHBOARD_GENERATOR.gov.md) | Analytics Dashboard Generator | R1 | Auto | Architect, Builder |
| [AGT-021](AGT-021_CONTEXT_ENGINEERING_OPTIMIZER.gov.md) | Context Engineering Optimizer | R1 | Auto | All |
| [AGT-022](AGT-022_PROBLEM_SOLVING_FRAMEWORK.gov.md) | Problem-Solving Framework Router | R0 | Auto | All |
| [AGT-023](AGT-023_SYSTEMATIC_DEBUGGING_ENGINE.gov.md) | Systematic Debugging Engine | R2 | Supervised | Orchestrator, Builder |
| [AGT-024](AGT-024_MCP_CONTEXT_ISOLATION.gov.md) | MCP Context Isolation Manager | R2 | Supervised | Orchestrator, Builder |
| [AGT-025](AGT-025_API_ARCHITECTURE_DESIGNER.gov.md) | API Architecture Designer | R1 | Auto | Orchestrator, Architect, Builder |
| [AGT-026](AGT-026_FULLSTACK_TESTING_ENGINE.gov.md) | Full-Stack Testing Engine | R2 | Supervised | Orchestrator, Builder |
| [AGT-027](AGT-027_SECURITY_AUTH_GUARD.gov.md) | Security & Auth Guard | R2 | Supervised | Orchestrator, Architect, Builder |
| [AGT-028](AGT-028_DATABASE_SCHEMA_ARCHITECT.gov.md) | Database Schema Architect | R1 | Auto | Orchestrator, Architect, Builder |
| [AGT-029](AGT-029_FRONTEND_COMPONENT_FORGE.gov.md) | Frontend Component Forge | R1 | Auto | Orchestrator, Architect, Builder |
| [AGT-030](AGT-030_CLOUD_DEPLOYMENT_STRATEGIST.gov.md) | Cloud Deployment Strategist | R2 | Supervised | Orchestrator, DevOps Builder |
| [AGT-031](AGT-031_CODE_REVIEW_VERIFICATION_GATE.gov.md) | Code Review & Verification Gate | R1 | Auto | All |
| [AGT-032](AGT-032_MCP_SERVER_BUILDER.gov.md) | MCP Server Builder | R2 | Supervised | Orchestrator, Builder |
| [AGT-033](AGT-033_AI_MULTIMODAL_PROCESSOR.gov.md) | AI Multimodal Processor | R2 | Supervised | Orchestrator, Builder |
| [AGT-034](AGT-034_OPERATOR_WORKFLOW_ORCHESTRATOR.gov.md) | Operator Workflow Orchestrator | R2 | Supervised | Orchestrator, Operator, Architect |

---

## By Category

### Safe Operations (R0)
Auto-approved, all roles, all phases:
- AGT-003: Calculator
- AGT-004: DateTime
- AGT-005: JSON Parse
- AGT-019: Skill Progressive Loader
- AGT-022: Problem-Solving Framework Router

### Data Operations (R1)
Auto-approved, read-only or output-only:
- AGT-007: File Read
- AGT-010: Data Visualization Generator
- AGT-011: Document Parser
- AGT-016: Scientific Research Assistant
- AGT-017: Document Format Converter
- AGT-020: Analytics Dashboard Generator
- AGT-021: Context Engineering Optimizer

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

### Automation Operations (R2)
Requires supervision, hook management:
- AGT-015: Workflow Automation Hook

### Quality & Integration Operations (R2)
Requires supervision, debugging & MCP isolation:
- AGT-023: Systematic Debugging Engine
- AGT-024: MCP Context Isolation Manager

### App Development Operations — Design & Architecture (R1)
Auto-approved, methodology & architecture guidance:
- AGT-025: API Architecture Designer
- AGT-028: Database Schema Architect
- AGT-029: Frontend Component Forge

### App Development Operations — Testing & Security (R2)
Requires supervision, testing/security enforcement:
- AGT-026: Full-Stack Testing Engine
- AGT-027: Security & Auth Guard

### Infrastructure & Deployment (R2)
Requires supervision, infrastructure changes:
- AGT-030: Cloud Deployment Strategist

### Code Quality & Review (R1)
Auto-approved, review methodology:
- AGT-031: Code Review & Verification Gate

### MCP Tooling (R2)
Requires supervision, server creation:
- AGT-032: MCP Server Builder

### AI & Multimodal Processing (R2)
Requires supervision, external API + cost implications:
- AGT-033: AI Multimodal Processor

### Business Operations (R2)
Requires supervision, business system connectors + data synthesis:
- AGT-034: Operator Workflow Orchestrator (10 governed business workflows: Sales, Marketing, Product, Ops, Finance, Strategy)

### High-Risk Operations (R3)
Requires explicit manual approval:
- AGT-002: Code Execute (Builder only)
- AGT-012: Agentic Loop Controller (Orchestrator only, multi-step autonomous)
- AGT-013: Browser Automation (Builder only, Docker container required)
- AGT-018: Agent Team Orchestrator (Orchestrator only, multi-agent coordination)

---

## Quick Reference

```
R0 (Auto):       Calculator, DateTime, JSON Parse, Skill Progressive Loader, Problem-Solving Router
R1 (Auto):       File Read, Data Visualization, Document Parser, Scientific Research, Document Converter, Analytics Dashboard, Context Engineering Optimizer, API Architecture Designer, Database Schema Architect, Frontend Component Forge, Code Review & Verification Gate
R2 (Supervised): Web Search, URL Fetch, File Write, RAG Retrieval, MCP Connector, Workflow Hook, Systematic Debugging, MCP Context Isolation, Full-Stack Testing Engine, Security & Auth Guard, Cloud Deployment Strategist, MCP Server Builder, AI Multimodal Processor, Operator Workflow Orchestrator
R3 (Manual):     Code Execute, Agentic Loop, Browser Automation, Agent Team Orchestrator
```

---

## Added 2026-02-17 — Agentic Patterns (AGT-009→014)

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

## Added 2026-02-17 — Claude Code Templates (AGT-015→020)

The following 6 skills were added based on analysis of claude-code-templates patterns:

| ID | Inspired By | Key Pattern |
|----|-------------|-------------|
| AGT-015 | claude-code-templates hooks system | Pre/post-tool automation hooks |
| AGT-016 | K-Dense-AI/claude-scientific-skills (139 skills) | Scientific research workflows |
| AGT-017 | Anthropic PDF/DOCX/XLSX/PPTX skills | Multi-format document processing |
| AGT-018 | VoltAgent/awesome-claude-code-subagents (119 agents) | Multi-agent team coordination |
| AGT-019 | Anthropic progressive disclosure pattern | Dynamic skill loading & composability |
| AGT-020 | claude-code-templates analytics dashboard | Real-time session monitoring |

For full analysis: [Claude Code Templates Analysis Report](../../../../docs/CVF_CLAUDE_CODE_TEMPLATES_ANALYSIS_2026-02-18.md)
For progressive disclosure guide: [Progressive Disclosure Guide](../../../../docs/CVF_PROGRESSIVE_DISCLOSURE_GUIDE.md)

---

## Added 2026-02-17 — Intelligence Skills (AGT-021→024)

The following 4 skills were added based on analysis of claudekit-skills (mrgoonie/claudekit-skills) patterns:

| ID | Inspired By | Key Pattern |
|----|-------------|-------------|
| AGT-021 | claudekit-skills/context-engineering | Context quality optimization, token management, degradation detection |
| AGT-022 | claudekit-skills/problem-solving (6 techniques) | Stuck-type → technique dispatch router |
| AGT-023 | claudekit-skills/debugging (4 sub-skills) | 4-phase systematic debugging with verification gates |
| AGT-024 | claudekit-skills/mcp-management + subagent | MCP tool isolation via dedicated subagent |

For full analysis: [ClaudeKit Skills Analysis Report](../../../../docs/CVF_CLAUDEKIT_SKILLS_ANALYSIS_2026-02-18.md)

---

## Added 2026-02-17 — App Development (AGT-025→029)

The following 5 skills were extracted from both claudekit-skills and claude-code-templates, focused on the **app development domain**:

| ID | Inspired By | Key Pattern |
|----|-------------|-------------|
| AGT-025 | claudekit-skills/backend-development + claude-code-templates agents | API design methodology: REST/GraphQL/gRPC decision, microservices patterns |
| AGT-026 | claudekit-skills/web-testing | Testing pyramid 70-20-10, CI gate system, flakiness mitigation |
| AGT-027 | claudekit-skills/better-auth + backend-security | OWASP Top 10 defense, OAuth 2.1, auth method selection tree |
| AGT-028 | claudekit-skills/databases | Schema design patterns, DB selection guide, migration/indexing strategy |
| AGT-029 | claudekit-skills/frontend-development + ui-styling | Component architecture, Suspense patterns, feature organization |

---

## Added 2026-02-18 — DevOps, Quality & AI (AGT-030→033)

The following 4 skills complete the development lifecycle coverage:

| ID | Inspired By | Key Pattern |
|----|-------------|-------------|
| AGT-030 | claudekit-skills/devops (Cloudflare/Docker/GCP/K8s) | Platform selection decision tree, containerization strategy, GitOps workflows |
| AGT-031 | claudekit-skills/code-review (3-practice methodology) | No performative agreement, verification gates, evidence-before-claims |
| AGT-032 | claudekit-skills/mcp-builder (4-phase MCP dev) | Agent-centric MCP server design, evaluation harness, Python/TypeScript SDK |
| AGT-033 | claudekit-skills/ai-multimodal (Gemini API) | Multimodal processing: audio/image/video/document, cost optimization |

---

## Added 2026-02-18 — Business Operations (AGT-034)

The following skill extends CVF beyond development into business operator workflows, inspired by "The Operator's Guide to Opus 4.6" (LeadPanther):

| ID | Inspired By | Key Pattern |
|----|-------------|-------------|
| AGT-034 | "The Operator's Guide to Opus 4.6" + CVF governance overlay | 10 governed business workflows (Sales Pipeline, Prospecting, Ad Spend, Content, VoC, Product, Ops, Calendar, Finance, Competitive Intel) with verification gates, confidence scoring, and human-in-the-loop |

---

## Governance Specs

See parent directory for full governance specifications:
- [CVF_SKILL_SPEC.md](../../specs/CVF_SKILL_SPEC.md)
- [CVF_RISK_AUTHORITY_MAPPING.md](../../specs/CVF_RISK_AUTHORITY_MAPPING.md)
