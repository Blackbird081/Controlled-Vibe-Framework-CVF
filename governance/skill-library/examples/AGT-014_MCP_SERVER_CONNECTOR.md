# SKILL MAPPING RECORD
## AGT-014: MCP Server Connector

> **Status:** ✅ Active  
> **Risk Level:** R2  
> **Last UAT:** 2026-02-17 — PASS

---

## 1. Skill Identity

| Field | Value |
|-------|-------|
| Skill ID | AGT-014 |
| Skill Name | MCP Server Connector |
| Version | 1.0.0 |
| Source URL | https://github.com/anthropics/anthropic-quickstarts/tree/main/agents |
| Original Author | Anthropic (agents module) |
| Intake Date | 2026-02-17 |
| Intake Owner | CVF Governance Team |

---

## 2. Capability Summary

### 2.1 Core Capability
Connects to Model Context Protocol (MCP) servers for dynamic tool discovery, capability negotiation, and tool invocation. Inspired by the agents quickstart module's MCP server integration, which enables Claude-based agents to discover and use tools hosted on external MCP servers (both `stdio`-based local processes and `sse`-based remote servers). The skill:
- Connects to a configured MCP server using the `stdio` or `sse` transport
- Discovers available tools via the MCP `tools/list` protocol
- Maps discovered tools to CVF-compatible skill definitions with risk metadata
- Invokes selected tools via the MCP `tools/call` protocol with parameter validation
- Monitors server health and connection status
- Enforces a server allowlist and per-tool timeout limits

### 2.2 Inputs
| Input | Type | Sensitivity | Required |
|-------|------|-------------|----------|
| Server config | JSON object (`type`: `stdio`\|`sse`, `command`, `args`, `url`) | Internal | Yes |
| Tool name | String | Public | Yes (for invocation) |
| Tool parameters | JSON object | Internal | Yes (for invocation) |
| Server allowlist | String array (server identifiers) | Internal | Yes (configured at init) |
| Per-tool timeout | Integer (ms) | Public | No (default: 15 000 ms) |
| Max concurrent connections | Integer (1–5) | Public | No (default: 1) |

### 2.3 Outputs
| Output | Type | Persistence |
|--------|------|-------------|
| Tool invocation result | JSON (content array with text/image blocks) | Logged |
| Discovered tools list | JSON array (name, description, input schema) | Logged |
| Server status | Enum: `connected`, `disconnected`, `error`, `timeout` | Logged |
| Connection latency (ms) | Integer | Ephemeral |
| Invocation latency (ms) | Integer | Logged |
| Error details | JSON object | Logged |

### 2.4 Execution Model
| Property | Value |
|----------|-------|
| Invocation | Agent-invoked |
| Execution | Async (with timeout) |
| Autonomy level | Supervised |
| Timeout | 15 000 ms per tool call; 60 000 ms for server connection |

---

## 3. CVF Risk Mapping

### 3.1 Assigned Risk Level
- ☐ R0 – Informational (Read-only, no side effects)
- ☐ R1 – Advisory (Suggestions only, human confirmation required)
- ☑ **R2 – Assisted Execution** (Bounded actions, explicit invocation)
- ☐ R3 – Autonomous Execution (Multi-step, requires authorization)
- ☐ R4 – Critical / Blocked (Severe damage potential, execution blocked)

### 3.2 Risk Justification
- Establishes connections to external processes or remote servers
- Invoked tools execute code or perform actions outside the agent's sandbox
- The MCP protocol enables dynamic tool discovery — tools are not statically known at intake time
- Server allowlist and timeout limits constrain the attack surface
- Each tool invocation is explicit and supervised (not chained autonomously)
- Classified as R2 rather than R3 because invocations are single-step, explicit, and supervised — the skill does not autonomously chain multiple tool calls

### 3.3 Failure Scenarios
| Mode | Description | Impact |
|------|-------------|--------|
| Primary | MCP server unavailable / connection refused | Low — Graceful error with retry guidance |
| Secondary | Server responds with malformed tool definitions | Medium — Validation rejects malformed schemas; no invocation attempted |
| Tertiary | Tool invocation timeout | Low — Tool call aborted; error returned to agent |
| Quaternary | Server returns unexpected/malicious content | Medium — Output validation sanitizes results; large payloads truncated |
| Quinary | Unauthorized server connection attempt | Blocked — Server allowlist enforcement rejects request |
| Senary | Server process crash (`stdio` transport) | Medium — Connection error detected; automatic cleanup of child process |

### 3.4 Blast Radius Assessment
| Dimension | Assessment |
|-----------|------------|
| Scope of impact | Single tool invocation on a single MCP server |
| Reversibility | Depends on the invoked tool — some tools may have side effects |
| Data exposure risk | Medium — Tool parameters may contain sensitive data sent to external server |

---

## 4. Authority Mapping

### 4.1 Allowed Agent Roles
- ☑ **Orchestrator**
- ☐ Architect
- ☑ **Builder**
- ☐ Reviewer

### 4.2 Allowed CVF Phases
- ☐ Discovery
- ☐ Design
- ☑ **Build**
- ☑ **Review**

### 4.3 Decision Scope Influence
- ☐ Informational
- ☑ **Tactical** (influences immediate task decisions)
- ☐ Strategic (requires human oversight)

### 4.4 Autonomy Constraints
| Constraint | Value |
|------------|-------|
| Invocation conditions | Explicit agent request; server must be in allowlist; tool must be in discovered tools list |
| Explicit prohibitions | Must not connect to servers outside the allowlist; must not invoke tools with parameters exceeding 1 MB; must not chain tool invocations autonomously (each call requires explicit agent decision); must not persist server credentials or tokens beyond the session; must not spawn server processes with elevated privileges |

> ⚠️ Undefined authority is forbidden by default.

---

## 5. Adaptation Requirements

- ☐ No adaptation required
- ☑ **Capability narrowing required** (Server allowlist, single-call supervision)
- ☑ **Execution sandboxing required** (Stdio server processes run with restricted permissions)
- ☑ **Additional audit hooks required** (Full invocation logging with parameters and results)

### Adaptation Details
1. **Added:** Server allowlist — only pre-approved MCP servers can be connected; the original agents module allows arbitrary server configuration
2. **Added:** Tool schema validation — discovered tools must have valid JSON Schema input definitions; tools with missing or malformed schemas are excluded
3. **Added:** Parameter size limit — tool parameters are capped at 1 MB to prevent memory exhaustion
4. **Added:** Output sanitization — tool results are scanned for potentially dangerous content (embedded scripts, excessive size) and sanitized before returning to the agent
5. **Added:** Stdio process restrictions — server processes launched via `stdio` transport run without elevated privileges and with restricted filesystem access
6. **Constrained:** Single-call supervision — unlike the original agents module which can chain MCP tool calls in an agentic loop, this skill requires explicit agent decision-making between each tool invocation
7. **Constrained:** Maximum 5 concurrent MCP server connections

---

## 6. UAT & Validation Hooks

### 6.1 Required UAT Scenarios
| Scenario | Description |
|----------|-------------|
| Stdio connection | Connect to a local MCP server via stdio transport, discover tools, invoke one |
| SSE connection | Connect to a remote MCP server via SSE transport, discover tools, invoke one |
| Server allowlist enforcement | Attempt connection to non-allowed server; verify rejection |
| Tool discovery | Connect and enumerate all available tools with schemas |
| Tool invocation | Invoke a discovered tool with valid parameters; verify structured result |
| Invalid parameters | Invoke tool with parameters violating its schema; verify validation error |
| Connection timeout | Attempt connection to unresponsive server; verify timeout and clean error |
| Tool timeout | Invoke a slow-running tool; verify per-tool timeout enforcement |
| Output sanitization | Receive tool result with oversized payload; verify truncation |
| Process cleanup | Disconnect from stdio server; verify child process is terminated |

### 6.2 Output Validation
| Criteria | Check |
|----------|-------|
| Acceptance | Tool results conform to MCP content block format (text/image) |
| Acceptance | Discovered tools include name, description, and valid input schema |
| Acceptance | Invocation log includes timestamp, server ID, tool name, parameters (redacted if sensitive), result summary, and latency |
| Rejection | Connection to a server not in the allowlist |
| Rejection | Tool invocation with parameters exceeding 1 MB |
| Rejection | Output containing embedded executable content |

---

## 7. Decision Record

### 7.1 Intake Outcome
- ☐ Reject
- ☑ **Accept with Restrictions**
- ☐ Accept after Adaptation

### 7.2 Decision Rationale
The MCP server integration pattern from Anthropic's agents quickstart module addresses a critical need: dynamic tool extensibility. MCP enables agents to discover and use tools beyond the statically defined skill set. Accepted at R2 because each tool invocation is explicit and supervised (not autonomously chained). Restrictions enforce server allowlists, parameter validation, output sanitization, process-level sandboxing, and full invocation audit logging. The skill bridges the gap between CVF's governed skill model and the broader MCP ecosystem while maintaining governance control.

### 7.3 Decision Authority
| Field | Value |
|-------|-------|
| Name / Role | CVF Governance Team / Skill Intake Owner |
| Date | 2026-02-17 |
| Signature | Approved |

---

## 8. Lifecycle Controls

### 8.1 Review Cycle
| Field | Value |
|-------|-------|
| Review interval | 60 days (intermediate cycle due to external dependency) |
| Next review date | 2026-04-18 |

### 8.2 Deprecation Conditions
- MCP protocol specification changes incompatibly
- Security vulnerability in MCP transport layer unpatched for > 14 days
- Server allowlist management becomes operationally infeasible
- >2 UAT failures in a review cycle
- CVF introduces native MCP integration superseding this skill

---

## 9. Audit References

| Reference | Link |
|-----------|------|
| Source pattern | [anthropic-quickstarts/agents](https://github.com/anthropics/anthropic-quickstarts/tree/main/agents) |
| MCP specification | [Model Context Protocol](https://modelcontextprotocol.io/) |
| CVF documents | `CVF_SKILL_RISK_AUTHORITY_LINK.md` |
| Change log | v1.0.0: Initial intake from agents module MCP server integration pattern |
| Incident references | None |

---

## 10. Final Assertion

By approving this record, the decision authority confirms that:

- ✅ The skill is bound to CVF governance
- ✅ Its risks are understood and accepted
- ✅ Its authority is explicitly constrained to Orchestrator and Builder roles
- ✅ Server allowlist enforcement is mandatory
- ✅ Tool schema validation is active
- ✅ Output sanitization is active
- ✅ Full invocation logging is enabled for audit traceability
- ✅ Each tool invocation is supervised, not autonomously chained

> ⚠️ Unrecorded usage of this skill constitutes a CVF violation.

---

**Approval Signatures:**

| Role | Name | Date |
|------|------|------|
| Skill Owner | CVF Governance Team | 2026-02-17 |
| Governance Reviewer | CVF Governance Team | 2026-02-17 |
| Security Reviewer | Security Team | 2026-02-17 |
