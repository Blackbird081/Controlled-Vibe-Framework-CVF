# GOVERNANCE MAPPING SPEC
# CVF → CVF-Toolkit Core Integration
# Status: Authoritative Mapping
# Toolkit Version: 1.0.0
# CVF Lock: See 00_CANONICAL_REFERENCE/cvf_version.lock
1. PURPOSE

This document defines how CVF governance principles, structures, and enforcement rules are mapped into the CVF-Toolkit execution engine.

This file is:

Normative

Binding

Required for all implementations

AI-readable

Developer-enforceable

No part of CVF governance logic is redefined here.
This file only maps enforcement into Toolkit components.

2. GOVERNANCE PHILOSOPHY (From CVF Core)

CVF Governance is built on:

Phase-Based Control

Risk-Aware Execution

Operator Accountability

Controlled Change

UAT Before Release

Auditability

Freeze Before Production

Toolkit MUST enforce all 7 pillars.

3. GOVERNANCE ENFORCEMENT LAYERS

Governance in Toolkit is enforced at 4 levels:

| Level | Layer            | Responsibility                     |
| ----- | ---------------- | ---------------------------------- |
| L1    | Request Entry    | Validate intent, risk, permissions |
| L2    | Phase Controller | Enforce phase transitions          |
| L3    | Skill Registry   | Validate capability & scope        |
| L4    | Audit & Logging  | Record immutable execution trace   |

4. CVF GOVERNANCE → TOOLKIT COMPONENT MAPPING
4.1 Phase-Based Control
CVF Concept:

Work must move through 7 structured phases:
P0_DESIGN → P1_BUILD → P2_INTERNAL_VALIDATION → P3_UAT → P4_APPROVED → P5_PRODUCTION → P6_FROZEN

Toolkit Implementation:

Mapped to:
phase.controller.ts

Responsibilities:

Enforce sequential phase transitions (P0→P1→P2→P3→P4→P5→P6)

Prevent skipping phases

Validate preconditions (UAT at P3, approval at P4, freeze at P6)

Reject illegal transitions

Emit audit events

Only rollback allowed: P6 → P0 (formal rollback)

Phase state machine is mandatory.

4.2 Risk Classification
CVF Concept:

Every operation must be risk-classified before execution.

Toolkit Implementation:

Mapped to:

risk.classifier.ts

Responsibilities:

Classify request risk level

Map to required approval level

Determine required phase strictness

Determine UAT requirements

Risk must be computed BEFORE model invocation.

4.3 Operator Accountability
CVF Concept:

Operators must have defined roles and permissions.

Toolkit Implementation:

Mapped to:

operator.policy.ts
governance.guard.ts

Responsibilities:

Validate operator role

Validate permissions

Enforce role-based restrictions

Prevent unauthorized execution

Operator validation is required for:

Skill invocation

Phase transition

Change approval

Production deployment

4.4 Controlled Change
CVF Concept:

All system changes must go through formal change control.

Toolkit Implementation:

Mapped to:

cvf.change.adapter.ts
change.controller.ts

Responsibilities:

Log change requests

Require approval for high-risk changes

Prevent direct modification

Record approval trace

Enforce freeze period

No direct mutation allowed.

4.5 UAT Enforcement
CVF Concept:

No release without UAT.

Toolkit Implementation:

Mapped to:

uat.runner.ts
cvf.uat.adapter.ts

Responsibilities:

Run defined UAT scenarios

Validate against rubric

Generate compliance report

Block release if fail

UAT is mandatory for:

New skill

Modified skill

Risk profile change

Financial calculation change

4.6 Audit & Traceability
CVF Concept:

Every action must be traceable.

Toolkit Implementation:

Mapped to:

audit.logger.ts

Responsibilities:

Log all phase transitions

Log skill execution

Log risk classification

Log operator decision

Log model invocation

Log change approvals

Logs must be immutable.

4.7 Freeze Before Production
CVF Concept:

System must freeze before production release.

Toolkit Implementation:

Mapped to:

06_VERSIONING_AND_FREEZE/freeze.protocol.md

Responsibilities:

Prevent runtime logic modification

Lock model version

Lock skill definitions

Lock risk thresholds

Lock extension mapping

Release cannot occur if freeze not applied.

5. GOVERNANCE EXECUTION FLOW

User Request
   ↓
Risk Classification
   ↓
Operator Validation
   ↓
Skill Registry Validation
   ↓
Phase Controller Check (P0–P6 state machine)
   ↓
Model Invocation (if allowed)
   ↓
Audit Logging
   ↓
UAT Gate (P3, if applicable)
   ↓
Approval Gate (P4, if required)
   ↓
Production / Reject (P5)
   ↓
Freeze (P6, if risk >= R3)

Any failure at any stage:

→ Abort execution
→ Log reason
→ Return structured rejection

6. NON-NEGOTIABLE RULES

Governance MUST execute before AI call.

Governance MUST execute before financial calculation.

Governance MUST execute before report generation.

Governance MUST execute before deployment.

Governance MUST NOT be bypassable.

No debug mode can skip governance.

Adapter layer cannot override governance decisions.

7. EXTENSION GOVERNANCE RULE

Extensions (e.g., Financial, Dexter) must:

Register skills via skill.registry

Register risk profile via risk.classifier

Use phase.controller

Use governance.guard

Extensions may not:

Call AI provider directly

Modify operator roles

Modify core risk thresholds

Modify phase rules

8. COMPLIANCE REQUIREMENT

Toolkit is compliant with CVF governance if:

✔ Phase enforcement active
✔ Risk classification active
✔ Operator validation active
✔ Change control active
✔ UAT gate active
✔ Audit logging active
✔ Freeze protocol active

Failure of any of the above → Non-compliant.

9. NEXT IMPLEMENTATION FILES

Based on this mapping, next files to define:

risk.phase.mapping.md

skill.schema.mapping.md

change.control.mapping.md

agent.lifecycle.mapping.md

These will define exact structural contracts.

PHASE 2 STATUS

✔ Governance philosophy aligned
✔ Enforcement mapping defined
✔ Component responsibility clear
✔ Non-bypassable rules declared
