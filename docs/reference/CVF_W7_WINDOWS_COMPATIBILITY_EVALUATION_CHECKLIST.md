# CVF W7 Windows Compatibility Evaluation Checklist

> **Document Type:** CANONICAL — CVF-NATIVE
> **Status:** W71-T1 native adoption complete 2026-04-13; implementation evidence confirmed: `WindowsCompatibilityEvaluationContract` + `WindowsCompatibilityEvaluationBatchContract` + `WindowsCompatibilityConsumerPipelineContract` in CPF; wired as optional Windows review step in cvf-web /prepare route
> **Source Quality:** internal_design_draft
> **Scope:** Windows-oriented compatibility review for external skill and W7 skill-like intake
> **Scope Boundary:** This checklist is an intake-stage evaluation aid. It does not replace existing risk/authority mapping, skill-governance fit checks, or provider/runtime evidence.

## 1. Purpose

This checklist evaluates whether a skill or skill-like candidate is ready for Windows-native execution contexts.

It exists to catch compatibility problems before runtime, not after.

## 2. Pipeline Position

This checklist is the third gate in the Windows-oriented intake path:

1. governance-fit and risk/authority mapping
2. existing skill-intake policy checks
3. Windows compatibility evaluation
4. final registry admission decision

This checklist must not override the earlier gates.

## 3. Evaluation Criteria

### 3.1 Environment compatibility

| Criterion | Status |
| --- | --- |
| Execution environment explicitly declared | ☐ |
| Compatible with Windows target | ☐ |
| PowerShell supported when Windows shell target applies | ☐ |
| Correct script format declared | ☐ |
| No undeclared Bash dependency | ☐ |

### 3.2 Execution readiness

| Criterion | Status |
| --- | --- |
| Commands validated for declared shell | ☐ |
| Unsupported operators removed or normalized | ☐ |
| Exit-code handling is explicit | ☐ |
| Execution remains deterministic within declared environment | ☐ |

### 3.3 Governance alignment

| Criterion | Status |
| --- | --- |
| Existing intake gates already passed | ☐ |
| W7 records can be generated without ambiguity | ☐ |
| Guard and policy consequences are compatible with target environment | ☐ |
| No sandbox overclaim is present | ☐ |

### 3.4 Security and isolation boundary

| Criterion | Status |
| --- | --- |
| Commands remain scope-bounded | ☐ |
| No unauthorized access path is implied | ☐ |
| Track 5 sandbox posture is respected | ☐ |

## 4. Score Bands

| Score | Classification | Intake Consequence |
| --- | --- | --- |
| 90-100 | Windows-Native | Eligible to proceed |
| 70-89 | Compatible | Eligible to proceed with recorded caveats |
| 50-69 | Requires Refactor | Hold for refactor before registry admission |
| <50 | Rejected for Windows Target | Do not admit as Windows-ready |

## 5. Interpretation Rule

This score evaluates platform execution fitness only.

It does not replace:

- governance fit
- domain/UAT review
- W7 validation
- final registry authority

## 6. Outputs

Checklist outputs may feed:

- Learning Plane evaluation notes
- Governance Layer compatibility signals
- registry-side compatibility metadata
- review packets for external skill normalization

## 7. Final Rule

If earlier governance gates fail, this checklist cannot rescue the candidate.

If earlier governance gates pass, this checklist determines whether the candidate is Windows-ready, Windows-compatible, or still needs refactor.
