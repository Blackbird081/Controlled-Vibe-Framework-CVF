# Controlled Vibe Framework (CVF)

> **Developed by Tien - Tan Thuan Port@2026**
>
> **Controlled vibe coding. Not faster, but safer and more governable.**

🇬🇧 English | [🇻🇳 Tiếng Việt](docs/GET_STARTED.md)

[![Version](https://img.shields.io/badge/version-4.0.0%20Runtime-9e6b2b.svg)](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/releases)
[![License](https://img.shields.io/badge/license-CC%20BY--NC--ND%204.0-blue.svg)](LICENSE)
[![Guard Contract](https://img.shields.io/badge/Guard%20Contract-187%20tests%20pass-brightgreen.svg)](EXTENSIONS/CVF_GUARD_CONTRACT/)
[![MCP Bridge](https://img.shields.io/badge/MCP%20Bridge-4%20endpoints%20active-blue.svg)](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/)
[![Skills](https://img.shields.io/badge/skills-141%20%C3%97%2012%20domains-blue.svg)](EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/)
[![AI Safety](https://img.shields.io/badge/AI%20Safety-Kernel%20Active-green.svg)](docs/assessments/CVF_ANTIGRAVITY_INDEPENDENT_ASSESSMENT_2026-02-26.md)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions%20ready-blue.svg)](.github/workflows/cvf-ci.yml)

---

## Quick Navigation

<table>
  <tr>
    <td align="center"><a href="#what-cvf-is"><strong>Overview</strong></a></td>
    <td align="center"><a href="#start-here"><strong>Start Here</strong></a></td>
    <td align="center"><a href="ARCHITECTURE.md"><strong>Architecture</strong></a></td>
    <td align="center"><a href="#current-status"><strong>Status</strong></a></td>
    <td align="center"><a href="#repository-map"><strong>Repo Map</strong></a></td>
    <td align="center"><a href="#key-docs"><strong>Docs Hub</strong></a></td>
    <td align="center"><a href="#governance--evidence"><strong>Governance</strong></a></td>
    <td align="center"><a href="#contributing"><strong>Contributing</strong></a></td>
  </tr>
</table>

## What CVF Is

CVF is a governance-first control plane for AI-assisted execution. Its active reference path is built around one canonical controlled loop:

`INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE`

What CVF is good at:

- keeping human approval and audit evidence inside the delivery loop
- enforcing phase, role, risk, scope, and mutation boundaries
- giving both coder-facing and non-coder paths a governed execution model
- preserving reconciliation records so future audits are faster and cheaper

What CVF is not claiming today:

- full parity across every extension family
- fully unified controlled autonomy on every channel
- platform breadth comparable to larger orchestration ecosystems

The safest current product claim is recorded in [Release Readiness](docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md).

For a visual system map, open [ARCHITECTURE.md](ARCHITECTURE.md).

## Start Here

Choose the shortest path for your role:

| Role | Best Starting Point |
|---|---|
| New to CVF | [Quick Orientation](docs/guides/CVF_QUICK_ORIENTATION.md) |
| Non-coder | [Getting Started](docs/GET_STARTED.md) and [Non-Coder Governed Packet](docs/reference/CVF_NONCODER_REFERENCE_GOVERNED_PACKET.md) |
| Coder / Integrator | [Controlled Execution Loop](docs/concepts/controlled-execution-loop.md) and [Reference Governed Loop](docs/reference/CVF_REFERENCE_GOVERNED_LOOP.md) |
| Auditor / Reviewer | [Independent System Checkpoint](docs/reviews/CVF_INDEPENDENT_SYSTEM_CHECKPOINT_2026-03-20.md) |

### Quick Run: Web UI

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Quick Run: Workspace Bootstrap

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\new-cvf-workspace.ps1 `
  -WorkspaceRoot "D:\CVF-Workspace" `
  -ProjectName "My-Project"
```

See [Workspace Isolation Guard](governance/toolkit/05_OPERATION/CVF_WORKSPACE_ISOLATION_GUARD.md).

## Current Status

Current posture on the active reference path:

| Area | Status |
|---|---|
| Canonical phase model | `ALIGNED` |
| Hardened default guard path | `ALIGNED` |
| Web non-coder semantics | `SUBSTANTIALLY ALIGNED` |
| Cross-extension workflow realism | `SUBSTANTIALLY ALIGNED` |
| Governance executable ownership | `SUBSTANTIALLY ALIGNED` |
| End-to-end controlled autonomy loop | `SUBSTANTIALLY ALIGNED` |
| Continuation-stop governance (`GC-018`) | `ALIGNED` |

Read this status as:

- the current system-unification wave is complete for the active path
- the active path is materially delivered and depth-frozen
- future expansion must go through reassessment or `GC-018`

Primary status anchors:

- [Release Readiness Status](docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md)
- [Independent System Checkpoint](docs/reviews/CVF_INDEPENDENT_SYSTEM_CHECKPOINT_2026-03-20.md)
- [System Unification Reassessment](docs/reviews/CVF_SYSTEM_UNIFICATION_REASSESSMENT_2026-03-20.md)
- [System Unification Roadmap](docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md)
- [Next-Wave Proposal](docs/roadmaps/CVF_NEXT_WAVE_PLATFORM_COMPLETION_ROADMAP_2026-03-20.md)

## Repository Map

| Path | Purpose |
|---|---|
| `EXTENSIONS/CVF_GUARD_CONTRACT/` | shared guard contract, public SDK boundary, governed helper runtime |
| `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/` | canonical governance runtime, orchestrator, workflow bridge |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/` | Web UI, non-coder flows, guard APIs, governed execute path |
| `governance/` | governance toolkit, policy, operations guards, compat gates |
| `docs/` | canonical docs, baselines, roadmaps, reviews, release records |

## Key Docs

### Learn the model

- [Architecture Overview](ARCHITECTURE.md)
- [Docs Index](docs/INDEX.md)
- [Core Knowledge Base](docs/CVF_CORE_KNOWLEDGE_BASE.md)
- [Controlled Execution Loop](docs/concepts/controlled-execution-loop.md)
- [Governance Model](docs/concepts/governance-model.md)
- [Risk Model](docs/concepts/risk-model.md)

### Use the system

- [Getting Started](docs/GET_STARTED.md)
- [Quick Orientation](docs/guides/CVF_QUICK_ORIENTATION.md)
- [Solo Developer Guide](docs/guides/solo-developer.md)
- [Enterprise Guide](docs/guides/enterprise.md)
- [First Project Tutorial](docs/tutorials/first-project.md)

### Track status and evidence

- [Release Manifest](docs/reference/CVF_RELEASE_MANIFEST.md)
- [Module Inventory](docs/reference/CVF_MODULE_INVENTORY.md)
- [Release Readiness](docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md)
- [Governance Control Matrix](docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md)
- [Context Continuity Model](docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md)
- [Memory Record Classification](docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md)
- [Independent System Checkpoint](docs/reviews/CVF_INDEPENDENT_SYSTEM_CHECKPOINT_2026-03-20.md)
- [Active-Wave Closure Review](docs/reviews/CVF_SYSTEM_UNIFICATION_ACTIVE_WAVE_CLOSURE_REVIEW_2026-03-20.md)

### Govern future changes

- [GC-018 Continuation Candidate Template](docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md)
- [Fast Lane Audit Template](docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md)
- [Fast Lane Review Template](docs/reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md)
- [GC-018 Continuation Candidate N1](docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_N1_2026-03-20.md)
- [Post-Closure Reassessment Trigger Template](docs/reference/CVF_POST_CLOSURE_REASSESSMENT_TRIGGER_TEMPLATE.md)
- [Post-Closure Reassessment Hold](docs/reviews/CVF_POST_CLOSURE_REASSESSMENT_TRIGGER_HOLD_2026-03-20.md)

## Governance & Evidence

CVF treats governance as an executable system, not just documentation. Critical controls now have explicit owners such as:

- runtime guard
- gateway precondition
- approval checkpoint
- CI compatibility gate
- governance decision gate

The authoritative mapping lives in [CVF_GOVERNANCE_CONTROL_MATRIX.md](docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md).

Important current continuity controls:

- `GC-020` keeps pause/resume and agent transfer truthful through governed handoff and phase-bounded context continuity
- `GC-021` allows `Fast Lane` for low-risk additive work inside an already-authorized tranche
- `GC-022` classifies durable memory records as `FULL_RECORD`, `SUMMARY_RECORD`, or `POINTER_RECORD` so future memory stays useful without over-recording

Mandatory guard index:

- `CVF_ACTIVE_ARCHIVE_GUARD.md`
- `CVF_ADR_GUARD.md`
- `CVF_AGENT_HANDOFF_GUARD.md`
- `CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`
- `CVF_ARCHITECTURE_CHECK_GUARD.md`
- `CVF_BASELINE_UPDATE_GUARD.md`
- `CVF_BOARDROOM_RUNTIME_GUARD.md`
- `CVF_BUG_DOCUMENTATION_GUARD.md`
- `CVF_CONFORMANCE_EXECUTION_PERFORMANCE_GUARD.md`
- `CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md`
- `CVF_DEPTH_AUDIT_GUARD.md`
- `CVF_DIAGRAM_VALIDATION_GUARD.md`
- `CVF_DOCUMENT_NAMING_GUARD.md`
- `CVF_DOCUMENT_STORAGE_GUARD.md`
- `CVF_EXTENSION_PACKAGE_CHECK_GUARD.md`
- `CVF_EXTENSION_VERSIONING_GUARD.md`
- `CVF_FAST_LANE_GOVERNANCE_GUARD.md`
- `CVF_GOVERNED_FILE_SIZE_GUARD.md`
- `CVF_GUARD_AUTHORING_STANDARD_GUARD.md`
- `CVF_GUARD_REGISTRY_GUARD.md`
- `CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md`
- `CVF_MEMORY_GOVERNANCE_GUARD.md`
- `CVF_MULTI_AGENT_REVIEW_DOC_GUARD.md`
- `CVF_PROGRESS_TRACKER_SYNC_GUARD.md`
- `CVF_PYTHON_AUTOMATION_SIZE_GUARD.md`
- `CVF_SESSION_GOVERNANCE_BOOTSTRAP_GUARD.md`
- `CVF_STRUCTURAL_CHANGE_AUDIT_GUARD.md`
- `CVF_TEST_DEPTH_CLASSIFICATION_GUARD.md`
- `CVF_TEST_DOCUMENTATION_GUARD.md`
- `CVF_TEST_PARTITION_OWNERSHIP_GUARD.md`
- `CVF_WORKSPACE_ISOLATION_GUARD.md`

Grouped management map:

- [CVF Guard Surface Classification](docs/reference/CVF_GUARD_SURFACE_CLASSIFICATION.md)

For future roadmap deepening:

- active-wave continuation is gated by `GC-018`
- continuation is not default-open after closure
- substantive active-path expansion must carry an explicit scored packet before implementation

For the current canonical chain, start from:

- [Docs Index](docs/INDEX.md)
- [Reference README](docs/reference/README.md)
- [Context Continuity Model](docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md)
- [Memory Record Classification](docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md)

## Contributing

For substantive changes:

1. update the affected code or docs
2. add the required baseline or review artifact
3. run the governance compatibility gates
4. keep claims truthful to the current baseline

Helpful entrypoints:

- [CHANGELOG](CHANGELOG.md)
- [Versioning Policy](docs/VERSIONING.md)
- [Incremental Test Log](docs/CVF_INCREMENTAL_TEST_LOG.md)
- [Architecture Decisions](docs/CVF_ARCHITECTURE_DECISIONS.md)

## License

Licensed under [CC BY-NC-ND 4.0](LICENSE).
