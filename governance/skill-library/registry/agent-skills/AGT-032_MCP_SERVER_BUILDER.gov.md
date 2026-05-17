# AGT-032: MCP Server Builder

## Governance Metadata
- **ID:** AGT-032
- **Name:** MCP Server Builder
- **Version:** 1.0.0
- **Risk Level:** R2 — Supervised (creates server code, external API integration)
- **Authority:** Orchestrator, Builder
- **Phase:** Implementation, Integration
- **Dependencies:** AGT-014 (MCP Server Connector), AGT-024 (MCP Context Isolation), AGT-025 (API Architecture)
- **Provenance:** Extracted from claudekit-skills/mcp-builder (4-phase MCP development workflow), rewritten to CVF governance

---

## Purpose

Structured methodology for building **production-quality MCP (Model Context Protocol) servers** that enable LLMs to interact with external services. Covers agent-centric design principles, 4-phase development workflow, and evaluation-driven quality assurance.

---

## When to Use

- Building MCP servers to integrate external APIs for Claude/LLMs
- Creating custom tool servers (Python FastMCP or TypeScript SDK)
- Designing tool interfaces optimized for agent consumption
- Testing MCP servers with evaluation harnesses

---

## Agent-Centric Design Principles

### Build for Workflows, Not API Endpoints
| ❌ API-Centric | ✅ Agent-Centric |
|---------------|-----------------|
| `get_user`, `get_user_orders`, `get_order_items` | `get_user_with_recent_activity` (consolidated) |
| Raw API response dump | Structured, high-signal summary |
| Technical IDs everywhere | Human-readable names by default |
| Generic error messages | Actionable error with next-step suggestion |

### Design Principles Checklist
- [ ] **Workflow-oriented**: Tools enable complete tasks, not just API calls
- [ ] **Context-efficient**: Every token counts — concise default, detailed on request
- [ ] **Actionable errors**: "Try using filter='active_only' to reduce results"
- [ ] **Natural naming**: Tool names reflect how humans think about tasks
- [ ] **Consistent prefixes**: Related tools grouped (e.g., `project_list`, `project_get`, `project_create`)

---

## 4-Phase Development Workflow

```
Phase 1: Research & Plan    Phase 2: Implement    Phase 3: Review & Refine    Phase 4: Evaluate
─────────────────────────   ──────────────────    ────────────────────────    ─────────────────
Study MCP protocol          Project structure     Code quality review         10 eval questions
Study target API            Core infrastructure   DRY principle check         Answer verification
Plan tool selection         Implement tools       Type safety audit           XML eval file
Design I/O schemas          Add annotations       Build & syntax check        Agent testing
```

---

## Phase 1: Research & Planning

### 1.1 MCP Protocol Essentials
```
MCP Server Architecture:
┌─────────────┐    stdio/SSE    ┌─────────────┐
│  LLM Client │ ◄────────────► │  MCP Server  │
│  (Claude)   │    JSON-RPC    │  (Your Code) │
└─────────────┘                └──────┬───────┘
                                      │
                                ┌─────▼─────┐
                                │ External   │
                                │ API/Service│
                                └───────────┘
```

### 1.2 Tool Design Template
For each tool, define:
```
Tool Name: [verb_noun format, e.g., search_issues]
Description: [One-line: what it does]
              [Detailed: when to use, when NOT to use]
Input Schema: [Pydantic/Zod with constraints, defaults, examples]
Output Format: [JSON for structured, Markdown for readable]
Error Handling: [Expected errors and actionable messages]
Annotations:
  - readOnlyHint: [true/false]
  - destructiveHint: [true/false]
  - idempotentHint: [true/false]
  - openWorldHint: [true/false]
```

### 1.3 Implementation Plan Checklist
- [ ] List all tools to implement (prioritized by use case frequency)
- [ ] Identify shared utilities (auth, pagination, formatting, error handling)
- [ ] Define input validation models (Pydantic v2 / Zod strict)
- [ ] Design response format (JSON + Markdown options, concise/detailed levels)
- [ ] Plan character limits and truncation (e.g., 25K token max)
- [ ] Plan error handling strategy (auth errors, rate limits, timeouts)

---

## Phase 2: Implementation

### Python (FastMCP) Pattern
```python
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field

mcp = FastMCP("my-service", description="Integration with MyService API")

# --- Shared Infrastructure ---
CHARACTER_LIMIT = 25_000
API_BASE_URL = "https://api.myservice.com/v2"

async def api_request(method: str, path: str, **kwargs) -> dict:
    """Shared API request handler with auth, retries, error handling."""
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method, f"{API_BASE_URL}{path}",
            headers={"Authorization": f"Bearer {get_api_key()}"},
            timeout=30.0, **kwargs
        )
        response.raise_for_status()
        return response.json()

# --- Input Models ---
class SearchParams(BaseModel):
    query: str = Field(description="Search query string")
    limit: int = Field(default=10, ge=1, le=100, description="Max results (1-100)")
    format: str = Field(default="concise", pattern="^(concise|detailed)$")

# --- Tools ---
@mcp.tool(annotations={"readOnlyHint": True, "openWorldHint": True})
async def search_items(params: SearchParams) -> str:
    """Search items in MyService.

    Use when: Finding specific items by keyword or criteria.
    Returns: List of matching items with name, ID, and status.
    """
    data = await api_request("GET", "/items/search", params={"q": params.query, "limit": params.limit})
    return format_results(data, params.format)
```

### TypeScript (MCP SDK) Pattern
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({ name: "my-service", version: "1.0.0" });

// --- Input Schemas ---
const SearchSchema = z.object({
  query: z.string().describe("Search query string"),
  limit: z.number().min(1).max(100).default(10).describe("Max results (1-100)"),
  format: z.enum(["concise", "detailed"]).default("concise"),
}).strict();

// --- Tools ---
server.registerTool("search_items", {
  description: "Search items in MyService. Use when finding specific items by keyword.",
  inputSchema: SearchSchema,
  annotations: { readOnlyHint: true, openWorldHint: true },
}, async (params) => {
  const data = await apiRequest("GET", `/items/search?q=${params.query}&limit=${params.limit}`);
  return { content: [{ type: "text", text: formatResults(data, params.format) }] };
});
```

---

## Phase 3: Review & Refine

### Quality Checklist
| Category | Check | Required |
|----------|-------|----------|
| **DRY** | No duplicated API call logic between tools | ✅ |
| **Types** | Full type coverage (no `any` in TS, type hints in Python) | ✅ |
| **Validation** | All inputs validated with constraints (min, max, regex) | ✅ |
| **Errors** | All external calls wrapped with error handling | ✅ |
| **Docs** | Every tool has description + when to use + examples | ✅ |
| **Annotations** | readOnlyHint, destructiveHint set on all tools | ✅ |
| **Limits** | Character limit enforced on responses | ✅ |
| **Pagination** | Large result sets paginated or capped | ✅ |
| **Auth** | API keys from env vars, never hardcoded | ✅ |
| **Async** | All I/O operations use async/await | ✅ |

### Build Verification
```bash
# Python
python -m py_compile your_server.py    # Syntax check
mypy your_server.py                     # Type check

# TypeScript
npm run build                           # Compile
npx tsc --noEmit                       # Type check only
```

⚠️ **WARNING**: MCP servers are long-running processes. Never run directly in main process for testing — use evaluation harness or tmux.

---

## Phase 4: Evaluation

### Create 10 Evaluation Questions
Each question MUST be:
- **Independent**: No dependency on other questions
- **Read-only**: Only non-destructive tools required
- **Complex**: Requires multiple tool calls
- **Realistic**: Based on real use cases
- **Verifiable**: Single clear answer, string-comparable
- **Stable**: Answer won't change over time

### Evaluation File Format
```xml
<evaluation>
  <qa_pair>
    <question>How many active projects does the organization have
    that were created in the last 30 days?</question>
    <answer>7</answer>
  </qa_pair>
  <!-- 9 more qa_pairs -->
</evaluation>
```

---

## Tool Annotation Reference

| Annotation | Meaning | Example |
|------------|---------|---------|
| `readOnlyHint: true` | No side effects | search, list, get operations |
| `destructiveHint: true` | Irreversible action | delete, overwrite operations |
| `idempotentHint: true` | Repeated calls = same result | update with full payload |
| `openWorldHint: true` | Interacts with external systems | API calls, web requests |

---

## Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Wrap every API endpoint as a tool | Design workflow-oriented tools |
| Return raw API JSON to LLM | Format as concise, human-readable summaries |
| Use technical IDs in responses | Use human-readable names (+ IDs as reference) |
| Generic "An error occurred" | "Rate limited — retry after 30 seconds" |
| Skip tool annotations | Always set readOnly/destructive/idempotent hints |
| Test by running server directly | Use evaluation harness or tmux |

---

## Constraints
- MCP server creation requires Builder or Orchestrator role (R2)
- All external API integrations must handle rate limiting gracefully
- Tool descriptions must be clear enough for LLM to self-select correctly
- Evaluation must be created and pass before server is considered production-ready
- Secrets (API keys) must NEVER be hardcoded — use environment variables
