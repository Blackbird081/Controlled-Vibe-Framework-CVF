# QBS-1 Pre-Registration Template

Status: `TEMPLATE_READY`

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

