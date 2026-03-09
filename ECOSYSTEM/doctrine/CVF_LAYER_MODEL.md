# CVF Layer Model

## Purpose

This document defines the **official layer architecture of the CVF Ecosystem**.

The layer model exists to ensure that:

* the repository structure remains **coherent and scalable**
* **AI agents build systems correctly**
* **contributors cannot break the architecture**
* the **CVF governance model stays consistent**

This document is part of **CVF Doctrine** and is **frozen unless a major architectural revision occurs**.

---

# Layer Overview

The CVF ecosystem is organized into **seven architectural layers**.

Each layer has a **clear responsibility**, and dependencies must always flow **downward only**.

```
L0 — Doctrine
L1 — System Definition
L2 — Build Protocol
L3 — Operating Model
L4 — Product Implementation
L5 — Governance Modules
L6 — Ecosystem Layer
```

Higher layers define **principles and rules**, while lower layers contain **implementation and usage**.

---

# L0 — Doctrine

The **highest layer of the CVF ecosystem**.

This layer defines the **core philosophy, architecture principles, and system worldview**.

Files in this layer must be **stable and rarely changed**.

Location:

```
/doctrine
```

Contents:

* CVF_PRODUCT_POSITIONING.md
* CVF_ARCHITECTURE_PRINCIPLES.md
* CVF_ECOSYSTEM_MAP.md
* CVF_LAYER_MODEL.md

Responsibilities:

* Define **what CVF is**
* Define **why the system exists**
* Define **the architectural philosophy**
* Define **the ecosystem structure**

This layer acts as the **constitution of the CVF ecosystem**.

---

# L1 — System Definition

This layer defines the **system identity and structural overview of CVF**.

Location:

```
/system
```

Contents:

* CVF_PROJECT_MANIFEST.md

Responsibilities:

* Provide a **single entry point** to understand the system
* Describe the **core system components**
* Provide a **map for agents and contributors**

The System Definition layer translates **doctrine into system form**.

---

# L2 — Build Protocol

This layer defines **how AI agents and developers build systems within CVF**.

Location:

```
/protocols
```

Contents:

* CVF_AGENT_BUILD_PROTOCOL.md

Responsibilities:

* Define **agent build behavior**
* Standardize **spec-driven development**
* Define **how new systems are created inside the CVF ecosystem**

This layer ensures **consistent construction of AI systems**.

---

# L3 — Operating Model

This layer defines **how humans interact with and operate the CVF ecosystem**.

Location:

```
/operating-model
```

Contents:

* CVF_AGENT_OPERATING_MODEL.md
* CVF_BUILDER_MODEL.md

Responsibilities:

* Explain **how agents are used**
* Explain **how builders create AI systems**
* Support **non-coder AI system builders**

This layer is focused on **human usage of CVF**.

---

# L4 — Product Implementation

This layer contains **the actual implementation of CVF products**.

Location:

```
/cvf-core
```

Contents (example for v0.1):

* CVF_v0.1_MASTER_SPEC.md
* CVF_v0.1_IMPLEMENTATION_PLAN.md
* CVF_v0.1_TASK_GRAPH.md
* CVF_REPO_TREE_FINAL.md
* CVF_BUILD_PROMPT.md

Responsibilities:

* Implement **CVF Agent Guard**
* Provide **versioned product releases**
* Define **implementation tasks and architecture**

This layer represents the **concrete product built on top of the CVF doctrine**.

---

# L5 — Governance Modules

This layer contains **the core governance infrastructure modules** of CVF.

Location:

```
/agents
/policy
/audit
/identity
```

These modules correspond to the **core governance stack**:

```
Policy
Identity
Execution
Audit
```

Module mapping:

| Core Function | Module    |
| ------------- | --------- |
| Policy        | /policy   |
| Identity      | /identity |
| Execution     | /agents   |
| Audit         | /audit    |

Responsibilities:

* enforce governance policies
* manage agent identity
* execute controlled agent actions
* provide auditability and traceability

This layer forms the **core infrastructure of AI agent governance**.

---

# L6 — Ecosystem Layer

This layer supports the **broader CVF ecosystem**.

Location:

```
/examples
/docs
```

Responsibilities:

* provide example systems
* demonstrate usage patterns
* support documentation and guides
* help new contributors understand CVF

This layer is intended for **learning, onboarding, and ecosystem expansion**.

---

# Dependency Rules

Dependencies must always follow this direction:

```
L6 → L5 → L4 → L3 → L2 → L1 → L0
```

Rules:

* Lower layers **must never modify higher layers**
* Higher layers **must not depend on lower layers**
* Doctrine must remain **independent from implementation**

Violating these rules will **break the architecture**.

---

# Repository Integrity Rules

To protect the architecture:

1. New files must be placed in the **correct layer**.
2. New folders must not introduce **new architectural layers**.
3. Changes to the Doctrine layer require **explicit architectural approval**.

AI agents contributing to the repository must follow the **layer model strictly**.

---

# Architectural Intent

The CVF layer model exists to support the long-term goal of the project:

**Running AI agents safely at scale.**

By enforcing strict layering, the CVF ecosystem can grow into a **stable governance infrastructure for autonomous AI systems**.

---

# Status

Frozen — CVF Doctrine
