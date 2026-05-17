# antigravity_d3_viz — CVF Rewrite

## Source Reference
Original skill sourced from external repository:
- antigravity-awesome-skills
- Category: Visualization / D3 Graphs

Source is treated as **untrusted input** and used only for intent extraction.

---

## Extracted Intent

> Transform structured data into interactive D3-based visualizations.

Key intent:
- Visual representation
- Data-driven
- No system modification

---

## Capability Definition

**Capability ID:** `DATA_VISUALIZATION_D3`

**Description:**
Generate D3-compatible visualization specifications
from structured input data.

---

## Capability Scope

### Inputs
- Structured datasets (JSON, tabular abstractions)
- Visualization parameters (optional)

### Outputs
- D3.js visualization spec
- SVG or DOM-level rendering instructions

---

## Explicit Non-Goals

Capability does NOT:
- Fetch external data
- Execute JavaScript
- Modify DOM directly
- Deploy visualization to production

---

## Risk Assessment

**Risk Level:** R1 — Controlled

### Risk Dimensions
- Interpretability: Low
- External Impact: None
- Irreversibility: None
- Authority: None

---

## Required Controls

- Input schema validation
- Output size limits
- No external execution hooks

---

## Skill Contract Summary

Contract guarantees:
- Deterministic output from same input
- No side effects
- No environment assumptions

Contract forbids:
- Inline script execution
- Network calls
- Embedded analytics

---

## Adapter Requirements

Adapter MUST:
- Strip executable code
- Enforce output format
- Validate against contract

Adapter MUST NOT:
- Inject runtime behavior
- Customize per agent
- Bypass registry

---

## Registry Registration

Registry entry:
- Capability: `DATA_VISUALIZATION_D3`
- Version: `1.0`
- Lifecycle: ACTIVE
- Risk: R1

---

## Audit Notes

Audit log records:
- Source reference
- Capability mapping decision
- Risk classification
- Adapter enforcement outcome

---

## Rewrite Justification

This rewrite:
- Removes agent coupling
- Removes prompt-based logic
- Converts freeform skill → governed capability

---

## Canonical Status

This file is the **CVF-approved rewrite** of the original
antigravity d3 visualization skill.

Original implementation **must not** be executed directly.
```

