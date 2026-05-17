# The Controlled Execution Loop

[🇻🇳 Tiếng Việt](../GET_STARTED.md) | 🇬🇧 English

CVF's current canonical runtime model is a **5-phase controlled execution loop**:

```
INTAKE  →  DESIGN  →  BUILD  →  REVIEW  →  FREEZE
```

This is the model used by the remediated governance runtime, the shared guard contract, and the aligned Web/UI surfaces.

---

## What The Loop Means

| Phase | Question | Primary posture | Typical owner |
|---|---|---|---|
| `INTAKE` | What is being asked? | clarify scope, capture intent, refuse premature coding | human + analyst |
| `DESIGN` | What is the approach? | synthesize plan, identify risks, define checkpoints | human + analyst |
| `BUILD` | How is the approved plan executed? | governed implementation inside scope | builder + runtime |
| `REVIEW` | Does the output satisfy the intent? | verify evidence, test against acceptance criteria | reviewer + human |
| `FREEZE` | Can this result be closed and locked? | finalize evidence, lock closure state, preserve audit trail | governor + human |

---

## Canonical Loop

The single official CVF execution loop is:

1. intent capture
2. context and scope normalization
3. plan synthesis
4. approval checkpoints
5. governed execution
6. review and validation
7. freeze and evidence closure

The 5 phases are the visible state machine for that loop.

---

## What Changed From The Legacy Model

Older CVF learning material taught a simpler `DISCOVERY -> DESIGN -> BUILD -> REVIEW` flow.

That legacy model is still useful as historical learning material, but it is no longer the canonical runtime truth.

Current rules:

- `DISCOVERY` is treated only as a legacy compatibility alias at some input boundaries.
- `INTAKE` is the canonical entry phase inside active runtime logic.
- `FREEZE` is a real operational closure phase, not just a label.

---

## Why `FREEZE` Matters

`FREEZE` is the phase that prevents CVF from collapsing into "build something and hope."

Entering `FREEZE` means:

- the workflow has a closure decision
- key evidence has been recorded
- final state is locked for later reconciliation
- rollback or re-entry requires an explicit governed transition

`FREEZE` is what makes the system audit-friendly rather than only execution-friendly.

---

## Practical Rules

- AI should not code in `INTAKE`.
- Planning and implementation should stay separable.
- High-risk or broad-scope changes should surface approval checkpoints before `BUILD`.
- `REVIEW` should compare outputs to intent and acceptance criteria, not just code style.
- `FREEZE` should preserve evidence, not merely mark the workflow "done."

---

## Current Reality

As of `2026-03-20`, CVF has aligned its active runtime, shared guard contract, and major Web reference flows to this canonical loop.

Current truthful reading:

- the active reference path is materially delivered against this loop
- coder-facing and non-coder governed reference paths both exist on the active baseline
- broader ecosystem parity and future breadth deepening are no longer open-by-default roadmap work; they are continuation candidates gated by `GC-018`

That means the loop is now both the canonical design truth and the active reference-path runtime truth, while future whole-system broadening remains governed continuation work rather than an already-authorized active batch.

---

## Related Reading

- [Legacy 4-Phase Process](4-phase-process.md)
- [Governance Model](governance-model.md)
- [CVF System Unification Roadmap](../roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md)
- [Independent System Review](../reviews/CVF_INDEPENDENT_SYSTEM_REVIEW_2026-03-19.md)

---

*Last updated: March 20, 2026 | Canonical runtime concept*
