# AGT-019: Skill Progressive Loader

> **Type:** Agent Skill  
> **Domain:** Skill Management  
> **Status:** Active

---

## Source

Inspired by claude-code-templates progressive disclosure pattern (Anthropic's skill architecture: metadata → instructions → resources → scripts) and skill composability patterns.  
Reference: https://github.com/anthropics/skills  
Implementation in v1.6 AGENT_PLATFORM.  
Skill mapping: `governance/skill-library/examples/AGT-019_SKILL_PROGRESSIVE_LOADER.md`

---

## Capability

Manages dynamic loading of skill definitions using progressive disclosure — loading only the necessary layers (metadata, instructions, resources, scripts) based on context needs. Minimizes context window usage while maximizing skill availability.

**Actions:**
- Maintain skill catalog with metadata always available (name, description, risk level)
- Load skill instructions on-demand when skill is triggered
- Attach skill resources (reference files, examples) only when explicitly needed
- Execute skill scripts without loading script code into context
- Manage skill dependencies and cross-references
- Cache frequently used skill layers for performance
- Report context budget usage per loaded skill

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R0 – Minimal** |
| Allowed Roles | All |
| Allowed Phases | All |
| Decision Scope | Operational |
| Autonomy | Auto (read-only catalog and loader) |

---

## Risk Justification

- **Read-only** – Only reads and loads skill definitions, no mutations
- **Context management** – Optimizes context window usage
- **No external access** – All skill definitions are local
- **No execution** – Scripts are referenced, not executed by this skill
- **Cacheable** – Loaded skill layers can be safely cached
- **Stateless** – Each loading operation is independent

---

## Constraints

- ✅ Metadata layer always available without explicit loading
- ✅ Instructions loaded only when skill activation is detected
- ✅ Resources loaded only when explicitly requested by agent
- ✅ Script references provided without loading script content
- ✅ Context budget tracked and reported per loaded skill
- ✅ Skill dependencies resolved automatically
- ❌ Cannot modify skill definitions (read-only)
- ❌ Cannot execute scripts directly (only reference them)
- ❌ Cannot load skills that violate current role/phase governance
- ❌ Cannot exceed context budget limits

---

## UAT Binding

**PASS criteria:**
- [ ] Metadata available without explicit skill loading
- [ ] Instructions loaded only on skill activation
- [ ] Resources loaded only on explicit request
- [ ] Context budget reported accurately
- [ ] Skill dependencies resolved correctly

**FAIL criteria:**
- [ ] All skill layers loaded eagerly (wasting context)
- [ ] Skill definitions modified by loader
- [ ] Scripts executed without proper governance check
- [ ] Context budget exceeded without warning
