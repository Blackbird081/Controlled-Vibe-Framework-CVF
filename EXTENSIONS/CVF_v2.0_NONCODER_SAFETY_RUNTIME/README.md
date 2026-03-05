# CVF v2.0 — Non-Coder Safety Runtime

> **Layer:** 4 (Safety UI) → 5 (Adapter) — bridges both
> **Status:** Governance Spec ✍️
> **Extends:** v1.7.2 (Safety Dashboard) + v1.7.3 (Runtime Adapter Hub)
> **Depends on:** v1.8 + v1.9 kernel as foundation
> **Folder:** `EXTENSIONS/CVF_v2.0_NONCODER_SAFETY_RUNTIME/`

---

## What is CVF v2.0?

v2.0 does one thing: **makes the v1.8+v1.9 kernel accessible to non-coders, safely.**

v2.0 is NOT adding intelligence. It is an **abstraction layer** that:
- Maps human language ("Is this safe?") to kernel policy
- Hides risk scores, mutation budgets, phase states from non-technical users
- Exposes 3 simple modes: SAFE / BALANCED / CREATIVE

```
"Non-coder does not understand: risk score, mutation budget, drift score.
 Non-coder understands: 'Is it safe?' 'Will it break my system?' 'Can I undo?'"
```

---

## Architecture

```
User (Non-Coder)
  ↓
Mode Abstraction Layer (v2.0) — maps: SAFE/BALANCED/CREATIVE → kernel policies
  ↓
Intent Interpreter — translates human language → structured intent
  ↓
Kernel (v1.8 + v1.9)         — enforces: determinism, risk, phase isolation
```

v2.0 does **NOT bypass** the kernel. It only provides a safe, simplified interface above it.

---

## Three Modes (Authoritative Definition)

> **Note:** This is the authoritative Creative Mode specification, superseding v1.7.1 Creative Control layer docs (per ADR-010).

| Mode | Risk Budget | Mutation Limit | Scope | Confirmation |
|------|-------------|----------------|-------|--------------|
| **SAFE** | R0–R1 only (score 0–5) | max 2 files, 50 lines | Single domain | Always confirm |
| **BALANCED** | R0–R2 (score 0–10) | max 5 files, 150 lines | Cross-domain | Confirm if R2 |
| **CREATIVE** | R0–R3 (score 0–15) | max 10 files, 300 lines | Broad | Confirm if R3 |

CRITICAL: R3+ (score 16+) = hard stop in ALL modes.

---

## Files in this folder

- **SPEC.md** — Mode definitions, Intent Interpreter, Confirmation Engine
- **BLUEPRINT.md** — Overall v2.0 architecture vision
- **CREATIVE_MODE_SPEC.md** — Authoritative SAFE/BALANCED/CREATIVE definition
- **INTEGRATION_NOTES.md** — Relationship with v1.7.2, v1.7.3, v1.8, v1.9
