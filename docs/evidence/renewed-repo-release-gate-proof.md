# Renewed Repo Release Gate Proof

Status: pending renewed-repo hosted run.

After this repository is pushed and GitHub environment secrets are configured,
run:

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

