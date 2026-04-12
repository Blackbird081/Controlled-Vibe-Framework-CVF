# CVF W7 Execution Environment Normalization Policy

> **Document Type:** INTERNAL DESIGN DRAFT
> **Status:** Synthesized from curated `Windows_Skill_Normalization` materials on 2026-04-12
> **Source Quality:** internal_design_draft
> **Scope:** execution-environment declaration and normalization for W7 skill-like intake
> **Scope Boundary:** This policy augments W7 intake and skill-governance review. It does not modify sandbox posture, provider evaluation, or the active PVV API-key evidence chain.

## 1. Purpose

This document defines how CVF should normalize environment-dependent external skills and skill-like assets before they move deeper into the W7 path.

The goal is to prevent avoidable runtime mismatch such as:

- Bash-oriented instructions entering a Windows PowerShell target without declaration
- shell-dependent code blocks being treated as environment-neutral
- compatibility issues being discovered only after runtime execution is already attempted

## 2. Core Principle

Environment-dependent material must declare its execution environment before CVF treats it as normalization-ready.

CVF remains the root.
Environment metadata does not authorize runtime execution by itself.

## 3. Execution Environment Profile

Use the following bounded profile when environment declaration is needed:

```yaml
execution_environment:
  os: windows|linux|macos
  shell: powershell|bash|zsh|sh
  shell_version: string
  script_type: ps1|sh|zsh|cmd|bat
  compatibility: native|cross-platform
```

Notes:

- `native` means the asset is primarily authored for one environment
- `cross-platform` means the asset explicitly supports more than one execution environment

## 4. Normalization Rules

### 4.1 Declaration rule

If a `W7SkillAsset` candidate contains executable code blocks, the intake profile must carry `execution_environment`.

### 4.2 No implicit portability rule

If a skill depends on shell-specific commands or script formats, CVF must not assume that the skill is portable.

### 4.3 Compatibility-before-gating rule

Compatibility evaluation must occur before Policy Gate consequences are applied to execution-target mismatch.

### 4.4 No doctrine-by-blacklist rule

Examples such as `Reject-Bash-On-Windows` may illustrate policy intent, but they are not final guard doctrine.

## 5. Three-Step Enforcement Model

Environment enforcement must follow exactly this order:

1. declare environment
2. evaluate compatibility
3. apply policy/gate consequence

This means:

- declaration happens at intake
- compatibility is evaluated before runtime
- Policy Gate or related governance surfaces decide whether mismatch is allowed, blocked, or requires refactor

## 6. Relationship To Existing Governance

This policy augments but does not replace:

- `governance/skill-library/specs/EXTERNAL_SKILL_INTAKE.md`
- `governance/toolkit/05_OPERATION/SKILL_INTAKE_GOVERNANCE.md`
- `docs/reference/CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md`

## 7. What This Policy Does Not Do

This policy does not:

- change Track 5 sandbox posture
- authorize Windows Sandbox, Docker Windows Containers, or WSL
- redefine CVF-wide command runtime doctrine
- replace provider-quality evidence

## 8. Final Rule

Execution-environment normalization exists to reduce avoidable runtime mismatch.

It improves intake quality by declaration and evaluation, not by silent runtime guessing.
