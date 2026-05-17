1. Capability Metadata

CAPABILITY_ID: DEPLOYMENT_RELEASE

DOMAIN: deployment

DESCRIPTION:
Triển khai phiên bản đã được phê duyệt lên môi trường mục tiêu.

RISK_LEVEL: Critical

2. Governance Constraints

ALLOWED_ARCHETYPES: Executor

ALLOWED_PHASES: Deployment

REQUIRED_DECISIONS:

APPROVED_RELEASE

APPROVED_ENVIRONMENT

REQUIRED_STATUS:

BUILD_VERIFIED

ROLLBACK_PLAN_READY

3. Input Specification

INPUT_FIELDS:

artifact_id

type: string

validation: exists and verified

required

target_environment

type: enum(staging, production)

validation: matches approved environment

required

4. Output Specification

OUTPUT_FIELDS:

deployment_status

type: enum(success, failed, rolled_back)

success: service running as expected

failure: any deviation

release_version

type: string

success: version registered

failure: empty

5. Execution Properties

SIDE_EFFECTS:

Service availability impact

Infrastructure mutation

ROLLBACK_POSSIBILITY: Yes

IDEMPOTENCY: No

EXPECTED_DURATION: Medium

6. Failure & Risk Notes

KNOWN_FAILURE_MODES:

Deployment timeout

Misconfiguration

WORST_CASE_IMPACT:

System outage

Data inconsistency

HUMAN_INTERVENTION_REQUIRED: Yes

7. Audit & Trace Requirements

AUDIT_FIELDS:

timestamp

actor

artifact_id

target_environment

deployment_status

rollback_invoked

TRACE_LEVEL: Full