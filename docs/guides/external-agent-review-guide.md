# External Agent Review Guide

Memory class: POINTER_RECORD

Status: CURRENT PUBLIC GUIDE

Use this guide when a user pastes the CVF public repository link into another
AI system and asks for an independent review.

## Purpose

Keep external review grounded in the public repository, current claim boundary,
and reproducible evidence requirements.

## Scope / Target / Owner Boundary

Target: external AI agents, reviewers, and users evaluating the public CVF
repository from a pasted GitHub link.

Owner boundary: this guide governs public-review calibration only. It does not
authorize access to private provenance, hidden handoffs, raw provider logs, or
operator transcripts.

## Target / Source Under Review

Primary source under review: the public CVF repository at the current branch or
commit supplied by the user.

Public claim source: public files and public-safe evidence paths only.

## Scope / Methodology

Reviewers should read the start-here files, classify each finding by evidence
type, and cite public file paths and lines. Reviewers should not promote mock,
route-name, CI-badge, connector-title, or status-label evidence into runtime
governance proof unless a matching public evidence path or live command result
exists.

## Start Here

Read these files first:

- `README.md`
- `docs/GET_STARTED.md`
- `CHANGELOG.md`
- `SECURITY.md`
- `docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`
- `docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md`
- `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md`
- `docs/CVF_CORE_KNOWLEDGE_BASE.md`

## Findings / Position

External reviews should separate source-backed defects from known open debt and
from unavailable live proof. A missing API key is an environment limitation for
live proof, not a substitute for mock governance proof.

## Review Rules

- Treat this repository as the public CVF product surface, not the full private
  provenance archive.
- Do not infer runtime governance proof from route names, mock UI, connector
  specs, static CI badges, or documentation status labels.
- Classify missing live proof as `unverified from public evidence` unless the
  cited public command or receipt actually fails.
- Check `CHANGELOG.md` before reporting stale version strings.
- Check the skill-library source or current public docs before reporting skill
  counts.
- Cite exact public paths and lines for every finding.
- Separate security, production readiness, dependency debt, documentation drift,
  benchmark quality, and evidence-chain findings.

## Risk / Corrective Action

Risk: without this guide, an external agent can overread public docs into
private provenance claims, production readiness, provider parity, or live
governance coverage.

Corrective action: use this guide plus
`docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md` as the
front-door review packet before filing findings.

## Known Open Debt

These items are acknowledged public review targets and should not be treated as
hidden contradictions:

- `next-auth` is still pinned to a beta line in `cvf-web`.
- Distributed rate limiting, PostgreSQL, and SSO remain production-hardening
  work, not completed enterprise deployment proof.
- Reviewer agreement and small-corpus benchmark limits remain quality evidence
  constraints.
- Independent immutable anchoring and third-party live-run reproduction remain
  evidence-chain hardening work.
- Live governance proof requires a provider key and may consume paid quota.

## Live Proof Boundary

Release-quality governance behavior claims require:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

If no live provider key is available, report the live proof as unavailable in
that environment. Do not replace it with mock mode when evaluating governance
behavior.

## Decision / Recommendation / Disposition

Recommendation: external agents should start from this guide and the public
claim boundary before issuing a CVF assessment. Findings should be accepted only
when they cite current public paths, source lines, evidence packets, command
results, or clearly labeled unavailable live proof.

## Prompt Template

Use this prompt for a cleaner external review:

```text
Review this public CVF repository as a public product/evidence surface.
Start with README.md, docs/GET_STARTED.md, CHANGELOG.md, SECURITY.md,
docs/guides/external-agent-review-guide.md, and
docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md.

Separate findings into:
1. source-backed bugs or contradictions;
2. public documentation drift;
3. security or dependency debt;
4. benchmark/evidence limitations;
5. production-readiness gaps;
6. live-proof gaps that require API keys.

Do not infer private provenance, hosted SaaS readiness, production readiness,
provider parity, or live governance behavior unless the public repo provides a
matching evidence path or live command result. Cite public file paths and lines.
```

## Claim Boundary

This guide improves external-review calibration. It does not prove runtime
behavior, live governance coverage, production readiness, security posture,
provider quality, benchmark parity, or private provenance completeness.
