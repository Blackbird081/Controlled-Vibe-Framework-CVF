# CVF Governance Doctrine

## I. Supremacy Rule

Governance overrides:
- Role decisions
- Reasoning output
- Learning injection
- Telemetry-based suggestions
- Input interpretation

No exception. R3 = hard BLOCK, always.

---

## II. Non-Autonomy Rule

CVF shall not:
- Self-modify rules automatically
- Override policy based on performance
- Introduce new roles without governance approval
- Activate new lessons without validation
- Lower risk scores based on telemetry

---

## III. Deterministic Priority Rule

Default reasoning mode = STRICT.

Creative reasoning must be explicitly permitted.

All prompts are hashed for reproducibility.
Model version is tracked in every snapshot.

---

## IV. Learning Constraint Rule

Lessons:
- Must be versioned
- Must pass conflict detection (keyword similarity ≥ 40%)
- Must be signed (integrity hash)
- Must not silently override policy
- Must be persisted to disk

---

## V. Auditability Rule

All governance events must be logged (append-only `.jsonl`).

Snapshots must allow reproducibility (prompt hash + model version).

Telemetry must be persisted with timestamps.

---

## VI. Input Boundary Rule

All external input must pass through prompt sanitizer before reaching reasoning gate.

Injection patterns are detected and neutralized:
- CRITICAL → BLOCK (governance bypass, policy override, unrestricted mode)
- HIGH → STRIP (role injection, system prompt injection)
- MEDIUM → LOG (context wipe, persona injection)

Reasoning gate no longer receives raw input.

---

## VII. Recursion Limit Rule

Role transitions are bounded:
- Max transition depth per session (default 20)
- Max same-role repetition (default 3)
- Oscillation pattern detection (A→B→A→B)

Violation → session auto-lock.

---

## VIII. Anomaly Protection Rule

Telemetry is not only passive measurement — it triggers governance restrictions:

- Mistake rate spike → STRICT mode
- Elegance degradation + verification drop → LOCKDOWN
- 2+ critical anomalies → full governance lock

Telemetry can only restrict, never grant more autonomy.

---

## IX. CVF Gốc Supremacy Rule

CVF base framework (v1.0–v1.6) is the absolute standard.

Extension adapts to base CVF — never the other way.
- Risk model: R0–R3 from base, mapped to riskScore 0.0–1.0
- Phase model: A/B/C/D from base, mapped to AgentRoles
- Skills: 124 base skills, bridged via cvfPhase field

---

## X. Version Escalation Rule

Major version (2.0) requires:
- Core governance redesign
- Architectural topology change

CVF 1.7.0 is a hardened extension, not a redesign.