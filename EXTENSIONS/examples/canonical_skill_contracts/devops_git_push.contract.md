1. Capability Metadata

CAPABILITY_ID: DEVOPS_GIT_PUSH

DOMAIN: devops

DESCRIPTION:
Thực hiện commit và push các thay đổi đã được phê duyệt lên remote repository. Capability này có tác động trực tiếp đến codebase và lịch sử dự án.

RISK_LEVEL: High

2. Governance Constraints

ALLOWED_ARCHETYPES: Executor

ALLOWED_PHASES: Implementation

REQUIRED_DECISIONS:

APPROVED_CHANGESET

APPROVED_COMMIT_INTENT

REQUIRED_STATUS:

WORKTREE_CLEAN

TESTS_PASSED

3. Input Specification

INPUT_FIELDS:

repository_path

type: string

validation: must exist and be a git repository

required

commit_message

type: string

validation: follows project commit standard

required

files_scope

type: list[string]

validation: files must be tracked and within approved changeset

required

4. Output Specification

OUTPUT_FIELDS:

commit_hash

type: string

success: valid git commit hash returned

failure: empty or malformed hash

push_status

type: enum(success, rejected, failed)

success: remote updated

failure: any non-success state

5. Execution Properties

SIDE_EFFECTS:

Modifies repository history

Updates remote branch state

ROLLBACK_POSSIBILITY: Limited (requires revert or new commit)

IDEMPOTENCY: No

EXPECTED_DURATION: Short

6. Failure & Risk Notes

KNOWN_FAILURE_MODES:

Merge conflicts

Remote rejection

Invalid commit message

WORST_CASE_IMPACT:

Corrupted branch history

Deployment of unintended changes

HUMAN_INTERVENTION_REQUIRED: Yes

7. Audit & Trace Requirements

AUDIT_FIELDS:

timestamp

actor

commit_message

files_scope

commit_hash

target_branch

TRACE_LEVEL: Full