# CVF Skill Rollout Policy

> **Status:** CANONICAL
> **Version:** 1.0.0
> **Date:** 2026-03-09
> **Closes:** W3 — Broader Skill Governance Operationalization

---

## 1. Purpose

This document defines the **ecosystem-wide skill rollout policy** — how skills are promoted, deprecated, blocked, and replaced across all CVF extensions and runtimes.

**Problem solved:** Before this policy, skill governance was operational at runtime baseline (blocking, successor, dependency checks) but lacked a broader rollout strategy for the ecosystem.

---

## 2. Skill Lifecycle States

Every skill in the CVF ecosystem follows this state machine:

```
DRAFT → ACTIVE → DEPRECATED → REVOKED
                      ↓
                  SUPERSEDED (has successor)
```

| State | Meaning | Runtime Behavior |
|-------|---------|------------------|
| `DRAFT` | Under development, not yet approved | Blocked from production use |
| `ACTIVE` | Approved, tested, available | Full execution allowed |
| `DEPRECATED` | Scheduled for removal, successor available | Warning issued, execution allowed |
| `SUPERSEDED` | Deprecated AND successor is ACTIVE | Auto-redirect to successor if configured |
| `REVOKED` | Permanently blocked | Hard block, no execution |

---

## 3. Rollout Stages

New skills follow a staged rollout:

### Stage 1 — Draft & Review

- Skill spec written per `CVF_SKILL_INTAKE_RECORD.md` template
- Architecture Check (9 questions) completed
- Assigned to a domain (1 of 12)
- Risk level assessed (R0–R3)

### Stage 2 — Canary (Limited Scope)

- Skill marked `ACTIVE` in registry
- Available only to specified agents/projects
- Monitoring enabled for anomalies
- Duration: minimum 1 governance cycle

### Stage 3 — General Availability

- Canary passed with no blocking issues
- Skill added to Skill Library index
- Available to all agents/projects
- Documentation updated in `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/`

### Stage 4 — Deprecation (when needed)

- Successor skill identified and at Stage 3
- Deprecation notice added to registry
- Grace period: minimum 1 major version cycle
- Consumers receive warning at runtime

### Stage 5 — Revocation (when needed)

- Grace period expired OR security issue found
- Skill marked `REVOKED` in registry
- Hard block at runtime — no execution
- Audit log entry generated for traceability

---

## 4. Replacement Policy

When a skill is replaced:

| Scenario | Action | Automation |
|----------|--------|------------|
| 1:1 replacement | Set `successor` field | Runtime auto-redirect available |
| Split (1 → N) | Set `successors[]` array | Consumer must choose |
| Merge (N → 1) | All predecessors point to same successor | Runtime auto-redirect |
| Breaking change | New skill, old revoked | Hard migration required |

### Successor Resolution Rules

1. If skill has single `successor` → auto-resolve at runtime
2. If skill has multiple `successors` → consumer MUST explicitly choose
3. If skill is `REVOKED` with no successor → execution blocked, error returned
4. Successor MUST be at `ACTIVE` state before predecessor can be `DEPRECATED`

---

## 5. Cross-Extension Rollout

Skills that span multiple extensions:

| Rule | Enforcement |
|------|-------------|
| Skill registry is the single source of truth | `governance/skill-library/registry/` |
| All extensions read skill state from registry | No local skill state caching |
| Skill version MUST match extension compatibility | `phase-compatibility` check |
| Dependency chain validated before activation | `dependency-status` check |

---

## 6. Monitoring & Gates

### Rollout Gates

| Gate | When | Pass Criteria |
|------|------|---------------|
| Intake Gate | Before Stage 1 | Spec complete, Architecture Check passed |
| Canary Gate | Before Stage 3 | No anomalies during canary period |
| Deprecation Gate | Before Stage 4 | Successor at Stage 3, grace period defined |
| Revocation Gate | Before Stage 5 | Grace period expired OR security justification |

### Runtime Monitoring

- `skill_lifecycle` module (v3.0) tracks state transitions
- Governance Executor logs skill usage in audit trail
- Anomaly: skill used >100 times after DEPRECATED → escalate

---

## 7. Cross-Reference

| Document | Role |
|----------|------|
| `v3.0/*/skill_lifecycle/` | Runtime implementation of skill state machine |
| `governance/skill-library/registry/` | Canonical skill registry |
| `CVF_SKILL_INTAKE_RECORD.md` | Intake template |
| `SKILL_INTAKE_GOVERNANCE.md` | Intake governance process |
| `CVF_ECOSYSTEM_GOVERNANCE_CONTRACT.md` | Parent governance contract |
