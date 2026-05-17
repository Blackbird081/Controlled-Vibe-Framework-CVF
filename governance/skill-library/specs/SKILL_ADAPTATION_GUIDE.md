# SKILL ADAPTATION GUIDE
From External Capability to CVF-Compliant Skill

> **Version:** 1.0.0  
> **Status:** Active  
> **Related:** [v1.2 CAPABILITY_LIFECYCLE](../../../EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/CAPABILITY_LIFECYCLE.md)

## 1. Purpose

This guide defines how an accepted external skill is transformed
into a CVF-compliant internal skill.

**Adaptation is mandatory.**  
**Direct adoption is forbidden.**

---

## 2. Why Adaptation Exists

External skills are built for:
- Speed
- Convenience
- Maximum autonomy

CVF requires:
- Control
- Accountability
- Explicit authority boundaries

---

## 3. Adaptation Dimensions

Every adapted skill MUST be redefined across five dimensions:

1. Intent Clarification  
   - What decision or task this skill exists to support

2. Capability Narrowing  
   - Remove unnecessary features
   - Limit scope intentionally

3. Risk Reprofiling  
   - Explicit failure scenarios
   - Safe degradation behavior

4. Authority Binding  
   - Which agent roles may invoke the skill
   - Under which CVF phase
   - Under which context constraints

5. Audit Instrumentation  
   - Mandatory logging points
   - Decision trace references

---

## 4. Forbidden Adaptation Patterns

- Wrapping the skill without understanding it
- Exposing full capability "just in case"
- Allowing self-triggered execution
- Allowing cross-phase invocation

---

## 5. Adaptation Outcome

An adapted skill is no longer considered an "external skill".
It becomes a **CVF Skill Instance** with:
- Explicit boundaries
- Known risks
- Assigned responsibility

---

## 6. Ownership Rule

Every adapted skill MUST have:
- A human owner
- A defined deprecation review cycle
