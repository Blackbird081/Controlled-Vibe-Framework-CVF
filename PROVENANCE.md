# CVF Provenance

Memory class: POINTER_RECORD

Status: CURRENT PUBLIC PROVENANCE SUMMARY

CVF's full development history is preserved in the provenance repository:

`Controlled-Vibe-Framework-CVF-Provenance`

The public repository intentionally contains the current product surface and
curated evidence summaries, not the full internal operating log.

## Purpose

Explain how the clean public repo remains connected to the private provenance
archive without exposing the full internal operating journal.

## Scope

This file records the public provenance anchor, auditor access posture, what is
preserved, and what is intentionally excluded from public history.

## Claim Boundary

The public repo is a curated product surface, not the full historical record.
Full raw development evidence is preserved separately and may be shared through
operator-controlled provenance access.

## Verification

Final provenance tag: `provenance-pre-renewal-2026-05-09`

Final provenance commit:

`16cff60c596af619da040ba8887ce81396dad04e`

Export date: `2026-05-09`

The renewed public repository includes `docs/EXPORT_MANIFEST.md`, binding
exported paths and evidence summaries to the final provenance anchor.

## Auditor Access

Partners and security auditors may request selected provenance access or a
partner provenance packet.

- Request channel: operator-defined
- Target response time: 48 hours
- Retention target: minimum 7 years unless superseded by legal or operator policy

## What Is Preserved

- full Git history before renewal
- internal reviews, audits, baselines, and roadmaps
- agent handoffs and Claude/Codex review exchanges
- release evidence and provider-lane evidence
- public-renewal decision and export manifests

## What Is Not Preserved In Public

- raw provider keys
- `.env` and `.env.local`
- `.cvf/runtime/` owner-specific local state
- temporary browser/test artifacts
- developer local caches
