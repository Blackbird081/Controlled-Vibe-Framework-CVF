# CVF v1.8 — Safety Hardening

> **Layer:** 2.5 — Safety Runtime
> **Status:** Governance Spec ✍️ (Code implementation is future scope)
> **Extends:** v1.7 (Controlled Intelligence) + v1.7.1 (Safety Runtime)
> **Folder:** `EXTENSIONS/CVF_v1.8_SAFETY_HARDENING/`
> **Architecture Check:** Completed — see `REVIEW/COMPAT_AI_Runtime.md` and ADR-010

---

## What is CVF v1.8?

CVF v1.8 **hardens** the existing v1.7.1 Safety Kernel into a fully deterministic, audit-grade execution system.

This is NOT a replacement of v1.7.1. It is the **specification for the next evolution** of the same kernel (see ADR-010).

**Core philosophy:**
```
"AI is an untrusted executor. Kernel is the trusted authority."
```

---

## What v1.8 Adds to v1.7.1

| v1.7.1 Component | v1.8 Enhancement |
|-----------------|-----------------|
| Domain Lock | Role Lock System — immutable for execution lifetime |
| Contract Runtime | Phase Isolation Engine — zero phase bleed, no re-entry |
| Contamination Guard | Anomaly Detector + Drift Monitor |
| Refusal Router | Governance Brain with escalation tiers (L0–L3) |
| Creative Control | Mutation Budget System — quantified limits per mode |

**New in v1.8 (not in v1.7.1):**
- Execution Lifecycle Controller (7-phase state machine: INTENT→COMMIT)
- Deterministic Mutation Sandbox (AI proposes → Kernel applies)
- Rollback Manager (every execution has a rollback key)
- Stability Index (self-regulating governance)
- Behavior Drift Monitor (cross-execution trend analysis)

---

## Key Specifications

- **SPEC.md** — Strict enforcement rules (the 7-phase lifecycle)
- **OPERATIONAL_SPEC.md** — ExecutionContext schema, phase transitions, hard safety guarantees
- **GOVERNANCE_MODEL.md** — Risk formula, mutation budget, escalation tiers
- **ARCHITECTURE.md** — Component overview and design philosophy
- **TREEVIEW.md** — TypeScript file structure (future implementation target)
- **INTEGRATION_NOTES.md** — How v1.8 relates to v1.7.1 in practice

---

## Relationship with Other Versions

```
v1.7   (Controlled Intelligence) — provides: Reasoning Gate, Entropy Guard
  ↓ refined by
v1.7.1 (Safety Runtime)          — provides: 5-Layer Kernel, 51 tests, production baseline
  ↓ hardened by
v1.8   (Safety Hardening)        — this spec — adds: determinism, phase isolation, drift control
  ↓ extended by
v1.9   (Deterministic Reproducibility) — adds: replay engine, forensic audit trail
```

---

> **Implementation note:** When implementing v1.8 code, start with v1.7.1 codebase as the base.
> Do not build parallel implementation. See ADR-010 for rationale.
