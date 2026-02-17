# CVF Progressive Disclosure Pattern Guide

> **Version:** 1.0  
> **Date:** 2026-02-18  
> **Inspired by:** Anthropic Skills Architecture, claude-code-templates  
> **Applies to:** All CVF skill definitions (.skill.md, .gov.md)

---

## 1. Overview

Progressive Disclosure is a pattern for structuring AI skills so that context is loaded **incrementally** rather than all at once. This reduces context window usage, improves response speed, and allows skills to scale without bloating the AI's working memory.

### The Problem

Loading all 20 agent skills and 124 user skills fully into context at once would consume ~500K+ tokens. Most interactions only need 1-3 skills.

### The Solution

Structure each skill with 4 layers that load progressively:

```
┌──────────────────────────────────────────────┐
│  Layer 1: METADATA (Always Loaded)           │
│  Name, description, risk level, triggers     │
│  ~50 tokens per skill                        │
├──────────────────────────────────────────────┤
│  Layer 2: INSTRUCTIONS (On Activation)       │
│  Step-by-step procedures, governance rules   │
│  ~500-2000 tokens per skill                  │
├──────────────────────────────────────────────┤
│  Layer 3: RESOURCES (On Demand)              │
│  Reference files, examples, templates        │
│  ~1000-5000 tokens per skill                 │
├──────────────────────────────────────────────┤
│  Layer 4: SCRIPTS (Execute Without Loading)  │
│  Shell scripts, code examples, automation    │
│  Referenced by path, not loaded into context  │
└──────────────────────────────────────────────┘
```

---

## 2. Layer Definitions

### Layer 1: Metadata (Always Loaded)

**Cost:** ~50 tokens per skill  
**When:** Always available in context catalog  
**Purpose:** Enable AI to decide which skills to activate

```markdown
---
id: AGT-015
name: Workflow Automation Hook
description: Manages pre/post-tool automation hooks for CI/CD, security scanning, and monitoring
risk: R2
autonomy: Supervised
domain: automation
triggers:
  - "set up automation"
  - "add pre-commit hook"
  - "configure CI/CD trigger"
  - "secret scanning"
dependencies: []
---
```

### Layer 2: Instructions (On Activation)

**Cost:** ~500-2000 tokens per skill  
**When:** Loaded when AI detects matching trigger or user explicitly requests skill  
**Purpose:** Provide step-by-step procedures and governance constraints

```markdown
## Instructions

### When to Use
Use for ANY automation trigger setup:
- Pre-tool checks (security, linting, validation)
- Post-tool actions (testing, notifications, logging)
- Git workflow hooks (pre-commit, post-merge)
- CI/CD pipeline integration

### Procedure
1. Identify trigger event type (PreToolUse, PostToolUse, etc.)
2. Define hook action and priority
3. Validate against governance constraints
4. Register hook with human approval
5. Test hook execution
6. Monitor and log results

### Governance
- Risk Level: R2 – Medium
- Requires human approval for hook registration
- Hook timeout: 10s max
- Allowed roles: Orchestrator, Builder
```

### Layer 3: Resources (On Demand)

**Cost:** ~1000-5000 tokens per skill  
**When:** Loaded only when AI explicitly needs reference material  
**Purpose:** Examples, templates, API docs

```markdown
## Resources

### Hook Template
[hook-template.json](./resources/hook-template.json)

### Example: Secret Scanner Hook
[secret-scanner-example.ts](./resources/secret-scanner-example.ts)

### Reference: Event Types
[event-types.md](./resources/event-types.md)
```

### Layer 4: Scripts (Execute Without Loading)

**Cost:** 0 tokens (referenced by path, never loaded)  
**When:** Executed when needed, output captured  
**Purpose:** Automation scripts, validation scripts, generators

```markdown
## Scripts

### Validate Hook Registration
Path: `./scripts/validate-hook.sh`
Usage: `bash validate-hook.sh <hook-name> <event-type>`

### Generate Hook Config
Path: `./scripts/generate-config.ts`
Usage: `npx ts-node generate-config.ts --type PreToolUse --action lint`
```

---

## 3. Implementation for CVF Skills

### 3.1 Directory Structure

```
governance/skill-library/registry/agent-skills/
├── AGT-015_WORKFLOW_AUTOMATION_HOOK.gov.md    ← Layer 2 (Instructions + Governance)
├── AGT-015/
│   ├── metadata.yaml                          ← Layer 1 (Metadata)
│   ├── resources/                             ← Layer 3 (Resources)
│   │   ├── hook-template.json
│   │   ├── event-types.md
│   │   └── examples/
│   └── scripts/                               ← Layer 4 (Scripts)
│       ├── validate-hook.sh
│       └── generate-config.ts
```

### 3.2 Metadata YAML Format

```yaml
# metadata.yaml - Layer 1 (Always loaded, ~50 tokens)
id: AGT-015
name: Workflow Automation Hook
version: "1.0"
description: >
  Manages pre/post-tool automation hooks for CI/CD integration,
  security scanning, auto-testing, and monitoring pipelines.
risk: R2
autonomy: supervised
domain: automation
roles: [Orchestrator, Builder]
phases: [Build, Review, Deploy]
triggers:
  - "automation hook"
  - "pre-commit"
  - "post-tool action"
  - "CI/CD trigger"
  - "secret scanner"
dependencies:
  - AGT-008  # File Write (for hook config files)
  - AGT-007  # File Read (for reading hook results)
references:
  - AGT-012  # Agentic Loop Controller (for complex hook chains)
```

### 3.3 Skill Composability

Skills can reference each other using the `dependencies` and `references` fields:

```yaml
# AGT-018 depends on AGT-012 (Agentic Loop Controller)
dependencies:
  - AGT-012  # Required: manages sub-agent execution loops
  - AGT-014  # Required: connects to MCP servers for tools

references:
  - AGT-015  # Optional: can trigger automation hooks
  - AGT-020  # Optional: can generate team performance dashboards
```

**Dependency types:**
- `dependencies` – Required skills that must be available
- `references` – Optional skills that enhance functionality

---

## 4. Context Budget Calculator

| Layer | Per Skill | 20 Agent Skills | 124 User Skills |
|-------|-----------|-----------------|-----------------|
| Metadata (always) | ~50 tokens | ~1,000 tokens | ~6,200 tokens |
| Instructions (on-demand) | ~1,000 tokens | Per use | Per use |
| Resources (explicit) | ~3,000 tokens | Per use | Per use |
| Scripts (never loaded) | 0 tokens | 0 | 0 |

**Savings:** Instead of loading all 144 skills (~200K tokens), the AI always has ~7,200 tokens of metadata and loads only active skills' instructions (~1-3K per skill on demand).

**Maximum context per interaction:** ~7,200 (metadata) + ~5,000 (2-3 active skills) = ~12,200 tokens

---

## 5. Migration Guide

### Converting Existing .skill.md Files

1. **Extract metadata** into `metadata.yaml` (Layer 1)
2. **Keep governance and instructions** in `.gov.md` or `.skill.md` (Layer 2)
3. **Move examples** to `resources/` directory (Layer 3)
4. **Move scripts** to `scripts/` directory (Layer 4)

### Example: Converting USR-045 Code Review

**Before (single file, ~2000 tokens always loaded):**
```
USR-045_code_review.skill.md
```

**After (progressive, ~50 tokens always loaded):**
```
USR-045_code_review/
├── metadata.yaml          ← 50 tokens (always)
├── USR-045.skill.md       ← 1500 tokens (on-demand)
└── resources/
    ├── checklist.md        ← 500 tokens (explicit)
    └── examples/
        └── review-output-example.md
```

---

## 6. References

- Anthropic Skills Architecture: https://github.com/anthropics/skills
- claude-code-templates Skills Pattern: https://github.com/davila7/claude-code-templates
- CVF Skill Spec: `governance/skill-library/specs/CVF_SKILL_SPEC.md`
- AGT-019 (Skill Progressive Loader): Manages this pattern at runtime
