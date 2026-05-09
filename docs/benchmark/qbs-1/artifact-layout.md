# QBS-1 Artifact Layout

Status: `ARTIFACT_LAYOUT_READY`

Public sanitized QBS run artifacts live under:

```text
docs/benchmark/runs/<run-id>/
```

Raw local artifacts that contain unredacted outputs, provider request IDs, or
operator-only context must not be committed unless sanitized and classified as
public evidence.

## Required Public Run Files

```text
docs/benchmark/runs/<run-id>/
  README.md
  run-manifest.json
  corpus-manifest.json
  config-prompt-manifest.json
  provider-model-manifest.json
  prompt-diff-manifest.json
  hard-gate-results.json
  aggregate-results.json
  cost-latency-results.json
  reviewer-agreement.json
  claim-statement.md
  limitations.md
```

## Optional Public Files

```text
  redacted-output-samples/
  reviewer-packet-samples/
  adjudication-summary.md
```

## Private Or Local-Only Files

The following stay outside the public repo unless explicitly sanitized:

- raw output bundles;
- provider request logs;
- local environment captures;
- unredacted reviewer packets;
- API error payloads that may include account or key metadata;
- local runtime state.

## Manifest Fields

Every public run manifest must include:

- `run_id`
- `run_class`
- `criteria_version`
- `corpus_version`
- `provider`
- `model`
- `started_at`
- `completed_at`
- `preregistration_tag`
- `preregistration_tag_sha`
- `public_status`
- `allowed_claim_level`
- `verdict`

