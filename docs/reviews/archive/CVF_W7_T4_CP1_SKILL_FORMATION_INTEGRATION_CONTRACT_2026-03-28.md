---
tranche: W7-T4
checkpoint: CP1
title: Skill Formation Integration Contract
date: 2026-03-28
status: DELIVERED
---

# W7-T4 / CP1 — Skill Formation Integration Contract

Memory class: FULL_RECORD

> Lane: Full Lane (GC-019)
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T4_SKILL_FORMATION_INTEGRATION_2026-03-28.md`

---

## 1. SkillFormationRecord Schema

A `SkillFormationRecord` is the canonical CVF representation of a skill extracted from a conversation during the REVIEW phase.

```
SkillFormationRecord {
  id: string                    // deterministic hash from (name + source + extractedAt)
  name: string                  // normalized skill name (kebab-case, max 80 chars)
  description: string           // human-readable summary (max 300 chars)
  source: SkillSource           // { type: 'conversation' | 'manual', ref: string }
  extractedAt: string           // ISO 8601 timestamp (REVIEW phase only)
  phase: 'REVIEW'               // hard-locked — extraction cannot occur outside REVIEW
  riskLevel: W7RiskLevel        // R0 | R1 | R2 | R3 (from W7-T2 risk contract)
  guardPreset: SkillGuardPreset // P-01 | P-02 | P-03 | P-04
  registryRef: string           // GEF registry path (e.g. governance/skills/<id>.skill.md)
  status: 'draft' | 'proposed' | 'active' | 'retired'
}
```

`W7RiskLevel` and `W7RiskFields` are as defined in `docs/reviews/CVF_W7_T2_CP1_UNIFIED_RISK_CONTRACT_SCHEMA_2026-03-28.md`.

---

## 2. Skill Extraction Protocol

### Phase Constraint (non-negotiable)

Skill extraction MAY ONLY occur during the **REVIEW** phase of the CVF workflow.

```
INTAKE → DESIGN → BUILD → REVIEW ← extraction window → FREEZE
```

Build-time or runtime extraction is a G3 (OWNERSHIP_REGISTRY_GUARD) violation.

### Trigger Conditions

Extraction is triggered when all of the following are true:

1. Current workflow phase is REVIEW
2. A conversation artifact contains a repeated, reusable behavioral pattern (not a one-off action)
3. The pattern is not already registered in the GEF Skill Registry (G3 check)
4. Risk level assigned ≤ R2 (R3 skills require explicit human approval before extraction)

### Extraction Output Surface

```
SkillExtractionOutput {
  record: SkillFormationRecord       // the formed skill
  extractedBy: string                // agent or human identifier
  confidence: 'high' | 'medium' | 'low'
  reviewRequired: boolean            // always true for R2+; false for R0/R1 if confidence='high'
  registryAction: 'propose' | 'draft'  // 'propose' only if confidence='high' + R0/R1
}
```

---

## 3. Skill Usage Protocol

Usage of a formed skill is governed by the guard preset assigned at extraction time.

| Guard Preset | Scenario | Guards Active | Enforcement |
|---|---|---|---|
| P-01 | Read-only `.skill.md` access | G3 | GEF governance checkpoint |
| P-02 | Extraction from conversation (REVIEW-phase) | G1, G3 | LPF observability advisory signal |
| P-03 | Registry mutation (propose/activate/retire) | G1, G2, G3 | EPF `policy.gate.contract.ts` + GEF audit signal |
| P-04 | Autonomous agent action using skill | G1, G2, G3, G5 | EPF policy gate + GEF watchdog; hard-blocked until P6 |

### Guard Enforcement at Runtime

- **G1 (RISK_CLASSIFICATION_GUARD)**: every skill operation must carry a declared `riskLevel`
- **G3 (OWNERSHIP_REGISTRY_GUARD)**: skill must exist in the GEF canonical registry before use
- **G2 (POLICY_GATE_GUARD)**: activated when `riskLevel >= R2`; routes through EPF `policy.gate.contract.ts`
- **G5 (AUTONOMY_LOCK_GUARD)**: activated for any autonomous agent action that invokes a skill; hard block until P6 gate explicitly passes

---

## 4. Review 14 Accept/Fix Matrix

| Proposal (Review 14) | Decision | Fix Applied |
|---|---|---|
| Skill extraction at any phase | REJECT | Extraction locked to REVIEW phase only (phase field hard-constrained) |
| Build-time skill inference from code patterns | REJECT | Build-time extraction violates G3; not permitted |
| Skill registry as a standalone service | REJECT | Single GEF registry; no new service infrastructure |
| Skill schema with arbitrary metadata fields | FIX | Schema constrained to SkillFormationRecord fields above; no open metadata map |
| Skill confidence drives automatic activation | FIX | confidence='high' + R0/R1 allows 'propose' only; activation requires registry mutation flow (P-03) |
| Multi-skill bundles as first-class entities | HOLD | Deferred to W7-T8 (Agent Builder) |
| Skill versioning | ACCEPT | `status` field supports draft→proposed→active→retired lifecycle |
| Skill source tracking | ACCEPT | `source` field with type + ref captures extraction provenance |
| R0/R1 skills bypass policy gate | ACCEPT | Consistent with P-01/P-02 presets (no G2 for R0/R1) |
| R3 skill extraction requires human approval | ACCEPT | Explicit condition in trigger constraints above |

---

## 5. Boundary Conditions

- A `SkillFormationRecord` with `phase !== 'REVIEW'` MUST be rejected at the GEF registry ingestion point
- A skill in `status: 'draft'` or `status: 'proposed'` MUST NOT be used in autonomous agent actions (G5 would fire regardless, but registry status provides an additional soft block)
- `registryRef` must resolve to an existing or to-be-created `.skill.md` file under `governance/skills/`
- Skill ID is deterministic: `computeDeterministicHash(name, source.ref, extractedAt)` — prevents duplicate registrations
