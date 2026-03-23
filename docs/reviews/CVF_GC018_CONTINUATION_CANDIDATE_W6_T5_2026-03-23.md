# CVF GC-018 Continuation Candidate — W6-T5

Memory class: FULL_RECORD

> Date: `2026-03-23`
> Governance: GC-018 Continuation Governance
> Candidate: `W6-T5 — Checkpoint-Driven Control Reintake Slice`

---

## Depth Audit (5 criteria × 1–3 pts, max 15)

| Criterion | Score | Rationale |
|---|---|---|
| Risk reduction | 3 | `GovernanceCheckpointDecision` (W6-T4) with `checkpointAction=HALT` or `ESCALATE` has no concrete pathway to trigger a control-plane re-intake cycle. Without this, governance halts and escalations are advisory-only — nothing enforces a re-intake. This tranche closes the mechanical follow-through gap. |
| Decision value | 3 | Closes the governance→control re-intake loop. First contract that translates a governance checkpoint action into a concrete re-intake trigger (`ReintakeTrigger`) and scope (`ReintakeScope: IMMEDIATE \| DEFERRED \| NONE`). Pairs with W6-T4 to complete the governance checkpoint + control reintake cycle. |
| Machine enforceability | 3 | Fully deterministic: `ESCALATE → ESCALATION_REQUIRED / IMMEDIATE`, `HALT → HALT_REVIEW_PENDING / DEFERRED`, `PROCEED → NO_REINTAKE / NONE`. Summary dominant scope: severity-first `IMMEDIATE > DEFERRED > NONE`. |
| Operational efficiency | 2 | Standard 2-CP pattern: Full Lane CP1 (reintake request) + Fast Lane CP2 (reintake summary). Extends GPF without structural change. Mirrors the W2-T6 re-intake pattern at the governance→control boundary. |
| Portfolio priority | 3 | Completes the W6-T4 + W6-T5 governance checkpoint cycle. Without a re-intake trigger, W6-T4's checkpoint is incomplete. Together they form a governed halt→review→reintake chain that governance-first platforms require. |
| **Total** | **14 / 15** | |

---

## Authorization Verdict

**AUTHORIZED — 14/15 ≥ 13 threshold**

---

## Tranche Scope

**W6-T5 — Checkpoint-Driven Control Reintake Slice**

- CP1 (Full Lane): `GovernanceCheckpointReintakeContract` — maps `GovernanceCheckpointDecision` → `CheckpointReintakeRequest`
- CP2 (Fast Lane, GC-021): `GovernanceCheckpointReintakeSummaryContract` — aggregates `CheckpointReintakeRequest[]` → `CheckpointReintakeSummary`
- CP3: Tranche Closure (Full Lane)

Package: `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION` (GPF)
Tests: +16 (8 per CP); dedicated file: `governance.checkpoint.reintake.test.ts`
