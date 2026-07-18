# CVF ERH-SAF2 Output Safety And Regression Corpus

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-05

ERH_SAF2_DECISION: ACCEPT_BOUNDED

GC-018: `docs/baselines/CVF_GC018_ERH_SAF2_OUTPUT_SAFETY_AND_REGRESSION_CORPUS_2026-06-05.md`

Work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_ERH_SAF2_OUTPUT_SAFETY_AND_REGRESSION_CORPUS_FOR_CLAUDE_2026-06-05.md`

## Purpose

Records the SAF2 output safety workflow chain: governance-specific output
pattern detection, `OUTPUT_SAFETY_TRIGGERED` audit event wiring, and bounded
adversarial regression corpus for the SAF1 input chain.

## Scope

SAF2 implements two of the three SAF2 candidates from the SAF1 completion:

1. **Output safety audit event**: `OUTPUT_SAFETY_TRIGGERED` emitted once on
   the first `UNSAFE_CONTENT` detection in an AI response, including retry
   output, before retry exhaustion.
2. **Adversarial regression corpus**: bounded test file with ≥10 entries
   covering CRITICAL, HIGH, and MEDIUM SAF1 input patterns, plus SAF2 output
   governance pattern entries.

The third candidate (safety coverage drift checker — SAF3) is deferred; SAF3
decision is recorded in the completion review.

## Components

| Component | Path | Description |
| --- | --- | --- |
| Governance output patterns | `cvf-web/src/lib/output-validator.ts` | `GOVERNANCE_OUTPUT_PATTERNS` array (8 patterns) + `isGovernanceOutputUnsafe` helper |
| Output safety audit event | `cvf-web/src/app/api/execute/route.ts` | `OUTPUT_SAFETY_TRIGGERED` first-detection helper before retry exhaustion |
| Regression corpus | `cvf-web/src/lib/safety-workflow-chain.regression.test.ts` | 10 SAF1 + 4 SAF2 output entries |
| Machine checker | `governance/compat/check_erh_output_safety_workflow_chain.py` | Enforces SAF2 wiring markers |
| Checker tests | `governance/compat/test_check_erh_output_safety_workflow_chain.py` | Pattern unit tests + live integration test |

## Governance Output Patterns

The following patterns are added to `output-validator.ts` as
`GOVERNANCE_OUTPUT_PATTERNS`. They detect AI responses echoing
governance-bypass instructions, indicating potential injection success.

| # | Pattern | Detects |
| --- | --- | --- |
| 1 | `disable\s+governance` | AI output instructing governance disable |
| 2 | `override\s+policy` | AI output instructing policy override |
| 3 | `bypass\s+(security\|governance\|policy)` | AI output instructing bypass |
| 4 | `I\s+(am\s+)?(now\s+)?unrestricted` | AI claiming unrestricted mode |
| 5 | `operating\s+without\s+(all\s+)?(restrictions\|governance\|policies)` | AI claiming no governance |
| 6 | `ignore\s+(all\s+)?previous\s+instructions?` | AI instructing instruction override |
| 7 | `act\s+as\s+if\s+(you\s+have\s+)?(no\s+)?restrictions?` | AI instructing no restrictions |
| 8 | `disable\s+(all\s+)?safety` | AI output instructing safety disable |

## Audit Event: OUTPUT_SAFETY_TRIGGERED

Location in route: `emitOutputSafetyTriggered()` helper called after initial
`validateOutput` and after retry-loop `validateOutput`.

Payload fields (no raw AI output text, no raw user prompt, no secrets):

| Field | Value |
| --- | --- |
| `eventType` | `OUTPUT_SAFETY_TRIGGERED` |
| `action` | `DETECT_UNSAFE_OUTPUT` |
| `outcome` | `DETECTED` |
| `payload.issues` | list of `ValidationIssue` labels |
| `payload.issueCount` | count of issues |
| `payload.provider` | routed provider name |
| `payload.model` | model identifier |

Timing guarantee: fires once on first detection, before
`OUTPUT_VALIDATION_EXHAUSTED` (which fires only after retry budget is
exhausted). This ensures the audit trail records the detection event
independently of retry outcome.

## Claim Boundary

SAF2 claims only:
- bounded regex-only governance output pattern detection;
- `OUTPUT_SAFETY_TRIGGERED` audit event wired before retry exhaustion;
- adversarial regression corpus with local test evidence.

SAF2 does not claim: ML DLP, comprehensive output safety coverage,
production security readiness, complete jailbreak protection, or complete
external-review remediation.

## Machine Checker

`governance/compat/check_erh_output_safety_workflow_chain.py --enforce`

Checks verified:
1. `ERH_SAF2_MARKER` present in `output-validator.ts`
2. `GOVERNANCE_OUTPUT_PATTERNS` exported
3. `isGovernanceOutputUnsafe` exported
4. `OUTPUT_SAFETY_TRIGGERED` present in `route.ts`
5. `OUTPUT_SAFETY_TRIGGERED` position before `OUTPUT_VALIDATION_EXHAUSTED`
6. first-detection emit helper and guard present, with initial and retry calls
7. Regression corpus test file exists with `ERH_SAF2_REGRESSION_CORPUS_MARKER`
8. Workflow-chain reference doc exists with `ERH_SAF2_DECISION` marker
9. Ledger doc exists with `ERH_SAF2_LEDGER_VERSION` marker

## GC-052 Interlock

Connection ID: `erh-saf2-output-safety-workflow-chain`

Registry: `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json`
