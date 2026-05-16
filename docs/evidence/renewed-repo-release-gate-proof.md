# Renewed Repo Release Gate Proof

Memory class: POINTER_RECORD

Status: pending renewed-repo hosted run.

## Purpose

Hold the placeholder for the hosted GitHub Actions release-gate proof that
must run on the renewed public repository before any hosted GA claim. This
file is updated with run-specific evidence after the workflow passes.

## Scope

Hosted protected workflow expectations for the renewed public repo. This
file does not cover local-first release-gate evidence; that lives under
`local-first-release-gate-proof-2026-05-16.md`.

## Source

Predecessor evidence anchors:

- `latest-release-gate.md`
- `local-first-release-gate-proof-2026-05-16.md`
- the hosted workflow file
  `.github/workflows/cvf-protected-live-release-gate.yml`

## Decision

Treated as the authoritative placeholder for hosted release-gate evidence.
Hosted GA claims must cite a passed run recorded in this file, not the
local-first proof.

## Evidence

After this repository is pushed and GitHub environment secrets are
configured, run:

```text
Actions -> CVF Protected Live Release Gate -> Run workflow
confirm_live_provider_cost = RUN_LIVE_GATE
```

Required environment:

```text
cvf-live-release-gate
```

Required secret:

```text
DASHSCOPE_API_KEY
```

Accepted aliases are documented in `README.md`.

When the run passes, update this file with:

- run URL
- commit SHA
- date
- provider lane
- result summary
- artifact name

## Claim Boundary

This file claims only that a hosted release-gate run is the required path
for any hosted/public GA claim. It does not claim a hosted run has executed
yet, does not claim hosted parity with local-first proof, and does not
authorize publishing a hosted GA badge until the workflow records a passing
run in this file.
