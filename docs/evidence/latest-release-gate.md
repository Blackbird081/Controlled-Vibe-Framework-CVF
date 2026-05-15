# Latest Release Gate

Status: fresh local-first release gate PASS on 2026-05-16.

The release-quality local command is:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

The command includes live governance E2E and must fail if no
DashScope-compatible live key is available.

Renewed repository live proof must be run after GitHub cutover through:

```text
.github/workflows/cvf-protected-live-release-gate.yml
```

Boundary:

- Local-first release gate proof is recorded at
  `docs/evidence/local-first-release-gate-proof-2026-05-16.md`.
- Historical live evidence is preserved in the provenance repository.
- Hosted GitHub protected live-gate evidence is still separate from local proof.
  Any hosted/public GA claim must cite a hosted workflow run when required.
