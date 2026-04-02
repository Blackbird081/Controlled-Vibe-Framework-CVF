# CVF ECOSYSTEM — Meta-Level Governance Layer

> **Status:** Active
> **Purpose:** Tách tầng meta (doctrine, operating model, strategy) ra khỏi tầng engineering (docs/, EXTENSIONS/, governance/)

---

## Structure

```
ECOSYSTEM/
├── doctrine/              ← Tư tưởng, nguyên lý (FROZEN)
│   ├── CVF_ARCHITECTURE_PRINCIPLES.md
│   ├── CVF_PRODUCT_POSITIONING.md
│   ├── CVF_ECOSYSTEM_MAP.md
│   ├── CVF_LAYER_MODEL.md
│   └── CVF_DOCTRINE_RULES.md
│
├── operating-model/       ← VOM: cách vận hành
│   ├── CVF_AGENT_OPERATING_MODEL.md  (for dev teams)
│   ├── CVF_BUILDER_MODEL.md          (for non-coders)
│   └── CVF_VOM_QUICK_START.md        (10-min onboarding)
│
├── strategy/              ← Chiến lược, roadmap
│   ├── CVF_STRATEGIC_SUMMARY.md
│   └── CVF_UNIFIED_ROADMAP_2026.md
│
├── reference-roots/       ← Internal retained roots moved out of visible repo root
│   ├── CVF_SKILL_LIBRARY/
│   └── ui_governance_engine/
│
└── README.md              ← This file
```

## Why ECOSYSTEM/ exists at root

| Level | Folder | Contains |
|-------|--------|----------|
| **Meta** | `ECOSYSTEM/` | Doctrine, strategy, operating model — WHY and WHAT |
| **Engineering** | `docs/`, `EXTENSIONS/`, `governance/` | Specifications, code, guards — HOW |

Doctrine defines the rules. Engineering implements them. They must not be mixed.

`ECOSYSTEM/reference-roots/` is an internal retained subtree used by pre-public `P3` cleanup to keep low-footprint lineage roots out of the visible repository root without deleting their historical payload.

## Authority Hierarchy

```
ECOSYSTEM/doctrine/                    ← L0: Supreme (FROZEN)
    ↓ governs
ECOSYSTEM/operating-model/             ← L3: How humans use CVF
    ↓ governs
ECOSYSTEM/strategy/                    ← Direction + Roadmap
    ↓ guides
docs/ + EXTENSIONS/ + governance/      ← Engineering implementation
```

## Related Documents

| Document | Location |
|----------|----------|
| P3 CP1 retired-root review | `docs/reviews/CVF_GC019_P3_CP1_RETIRED_REFERENCE_ROOT_RETIREMENT_REVIEW_2026-04-02.md` |
| Hierarchical Governance Pipeline | `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md` |
| P3 CP4 private-retained-root review | `docs/reviews/CVF_GC019_P3_CP4_PRIVATE_RETAINED_ROOT_RELOCATION_REVIEW_2026-04-02.md` |
