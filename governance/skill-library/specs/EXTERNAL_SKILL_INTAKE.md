# EXTERNAL SKILL INTAKE

CVF Skill Intake as Risk & Authority Mapping

> **Version:** 1.1.0  
> **Status:** Active  
> **Related:** [v1.2 EXTERNAL_SKILL_INGESTION_RULES](../../../EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/EXTERNAL_SKILL_INGESTION_RULES.md)

## 1. Purpose

This document defines the intake process for external skills
by mapping them into existing CVF governance structures.

Intake assesses both fit within CVF risk and authority boundaries and the value of the proposed use over the agent's available native approach. Record the task, native baseline, and concrete reason or observed improvement. Admission requires proportionate value after setup, review, and maintenance costs plus a decision from the existing owner.

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

Risk and authority mapping answers these four questions:

1. What capability does the skill provide?
2. What is the PRIMARY risk level (R0–R3)?
3. What authority boundaries are acceptable?
4. Can the skill be constrained to fit those boundaries?

An unknown answer holds the proposed use. A source may stay as a discovery lead within existing authority. Assess uplift separately from this mapping. The same result reached natively at lower total cost is a reason to leave the candidate as a lead or decline it.

---

## 4. Mandatory Mapping Fields

Admission of an end-user skill or executable capability requires the applicable risk and authority mapping. A read-only R0 reference uses the compact owner record in the Governed Capability Intake Doctrine.

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

These outcomes describe boundary fit. The existing owner also records the value decision before promotion.

---

## 6. Documentation Artifact

Each admitted end-user skill or executable capability must keep its applicable linkage and mapping evidence. An existing owner record may be used when it holds these fields:

- Skill Mapping Record
- Explicit CVF linkage references
- Decision owner
- Timestamp

This artifact is required for:

- Audit
- UAT
- Future deprecation

For passive R0 material, use the existing receiving owner record with source, reuse rights, use limits, owner, and one observed use. See the [Governed Capability Intake Doctrine](../../../docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07.md#read-only-r0-references).

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

---

## 9. Operational Pipeline (Standardized)

This section defines the **repeatable, auditable** workflow
for ingesting external skills into CVF.

### 9.1 Source Intake (Discovery)

Record a small set of source leads for the task. Treat SkillsMP and other
directories as discovery sources. For each proposed use, assess source
identity, provenance, reuse rights, risk and benefit over the agent's
available native approach.

### 9.2 Candidate Admission

The existing CVF owner decides which named candidate or excerpt to admit for
the intended use. A shortlist grants no authority to create skill files,
register skills, create acceptance evidence, run code or publish.

The legacy entry points `registry/run_external_intake.py` and
`registry/convert_shortlist_to_cvf.py` now exit before making changes. Existing
shortlists and maps remain available as historical discovery records.

For an admitted end-user skill, apply the checks and derived outputs in
sections 9.3-9.6 that correspond to the approved changes. Generated UAT records
are inputs to verification. Record observed results before claiming acceptance.

---

### 9.3 Spec Validation (Mandatory)

```bash
python tools/skill-validation/validate_skills.py \
  --root EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS
```

**Requirement:** zero issues and warnings.

---

### 9.4 Governance Registry Update

```bash
python governance/skill-library/registry/generate_user_skills.py
python governance/skill-library/registry/validate_registry.py
```

**Requirement:** registry validation must pass.

---

### 9.5 Mapping Records & UAT (Autonomous)

```bash
python governance/skill-library/registry/generate_mapping_records.py
python governance/skill-library/uat/generate_uat_records.py
python governance/skill-library/uat/score_uat.py
```

**Requirement:** mapping records + domain-aware UAT records + UAT score reports created for every skill.

---

### 9.6 Acceptance Checklist

- [ ] Skill spec follows CVF template
- [ ] CVF Autonomous Extension block included
- [ ] Mapping record created or updated
- [ ] Risk / authority alignment confirmed
- [ ] UAT binding defined
- [ ] UAT record created
- [ ] Governance registry regenerated

If any item is missing → **intake is incomplete**.
