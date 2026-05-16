# QBS-1 Artifact Layout

Memory class: POINTER_RECORD

Status: `ARTIFACT_LAYOUT_READY`

## Purpose

Define the public sanitized layout for QBS-1 run artifacts so reviewers and
agents can locate each artifact deterministically, and so raw operator-only
material stays out of the public surface.

## Scope

Required public run files, directory structure, and sanitization boundary
for QBS-1 scored runs. This file does not contain actual run artifacts.

## Source

Predecessor evidence anchors:

- `runner-contract.md`
- `scoring-rubric.md`
- `corpus-candidate.md`

## Protocol

Each scored run writes its public artifacts under `docs/benchmark/runs/<run-id>/`
following the file list below. Sanitization happens before commit; raw or
unredacted material is preserved separately in the provenance archive.

## Enforcement

Public-surface scanner verifies the artifact set and forbids committing raw
provider request IDs or operator-only context onto the public surface.
Missing required files trigger an evidence-completeness gate failure.

## Boundaries

This layout does not authorize:

- committing unsanitized provider transcripts;
- omitting receipt or claim-statement artifacts from a scored run;
- treating a run with missing artifacts as scored evidence.

## Related Artifacts

- `README.md`
- `runner-contract.md`
- `scoring-rubric.md`
- `preregistration-template.md`
- `scored-run-readiness.md`

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


## Claim Boundary

This layout claims only the public artifact structure and sanitization
boundary. It does not claim a specific scored run satisfies the layout, does
not authorize partial artifact sets to count as scored evidence, and does
not permit raw provider transcripts on the public surface.
