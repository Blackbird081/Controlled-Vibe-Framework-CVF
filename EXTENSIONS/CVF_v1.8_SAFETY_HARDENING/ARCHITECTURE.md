# CVF v1.8 — Architecture Overview

> **Source:** Adapted from `CVF AI Runtime/Blueprint.md` (v1.8 portions)
> **Layer:** 2.5 — Safety Runtime

---

## Design Philosophy

CVF v1.8 establishes the **Control Kernel** — a deterministic layer that treats AI as an untrusted input source.

```
CVF 2.0 Vision: "A Deterministic AI Execution Kernel with a Non-Coder Safety Interface above."
CVF 1.8 role:   Builds the Control Kernel that v1.9 and v2.0 will depend on.
```

---

## Control Kernel Components (v1.8)

### 1. Execution Lifecycle Controller
Every action passes through:
```
INTENT → ROLE_VALIDATION → RISK_SCORING → SCOPE_CHECK
→ REASONING_GATE → MUTATION_SANDBOX → VERIFICATION → COMMIT/ROLLBACK
```

### 2. Phase Isolation Engine
- Analysis phase and Mutation phase are completely separated
- Cannot reason during mutation
- Cannot mutate during reasoning
- Contract per phase (input/output spec enforced)

### 3. Deterministic Mutation Sandbox
Every change has:
- Pre-mutation snapshot
- Impact calculation
- Mutation budget limit
- Rollback key

AI proposes → Kernel applies. AI never directly modifies.

### 4. Governance Brain
Manages:
- Risk scorer (formula-based, not heuristic)
- Severity matrix
- Escalation logic (L0–L3 tiers)
- Autonomy matrix (per mode × per role)

### 5. Stability & Elegance Monitor
- Drift Monitor: cross-execution trend analysis
- Stability Index: auto-regulates autonomy level
- Elegance Guard: structural quality check at VERIFICATION

---

## Relationship to v1.7 Layer 2.5 Components

```
v1.7 Reasoning Gate      → refined by v1.8 REASONING_GATE phase
v1.7 Entropy Guard       → refined by v1.8 Anomaly Detector
v1.7.1 Domain Lock       → refined by v1.8 Role Lock System
v1.7.1 Contract Runtime  → refined by v1.8 Phase Isolation Engine
v1.7.1 Contamination Guard → refined by v1.8 Anomaly Detector + Drift Monitor
v1.7.1 Refusal Router    → refined by v1.8 Governance Brain → Escalation
v1.7.1 Creative Control  → refined by v1.8 Mutation Budget System
```

**v1.7.1 remains production kernel.** v1.8 spec is the roadmap for the next iteration.
