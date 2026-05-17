# CVF Risk Level Mapping — Canonical Reference

> **Version:** v1.0 | **Created:** 2026-03-05
> **Status:** Active
> **Related ADR:** ADR-010 (CVF_ARCHITECTURE_DECISIONS.md)
> **Source:** CVF_POSITIONING.md (R0–R3 model) + CVF_AI Runtime GOVERNANCE.md (numeric model)

---

## Official Mapping Table

| CVF R-Level | Name | Numeric Score | Runtime Level | Meaning |
|-------------|------|---------------|---------------|---------|
| **R0** | Passive | 0–2 | LOW (auto) | No side effects. Read/analyze only. Auto-approved. |
| **R1** | Controlled | 3–5 | LOW (guarded) | Small, bounded changes. Single file. Guarded execution. |
| **R2** | Elevated | 6–10 | MODERATE | Has authority, may chain. Module-level. Human review advised. |
| **R3** | Critical | 11–15 | HIGH | System changes. Cross-module/architecture. Escalation required. |
| **R3+** | Hard Stop | 16+ | CRITICAL | Irreversible or undefined risk. Hard stop. No AI execution. |

---

## Usage Rules

1. **All CVF governance docs use R0–R3 notation** — this is the canonical label
2. **Runtime implementations (v1.8+) use numeric score** — must always map to R-level
3. **Safety Dashboard (v1.7.2) shows color indicators** — these map to R-level:
   ```
   🟢 Safe      = R0 (score 0–2)
   🟡 Attention = R1 (score 3–5)
   🟠 Review    = R2 (score 6–10)
   🔴 Dangerous = R3 (score 11+)
   ```
4. **Any implementation exposing numeric score MUST also expose the R-level label**
5. **When in doubt, round UP to the next R-level** (safety-first principle)

---

## Risk Score Formula (from v1.8 GOVERNANCE.md)

```
Risk Score = (Impact × Scope × Uncertainty) + Reversibility_Modifier

Impact (0–5):         0=cosmetic → 5=core system behavior
Scope (0–5):          0=1 file → 5=global/system-wide
Uncertainty (0–5):    0=deterministic → 5=speculative redesign
Reversibility (-2→+2): -2=trivial rollback → +2=irreversible mutation

Max score = (5×5×5) + 2 = 127 (theoretical)
CRITICAL threshold = 16+ (practical governance limit)
```

---

## Required Controls per Level

| Level | Required Controls |
|-------|------------------|
| R0 | Logging only |
| R1 | Logging + Scope Guard |
| R2 | Logging + Scope Guard + Human Approval + Audit |
| R3 | All above + Hard Gate + Human-in-the-loop |
| R3+ | Hard Stop — no AI execution permitted |

---

> **Maintained by:** CVF Governance
> **Update when:** Risk model changes or new R-levels are added
> **Do not update when:** Individual score thresholds shift within same R-level
