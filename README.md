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
[![CI](https://img.shields.io/badge/CI-governed%20verification%20active-brightgreen.svg)](.github/workflows/cvf-ci.yml)
[![Architecture](https://img.shields.io/badge/Architecture-v3.7--W46T1%20CLOSURE--ASSESSED-blue.svg)](docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md)

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

## Front-Door Path

Use the root front door in this order:

1. `README.md` for role-based triage and current posture
2. `START_HERE.md` for the shortest audience-routed redirect
3. `ARCHITECTURE.md` for the system-shape view before deeper internal references

If you want the deeper private-core chain after that, use [Docs Index](docs/INDEX.md).

If you need the current canonical continuation posture after `W54-T1`, use:

- [Agent Handoff](AGENT_HANDOFF.md)
- [Whitepaper Progress Tracker](docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md)
- [Master Architecture Closure Roadmap](docs/roadmaps/CVF_MASTER_ARCHITECTURE_CLOSURE_ROADMAP_2026-04-05.md)
- [New Machine Setup Checklist](docs/reference/CVF_NEW_MACHINE_SETUP_CHECKLIST.md)

## What CVF Is

CVF is a governance-first control plane for AI-assisted execution. Its active reference path is built around one canonical controlled loop:

`INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE`

What CVF is good at:

- keeping human approval and audit evidence inside the delivery loop
- enforcing phase, role, risk, scope, and mutation boundaries
- giving both coder-facing and non-coder paths a governed execution model
- keeping provider choice user-owned while routing, policy, and evidence stay CVF-governed
- preserving reconciliation records so future audits are faster and cheaper

## Core Value: Governed Provider Hub

CVF is not meant to be a wrapper for one model vendor. The product-level value is a **governed provider hub**:

- users can enable the provider keys they actually want to use
- CVF keeps routing, policy, trace capture, and evidence discipline consistent across those providers
- provider choice stays flexible, while governance stays centralized

For product-value proof, CVF uses the concept of a **run lane**:

- a run lane is one governed `provider + model` configuration admitted by the CVF hub
- when a user enables `Gemini`, `Alibaba`, `OpenAI`, `Claude`, or another supported provider, that configuration can become a separate validation lane
- CVF should prove value in two ways:
  - across multiple run lanes, to show the hub is truly model-agnostic in real use
  - within a matched run lane, to show the extra value comes from CVF governance rather than from switching to a different model

This is the key distinction between "CVF looks well-architected" and "CVF has proven product value."

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
| New reader / General evaluator | [Getting Started](docs/GET_STARTED.md) and [Quick Orientation](docs/guides/CVF_QUICK_ORIENTATION.md) |
| Builder / Integrator | [Controlled Execution Loop](docs/concepts/controlled-execution-loop.md) and [Reference Governed Loop](docs/reference/CVF_REFERENCE_GOVERNED_LOOP.md) |
| Non-coder / Operator | [Getting Started](docs/GET_STARTED.md) and [Non-Coder Governed Packet](docs/reference/CVF_NONCODER_REFERENCE_GOVERNED_PACKET.md) |
| Architecture reader | [Architecture](ARCHITECTURE.md), [Architecture Map](docs/reference/CVF_ARCHITECTURE_MAP.md), and [Ecosystem Architecture](CVF_ECOSYSTEM_ARCHITECTURE.md) |

### Quick Run: Web UI

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm ci
npm run dev
```

Then open `http://localhost:3000`.

In `Settings`, enable the provider keys you want to use. Each admitted `provider + model` pair is treated as a governed run lane for future Product Value Validation.

### Quick Run: Workspace Bootstrap

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\new-cvf-workspace.ps1 `
  -WorkspaceRoot "D:\CVF-Workspace" `
  -ProjectName "My-Project"
```

See [Workspace Isolation Guard](governance/toolkit/05_OPERATION/CVF_WORKSPACE_ISOLATION_GUARD.md).

### Moving To A New Machine

Use [New Machine Setup Checklist](docs/reference/CVF_NEW_MACHINE_SETUP_CHECKLIST.md).
The default CVF rule is: clone first, then install only inside the extension you are actively using.
Use `npm ci` when that package already has `package-lock.json`; otherwise use `npm install`.

### New Machine Quick Start

Fresh clone, one extension only:

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF/EXTENSIONS/<target-extension>
npm ci   # if package-lock.json exists
# or: npm install   # if that package has no lockfile
```

If you need all 4 foundations ready at once, use:

```powershell
.\scripts\bootstrap_foundations.ps1
```

```bash
./scripts/bootstrap_foundations.sh
```

## Current Status

Current posture on the active reference path:

| Area | Status |
|---|---|
| Architecture baseline | `v3.7-W46T1 CLOSURE-ASSESSED` |
| MC sequence | `MC1-MC5 FULLY COMPLETE` |
| PVV one-provider checkpoint | `ALIBABA MULTI-ROLE CONFIRMED / PAUSED BY OPERATOR` |
| Post-closure integration wave | `CVF ADDING NEW + Windows_Skill_Normalization INTEGRATED` |
| Runnable inherited upgrade surface | ``cvf-web`` `/api/governance/external-assets/prepare` |
| Latest verified local counts | CPF 2999 / EPF 1301 / GEF 625 / LPF 1493 / cvf-web 1872 |
| Canonical phase model | `ALIGNED` |
| Hardened default guard path | `ALIGNED` |
| Web non-coder semantics | `SUBSTANTIALLY ALIGNED` |
| Cross-extension workflow realism | `SUBSTANTIALLY ALIGNED` |
| Governance executable ownership | `SUBSTANTIALLY ALIGNED` |
| End-to-end controlled autonomy loop | `SUBSTANTIALLY ALIGNED` |
| Continuation-stop governance (`GC-018`) | `ALIGNED` |

Read this status as:

- the MC1-MC5 architecture baseline is complete and CLOSURE-ASSESSED
- the one-provider / Alibaba / multi-role PVV checkpoint is sufficient for the current internal pause point
- the post-closure integration wave is no longer docs-only; a bounded runnable governance surface now exists in `cvf-web`
- the latest verified local baseline is CPF `2999`, EPF `1301`, GEF `625`, LPF `1493`, and `cvf-web` `1872`
- the active path has no open tranche and remains `SUBSTANTIALLY DELIVERED`
- relocation is closed-by-default; next work should follow the Post-MC5 Continuation Strategy
- future expansion must go through scan continuity review, reassessment, or a fresh bounded `GC-018`

### Newly Runnable Upgrade Surface

The post-closure additions from `CVF ADDING NEW` and `Windows_Skill_Normalization` now have a bounded executable inheritance path in `cvf-web`:

- `POST /api/governance/external-assets/prepare`
- flow: `external intake -> semantic classification -> planner heuristics -> provisional signal -> W7 normalization -> registry-ready preparation`
- optional Windows compatibility review
- intentionally separate from `/api/execute` and the paused provider-lane PVV stream

This is the current proof that the upgrade wave is not only canon/docs work anymore.

Primary status anchors:

- [Agent Handoff](AGENT_HANDOFF.md)
- [PVV Alibaba Pause Checkpoint](docs/assessments/CVF_PVV_ALIBABA_MULTI_ROLE_PAUSE_CHECKPOINT_2026-04-12.md)
- [Product Value Validation Wave Roadmap](docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md)
- [Next Development Direction Review](docs/assessments/CVF_NEXT_DEVELOPMENT_DIRECTION_REVIEW_2026-04-13.md)
- [Post-MC5 Orientation](docs/guides/POST_MC5_ORIENTATION.md)
- [Post-MC5 Continuation Strategy](docs/roadmaps/CVF_POST_MC5_CONTINUATION_STRATEGY_ROADMAP_2026-04-08.md)
- [Whitepaper Progress Tracker](docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md)
- [Master Architecture Whitepaper](docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md)
- [Master Architecture Closure Roadmap](docs/roadmaps/CVF_MASTER_ARCHITECTURE_CLOSURE_ROADMAP_2026-04-05.md)
- [Surface Scan Continuity Registry](governance/compat/CVF_SURFACE_SCAN_REGISTRY.json)
- [Release Readiness Status](docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md)
- [Independent System Checkpoint](docs/reviews/CVF_INDEPENDENT_SYSTEM_CHECKPOINT_2026-03-20.md)
- [System Unification Reassessment](docs/reviews/CVF_SYSTEM_UNIFICATION_REASSESSMENT_2026-03-20.md)
- [System Unification Roadmap](docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md)

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
- foundational guard surface gate

The authoritative mapping lives in [CVF_GOVERNANCE_CONTROL_MATRIX.md](docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md).

Important current continuity controls:

- `GC-020` keeps pause/resume and agent transfer truthful through governed handoff and phase-bounded context continuity
- `GC-020` records the tracked remote branch in handoff; exact remote SHA must be derived live from git when needed rather than hand-maintained as a moving target
- `GC-021` allows `Fast Lane` for low-risk additive work inside an already-authorized tranche
- `GC-022` classifies durable memory records as `FULL_RECORD`, `SUMMARY_RECORD`, or `POINTER_RECORD` so future memory stays useful without over-recording
- `GC-032` requires governed artifact writing to stay source-truth-first, keep typed evidence explicit, and move continuity surfaces together when tranche posture changes

Foundational governance surfaces that used to depend mainly on reviewer discipline are now also blocked by `governance/compat/check_foundational_guard_surfaces.py`, covering ADR updates, architecture-baseline refresh, extension naming, structural audit packets, test-depth reporting, and workspace isolation.

Mandatory guard index:

- `CVF_ACTIVE_ARCHIVE_GUARD.md`
- `CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md`
- `CVF_ADR_GUARD.md`
- `CVF_AGENT_HANDOFF_GUARD.md`
- `CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`
- `CVF_ARCHITECTURE_CHECK_GUARD.md`
- `CVF_BATCH_CONTRACT_DETERMINISM_GUARD.md`
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
- `CVF_GOVERNED_ARTIFACT_AUTHORING_GUARD.md`
- `CVF_GUARD_AUTHORING_STANDARD_GUARD.md`
- `CVF_GUARD_REGISTRY_GUARD.md`
- `CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md`
- `CVF_MEMORY_GOVERNANCE_GUARD.md`
- `CVF_KNOWLEDGE_ABSORPTION_PRIORITY_GUARD.md`
- `CVF_TEMPLATE_SKILL_STANDARD_GUARD.md`
- `CVF_MULTI_AGENT_REVIEW_DOC_GUARD.md`
- `CVF_PUBLIC_SURFACE_MAINTAINABILITY_GUARD.md`
- `CVF_PRODUCT_VALUE_VALIDATION_GUARD.md`
- `CVF_PROGRESS_TRACKER_SYNC_GUARD.md`
- `CVF_PYTHON_AUTOMATION_SIZE_GUARD.md`
- `CVF_SHARED_BATCH_HELPER_ADOPTION_GUARD.md`
- `CVF_SESSION_GOVERNANCE_BOOTSTRAP_GUARD.md`
- `CVF_SURFACE_SCAN_CONTINUITY_GUARD.md`
- `CVF_STRUCTURAL_CHANGE_AUDIT_GUARD.md`
- `CVF_CANON_SUMMARY_EVIDENCE_SEPARATION_GUARD.md`
- `CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md`
- `CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md`
- `CVF_PREPUBLIC_P3_READINESS_GUARD.md`
- `CVF_BARREL_SMOKE_OWNERSHIP_GUARD.md`
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

For the current front-door chain, start from:

- [README](README.md)
- [Start Here](START_HERE.md)
- [Architecture](ARCHITECTURE.md)
- [Getting Started](docs/GET_STARTED.md)
- [Quick Orientation](docs/guides/CVF_QUICK_ORIENTATION.md)

For the deeper private-core chain, continue with:

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
