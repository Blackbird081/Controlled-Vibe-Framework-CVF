# CVF Architecture Map — v3.0

> **Developed by Tien - Tan Thuan Port@2026**  
> **Version:** v3.0 (branch `cvf-next`)  
> **Date:** 2026-03-06  
> **Status:** DRAFT — pending ADR-016 approval before merge to main

---

## Overview

Controlled Vibe Framework (CVF) is a **layered system** for building and governing AI-driven software development.

There are **two scopes**:

| Scope | Identity | Target audience |
|---|---|---|
| **CVF Core** | "Git for AI Development" | AI dev teams, early adopters |
| **CVF Full** | "AI Governance Framework" | Enterprise, regulated industries |

CVF Full = CVF Core + Verification Plugins + Observability.

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  CVF Full — AI Governance Framework                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer 2+ — Observability & Audit                        │   │
│  │  v1.7.x (Safety Runtime), v1.8.1 (Observability)        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer 1.5 — Development Governance                      │   │
│  │  v1.1.1 (Phase Gate), v1.1.2 (Hardening)                │   │
│  │  ├── artifact_integrity (GOVERNANCE_PIPELINE slot 1)     │   │
│  │  ├── state_enforcement  (GOVERNANCE_PIPELINE slot 2)     │   │
│  │  ├── diagram_validation (GOVERNANCE_PIPELINE slot 3)     │   │
│  │  ├── structural_diff    (GOVERNANCE_PIPELINE slot 4)     │   │
│  │  ├── scenario_simulator (GOVERNANCE_PIPELINE slot 5)     │   │
│  │  └── reports            (GOVERNANCE_PIPELINE slot 6)     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Layer 0 — CVF Core Foundation Primitives         (v3.0) │   │◄─ NEW
│  │  ├── Primitive 1: AI Commit (commit_id, lineage)          │   │
│  │  ├── Primitive 2: Artifact (contentHash, identity)        │   │
│  │  ├── Primitive 2+1: Artifact Staging (CANDIDATE→ACCEPTED) │   │
│  │  ├── Primitive 3: Process (stage sequence, gate-required) │   │
│  │  └── Artifact Ledger (append-only, content-addressed)     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## CVF Core — Layer 0 Modules

### Primitive 1: AI Commit (`ai_commit/`)

| File | Purpose |
|---|---|
| `ai.commit.schema.ts` | AICommit interface — 9 CommitTypes, commit_id, lineage |
| `ai.commit.parser.ts` | `createCommit()` (deterministic SHA-256), `verifyCommitIntegrity()` |
| `ai.commit.validator.ts` | 8 validation rules: RULE-01 to RULE-08 |

### Primitive 2+1: Artifact + Staging (`artifact_staging/`, `artifact_ledger/`)

| File | Purpose |
|---|---|
| `artifact.staging.ts` | 4-state machine: CANDIDATE→IN_GOVERNANCE→ACCEPTED/REJECTED |
| `artifact.ledger.ts` | Append-only content-addressed store. `getHistory()`, `getByHash()` |

### Primitive 3: Process Model (`process_model/`)

| File | Purpose |
|---|---|
| `process.model.ts` | CVFProcess, multi-process, gate-required advance, transition history |

---

## CVF Full — Layer 1.5 Modules

Implemented as `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/` and `CVF_v1.1.2` hardening.

| Module | v1.1.2 Feature | PIPELINE slot |
|---|---|---|
| `artifact_integrity/` | `verifyAllHashes()` + Trust Boundary | 1 |
| `state_enforcement/` | `detectDeadlocks()` + dead-end detection | 2 |
| `diagram_validation/` | Diagram-state consistency | 3 |
| `structural_diff/` | Architecture drift | 4 |
| `scenario_simulator/` | `detectAnomalies()` + `checkInvariants()` | 5 |
| `reports/` | `GovernanceAuditLog` + Hash Ledger snapshot | 6 |

Executor: `runtime/governance.executor.ts` (outside `/governance/` — see INV-E)

---

## Design Invariants (INV-A to INV-E)

| ID | Invariant |
|---|---|
| INV-A | AI must produce commits — no direct repo changes |
| INV-B | Artifact identity must be stable — `artifact_id` is path-independent |
| INV-C | Process transitions must be deterministic — gate required |
| INV-D | Governance must be deterministic — GOVERNANCE_PIPELINE order |
| INV-E | Verification must be pluggable — not hardcoded in core |

---

## Entry Points

| User type | Start here |
|---|---|
| I want to use CVF Core only | `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/index.ts` |
| I want full governance | `EXTENSIONS/CVF_v1.1.2*/runtime/governance.executor.ts` |
| I want the Architecture Map | This document |
| I want the Whitepaper | `docs/reference/CVF_WHITEPAPER_GIT_FOR_AI.md` |
| I want adoption guidance | `docs/reference/CVF_ADOPTION_STRATEGY.md` |
