# CHANGE CONTROL MAPPING SPEC
# CVF → CVF-Toolkit Integration
# Status: Authoritative Mapping
# Toolkit Version: 1.0.0
# CVF Lock: See 00_CANONICAL_REFERENCE/cvf_version.lock
1. PURPOSE

This document defines:

How CVF Change Governance is mapped into Toolkit

How changes are requested, approved, enforced

How freeze protocol interacts with change control

How high-risk modifications are blocked without authorization

This file is binding and non-bypassable.

2. CVF CHANGE PRINCIPLE (CANONICAL INTERPRETATION)

From CVF:

All structural modifications must:

Be formally requested

Be risk-assessed

Be approved by proper authority

Be audited

Be frozen before release

Toolkit must enforce this for:

Skill modifications

Risk model changes

Phase rule changes

Operator policy changes

Financial logic changes

AI provider configuration changes

3. WHAT CONSTITUTES A "CHANGE"

Toolkit defines change as any modification to:

| Category        | Example                   |
| --------------- | ------------------------- |
| Skill           | New skill, update version |
| Risk            | Change baseRisk           |
| Governance      | Modify phase rules        |
| Operator Policy | Change role permissions   |
| Financial Logic | Update calculation logic  |
| Provider        | Switch model version      |
| Extension       | Add/remove extension      |
| Release State   | Promote to production     |

Any of the above requires change control.

4. CHANGE REQUEST CONTRACT

Every change must follow this schema:

{
  changeId: string,
  changeType: "skill" | "risk" | "governance" | "policy" | "financial" | "provider" | "release",
  description: string,
  requestedBy: string,
  requestedAt: timestamp,
  affectedComponents: string[],
  riskAssessment: R1 | R2 | R3 | R4,
  requiresApproval: boolean,
  approvalChain: string[],
  status: "draft" | "submitted" | "approved" | "rejected" | "implemented" | "frozen",
  implementationReference?: string,
  auditTrail: object[]
}

No change may bypass this structure.

5. CHANGE CONTROLLER COMPONENT

Implemented in:
change.controller.ts
cvf.change.adapter.ts

Responsibilities:

Validate change schema

Run risk.classifier

Determine approval requirement

Lock affected components

Enforce freeze

Log audit trail

6. CHANGE RISK MATRIX

| Risk | Approval Required | UAT Required | Freeze Required |
| ---- | ----------------- | ------------ | --------------- |
| R1   | No                | No           | No              |
| R2   | Single approval   | Yes          | No              |
| R3   | Single approval   | Yes          | Yes             |
| R4   | Multi approval    | Extended UAT | Yes             |

Multi-approval minimum: 2 independent roles.

7. CHANGE LIFECYCLE

State transitions:
draft → submitted → approved → implemented → frozen

Or:

draft → submitted → rejected

Illegal transitions prohibited.

Once frozen → cannot revert without new change request.

8. FREEZE INTEGRATION RULE

Freeze protocol activates when:

Risk >= R3

Change affects production

Financial logic modified

Provider model updated

Freeze must:

Lock configuration

Lock skill definitions

Lock risk thresholds

Lock version references

Freeze status must be recorded in:

freeze.protocol.md

9. PROHIBITED ACTIONS

Direct modification of released skill without change request.

Direct provider model switch in prod.

Downgrading risk without approval.

Skipping UAT for R2+.

Bypassing freeze enforcement.

Manual database modification to avoid change record.

10. AI PROVIDER CHANGE RULE

Switching model version (e.g., GPT-5 → GPT-5.1):

Automatically classified as:

risk >= R3

Requires:

Approval

UAT

Freeze before prod

11. FINANCIAL CHANGE OVERRIDE

If changeType == "financial":

Minimum risk = R3.

If affecting:

Forecast logic

Recommendation logic

Portfolio scoring

Trading automation

Then:

Risk = R4 automatically.

12. AUDIT REQUIREMENTS

For each change:

Log:

{
  changeId,
  riskLevel,
  approvalChain,
  timestamps,
  affectedComponents,
  implementationHash,
  freezeStatus
}

Audit logs must be immutable.

13. CHANGE BLOCK CONDITIONS

Implementation blocked if:

status != approved

approvalChain incomplete

UAT incomplete

freeze required but not applied

audit logger inactive

System must throw:

ChangeViolationError

14. EXTENSION RULE

Extensions may:

Propose change

Register change

Extensions may not:

Approve own change

Modify core governance logic

Override freeze protocol

15. VERSION INCREMENT RULE

If changeType == "skill":

Version increment required.

If changeType == "governance":

Toolkit MAJOR version increment required.

If changeType == "risk":

MINOR increment required.

16. COMPLIANCE CHECKLIST

Toolkit compliant if:

✔ Change request schema enforced
✔ Risk assessment integrated
✔ Approval chain enforced
✔ Freeze protocol integrated
✔ Audit logging active
✔ Version increment rule applied
✔ No direct mutation allowed

