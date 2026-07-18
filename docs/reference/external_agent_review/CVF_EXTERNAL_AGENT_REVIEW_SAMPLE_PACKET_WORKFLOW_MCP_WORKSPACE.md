# CVF External Agent Review Sample Packet - Workflow MCP Workspace Context

Memory class: FULL_RECORD

Status: ACTIVE_SAMPLE

docType: review_context

## Purpose

Show a bounded example packet that asks an external agent to critique CVF's
workflow-chain, MCP, and workspace context without granting authority to
public/simple vocabulary or external packages.

## Scope / Target / Owner Boundary

Target: sample external-agent review packet for workflow-chain, MCP, and agent
workspace context.

Owner boundary: this sample demonstrates packet structure only. It does not
authorize a real external review, public-sync, MCP implementation, provider
calls, workspace runtime mutation, raw package import, or readiness claims.

## Scope / Applies-To

Applies when a CVF agent needs a bounded example for preparing an external
review packet.

Does not apply as a runtime state machine, MCP tool contract, public
publication packet, or workspace implementation plan.

## Review Objective

Review whether the supplied CVF context is sufficient for an external agent to
understand the boundary between:

- public/simple workflow labels;
- internal governed workflow-chain authority;
- future MCP tool ingress;
- future agent workspace state and runtime boundaries.

Do not implement anything. Return only critique, assumptions, useful patterns,
and source questions.

## CVF Source-Of-Truth Statement

CVF is the source of truth. Public/simple explanations, copied external
packages, external repositories, provider-local memory, and chat summaries are
not CVF authority unless mapped to CVF-governed source surfaces in this packet.

## Public / Private Boundary

| Surface | Disposition |
|---|---|
| Public-safe facts | CVF may use simplified workflow labels for education and external readability. |
| Private provenance facts | Internal authority is governed through session state, handoff, roadmap, GC-018, work order, autorun, review, evidence, and session-sync surfaces. |
| Forbidden exposure | Do not request raw private provenance files, secrets, provider keys, unpublished runtime receipts, or copied package internals beyond supplied summaries. |

## Workflow-Chain Interpretation Map

| Public/simple label or phrase | Review interpretation | CVF authority to check |
|---|---|---|
| `INTAKE -> DESIGN -> SPEC -> WORK_ORDER -> BUILD -> REVIEW -> FREEZE` | DISPLAY_VOCABULARY_ONLY | `docs/reference/external_agent_review/CVF_WORKFLOW_CHAIN_PUBLIC_REVIEW_CONTEXT.md` |
| `WORK_ORDER` | Not proof that any worker may execute | Current GC-018, work order, Agent Handoff Contract block, and autorun gates |
| `BUILD` | Not proof that runtime implementation is authorized | Current roadmap tranche, allowed scope, live/provider boundary, and work order |
| `REVIEW` | Not proof closure is complete | Completion packet, reviewer acceptance, closure gates, and session sync |
| `FREEZE` | Not proof public readiness is proven | Public export disposition and public-sync evidence |

## Current Authority Surfaces

| Surface | Role | Why it matters |
|---|---|---|
| `CVF_SESSION/ACTIVE_SESSION_STATE.json` | Current state registry | Defines current mode and active handoff |
| `CVF_SESSION/state/entries/nextAllowedMove.json` | Next-move source | Defines the next allowed governed move |
| `AGENT_HANDOFF_V19_2026-06-15.md` | Active handoff | Defines cross-agent continuity and parked checkpoints |
| `docs/reference/external_agent_review/README.md` | External review front door | Defines how external review context is prepared |
| `docs/reference/external_agent_review/CVF_EXTERNAL_AGENT_REVIEW_CONTEXT_STANDARD.md` | Review context standard | Defines required context packet fields and output shape |
| `docs/reference/external_agent_review/CVF_WORKFLOW_CHAIN_PUBLIC_REVIEW_CONTEXT.md` | Public/simple vocabulary boundary | Prevents hard-coded public lifecycle labels from becoming internal authority |
| `docs/reference/mcp_gateway/README.md` | MCP local view | Explains MCP as future tool ingress, not current automatic implementation authorization |
| `docs/reference/agent_workspace/README.md` | Workspace local view | Explains agent workspace foundation and runtime boundary |

## Non-Authority Surfaces

| Surface | Allowed use | Must not be used for |
|---|---|---|
| Public README or catalog fragments | Reader orientation | Internal state, runtime authority, or readiness proof |
| External repositories | Pattern inspiration | CVF source authority |
| Copied external packages | Reference input only after CVF absorption | Raw import, runtime proof, or current workflow-chain semantics |
| Provider-local memory or chat | Local operating aid | Source authority, closure evidence, or reusable governance learning |

## Review Questions

1. Which parts of this packet are still ambiguous for an external reviewer?
2. Which public/simple labels could still be mistaken for internal CVF state?
3. Which MCP or workspace patterns are useful but require CVF-owned absorption?
4. Which claims should be blocked until CVF supplies stronger source evidence?

## Expected External-Agent Output

| Output type | Required evidence | CVF disposition requested |
|---|---|---|
| Source-backed CVF defect | Cite the supplied CVF authority surface | Governed finding candidate |
| Useful external pattern | Cite external reference and explain adaptation boundary | Absorb, adapt, defer, or reject |
| Public/simple assumption | Name the public/simple source | Question or hypothesis |
| Missing context | Name the missing source or question | Return to operator/CVF reviewer |
| Readiness/runtime claim | Cite current CVF live/runtime evidence | Block unless proof exists |

## Claim Boundary

This sample does not authorize public-sync, publication, MCP implementation,
provider calls, workspace runtime mutation, raw package import, runtime
execution, production readiness, release readiness, public readiness, or
external-facing readiness.

## Absorption Instruction

External output is advisory. CVF will absorb useful content only through
CVF-owned findings, standards, roadmaps, work orders, reviews, reference
artifacts, or explicit operator decisions.
