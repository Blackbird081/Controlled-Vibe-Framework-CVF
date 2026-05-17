# CVF Ecosystem Governance Contract

> **Status:** CANONICAL
> **Version:** 1.0.0
> **Date:** 2026-03-09
> **Closes:** W1 — Unified Governance Control Plane
> **ADR:** ADR-021 (ECOSYSTEM Restructure)

---

## 1. Purpose

This document defines the **single-source governance contract** for the entire CVF ecosystem. All extensions, runtimes, guards, and tools MUST reference this contract as the authoritative source of governance state.

**Problem solved:** Before this contract, governance state was distributed across multiple files and extensions — each reading different sources, potentially drifting. This contract establishes ONE canonical truth.

---

## 2. Governance State Schema

Every runtime consumer reads governance state from the same schema:

```json
{
  "schemaVersion": "2026-03-09",
  "policyVersion": "v1.1.2",
  "ecosystem": {
    "doctrineVersion": "1.0.0-FROZEN",
    "operatingModelVersion": "1.0.0",
    "strategyVersion": "2026-03-09"
  },
  "controlPlane": {
    "auditPhase": "PHASE_GATE",
    "pipeline": [
      "artifact_integrity",
      "state_enforcement",
      "diagram_validation",
      "structural_diff",
      "scenario_simulator",
      "reports"
    ],
    "requiredTraceFields": [
      "requestId",
      "traceBatch",
      "traceHash",
      "policyVersion"
    ]
  },
  "riskModel": {
    "levels": ["R0", "R1", "R2", "R3"],
    "defaultLevel": "R1",
    "escalationThreshold": "R2"
  },
  "agents": {
    "registrySource": "governance/toolkit/03_CONTROL/CVF_AGENT_REGISTRY.md",
    "uatSource": "governance/toolkit/04_TESTING/CVF_SELF_UAT_DECISION_LOG.md",
    "stateSnapshot": "docs/reference/CVF_GOVERNANCE_STATE_REGISTRY.json"
  },
  "conformance": {
    "scenarioCount": 84,
    "criticalAnchors": 18,
    "coverageGroups": 17,
    "goldenBaseline": "docs/baselines/CVF_CONFORMANCE_GOLDEN_BASELINE_2026-03-07.json"
  },
  "guards": {
    "registrySource": "README.md (Mandatory Guards table)",
    "knowledgeBase": "docs/CVF_CORE_KNOWLEDGE_BASE.md (Section XIV)",
    "autoCheck": "governance/compat/check_guard_registry.py"
  }
}
```

---

## 3. Source of Truth Hierarchy

| Priority | Source | Governs | Consumers |
|----------|--------|---------|-----------|
| **1** | `ECOSYSTEM/doctrine/` | WHY — principles, positioning, identity | All layers |
| **2** | This contract | HOW — governance state, control plane | All runtimes, guards |
| **3** | `governance.control.plane.ts` | Runtime — pipeline, trace, audit | v1.1.1 executor, future extensions |
| **4** | `CVF_GOVERNANCE_STATE_REGISTRY.json` | State — agent registry, UAT status | Runtime consumers |
| **5** | Extension-local configs | Local — extension-specific overrides | Single extension |

**Rule:** Lower-priority sources MUST NOT contradict higher-priority sources. If conflict exists, higher-priority source wins.

---

## 4. Control Plane Binding

### 4.1 Canonical Control Plane

The canonical control plane is defined in:

```
EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/control_plane/governance.control.plane.ts
```

All extensions that perform governance checks MUST use `GovernanceControlPlane` from this module, or create a compatible instance via `createGovernanceControlPlane()`.

### 4.2 Pipeline Order (Immutable)

```
artifact_integrity → state_enforcement → diagram_validation → structural_diff → scenario_simulator → reports
```

This order is canonical. Extensions MUST NOT reorder the pipeline.

### 4.3 Required Trace Fields

Every governance execution MUST produce trace metadata containing:

| Field | Required | Purpose |
|-------|----------|---------|
| `requestId` | Yes | Unique request identifier |
| `traceBatch` | Yes | Batch grouping for related operations |
| `traceHash` | Yes | Integrity hash of the trace |
| `policyVersion` | Yes | Which policy version was applied |

---

## 5. Extension Compliance Rules

### 5.1 Reading Governance State

Every extension MUST:

1. Import `GovernanceControlPlane` interface (or read this contract)
2. Use `DEFAULT_GOVERNANCE_CONTROL_PLANE` unless a justified override exists
3. Record `policyVersion` in all audit outputs
4. Never hardcode governance state — always reference the canonical source

### 5.2 Writing Governance State

Only these processes may update governance state:

| Process | Updates | Trigger |
|---------|---------|---------|
| `export_cvf_governance_state_registry.py` | Agent registry snapshot | Agent/UAT changes |
| `check_guard_registry.py` | Guard sync verification | New guard added |
| `GovernanceExecutor.run()` | Audit log entries | Governance execution |

### 5.3 Drift Prevention

**Rule:** Any batch that materially changes governance state MUST:

1. Regenerate `CVF_GOVERNANCE_STATE_REGISTRY.json`
2. Verify `policyVersion` matches this contract
3. Run `check_guard_registry.py` if guards were added/modified

---

## 6. Conformance Gate

A governance check is considered PASS when:

```
✅ All pipeline modules return passed: true
✅ Overall gate status: APPROVED
✅ Trace metadata contains all required fields
✅ policyVersion matches this contract
```

---

## 7. Version Policy

| Field | Current Value | Update Rule |
|-------|---------------|-------------|
| `policyVersion` | `v1.1.2` | Bump on governance logic changes |
| `schemaVersion` | `2026-03-09` | Bump on schema structure changes |
| `doctrineVersion` | `1.0.0-FROZEN` | FROZEN — no changes unless ADR |
| `pipeline` | 6 modules | Append-only — new modules at end |
| `requiredTraceFields` | 4 fields | Append-only — never remove |

---

## 8. Backward Compatibility

This contract is **additive**:

- New fields may be added to the schema
- Existing fields are NEVER removed or renamed
- New pipeline modules are appended, never inserted
- New trace fields are appended, never removed
- Extensions built against older contract versions remain valid

---

## 9. Verification

### Manual Verification

```bash
# Verify guard registry is synchronized
python governance/compat/check_guard_registry.py

# Verify governance state registry is current
python scripts/export_cvf_governance_state_registry.py --output docs/reference/CVF_GOVERNANCE_STATE_REGISTRY.json
```

### Contract Test (for extension developers)

Any extension performing governance checks should verify:

1. `policyVersion` resolves to a non-empty string
2. `pipeline` contains all 6 canonical modules in order
3. `requiredTraceFields` contains at least `requestId` and `policyVersion`
4. Audit output includes `trace.policyVersion`

---

## 10. Cross-Reference

| Document | Role |
|----------|------|
| `ECOSYSTEM/doctrine/CVF_DOCTRINE_RULES.md` | Supreme authority — principles this contract implements |
| `governance.control.plane.ts` | Runtime implementation of this contract |
| `CVF_GOVERNANCE_STATE_REGISTRY.json` | Machine-readable state snapshot |
| `CVF_GOVERNANCE_STATE_REGISTRY.md` | Human-readable state documentation |
| `CVF_GUARD_REGISTRY_GUARD.md` | Meta-guard ensuring guard sync |
| `EXTENSIONS/ARCHITECTURE_SEPARATION_DIAGRAM.md` | Architecture context |
| `ECOSYSTEM/strategy/CVF_UNIFIED_ROADMAP_2026.md` | Roadmap context |
