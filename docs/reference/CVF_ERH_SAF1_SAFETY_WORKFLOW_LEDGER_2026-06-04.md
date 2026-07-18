# CVF ERH-SAF1 Safety Workflow Ledger

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-04

ERH_SAF1_LEDGER_VERSION: 2026-06-04

GC-018: `docs/baselines/CVF_GC018_ERH_SAF1_SAFETY_WORKFLOW_CHAIN_2026-06-04.md`

## Scope / Target / Owner Boundary

Applies to: ERH-SAF1 safety workflow chain evidence for
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute`.

Owner surface: `safety-workflow-chain.ts` helper and route.ts SAF1 wiring.

Out of scope: ML DLP, production security claims, public export.

## Purpose

Machine-readable evidence ledger for the ERH-SAF1 safety workflow chain.
Records the before/after safety surface, pattern coverage, and claim boundary.

## Decision / Baseline / Proposed Tranche

Decision: `ACTIVE` — SAF1 ledger records wired state.

## Before SAF1

| Component | State |
| --- | --- |
| Execute-route safety call | `applySafetyFilters` from `safety.ts` (4 patterns: 4 injection + 4 PII) |
| Severity classification | none — boolean blocked only |
| Audit event on safety block | none |
| Server-safe severity engine | not wired (existed only in `'use client'` safety-status.ts) |

## After SAF1

| Component | State |
| --- | --- |
| Execute-route safety call order | DLP → `runSafetyWorkflowChain` (SAF1) → `applySafetyFilters` (legacy) |
| SAF1 pattern count | 11 (5 CRITICAL, 3 HIGH, 3 MEDIUM) |
| Severity classification | CRITICAL / HIGH / MEDIUM per pattern |
| Action model | BLOCK / STRIP / LOG per pattern |
| Audit event | `SAFETY_WORKFLOW_CHAIN_TRIGGERED` — severity, action, pattern labels; no raw prompt |
| Server-safe helper | `safety-workflow-chain.ts` — no `'use client'`; plain TypeScript module |
| Legacy compatibility | `applySafetyFilters` still called after SAF1 sanitized prompt |

## Pattern Ledger

| Label | Severity | Action | Regex summary |
| --- | --- | --- | --- |
| `governance-disable` | CRITICAL | BLOCK | `/disable\s+governance/gi` |
| `policy-override` | CRITICAL | BLOCK | `/override\s+policy/gi` |
| `bypass-attempt` | CRITICAL | BLOCK | `/bypass\s+(security\|governance\|policy)/gi` |
| `unrestricted-mode` | CRITICAL | BLOCK | `/act\s+as\s+(un)?restricted/gi` |
| `instruction-override` | CRITICAL | BLOCK | `/ignore\s+(all\s+)?previous\s+instruction/gi` |
| `risk-manipulation` | HIGH | BLOCK | `/set\s+risk\s*(score\|level)?\s*to\s*0/gi` |
| `role-injection` | HIGH | STRIP | `/change\s+role\s+to/gi` |
| `system-prompt-injection` | HIGH | STRIP | `/system\s*:\s*/gi` |
| `context-wipe` | MEDIUM | STRIP | `/forget\s+(everything\|all\|context)/gi` |
| `identity-override` | MEDIUM | LOG | `/you\s+are\s+now/gi` |
| `persona-injection` | MEDIUM | LOG | `/pretend\s+(to\s+be\|you\s+are)/gi` |

## Source Evidence

| Artifact | Path | Evidence |
| --- | --- | --- |
| SAF1 helper | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/safety-workflow-chain.ts` | created; contains `ERH_SAF1_MARKER` |
| Route wiring | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` | imports `runSafetyWorkflowChain`; calls after DLP |
| Helper tests | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/safety-workflow-chain.test.ts` | 16/16 PASS |
| Route test (injection) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.test.ts` | 31/31 PASS including injection block |
| Checker | `governance/compat/check_erh_safety_workflow_chain.py` | PASS; enforces DLP -> SAF1 -> legacy safety -> provider marker order |
| Checker tests | `governance/compat/test_check_erh_safety_workflow_chain.py` | 13/13 PASS |

## Claim Boundary

This ledger records SAF1 wired state only. It does not claim ML DLP,
comprehensive jailbreak coverage, production security certification, or public
readiness.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| Safety surface expanded from 4 to 11 patterns with severity model | RUNTIME_SIGNAL_GAP | RUNTIME_BEHAVIOR_LEARNING | MACHINE_CHECK_ADDED | checker enforces route wiring permanence |
| Runtime/provider/cost learning lane | N/A_WITH_REASON | N/A_WITH_REASON | N/A_WITH_REASON | deterministic change; no live provider cost expansion |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance evidence ledger.
