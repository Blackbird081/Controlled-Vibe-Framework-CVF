# Latest Release Gate

Status at renewal export: bounded public summary.

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

- Historical live evidence is preserved in the provenance repository.
- This renewed repository must produce its own hosted live-gate run before any
  new public GA claim depends on hosted GitHub evidence.

