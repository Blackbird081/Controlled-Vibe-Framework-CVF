# Legacy 4-Phase Process

[🇻🇳 Tiếng Việt](../GET_STARTED.md) | 🇬🇧 English

This document preserves the original CVF learning model that organized work as:

```
DISCOVERY  →  DESIGN  →  BUILD  →  REVIEW
```

It remains useful for historical context and for understanding the earliest CVF baseline, but it is **not the canonical runtime model anymore**.

For the current operational model, use:

- [The Controlled Execution Loop](controlled-execution-loop.md)

---

## Why This Document Still Exists

The 4-phase model was the first strong simplification that made CVF practical:

1. clarify what the user wants
2. design before coding
3. build against the design
4. review against intent

That discipline is still valuable.

What changed later is that CVF needed:

- a clearer intake posture before design begins
- a real governed closure state after review
- stronger runtime and audit semantics across channels

Those needs led to the canonical `INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE` loop.

---

## Historical Mapping

| Legacy phase | Current canonical meaning |
|---|---|
| `DISCOVERY` | closest to `INTAKE` |
| `DESIGN` | `DESIGN` |
| `BUILD` | `BUILD` |
| `REVIEW` | `REVIEW` plus later closure into `FREEZE` |

Important:

- `DISCOVERY` may still appear as a compatibility alias in some inputs or older docs.
- Active runtime logic should treat `INTAKE` as canonical.
- `FREEZE` has no equivalent in the original 4-phase model.

---

## What The Legacy Model Got Right

- humans define intent before code is written
- design should exist before implementation
- execution should not silently invent scope
- review should compare output to intent

Those ideas still survive inside the modern loop.

---

## When To Read This

Use this document when you need:

- historical context for v1.0 and early CVF doctrine
- compatibility understanding for old tutorials and baseline material
- a simpler mental bridge into the current controlled execution loop

Do not use this document as the final source of truth for active runtime behavior.

---

## Related Reading

- [Controlled Execution Loop](controlled-execution-loop.md)
- [Governance Model](governance-model.md)
- [Independent System Review](../reviews/CVF_INDEPENDENT_SYSTEM_REVIEW_2026-03-19.md)

---

*Last updated: March 20, 2026 | Historical baseline reference*
