# AGT-001: Web Search

> **Type:** Agent Skill  
> **Domain:** Information Retrieval  
> **Status:** Active

---

## Source

Implementation in v1.6 AGENT_PLATFORM

---

## Capability

Searches the web for information using search APIs.

**Actions:**
- Execute web search queries
- Return search results with snippets
- Filter by relevance

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R2 – Medium** |
| Allowed Roles | Orchestrator, Builder |
| Allowed Phases | Discovery, Design, Build |
| Decision Scope | Tactical |
| Autonomy | Conditional (rate-limited) |

---

## Risk Justification

- **External API calls** - Network dependency
- **Data exposure** - Query terms may contain sensitive info
- **Rate limiting** - API quota management needed
- **Result accuracy** - Cannot guarantee source reliability

---

## Constraints

- ✅ Max 10 searches per session
- ✅ No sensitive data in queries
- ✅ Results logged for audit
- ❌ Cannot auto-execute code from results
- ❌ Cannot access paywalled content

---

## UAT Binding

**PASS criteria:**
- [ ] Respects rate limits
- [ ] Logs all queries
- [ ] Returns structured results
- [ ] No sensitive data leakage

**FAIL criteria:**
- [ ] Exceeds rate limits
- [ ] Unlogged external calls
- [ ] Returns unverified information without disclaimers
