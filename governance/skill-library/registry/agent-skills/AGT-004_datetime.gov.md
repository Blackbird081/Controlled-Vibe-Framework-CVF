# AGT-004: DateTime

> **Type:** Agent Skill  
> **Domain:** Utility  
> **Status:** Active

---

## Source

Implementation in v1.6 AGENT_PLATFORM

---

## Capability

Get current date/time and perform date calculations.

**Actions:**
- Get current datetime
- Format dates
- Calculate time differences
- Timezone conversions

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

- **Read-only** - Only reads system time
- **Deterministic** - Consistent behavior
- **No side effects** - Pure utility
- **Audit trail** - Usage logged

---

## Constraints

- ✅ Date/time retrieval only
- ✅ Standard formats used
- ❌ No state modification
- ❌ No external dependencies

---

## UAT Binding

**PASS criteria:**
- [ ] Correct datetime returned
- [ ] Proper formatting
- [ ] Timezone handling correct

**FAIL criteria:**
- [ ] Incorrect time values
- [ ] Invalid formatting
