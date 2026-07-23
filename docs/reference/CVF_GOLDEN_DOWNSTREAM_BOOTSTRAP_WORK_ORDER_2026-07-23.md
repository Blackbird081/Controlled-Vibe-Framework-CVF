# CVF Golden Downstream Bootstrap — Work Order

- Work order ID: `CVF-BSL-T1-WO`
- Date: 2026-07-23
- Phase: WORK_ORDER
- Status: AUTHORIZED
- Risk: R2
- Spec: `CVF-BSL-T1-SPEC`
- Authorization baseline: `6ce1cf00c31a7f825d4c3fa3e66e8a3509e4a4b2`
- Working branch: `tranche/golden-downstream-bootstrap`
- Commit ownership: COMMIT_STEWARD only

## Roles

- ORCHESTRATOR / SPEC_AUTHOR / WORK_ORDER_AUTHOR: Codex.
- IMPLEMENTATION_WORKER: Claude, after explicit acknowledgment.
- REVIEWER: Codex, independent from the implementation worker.
- REPAIR_WORKER: assigned only after a recorded reviewer finding.
- COMMIT_STEWARD / CLOSER: Codex.

Claude must not stage, commit, push, amend, rebase, merge or self-grant
REVIEW_PASS.

## Changed-set ceiling

The ceiling is permission, not a target:

```text
scripts/new-cvf-workspace.ps1
scripts/check_cvf_workspace_agent_enforcement.ps1
scripts/initialize_cvf_project_clone.ps1
scripts/lib/downstream_catalog/**
scripts/test_cvf_golden_downstream_bootstrap.ps1
governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md
governance/toolkit/05_OPERATION/downstream_catalog/**
docs/GET_STARTED.md
docs/reference/CVF_WORKSPACE_RULES.md
docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_*
```

If the implementation needs any other path, stop with
`BLOCKED_SCOPE_EXPANSION` and explain the exact dependency. Do not widen the
ceiling silently.

## Explicit exclusions

```text
AGENTS.md
AGENT_HANDOFF.md
README.md
PROVIDERS.md
ARCHITECTURE.md
EXTENSIONS/**
ECOSYSTEM/**
governance/runtime/**
.github/**
provider configuration
API keys and secrets
CVF-Operations-Workspace/**
any non-disposable downstream repository
```

No provider call, dependency installation, destructive reset, force push,
`git add .` or `git add -A` is authorized.

## Build sequence

1. Rehydrate public-core startup documents and acknowledge this work order.
2. Record transition to IMPLEMENTATION_WORKER in the build evidence.
3. Capture pre-build baseline: HEAD, branch, status, public remote and
   relevant existing bootstrap behavior.
4. Extract or author the generic downstream catalog starter kit.
5. Integrate it into bootstrap while reducing the entry script below 600
   lines and preserving its public parameters.
6. Extend doctor checks with explicit compatibility behavior.
7. Add the hermetic golden-downstream harness and negative cases.
8. Update only the authorized public documentation.
9. Run the full AC matrix, retain failures/repairs and leave every change
   unstaged.
10. Stop at `READY_FOR_INDEPENDENT_BOOTSTRAP_LEARNING_REVIEW`.

## Required evidence

| Group | Required proof |
|---|---|
| AC-01–05 | generated fixture inventory, registry parse/check and deterministic generated views |
| AC-06 | before/after second-bootstrap tracked-content comparison |
| AC-07–08 | named negative cases and expected non-zero doctor/manager results |
| AC-09–10 | fresh-clone/local-binding proof and absolute-path/secret scan |
| AC-11–12 | file-size guard and compatibility tests |
| AC-13–15 | cleanup receipt, public checks, diff check and documentation consistency |

## Commit plan after REVIEW_PASS

1. `C1`: generic catalog starter kit and executable catalog tests.
2. `C2`: bootstrap/initializer/doctor integration and golden harness.
3. `C3`: public documentation, review receipt and tranche closure.

COMMIT_STEWARD stages each commit with explicit paths, verifies its staged
allowlist, rehearses the proposed stack in a disposable worktree and pushes
only after final review.

## Stop conditions

Stop on:

- baseline or branch drift;
- non-empty/unexpected worktree at worker start;
- need to modify an excluded path;
- overwrite of project-owned content;
- absolute machine path in portable output;
- secret exposure or provider invocation;
- fabricated module/capability claim;
- non-idempotent second bootstrap;
- catalog/doctor false pass;
- legacy compatibility break without an explicit reviewer decision;
- file over 600 lines that cannot be repaired within the ceiling;
- fixture/temp residue;
- test failure not repairable inside scope.

## Completion boundary

FREEZE proves only that the public bootstrap kit creates a stronger,
machine-governed downstream foundation. It does not migrate existing projects,
implement application runtime behavior or prove live AI governance.
