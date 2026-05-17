1. Capability Metadata

CAPABILITY_ID: FILESYSTEM_FILE_WRITE

DOMAIN: filesystem

DESCRIPTION:
Ghi nội dung vào file trong phạm vi đã được phê duyệt.

RISK_LEVEL: Medium

2. Governance Constraints

ALLOWED_ARCHETYPES: Executor

ALLOWED_PHASES: Implementation

REQUIRED_DECISIONS:

APPROVED_FILE_CHANGE

REQUIRED_STATUS:

PATH_VALIDATED

3. Input Specification

INPUT_FIELDS:

file_path

type: string

validation: within approved directory scope

required

content

type: string

validation: non-empty

required

4. Output Specification

OUTPUT_FIELDS:

write_status

type: enum(success, failed)

success: content persisted

failure: any error state

5. Execution Properties

SIDE_EFFECTS: File system mutation

ROLLBACK_POSSIBILITY: Yes (restore previous content)

IDEMPOTENCY: Conditional

EXPECTED_DURATION: Short

6. Failure & Risk Notes

KNOWN_FAILURE_MODES:

Permission denied

Invalid path

WORST_CASE_IMPACT:

Data loss

Configuration corruption

HUMAN_INTERVENTION_REQUIRED: Conditional

7. Audit & Trace Requirements

AUDIT_FIELDS:

timestamp

actor

file_path

content_checksum

write_status

TRACE_LEVEL: Basic