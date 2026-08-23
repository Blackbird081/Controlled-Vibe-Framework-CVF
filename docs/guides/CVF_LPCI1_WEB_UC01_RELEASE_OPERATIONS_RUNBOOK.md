# LPCI1 Web UC-01 Release Operations Runbook

Status: DETERMINISTIC_BUILD_GUIDANCE_ONLY

Memory class: FULL_RECORD

docType: spec

Date: 2026-08-10

## Purpose

Define the operator-safe lifecycle for the accepted LPCI UC-01 release
hardening contract without performing any environment action.

## Scope

This guide covers promotion evidence, deterministic smoke, rollback, recovery,
static-health interpretation, and UI vocabulary. Release operator and platform
operations own any later authorized environment action.

## Owner Surface And Source Lineage

The accepted release-hardening DESIGN/SPEC owns the contract. The query route,
Model Gateway, limiter, control-plane event store, and static-health modules own
their respective implementation boundaries.

## Protocol And Requirements

Every promotion retains authorization, separate quotas, awaited durable audit,
real timeout cancellation, exact-pair validation, and static-health controls.

## Claim Boundary

This runbook describes the accepted release-hardening lifecycle. It is not
hosted, live-provider, deployment, rollback, production, or public-sync
authority. Commands that mutate an environment are intentionally absent.

## Promotion Sequence

Promote development -> preview -> staging -> production. At every boundary,
the release operator must bind one immutable artifact digest, one opaque
non-secret configuration-bundle version, the configuration schema and digest,
the policy/composition schema versions, deterministic test evidence, and a
side-effect-free `STATIC_READY` receipt. Production needs fresh authority; it
does not inherit authority from staging or any earlier environment.

The configuration digest covers only schema plus the non-secret model and
endpoint contract. It must never cover or reveal secret values, secret-derived
metadata, credential fingerprints, secret-store identifiers, or secret
versions. Promote all three LPCI configuration names as one atomic bundle.

## Deterministic Smoke

Before promotion, exercise the accepted deterministic matrix with injected
identities, stores, clock, provider adapter, abort controller, and event sink.
The smoke must verify authorization, exact-pair routing, separate query and
provider-attempt quotas, one provider attempt with zero automatic retry,
timeout cancellation, durable terminal audit, and fail-closed static health.
It must not contact a provider or external service. Hosted or live smoke needs
separate fresh authority.

## Rollback Triggers

Rollback is required for any non-ready static dependency, authorization
bypass, unavailable or bypassed distributed quota, durable append failure,
exact provider/model mismatch, provider timeout/error threshold breach, or
deterministic/authorized hosted smoke mismatch.

The release operator owns the rollback decision. Platform operations restores
the last accepted artifact and its complete atomic configuration bundle. The
application owner then verifies static health, durable audit capability, and
the deterministic smoke. Rollback must not disable authorization, either quota
stage, durable audit, timeout cancellation, exact-pair enforcement, or health.

## Recovery

Record a secret-safe cause, repair exactly one governed owner, rerun the full
deterministic matrix, obtain fresh promotion authority, and issue a new smoke
receipt. Do not backfill prior response-local receipts into durable evidence.
Keep every durable schema version readable throughout the 30-day retention
window. No database or provider/model migration is authorized by this runbook.

## Static Health Interpretation

`STATIC_READY` means only that accepted policy/configuration metadata and the
required implementation capabilities are present. It does not prove Redis,
evidence-store, or provider liveness or writability. Those signals require
separately authorized hosted smoke or operational monitoring.

## Operator-Safe UI Vocabulary

User-facing status is limited to `Ready`, `Temporarily unavailable`, `Rate
limited`, `Authorization required`, or `Configuration required`, with a short
recovery action and trace ID. Never expose actor references, role matrices,
quota keys or thresholds, raw diagnostics, endpoint/config values, provider
bodies, request/response content, or secret state.

## Enforcement And Verification

Before an authorized promotion, rerun the deterministic BUILD matrix and
verify immutable artifact/config correlation plus a `STATIC_READY` receipt.
Hosted and provider assertions require their own fresh authority and evidence.

## Boundaries And Non-Goals

This guide does not authorize credentials, provider calls, external probes,
server start, cloud mutation, deployment, rollback execution, migration,
public-sync, push, or production action.

## Related Artifacts

- `docs/reference/CVF_LPCI1_WEB_UC01_RELEASE_HARDENING_SPEC_2026-08-10.md`
- `docs/audits/CVF_LPCI1_WEB_UC01_RELEASE_HARDENING_DESIGN_2026-08-10.md`
- `docs/work_orders/CVF_AGENT_WORK_ORDER_LPCI1_WEB_UC01_RELEASE_HARDENING_BUILD_2026-08-10.md`
