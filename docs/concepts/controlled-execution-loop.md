# The Controlled Execution Loop

[🇻🇳 Tiếng Việt](../GET_STARTED.md) | 🇬🇧 English

CVF's current canonical governed lifecycle is a **seven-stage controlled execution loop**:

```
INTAKE -> DESIGN -> SPEC -> WORK ORDER -> BUILD -> REVIEW -> FREEZE
```

This is the active reference model for governed planning, authorization,
execution, review, and closure. Runtime enforcement remains surface-specific:
the lifecycle vocabulary alone is not proof that every workspace, integration,
or provider lane enforces every transition.

---

## What The Loop Means

| Phase | Question | Primary posture | Typical owner |
|---|---|---|---|
| `INTAKE` | What is being asked? | clarify scope, capture intent, refuse premature coding | human + analyst |
| `DESIGN` | What is the approach? | synthesize plan, identify risks, define checkpoints | human + analyst |
| `SPEC` | What exact contract must hold? | define invariants, negative cases, and acceptance criteria | spec author + reviewer |
| `WORK ORDER` | Who may do what, where, and under which limits? | bind authority, scope, tools, evidence, and stop rules | dispatcher + operator |
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

The seven stages preserve seven distinct control decisions. They must not be
collapsed merely to reduce paperwork.

Roadmaps usually divide work into bounded tranches. A tranche may inherit
accepted evidence from earlier stages and begin at the earliest stage released
for its scope; it does not mechanically rerun the whole lifecycle from zero.

---

## What Changed From The Legacy Model

Older CVF learning material taught a simpler `DISCOVERY -> DESIGN -> BUILD -> REVIEW` flow.

That legacy model is still useful as historical learning material, but it is no longer the canonical runtime truth.

Current rules:

- `DISCOVERY` is treated only as a legacy compatibility alias at some input boundaries.
- `INTAKE` is the canonical entry phase inside active runtime logic.
- `SPEC` separates a proposed design from a source-verifiable contract.
- `WORK ORDER` separates a contract from permission to mutate files, invoke
  tools, call providers, or spend quota.
- `FREEZE` is a real operational closure phase, not just a label.

---

## Phase Gates And Review

Every stage must produce or inherit enough evidence for the next transition.
A gate may combine deterministic machine checks with bounded reviewer judgment;
it does not require a new standalone review document after every stage.

- machines may decide path, hash, manifest, schema, coverage, and test-result
  facts;
- reviewers decide semantic adequacy, relevance, contradictions, risk, waivers,
  and whether the next stage is authorized;
- `REVIEW` is the formal result-evaluation stage before `FREEZE`;
- high-risk or authority-changing transitions may also require an operator
  checkpoint;
- a failed gate returns work to the earliest affected stage rather than opening
  a successor automatically.

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
- Design, specification, authorization, and implementation should stay separable.
- High-risk or broad-scope changes should surface approval checkpoints before `BUILD`.
- `REVIEW` should compare outputs to intent and acceptance criteria, not just code style.
- `FREEZE` should preserve evidence, not merely mark the workflow "done."

---

## Current Reality

The public front door, downstream carrier contract, and current Core governance
work use this seven-stage reference model.

Current truthful reading:

- the active reference path preserves the seven control decisions
- coder-facing and non-coder governed reference paths both exist on the active baseline
- broader ecosystem parity and future breadth deepening are no longer open-by-default roadmap work; they are continuation candidates gated by `GC-018`

That does not make seven-stage machine enforcement universal. Consult the
current roadmap, work order, phase-return receipts, accepted review, and freeze
evidence for the exact surface being evaluated.

---

## Related Reading

- [Legacy 4-Phase Process](4-phase-process.md)
- [Governance Model](governance-model.md)
- [CVF System Unification Roadmap](../roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md)
- [Independent System Review](../reviews/CVF_INDEPENDENT_SYSTEM_REVIEW_2026-03-19.md)

---

*Last updated: September 2, 2026 | Canonical governed lifecycle concept*
