# CVF Durable Execution Policy

> **Status:** CANONICAL
> **Version:** 1.0.0
> **Date:** 2026-03-09
> **Closes:** W4 — Broader Durable Execution Coverage

---

## 1. Purpose

This document defines the **ecosystem-wide durable execution policy** — how long-running workflows, recovery, replay, and orchestration are governed across all CVF extensions.

**Problem solved:** Before this policy, durable execution capabilities (rollback, replay, checkpoint/resume) existed at runtime baseline but lacked a broader orchestration strategy covering cross-extension workflows.

---

## 2. Durable Execution Capabilities

CVF currently provides these durable execution primitives:

| Capability | Extension | Status |
|------------|-----------|--------|
| **Rollback/Recovery** | v1.8 Safety Hardening | ACTIVE — 42 tests |
| **Deterministic Replay** | v1.9 Deterministic Reproducibility | ACTIVE — 29 tests |
| **Checkpoint/Resume** | v1.8 + v1.9 combined | ACTIVE |
| **Session-linked Audit** | v1.1.1 Phase Governance Protocol | ACTIVE |
| **Cross-extension Recovery** | v1.1.1 + remediation pipeline | ACTIVE |
| **Remediation Receipts** | Remediation pipeline | ACTIVE |

---

## 3. Orchestration Scope

### 3.1 Single-Extension Workflows

Workflows within a single extension boundary:

```
Start → Checkpoint → Execute → [Failure?] → Rollback → Retry → Complete
                                    ↓
                              Resume from checkpoint
```

**Policy:** Each extension MUST handle its own rollback and recovery internally.

### 3.2 Cross-Extension Workflows

Workflows spanning multiple extensions:

```
Extension A (checkpoint) → Extension B (execute) → Extension C (audit)
         ↓                         ↓                       ↓
    A.rollback()              B.rollback()           C.rollback()
```

**Policy:**

1. Cross-extension workflows MUST record checkpoint at each extension boundary
2. Rollback MUST proceed in reverse order (C → B → A)
3. Each extension MUST expose a `rollback()` capability if it participates in cross-extension workflows
4. Governance Executor coordinates rollback sequence via `GovernanceAuditLog`

### 3.3 Long-Running Orchestration

Workflows exceeding a single session:

| Scenario | Strategy | Evidence |
|----------|----------|----------|
| Multi-session build | Checkpoint per phase, resume on new session | Phase report per checkpoint |
| Incident recovery | Replay from last good checkpoint | Remediation receipt |
| Governance migration | Staged rollout with rollback gates | Migration audit trail |

---

## 4. Checkpoint Policy

### 4.1 When to Checkpoint

| Trigger | Mandatory | Example |
|---------|-----------|---------|
| Phase transition | Yes | Discovery → Design → Build → Review |
| Extension boundary crossing | Yes | v1.8 → v1.9 → v1.1.1 |
| Risk level escalation | Yes | R1 → R2, R2 → R3 |
| Human approval point | Yes | Before executing R2+ actions |
| Time threshold exceeded | Recommended | >30 min without checkpoint |

### 4.2 Checkpoint Contents

Every checkpoint MUST contain:

```json
{
  "checkpointId": "CP-{timestamp}-{hash}",
  "sessionId": "session-{id}",
  "phase": "BUILD",
  "extensionContext": "CVF_v1.8_SAFETY_HARDENING",
  "stateSnapshot": { },
  "auditTrail": [ ],
  "rollbackCapable": true,
  "timestamp": "2026-03-09T12:00:00Z"
}
```

### 4.3 Checkpoint Retention

| Type | Retention | Reason |
|------|-----------|--------|
| Phase checkpoints | Until workflow complete + 1 cycle | Recovery window |
| Error checkpoints | Permanent (in audit log) | Forensic analysis |
| Remediation checkpoints | Until remediation confirmed | Rollback safety |

---

## 5. Replay Policy

### 5.1 Deterministic Replay Requirements

- Replay MUST produce identical output given identical input + state
- Context Freezer (v1.9) MUST capture all external dependencies
- ExecutionRecord (v1.9) MUST be immutable after creation

### 5.2 Replay Scope

| Scope | Supported | Notes |
|-------|-----------|-------|
| Single action | Yes | Replay one governance check |
| Phase | Yes | Replay entire Build phase |
| Session | Yes | Replay full session from checkpoint |
| Cross-extension | Partial | Requires all extensions to support replay |

---

## 6. Recovery Policy

### 6.1 Automatic Recovery

| Failure Type | Auto-Recovery Action | Escalation |
|--------------|---------------------|------------|
| Transient error | Retry (max 3 attempts) | Checkpoint + alert |
| State corruption | Rollback to last checkpoint | Human review required |
| Extension failure | Isolate + rollback affected extension | Continue other extensions |
| Governance violation | Hard stop + audit entry | No auto-recovery |

### 6.2 Manual Recovery

When auto-recovery fails:

1. System provides last valid checkpoint
2. Human reviews audit trail
3. Human chooses: resume from checkpoint, rollback entirely, or manual fix
4. Decision recorded in remediation receipt

---

## 7. Cross-Extension Coordination

### 7.1 Coordination Protocol

Extensions participating in durable workflows MUST:

1. Register their `rollback()` capability in the governance contract
2. Accept checkpoint/resume signals from the coordinator
3. Report completion/failure status to `GovernanceAuditLog`
4. Support deterministic replay of their execution segment

### 7.2 Failure Isolation

```
Extension A ✅ → Extension B ❌ → Extension C (not started)
                      ↓
              B.rollback()
              A.rollback() (if B's failure affects A's output)
              C: skip (never started)
```

**Rule:** Rollback is conservative — if uncertain whether upstream extensions are affected, roll them back too.

---

## 8. Monitoring

| Metric | Alert Threshold | Action |
|--------|----------------|--------|
| Checkpoint age | >24h without update | Warn — possible stale workflow |
| Rollback frequency | >3 rollbacks in 1 session | Review — possible systemic issue |
| Replay divergence | Any non-deterministic result | Block — integrity violation |
| Cross-extension recovery time | >5 min | Warn — performance degradation |

---

## 9. Cross-Reference

| Document | Role |
|----------|------|
| `EXTENSIONS/CVF_v1.8_SAFETY_HARDENING/` | Rollback/recovery implementation |
| `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/` | Replay engine, context freezer |
| `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/` | Phase state machine, audit log |
| `CVF_ECOSYSTEM_GOVERNANCE_CONTRACT.md` | Parent governance contract |
| `CVF_SKILL_ROLLOUT_POLICY.md` | Skill lifecycle (related orchestration) |
