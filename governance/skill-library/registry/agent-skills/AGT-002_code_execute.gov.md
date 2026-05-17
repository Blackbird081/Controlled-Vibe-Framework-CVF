# AGT-002: Code Execute

> **Type:** Agent Skill  
> **Domain:** Code Execution  
> **Status:** Active

---

## Source

Implementation in v1.6 AGENT_PLATFORM

---

## Capability

Executes code snippets in a sandboxed environment.

**Actions:**
- Execute JavaScript/Python code
- Return execution results
- Capture stdout/stderr

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R3 – High** |
| Allowed Roles | Builder (only) |
| Allowed Phases | Build (only) |
| Decision Scope | Tactical |
| Autonomy | Human confirmation required |

---

## Risk Justification

- **Code execution** - Potential for malicious code
- **Resource consumption** - CPU/memory limits needed
- **Side effects** - May modify state
- **Security** - Sandbox escape risks

---

## Constraints

- ✅ Sandboxed execution only
- ✅ 30-second timeout
- ✅ Memory limit 256MB
- ✅ All executions logged
- ❌ No filesystem access
- ❌ No network access from sandbox
- ❌ No system calls

---

## UAT Binding

**PASS criteria:**
- [ ] Executes in sandbox only
- [ ] Respects timeout limits
- [ ] Logs all executions
- [ ] No side effects outside sandbox

**FAIL criteria:**
- [ ] Sandbox escape attempted
- [ ] Timeout exceeded
- [ ] Unlogged execution
- [ ] External system access
