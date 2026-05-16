# CVF 16.5 Runtime Absorption

Memory class: FULL_RECORD

Status: PUBLIC RUNTIME ABSORPTION SUMMARY

Date: 2026-05-16

## Purpose

Record which CVF 16.5 knowledge-intake upgrades are now present in the public
CVF repository as runnable runtime contracts, tests, or bounded extension
surfaces.

## Quick Summary

This knowledge intake did not stay as private notes. The parts that were safe
to publish were turned into public, reviewable CVF surfaces so users can inspect
the boundary instead of relying on a promise.

## Scope

This evidence page covers public-source adoption of selected CVF 16.5 runtime
knowledge. It does not publish private provenance review packets, raw handoff
logs, provider keys, or internal rebuttal chains.

## Claim Boundary

Allowed claim: CVF now exposes deterministic local runtime contracts and tests
for the CVF 16.5 absorption lanes listed below.

Not allowed: these deterministic contracts alone prove live provider governance
behavior, full web UI coverage, output-quality parity, or production integration
with every downstream application.

## Source

The source intake was reviewed and stored in the private provenance archive.
The public repository carries the curated implementation surface only:

- `EXTENSIONS/CVF_MODEL_GATEWAY/`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/`
- `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/`
- `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/`

## Decision

CVF 16.5 absorption is accepted as public runtime hardening where the knowledge
has been converted into bounded contracts with tests. The public posture is
runtime-owned, not wrapper-only: contracts are integrated into existing CVF
planes or clearly isolated as bounded extension surfaces.

## Absorbed Runtime Lanes

| Lane | Public surface | User value |
|---|---|---|
| Model Gateway runtime | `EXTENSIONS/CVF_MODEL_GATEWAY/` | Provider choice, fallback, quota, sticky-session, credential boundary, and receipt structure become explicit and testable. |
| Controlled Memory | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.gateway.contract.ts` | Memory write/read behavior can be governed by source, purpose, retention, and review status. |
| Agent Boundary / Delegation | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.governed.session.contract.ts` | Agent sessions get bounded delegation state instead of implicit handoff assumptions. |
| Tool Call Trace / Sandbox | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/tool.call.trace.contract.ts` | Tool calls can carry traceable sandbox posture and review facts. |
| MCP Business Adapter | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mcp.business.adapter.contract.ts` | Business-tool invocations get approval and outcome boundaries before being treated as governed actions. |
| Observability Delta | `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/` | Runtime signals stay observe-only and do not silently mutate policy or execution. |
| Knowledge Vault Intake | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.vault.intake.contract.ts` | External knowledge intake can be classified, deduplicated, risk-tagged, and review-gated. |
| Document Artifact Renderer | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/document.artifact.renderer.contract.ts` | Governance evidence can be rendered into reviewable Markdown/HTML artifacts without inventing new evidence. |
| OpenSpec Change Adapter | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/openspec.change.adapter.contract.ts` | Change proposals can be converted into phase-safe, reviewable implementation packets. |
| Governed Skill Evolution | `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/evolution_engine/governed.skill.evolution.contract.ts` | Skill improvement remains proposal-only until review gates accept it. |

## Web Inheritance Audit

`cvf-web` already inherits earlier non-coder hardening: governed request entry,
receipt visibility, deliverable-pack export, evidence export, local-first
provider posture, and protected release-gate controls.

The CVF 16.5 lanes above are now public runtime surfaces, but most are not yet
directly surfaced as first-class non-coder web workflows. The web app should
not claim direct UI coverage for Knowledge Vault intake, HTML artifact export,
OpenSpec packet intake, Skill Evolution review queues, or Observability Delta
dashboards until those routes/components and tests exist.

## What This Means For Non-Coders

The useful web-facing direction is straightforward:

- clearer places to start a governed task;
- simpler ways to bring approved reference material into a request;
- visible receipts that explain what CVF checked;
- exportable packets that can be reviewed or handed to another person;
- fewer hidden assumptions when AI work is reused later.

This page does not claim that every lane is already exposed as a simple web
workflow. It records the public foundation for making those workflows visible.

## Evidence

Public evidence consists of source contracts plus colocated Vitest coverage.
The deterministic test surface is intended to prove contract behavior and
boundary semantics. Live provider governance behavior remains governed by the
release-gate evidence files.

## Verification

Public publication verification on 2026-05-16:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`: TypeScript check PASS; focused
  Vitest `48/48` PASS.
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION`: TypeScript check PASS; focused
  Vitest `161/161` PASS including the public self-contained gateway alignment.
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION`: TypeScript check PASS; focused
  Vitest `6/6` PASS.
- `EXTENSIONS/CVF_MODEL_GATEWAY`: TypeScript check PASS; Vitest `24/24` PASS.
- `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE`: TypeScript/test check
  PASS; package Vitest `102/102` PASS and focused skill-evolution `13/13`
  PASS.
- `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME`: TypeScript/test
  check PASS; Vitest `7/7` PASS.
- `cvf-web`: production build PASS; governed execute/QBS clarification route
  tests `6/6` PASS.
- Public-surface scan: PASS.

## Practical User Benefit

For non-coders and operators, this upgrade makes CVF more reviewable and less
implicit. The immediate benefit is clearer evidence and fewer hidden
assumptions. The next product benefit is web integration that turns the most
useful absorbed knowledge into simple guided flows.
