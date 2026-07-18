# CVF ERH-T2B CI Hardening Plan

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED_SUPERSEDED_BY_ERH_CI1_WORKFLOW_CHAIN

docType: reference

Date: 2026-06-04

Work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_ERH_T2B_CI_HARDENING_PLAN_2026-06-04.md`

## Purpose

Record the CI hardening plan created after ERH-T2A route coverage ledger. This
plan is now the upstream input for the ERH-CI1 public-evaluation workflow
chain.

Workflow-chain successor:

`docs/reference/CVF_ERH_CI_PUBLIC_EVALUATION_WORKFLOW_CHAIN_2026-06-04.md`

## Scope / Target / Owner Boundary

Target workflows:

- `.github/workflows/cvf-ci.yml`;
- `.github/workflows/cvf-protected-live-release-gate.yml`.

Out of scope: workflow edits, protected live proof execution, dependency
installation, and public-sync changes.

## Current CI Evidence

| Workflow | Source evidence | Current claim allowed |
| --- | --- | --- |
| `cvf-ci.yml` | type check, build, and test jobs across guard, MCP, CPF, EPF, GEF, LPF, and web UI | CI verifies core type/build/test lanes |
| `cvf-web-ci.yml` | lint and coverage markers exist for web CI | web lint/coverage visibility may be claimed with boundary |
| `cvf-ci.yml` plus broader workflow scan | no ordinary dependency-audit hardening or public-doc drift hardening is proven | do not claim dependency-audit/doc-drift-hardened CI |
| `cvf-protected-live-release-gate.yml` | manual `workflow_dispatch` plus `RUN_LIVE_GATE` confirmation and `run_cvf_release_gate_bundle.py --json` | live proof is protected/manual, not ordinary CI |

## Hardening Plan

| Priority | Gate candidate | Why it matters | Proposed next owner | Implementation status |
| --- | --- | --- | --- | --- |
| P0 | Public docs drift check | public README/catalog can fall behind private provenance | ERH-T1B public-sync work order | PROPOSED |
| P0 | Route ledger drift check | route inventory can become stale after API route changes | future CI2 route-ledger checker | PROPOSED |
| P1 | Web lint gate | type/build can pass with style/static-quality gaps | workflow implementation work order | PROPOSED |
| P1 | Coverage summary or threshold | public production-readiness claims need stronger test visibility | workflow implementation work order | PROPOSED |
| P1 | Dependency audit posture | dependency risk such as `next-auth` beta needs explicit visibility | dependency/CI work order | PROPOSED |
| P2 | Public export disposition check in public-sync | prevents private-only artifacts from being claimed public | public-sync CI lane | PROPOSED |
| P2 | Protected live gate artifact retention policy | preserves live proof receipt discoverability | release governance work order | PROPOSED |

## Recommended Follow-Up Work Orders

| Work order candidate | Scope | Blocking dependency |
| --- | --- | --- |
| ERH-CI1 public docs drift checker | compare public README/catalog sections against exported claim boundary packet | ERH-T1B public-sync draft |
| ERH-CI2 route-ledger drift checker | fail when route count/path set changes without ledger update | stabilize T2A ledger format |
| ERH-CI3 dependency audit visibility | add dependency audit/reporting lane with explicit failure threshold | T4 dependency decision |
| ERH-CI4 coverage/lint lane | add lint and coverage reporting where package scripts support it | package-script source verification |

## Public Claim Rule

Public docs may say CVF has CI coverage for type/build/test lanes and a
protected live release gate. Public docs must not say CI is production-grade,
coverage-threshold hardened, dependency-audit hardened, or public-doc drift
hardened until follow-up workflow evidence exists.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| Public CI claim can overstate current workflow | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | open ERH-CI follow-up after public-sync scope is known |
| Route ledger can drift after route changes | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | route-ledger drift checker candidate |
| Plan-only CI hardening could remain advisory prose | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_ADDED | ERH-CI1 workflow-chain checker |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance plan. It includes no public-sync commit or public
artifact path.

Next action: ERH-T1B may export a bounded CI statement, not the whole private
plan unless explicitly curated.

## Claim Boundary

This plan is now upstream evidence for ERH-CI1. It does not edit CI, run CI, or
prove production readiness. The successor workflow chain proves only bounded
source-visible public-evaluation posture.
