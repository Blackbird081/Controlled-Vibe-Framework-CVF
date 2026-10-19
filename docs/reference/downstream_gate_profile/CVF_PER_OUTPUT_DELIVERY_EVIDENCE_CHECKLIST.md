# CVF per-output delivery evidence checklist

Memory class: FULL_RECORD
Status: ACTIVE_REFERENCE
docType: reference
Date: 2026-10-13

EPISTEMIC_PROCESS_NA_WITH_REASON: normative evidence guidance; historical
source comparison and acceptance limits live in the linked learning record.

## Purpose

Provide a selected evidence checklist for multi-output delivery claims.

## Scope / Applies To

Use this companion to the [Build Learning Evidence Checklist](CVF_BUILD_LEARNING_EVIDENCE_CHECKLIST.md)
when a selected job sends to several outputs or retries an uncertain external
effect. It guides a reviewer assessing a delivery claim. It does not implement
transport, authorize a send, mandate this checklist for unrelated tasks or
claim exactly-once external delivery.

## Evidence Contract

Review each stable output identity separately. Record the frozen intended set,
whether a durable claim preceded the effect, explicit remote acceptance,
rejection or uncertainty, the committed outcome row and any checked result
marker write. A function return, aggregate "sent" count or successful
notification log cannot establish those facts for every output.

1. Classify explicit remote rejection as proven failure only if the transport
   contract supports it. Timeout, lost response, ambiguous SMTP DATA
   write/reply or failed outcome persistence are unknown. Do not silently
   classify them as unsent or retry-safe.
2. On reentry, skip outputs with a durable accepted result. Retry only outputs
   proven failed under the declared policy; hold unknown or crash-left sending
   outputs for reconciliation. A local idempotent claim does not prove an
   exactly-once external effect.
3. Exercise mixed output, all failed, concurrent claim, failure before effect,
   failure while persisting outcome and reentry. Check outbound call count,
   committed receipt/log rows, exact marker targets and affected-row counts.
4. Keep an accepted output's timestamp on reentry. Failed and unknown outputs
   must not inherit another output's marker. Bound caller lifetime through the
   outbound tail so a stalled transport cannot indefinitely retain ownership.

## Positive And Negative Review Examples

Positive: output A has explicit acceptance and a committed receipt/marker;
output B has a distinct identity and proven failure. Reentry skips A and may
retry B under the declared policy. Verify the durable rows after reentry.

Negative: two attempts include an ambiguous SMTP DATA result while an aggregate
job says "sent", or outcome persistence fails. Neither the aggregate nor the
transport return proves that output was delivered or safe to retry. Keep it
unresolved until evidence permits reconciliation.

## Owner

The [Customer Care seven-finding learning](../../reviews/learnings/CVF_CCMA_SEVEN_FINDING_DELIVERY_LEARNING_2026-10-13.md)
records the selected source/review basis and its limits. Existing terminal
write, provider attempt, cancellation and CAS owners retain their authority.
This companion is written guidance only; it has no machine or live-provider
proof and does not alter prior hash-bound checklist evidence.

## Claim Boundary

The checklist distinguishes evidence required for a delivery claim. It does
not prove that any output reached a customer, that a retry is safe in every
transport, or that the historical project tests were rerun by Core.
