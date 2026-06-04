# CVF Public Evaluation Claim Boundary

Memory class: POINTER_RECORD

Status: CURRENT PUBLIC EVALUATION BOUNDARY

Date: 2026-06-04

## Purpose

Give external agents, reviewers, developers, and public readers a compact rule
for evaluating CVF from the public GitHub repository without overreading private
provenance, route names, CI badges, or documentation-only connector standards.

## Scope

This file applies to public README, catalog, architecture, governance, evidence,
and source-code review performed from this public repository.

It does not expose private provenance records, internal roadmaps, handoffs,
operator transcripts, hidden IDE histories, raw provider logs, or private
completion packets.

## Owner / Source

Owner: CVF public documentation surface.

Source: public-safe repository files and curated public evidence summaries.

## Protocol / Contract / Requirements

Public claim evaluation must use the linked public path, status label, evidence
packet, and proof boundary. Reviewers must not promote a source file, mock
screen, CI badge, connector title, or private-provenance reference into a public
runtime claim without a matching public evidence path.

## Evaluation Rules

| Topic | Correct public interpretation | Do not infer |
| --- | --- | --- |
| Public repository | Curated public product and evidence surface | Full private development history |
| Governance claim | Requires live provider-backed proof when behavior is claimed | Mock/UI/static checks prove AI governance |
| CI badge or static gate | Shows public/static governance checks are configured | Automatic live provider proof on every push |
| Route source file | Means a route exists in the public source tree | Route is governed, authenticated, durable, or production-ready |
| Evidence packet | Public-safe summary of bounded proof | Raw provider transcript or universal capability |
| Connector spec | Documentation or schema contract when labeled as such | Runtime enforcement unless an evidence path says so |
| Provider certification | Named provider/model lane has bounded receipt evidence | Provider parity for cost, speed, quality, latency, or uptime |
| Web UI or demo data | Product surface or mock-friendly structure | Governance proof unless live evidence is linked |
| Local/runtime storage | Local-first or implementation-specific persistence only when stated | Hosted SaaS, multi-tenant durability, or database persistence |

## Public Proof Requirements

Release-quality claims that CVF controls AI or agent behavior must use a real
provider-backed governance path:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Mock mode may validate UI structure, navigation, static badges, layout, and
non-AI routing surfaces only. Mock mode does not prove risk classification,
approval flow, DLP filtering, bypass detection, output validation, provider
routing, audit updates, or governed AI behavior.

## Route Coverage Boundary

Public route files must be evaluated by linked evidence, tests, and explicit
claim text. A route path, handler name, or governance-related word inside a
file is not by itself route governance proof.

Public docs may say a route participates in a governed path only when the claim
names the route or surface and cites a public evidence path, test path, or
release gate boundary.

When evidence is absent, reviewers should classify the route as unproven for
public governance claims rather than assuming it is unsafe or governed.

## Evidence Durability Boundary

Public evidence summaries are intentionally curated. They may point to receipts,
tests, scripts, and source paths, but they do not imply every supporting runtime
surface is durably persisted, hosted, cryptographically signed, or
production-grade.

Durability terms must be read literally:

- local-first means operator-local state or repository-local artifacts;
- optional signing means signing is available only when configured;
- in-memory means process-local unless another evidence path says otherwise;
- static CI means no provider secret is consumed;
- protected live release gate means operator-approved live provider quota may be
  consumed.

## External-Agent Review Checklist

Before reporting a CVF public finding, an external agent should:

1. Verify cited paths exist in this public repository.
2. Distinguish `proven`, `partially proven`, `active`, `schema-defined`,
   `demand-gated`, and `roadmap` status labels.
3. Treat mock, static, or UI-only checks as non-governance proof.
4. Treat route existence as inventory, not coverage proof.
5. Read the known limitations register before treating a missing capability as
   hidden or contradictory.
6. Avoid citing private provenance paths unless the operator supplied a
   public-safe excerpt.

## Related Artifacts

- `README.md`
- `GOVERNANCE.md`
- `ARCHITECTURE.md`
- `docs/INDEX.md`
- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md`
- `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md`
- `docs/reference/CVF_PUBLIC_CATALOG_CLAIM_BOUNDARY_2026-05-18.md`
- `docs/evidence/latest-release-gate.md`

## Claim Boundary

This file calibrates public evaluation. It does not itself prove runtime
behavior, provider behavior, hosted freshness, production readiness, route
coverage, CI freshness, public release readiness, or private provenance
completeness.

## Enforcement / Verification

Run the public documentation and surface checks before publishing changes that
depend on this boundary:

```bash
python governance/compat/check_docs_governance_compat.py
python governance/compat/check_markdown_structural_completeness.py --all-changed --enforce
python scripts/check_public_surface.py
```
