# CVF Product Value Validation Corpus Template

Memory class: POINTER_RECORD

> Purpose: frozen task corpus template for `Product Value Validation Wave`
> Default output memory class for a filled corpus packet: `FULL_RECORD`
> Rule: freeze this corpus before the first scored run; do not remove hard tasks after results are seen

---

## 1. Corpus Metadata

- Corpus ID:
- Date frozen:
- Version:
- Owner:
- Related roadmap:
- Related rubric:
- Related run manifest:
- Freeze status: `DRAFT` | `FROZEN` | `SUPERSEDED`

## 2. Corpus Composition Summary

- Total task count:
- Scenario-family count:
- Real product task count:
- Governance stress task count:
- Minimum runs per task:
- Compared configurations:

## 3. Corpus Integrity Rules

- no post-result task removal:
- malformed-task correction procedure:
- reviewer-blinding plan:
- task-ID immutability rule:
- evidence retention rule:

## 4. Scenario Family Table

| Family ID | Scenario family | Risk level | Required task count | Notes |
|---|---|---|---:|---|
| `FAM-001` |  | `LOW` |  |  |
| `FAM-002` |  | `MEDIUM` |  |  |
| `FAM-003` |  | `HIGH` |  |  |

## 5. Task Record Template

Copy one block per task.

```text
### Task: <TASK-ID>

- family_id:
- source_type: `CANONICAL_SCENARIO` | `REAL_PRODUCT_TASK` | `GOVERNANCE_STRESS`
- title:
- business/user goal:
- task class: `NORMAL` | `AMBIGUOUS` | `HIGH_RISK` | `ADVERSARIAL` | `MULTI_STEP`
- domain:
- prompt/input:
- required context:
- forbidden hidden hints:
- expected best outcome:
- minimum acceptable outcome:
- correct safe-abstain/escalate condition:
- should_code_execution_be_required: `YES` | `NO` | `UNKNOWN`
- safety sensitivity: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`
- scoring path: `STANDARD_REVIEW` | `DOUBLE_REVIEW_REQUIRED`
- baseline comparison note:
- failure taxonomy tags:
  - `HALLUCINATION`
  - `POLICY_FALSE_NEGATIVE`
  - `POLICY_FALSE_POSITIVE`
  - `LOW_USEFULNESS`
  - `HEAVY_REWORK`
  - `MISSING_JUSTIFICATION`
  - `MISSING_ABSTAIN`
  - `OTHER:<tag>`
- notes:
```

## 6. Corpus Coverage Checks

- [ ] At least `5` scenario families are present
- [ ] At least `90` total frozen tasks are present
- [ ] Every family contains normal + ambiguous + difficult tasks
- [ ] Governance-stress tasks are explicitly included
- [ ] Real product or near-real tasks are explicitly included
- [ ] High-risk tasks are marked for double review
- [ ] Every task has a stable `TASK-ID`
- [ ] Every task states whether code execution appears required, not required, or unknown

## 7. Not Allowed

- removing difficult tasks after seeing failures
- rewriting tasks mid-run to help one configuration
- mixing evaluation hints into task prompts
- letting reviewers change acceptance criteria during scoring
- treating this corpus as valid if the freeze checklist is incomplete

## 8. Evidence Ledger

- corpus source 1:
- corpus source 2:
- approval / freeze note:

