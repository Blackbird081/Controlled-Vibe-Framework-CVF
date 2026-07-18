# CVF Gamma MCP Server Local Setup

Memory class: GUIDE_RECORD

docType: guide

Date: 2026-05-26

Status: GAMMA_LOCAL_SETUP_READY

## Owner / Source

Owner: Codex acting under the Gamma cross-agent memory progression roadmap.

Source artifacts:

- `docs/roadmaps/CVF_CROSS_AGENT_MEMORY_PROGRESSION_ROADMAP_2026-05-26.md`
- `docs/baselines/CVF_GC018_GAMMA_T1_T5_MCP_MEMORY_BOOTSTRAP_2026-05-26.md`
- `docs/work_orders/CVF_WO_GAMMA_T1_T5_MCP_MEMORY_BOOTSTRAP_2026-05-26.md`
- `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER`

## Purpose

Provide the local setup and verification path for the Gamma MCP server memory
bootstrap tools.

## Scope

This guide covers the private provenance workspace only. It does not publish
the MCP package, configure hosted infrastructure, or retire Alpha/Beta startup
acknowledgment rules.

## Protocol / Contract / Requirements

Gamma uses the existing CVF MCP server over stdio. The server must be built
before it is attached to Claude Desktop, Gemini, Cursor, Aider, or another MCP
client.

Requirements:

- The server exposes read-only startup memory, handoff, session state, and
  governance-rule tools.
- Tool outputs must be secret-safe and must not print raw API keys, tokens,
  passwords, or provider secrets.
- The local client config must point to `dist/index.js`, not `src/index.ts`.
- External client proof remains operator-tested. Local SDK-client verification
  proves the server contract only.
- If a client provides an official MCP management CLI, use that CLI instead of
  hand-writing an inferred config file. Client config file names and load paths
  are tool-specific and may differ from generic MCP examples.

## Build And Verify

Run from:

`EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER`

Commands:

```bash
npm run build
npm run test:run
npm run verify:gamma
```

Expected `verify:gamma` output:

```json
{
  "status": "PASS",
  "serverName": "cvf-guard-server",
  "toolCount": 14,
  "rawSecretPrinted": false
}
```

## MCP Client Configuration

Use a stdio MCP server entry that points at the built `dist/index.js` file.
Replace the absolute path with the local workspace path.

```json
{
  "mcpServers": {
    "cvf-gamma-memory": {
      "command": "node",
      "args": [
        "d:/UNG DUNG AI/TOOL AI 2026/Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/dist/index.js"
      ],
      "cwd": "d:/UNG DUNG AI/TOOL AI 2026/Controlled-Vibe-Framework-CVF"
    }
  }
}
```

Claude Code local project config should be created through the official Claude
Code MCP CLI:

```bash
claude mcp add -s local cvf-gamma-memory -- node "d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF\EXTENSIONS\CVF_ECO_v2.5_MCP_SERVER\dist\index.js"
claude mcp list
claude mcp get cvf-gamma-memory
```

Expected Claude Code health result:

```text
cvf-gamma-memory ... Connected
Scope: Local config (private to you in this project)
```

Do not rely on a hand-written `C:\Users\DELL\.claude\mcp.json` for Claude Code;
the 2026-05-26 operator test showed Claude Code did not load that file, while
`claude mcp add -s local ...` produced a connected server.

## Gamma Tools

Startup memory tools:

- `cvf_get_session_memory`
- `cvf_get_active_handoff`
- `cvf_get_session_state`
- `cvf_get_startup_acknowledgment`

Governance tools:

- `cvf_get_governance_rules`
- `cvf_check_governance_action`

Audit tool:

- `cvf_get_mcp_tool_audit_log`

Existing guard-runtime tools are preserved:

- `cvf_check_phase_gate`
- `cvf_check_risk_gate`
- `cvf_check_authority`
- `cvf_validate_output`
- `cvf_advance_phase`
- `cvf_get_audit_log`
- `cvf_evaluate_full`

## Startup Use Pattern

At session start, an MCP-compatible agent should call:

1. `cvf_get_startup_acknowledgment`
2. `cvf_get_session_state`
3. `cvf_get_session_memory`
4. `cvf_get_active_handoff`

For governed work, call `cvf_check_governance_action` before acting. If the
work touches live provider/API-key/CLI/MCP/browser proof, also load
`cvf_get_governance_rules` with topic `live_run`. If the work touches memory,
graph, intelligence, external skill, legacy absorption, or tool/MCP surfaces,
load topic `blindspot`.

## Enforcement / Verification

Before treating Gamma as locally complete, run the package checks listed in
`Build And Verify`.

Then run repository governance checks from the provenance workspace root:

```bash
python governance/compat/check_markdown_structural_completeness.py
python governance/compat/check_docs_governance_compat.py
python governance/compat/check_governed_file_size.py
python governance/compat/check_active_session_state.py
git diff --check
```

External MCP client testing is a separate operator checkpoint. A client is
accepted only if it can call `cvf_get_startup_acknowledgment` and return the
same active mode, handoff, next allowed move, and parked checkpoint recorded in
`CVF_SESSION/ACTIVE_SESSION_STATE.json`.

Observed external-client evidence:

- 2026-05-26 Claude Code PASS: operator restarted Claude Code after adding
  `cvf-gamma-memory` with `claude mcp add -s local`; Claude Code successfully
  called `cvf_get_startup_acknowledgment` and returned
  `contractVersion=cvf.mcpStartupState.gamma.v1`,
  `currentMode=gamma_t1_t5_mcp_memory_bootstrap_closed_pass_bounded`,
  `activeHandoff=AGENT_HANDOFF_V13_2026-05-25.md`, the correct repo root,
  next allowed move, and parked checkpoint.

## Claim Boundary

This guide proves local MCP server setup, local SDK-client verification, and
one operator-observed Claude Code external-client startup acknowledgment proof.
It does not prove every third-party MCP client auto-starts the server, hosted
availability, public release readiness, provider behavior, route behavior,
production readiness, or freeze release.

## Related Artifacts

- `docs/reviews/CVF_GAMMA_T0_MCP_SERVER_READINESS_AUDIT_2026-05-26.md`
- `docs/reviews/CVF_GAMMA_T1_T5_MCP_MEMORY_BOOTSTRAP_COMPLETION_2026-05-26.md`
- `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/README.md`
- `CVF_SESSION_MEMORY.md`
- `AGENT_HANDOFF_V13_2026-05-25.md`
- `CVF_SESSION/ACTIVE_SESSION_STATE.json`
