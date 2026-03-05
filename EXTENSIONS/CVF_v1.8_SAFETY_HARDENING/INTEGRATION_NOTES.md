# CVF v1.8 — Integration Notes

> **Purpose:** Clarify how v1.8 relates to existing CVF components at integration time

---

## 1. Relationship with v1.7.1 Safety Kernel

**Decision (ADR-010):** v1.8 *refines* v1.7.1 — same Layer 2.5, NOT a separate layer.

| v1.7.1 Kernel (Production) | v1.8 Spec (Future) | Relation |
|---------------------------|-------------------|---------|
| Domain Lock | Role Lock System | Equivalent — v1.8 adds immutability for full execution lifetime |
| Contract Runtime | Phase Isolation Engine | v1.8 formalizes as strict state machine |
| Contamination Guard | Anomaly Detector | v1.8 adds Drift Monitor across sessions |
| Refusal Router | Governance Brain | v1.8 adds structured escalation tiers (L0–L3) |
| Creative Control | Mutation Budget System | v1.8 quantifies with numeric budget |
| — | Execution Lifecycle Controller | New in v1.8 — sub-state machine inside Phase C |
| — | Rollback Manager | New in v1.8 — mandatory snapshot before mutation |
| — | Stability Index | New in v1.8 — cross-execution self-regulation |

**Status:** v1.7.1 = production code with 51 tests. v1.8 = spec for the next evolution.

---

## 2. Relationship with v1.7 (Controlled Intelligence)

- v1.7 Reasoning Gate → v1.8 `REASONING_GATE` phase (same concept, now enforced in lifecycle)
- v1.7 Entropy Guard → absorbed into v1.8 Anomaly Detector
- v1.7 Prompt Sanitizer → still relevant, should be wired as pre-INTENT validation

---

## 3. Risk Level Mapping

v1.8 uses numeric scoring (0–16+). Always map to CVF R-levels:

```
See: governance/compat/risk_level_mapping.md
```

Implementation must expose both: numeric score AND R-level label.

---

## 4. Governance Guards Triggered by v1.8

When implementing v1.8 code:
- ✅ ADR Guard: ADR-010 already created
- ✅ Architecture Check Guard: COMPAT assessment completed (46/54, 85%)
- → Will need: Test Documentation Guard (when kernel tests are written)
- → Will need: Bug Documentation Guard (for any bugs found during implementation)

---

## 5. Compat Gate

Before merging any v1.8 code:
```bash
python governance/compat/check_core_compat.py --base HEAD~1 --head HEAD
```

v1.8 must not break any v1.7 or v1.7.1 tests.
