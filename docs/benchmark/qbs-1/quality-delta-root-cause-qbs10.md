# QBS-10 Quality Delta Root-Cause And Remediation

Status: `QBS10_REMEDIATION_COMPLETE_NO_NEW_SCORE`

Date: 2026-05-10

## Scope

QBS-10 analyzes why the QBS-9 model-assisted reviewer run did not support an
L4/L5 public quality claim. It implements a bounded remediation for the largest
observed quality failure mode, but it does not publish a new benchmark score.

QBS-9 remains the latest scored artifact:

- Run: `qbs1-powered-single-provider-20260510-alibaba-r5`
- Provider/model: Alibaba/DashScope `qwen-turbo`
- Reviewer models: OpenAI `gpt-4o-mini` and DeepSeek `deepseek-chat`
- Agreement: PASS
- Claim result: no public QBS claim

## QBS-9 Finding

The governed `CFG-B` lane passed hard governance gates, but scored below the
direct baselines on user-facing output quality:

| Comparison | QBS-9 result |
|---|---|
| `CFG-B` vs `CFG-A1` median normalized quality delta | `-0.25` |
| Bootstrap 95% CI | `[-0.3125, -0.25]` |
| `CFG-B` vs `CFG-A0` median normalized quality delta | `-0.25` |
| `CFG-B` vs `CFG-A1` median heavy/reject improvement | `-1.0` |

The largest negative deltas clustered in the high-risk safety families:

| Family | Median `CFG-B - CFG-A1` delta |
|---|---:|
| `high_risk_security_secrets` | `-0.875` |
| `bypass_adversarial_governance` | `-0.875` |
| `ambiguous_noncoder_requests` | `-0.375` |

## Root Cause

The primary failure was not incorrect governance classification. It was a
user-facing answer quality gap on non-ALLOW outcomes:

- `BLOCK` responses often returned a correct evidence receipt and error, but
  no usable `output` text for the reviewer bundle.
- `CLARIFY` front-door responses returned only a short generic question.
- `NEEDS_APPROVAL` responses exposed status metadata, but did not provide a
  concise approval path and safe fallback guidance in the primary output field.

This made correct governance decisions look like empty or low-effort answers
under the public scoring rubric. Reviewers penalized those outputs for missing
refusal language, missing safe alternatives, and missing actionable next steps.

## Remediation

QBS-10 adds deterministic user-facing output for governed stop states without
changing the underlying decision gates:

- `BLOCK`: returns a plain-language refusal, reason, and safe next steps.
- `CLARIFY`: lists the missing details needed before governed execution.
- `NEEDS_APPROVAL`: returns approval-required guidance, approval id, and a
  lower-risk restatement path.
- Front-door clarification: returns a fuller clarification packet with a
  question, option set, and explanation that CVF should not guess the route.

The remediation is intentionally deterministic. It does not call a provider,
does not loosen policy, and does not convert blocked work into allowed work.

## Validation

Targeted QBS hard-gate remediation tests were added for:

- safety-filter block output
- enforcement block output
- required-input clarification output
- approval-required output
- front-door weak-confidence clarification output

Passing targeted command:

```bash
npm run test:run -- src/app/api/execute/route.qbs-hard-gates.test.ts src/app/api/qbs/front-door-clarification/route.test.ts src/lib/enforcement.qbs-hard-gates.test.ts src/lib/intent-router.qbs-f7.test.ts
```

Result: `12 passed / 0 failed`.

## Claim Boundary

QBS-10 does not claim that CVF now beats a direct model baseline. It only fixes
the identified non-ALLOW output quality defect that caused QBS-9 to fail the
quality claim threshold.

A future QBS-11 or later run must be separately pre-registered, executed,
scored, and agreement-checked before any public quality score or L4/L5 claim is
made.
