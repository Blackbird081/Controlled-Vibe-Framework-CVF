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
├── reference-roots/       ← retained non-canonical root lineage
│   └── retained-internal/
│       ├── CVF_SKILL_LIBRARY/
│       └── ui_governance_engine/
│
└── README.md              ← This file
```

## Why ECOSYSTEM/ exists at root

| Level | Folder | Contains |
|-------|--------|----------|
| **Meta** | `ECOSYSTEM/` | Doctrine, strategy, operating model — WHY and WHAT |
| **Engineering** | `docs/`, `EXTENSIONS/`, `governance/` | Specifications, code, guards — HOW |

Doctrine defines the rules. Engineering implements them. They must not be mixed.

Retained/internal note:

- `reference-roots/retained-internal/` stores roots that were removed from the visible repository root in pre-public restructuring waves
- these paths preserve lineage and rollback clarity without re-promoting them as visible canonical roots

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
| ADR-021 (Restructure Decision) | `CVF_Restructure/Independent Review/ADR-021_CVF_ECOSYSTEM_RESTRUCTURE.md` |
| Hierarchical Governance Pipeline | `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md` |
| Consolidation Audit | `CVF_Restructure/Independent Review/CVF_ROADMAP_CONSOLIDATION_AUDIT_2026-03-09.md` |
