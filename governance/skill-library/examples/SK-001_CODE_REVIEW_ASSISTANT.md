# SKILL MAPPING RECORD — EXAMPLE
## SK-001: Code Review Assistant

> **Status:** ✅ Active  
> **Risk Level:** R2  
> **Last UAT:** 2026-02-07 — PASS

---

## 1. Skill Identity

| Field | Value |
|-------|-------|
| Skill ID | SK-001 |
| Skill Name | Code Review Assistant |
| Version | 1.2.0 |
| Source URL | Internal Development |
| Original Author | CVF Team |
| Intake Date | 2026-01-15 |
| Intake Owner | Tech Lead |

---

## 2. Capability Summary

### 2.1 Core Capability
Analyzes code changes and provides structured review feedback including:
- Security vulnerabilities
- Performance concerns
- Code style violations
- Best practice suggestions

### 2.2 Inputs
| Input | Type | Sensitivity | Required |
|-------|------|-------------|----------|
| Code diff | Text | Internal | Yes |
| File context | Text | Internal | No |
| Review criteria | Config | Public | No |

### 2.3 Outputs
| Output | Type | Persistence |
|--------|------|-------------|
| Review comments | JSON | Logged |
| Severity ratings | Enum | Logged |
| Suggestions | Text | Ephemeral |

### 2.4 Execution Model
| Property | Value |
|----------|-------|
| Invocation | Agent-invoked |
| Execution | Sync |
| Autonomy level | Conditional |

---

## 3. CVF Risk Mapping

### 3.1 Assigned Risk Level
- ☐ R0 – Informational (Read-only, no side effects)
- ☐ R1 – Advisory (Suggestions only, human confirmation required)
- ☑ **R2 – Assisted Execution** (Bounded actions, explicit invocation)
- ☐ R3 – Autonomous Execution (Multi-step, requires authorization)
- ☐ R4 – Critical / Blocked (Severe damage potential, execution blocked)

### 3.2 Risk Justification
- Produces actionable feedback that may influence code approval
- Does not directly modify code
- Requires human review before merge decision
- Bounded to single PR/commit scope

### 3.3 Failure Scenarios
| Mode | Description | Impact |
|------|-------------|--------|
| Primary | Misses security vulnerability | Medium - Human reviewer backup |
| Secondary | False positive blocking valid code | Low - Developer can override |
| Tertiary | Timeout on large codebase | Low - Graceful degradation |

### 3.4 Blast Radius Assessment
| Dimension | Assessment |
|-----------|------------|
| Scope of impact | Single code review session |
| Reversibility | Full - No code modified |
| Data exposure risk | Low - Internal code only |

---

## 4. Authority Mapping

### 4.1 Allowed Agent Roles
- ☐ Orchestrator
- ☐ Architect
- ☑ **Builder**
- ☑ **Reviewer**

### 4.2 Allowed CVF Phases
- ☐ Discovery
- ☐ Design
- ☑ **Build**
- ☑ **Review**

### 4.3 Decision Scope Influence
- ☐ Informational
- ☑ **Tactical** (influences immediate task decisions)
- ☐ Strategic (requires human oversight)

### 4.4 Autonomy Constraints
| Constraint | Value |
|------------|-------|
| Invocation conditions | Explicit request or CI trigger |
| Explicit prohibitions | Cannot auto-approve, cannot modify code |

> ⚠️ Undefined authority is forbidden by default.

---

## 5. Adaptation Requirements

- ☐ No adaptation required
- ☑ **Capability narrowing required** (Cannot execute code fixes)
- ☐ Execution sandboxing required
- ☑ **Additional audit hooks required** (Log all review decisions)

### Adaptation Details
1. **Removed:** Auto-fix capability from original tool
2. **Added:** Structured output format for audit
3. **Constrained:** Max file size to 10,000 lines

---

## 6. UAT & Validation Hooks

### 6.1 Required UAT Scenarios
| Scenario | Description |
|----------|-------------|
| Normal operation | Review clean code with minor issues |
| Boundary condition | Review code at max file size |
| Failure handling | Review malformed/binary files |

### 6.2 Output Validation
| Criteria | Check |
|----------|-------|
| Acceptance | All issues have severity + description |
| Rejection | Output contains auto-fix commands |

---

## 7. Decision Record

### 7.1 Intake Outcome
- ☐ Reject
- ☑ **Accept with Restrictions**
- ☐ Accept after Adaptation

### 7.2 Decision Rationale
Original tool had auto-fix capability which violates CVF principle of human-in-the-loop for code modifications. Restricted version provides value while maintaining governance.

### 7.3 Decision Authority
| Field | Value |
|-------|-------|
| Name / Role | Tech Lead / Governance Owner |
| Date | 2026-01-15 |
| Signature | Approved |

---

## 8. Lifecycle Controls

### 8.1 Review Cycle
| Field | Value |
|-------|-------|
| Review interval | 90 days |
| Next review date | 2026-05-07 |

### 8.2 Deprecation Conditions
- New review tool with better security coverage
- CVF authority model changes
- >3 UAT failures in review cycle

---

## 9. Audit References

| Reference | Link |
|-----------|------|
| CVF documents | `CVF_SKILL_RISK_AUTHORITY_LINK.md` |
| Change log | v1.0.0 → v1.2.0: Added timeout handling |
| Incident references | None |

---

## 10. Final Assertion

By approving this record, the decision authority confirms that:

- ✅ The skill is bound to CVF governance
- ✅ Its risks are understood and accepted
- ✅ Its authority is explicitly constrained

> ⚠️ Unrecorded usage of this skill constitutes a CVF violation.

---

**Approval Signatures:**

| Role | Name | Date |
|------|------|------|
| Skill Owner | CVF Team | 2026-01-15 |
| Governance Reviewer | Tech Lead | 2026-01-15 |
| Security Reviewer | Security Team | 2026-01-16 |
