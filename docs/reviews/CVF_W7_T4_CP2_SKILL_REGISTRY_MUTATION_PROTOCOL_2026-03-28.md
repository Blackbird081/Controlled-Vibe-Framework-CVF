---
tranche: W7-T4
checkpoint: CP2
title: Skill Registry Mutation Protocol
date: 2026-03-28
status: DELIVERED
gate: —
---

# W7-T4 / CP2 — Skill Registry Mutation Protocol

Memory class: FULL_RECORD

> Lane: Fast Lane (GC-021) — additive within W7-T4 authorized scope

---

## 1. GEF Registry as Single Source of Truth

The GEF Skill Registry is the **sole authoritative store** for all CVF skill records.

```
GEF Skill Registry
  └── governance/skills/
        ├── <skill-id>.skill.md        ← one file per registered skill
        └── REGISTRY_INDEX.md          ← index of all active/retired skills
```

No other registry, database, or in-memory store may serve as the authoritative skill source. Any implementation that maintains a parallel skill store outside `governance/skills/` is a G3 (OWNERSHIP_REGISTRY_GUARD) violation.

---

## 2. .skill.md Governance Artifact Format

Each registered skill is governed as a `.skill.md` file with the following required front-matter and body:

```markdown
---
id: <deterministic-hash>
name: <kebab-case-skill-name>
status: draft | proposed | active | retired
riskLevel: R0 | R1 | R2 | R3
guardPreset: P-01 | P-02 | P-03 | P-04
extractedAt: <ISO-8601>
source:
  type: conversation | manual
  ref: <conversation-id or manual-ref>
registeredAt: <ISO-8601>
registeredBy: <agent-or-human-id>
---

## Description

<max 300 chars>

## Usage Conditions

<when this skill is applicable>

## Guard Notes

<any additional guard enforcement notes>
```

---

## 3. Mutation Flow by Operation

### Read (R0 → P-01)

- G3 only: verify skill exists in registry
- No EPF policy gate required
- No audit trail required (read-only)

### Propose / Draft (R1 → P-02)

- G1 + G3: risk declared, ownership verified
- LPF `learning.observability.contract.ts` advisory signal emitted
- Skill file written to `governance/skills/<id>.skill.md` with `status: proposed`
- No EPF policy gate required

### Activate / Mutate (R2 → P-03)

- G1 + G2 + G3: risk declared, policy gate checked, ownership verified
- Routes through EPF `policy.gate.contract.ts`
  - PASS → skill status transitions to `active`; GEF `governance.audit.signal.contract.ts` emits audit record
  - DENY → mutation rejected; skill remains in prior status; rejection logged
- `REGISTRY_INDEX.md` updated to reflect new active skill

### Retire (R2 → P-03)

- Same flow as Activate
- Skill status transitions to `retired`; file remains on disk (immutable audit trail)
- `REGISTRY_INDEX.md` updated to reflect retired status

### Autonomous Agent Use (R3 → P-04)

- G1 + G2 + G3 + G5: risk declared, policy gate checked, ownership verified, autonomy lock checked
- G5 (AUTONOMY_LOCK_GUARD) hard-blocks until P6 gate explicitly passes
- Routes through EPF `policy.gate.contract.ts` + GEF `watchdog.escalation.contract.ts`
- Human checkpoint required before any autonomous skill invocation

---

## 4. Lifecycle State Machine

```
draft → proposed → active → retired
         ↑                      ↓
         └──────────────────────┘  (re-propose after retirement requires new extraction)
```

| Transition | Permitted By | Guard Preset |
|---|---|---|
| (new) → draft | Any REVIEW-phase extraction | P-02 |
| draft → proposed | Agent with R1 authorization | P-02 |
| proposed → active | Policy gate PASS (R2) | P-03 |
| active → retired | Policy gate PASS (R2) | P-03 |
| Any → autonomous use | P6 gate PASS (R3) | P-04 |

---

## 5. Registry Integrity Invariants

1. Every `id` in `REGISTRY_INDEX.md` must have a corresponding `.skill.md` file
2. Every `.skill.md` file must have a valid `id` matching `computeDeterministicHash(name, source.ref, extractedAt)`
3. No two `.skill.md` files may share the same `id`
4. A skill in `status: retired` may not transition back to `active` directly — must re-propose
5. The `registeredAt` timestamp must be ≥ `extractedAt` timestamp
