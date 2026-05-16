# QBS-1 Pre-Registration Template

Memory class: POINTER_RECORD

Status: `TEMPLATE_READY`

## Purpose

Provide a frozen template for pre-registering QBS-1 scored runs so each run
binds its identity to a public commit before execution begins.

## Scope

Pre-registration tag format, fields to freeze, and the boundary between
pre-registration and execution. This file does not contain run-specific
pre-registration material.

## Source

Predecessor evidence anchors:

- `runner-contract.md`
- `corpus-candidate.md`
- `scoring-rubric.md`
- `../quality-benchmark-suite-methodology.md`

## Protocol

Authors produce a pre-registration packet under
`preregistrations/<run-id>.md`, freeze the surrounding methodology/corpus/
rubric commits, and create the public `qbs/preregister/<run-id>` tag against
that commit before any scored execution.

## Enforcement

Runner harness verifies pre-registration tag identity before counting a run
as scored. Missing or mismatched tag triggers `INVALID_PREREGISTRATION`.

## Boundaries

This template does not authorize:

- changing pre-registered fields after the tag is published;
- treating an untagged preparation as pre-registration;
- pre-registering against a methodology version that is not public.

## Related Artifacts

- `README.md`
- `runner-contract.md`
- `corpus-candidate.md`
- `scoring-rubric.md`
- `artifact-layout.md`

Use this template before any scored QBS run.

## Required Tag

```text
qbs/preregister/<run-id>
```

The tag must point to the public commit that freezes:

- methodology version;
- claim ladder;
- corpus manifest;
- config prompt manifest;
- provider/model manifest;
- scoring rubric;
- reviewer plan;
- artifact path;
- public/private evidence boundary.

## Run Declaration

```yaml
run_id: <run-id>
run_class: <CALIBRATION_PILOT|POWERED_SINGLE_PROVIDER|POWERED_MULTI_PROVIDER|REGRESSION_MONITOR>
criteria_version: <commit-or-tag>
corpus_version: <corpus-version>
provider: <provider-id>
model: <model-id>
configs:
  - CFG-A0
  - CFG-A1
  - CFG-B
repeat_count: <n>
artifact_root: docs/benchmark/runs/<run-id>
reviewer_plan: <path-or-summary>
allowed_claim_target: <none|L4|L5|L6>
family_level_claims_allowed: false
```

## Pre-Run Checklist

- [ ] `git status --short` is clean before tagging.
- [ ] `python scripts/check_public_surface.py` passes.
- [ ] Methodology version is frozen.
- [ ] Corpus manifest is frozen.
- [ ] `CFG-A1` template hash is recorded.
- [ ] Provider/model/output limits are frozen.
- [ ] Reviewer blinding plan is frozen.
- [ ] Judge model version is pinned, if a model judge is used.
- [ ] Public artifact path is declared.
- [ ] Raw/private artifact path is declared outside the public repo.
- [ ] Cost/quota boundary is declared.
- [ ] Operator approves live-cost run.

## Tag Command

```bash
git tag qbs/preregister/<run-id>
git push origin qbs/preregister/<run-id>
```

After the tag is pushed, any change to the frozen inputs creates a new run-set
version and requires a new pre-registration tag.


## Claim Boundary

This template claims only the pre-registration format and freeze rules. It
does not claim a current pre-registration exists for any specific run, does
not authorize publishing scored claims without a verified tag, and does not
permit retroactive pre-registration after execution.
