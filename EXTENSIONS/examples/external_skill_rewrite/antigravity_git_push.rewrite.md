# antigravity_git_push — CVF Rewrite

## Source Reference
Original skill sourced from external repository:
- antigravity-awesome-skills
- Category: Version Control / Git Automation

Source is treated as **high-risk external input** and is never executed directly.

---

## Extracted Intent

> Commit local changes and push them to a remote Git repository.

Key intent:
- Source control interaction
- External system modification
- Potential irreversible actions

---

## Capability Decision

⚠️ **Important:**  
This external skill is **NOT imported as-is**.

Instead, its intent is split into **two distinct capabilities**
to preserve control and auditability.

---

## Capability A — CHANGESET_PREPARATION

### Capability ID
`CHANGESET_PREPARATION`

### Description
Prepare a structured description of changes intended for version control.

### Scope
**Inputs**
- File diff summaries
- Commit message intent

**Outputs**
- Normalized changeset description
- Proposed commit metadata

### Non-Goals
- No repository mutation
- No commit
- No push

### Risk Level
**R1 — Controlled**

---

## Capability B — REPOSITORY_PUSH_REQUEST

### Capability ID
`REPOSITORY_PUSH_REQUEST`

### Description
Formally request permission to push a prepared changeset
to a remote repository.

### Scope
**Inputs**
- Approved changeset reference
- Target repository metadata

**Outputs**
- Push request artifact (NOT execution)

### Non-Goals
- No direct Git execution
- No credential handling
- No auto-approval

### Risk Level
**R3 — Critical**

---

## Explicitly Forbidden Capability

The following capability is **BANNED** in CVF v1.x:

```

AUTO_GIT_PUSH

```

Reason:
- External irreversible action
- Credential abuse risk
- Non-deterministic side effects
- Impossible rollback guarantees

---

## Required Controls

### For CHANGESET_PREPARATION
- Input validation
- Deterministic output
- Full audit logging

### For REPOSITORY_PUSH_REQUEST
- Human-in-the-loop approval
- Explicit target confirmation
- Dry-run verification
- Immutable audit trail

---

## Adapter Requirements

Adapter MUST:
- Block any git command execution
- Treat all operations as declarative
- Escalate R3 capabilities

Adapter MUST NOT:
- Store credentials
- Execute shell commands
- Infer approval

---

## Registry Registration

Registry entries:

### CHANGESET_PREPARATION
- Version: 1.0
- Lifecycle: ACTIVE
- Risk: R1

### REPOSITORY_PUSH_REQUEST
- Version: 1.0
- Lifecycle: ACTIVE
- Risk: R3

No registry entry exists for execution-level git operations.

---

## Audit Notes

Audit must record:
- Source extraction rationale
- Capability split decision
- Risk elevation justification
- Approval chain (if any)

Missing audit → request invalid.

---

## Rewrite Justification

This rewrite:
- Converts execution into intent declaration
- Splits power into reviewable stages
- Prevents silent external modification

---

## Canonical Status

This file is the **only CVF-compliant representation**
of the original antigravity git push skill.

Direct execution, automation, or agent-bound git push
is **explicitly non-compliant** with CVF.
```

