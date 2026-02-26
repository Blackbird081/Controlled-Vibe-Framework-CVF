# CONTINUOUS GOVERNANCE LOOP

Controlled Vibe Framework (CVF) operates
as a continuous governance system,
not a one-time validation mechanism.

---

## 1. CORE PRINCIPLE

Governance must be:

- Persistent
- Re-evaluated
- Drift-resistant
- Version-aware

---

## 2. THE GOVERNANCE LOOP

The loop operates as follows:

CONFIGURATION
    ↓
HANDSHAKE
    ↓
SELF-UAT
    ↓
PRODUCTION ENABLED
    ↓
OPERATION
    ↓
DRIFT MONITORING
    ↓
TRIGGER EVENT
    ↓
RE-ENTER SELF-UAT
    ↓
UPDATED DECISION LOG
    ↓
LOOP CONTINUES

---

## 3. DRIFT DETECTION TRIGGERS

Self-UAT MUST re-run if:

- CVF version changes
- System prompt changes
- Phase matrix changes
- Risk policy changes
- New skill added
- Role authority modified
- Agent shows inconsistent refusal
- Operator explicitly requests re-validation
- Bug fix pushed without BUG_HISTORY.md documentation (see CVF_BUG_DOCUMENTATION_GUARD.md)

---

## 4. PERIODIC REVALIDATION (OPTIONAL BUT RECOMMENDED)

Recommended policy:

- Re-run Self-UAT every 100 interactions
- Or every 24 hours (whichever comes first)

This prevents gradual drift.

---

## 5. GOVERNANCE STATES

An agent can only be in one of the following states:

1. INITIALIZING
2. UNDER_SELF_UAT
3. PRODUCTION_ENABLED
4. BLOCKED
5. REVALIDATING

Transitions must be logged.

---

## 6. BLOCKING RULE

If any drift is detected:

Agent state → REVALIDATING

If re-validation fails:

Agent state → BLOCKED

No soft degradation allowed.

---

## 7. DECISION TRACEABILITY

Each governance cycle must produce:

- Updated Self-UAT Decision Log entry
- Updated operational scope declaration
- Timestamp

---

## 8. ARCHITECTURAL PHILOSOPHY

CVF does not trust:
- Memory
- Previous success
- Assumed stability

CVF only trusts:
- Current validated state

---

## 9. FINAL RULE

Governance is not an event.
Governance is a loop.

End of Continuous Governance Loop.
