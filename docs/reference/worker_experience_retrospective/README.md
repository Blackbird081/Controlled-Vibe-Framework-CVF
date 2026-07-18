# CVF Worker Experience Retrospective Capture Standard

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-20

**Applies to:** self-declared worker-return artifacts for governed tranches.

EPISTEMIC_PROCESS_NA_WITH_REASON: reference standard - it defines a capture
token and routing; it makes no evidence claim that requires comparison.

## Purpose

Capture worker execution friction even when the worker passes every gate. CVF
already absorbs agent *errors* into governance learning, but friction that does
not block closure (a late surprise, a keyword trap, a manual search, worktree
contamination) was lost after each tranche unless an operator or reviewer asked.
This standard moves that signal into the governed worker-return packet itself,
as a small machine-checked token.

The token is artifact-level evidence of a declared claim. It does not, and
cannot, prove the worker truly reflected. Its value is that it forces the friction
signal to be emitted as structured data at return time, where it can be
aggregated and, only if recurring or high value, promoted to a rule, helper
diagnostic, checker, or phase gate through the finding-to-governance learning lane.

## When It Applies

Required on a changed Markdown file that is a self-declared worker-return
artifact. A file qualifies when either:

- it contains `Self-declared worker-return artifact: yes`; or
- it contains `Status: COMPLETE_PENDING_REVIEW` or `Status: BLOCKED_WITH_REASON`
  AND a `Responds to work order:` line.

It does NOT apply to advisory or classification packets (`docType:
review_context`), completion reviews, reference standards, baselines, or work
orders, even when they mention worker-return vocabulary. This narrow eligibility
is deliberate: per the worktree-mode local hook constraint, gates scan every
changed file on disk including co-present batches, so the token binds only to the
artifact that self-declares, never to another batch's file.

## Required Token

Eligible artifacts must include exactly one of the two forms.

Structured retrospective form:

```text
WORKER_EXPERIENCE_RETRO:
frictionLevel: NONE|LOW|MEDIUM|HIGH|BLOCKING
frictionType: NONE|GATE_SURPRISE|SCOPE_AMBIGUITY|SOURCE_DISCOVERY|WORKTREE_CONTAMINATION|HELPER_GAP|LATENCY|KEYWORD_TRAP|ENUM_OR_TOKEN_MISMATCH|OTHER
observedStep: short text describing where the friction occurred
preventiveControlCandidate: NONE|INDEX_UPDATE|HELPER_DIAGNOSTIC|CHECKER|WORK_ORDER_TEMPLATE|STANDARD_UPDATE|DEFER
```

No-friction escape hatch (exact asserting reason required):

```text
WORKER_EXPERIENCE_RETRO_NA_WITH_REASON: no friction beyond normal gates; no gate surprise, no helper gap, no worktree contamination this return
```

The asserting NA form is required rather than a bare token so the absence of
friction is an explicit, falsifiable claim, not a reflexive paste.

## Enum Meaning

| frictionType | Meaning |
|---|---|
| NONE | No friction of this kind |
| GATE_SURPRISE | A gate failed in a way the worker did not anticipate |
| SCOPE_AMBIGUITY | Scope or write-ownership was unclear |
| SOURCE_DISCOVERY | Had to search to find which source or checker applied |
| WORKTREE_CONTAMINATION | Co-present batch files complicated isolating own changes |
| HELPER_GAP | An early helper passed but a later gate failed on the same artifact |
| LATENCY | Avoidable rework or slow feedback loop |
| KEYWORD_TRAP | A checker fired on incidental trigger text, not a real defect |
| ENUM_OR_TOKEN_MISMATCH | A field was rejected for not matching a fixed enum/token |
| OTHER | Friction not covered above; describe in observedStep |

## How It Is Enforced

- Canonical checker: `governance/compat/check_worker_experience_retrospective.py`
  (`--base`, `--head`, `--enforce`). It validates eligibility, exactly one token
  form, all enum values, a non-empty `observedStep`, and the exact asserting NA
  reason.
- Early read-only helper diagnostic:
  `governance/compat/run_agent_automation_assist.py` imports the checker logic and
  reports a missing or malformed token before reviewer-fast, so the worker learns
  early.
- Hook lanes: wired into `reviewer-fast`, `pre-commit`, and `pre-push` in
  `governance/compat/run_local_governance_hook_chain.py`.

## Claim Boundary

This standard captures friction signal at artifact level only. It does not prove
comprehension, score worker quality, change runtime/provider behavior, claim cost
optimization or speed, enforce guard-orientation read receipts (that is the
separate AAF-T6 lane), or claim readiness or universal control. Canonical
standards, work orders, machine checkers, and current session state still control.

## Related Surfaces

- `governance/compat/check_worker_experience_retrospective.py` - canonical checker
- `governance/compat/run_agent_automation_assist.py` - early read-only diagnostic
- `governance/compat/run_worker_return_fast_gate.py` - worker-return fast gate
- `governance/compat/run_local_governance_hook_chain.py` - hook lanes
- `docs/reference/guard_orientation/README.md` - guard orientation index
- `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md` - task-trigger lookup
