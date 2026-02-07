# AGT-005: JSON Parse

> **Type:** Agent Skill  
> **Domain:** Data Processing  
> **Status:** Active

---

## Source

Implementation in v1.6 AGENT_PLATFORM

---

## Capability

Parse and validate JSON data structures.

**Actions:**
- Parse JSON strings
- Validate JSON syntax
- Extract nested values
- Format JSON output

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R0 – Minimal** |
| Allowed Roles | All roles |
| Allowed Phases | All phases |
| Decision Scope | Informational |
| Autonomy | Auto |

---

## Risk Justification

- **No external calls** - Local processing
- **Read-only** - No data modification
- **Deterministic** - Consistent parsing
- **Safe operations** - Pure transformation

---

## Constraints

- ✅ Parse/validate only
- ✅ Standard JSON format
- ✅ Results logged
- ❌ No code execution
- ❌ No file operations

---

## UAT Binding

**PASS criteria:**
- [ ] Valid JSON parsed correctly
- [ ] Invalid JSON returns error
- [ ] No side effects

**FAIL criteria:**
- [ ] Parse errors on valid JSON
- [ ] Silent failure on invalid JSON
