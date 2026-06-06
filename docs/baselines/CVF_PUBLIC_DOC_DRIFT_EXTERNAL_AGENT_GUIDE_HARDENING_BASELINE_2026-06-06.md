# CVF Public Doc Drift External-Agent Guide Hardening Baseline

Memory class: SUMMARY_RECORD

Status: READY_FOR_EXTERNAL_REVIEW

## Purpose / Decision / Baseline

Record the bounded public-sync baseline for public-doc drift phrase hardening
and external-agent review guidance.

## Source / Predecessor Evidence

Predecessor public-sync branch: `codex/p1-p5-public-doc-cleanup`.

External-review defect class: repeated stale public documentation findings and
unclear public first-read path for AI reviewers evaluating CVF from a pasted
repository link.

## Scope

Changed public-sync surfaces:

- `README.md`
- `docs/GET_STARTED.md`
- `docs/guides/external-agent-review-guide.md`
- `docs/reference/CVF_POSITIONING.md`
- `docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`
- `governance/compat/check_public_doc_drift_phrases.py`
- `governance/compat/test_check_public_doc_drift_phrases.py`
- `governance/compat/run_local_governance_hook_chain.py`

## Findings / Position

- Known stale public-doc phrases were still capable of recurring without a
  dedicated machine check.
- External AI reviewers need a clear public-safe first-read guide because they
  often start from a pasted repository link rather than private provenance.
- A narrow phrase guard plus explicit external-agent guide is the correct
  bounded response for this defect class.

## Risk / Corrective Action

Risk: without this baseline, the same public-doc drift class can reappear and
external reviewers can overread public files into unsupported runtime,
production, provider-parity, or private-provenance claims.

Corrective action: add the phrase guard, wire it into local hooks, repair the
same-class `CVF_POSITIONING.md` drift caught by the guard, and link the
external-agent review guide from public entry points.

## Evidence / Required Evidence / Verification

- Public-doc drift checker added for known stale version, skill-count,
  placeholder security-contact, and public handoff-label phrases.
- `CVF_POSITIONING.md` same-class stale skill/date text repaired.
- External-agent guide added and linked from public README, GET_STARTED, and
  public evaluation claim boundary.
- `python governance/compat/check_public_doc_drift_phrases.py --enforce`: PASS.
- `python -m pytest governance/compat/test_check_public_doc_drift_phrases.py -q`: PASS.
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-commit`: PASS.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action | Handled |
| --- | --- | --- | --- | --- | --- |
| Repeated stale public-doc phrases and unclear public review entry point | `RULE_GAP` | `GOVERNANCE_CONTROL_PLANE` | `MACHINE_CHECK_ADDED` | Keep `governance/compat/check_public_doc_drift_phrases.py` in the local hook chain and add future source-backed recurring stale public-doc phrases only when stable enough for low-noise detection | HANDLED |
| Runtime/provider/cost findings | N/A_WITH_REASON | `RUNTIME_BEHAVIOR_LEARNING` N/A | N/A_WITH_REASON | No runtime behavior, provider call, or cost behavior is changed by this public-doc/control-plane hardening | N/A |

## Claim Boundary

This baseline proves only bounded public-doc drift and external-agent review
guidance hardening in public-sync. It does not prove runtime behavior,
dependency migration, live-provider governance proof, hosted readiness,
production readiness, provider parity, full public readiness, memory
reinjection, high-risk promotion implementation, Learning Orchestrator runtime
behavior, or autonomous mutation.
