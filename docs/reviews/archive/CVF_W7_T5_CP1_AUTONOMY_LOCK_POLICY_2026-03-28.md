---
tranche: W7-T5
checkpoint: CP1
title: Autonomy Lock Policy
date: 2026-03-28
status: DELIVERED
gate: P6
---

# W7-T5 / CP1 — Autonomy Lock Policy

Memory class: FULL_RECORD

> Lane: Full Lane (GC-019)
> Gate delivered: P6 — SATISFIED
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T5_SPEC_INFERENCE_AUTONOMY_LOCK_2026-03-28.md`

---

## 1. Assisted Mode — Canonical Definition

**Assisted mode** is the default operating posture for all W7 agent operations. In assisted mode:

- The agent proposes actions; a human reviews and approves each before execution
- No autonomous mutation of skills, specs, plans, or capabilities occurs
- G5 (AUTONOMY_LOCK_GUARD) remains active and enforces the proposal-only posture
- Observability signals are emitted to LPF for every proposed action (advisory, not blocking)

All W7 concepts default to assisted mode unless all autonomous mode preconditions below are explicitly satisfied.

---

## 2. Autonomous Mode Preconditions

Autonomous mode is permitted ONLY when ALL of the following are true simultaneously:

| # | Precondition | Verification |
|---|---|---|
| 1 | `riskLevel` ≤ R1 for the specific operation | G1 (RISK_CLASSIFICATION_GUARD) confirms |
| 2 | Confidence threshold met: `confidence = 'high'` | Contract field check at decision point |
| 3 | EPF policy gate returns PASS for the operation | `policy.gate.contract.ts` PASS result |
| 4 | Human checkpoint completed and logged | Audit record exists in GEF `governance.audit.signal.contract.ts` |
| 5 | G5 AUTONOMY_LOCK_GUARD explicitly released for this operation | G5 release token present in execution context |

If ANY precondition fails, the operation remains in assisted mode. G5 hard-blocks execution. The system MUST NOT degrade autonomy checks silently.

---

## 3. Autonomy Level Matrix

| Risk Level | Default Mode | G5 Status | Escalation |
|---|---|---|---|
| R0 | Assisted (passthrough permitted for read-only) | Inactive for reads; active for writes | None |
| R1 | Assisted | Active | LPF advisory signal on proposal |
| R2 | Assisted (hard block on autonomous) | Active — cannot be released without P-03 policy gate PASS | EPF policy gate + GEF audit signal |
| R3 | Assisted (hard block — permanent unless P6 all preconditions pass) | Active — hard block | EPF policy gate + GEF watchdog escalation + human confirmation |

---

## 4. Per-Concept Autonomy Posture

| W7 Concept | Default Mode | Autonomous Permitted? | Required Preconditions |
|---|---|---|---|
| Skill (read) | Assisted | Yes (R0 read-only) | G3 ownership check passes |
| Skill (extract) | Assisted | No | Always requires human approval at REVIEW phase |
| Skill (activate/retire) | Assisted | No | P-03 policy gate; R2 minimum; not autonomously released |
| StructuredSpec (infer) | Assisted | No | DESIGN-phase only; inference triggers proposal, not execution |
| StructuredSpec (execute) | Assisted | No | Spec confidence alone MUST NOT trigger execution; full P6 preconditions required |
| PlannedAction (draft) | Assisted | Yes (R0/R1 with confidence='high') | All 5 preconditions |
| PlannedAction (execute) | Assisted | No (R2+) | EPF policy gate required; G5 active |
| Capability (invoke) | Assisted | No | Capability invocation always requires policy gate (P-06/P-07 presets) |

---

## 5. G5 Escalation Protocol

When G5 fires (AUTONOMY_LOCK_GUARD blocks an operation):

```
G5 triggers
  → EPF hard block (ExecutionPipelineReceipt with status: BLOCKED)
  → GEF watchdog escalation signal emitted (watchdog.escalation.contract.ts)
  → Human notification required (notification route defined by deployment config)
  → Operation placed in PENDING_HUMAN_REVIEW queue
  → No retry until human checkpoint completed and audit record created
```

G5 block records are NEVER silently swallowed. They MUST appear in:
- EPF execution receipt (status: BLOCKED, reason: AUTONOMY_LOCK_GUARD)
- GEF audit trail (event: AUTONOMY_LOCK_TRIGGERED)
- LPF observability surface (advisory signal for pattern detection)

---

## 6. Gate Outcome

**P6 SATISFIED** — Autonomy Lock Policy is fully defined:
- Assisted mode is the canonical default for all W7 operations
- Autonomous mode requires all 5 preconditions simultaneously
- G5 escalation protocol is explicit and non-bypassable
- Per-concept posture is consistent with W7-T2 risk model and W7-T3 guard matrix
