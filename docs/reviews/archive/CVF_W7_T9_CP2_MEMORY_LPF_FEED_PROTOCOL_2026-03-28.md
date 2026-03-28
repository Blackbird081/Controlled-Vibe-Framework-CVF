---
tranche: W7-T9
checkpoint: CP2
title: Memory LPF Feed Protocol
date: 2026-03-28
status: DELIVERED
---

# W7-T9 / CP2 — Memory LPF Feed Protocol

Memory class: FULL_RECORD

> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T9_MEMORY_LOOP_2026-03-28.md`
> Fast Lane eligible: additive LPF feed extension; no new interface surface; no ownership transfer; inside authorized tranche

---

## 1. Signal Routing (4 Types → LPF Consumers)

| Signal Type | LPF Consumer | Memory Actions Eligible |
|---|---|---|
| `skill_effectiveness` | LPF observability snapshot | `reinforce`, `deprecate`, `flag_review`, `no_change` |
| `guard_trigger` | LPF observability | `flag_review`, `no_change` |
| `risk_reclassification` | LPF storage | `flag_review`, `reinforce` |
| `autonomy_boundary` | LPF storage | `flag_review`, `deprecate` |

Each W7MemoryEntry maps to exactly one LPF consumer via `signalType`. Routing is deterministic — no signal type is ambiguous.

---

## 2. LPF Feed Protocol (Status Lifecycle)

1. W7MemoryRecord created with `status: 'pending'`.
2. For each W7MemoryEntry: route to designated LPF consumer by `signalType`.
3. On successful LPF receipt: populate `W7MemoryRecord.lpfRef`; transition status → `'stored'`.
4. On LPF delivery failure: retry once; if still failed, status → `'failed'`; emit G7-adjacent alert — no silent drop.
5. `overallScore: 'fail'` from W7EvalRecord does NOT suppress LPF feed — failure evidence preserved (consistent with T8/CP2 invariant).
6. `lpfRef` must be populated before W7MemoryRecord is considered complete; unpopulated lpfRef = status remains `'pending'` or `'failed'`.

---

## 3. Loop-Back Behavior

**skill_effectiveness + reinforce/deprecate:**
- Target: GEF `governance/skills/<id>.skill.md` (W7-T4 registry)
- Action: propose lifecycle transition via Skill Registry Mutation Protocol (proposed→active for reinforce; active→retired for deprecate)
- Constraint: G3 enforced — Memory cannot write directly to GEF; transition goes through mutation protocol as a proposal

**risk_reclassification + flag_review:**
- Target: EPF policy.gate or GEF policy record
- Action: emit review flag to LPF storage — no autonomous policy update
- Constraint: G2 required at R2+ before any flag is acted on; flag is advisory, not executable

**autonomy_boundary + flag_review/deprecate:**
- Target: CPF or GEF autonomy policy record
- Action: emit review flag to LPF storage — triggers human checkpoint requirement
- Constraint: G5 required at R2+ before any autonomy policy change; P6 autonomy lock upheld; no autonomous activation

**guard_trigger + flag_review:**
- Target: LPF observability only
- Action: observability record only — no downstream action; no guard state change

---

## 4. Protocol Invariants (5)

1. No W7MemoryEntry directly modifies EPF (Runtime/Artifact/Trace) or CPF (Planner/Decision) records — G3 enforced.
2. All loop-back actions are proposals or flags — no autonomous activation of reinforced skills or updated policies.
3. G5 required for any `autonomy_boundary` or `risk_reclassification` flag processed at R2+.
4. LPF feed uses existing LPF contracts — no new interface surface created in CP2.
5. `W7MemoryRecord.lpfRef` must be populated before Memory Loop is considered complete — confirms delivery.
