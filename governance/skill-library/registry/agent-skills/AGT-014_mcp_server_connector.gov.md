# AGT-014: MCP Server Connector

> **Type:** Agent Skill  
> **Domain:** Tool Integration  
> **Status:** Active

---

## Source

Inspired by Anthropic claude-quickstarts patterns (MCP tool server architecture for dynamic tool discovery).  
Implementation in v1.6 AGENT_PLATFORM.  
Skill mapping: `governance/skill-library/examples/AGT-014_MCP_SERVER_CONNECTOR.md`

---

## Capability

Connects to external Model Context Protocol (MCP) servers, discovers available tools, validates schemas, and invokes tools with full audit logging.

**Actions:**
- Connect to MCP servers via stdio or HTTP transport
- Discover available tools and their schemas dynamically
- Validate tool input/output schemas before invocation
- Invoke discovered tools with parameters
- Log all connections, tool calls, and results
- Enforce connection timeouts and server allowlists

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R2 – Medium** |
| Allowed Roles | Orchestrator, Builder |
| Allowed Phases | Build, Review |
| Decision Scope | Tactical |
| Autonomy | Supervised (human confirms connections) |

---

## Risk Justification

- **External connectivity** – Connects to external server processes
- **Dynamic tools** – Discovered tools are not pre-audited by CVF governance
- **Data exposure** – Tool parameters may contain project-internal data
- **Server trust** – MCP servers execute arbitrary code on their end
- **Process management** – stdio servers spawn child processes
- **Schema drift** – Tool schemas may change between connections

---

## Constraints

- ✅ Server must be in approved server list
- ✅ Connection timeout enforced (default 15s)
- ✅ Tool schema validated before any invocation
- ✅ All results logged with server ID and tool name
- ✅ Environment variables for credentials managed securely
- ✅ Stdio servers monitored for unexpected behavior
- ❌ Cannot connect to servers not in approved list
- ❌ Cannot invoke tools without schema validation
- ❌ Cannot bypass connection timeout limits
- ❌ Cannot pass credentials in plaintext logs
- ❌ Cannot auto-approve new server connections

---

## UAT Binding

**PASS criteria:**
- [ ] Only connects to approved MCP servers
- [ ] Schema validation performed before tool invocation
- [ ] Connection timeout enforced (≤15s default)
- [ ] All tool calls logged with server ID, tool name, and parameters
- [ ] Credentials not exposed in logs
- [ ] Human confirmation for new server connections

**FAIL criteria:**
- [ ] Connection to unapproved server
- [ ] Tool invoked without schema validation
- [ ] Connection timeout bypassed
- [ ] Missing audit logs for tool invocations
- [ ] Credentials exposed in plaintext
- [ ] Auto-approval of new server connections
