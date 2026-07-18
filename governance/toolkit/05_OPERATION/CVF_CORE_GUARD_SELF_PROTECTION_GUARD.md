# CVF Core Guard Self-Protection Guard

Memory class: FULL_RECORD

**Control ID:** `GC-049`
**Guard Class:** `META_GUARD`
**Status:** Active mandatory self-protection control for core CVF guard surfaces.
**Applies to:** Any human or AI agent that edits core guard scripts, hook chains,
guard docs, active session front doors, governance control matrices, master
policy files, or startup control files.
**Enforced by:** `governance/compat/check_core_guard_self_protection.py`

## Purpose

Protect the CVF control plane from high-capability agent runaway behavior where
an agent starts from a bounded task, then modifies guard code, archive state, or
core policy surfaces without explicit authorization.

## Rule

Protected guard/control files are frozen by default. A change set that touches
protected files must include a governed authorization artifact with:

- `Core Guard Self-Protection Authorization`
- `Authorized guard-maintenance scope`
- `Protected paths`
- `Operator authorization`
- `Rollback boundary`

The authorization artifact must be either a changed governed Markdown file
under one of the checker-recognized prefixes:

- `docs/baselines/`
- `docs/roadmaps/`
- `docs/reviews/`
- `docs/work_orders/`

or the changed root active handoff file matching `AGENT_HANDOFF*.md`.

Root active handoff authorization is intentionally narrow: it may satisfy only
`Core Guard Self-Protection Authorization` for session/front-door sync commits
when the same changed handoff lists every protected path in the changed range.
Archive handoffs under `CVF_SESSION/handoffs/archive/` are not authorization
artifacts. Large-scope, scope-firewall, expected-artifact, and commit-prompt
authorization markers remain limited to docs-prefixed governed artifacts.

Agents may not delete or rename protected guard/control files.

Large change sets are also blocked unless a governed artifact includes:

- `Large-Scope Change Authorization`
- `Changed-file ceiling`
- `Rename/delete ceiling`
- `Operator authorization`
- `Rollback boundary`

This prevents a bounded fix from silently becoming archive cleanup,
guard-maintenance, public-sync, or broad structural relocation.

When a batch declares a scope firewall, indexed/staged paths must remain inside
the declared allowlist and must not touch forbidden paths. The authorization
artifact must include:

- `Scope Firewall Authorization`
- `Allowed paths`
- `Forbidden paths`
- `Operator authorization`
- `Rollback boundary`

Closure evidence that claims a feature, roadmap, or finding is fixed must be
able to name expected files. When a changed governed artifact includes
`Expected Artifact Existence`, every backticked path in that section must exist
on disk.

An agent may not ask the operator whether to commit until the changed artifact
contains a complete `Commit Prompt Readiness` block with:

- `Diff scope: PASS`
- `Tests: PASS`
- `Gates: PASS`
- `Untracked unrelated: NONE`
- `Forbidden touched paths: NONE`

## Enforcement Surface

- `governance/compat/check_core_guard_self_protection.py`
- `governance/compat/run_local_governance_hook_chain.py`
- `governance/compat/run_agent_autorun_workflow_gate.py`

The checker evaluates committed range, staged changes, unstaged changes, and
untracked files.

## Related Artifacts

- `governance/compat/check_core_guard_self_protection.py`
- `governance/compat/run_local_governance_hook_chain.py`
- `governance/compat/run_agent_autorun_workflow_gate.py`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- `docs/CVF_CORE_KNOWLEDGE_BASE.md`

## Final Clause

If an agent needs to change the machinery that judges agents, the change must
be explicit, bounded, and reviewable before the machinery is touched.
