# Changelog

## [1.7.0] – Controlled Intelligence Extension

### Core Architecture
- Role Transition Guard (controlled role graph)
- Context Segmentation Layer (pruning, forking, summary injection)
- Determinism Control (entropy guard + temperature policy)
- Reproducibility Snapshot (prompt hash + model version tracking)
- Introspection Layer (self-check, audit, deviation report, correction plan)
- Learning Registry with rule versioning and conflict detection
- Telemetry metrics (mistake rate, elegance score, verification score)
- Governance Audit Log (append-only, persisted)

### Enterprise Hardening (29 issues resolved)

**Governance Integrity**
- `controlled.reasoning.ts` calls `bindPolicy()` directly — no caller bypass
- Thresholds imported from `governance.constants.ts` — no hardcodes
- Entropy blocks reasoning when unstable + risk elevated

**Role Consistency**
- `role.graph.ts` unified as re-export shim → single source of truth
- `transition.policy.ts` removed (dead code)
- Import paths standardized to `role.types.ts`

**Persistence Layer**
- `governance_audit_log.ts` → `cvf_audit.jsonl`
- `lesson.store.ts` → `cvf_lessons.json`
- `rollback.manager.ts` → `cvf_rollback.jsonl`
- `mistake_rate_tracker.ts` → `cvf_telemetry_mistakes.jsonl` (time-windowed)
- `elegance_score_tracker.ts` → `cvf_telemetry_elegance.jsonl` (weighted + trended)
- `verification_metrics.ts` → `cvf_telemetry_verification.jsonl` (time-tracked)

**CVF Base Integration**
- `risk.mapping.ts` — R0–R3 ↔ riskScore 0.0–1.0
- `role.mapping.ts` — CVF phases A/B/C/D ↔ AgentRole
- `INTEGRATION.md` — architecture relationship documentation

**Input Hardening**
- `prompt.sanitizer.ts` — injection detection (STRIP/BLOCK/LOG)
- `recursion.guard.ts` — max depth, oscillation detection, session lock
- `anomaly.detector.ts` — telemetry triggers NORMAL → STRICT → LOCKDOWN

**Learning Integrity**
- `lesson.schema.ts` — severity, rootCause, preventionRule, riskLevel fields
- `conflict.detector.ts` — keyword similarity (Jaccard ≥ 40%) + root cause
- `lesson.signing.ts` — deterministic integrity hash + verification
- `binding.registry.ts` — connected to skill.registry + role.mapping

**Determinism**
- `entropy.guard.ts` — self-calculates variance from tokenProbabilities
- `reproducibility.snapshot.ts` — prompt hash + snapshotId + modelVersion

### Reasoning Pipeline
```
Input → Sanitizer → Recursion Guard → Governance → Entropy → Prompt → Snapshot
```

### Architectural Philosophy
- Single-Agent Multi-Role reinforced
- Governance remains top authority
- Learning is versioned, signed, and controlled
- Telemetry becomes protective (anomaly detection)
- CVF gốc is the absolute standard; extension adapts to it