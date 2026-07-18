# CVF External Agent Review Authoring Checklist

Memory class: FULL_RECORD

Status: ACTIVE_CHECKLIST

docType: reference

## Purpose

Give CVF agents a stable checklist for authoring external-agent review packets
that preserve CVF source authority and public/private boundaries.

## Scope / Target / Owner Boundary

Target: packet authoring before external-agent review or external package/repo
critique.

Owner boundary: this checklist governs packet quality. It does not authorize
public-sync, raw private-source release, MCP implementation, provider/live
calls, workspace runtime mutation, or readiness claims.

## Required Reads

Before authoring an external-agent review packet, read:

- `docs/reference/external_agent_review/README.md`;
- `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md`;
- `docs/reference/external_agent_review/CVF_EXTERNAL_AGENT_REVIEW_CONTEXT_STANDARD.md`;
- `docs/reference/external_agent_review/CVF_WORKFLOW_CHAIN_PUBLIC_REVIEW_CONTEXT.md`;
- `docs/reference/external_agent_review/CVF_EXTERNAL_AGENT_REVIEW_PACKET_TEMPLATE.md`;
- `docs/reference/external_agent_review/CVF_EXTERNAL_AGENT_FINDING_ABSORPTION_WORKFLOW.md`;
- the current source authority for the topic being reviewed.

## Authoring Checklist

| Check | Required result |
|---|---|
| Review objective is narrow | One topic, one critique surface, no broad architecture fishing |
| Input type routed through chain map | External/corpus/repo/public/legacy/review input is classified before packet authoring |
| CVF source-of-truth statement included | CVF-governed surfaces outrank public simplifications and external references |
| Public/private boundary included | Public-safe facts are separated from private provenance summaries |
| Workflow-chain map included | Public/simple labels are marked display vocabulary unless source-backed |
| Current authority surfaces cited | Each CVF fact maps to a current governed path or section |
| Non-authority surfaces named | External repos, copied packages, public snippets, provider memory, and chat are advisory only |
| Expected output shape specified | Findings, useful patterns, assumptions, questions, and blocked claims are separated |
| Claim boundary explicit | No public, production, release, MCP, provider, runtime, or workspace readiness claim without CVF proof |
| Absorption route stated | External output returns to CVF-owned finding/standard/roadmap/work-order/review artifacts |
| Secrets boundary explicit | No raw keys, secrets, credentials, or private full-source exposure |

## Red Flags

Reject or rewrite the packet before review if it:

- asks the external agent to infer CVF internals from public/simple lifecycle
  labels only;
- treats a copied package or external repo as CVF source authority;
- asks for implementation advice without a bounded source authority surface;
- invites readiness, release, production, MCP, provider, or runtime claims
  without current CVF evidence;
- exposes private provenance files in full when a public-safe summary is
  sufficient;
- omits how external output will be absorbed back into CVF governance.

## Completion Requirement

After using an external-agent review packet, CVF must return through
`CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` and classify returned content
before acting on it:

| Returned content | CVF next action |
|---|---|
| Source-backed CVF defect | Governed finding candidate |
| Useful external pattern | Absorb/adapt/defer/reject decision |
| Public/simple assumption | Question or hypothesis until source-verified |
| Missing context request | Operator/CVF reviewer decision |
| Runtime/readiness claim | Block unless CVF proof exists |

Use `CVF_EXTERNAL_AGENT_FINDING_ABSORPTION_WORKFLOW.md` to classify each
returned item before creating a finding, roadmap, work order, reference update,
or operator decision.

## Epistemic Process Block

### Expected Result / Prediction

External review packets should be safer and more useful when authors check
source authority, public/private boundary, workflow interpretation, and claim
limits before sending them out.

### Evidence Comparison

RTAD-T6 showed that external agents can overfit simplified public vocabulary
without a bounded context packet. This checklist converts that lesson into a
repeatable authoring local view.

### Contradiction Or Gap Disposition

EARC-T3 defines the external-finding absorption workflow and required returned
output classification surface. Machine enforcement remains a future candidate
after the first real external return packet exercises the workflow.

### Claim Update

CVF now has a stable checklist for authoring external-agent review packets and
a stable workflow for classifying returned external output, but external output
remains advisory until CVF absorbs it through governed artifacts.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this checklist is a private provenance authoring aid. Public-facing
versions require separate public-sync authorization.

## Claim Boundary

This checklist improves review packet discipline only. It does not authorize
public-sync, runtime/provider/MCP/workspace implementation, or readiness claims.
