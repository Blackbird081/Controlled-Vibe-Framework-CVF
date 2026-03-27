# CVF Depth Audit Guard

**Control ID:** `GC-018`
**Guard Class:** `CONTINUITY_AND_DECISION_GUARD`
**Status:** Active continuation stop-boundary rule for semantic deepening and marginal-value follow-on work.
**Applies to:** all roadmap phases, all humans, and all AI agents proposing a new semantic layer, continuation wave, or materially deeper governance branch.
**Enforced by:** `governance/compat/check_depth_audit_continuation_compat.py`, `governance/compat/check_gc018_stop_boundary_semantics.py`

## Purpose

- prevent uncontrolled semantic deepening when the added layer does not materially improve risk reduction, decision quality, or machine-enforceable closure
- bias the system toward stopping or shifting laterally when a wave is already substantially delivered
- require a reviewable `Depth Audit` instead of intuition-driven continuation

## Rule

Before any phase is deepened with a new semantic layer, policy layer, or `CF-*` batch, the proposer must complete a `Depth Audit`.

This rule applies to all phases, not only Phase 6.

Default assumption:

- do not deepen a phase automatically
- do not chase detail for its own sake
- do not trade broad system progress for low-yield semantic refinement

### Scoring Model

Every proposed deepening step must be scored across 5 criteria.

Each criterion is scored `0..2`.

| Criterion | 0 | 1 | 2 |
|---|---|---|---|
| `Risk reduction` | No real risk reduced | Some reduction, indirect or narrow | Directly blocks or detects a real operational risk |
| `Decision value` | Does not improve release/audit/runtime decisions | Helps interpretation but not strongly | Clearly improves a real decision boundary |
| `Machine enforceability` | Narrative only | Partly enforceable | Produces clear gate/check/evidence behavior |
| `Operational efficiency` | Adds cost with little offset | Neutral or mixed | Reuses existing paths or improves maintainability/perf |
| `Portfolio priority` | Lower priority than open weaknesses elsewhere | Comparable priority | Clearly worth doing before other open work |

Maximum score: `10`

### Thresholds

| Total score | Decision |
|---|---|
| `8-10` | `CONTINUE` |
| `6-7` | `REVIEW REQUIRED` |
| `0-5` | `DEFER` |

Hard-stop override:

- if `Risk reduction` is `0`, treat the proposal as `DEFER`
- if `Decision value` is `0`, treat the proposal as `DEFER`
- if `Machine enforceability` is `0`, treat the proposal as `DEFER`

If the step does not reduce a real risk, improve a real decision, or become machine-enforceable, it is semantic expansion rather than governance hardening.

### Required Output Format

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

- the roadmap
- an upgrade trace
- a decision matrix
- a dedicated ADR or governance note

Standard continuation packet template:

- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`

For low-yield continuation classes, the packet must also make the stop-boundary explicit:

- `Continuation class: VALIDATION_TEST | PACKAGING_ONLY | TRUTH_CLAIM | REALIZATION | STRUCTURAL | MIXED | OTHER`
- `Lateral alternative considered: YES | NO`
- `Why not lateral shift: <short justification>`
- `Real decision boundary improved: YES | NO`

### Default Guidance

Prefer stopping when:

- the next layer mainly renames or re-partitions an existing signal
- the new layer is hard to explain in operational terms
- the gate and evidence cost grows faster than the trust gain
- another phase has a broader unresolved weakness

Special stop-boundary guidance:

- validation/test waves should default toward `DEFER` once tranche-local confidence is already strong
- packaging/wrapper/facade-only continuation should default toward `DEFER` unless it unlocks a real consumer path or retires a real legacy boundary
- target-state claim expansion or status-marketing continuation should default toward `DEFER` unless new evidence changes the canonical posture in a reviewable way

Prefer continuing when:

- the new layer closes a real ambiguity at release, audit, remediation, or promotion time
- the result can be expressed as a clear gate or canonical artifact
- the added complexity is small relative to the risk removed

## Enforcement Surface

- repo-level continuation enforcement runs through `governance/compat/check_depth_audit_continuation_compat.py`
- stop-boundary semantics enforcement runs through `governance/compat/check_gc018_stop_boundary_semantics.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py --hook pre-push`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

At the current baseline:

- `Phase 0` and `Phase 5` should usually resist deepening unless there is a clear governance gap
- `Phase 2` and `Phase 6` are still active, but must justify every new layer through this guard
- once a phase enters diminishing returns, the burden of proof shifts toward `DEFER`

## Related Artifacts

- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
- `governance/compat/check_depth_audit_continuation_compat.py`
- `governance/compat/check_gc018_stop_boundary_semantics.py`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`

## Final Clause

CVF seeks sufficient, defensible control quality, not semantic perfection.
