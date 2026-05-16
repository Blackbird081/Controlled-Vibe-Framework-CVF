# Redaction And Key Safety

Memory class: POINTER_RECORD

Status: CURRENT PUBLIC REDACTION BOUNDARY

## Purpose

Tell security-minded evaluators how CVF treats provider keys and key
redaction so they can evaluate the public posture without inspecting private
audit history.

## Scope

Public redaction rule, fake-key positive test convention, and the public
boundary of redaction coverage. This file does not cover provenance-only
redaction history or hosted-workflow secret configuration.

## Source

Public rule and test boundary derived from the redaction guard surfaces and
the provenance-only redaction probe records.

## Public Rule

CVF treats key redaction as part of governance.

- real provider keys are supplied by environment variables
- raw key values must not be printed, committed, or stored in evidence
- fake-key positive tests may be used to prove redaction paths without
  exposing a real key

## Evidence

Known public test boundary:

- unit-level redaction probes cover process output and persisted job state in
  the provenance record
- renewed public repo must run hosted live-gate proof after environment
  secrets are configured

## Decision

Redaction is treated as a governance requirement, not a presentation
preference. Any new public-facing surface that handles provider keys must
respect the public rule above.

## Boundary

- Public redaction evidence covers process output and persisted job state
  only at the unit level.
- Hosted workflow redaction is configured separately and is required for any
  hosted/public GA claim.

## Claim Boundary

This file claims only the listed public rule, fake-key test convention, and
unit-level coverage boundary. It does not claim hosted-secret coverage,
does not claim production-level redaction completeness, and does not
authorize committing real key values for any reason.
