# CVF MCP Server — v1.7

CVF Guard Runtime exposed as MCP (Model Context Protocol) tools for IDE integration.

## Overview

This MCP server allows AI agents in Windsurf, Cursor, and other MCP-compatible IDEs to be **automatically governed** by CVF guards. When connected, the IDE's AI agent can call CVF tools to check permissions before taking actions.

## Tools

| Tool | Description |
|---|---|
| `cvf_check_phase_gate` | Check if action is allowed in current CVF phase |
| `cvf_check_risk_gate` | Evaluate risk level (R0-R3) of an action |
| `cvf_check_authority` | Verify role authorization for an action |
| `cvf_validate_output` | Validate AI output quality and safety |
| `cvf_advance_phase` | Request phase advancement (DISCOVERY → REVIEW) |
| `cvf_get_audit_log` | Retrieve session audit trail |
| `cvf_evaluate_full` | Run full 6-guard pipeline on an action |

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run (stdio transport for MCP)
npm start
```

## IDE Configuration

### Windsurf

Add to your Windsurf MCP settings:

```json
{
  "mcpServers": {
    "cvf-guard-server": {
      "command": "node",
      "args": ["EXTENSIONS/CVF_v1.7_MCP_SERVER/dist/index.js"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "cvf-guard-server": {
      "command": "node",
      "args": ["EXTENSIONS/CVF_v1.7_MCP_SERVER/dist/index.js"]
    }
  }
}
```

## Guard Pipeline

All 6 guards run in priority order:

1. **Phase Gate** (P10) — Enforces DISCOVERY → DESIGN → BUILD → REVIEW sequence
2. **Risk Gate** (P20) — R0-R3 risk model, blocks AI at R3, escalates at R2
3. **Authority Gate** (P30) — Role-based restrictions (AI cannot approve/deploy/merge)
4. **Mutation Budget** (P40) — Limits changes per session based on risk level
5. **Scope Guard** (P50) — Protects governance files from AI modification
6. **Audit Trail** (P60) — Ensures traceability (requestId, agentId, traceHash)

## Agent Guidance (v1.7 Enhancement)

Unlike v1.6, guards now return **natural language guidance** when blocking or escalating:

```json
{
  "decision": "BLOCK",
  "guidance": "You are operating as AI_AGENT but the current phase is DISCOVERY. Your role can only operate in phases: BUILD. Wait for the human to complete this phase.",
  "suggestedAction": "switch_to_phase_BUILD"
}
```

## Testing

```bash
npm test          # Watch mode
npm run test:run  # Single run (416 tests)
```

## Architecture

```
src/
  guards/                   — Guard Runtime Engine (102 tests)
    types.ts                — Shared types (phases, risk, roles)
    engine.ts               — Deterministic pipeline
    phase-gate.guard.ts     — Phase enforcement + NL guidance
    risk-gate.guard.ts      — R0-R3 risk model + NL guidance
    authority-gate.guard.ts — Role authorization + NL guidance
    mutation-budget.guard.ts — Budget limits + NL guidance
    scope.guard.ts          — Path protection + NL guidance
    audit-trail.guard.ts    — Traceability + NL guidance
    index.ts                — Exports + factory
  persistence/              — Guard Persistence (26 tests)
    persistence.interface.ts — Adapter contract
    json-file.adapter.ts    — JSON file storage
  prompt/                   — System Prompt Generator (37 tests)
    system-prompt.ts        — Context-aware prompt with MCP tools
  cli/                      — CLI Wrapper (38 tests)
    cli.ts                  — 9 commands for terminal usage
  registry/                 — Unified Guard Registry (54 tests)
    guard-registry.ts       — Single source of truth for guards
    skill-guard-wire.ts     — Skill-to-guard mapping
  vibe-translator/          — Vibe-to-Action (96 tests)
    vibe-parser.ts          — NL intent/entity extraction (EN/VI)
    clarification-engine.ts — Slot filling + active clarification
    confirmation-card.ts    — Structured confirmation cards
  memory/                   — Session Memory (40 tests)
    session-memory.ts       — Cross-request state persistence
  integration/              — E2E Integration (23 tests)
    e2e-pipeline.test.ts    — Full pipeline tests
  sdk.ts                    — Barrel exports for consumers
  index.ts                  — MCP server entry point (7 tools)
```
