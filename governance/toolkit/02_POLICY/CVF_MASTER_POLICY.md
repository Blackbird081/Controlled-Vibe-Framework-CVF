# CVF MASTER POLICY

**Effective:** 12/02/2026  
**Applies to:** Internal teams & Enterprise deployments

---

## 1. PURPOSE

This policy governs the use of AI agents
within the organization under Controlled Vibe Framework (CVF).

The objective is to:
- Reduce operational risk
- Prevent uncontrolled AI usage
- Ensure traceability
- Maintain accountability

---

## 2. SCOPE

This policy applies to:

- All AI agents used for company work
- All departments
- All environments (dev, staging, production, local, cloud, SaaS tools)
- All CVF versions
- All skill libraries

Personal AI usage unrelated to company work is excluded.

---

## 3. CORE REQUIREMENTS

1. All AI agents must be registered.
2. All agents must declare risk level.
3. Self-UAT is mandatory before operational use.
4. No AI output may bypass human accountability.
5. All incidents must be documented.
6. Every software project must implement automated test coverage with:
   - a runnable coverage command,
   - a declared baseline report,
   - enforced minimum threshold in CI/local gate.

---

## 4. GOVERNANCE PRINCIPLES (Enterprise)

1. No agent without registry entry.
2. No production without Self-UAT PASS.
3. No certification without audit.
4. No operation without risk classification.
5. No version change without re-validation.

---

## 5. AUTHORITY STRUCTURE

- Governance Board (final authority)
- CVF Architect
- Agent Owner
- Operator
- Auditor

Separation of Duties is mandatory — see `CVF_SEPARATION_OF_DUTIES.md`.

---

## 6. ACCOUNTABILITY

- Agent Owner is responsible for correct usage.
- IT ensures technical compliance.
- Management approves HIGH/CRITICAL risk agents.

---

## 7. ENFORCEMENT

Violation of this policy results in:

- Immediate BLOCK
- Certification suspension
- Mandatory audit review

Unregistered or uncertified AI usage
may result in suspension of access.
