# CVF ERH-SAF1 Safety Workflow Chain

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-04

ERH_SAF1_DECISION: ACTIVE

GC-018: `docs/baselines/CVF_GC018_ERH_SAF1_SAFETY_WORKFLOW_CHAIN_2026-06-04.md`

## Scope / Target / Owner Boundary

Applies to: `/api/execute` POST route in
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`.

Owner surface: `src/lib/safety-workflow-chain.ts` (SAF1 helper),
`src/app/api/execute/route.ts` (wiring).

Out of scope: ML classifiers, provider routing, auth runtime, package manifests,
public-sync, production or hosted security certification.

## Purpose

Document the ERH-SAF1 runtime safety workflow chain implemented in
`/api/execute`. SAF1 converts the source-verified safety-layer gap from
ERH-RS1 into a deterministic severity-classified safety screen that runs
after DLP and before provider execution.

## Decision / Baseline / Proposed Tranche

Decision: `ACTIVE` — SAF1 safety workflow chain wired and machine-checked.

Baseline:

- ERH-RS1 confirmed `safety-status.ts` severity-classified patterns were not
  wired to the execute route.
- SAF1 created a server-safe helper (`safety-workflow-chain.ts`) with the same
  11 patterns re-owned outside the `'use client'` scope.
- Execute route now runs: DLP → SAF1 → legacy safety → quota → guard pipeline
  → provider.

## Workflow Chain Steps

| Step | Component | Action | Evidence |
| --- | --- | --- | --- |
| 1 | `applyDLPFilter` | redact PII/sensitive content; emit `DLP_REDACTION_APPLIED` audit event if triggered | `dlp-filter.ts` + route.ts line 240 |
| 2 | `runSafetyWorkflowChain` (SAF1) | severity-classified screen; emit `SAFETY_WORKFLOW_CHAIN_TRIGGERED` audit event if any threat detected; block on CRITICAL/BLOCK-action patterns | `safety-workflow-chain.ts` + route.ts |
| 3 | `applySafetyFilters` (legacy) | legacy 4-pattern backward-compatible screen | `safety.ts` + route.ts |
| 4 | quota, guard pipeline, provider | normal execution path | route.ts |

## SAF1 Pattern Coverage

| Pattern label | Severity | Action | Description |
| --- | --- | --- | --- |
| `governance-disable` | CRITICAL | BLOCK | "disable governance" variants |
| `policy-override` | CRITICAL | BLOCK | "override policy" variants |
| `bypass-attempt` | CRITICAL | BLOCK | "bypass security/governance/policy" variants |
| `unrestricted-mode` | CRITICAL | BLOCK | "act as unrestricted" variants |
| `instruction-override` | CRITICAL | BLOCK | "ignore previous instructions" variants |
| `risk-manipulation` | HIGH | BLOCK | "set risk score/level to 0" variants |
| `role-injection` | HIGH | STRIP | "change role to" variants |
| `system-prompt-injection` | HIGH | STRIP | "system: " prefix injection |
| `context-wipe` | MEDIUM | STRIP | "forget everything/all/context" variants |
| `identity-override` | MEDIUM | LOG | "you are now" variants |
| `persona-injection` | MEDIUM | LOG | "pretend to be/you are" variants |

## Audit Event

When any SAF1 pattern fires, the route emits `SAFETY_WORKFLOW_CHAIN_TRIGGERED`
with:

- `blocked`: true/false
- `threatCount`: number of matched patterns
- `highestSeverity`: CRITICAL | HIGH | MEDIUM | null
- `patterns`: array of pattern labels (no raw prompt text)
- `actions`: deduplicated array of actions taken

Raw prompt text is never stored in the audit payload.

## Claim Boundary

SAF1 is deterministic regex-only coverage. It does not claim:

- ML-based jailbreak detection;
- comprehensive adversarial prompt coverage;
- production security hardening certification;
- complete remediation of the §4.4 safety weakness from the external review;
- public readiness or hosted security readiness.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| Richer safety patterns existed only in client-side UI helper | ROUTE_COVERAGE_GAP | RUNTIME_BEHAVIOR_LEARNING | MACHINE_CHECK_ADDED | SAF1 checker enforces route wiring in hook/autorun |
| Safety layer documented as thin relative to claim posture | RUNTIME_SIGNAL_GAP | RUNTIME_BEHAVIOR_LEARNING | WORKFLOW_CHAIN_ADDED | SAF1 chain active; SAF2 decision recorded |
| Runtime/provider/cost learning lane | N/A_WITH_REASON | N/A_WITH_REASON | N/A_WITH_REASON | SAF1 is deterministic pattern change; no live provider cost expansion |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private runtime hardening reference. Public-facing safety claim update
requires a separate public-sync work order.
