# SKILL SCHEMA MAPPING SPEC
# CVF → CVF-Toolkit Integration
# Status: Authoritative Mapping
# Toolkit Version: 1.0.0
# CVF Lock: See 00_CANONICAL_REFERENCE/cvf_version.lock
1. PURPOSE

This document defines:

The canonical Skill Contract used by CVF-Toolkit

How CVF Skill definitions map into executable Toolkit schema

How skills are registered, validated, versioned

How skills interact with risk, governance, and phases

This file is normative and binding.

2. CVF SKILL CONCEPT (CANONICAL INTERPRETATION)

From CVF:

A Skill is:

A controlled capability

With defined scope

With defined risk

With defined operator permissions

With defined lifecycle

Toolkit MUST treat Skill as the atomic execution unit.

No AI call may occur outside a registered Skill.

3. TOOLKIT CANONICAL SKILL CONTRACT

Every skill MUST conform to this schema:

{
  skillId: string,
  name: string,
  description: string,
  domain: string,
  version: string,
  owner: string,
  capabilityLevel: string,
  riskProfile: {
    baseRisk: R1 | R2 | R3 | R4,
    financialOverride?: boolean
  },
  requiredRole: string,
  allowedEnvironments: ["dev" | "staging" | "prod"],
  phaseRequirement: P0 | P1 | P2 | P3 | P4 | P5 | P6,
  requiresUAT: boolean,
  requiresApproval: boolean,
  freezeOnRelease: boolean,
  inputSchema: object,
  outputSchema: object,
  auditLevel: "standard" | "extended",
  status: "draft" | "validated" | "released" | "deprecated"
}

No field may be omitted.

4. CVF SKILL → TOOLKIT FIELD MAPPING

| CVF Concept          | Toolkit Field        |
| -------------------- | -------------------- |
| Skill ID             | skillId              |
| Capability tier      | capabilityLevel      |
| Risk classification  | riskProfile.baseRisk |
| Operator restriction | requiredRole         |
| Phase alignment      | phaseRequirement     |
| Approval rule        | requiresApproval     |
| UAT enforcement      | requiresUAT          |
| Freeze enforcement   | freezeOnRelease      |
| Skill lifecycle      | status               |

5. SKILL REGISTRY REQUIREMENTS

Implemented in:
skill.registry.ts

Registry responsibilities:

Register skill

Validate schema

Prevent duplicate skillId

Enforce version format (semver)

Prevent execution if status != released

Track skill ownership

Log registration event

6. SKILL VERSIONING RULE

Skill version MUST follow:

MAJOR.MINOR.PATCH

Rules:

MAJOR → Breaking change

MINOR → New feature, backward compatible

PATCH → Fix

If MAJOR changes:

Risk re-evaluation mandatory

UAT mandatory

Approval mandatory

Freeze required before release

7. SKILL LIFECYCLE

States:
| Status     | Description                |
| ---------- | -------------------------- |
| draft      | Not executable             |
| validated  | Passed internal validation |
| released   | Allowed in prod            |
| deprecated | Cannot be used             |

Transition rules:

draft → validated
validated → released
released → deprecated

No reverse transition allowed.

8. SKILL EXECUTION GATE

Before execution:

Toolkit MUST validate:

Skill exists

Skill status == released

Operator role >= requiredRole

Current phase >= phaseRequirement (P0–P6 state machine)

Environment allowed

Risk classification compatible

UAT passed if required

Freeze applied if required

Failure of any condition → reject execution.

9. SKILL CAPABILITY LEVELS

CapabilityLevel MUST align with CVF capability extension.

Toolkit standard levels:

| Level | Meaning       |
| ----- | ------------- |
| C1    | Informational |
| C2    | Analytical    |
| C3    | Structural    |
| C4    | Autonomous    |

Mapping rule:

C1 → max risk R1
C2 → max risk R2
C3 → max risk R3
C4 → max risk R4

Skill cannot declare capability lower than baseRisk implies.

10. INPUT / OUTPUT SCHEMA RULE

Each skill must define:

inputSchema
outputSchema

Toolkit enforcement:

Validate input before model invocation

Validate output after model invocation

Reject malformed output

Log validation errors

This ensures AI deterministic behavior control.

11. AI PROVIDER ABSTRACTION RULE

Skill cannot directly bind to a specific AI provider.

Instead:

Skill execution must call:

provider.interface.ts

Provider chosen at runtime via configuration.

Skill remains provider-agnostic.

12. EXTENSION RULE

Extensions (Financial, Dexter) must:

Register skills through skill.registry

Provide financial-specific risk override

Provide input/output schema definitions

Not bypass governance

Extensions may not:

Modify skill.registry logic

Alter core schema

Downgrade risk profile

13. FINANCIAL SKILL OVERRIDE RULE

Financial skills automatically enforce:

If:

domain == "financial"

Then:

Minimum capabilityLevel = C2

UAT required if risk >= R2

Extended audit if risk >= R3

Freeze mandatory if risk >= R3

14. AUDIT REQUIREMENTS

For each skill execution log:

{
  skillId,
  version,
  operatorId,
  riskLevel,
  phase,
  providerUsed,
  timestamp,
  executionId
}

If auditLevel == extended:

Include:

model version

token usage

cost estimate

approval chain

15. NON-NEGOTIABLE RULES

No AI call outside skill.

No skill execution without registry validation.

Skill version must be immutable once released.

Risk cannot be reduced in minor update.

Deprecated skill cannot be executed.

16. COMPLIANCE CHECKLIST

Toolkit compliant if:

✔ Canonical schema enforced
✔ Skill registry active
✔ Lifecycle transitions controlled
✔ Versioning enforced
✔ Risk-capability alignment active
✔ Financial override active
✔ Provider abstraction enforced

