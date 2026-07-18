# CVF ERH CI Public Evaluation Workflow Chain

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-04

Chain version: `cvf.erhCiPublicEvaluationWorkflow.ci1.v1`

Checker: `governance/compat/check_erh_ci_public_evaluation_workflow.py`

## Purpose

Define the ERH CI public-evaluation workflow chain. The chain lets CVF answer a
public evaluator's CI-readiness question from source-visible markers instead of
from broad README prose.

## Scope / Target / Owner Boundary

Target: private provenance CI/public-evaluation claim posture for the public
GitHub surface.

Owner boundary: this reference owns the chain contract and machine-check
boundary. It does not own GitHub Actions workflow rewrites, public-sync exports,
dependency migration, hosted deployment, or live provider execution.

## Scope / Applies-To

Applies to ERH-derived CI/public-evaluation claims that mention type/build/test
coverage, web lint/coverage visibility, protected live release gate posture,
or route-governance workflow traceability.

Does not apply to production deployment, hosted freshness, public catalog
export approval, dependency-audit hardening, or provider/runtime proof.

## Workflow Stages

| Stage | Source | Required signal | Claim allowed |
| --- | --- | --- | --- |
| `main_ci_type_build_test` | `cvf-ci.yml` | typecheck, build, test, summary gate markers | core CI type/build/test visibility |
| `web_lint_and_coverage` | `cvf-web-ci.yml` | lint and coverage markers | web lint/coverage visibility |
| `static_ci_gate` | `cvf-static-ci.yml` | static CI gate runner marker | static governance gate visibility |
| `protected_live_gate` | protected live release workflow | manual dispatch and confirmation marker | protected/manual live proof path only |
| `docs_governance_chain` | documentation testing workflow | markdown and work-order governance markers | docs governance visibility |
| `web_package_script_capabilities` | cvf-web package scripts | lint, check, build, test, coverage scripts | package capability backing |
| `route_governance_workflow_interlock` | GC-052 registry | ERH-T2C route workflow connection | route proof chain traceability |
| `public_claim_boundary` | ERH-T2B plan | production-grade/dependency-audit/doc-drift caveats | bounded public CI claim |

## Machine Gate

Run:

```powershell
python governance/compat/check_erh_ci_public_evaluation_workflow.py --enforce
```

Allowed verdicts:

- `READY_WITH_BOUNDARIES`
- `BLOCKED`

`READY_WITH_BOUNDARIES` means the source markers for the chain exist. It does
not mean GitHub Actions syntax is fully validated, CI is production-grade, or
the public repository may claim full readiness.

## Claim Boundary

This workflow chain proves only source-visible public-evaluation posture:
type/build/test, web lint/coverage visibility, static governance gate, docs
governance lane, route-governance workflow traceability, and protected manual
live release gate. It does not prove production-grade CI, dependency-audit
hardening, public-doc drift hardening, hosted freshness, public readiness, or
ordinary live-provider CI execution.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| CI posture hardening plan needed a repeatable gate | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_ADDED | checker and hook/autorun wiring |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance workflow-chain reference. Public-sync may later
export a smaller CI-boundary summary after review.

Next action: keep public CI claims limited to source-visible bounded posture
until a separate public-sync decision is made.
