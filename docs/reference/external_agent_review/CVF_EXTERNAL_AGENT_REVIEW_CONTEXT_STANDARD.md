# CVF External Agent Review Context Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

docType: reference

## Scope / Target / Owner Boundary

Target: review-context preparation for external agents evaluating CVF,
especially workflow-chain, MCP, runtime, workspace, or public/private boundary
claims.

Owner boundary: this standard owns context shaping only. It does not expose
private provenance source, authorize public-sync, or make external-agent output
CVF authority.

## Scope / Applies-To

Applies to external-agent review prompts, public-context packets, copied
external package absorption, and external repository idea intake.

Does not apply to direct runtime implementation, provider calls, MCP tool
creation, public repository pushes, or production-readiness claims.

## Purpose

Define how CVF prepares context for external agents so their critique targets
the real CVF architecture instead of a stale, simplified, or public-only
surface.

## Core Principle

CVF is the source of truth.

External agents receive a curated review context. They do not receive authority
to define CVF semantics from public README fragments, copied packages,
provider-local memory, or isolated code examples.

## Required External Review Context

Any external-agent review request about CVF workflow chains, MCP, runtime,
workspace, governance, or public architecture must include a bounded context
packet with:

| Field | Requirement |
|---|---|
| Review objective | What the external agent is asked to critique. |
| CVF source-of-truth statement | CVF-owned artifacts outrank public simplifications and external examples. |
| Public/private boundary | Which facts are public-facing and which are provenance-only. |
| Workflow-chain map | Distinguish public/simple lifecycle labels from internal governed workflow-chain state. |
| Current authority surfaces | Stable CVF reference paths that define the reviewed area. |
| Non-authority surfaces | External packages, public README snippets, provider-local memory, chat, and copied examples. |
| Expected output shape | Findings, reusable patterns, rejected assumptions, and source questions. |
| Claim boundary | What the external agent must not claim as proven. |

## Public Surface Rule

Public-facing documents may use simplified vocabulary for comprehension. That
vocabulary is not automatically a runtime state machine.

If public material says a broad lifecycle such as intake, design, spec, work
order, build, review, or freeze, the external reviewer must treat it as a
display or education layer unless a CVF-owned source maps it to current
governed workflow-chain semantics.

## Internal Workflow-Chain Authority Rule

Internal CVF workflow-chain authority is derived from current governed
surfaces, including:

- active session state and next allowed move;
- active handoff;
- roadmap tranche state;
- GC-018 baseline;
- work order;
- Agent Handoff Contract route and role pattern;
- autorun phase gates;
- review, accepted-material, closure, and session-sync packets;
- evidence and receipt surfaces;
- stable reference front doors under `docs/reference/`.

No single public lifecycle enum may replace these surfaces.

## External Package Absorption Rule

When a package or repository is copied into the local workspace:

1. Treat it as non-canonical reference input.
2. Run or inspect its tests only as source evaluation, not CVF proof.
3. Do not commit the raw package unless a work order explicitly authorizes
   import.
4. Create a CVF-owned absorption map that classifies each useful pattern as
   `ABSORB`, `ADAPT`, `DEFER`, or `REJECT`.
5. Update the relevant stable CVF front door only with absorbed/adapted
   conclusions.

## Required Output From External Agents

External agents should return:

- source-backed observations;
- assumptions they made from public surfaces;
- useful patterns that may fit CVF;
- mismatches against CVF-owned authority;
- risks, missing context, and proposed questions.

They must not return:

- production readiness claims without CVF live proof;
- internal workflow-chain state derived only from public/simple labels;
- provider or MCP readiness claims without current CVF evidence;
- raw private-source requirements that force public exposure.

## Claim Boundary

This standard governs context preparation and absorption. It does not publish
private provenance files, implement MCP, create workspace runtime behavior, run
providers, or make public-readiness claims.

## Epistemic Process Block

### Expected Result / Prediction

External agents were expected to overfit public/simple vocabulary unless CVF
gave them a curated context packet.

### Evidence Comparison

The external package hard-coded a simple workflow enum after reading available
CVF surfaces, confirming the context gap.

### Contradiction Or Gap Disposition

The gap is resolved at documentation/reference level by defining a stable
external-agent review front door and context standard.

### Claim Update

External review context is now governed, but public-sync and machine
enforcement remain future work.
