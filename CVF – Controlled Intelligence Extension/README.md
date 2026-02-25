# CVF – Controlled Intelligence Extension

## Version 1.7.0

> **This extension is part of the [Controlled Vibe Framework (CVF)](../../README.md).**  
> CVF gốc (v1.0–v1.6) là chuẩn tuyệt đối. Extension này tự động hóa agent execution bên dưới CVF.

---

## Relationship to Base CVF

This extension provides a **TypeScript agent runtime layer** that operates *under* the base CVF framework:

- **CVF gốc** = human process (4 phases, R0–R3 risk, 124 skills)
- **Extension** = automated enforcement (policy engine, role transitions, telemetry)

The extension does **NOT** replace CVF. It automates enforcement within CVF phases.

→ See [INTEGRATION.md](INTEGRATION.md) for full mapping: risk R0–R3 ↔ riskScore, CVF phases ↔ AgentRoles.

---

## Architecture

CVF is a governance-first intelligence architecture.

It is NOT:
- A multi-agent mesh
- A self-modifying autonomous system
- A stochastic experimentation engine

It IS:
- A Single-Agent Multi-Role system
- Deterministic-first
- Governance-enforced
- Audit-ready
- Version-controlled learning architecture

---

## Core Principles

### 1. Governance Above Intelligence
No reasoning step can override governance rules. R3 → hard BLOCK, always.

### 2. Single Agent – Multi Role
CVF prefers internal role transition over multiple agents with divergent logic.
Roles map to CVF phases: Phase A→RESEARCH, B→DESIGN, C→BUILD, D→REVIEW.

### 3. Determinism Over Randomness
Temperature is controlled. Entropy is self-calculated when possible.
Snapshots include prompt hash for true reproducibility.

### 4. Learning Without Mutation
Lessons are versioned, conflict-checked (keyword similarity), persisted to disk.
Injected, not auto-applied.

### 5. Measured Intelligence
CVF tracks (all persisted to `.jsonl`):
- Mistake rate (time-windowed)
- Elegance score (weighted + trended)
- Verification score (time-tracked)
- Governance events (append-only audit log)

---

## Architectural Layers

1. **Core** — Governance, Risk (R0–R3), Rollback (persisted), Skill Registry
2. **Intelligence** — Controlled reasoning, role transitions, entropy guard, introspection
3. **Learning** — Versioned lessons, conflict detection, injection
4. **Telemetry** — Persisted metrics, time series, audit log

---

## Design Philosophy

Quality > Quantity  
Control > Autonomy  
Structure > Chaos  
Determinism > Drift  
Governance > Intelligence  
**CVF gốc > Extension**