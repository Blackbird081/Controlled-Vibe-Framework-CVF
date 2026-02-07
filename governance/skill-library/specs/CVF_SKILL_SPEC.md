# CVF SKILL SPECIFICATION
Canonical Definition of a CVF Skill

> **Version:** 1.0.0  
> **Status:** Active  
> **Related:** [v1.2 SKILL_CONTRACT_SPEC](../../../EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/SKILL_CONTRACT_SPEC.md)

## 1. Overview

This document defines the mandatory specification format
for any skill inside the Controlled Vibe Framework (CVF).

If a capability cannot be expressed using this spec,
it cannot exist as a CVF skill.

📁 **Example:** See [SK-001_CODE_REVIEW_ASSISTANT](./examples/SK-001_CODE_REVIEW_ASSISTANT.md)

---

## 2. Required Sections

### 2.1 Skill Identity
- Skill ID
- Skill Name
- Version
- Owner

### 2.2 Intent Layer
- Problem this skill addresses
- Decisions it supports (not replaces)

### 2.3 Capability Layer
- Explicit actions performed
- Inputs
- Outputs
- Execution constraints

### 2.4 Risk Profile
- Primary risks
- Secondary risks
- Failure handling
- Safe-stop behavior

### 2.5 Authority Mapping
- Allowed agent roles
- Allowed CVF phases
- Required preconditions
- Forbidden contexts

### 2.6 Audit & Traceability
- Required logs
- Decision references
- Output validation hooks

---

## 3. Skill Classification

Each skill MUST be classified as one of:

| Class | Description | Authority Control |
|-------|-------------|-------------------|
| **Assistive** | Read-only, no side effects | R0 - Minimal |
| **Advisory** | Suggestions, human confirmation | R1 - Low |
| **Executable** | Bounded actions, explicit invocation | R2 - Medium |
| **Analytical** | Multi-step analysis, may chain | R3 - High |

Higher classes imply stricter authority controls.

---

## 4. Enforcement Rule

Any invocation of a CVF skill that violates this spec
is considered a **governance failure**, not a technical error.

---

## 5. Related Documents

| Document | Purpose |
|----------|---------|
| [CVF_RISK_AUTHORITY_MAPPING](./CVF_RISK_AUTHORITY_MAPPING.md) | Risk level definitions |
| [SKILL_MAPPING_RECORD](./SKILL_MAPPING_RECORD.md) | Per-skill documentation template |
| [EXTERNAL_SKILL_INTAKE](./EXTERNAL_SKILL_INTAKE.md) | Import process |
| [v1.2 SKILL_CONTRACT_SPEC](../../../EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/SKILL_CONTRACT_SPEC.md) | Technical contract format |

---

## 6. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-07 | Initial specification |
