## Public Surface Publication Record

This section is agent-owned. Do not ask the operator to choose classifications
manually.

Public classes touched:

- `KEEP_PUBLIC_CORE`: <yes/no>
- `KEEP_PUBLIC_EVIDENCE_SUMMARY`: <yes/no>
- `PUBLIC_EXAMPLE_OPTIONAL`: <yes/no>

Private provenance status:

- `PRIVATE_PROVENANCE_BLOCKED`: excluded

Agent evidence:

- `python scripts/check_public_surface.py`: <PASS/FAIL with blocker paths>
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`: <PASS/FAIL>

## Checks

- No raw handoffs, rebuttals, logs, uncurated evidence, private operator
  transcripts, runtime state, `.env` files, or raw provider keys are included.
- Any governance-behavior claim cites live provider evidence or is explicitly
  bounded as documentation-only.
