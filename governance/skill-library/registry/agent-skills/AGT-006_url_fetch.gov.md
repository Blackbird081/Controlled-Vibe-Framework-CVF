# AGT-006: URL Fetch

> **Type:** Agent Skill  
> **Domain:** External Integration  
> **Status:** Active

---

## Source

Implementation in v1.6 AGENT_PLATFORM

---

## Capability

Fetch data from external URLs.

**Actions:**
- HTTP GET requests
- API data retrieval
- Webpage content fetch
- Response parsing

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R2 – Medium** |
| Allowed Roles | Orchestrator, Builder |
| Allowed Phases | Execute, Deploy |
| Decision Scope | External |
| Autonomy | Supervised |

---

## Risk Justification

- **External calls** - Risk of data exposure
- **Network dependency** - Timeout/failure risks
- **Content unpredictable** - Untrusted sources
- **URL validation required** - Prevent SSRF attacks

---

## Constraints

- ✅ Approved domains only (allowlist)
- ✅ Request timeout enforced
- ✅ Response size limits
- ✅ All requests logged
- ❌ No POST/PUT/DELETE
- ❌ No localhost access
- ❌ No internal network access

---

## Security Controls

- Domain allowlist validation
- Rate limiting per session
- Response sanitization
- SSL/TLS required

---

## UAT Binding

**PASS criteria:**
- [ ] Domain validation active
- [ ] Timeouts enforced
- [ ] Request logged with URL
- [ ] Response sanitized

**FAIL criteria:**
- [ ] Unvalidated URL access
- [ ] No access logging
- [ ] Internal network reached
