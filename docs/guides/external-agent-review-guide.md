# External Agent Review Guide

Status: CURRENT PUBLIC GUIDE

Use this guide when a user pastes the CVF public repository link into another
AI system and asks for an independent review.

## Purpose

Keep external review grounded in the public repository, current claim boundary,
and reproducible evidence requirements.

## Paste-Ready External Review Prompt

Copy this prompt when asking another AI agent to review CVF from a public
GitHub link:

```text
Review the public Controlled Vibe Framework (CVF) repository as a public
product and evidence surface.

Before making findings, record:
- repository URL
- branch or commit SHA under review
- review date
- whether you had live provider API keys available

Read these files first, in order:
1. README.md
2. docs/guides/external-agent-review-guide.md
3. docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md
4. docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md
5. docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md
6. docs/GET_STARTED.md
7. CHANGELOG.md
8. SECURITY.md
9. PROVIDERS.md
10. COST_AND_QUOTA.md

Evaluate CVF with these rules:
- Treat this repository as the public CVF product/evidence surface, not the
  full private provenance archive.
- Treat route files, connector specs, mock UI, static CI badges, and status
  labels as inventory unless a public evidence path proves the runtime claim.
- Release-quality governance behavior requires a live provider-backed run:
  python scripts/run_cvf_release_gate_bundle.py --json
- If no provider API key is available, classify live proof as unavailable in
  your environment. Do not replace it with mock proof.
- Distinguish configured CI/coverage workflows from a specific latest run
  artifact.
- Treat provider lanes as lane-specific evidence, not cost, speed, quality,
  reliability, latency, or parity claims.
- Check known limitations before reporting production, enterprise, benchmark,
  route-coverage, evidence-durability, or onboarding gaps.
- Cite exact public file paths and line numbers for every finding.

Separate your report into:
1. source-backed bugs or contradictions;
2. public documentation drift;
3. security or dependency debt;
4. benchmark, reviewer-agreement, or corpus-size limitations;
5. production-readiness or enterprise-readiness gaps;
6. live-proof gaps requiring API keys;
7. product/onboarding/refactor debt;
8. findings you reject as already bounded by public docs.

For each finding, include:
- finding title
- severity
- cited public path and line
- evidence type: source, docs, CI config, live run, missing live key, or
  limitation-register item
- whether the finding is new, known open debt, stale against the reviewed
  commit, or unsupported by public evidence
- recommended fix

Do not claim hosted SaaS readiness, production readiness, full route coverage,
private provenance completeness, provider parity, benchmark parity, or live
governance behavior unless the public repository provides matching evidence or
you personally ran the live command successfully.
```

## How To Interpret CVF Structure

CVF has four public layers that external agents should keep separate:

| Layer | What it means | Common review mistake |
| --- | --- | --- |
| Front-door docs | Public explanation and claim boundaries | Treating docs as proof of runtime behavior |
| Governance guards | Local/CI compatibility checks for repository discipline | Treating every guard as product runtime logic |
| Extension source | Implementation surfaces and historical modules | Treating file existence as active production coverage |
| Evidence packets | Bounded proof summaries, receipts, and limitations | Treating one proof as universal capability |

Use the claim boundary and known limitations register to decide whether a
finding is a defect, open debt, or an unsupported inference.

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

Before reviewing, record the public branch or commit SHA and the review date.
Several CVF claims are intentionally drift-sensitive: public docs, CI workflow
configuration, provider status, and live-gate evidence may change between
branches.

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
- Treat root handoff or continuity files as public-safe orientation surfaces,
  not as complete private session memory.
- Do not infer runtime governance proof from route names, mock UI, connector
  specs, static CI badges, or documentation status labels.
- Classify missing live proof as `unverified from public evidence` unless the
  cited public command or receipt actually fails.
- Check `CHANGELOG.md` before reporting stale version strings.
- Check the skill-library source or current public docs before reporting skill
  counts.
- Check `.github/workflows/` and run artifacts separately: workflow presence
  means a check is configured, not that the latest public run passed.
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
- CPF public barrel size is guarded, but CPF source grouping remains a broader
  maintainability/refactor backlog item.
- Extension/package naming still reflects historical CVF evolution and has not
  been product-renamed.
- A five-minute demo path exists as documentation, not as hosted no-key SaaS.

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

## Claim Boundary

This guide improves external-review calibration. It does not prove runtime
behavior, live governance coverage, production readiness, security posture,
provider quality, benchmark parity, or private provenance completeness.
