# CVF Public Export Disposition Standard

Memory class: POINTER_RECORD

Status: canonical and machine-enforced public export disposition standard.

## Purpose

This standard prevents agents from closing private provenance work while leaving
readers unsure whether the capability was exported to the public CVF repository,
deferred as private-only, or blocked because public artifacts are missing.

## Scope

This standard applies to changed active CVF roadmaps, wave closures, completion
reviews, closure packets, and public-sync batches after 2026-05-30.

Archive-qualified artifacts under `archive/` are excluded. Public-facing work
must still be performed from the sibling public-sync clone, not from the private
provenance workspace.

## Rule

Any changed active artifact that marks a wave, roadmap, or closure-equivalent
scope `CLOSED`, `CLOSED_PASS`, `CLOSED_PASS_BOUNDED`, or equivalent must include
a `## Public Export Disposition` section when it is a roadmap closure, public
catalog claim, public-sync claim, or final wave completion packet.

## Allowed / Forbidden / Requirements

Allowed dispositions:

- `EXPORTED`
- `DEFERRED_PRIVATE_ONLY`
- `BLOCKED_MISSING_PUBLIC_ARTIFACTS`

`EXPORTED` requires public-sync evidence. `DEFERRED_PRIVATE_ONLY` requires a
reason. `BLOCKED_MISSING_PUBLIC_ARTIFACTS` requires a blocker and next action.

Forbidden claims:

- private provenance closure as public catalog export;
- public readiness without public-sync remote, commit, and path evidence;
- public product claims based only on hidden IDE history, raw operator memory,
  or ignored internal roadmap/review/baseline files.

Requirements:

- public-facing pushes must be made from the public-sync clone;
- closure artifacts must state the disposition before catalog or README claims;
- blocked or deferred artifacts must name the next action.

## Exceptions

Archive-qualified historical artifacts are exempt unless edited to make a new
public catalog or closure-equivalent claim. Pure typo fixes that do not affect
roadmap status, wave closure, public-sync disposition, catalog scope, or README
claim boundaries may record `N/A with reason` in the governing closure packet.

## Required Section

Use this section in closure artifacts:

```markdown
## Public Export Disposition

Disposition: `DEFERRED_PRIVATE_ONLY`
Reason: public-sync currently lacks the matching source/artifact surface.
Public-sync verification: `git remote -v` checked when applicable; no public
catalog claim is made in this provenance closure.
Next action: open a separate public-sync batch before making public catalog or
README claims.
```

For exported work:

```markdown
## Public Export Disposition

Disposition: `EXPORTED`
Public-sync remote: `https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`
Public-sync commit: `<sha>`
Public artifact paths: `<paths>`
Public catalog paths: `<paths or N/A with reason>`
```

For blocked work:

```markdown
## Public Export Disposition

Disposition: `BLOCKED_MISSING_PUBLIC_ARTIFACTS`
Blocker: public-sync lacks `<source/spec/evidence>`.
Next action: create a public-sync export work order or mark the public claim
out of scope.
```

## Enforcement Surface

Machine guard:

`governance/compat/check_public_export_disposition.py`

The guard runs in the agent autorun workflow and local hook chain. It checks
changed active roadmaps and final wave completion packets for a public export
disposition and blocks missing or overclaimed public-export evidence.

## Failure Modes

| Failure mode | Required action |
| --- | --- |
| Closed roadmap lacks public export disposition | Add `## Public Export Disposition` before closure. |
| Final wave completion says wave complete but lacks disposition | Add the disposition or downgrade the closure claim. |
| Artifact claims public export without public-sync remote/commit/path evidence | Replace with `DEFERRED_PRIVATE_ONLY` or add public-sync evidence. |
| Artifact claims public catalog readiness while public-sync lacks artifacts | Use `BLOCKED_MISSING_PUBLIC_ARTIFACTS` and open a public-sync batch. |

## Related Artifacts

- `AGENTS.md`
- `CVF_SESSION_MEMORY.md`
- `docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md`
- `docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md`
- `governance/compat/run_agent_autorun_workflow_gate.py`
- `governance/compat/run_local_governance_hook_chain.py`

## Claim Boundary

This standard records whether a private closure has been exported to the public
repository. It does not itself export artifacts, prove public readiness, prove
hosted freshness, or authorize pushing the provenance repository to the public
remote.
