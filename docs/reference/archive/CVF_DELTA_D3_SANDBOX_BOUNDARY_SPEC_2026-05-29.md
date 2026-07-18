# CVF Delta D3 — MCP→CLI Bridge Sandbox Boundary Specification

Memory class: FULL_RECORD

Status: APPROVED

docType: sandbox_boundary_spec

Date: 2026-05-29

---

## Purpose

Define, review, and approve the sandbox boundary for `cvf_invoke_cli_stage` —
the MCP tool that wires `runCli()` from the CVF MCP SDK into the governed MCP
surface. This specification must be present and approved before any D3 code.

Process spawning is the highest-risk operation in the CVF codebase. Every
constraint in this spec is a hard enforcement requirement, not a guideline.

## Scope

Applies to: `cvf_invoke_cli_stage` MCP tool in `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts`.

Owner: CVF MCP server. Tool targets `runCli()` at `src/cli/cli.ts` line 290.

Does not cover: `cvf_submit_review_receipt`, `cvf_advance_pipeline_stage` (D2 scope),
any future shell-spawning bridge (requires separate R3 sandbox spec).

---

## 1. Command Whitelist

`cvf_invoke_cli_stage` accepts only the following subcommands from the CVF
MCP SDK's `runCli()` function:

| Allowed command | Purpose |
| --- | --- |
| `evaluate` | Evaluate an action against governance rules |
| `status` | Get current session status |
| `help` | Get help text |

**Rejected commands** — any other string → reject with `command_not_whitelisted`:
- `rm`, `del`, `rmdir` — filesystem destruction
- `curl`, `wget`, `fetch` — network egress
- `git push`, `git commit` — VCS mutation
- Any string containing `..` — path traversal
- Any string containing `;`, `&&`, `||`, `|` — shell injection
- Any string not exactly matching an allowed command

The command is validated against the whitelist **before** `runCli()` is called.

## 2. Timeout

Hard kill at **300 seconds** (5 minutes), matching `WORKER_TIMEOUT_DEFAULT_MS`
from `pipeline-chain-orchestrator.ts`. The MCP tool:

1. Invokes `runCli()` synchronously (it is a synchronous function)
2. If `runCli()` throws or takes longer than expected, returns `timeout_exceeded` error
3. Never hangs the MCP server — wraps in try/catch

## 3. Working Directory Restriction

`runCli()` in the MCP SDK is an in-process function — it does not spawn a shell
process or change working directory. It runs the CVF CLI logic in-process.

Therefore:
- No working directory restriction is needed (no shell, no filesystem access beyond what `runCli()` itself uses)
- No `..` path escape is possible via `runCli()`

## 4. Log Capture

All output from `runCli()` is returned as a structured `CliResult` object:

```typescript
interface CliResult {
  success: boolean;
  command: string;
  output: Record<string, unknown>;
  exitCode: number;
}
```

The MCP tool returns this as JSON in the `content` array. No stdout/stderr is
silently discarded — the full `output` object is included in the response.

## 5. Audit Entry

Every invocation writes an audit record to the MCP in-memory audit store
**before** calling `runCli()`. The record contains:

| Field | Value |
| --- | --- |
| `tool` | `cvf_invoke_cli_stage` |
| `callerRole` | `agentRole` from input |
| `command` | the requested command string |
| `inputHash` | SHA-256 of JSON-serialized input |
| `timestamp` | ISO 8601 UTC |
| `decision` | `ALLOW` (command whitelisted) or `REJECT` |
| `auditRecordId` | unique ID returned to caller |

The audit record is written via `withMcpToolAudit()` wrapper — same pattern
as all other MCP tools.

## 6. State Isolation

`runCli()` is synchronous and in-process. The CVF MCP SDK's `runCli()`
creates a fresh guard engine evaluation context per call — there is no shared
mutable state between invocations at the `runCli()` level.

The MCP server's singleton `engine` instance is not passed to `runCli()` —
`runCli()` creates its own evaluation context internally.

## Actor Whitelist

| Tool | Allowed caller roles |
| --- | --- |
| `cvf_invoke_cli_stage` | `OPERATOR`, `ORCHESTRATOR`, `AI_AGENT` |

## Error Handling

| Scenario | Response |
| --- | --- |
| Command not in whitelist | `accepted: false`, `rejectionReason: command_not_whitelisted` |
| Role not authorized | `accepted: false`, `rejectionReason: role_not_authorized` |
| `runCli()` throws | `accepted: false`, `rejectionReason: cli_execution_error`, `error: message` |
| Missing `command` input | `accepted: false`, `rejectionReason: validation_error` |

## Approval

Sandbox boundary approved by operator authorization 2026-05-29.
D3 code may proceed per Execution Plan in work order
`docs/work_orders/CVF_WO_DELTA_D3_MCP_CLI_BRIDGE_2026-05-29.md`.

## Claim Boundary

This boundary covers only `cvf_invoke_cli_stage` with the specific `runCli()`
from `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/cli/cli.ts`. It does not cover:
- Arbitrary shell execution or process spawning
- Network egress from any tool
- Multi-user or remote MCP transport
- Production deployment or hosted readiness
