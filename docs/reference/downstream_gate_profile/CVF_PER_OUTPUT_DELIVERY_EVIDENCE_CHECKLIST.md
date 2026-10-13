# CVF Per-Output Delivery Evidence Checklist

Memory class: FULL_RECORD
Status: ACTIVE_REFERENCE
docType: reference
Date: 2026-10-13

## Purpose

Guide evidence declarations and reviews when one job delivers to multiple
outputs or re-enters after an uncertain external effect.

## Scope / Applies To

Use this companion to the [Build Learning Evidence Checklist](CVF_BUILD_LEARNING_EVIDENCE_CHECKLIST.md)
when a delivery claim spans distinct outputs or a retry follows an uncertain
result. It is review guidance. It does not implement transport, authorize sends,
or claim exactly-once external delivery.

## Evidence Contract

Review each stable output identity separately. Record the frozen intended output
set, whether a durable claim preceded the effect, and the remote result (accepted,
rejected, or uncertain), committed outcome, and checked result marker. An aggregate
count, function return, or notification log alone does not establish each
output's result.

1. Treat explicit remote rejection as proven failure only when the transport
   contract supports that conclusion. A timeout, lost response, ambiguous
   protocol result, or failed outcome write is unknown; do not infer that the
   output was not delivered or is safe to retry.
2. On reentry, skip an output with a durable accepted result. Retry a proven
   failure only under the declared policy. Hold unknown or crash-left in-flight
   results for reconciliation. A local idempotent claim does not prove an
   exactly-once external effect.
3. When exercise evidence is in scope, consider mixed and all-failed output sets,
   concurrent claims, failure before the effect, failure while recording the
   outcome, and reentry. Inspect outbound call count, committed receipt or
   outcome rows, exact marker targets, and affected-row counts.
4. Keep an accepted output's timestamp on reentry and scope result markers to
   the output they describe. A failed or unknown output must not inherit another
   output's marker.
5. Confirm caller lifetime is bounded through the outbound tail so a stalled
   delivery attempt cannot indefinitely retain ownership.

## Positive And Negative Review Examples

Positive: output A has explicit acceptance and a committed receipt or marker;
output B has a distinct identity and a proven failure. Reentry skips A and may
retry B under the declared policy. Inspect the durable records for both outputs.

Negative: a transport result is ambiguous while an aggregate job says "sent", or
recording the outcome fails. Neither the aggregate nor the transport return
proves delivery or safe retry. Keep the result unresolved until it can be
reconciled.

## Owner

Use with the [Build Learning Evidence Checklist](CVF_BUILD_LEARNING_EVIDENCE_CHECKLIST.md)
and the applicable transport, persistence, and review owners. This reference is
written guidance only; it is not a machine gate or proof that any delivery,
test, or live-provider action occurred.

## Claim Boundary

This checklist helps reviewers classify per-output evidence and uncertainty. It
does not prove delivery to a recipient, establish retry safety for every
transport, or provide an exactly-once guarantee.
