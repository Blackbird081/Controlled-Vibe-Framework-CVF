# Local-First Release Gate Proof

Date: 2026-05-16

Status: PASS

This is the fresh release-gate proof for the local-first deployment baseline.
The operator-supplied DashScope-compatible live key was loaded through process
environment only. Raw key values were not printed, committed, or copied into
the public repository.

Command:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Result:

| Check | Status | Message |
| --- | --- | --- |
| Web build | PASS | Build succeeded |
| TypeScript check | PASS | Guard contract typecheck clean |
| Provider readiness | PASS | `CERTIFIED` lanes: `1`; status `CERTIFIED` |
| Secrets scan | PASS | No secret patterns detected |
| Docs governance | PASS | Required RC docs present |
| E2E Playwright UI mock | PASS | UI mock suite passed |
| E2E Playwright live governance | PASS | Live governance suite passed |

Interpretation:

- This proves the public surface can pass the release-quality governance gate
  with an operator-supplied live key.
- The live governance E2E path ran successfully.
- This is governance operability evidence, not output-quality parity evidence.

Boundary:

- Mock UI E2E is counted only as UI structure evidence.
- Live governance E2E is the relevant runtime governance proof.
- This proof does not change the current output-quality boundary documented in
  `docs/evidence/current-cvf-quality-status.md`.
