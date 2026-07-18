# CVF External Agent Review Packet Template

Memory class: FULL_RECORD

Status: ACTIVE_TEMPLATE

docType: reference

## Purpose

Provide the stable template for asking an external agent to review CVF without
mistaking public/simple vocabulary, copied packages, provider-local memory, or
external repositories for CVF authority.

## Scope / Target / Owner Boundary

Target: external-agent review packets for CVF architecture, workflow-chain, MCP,
runtime, workspace, governance, public/private boundary, or copied-package
critique.

Owner boundary: this template shapes review context only. It does not publish
private provenance files, authorize public-sync, run providers, implement MCP,
mutate workspace runtime state, or create readiness claims.

## Required Use

Use this template before asking an external agent to critique CVF when the
review touches workflow-chain semantics, MCP, runtime, agent workspace, public
catalog wording, external packages, or public/private context boundaries.

## Packet Template

Copy this structure into the review packet and fill the bracketed values.

```markdown
# CVF External Agent Review Packet - [Short Topic]

Memory class: FULL_RECORD

Status: DRAFT_FOR_EXTERNAL_REVIEW

docType: review_context

## Review Objective

[State exactly what the external agent should critique.]

## CVF Source-Of-Truth Statement

CVF is the source of truth. Public/simple explanations, copied external
packages, external repositories, provider-local memory, and chat summaries are
not CVF authority unless the packet maps them to CVF-governed source surfaces.

## Public / Private Boundary

| Surface | Disposition |
|---|---|
| Public-safe facts | [List facts safe for external review.] |
| Private provenance facts | [Summarize without exposing full private files.] |
| Forbidden exposure | Do not request raw private provenance files, secrets, provider keys, or unpublished internal artifacts. |

## Workflow-Chain Interpretation Map

| Public/simple label or phrase | Review interpretation | CVF authority to check |
|---|---|---|
| [label] | DISPLAY_VOCABULARY_ONLY or SOURCE_BACKED_INTERNAL_STATE | [CVF path/section] |

## Current Authority Surfaces

| Surface | Role | Why it matters |
|---|---|---|
| [CVF-governed path] | [authority role] | [reason] |

## Non-Authority Surfaces

| Surface | Allowed use | Must not be used for |
|---|---|---|
| [external repo/package/public snippet] | Reference input only | CVF fact or readiness proof |

## Review Questions

1. [Question that asks for critique.]
2. [Question that asks for mismatches or assumptions.]
3. [Question that asks for useful patterns CVF may absorb.]

## Expected External-Agent Output

Return findings in this shape:

| Output type | Required evidence | CVF disposition requested |
|---|---|---|
| Source-backed CVF defect | Cite the supplied CVF authority surface | Governed finding candidate |
| Useful external pattern | Cite external reference and explain adaptation boundary | Absorb, adapt, defer, or reject |
| Public/simple assumption | Name the public/simple source | Question or hypothesis |
| Missing context | Name the missing source or question | Return to operator/CVF reviewer |
| Readiness/runtime claim | Cite current CVF live/runtime evidence | Block unless proof exists |

## Claim Boundary

The external agent must not claim public readiness, production readiness,
release readiness, MCP readiness, provider reliability, runtime execution
authority, workspace runtime behavior, or CVF semantic truth unless the packet
supplies current CVF-governed evidence for that claim.

## Absorption Instruction

External output is advisory. CVF will absorb useful content only through
CVF-owned findings, standards, roadmaps, work orders, reviews, or reference
artifacts after classifying it with
`docs/reference/external_agent_review/CVF_EXTERNAL_AGENT_FINDING_ABSORPTION_WORKFLOW.md`.
```

## Required Source Authority Minimum

Every packet created from this template must cite at least:

- `docs/reference/external_agent_review/README.md`;
- `docs/reference/external_agent_review/CVF_EXTERNAL_AGENT_REVIEW_CONTEXT_STANDARD.md`;
- `docs/reference/external_agent_review/CVF_WORKFLOW_CHAIN_PUBLIC_REVIEW_CONTEXT.md`;
- `docs/reference/external_agent_review/CVF_EXTERNAL_AGENT_FINDING_ABSORPTION_WORKFLOW.md`;
- the specific CVF-governed standard, roadmap, work order, runtime source, or
  completion artifact being reviewed.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this is a private provenance template. Public-sync requires separate
authorization and a public-safe derived packet.

## Claim Boundary

This template governs review-context shape only. It does not make any external
review authoritative and does not authorize runtime, public-sync, provider, MCP,
workspace, or readiness work.
