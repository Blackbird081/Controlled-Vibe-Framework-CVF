# CVF DEPTH AUDIT GUARD

**Type:** Governance Operation Guard  
**Applies to:** All roadmap phases, all humans, all AI agents  
**Purpose:** Prevent uncontrolled semantic deepening when the added layer does not materially improve risk reduction, decision quality, or machine-enforceable closure.

---

## 1. Mandatory Rule

Before any phase is deepened with a new semantic layer, policy layer, or `CF-*` batch, the proposer MUST complete a Depth Audit.

This rule applies to **all phases**, not only Phase 6.

The default assumption is:

- do **not** deepen a phase automatically
- do **not** chase detail for its own sake
- do **not** trade broad system progress for low-yield semantic refinement

---

## 2. Scoring Model

Every proposed deepening step must be scored across 5 criteria.

Each criterion is scored `0..2`.

| Criterion | 0 | 1 | 2 |
|---|---|---|---|
| `Risk reduction` | No real risk reduced | Some reduction, indirect or narrow | Directly blocks or detects a real operational risk |
| `Decision value` | Does not improve release/audit/runtime decisions | Helps interpretation but not strongly | Clearly improves a real decision boundary |
| `Machine enforceability` | Narrative only | Partly enforceable | Produces clear gate/check/evidence behavior |
| `Operational efficiency` | Adds cost with little offset | Neutral or mixed | Reuses existing paths or improves maintainability/perf |
| `Portfolio priority` | Lower priority than open weaknesses elsewhere | Comparable priority | Clearly worth doing before other open work |

**Maximum score:** `10`

---

## 3. Thresholds

| Total score | Decision |
|---|---|
| `8-10` | `CONTINUE` |
| `6-7` | `REVIEW REQUIRED` |
| `0-5` | `DEFER` |

### Hard-stop override

The proposal MUST be treated as `DEFER` if any of the following is `0`:

- `Risk reduction`
- `Decision value`
- `Machine enforceability`

Rationale:

- if the step does not reduce a real risk,
- or does not improve a real decision,
- or cannot be enforced by machine,

then the step is not governance hardening; it is only semantic expansion.

---

## 4. Required Output Format

Any proposal that goes deeper than the current roadmap state must record:

```text
Depth Audit
- Risk reduction: <0|1|2>
- Decision value: <0|1|2>
- Machine enforceability: <0|1|2>
- Operational efficiency: <0|1|2>
- Portfolio priority: <0|1|2>
- Total: <0..10>
- Decision: CONTINUE | REVIEW REQUIRED | DEFER
- Reason: <short justification>
```

This record may live in:

- the roadmap,
- an upgrade trace,
- a decision matrix,
- or a dedicated ADR / governance note,

but it must be explicit and reviewable.

---

## 5. Default Guidance

Prefer stopping when:

- the next layer mainly renames or re-partitions an existing signal
- the new layer is hard to explain in operational terms
- the gate/evidence cost grows faster than the trust gain
- another phase has a broader unresolved weakness

Prefer continuing when:

- the new layer closes a real ambiguity at release, audit, remediation, or promotion time
- the result can be expressed as a clear gate or canonical artifact
- the added complexity is small relative to the risk removed

---

## 6. Current Governance Direction

At the current baseline:

- `Phase 0` and `Phase 5` should usually resist deepening unless there is a clear governance gap
- `Phase 2` and `Phase 6` are still active, but must justify every new layer through this guard
- once a phase enters diminishing returns, the burden of proof shifts toward `DEFER`

This guard is analogous to a coverage threshold:

- not every theoretical edge must be implemented
- the goal is sufficient, defensible control quality
- not semantic perfection
