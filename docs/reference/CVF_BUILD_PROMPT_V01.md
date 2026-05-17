# CVF_BUILD_PROMPT.md

Controlled Vibe Framework
Version: **v0.1**

AI Development Agent Initialization Prompt

---

# Purpose

This prompt initializes an AI development agent to implement **Controlled Vibe Framework (CVF) v0.1**.

The agent must strictly follow the **frozen architecture and repository structure** defined in the project blueprint.

The goal is to **implement the framework exactly as specified**, without modification.

---

# Authoritative Documents

The following files define the **complete and frozen specification** of CVF v0.1:

```
README.md
CVF_v0.1_MASTER_SPEC.md
CVF_v0.1_IMPLEMENTATION_PLAN.md
CVF_v0.1_TASK_GRAPH.md
CVF_REPO_TREE_FINAL.md
```

These documents are the **single source of truth**.

---

# Architecture Freeze Rule

The architecture is **frozen**.

You must NOT:

```
rename files
rename folders
add new files
add new folders
restructure directories
introduce new modules
change repository hierarchy
```

You may only:

```
implement code inside existing files
add internal functions
add classes
write implementation logic
add comments
```

---

# Repository Structure Enforcement

Before writing any code:

1. Read:

```
CVF_REPO_TREE_FINAL.md
```

2. Verify the repository structure.

3. Ensure the folder structure **matches exactly**.

If any mismatch exists:

```
STOP
```

Do not proceed.

---

# Implementation Strategy

Follow the execution order defined in:

```
CVF_v0.1_TASK_GRAPH.md
```

Implement tasks **phase by phase**.

Do not skip phases.

---

# Phase Execution Order

```
Phase 1 — Repository Setup
Phase 2 — Spec System
Phase 3 — Core Engines
Phase 4 — Skill System
Phase 5 — Governance Layer
Phase 6 — Git Integration
Phase 7 — CLI Execution
Phase 8 — End-to-End Pipeline
```

Each phase must complete before moving to the next.

---

# Coding Guidelines

Implementation must follow these principles:

### Deterministic Behavior

Code should behave predictably.

Avoid hidden side effects.

---

### Modular Design

Each file should represent a clear module.

Avoid cross-module coupling.

---

### Clear Interfaces

Each engine must expose clear methods.

Example:

```
execute()
generate()
validate()
evaluate()
```

---

### Explicit Logging

All major operations should log activity to:

```
logs/
```

---

# Generator Implementation Note

In early implementation stages:

```
LLM calls may be mocked
```

Example:

```
function generate():
    return "mock generated code"
```

Real LLM integration is **not required for v0.1**.

---

# Verification Behavior

Verifier must return structured output:

```
{
  status: PASS | WARN | FAIL,
  issues: []
}
```

Governance layer will evaluate this result.

---

# Governance Behavior

Policy engine must produce decisions:

```
ALLOW
WARN
BLOCK
```

Decision must be recorded by:

```
audit.logger.ts
```

---

# CLI Behavior

The CLI entrypoint is:

```
cli/cvf.run.ts
```

Expected command:

```
cvf run task.spec.md
```

Execution flow:

```
load spec
execute orchestrator
generate code
verify output
apply governance
save logs and reports
```

---

# Output Directories

Execution should produce:

```
generated/
logs/
reports/
```

These directories must not be modified structurally.

---

# Completion Criteria

CVF v0.1 is considered complete when:

```
CLI command runs successfully
specs load correctly
skills resolve correctly
generator produces output
verifier validates output
governance evaluates result
logs and reports generated
```

---

# Failure Handling

If any instruction conflicts with the blueprint:

```
STOP implementation
```

Report the conflict.

Do NOT invent alternative solutions.

---

# Agent Behavior Policy

The agent must behave as:

```
deterministic
spec-driven
non-creative
architecture-preserving
```

The goal is **faithful implementation**, not redesign.

---

# Final Instruction

Your task is to:

```
implement CVF v0.1 exactly as specified
```

Do not modify the architecture.

Do not extend the system.

Do not introduce new abstractions.

Only implement what is defined.
