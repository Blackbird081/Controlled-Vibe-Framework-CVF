# CVF LHW1 Product Skill Pack Workflow Connector — Example Records

Memory class: SUMMARY_RECORD

docType: reference

Status: ACTIVE

Date: 2026-05-27

Authority: `docs/reference/CVF_LHW1_PRODUCT_SKILL_PACK_WORKFLOW_CONNECTOR_SPEC_2026-05-27.md`

---

## Purpose

Provide at least two complete connector records valid against all required
fields in Sections 2–7 of the connector spec. These are C7A-certified pack
examples for use as templates by implementers and agents.

## Scope

Applies to and must conform to the canonical connector spec:
`docs/reference/CVF_LHW1_PRODUCT_SKILL_PACK_WORKFLOW_CONNECTOR_SPEC_2026-05-27.md`.
All records use C7A-certified packs from the certified skill pack registry.

## Section 9 — Example Connector Records

Each record below is valid against all required fields in Sections 2–7 of the
connector spec. Both examples use C7A-certified packs.

---

### Example 1 — `product_brief`

```yaml
# Skill Pack Metadata (Section 2)
packId: product_brief
packName: Product Brief
packVersion: "1.0.0"
outcomeFamily: product
certificationStatus: certified
nonCoderSummary: >
  Guides a non-coder through defining a complete product brief with goals,
  audience, feature scope, and success criteria, ready for agent execution.

# Workflow Spec (Section 3)
workflowId: product_brief
phases:
  - name: intake_pending
    role: Implementer
    inputs: [product name, target audience, core problem, desired outcomes]
    outputs: [completed intake form, normalized CVF Execution Spec]
    successCriteria: All intake fields present; CVF Execution Spec emitted.
  - name: design_ready
    role: Orchestrator
    inputs: [normalized CVF Execution Spec]
    outputs: [phase plan, output template selection]
    successCriteria: Output template selected and phase plan recorded.
  - name: build_running
    role: Implementer
    inputs: [phase plan, output template]
    outputs: [draft product brief artifact]
    successCriteria: Draft artifact exists and passes artifact verification.
  - name: review_pending
    role: Reviewer
    inputs: [draft product brief artifact, governance receipt]
    outputs: [reviewer sign-off or dissent record]
    successCriteria: Reviewer records approval or dissent in dissent ledger.
  - name: freeze_ready
    role: Auditor
    inputs: [reviewer sign-off, governance receipt, artifact]
    outputs: [freeze confirmation record]
    successCriteria: All evidence items confirmed by Auditor.
  - name: completed
    role: Orchestrator
    inputs: [freeze confirmation record]
    outputs: [final product brief artifact, audit trail]
    successCriteria: Artifact delivered to non-coder; audit trail captured.
phaseTransitions:
  - intake_pending → design_ready
  - design_ready → build_running
  - build_running → review_pending
  - review_pending → freeze_ready
  - freeze_ready → completed
recoveryCheckpoint: build_running

# Execution Policy (Section 4)
maxRiskLevel: R1
requiresLiveProvider: true
requiresReviewerGate: true
reviewerGatePhase: review_pending
blockedActions:
  - mcp_call
  - database_mutation
  - raw_memory_reinjection
  - external_skill_import
  - credential_access

# Review Checklist (Section 5)
reviewerRoles: [Reviewer, Auditor]
dissentHandling: hold_for_resolution
evidenceRequired:
  - governance receipt with receiptId present
  - reviewer sign-off recorded in dissent ledger
  - draft artifact passes artifact verification check

# Receipt Schema (Section 6)
receiptRequired: true
receiptFields:
  - receiptId
  - traceId
  - provider
  - model
  - phase
  - riskLevel
  - riskValid
  - approvalRequired
  - humanReviewRequired
  - workflowState
  - contractVersion
canReinject: false

# Failure Recovery (Section 7)
failureClasses:
  - provider_auth_error
  - context_validation_error
  - risk_gate_block
  - reviewer_gate_hold
  - timeout_transient
recoveryActions:
  provider_auth_error: escalate
  context_validation_error: hold
  risk_gate_block: hold
  reviewer_gate_hold: hold
  timeout_transient: retry
userVisibleMessage:
  provider_auth_error: "We could not connect to the AI provider. Please check your credentials."
  context_validation_error: "Your product brief request is missing key information. Please fill in the highlighted fields."
  risk_gate_block: "This product brief needs human review before we can continue. A reviewer has been notified."
  reviewer_gate_hold: "Waiting for reviewer approval on your product brief. No action needed right now."
  timeout_transient: "The request took too long. We will try again automatically."
```

---

### Example 2 — `strategy_analysis`

```yaml
# Skill Pack Metadata (Section 2)
packId: strategy_analysis
packName: Strategy Analysis
packVersion: "1.0.0"
outcomeFamily: business_analysis
certificationStatus: certified
nonCoderSummary: >
  Guides a non-coder through a structured strategy analysis covering market
  position, competitive landscape, opportunities, and recommended next actions.

# Workflow Spec (Section 3)
workflowId: strategy_analysis
phases:
  - name: intake_pending
    role: Implementer
    inputs: [company or product name, strategic question, available context]
    outputs: [completed intake form, normalized CVF Execution Spec]
    successCriteria: Strategic question defined; CVF Execution Spec emitted.
  - name: design_ready
    role: Orchestrator
    inputs: [normalized CVF Execution Spec]
    outputs: [analysis framework selection, phase plan]
    successCriteria: Analysis framework selected and plan recorded.
  - name: build_running
    role: Implementer
    inputs: [phase plan, analysis framework]
    outputs: [draft strategy analysis artifact]
    successCriteria: Draft artifact produced and passes artifact verification.
  - name: review_pending
    role: Reviewer
    inputs: [draft strategy analysis artifact, governance receipt]
    outputs: [reviewer sign-off or dissent record]
    successCriteria: Reviewer records approval or dissent in dissent ledger.
  - name: freeze_ready
    role: Auditor
    inputs: [reviewer sign-off, governance receipt, artifact]
    outputs: [freeze confirmation record]
    successCriteria: All evidence items confirmed by Auditor.
  - name: completed
    role: Orchestrator
    inputs: [freeze confirmation record]
    outputs: [final strategy analysis artifact, audit trail]
    successCriteria: Artifact delivered to non-coder; audit trail captured.
phaseTransitions:
  - intake_pending → design_ready
  - design_ready → build_running
  - build_running → review_pending
  - review_pending → freeze_ready
  - freeze_ready → completed
recoveryCheckpoint: build_running

# Execution Policy (Section 4)
maxRiskLevel: R1
requiresLiveProvider: true
requiresReviewerGate: true
reviewerGatePhase: review_pending
blockedActions:
  - mcp_call
  - database_mutation
  - raw_memory_reinjection
  - external_skill_import
  - credential_access

# Review Checklist (Section 5)
reviewerRoles: [Reviewer, Auditor]
dissentHandling: hold_for_resolution
evidenceRequired:
  - governance receipt with receiptId present
  - reviewer sign-off recorded in dissent ledger
  - draft artifact passes artifact verification check

# Receipt Schema (Section 6)
receiptRequired: true
receiptFields:
  - receiptId
  - traceId
  - provider
  - model
  - phase
  - riskLevel
  - riskValid
  - approvalRequired
  - humanReviewRequired
  - workflowState
  - contractVersion
canReinject: false

# Failure Recovery (Section 7)
failureClasses:
  - provider_auth_error
  - context_validation_error
  - risk_gate_block
  - reviewer_gate_hold
  - timeout_transient
  - spec_validation_error
recoveryActions:
  provider_auth_error: escalate
  context_validation_error: hold
  risk_gate_block: hold
  reviewer_gate_hold: hold
  timeout_transient: retry
  spec_validation_error: hold
userVisibleMessage:
  provider_auth_error: "We could not connect to the AI provider. Please check your credentials."
  context_validation_error: "Your strategy analysis request is missing context. Please fill in the highlighted fields."
  risk_gate_block: "This analysis needs human review before we can continue. A reviewer has been notified."
  reviewer_gate_hold: "Waiting for reviewer approval on your strategy analysis. No action needed right now."
  timeout_transient: "The request took too long. We will try again automatically."
  spec_validation_error: "The workflow spec could not be validated. Please contact support."
```

## Claim Boundary

These example records are documentation artifacts only. They demonstrate
connector field usage and do not claim runtime workflow enforcement, external
skill ingestion, memory reinjection, hosted readiness, or production readiness.
All examples conform to contract version
`cvf.productSkillPackWorkflowConnector.lhw1.t1.v1`.
