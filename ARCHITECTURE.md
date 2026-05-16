# CVF Architecture

Memory class: POINTER_RECORD

Status: CURRENT PUBLIC ARCHITECTURE

CVF is a governance control plane. Its job is to control how AI and agents are
allowed to act, not to replace the agents or providers that perform the work.

The core architecture is local-first and provider-agnostic:

- CVF receives an input and assembles context.
- CVF applies rules, risk, approval, DLP, output validation, and evidence.
- The actual work may be performed by any bounded provider, plugin, tool, or
  external agent.
- CVF records enough evidence for an operator or developer to inspect what
  happened.

Diagram set:

- module map: how input, control plane, execution boundary, governance
  expansion, and learning plane relate
- dependency rules: which layers may depend on which lower layers
- active reference path: how a governed request reaches provider execution and
  receipt closure
- interaction model: the live-proof sequence from user intent to audit/freeze
  evidence

## Purpose

Describe CVF's public architecture in a diagram-first form so developers and
LLM/agent readers can understand the control-plane boundary quickly.

## Scope

This document covers the current public repository architecture: guard contract,
control plane, execution plane, governance expansion, learning plane, web
surface, provider boundary, and provenance/public split. It does not document
the full private development history.

## Claim Boundary

CVF controls the governance path around AI and agent execution. It does not
claim to own provider infrastructure, replace every external agent, or prove
governance behavior through mock UI checks alone.

## Canonical Flow

```text
request
  -> intake and context assembly
  -> risk classification
  -> policy and approval gate
  -> provider or agent adapter
  -> execution
  -> DLP/redaction and output validation
  -> audit receipt
  -> governed result
```

```mermaid
flowchart TB
  subgraph UserBoundary["Input Boundary"]
    U1["Non-coder UI"]
    U2["Developer SDK/CLI"]
    U3["Plugin / External Agent"]
  end

  subgraph ControlPlane["Governance Control Plane"]
    C1["Intake + Context Assembly"]
    C2["Risk Classification"]
    C3["Policy + Approval Gate"]
    C4["Provider / Agent Routing"]
  end

  subgraph ExecutionBoundary["Execution Boundary"]
    E1["Provider Adapter"]
    E2["Agent / Tool Adapter"]
    E3["Runtime Job State"]
  end

  subgraph GovernanceExpansion["Governance Expansion"]
    G1["DLP + Redaction"]
    G2["Output Validation"]
    G3["Bypass Detection"]
    G4["Audit Receipt"]
  end

  subgraph LearningPlane["Learning Plane"]
    L1["Feedback Ledger"]
    L2["Drift / Pattern Signal"]
    L3["Governed Reinjection"]
  end

  U1 --> C1
  U2 --> C1
  U3 --> C1
  C1 --> C2 --> C3 --> C4
  C4 --> E1
  C4 --> E2
  E1 --> G1
  E2 --> G1
  E3 --> G4
  G1 --> G2 --> G3 --> G4
  G4 --> L1 --> L2 --> L3
  L3 --> C1
```

## Planes

| Plane | Responsibility |
|---|---|
| Guard Contract | Shared types, rules, enforcement primitives, runtime helpers. |
| Control Plane | Intake, routing, context packaging, knowledge selection, provider selection. |
| Execution Plane | Dispatch, command/runtime boundary, policy gate, async execution status. |
| Governance Expansion | Checkpoints, watchdogs, audit logs, reintake, external asset governance. |
| Learning Plane | Feedback ledger, truth score, pattern detection, drift, reinjection. |
| Web Surface | Operator/non-coder visibility and control surface over governed paths. |

## Public Repository Tree

This renewed public repository is intentionally smaller than the provenance
archive. When cloned, the working tree should look like this at the top level:

```text
Controlled-Vibe-Framework-CVF/
|-- ARCHITECTURE.md
|-- GOVERNANCE.md
|-- PROVIDERS.md
|-- COST_AND_QUOTA.md
|-- PROVENANCE.md
|-- README.md
|-- netlify.toml
|-- ECOSYSTEM/
|   `-- doctrine/
|-- EXTENSIONS/
|   |-- CVF_GUARD_CONTRACT/
|   |-- CVF_CONTROL_PLANE_FOUNDATION/
|   |-- CVF_EXECUTION_PLANE_FOUNDATION/
|   |-- CVF_GOVERNANCE_EXPANSION_FOUNDATION/
|   |-- CVF_LEARNING_PLANE_FOUNDATION/
|   |-- CVF_MODEL_GATEWAY/
|   |-- CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/
|   |-- CVF_v1.6_AGENT_PLATFORM/
|   |   `-- cvf-web/
|   |-- CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/
|   `-- supporting bounded modules...
|-- docs/
|   |-- evidence/
|   `-- EXPORT_MANIFEST.md
|-- governance/
|   `-- public-surface-manifest.json
|-- scripts/
|   |-- check_public_surface.py
|   |-- run_cvf_release_gate_bundle.py
|   `-- provider readiness scripts
`-- .github/
    |-- workflows/
    `-- pull_request_template.md
```

The provenance archive keeps the full development journal, raw wave history,
reviews, rebuttals, handoffs, and local operational traces. The public tree
keeps only the product surface, architecture, runnable code, curated evidence,
and release gates.

## Dependency Rules

```mermaid
flowchart LR
  Doctrine["Doctrine / Architecture"] --> Guard["Guard Contract"]
  Guard --> Control["Control Plane"]
  Guard --> Execution["Execution Plane"]
  Control --> Web["Web Control Surface"]
  Execution --> Web
  Control --> Providers["Provider Adapters"]
  Execution --> Providers
  Providers --> Evidence["Receipts + Evidence"]
  Web --> Evidence
  Evidence --> Learning["Learning Plane"]
  Learning --> Control
```

The dependency direction is deliberate:

- doctrine defines boundaries, but does not execute runtime behavior;
- guard contracts must stay reusable and provider-neutral;
- provider adapters must not bypass risk, approval, DLP, validation, or receipt
  creation;
- web may expose controls, but it must not become the only runtime path;
- evidence may summarize behavior only when live proof exists.

## Active Reference Path

For governance claims, the active path must reach a real provider API call and
produce receipt/evidence output.

```mermaid
flowchart TB
  subgraph Request["Request and governance"]
    direction LR
    Intent["User intent<br/>coder / non-coder"]
    Entry["Entry surface<br/>SDK / Web / API"]
    Guard["Guard contract<br/>phase / role / risk / scope"]
    Runtime["Governance runtime<br/>INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE"]
  end

  subgraph Run["Approved execution"]
    direction LR
    Approval["Approval checkpoint"]
    Execute["Execution<br/>inside approved boundary"]
    Provider["Certified provider lane<br/>Alibaba primary<br/>DeepSeek bounded"]
  end

  subgraph Close["Evidence closure"]
    direction LR
    Review["Review and audit evidence"]
    Receipt["Freeze artifact / receipt"]
  end

  Intent --> Entry --> Guard --> Runtime
  Runtime --> Approval --> Execute --> Provider
  Provider --> Review --> Receipt
```

Diagram note: Alibaba/DashScope is the primary certified release lane. DeepSeek
has bounded provider-lane evidence. Provider parity is not claimed.

## Interaction Model

This sequence shows the practical governed loop. Mock UI checks do not count as
governance proof unless the live provider call and receipt evidence are present.

```mermaid
sequenceDiagram
  actor User
  participant Entry as SDK or Web Entry
  participant Guard as Guard Contract
  participant Runtime as Runtime + Tool/Agent
  participant Provider as Live Provider API
  participant Evidence as Audit / Freeze

  User->>Entry: submit intent
  Entry->>Guard: evaluate boundaries
  Guard-->>Entry: allow / block / escalate
  Entry->>Runtime: open governed path
  Runtime->>Runtime: run canonical phase loop
  Runtime->>Provider: live call inside approved boundary
  Provider-->>Runtime: model output
  Runtime->>Evidence: review receipt + freeze artifact
  Evidence-->>User: reviewable outcome
```

## Provider And Agent Boundary

CVF does not need to own the model or the worker agent. A provider, plugin,
tool, or external agent connects to CVF through an adapter boundary.

The adapter must make governance-visible facts available:

- selected provider/model
- request metadata
- risk and policy decision
- output validation result
- token/cost signal where available
- audit receipt reference

CVF 16.5 adds public deterministic contracts for gateway routing, credential
boundaries, fallback policy, quota ledger, sticky sessions, controlled memory,
knowledge intake, document artifact rendering, OpenSpec change packets, tool
trace/sandbox posture, MCP business actions, observe-only runtime signals, and
proposal-only skill evolution. These contracts improve runtime reviewability;
live governance behavior still requires release-gate evidence.

## Local-First Posture

The default deployment posture is local-first. Developers can clone and run CVF
on their own machine. Web exists to make the same controls visible and usable,
especially for non-coders and operators.

Managed/cloud persistence can be added later, but it must not become the only
valid way to use CVF.

## Web Boundary

`cvf-web` is a control surface. It is not the whole CVF runtime.

The web app helps users:

- submit governed requests
- see risk and provider posture
- inspect evidence receipts
- export deliverable packs and evidence summaries
- run protected governance jobs
- operate non-coder workflows

Claims about web governance must still be backed by live provider evidence.
The newly public CVF 16.5 runtime contracts are backend primitives until the
web app exposes dedicated non-coder flows for them.

## Public vs Provenance Boundary

This repository is the public product surface. It should be useful to
developers evaluating the system, operators running local-first governance, and
integrators building adapters.

The following material is intentionally kept outside the public repo unless it
is curated into evidence:

- raw handoff logs;
- rebuttal chains;
- historical wave notes;
- local runtime state;
- browser traces and temporary artifacts;
- private key setup transcripts;
- draft assessments that no longer describe the current product.

The public-surface scanner enforces that boundary before push.
