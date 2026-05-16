# Local-First Release Gate Proof

Memory class: FULL_RECORD

Status: PASS

Date: 2026-05-16

## Purpose

Record the fresh release-gate proof for the local-first deployment baseline so
evaluators and agents can verify exactly which checks passed, under which
command, and where the boundary on quality interpretation sits.

## Scope

Single local-first release-gate run on 2026-05-16, captured with operator-
supplied DashScope-compatible live key loaded through process environment
only. Raw key values were not printed, committed, or copied into the public
repository.

## Source

Command:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

## Evidence

| Check | Status | Message |
| --- | --- | --- |
| Web build | PASS | Build succeeded |
| TypeScript check | PASS | Guard contract typecheck clean |
| Provider readiness | PASS | `CERTIFIED` lanes: `1`; status `CERTIFIED` |
| Secrets scan | PASS | No secret patterns detected |
| Docs governance | PASS | Required RC docs present |
| E2E Playwright UI mock | PASS | UI mock suite passed |
| E2E Playwright live governance | PASS | Live governance suite passed |

## Decision

This is treated as the current authoritative local-first release-gate proof
for the public repository. Hosted/public GA claims require a separate hosted
workflow run.

## Interpretation

- The public surface can pass the release-quality governance gate with an
  operator-supplied live key.
- The live governance E2E path ran successfully.
- This is governance operability evidence, not output-quality parity evidence.

## Boundary

- Mock UI E2E is counted only as UI structure evidence.
- Live governance E2E is the relevant runtime governance proof.
- This proof does not change the current output-quality boundary documented
  in `docs/evidence/current-cvf-quality-status.md`.

## Claim Boundary

This proof claims only that the listed checks passed under the listed command
on 2026-05-16 with an operator-supplied live key. It does not claim hosted-
workflow parity, does not claim output-quality parity with direct provider
output, and does not authorize new runtime behavior.
