# SKILL MAPPING RECORD
## AGT-013: Browser Automation

> **Status:** ✅ Active  
> **Risk Level:** R3  
> **Last UAT:** 2026-02-17 — PASS

---

## 1. Skill Identity

| Field | Value |
|-------|-------|
| Skill ID | AGT-013 |
| Skill Name | Browser Automation |
| Version | 1.0.0 |
| Source URL | https://github.com/anthropics/anthropic-quickstarts/tree/main/browser-use-demo |
| Original Author | Anthropic (browser-use-demo) |
| Intake Date | 2026-02-17 |
| Intake Owner | CVF Governance Team |

---

## 2. Capability Summary

### 2.1 Core Capability
Navigates web pages, reads DOM content, fills forms, clicks elements, and captures screenshots using a headless browser instance. Inspired by the browser-use-demo quickstart's Playwright-based browser tools API, which exposes structured browser actions (navigate, click, type, screenshot, read page) to an AI agent via a tool-use interface. The skill:
- Launches an isolated headless Chromium instance via Playwright
- Provides atomic browser actions: `navigate`, `click`, `type`, `select`, `scroll`, `screenshot`, `read_page`, `go_back`, `go_forward`, `wait`
- Returns structured results including page title, URL, visible text content, and base64 screenshots
- Enforces a domain allowlist to prevent navigation to unauthorized sites
- Runs in an isolated container with no access to host filesystem or network services beyond HTTP/HTTPS

### 2.2 Inputs
| Input | Type | Sensitivity | Required |
|-------|------|-------------|----------|
| URL | String (valid URL) | Internal | Yes (for `navigate`) |
| Action type | Enum: `navigate`, `click`, `type`, `select`, `scroll`, `screenshot`, `read_page`, `go_back`, `go_forward`, `wait` | Public | Yes |
| Element selector | String (CSS selector or ARIA ref) | Public | Depends on action |
| Input value | String | Confidential | Depends on action |
| Domain allowlist | String array | Internal | Yes (configured at init) |
| Viewport size | Integer pair (width × height px) | Public | No (default: 1280×720) |
| Wait timeout | Integer (ms) | Public | No (default: 5 000 ms) |

### 2.3 Outputs
| Output | Type | Persistence |
|--------|------|-------------|
| Page content (visible text) | String | Ephemeral |
| Page title | String | Logged |
| Current URL | String | Logged |
| Screenshot (base64 PNG) | String | Ephemeral |
| Action result | JSON object (success, error, element found) | Logged |
| Console errors | String array | Logged |

### 2.4 Execution Model
| Property | Value |
|----------|-------|
| Invocation | Agent-invoked (Builder role only) |
| Execution | Async (with per-action timeout) |
| Autonomy level | Manual (requires explicit human authorization) |
| Timeout | 5 000 ms per action; 120 000 ms per session |

---

## 3. CVF Risk Mapping

### 3.1 Assigned Risk Level
- ☐ R0 – Informational (Read-only, no side effects)
- ☐ R1 – Advisory (Suggestions only, human confirmation required)
- ☐ R2 – Assisted Execution (Bounded actions, explicit invocation)
- ☑ **R3 – Autonomous Execution** (Multi-step, requires authorization)
- ☐ R4 – Critical / Blocked (Severe damage potential, execution blocked)

### 3.3 Risk Justification
- **Interacts with external web services** — side effects on third-party systems possible (form submissions, button clicks)
- Multi-step sequences (navigate → find element → type → click) constitute autonomous execution chains
- Form filling could inadvertently submit sensitive data to external sites
- Screenshot capture may expose sensitive on-screen content
- Browser vulnerabilities could be exploited by malicious page content
- Domain allowlist and container isolation are critical mitigations

### 3.3 Failure Scenarios
| Mode | Description | Impact |
|------|-------------|--------|
| Primary | Navigation to blocked domain | Blocked — Domain allowlist enforcement rejects request |
| Secondary | Element selector not found on page | Low — Action returns error, no side effect |
| Tertiary | Malicious page attempts browser exploit | Medium — Isolated container limits blast radius; Chromium sandbox provides defense-in-depth |
| Quaternary | Form submission to unauthorized endpoint | High — Mitigated by prohibiting credential input and domain allowlist |
| Quinary | Session timeout during multi-step sequence | Low — Session terminates cleanly, no partial form submissions |
| Senary | CAPTCHA or bot detection blocks automation | Low — Action returns error; no bypass attempts |

### 3.4 Blast Radius Assessment
| Dimension | Assessment |
|-----------|------------|
| Scope of impact | External web pages within domain allowlist |
| Reversibility | Partial — Read actions are reversible; form submissions may not be |
| Data exposure risk | High — Screenshots and page content may contain sensitive data |

---

## 4. Authority Mapping

### 4.1 Allowed Agent Roles
- ☐ Orchestrator
- ☐ Architect
- ☑ **Builder**
- ☐ Reviewer

### 4.2 Allowed CVF Phases
- ☐ Discovery
- ☐ Design
- ☑ **Build**
- ☐ Review

### 4.3 Decision Scope Influence
- ☐ Informational
- ☑ **Tactical** (influences immediate task decisions)
- ☐ Strategic (requires human oversight)

### 4.4 Autonomy Constraints
| Constraint | Value |
|------------|-------|
| Invocation conditions | Requires explicit human authorization per session; Builder role only; Build phase only |
| Explicit prohibitions | Must not navigate outside domain allowlist; must not input credentials, passwords, API keys, or tokens into any form field; must not bypass CAPTCHA or bot detection; must not download or execute files; must not interact with payment forms; must not persist cookies or session tokens beyond the session |

> ⚠️ Undefined authority is forbidden by default.

---

## 5. Adaptation Requirements

- ☐ No adaptation required
- ☑ **Capability narrowing required** (Domain-restricted, no credential input)
- ☑ **Execution sandboxing required** (Isolated container mandatory)
- ☑ **Additional audit hooks required** (Full action and screenshot logging)

### Adaptation Details
1. **Added:** Domain allowlist enforcement — every `navigate` action is validated against the configured allowlist; redirects to non-allowed domains are blocked
2. **Added:** Credential input prohibition — the `type` action rejects input values that match common credential patterns (passwords, API keys, tokens) using heuristic detection
3. **Added:** Container isolation — the Playwright browser runs inside an isolated container with no host filesystem access, no access to `localhost` or internal network services, and restricted outbound connections to allowed domains only
4. **Removed:** File download capability — the original browser-use-demo allows downloading files; this is blocked
5. **Removed:** Cookie/session persistence — session state is ephemeral and discarded after each session
6. **Added:** Action logging — every browser action (including screenshots) is logged with timestamp, URL, action type, and result
7. **Constrained:** Maximum 50 actions per session; maximum session duration of 120 seconds

---

## 6. UAT & Validation Hooks

### 6.1 Required UAT Scenarios
| Scenario | Description |
|----------|-------------|
| Normal navigation | Navigate to an allowed domain, read page content, take screenshot |
| Multi-step sequence | Navigate → find element → type text → click button → verify result |
| Domain blocking | Attempt to navigate to a non-allowed domain; verify rejection |
| Redirect blocking | Navigate to allowed domain that redirects to non-allowed domain; verify blocking |
| Credential detection | Attempt to type a password-like string; verify rejection |
| Element not found | Attempt to click a non-existent selector; verify graceful error |
| Session timeout | Exceed maximum session duration; verify clean termination |
| Action limit | Exceed 50 actions; verify session termination |
| Container isolation | Verify no access to host filesystem or localhost services |

### 6.2 Output Validation
| Criteria | Check |
|----------|-------|
| Acceptance | All logged actions include timestamp, URL, action type, and result |
| Acceptance | Screenshots are valid base64-encoded PNG images |
| Acceptance | Page content is returned as structured text (not raw HTML) |
| Rejection | Any navigation to a domain not in the allowlist |
| Rejection | Any credential-like input submitted via the `type` action |
| Rejection | Any file download initiated by the browser |

---

## 7. Decision Record

### 7.1 Intake Outcome
- ☐ Reject
- ☑ **Accept with Restrictions**
- ☐ Accept after Adaptation

### 7.2 Decision Rationale
The browser automation pattern from Anthropic's browser-use-demo quickstart enables agents to interact with web applications for testing, data extraction, and workflow automation. This is an inherently high-risk capability due to external side effects and data exposure potential. Accepted at R3 with extensive restrictions: Builder-only access, Build-phase only, mandatory human authorization, domain allowlist, credential input prohibition, container isolation, action limits, and full audit logging. These constraints transform an open-ended browser agent into a controlled, auditable web interaction tool.

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
| Review interval | 30 days (accelerated due to R3 risk level) |
| Next review date | 2026-03-19 |

### 8.2 Deprecation Conditions
- Any container escape or sandbox bypass incident (immediate suspension)
- Credential exfiltration detected (immediate suspension)
- Playwright or Chromium critical vulnerability unpatched for > 7 days
- >1 UAT failure in a review cycle (stricter threshold for R3)
- Superior browser automation framework with native CVF integration available

---

## 9. Audit References

| Reference | Link |
|-----------|------|
| Source pattern | [anthropic-quickstarts/browser-use-demo](https://github.com/anthropics/anthropic-quickstarts/tree/main/browser-use-demo) |
| CVF documents | `CVF_SKILL_RISK_AUTHORITY_LINK.md` |
| Change log | v1.0.0: Initial intake from browser-use-demo Playwright-based browser tools pattern |
| Incident references | None |

---

## 10. Final Assertion

By approving this record, the decision authority confirms that:

- ✅ The skill is bound to CVF governance
- ✅ Its risks are understood and accepted
- ✅ Its authority is explicitly constrained to Builder role, Build phase only
- ✅ Domain allowlist enforcement is mandatory
- ✅ Credential input is prohibited
- ✅ Container isolation is mandatory
- ✅ Full action logging is active for audit traceability
- ✅ Human authorization is required before each session

> ⚠️ Unrecorded usage of this skill constitutes a CVF violation.

---

**Approval Signatures:**

| Role | Name | Date |
|------|------|------|
| Skill Owner | CVF Governance Team | 2026-02-17 |
| Governance Reviewer | CVF Governance Team | 2026-02-17 |
| Security Reviewer | Security Team | 2026-02-17 |
| Risk Committee | CVF Risk Board | 2026-02-17 |
