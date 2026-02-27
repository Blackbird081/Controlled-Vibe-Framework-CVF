# CVF Versioning Policy

## Purpose
This document defines the **official versioning policy** for the Controlled Vibe Framework (CVF).

Goals:
- Enable controlled evolution of CVF
- Avoid breaking backward compatibility
- Keep CVF stable enough for long-term use and auditability

---

## Versioning Scheme

CVF uses **Semantic Versioning**:

```
MAJOR.MINOR[.PATCH]
```

Examples:
- `v1.0` — Foundation
- `v1.1` — Governance Refinement
- `v1.2` — Capability Extension
- `v1.3` — Implementation Toolkit
- `v1.6` — Agent Platform
- `v1.7.2` — Safety Dashboard
- `v1.7.3` — Runtime Adapter Hub

PATCH versions are used for sub-extensions within a minor version (e.g., v1.7.1, v1.7.2).

### Current Status

| Version | Name | Status | Date |
|---------|------|--------|------|
| v1.0 | Foundation | 🔒 FROZEN | 2025 |
| v1.1 | Governance Refinement | 🔒 FROZEN | 2025 |
| v1.2 | Capability Extension | 🔒 FROZEN | Jan 2026 |
| v1.3 | Implementation Toolkit | 🔒 FROZEN | Jan 29, 2026 |
| v1.6 | Agent Platform (Web App) | ✅ ACTIVE | Feb 06, 2026 |
| v1.6.1 | Governance Engine | ✅ ACTIVE | Feb 21, 2026 |
| v1.7 | Controlled Intelligence | ✅ STABLE | Feb 24, 2026 |
| v1.7.1 | Safety Runtime | ✅ STABLE | Feb 24, 2026 |
| v1.7.2 | Safety Dashboard | ✅ STABLE | Feb 24, 2026 |
| v1.7.3 | Runtime Adapter Hub | 🆕 NEW | Feb 28, 2026 |

---

## Version Meaning

### MAJOR Version
A **MAJOR** change occurs when:
- Core philosophy of CVF changes
- Core governance model changes
- Backward compatibility breaks

Examples:
- Redefining Phase structure
- Changing Decision model
- Changing authority hierarchy

⛔ These changes are **very rare**.

---

### MINOR Version
A **MINOR** change occurs when:
- New capability or extension added
- Governance clarified without breaking core
- CVF expanded in depth

Examples:
- CVF v1.2 — Capability Extension (Skill Contract, Registry, Lifecycle)
- CVF v1.6 — Agent Platform (Web UI, AI Chat, 34 Tools)
- CVF v1.7 — Controlled Intelligence (Reasoning gate, Entropy guard)

✔ Does not break existing v1.x usage  
✔ Does not require mandatory migration

---

### PATCH Version
A **PATCH** change occurs when:
- Sub-extension within a minor version
- Incremental functionality added

Examples:
- CVF v1.6.1 — Governance Engine (extends v1.6)
- CVF v1.7.1 — Safety Runtime (extends v1.7)
- CVF v1.7.2 — Safety Dashboard (extends v1.7.1)
- CVF v1.7.3 — Runtime Adapter Hub (extends v1.7.1)

---

## Version Scope

| Component | Versioning |
|-----------|-----------|
| CVF Core | Follows CVF version |
| Extensions | Tied to CVF version |
| Skill Contracts | Independent version |
| Capabilities | Immutable ID |
| Registry | Follows CVF version |

---

## Extension Versioning

Extensions **DO NOT** have independent versions.

Each extension:
- Belongs to a specific CVF version
- Must comply with the core of that version

Example:
- `CVF_v1.2_CAPABILITY_EXTENSION` is only valid in CVF v1.2+
- `CVF_v1.7_CONTROLLED_INTELLIGENCE` is only valid in CVF v1.7+

---

## Backward Compatibility Rules

- CVF always prioritizes backward compatibility
- Minor versions **must not break** existing behavior
- If breaking is needed:
  - Must bump MAJOR
  - Or create a new extension

---

## Deprecation Policy

A component is deprecated when:
- A better governance model exists
- A risk has been identified
- It no longer aligns with CVF philosophy

Deprecated components:
- Are not removed immediately
- Always have a clear reason
- Always have a replacement path (if available)

---

## Freeze & Stability

A version is considered **FROZEN** when:
- Architecture is finalized
- Governance is complete
- Scope is no longer expanded

After freeze:
- Allowed:
  - Fix typos
  - Clarify documentation
- Not allowed:
  - Add new capabilities
  - Add new governance rules
  - Change behavior

---

## Release Naming Convention

```
CVF vX.Y[.Z] – <Short Descriptor>
```

Examples:
- CVF v1.0 – Foundation
- CVF v1.1 – Governance Refinement
- CVF v1.2 – Capability Extension
- CVF v1.3 – Implementation Toolkit
- CVF v1.6 – Agent Platform
- CVF v1.6.1 – Governance Engine
- CVF v1.7 – Controlled Intelligence
- CVF v1.7.1 – Safety Runtime
- CVF v1.7.2 – Safety Dashboard
- CVF v1.7.3 – Runtime Adapter Hub

---

## Authority

- Version decisions belong to **CVF Core Authority**
- Agents, tools, or external systems **have no authority** to decide versions

---

## Canonical Status

This document is the **single source of truth** for CVF versioning.

All other interpretations are **not valid**.

---

*Updated: February 28, 2026*
