# CVF Governed Capability Intake Doctrine

Memory class: POINTER_RECORD

Document type: CANONICAL — CVF-NATIVE DOCTRINE

Status: official docs absorption from CVF ADD, Phase A, 2026-05-07.

Source lineage: CVF ADD arbitration and synthesis normalized external
capability material from CLI-Anything, Hugging Face Agents, Hermes Agent, Agent
Engineer, and adjacent harness sources. No source file was promoted as-is.

## Purpose

This doctrine defines how CVF absorbs external capabilities before they can
become live CVF behavior.

A capability is any external or newly introduced tool, CLI, skill, provider
utility, agent harness, generated workflow, knowledge helper, or execution
adapter that can expand what an agent can do.

CVF does not trust a capability because it exists. CVF may use it only after
the capability is identified, classified, boundary-bound, owner-bound, and
evidence-bound.

## Core Rule

External capability intake is a governed sequence:

1. discover the capability;
2. record provenance;
3. classify its capability type and risk;
4. map it to an existing CVF owner surface;
5. define allowed and blocked operations;
6. choose sandbox / adapter posture;
7. bind the evidence requirement;
8. evaluate whether it improves CVF without widening claims.

No candidate may skip directly from "interesting source" to "runtime authority".

## Intake Record Shape

Future implementation should preserve these fields when a capability is
absorbed into runtime:

```yaml
governed_capability:
  capability_id: string
  capability_name: string
  source_provenance: string
  source_class: repo|folder|document_bundle|tool|provider|generated_harness|other
  capability_class: tool|skill|provider_utility|agent_harness|knowledge_helper|workflow|runtime_adapter
  risk_class: R0|R1|R2|R3
  owner_surface: string
  allowed_operations: []
  blocked_operations: []
  sandbox_tier: none|read_only|workspace_bound|network_bound|operator_bound
  policy_binding: string
  evidence_requirement: none|doc_review|unit|e2e|live_governance
  freshness_status: current|stale|unknown
  evaluation_status: proposed|accepted|deferred|rejected|retired
  retirement_condition: string
```

The record shape is advisory until a future runtime roadmap implements it.

## Owner Surface Binding

Every absorbed capability must map to an existing CVF owner surface:

- Architecture/reference docs define doctrine.
- Policy engine/risk classifier defines governance permission.
- Provider/Model Gateway defines provider routing and live-call posture.
- Tool/runtime adapter layer defines executable use.
- Knowledge Layer defines stored/retrieved knowledge.
- Context builder defines context packaging.
- W7/evidence layer defines proof and receipts.

If no owner surface exists, the capability is deferred.

## Relationship To Existing W7 External Asset Intake

This doctrine extends the logic of `CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md`.
The W7 profile remains the canonical external asset path. This document adds a
broader doctrine for capability-bearing material that may include tools,
providers, harnesses, workflows, and generated agents.

When the two overlap, the stricter boundary wins:

- W7 asset intake controls registry readiness.
- This doctrine controls whether a capability can become an operational
  behavior or runtime input.

## Non-Goals

This doctrine does not:

- approve any specific external tool;
- create a new provider abstraction;
- authorize CLI execution;
- bypass W132/W133 runtime stability boundaries;
- replace release-quality live governance proof;
- promote private CVF ADD source files into canon as-is.

## Runtime Activation Boundary

Docs absorption is complete with this file. Runtime activation is a separate
step and must define concrete code surfaces, tests, and live proof boundaries
before any behavior claim is made.

