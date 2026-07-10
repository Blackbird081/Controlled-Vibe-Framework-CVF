# CVF Workspace Paid User Safe Onboarding Flow

Memory class: ACTIVE_REFERENCE

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-09

## Scope / Applies To

This flow applies to a local workspace that should use the `paid-user-safe`
rule-pack profile for downstream paid, shared, or customer-facing project work.

It assumes the workspace root already has the public-safe wrapper set and an
operator-approved rule-pack source. It does not apply to the private
`operator-local` profile.

## Purpose

Provide a short setup and verification path so an agent or operator can make a
workspace useful for paid-user-safe work without importing private continuity
state or the full CVF provenance repository.

## Setup Flow

| Step | Command or action | Expected result |
|---|---|---|
| 1 | Run `Update-CVF-Workspace.ps1 -RunGate` from the workspace root. | Hidden public core is current and root wrappers are refreshed. |
| 2 | Run `Update-CVF-Workspace-RulePack.ps1 -ProfileName "paid-user-safe"` when the rule-pack wrapper exists. | `CVF_RULE_PACKS/ACTIVE_RULE_PACK.json` records `paid-user-safe`. |
| 3 | Read `WORKSPACE_RULES.md`, `CVF_WORKSPACE_USER_GUIDE.md`, `CVF_WORKSPACE_RULE_PACKS.md`, and the active manifest. | Operator and agent know the workspace boundary and active rule pack. |
| 4 | Create or refresh the downstream project with `New-CVF-Governed-Project.ps1`. | Project-local `AGENTS.md`, `.cvf/manifest.json`, and `.cvf/policy.json` exist. |
| 5 | Run `Run-CVF-NewProject-Enforcement.ps1`. | Workspace layout and project isolation pass. |
| 6 | Run the target project's own test, lint, doctor, or validation command. | Project-local behavior is verified separately from the workspace gate. |

## Agent Startup Checklist

Before editing a downstream project in a paid-user-safe workspace, an agent
should read:

1. `WORKSPACE_RULES.md`
2. `CVF_WORKSPACE_USER_GUIDE.md` or `CVF_WORKSPACE_HUONG_DAN_SU_DUNG.md`
3. `CVF_WORKSPACE_RULE_PACKS.md`
4. `CVF_RULE_PACKS/ACTIVE_RULE_PACK.json`
5. the target project's `AGENTS.md`

If the active profile is not `paid-user-safe`, the agent should either ask the
operator for the intended profile or continue only under the current profile's
documented boundary.

## Paid User Boundary

- Do not copy private operator continuity state into this workspace.
- Do not use the continuity allowance required by `operator-local`.
- Do not place downstream application code in `.Controlled-Vibe-Framework-CVF/`.
- Do not claim hosted, production, legal, medical, financial, or live-provider
  readiness from local workspace onboarding.
- Do not treat the rule pack as a replacement for project-local tests.
- Do not expose private source mirrors, private generated output, or local
  live-key files to downstream users.

## Completion Note Shape

Use this compact completion note after onboarding or refreshing a paid-user-safe
workspace:

```text
Workspace: <path>
Active profile: paid-user-safe
Core status: <hidden core commit or freshness note>
Project: <project name or N/A>
Verification: <workspace gate result plus project-local command/result>
Boundary: no private continuity state copied; no production/live/provider claim
Next: <none or exact next action>
```

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer |
| Provider or surface | local provenance workspace |
| Session or invocation | R77 paid-user-safe onboarding flow reference authoring |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, apply_patch, git, governance gates |
| Target paths | `docs/reference/CVF_WORKSPACE_PAID_USER_SAFE_ONBOARDING_FLOW.md`; workspace profile/catalog and wrapper guide sources |
| Allowed scope source | operator agreed to continue with the next tranche after R76 workspace profile tiers closure |
| Before status evidence | R76 defined `paid-user-safe`, but no dedicated onboarding flow reference existed |
| After status evidence | this file defines setup, startup, boundary, and completion-note guidance for the profile |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | reference, guide, and local workspace productization only |
| Claim boundary | no checker/Fast Lane/runtime/provider/live/public-production claim |
| Agent type | reviewer/closer |
| Invocation ID | `r77-paid-user-safe-onboarding-flow-2026-07-09` |
| Expected manifest | `docs/reference/CVF_WORKSPACE_PAID_USER_SAFE_ONBOARDING_FLOW.md`; `docs/reference/CVF_WORKSPACE_PAID_USER_AUTHORING_GUIDE.md`; `docs/reference/CVF_WORKSPACE_PROFILE_TIERS.md`; `docs/reference/CVF_WORKSPACE_RULES.md`; `workspace_overlay_catalog.json`; `scripts/install_cvf_workspace_root_wrappers_public.ps1` |
| Actual changed set | `docs/reference/CVF_WORKSPACE_PAID_USER_SAFE_ONBOARDING_FLOW.md`; `docs/reference/CVF_WORKSPACE_PAID_USER_AUTHORING_GUIDE.md`; `docs/reference/CVF_WORKSPACE_PROFILE_TIERS.md`; `docs/reference/CVF_WORKSPACE_RULES.md`; `workspace_overlay_catalog.json`; `scripts/install_cvf_workspace_root_wrappers_public.ps1` |
| Manifest delta | MATCH |

## Claim Boundary

This flow provides paid-user-safe workspace onboarding guidance only. It does
not import private continuity state, certify a downstream project, implement
runtime behavior, run provider proof, claim hosted or production readiness, or
replace project-local tests.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this reference is currently distributed through local workspace
rule-pack selection. Public-safe export requires a dedicated public-sync
decision if the operator wants this exact reference in the public repository.
