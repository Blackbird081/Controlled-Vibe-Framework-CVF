# SKILL DEPRECATION RULES
Lifecycle Control for CVF Skills

> **Version:** 1.0.0  
> **Status:** Active  
> **Related:** [v1.2 CAPABILITY_LIFECYCLE](../../../EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/CAPABILITY_LIFECYCLE.md)

## 1. Purpose

This document defines how CVF skills are reviewed,
restricted, or removed over time.

CVF assumes that all skills eventually become outdated or risky.

---

## 2. Deprecation Triggers

A skill MUST be reviewed when:
- Its risk profile changes
- A safer alternative exists
- Its original intent is no longer valid
- Audit violations occur
- External dependencies change

---

## 3. Deprecation States

- Active
- Restricted
- Deprecated
- Retired

Each state change requires documentation.

---

## 4. Mandatory Review Cycle

Every skill MUST undergo periodic review:
- Risk reassessment
- Usage analysis
- Authority validation

Review intervals are defined by risk level.

---

## 5. Emergency Deprecation

CVF allows immediate restriction or shutdown of a skill
when:
- Unacceptable risk is detected
- Governance rules are violated

Emergency actions MUST be logged retroactively.

---

## 6. Core Principle

Removing a skill is considered a sign of framework maturity,
not failure.
