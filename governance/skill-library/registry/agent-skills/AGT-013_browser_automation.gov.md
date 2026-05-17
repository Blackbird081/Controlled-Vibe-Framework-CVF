# AGT-013: Browser Automation

> **Type:** Agent Skill  
> **Domain:** Web Interaction  
> **Status:** Active

---

## Source

Inspired by Anthropic computer-use-demo & browser-use-demo quickstarts (Playwright-based browser control with Docker isolation).  
Implementation in v1.6 AGENT_PLATFORM.  
Skill mapping: `governance/skill-library/examples/AGT-013_BROWSER_AUTOMATION.md`

---

## Capability

Controls a web browser through Playwright for navigation, DOM reading, form interaction, screenshot capture, and automated testing — all within an isolated Docker container.

**Actions:**
- Navigate to URLs within an approved domain allowlist
- Read page content and interactive elements (DOM inspection)
- Fill forms and interact with buttons/inputs
- Capture screenshots at each step
- Scroll, search text, and wait for page loads
- Execute in isolated Docker container with XVFB virtual display

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R3 – High** |
| Allowed Roles | Builder (primary) |
| Allowed Phases | Build only |
| Decision Scope | Tactical |
| Autonomy | Manual (explicit human approval required) |

---

## Risk Justification

- **External network access** – Navigates to real web domains
- **Credential exposure** – Form interactions may involve authentication data
- **State mutation** – Can submit forms, click buttons, trigger server-side actions
- **Container escape** – Must enforce strict Docker isolation
- **Resource consumption** – Browser sessions consume significant memory/CPU
- **Domain scope** – Must prevent navigation to unapproved external sites

---

## Constraints

- ✅ Docker container isolation mandatory (XVFB virtual display)
- ✅ Domain allowlist enforced (only pre-approved domains)
- ✅ No real credentials used (test data only)
- ✅ Every action logged (click, type, navigate, screenshot)
- ✅ Session timeout enforced (configurable, default 30s)
- ✅ Human approval required for domains not in allowlist
- ✅ Screenshots captured and stored for audit
- ❌ Cannot run on bare metal (must use container)
- ❌ Cannot navigate to unapproved domains without approval
- ❌ Cannot use real passwords or production credentials
- ❌ Cannot bypass session timeout
- ❌ Cannot disable action logging

---

## UAT Binding

**PASS criteria:**
- [ ] Runs in Docker container with XVFB
- [ ] Only navigates to approved domains
- [ ] No real credentials in form inputs
- [ ] All actions (click, type, navigate) logged
- [ ] Screenshots captured at each step
- [ ] Session terminates at timeout
- [ ] Human approval for new domains

**FAIL criteria:**
- [ ] Execution outside Docker container
- [ ] Navigation to unapproved domain without approval
- [ ] Real credentials used in automation
- [ ] Missing action logs
- [ ] Session exceeds timeout without termination
- [ ] Container escape detected
