# CVF MSEA-R72A Public Main CI And Governance-Load Baseline Matrix

Memory class: governed-reference

Status: DRAFT_PENDING_REVIEW

Batch ID: MSEA_R72A_PUBLIC_MAIN_CI_HEALTH_AND_GOVERNANCE_LOAD_BASELINE

executionBaseHead: f1de350cb

## Purpose

Record current public-main GitHub Actions check status, classify each
failing check against `GCI-014`, and record a compact governance-load
baseline metric snapshot. This artifact is classification and evidence
only; it does not repair CI, mutate public-sync, or retire any checker.

## Scope

**Applies to:** public main GitHub Actions check status and governance-load
baseline metrics for the private provenance repository's R72A tranche only.
This reference artifact is scoped to read-only observation of public main
CI (`Blackbird081/Controlled-Vibe-Framework-CVF`) and the sibling public-sync
clone's boundary state. It does not apply to provenance-repo CI, runtime
source, tests, or checker implementation, and it does not extend to any
future R72B-R72H tranche scope beyond the carry-forward guardrails recorded
below.

## Public Main GitHub Actions Check Matrix

Observed public main head at evidence-capture time:
`e50ac604d517eafccb0c1401cbda7c353b31fcfa` (2026-07-07T14:19:20Z), consistent
across the four most recent public main push events observed
(`e50ac604d`, `b9ce2e482`, `04d431b09`, `65f3dd6ce`).

| Check (workflowName) | Status | Conclusion | Classification | Evidence |
| --- | --- | --- | --- | --- |
| CVF Public Surface | completed | success | N/A (passing) | `gh run list` databaseId `28873394060` |
| CVF Static CI Gate | completed | success | N/A (passing) | `gh run list` databaseId `28873391153` |
| CVF CI Pipeline | completed | failure | GOVERNANCE_LOAD | `gh run view 28873393873 --log-failed`: job `Web UI Tests` fails at pre-commit hook step "public export disposition quality" with `AGENTS.md (agents_binding_missing): AGENTS.md must cite governance/compat/check_public_export_disposition.py`; verified live in public-sync clone: `grep -n "check_public_export_disposition" AGENTS.md` returns no match at commit `e50ac604d` |
| Documentation & Testing | completed | failure | PRODUCT_DEBT | `gh run view 28873391126 --log-failed`: job `Conformance Release Grade` fails at `python scripts/run_cvf_cross_extension_conformance.py` with `No such file or directory`; verified live: `scripts/run_cvf_cross_extension_conformance.py` does not exist in the public-sync clone at commit `e50ac604d` |
| CVF CI | completed | failure | PRODUCT_DEBT | `gh run view 28873391198 --log-failed`: job `Learning Plane Foundation (1465 tests)` fails at `npm ci` with `npm error Missing: tldts-core@7.4.7 from lock file`, `tr46@6.0.0`, `punycode@2.3.1`; verified live: none of these three packages appear in `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/package-lock.json` in the public-sync clone |

## Classification Notes

- **CVF CI Pipeline -> GOVERNANCE_LOAD.** The failure is not a product defect;
  it is the provenance repo's own `run_local_governance_hook_chain.py`
  pre-commit gate chain (`check_public_export_disposition.py`) running inside
  CI against public-sync content and failing because `AGENTS.md` in
  public-sync has not been updated to cite that checker. This is governance
  metadata drift between the provenance checker's expectation and the
  public-sync export, not a runtime/application defect. GCI-014 owns this
  control; per its `WATCH` disposition, R72A records this instead of
  repairing it.
- **Documentation & Testing -> PRODUCT_DEBT.** `scripts/run_cvf_cross_extension_conformance.py` is invoked by the public
  `cvf-web-ci.yml`-class workflow but the script itself is absent from the
  public-sync tree. This is a public-sync export completeness gap (the
  script exists in the provenance repo's `scripts/` directory per
  `CLAUDE.md` Commands section, but was not carried into the last
  public-sync push). Classified as product debt because it blocks the
  documented public conformance-check contract, independent of any
  governance-load/checker-lifecycle question.
- **CVF CI -> PRODUCT_DEBT.** `package-lock.json` under
  `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/` is out of sync with
  `package.json`/actual dependency tree (three transitive packages entirely
  absent from the lockfile). This is ordinary npm dependency-lock drift, a
  product/build maintenance debt item, not a governance-load or checker
  question.
- No failing check in this snapshot required `BOTH` or `UNKNOWN_WITH_REASON`
  classification; each failure's root cause was directly observable in its
  failed-step log and cross-verified against the live public-sync clone.

## Governance-Load Baseline Metrics

| Metric | Scope | Value | Evidence |
| --- | --- | --- | --- |
| Public main check pass/fail mix (this snapshot) | 5 checks on head `e50ac604d` | 2 pass (`CVF Public Surface`, `CVF Static CI Gate`), 3 fail (`CVF CI Pipeline`, `Documentation & Testing`, `CVF CI`) | `gh run list --repo Blackbird081/Controlled-Vibe-Framework-CVF --branch main --limit 10 --json conclusion,name,createdAt,headSha,status,workflowName` |
| Public-surface gate state | `CVF Public Surface`, `CVF Static CI Gate` workflows | both `success` on last 4 observed pushes (`e50ac604d`, `b9ce2e482`, `04d431b09`, `65f3dd6ce`) | same `gh run list` query, filtered by `workflowName` |
| Direct checker-script baseline (R72D carry-forward) | `governance/compat/check_*.py` at GCI baseline commit `778adb4c3` | `checkerCount=186`; `added=186`; `deleted=0` | `docs/reference/governance_control_index/CVF_GOVERNANCE_CONTROL_INDEX.md` section `## Baseline Measurement` and `## Verification`; carried forward unchanged, not recomputed in this R72A tranche |
| Current provenance worktree commit-debt state | branch `codex/p1-p5-small-debt-remediation` | 51 unpushed commits ahead of `origin/codex/p1-p5-small-debt-remediation` | `git status --short --branch` at `executionBaseHead=f1de350cb` |
| Public-sync boundary state | sibling clone `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF-public-sync` | remote `origin` = `https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`; branch `main...origin/main`; no local changed paths | `git -C <public-sync> remote -v`; `git -C <public-sync> status --short --branch` |

Metric boundary: this snapshot's pass/fail mix and public-surface gate state
are current-observation metrics scoped to public main CI, distinct from and
not a substitute for the direct checker-script baseline row, which is
carried forward unchanged from the Governance Control Index per the R72D
guardrail below.

## R72D Direct-Checker Metric Carry-Forward Guardrail

This tranche does not recompute the direct checker-script count. The value
`checkerCount=186` (`added=186`, `deleted=0`) is carried forward verbatim
from `docs/reference/governance_control_index/CVF_GOVERNANCE_CONTROL_INDEX.md`
`## Baseline Measurement` at commit `778adb4c3`. Per the GCI Metric Boundary
section, this count is scoped narrowly to files named `check_*.py` under
`governance/compat/` and must not be confused with any broader recursive
Python-file count. R72A performed no independent recomputation.

## R72F No-Silent-Zero-Retirement Guardrail

This tranche makes no checker retirement, deletion, disablement, or
consolidation claim of any kind. Zero checkers were evaluated for retirement
in this tranche; this is not a retirement-zero outcome requiring a WATCH row
under R72F, because R72F itself (checker retirement/consolidation pilot) is
an explicitly separate downstream tranche not in scope here. The existing
GCI-014 row already carries a `WATCH` disposition with note "R72A must
classify current failures before any lightening or expansion" - that WATCH
row remains open and is not resolved or closed by this artifact.

## Public/Provenance Boundary

This artifact was authored in the private provenance workspace. All
public-sync evidence above was gathered read-only (`git remote -v`,
`git status --short --branch`, direct file existence/content checks via
`Read`/`grep`/`Test-Path`-equivalent). No public-sync file was created,
edited, staged, committed, or pushed. No GitHub merge, PR action, or branch
mutation was performed; all GitHub evidence was gathered via read-only
`gh run list` / `gh run view --log-failed`.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this is a private provenance reference artifact recording public-main
CI observations. It does not itself change public-sync, push public
branches, or publish public artifacts. Any repair of the classified findings
(AGENTS.md citation, conformance script export, lockfile sync) requires a
separate public-sync governed packet with fresh operator authorization.

## Claim Boundary

This artifact records classification and baseline-measurement evidence only.
It does not authorize, perform, or claim CI repair, checker retirement,
checker deletion, checker disablement, public-sync mutation, merge, push,
provider/live proof, runtime/source/test/checker edit, product extraction,
onboarding changes, or release claims. All GitHub Actions and public-sync
facts above are read-only observations current as of the command timestamps
cited in the Evidence columns.
