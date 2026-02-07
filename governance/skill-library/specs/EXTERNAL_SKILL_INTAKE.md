# EXTERNAL SKILL INTAKE
CVF Skill Intake as Risk & Authority Mapping

> **Version:** 1.0.0  
> **Status:** Active  
> **Related:** [v1.2 EXTERNAL_SKILL_INGESTION_RULES](../../../EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/EXTERNAL_SKILL_INGESTION_RULES.md)

## 1. Purpose

This document defines the intake process for external skills
by mapping them into existing CVF governance structures.

Intake is NOT an evaluation of usefulness.
It is a governance alignment exercise.

---

## 2. Intake Prerequisite

An external skill may only enter intake AFTER:
- CVF Risk Levels are defined
- CVF Authority Model exists
- CVF Skill ↔ Risk ↔ Authority Linkage is established

Intake does not modify CVF.
The skill must adapt or be rejected.

---

## 3. Intake as Mapping (Not Review)

Each intake answers exactly four questions:

1. What capability does the skill provide?
2. What is the PRIMARY risk level (R0–R3)?
3. What authority boundaries are acceptable?
4. Can the skill be constrained to fit those boundaries?

If any answer is “unknown” → intake fails.

---

## 4. Mandatory Mapping Fields

Each external skill intake MUST produce the following mapping:

### 4.1 Capability Extraction
- Core function (one sentence)
- Required inputs
- Produced outputs
- Execution model (sync / async / autonomous)

### 4.2 Risk Mapping
- Assigned CVF Risk Level (R0–R3)
- Justification
- Worst-case failure scenario
- Blast radius estimate

### 4.3 Authority Mapping
- Allowed agent roles
- Allowed CVF phases
- Decision scope influence
- Autonomy constraints

All mappings MUST comply with
`CVF_SKILL_RISK_AUTHORITY_LINK.md`.

---

## 5. Fit Decision (Deterministic)

Based on mapping results, the outcome is one of:

- ❌ Reject  
  Cannot be safely mapped to CVF constraints.

- ⚠️ Adapt Required  
  Capability acceptable only after restriction.

- ✅ Accept (Restricted by Design)  
  Directly fits CVF boundaries.

No other outcomes are allowed.

---

## 6. Documentation Artifact

Each intake MUST generate:
- Skill Mapping Record
- Explicit CVF linkage references
- Decision owner
- Timestamp

This artifact is required for:
- Audit
- UAT
- Future deprecation

---

## 7. Non-Negotiable Rules

- Popularity is irrelevant
- Author reputation is irrelevant
- Technical brilliance does not override governance
- Undefined authority equals forbidden usage

---

## 8. Design Intent

Intake exists to protect CVF from skill-driven drift.

Skills are temporary.
CVF authority is permanent.
