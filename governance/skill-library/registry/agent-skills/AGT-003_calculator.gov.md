# AGT-003: Calculator

> **Type:** Agent Skill  
> **Domain:** Computation  
> **Status:** Active

---

## Source

Implementation in v1.6 AGENT_PLATFORM

---

## Capability

Performs mathematical calculations.

**Actions:**
- Arithmetic operations
- Mathematical functions
- Unit conversions

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

- **Pure computation** - No side effects
- **Deterministic** - Same input = same output
- **No external calls** - Self-contained
- **Audit trail** - Results logged

---

## Constraints

- ✅ Mathematical operations only
- ✅ Results logged
- ❌ No state modification
- ❌ No external dependencies

---

## UAT Binding

**PASS criteria:**
- [ ] Correct calculations
- [ ] Results logged
- [ ] No side effects

**FAIL criteria:**
- [ ] Incorrect calculations
- [ ] Unlogged operations
