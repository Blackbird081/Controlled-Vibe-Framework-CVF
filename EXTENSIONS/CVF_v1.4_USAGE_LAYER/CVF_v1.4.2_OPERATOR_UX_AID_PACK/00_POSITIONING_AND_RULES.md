# POSITIONING AND RULES – CVF v1.4.2

> This document defines **where v1.4.2 is allowed to operate** and **where it must never intervene**.

---

## 1. Absolute Positioning

CVF v1.4.2 is a **pre‑execution and post‑execution aid only**.

It exists **outside** the execution boundary defined by CVF core.

At no time may v1.4.2:

* participate in execution,
* modify prompts mid‑run,
* alter AI behavior,
* reinterpret results.

If this boundary is crossed, v1.4.2 becomes invalid by definition.

---

## 2. Allowed Zones

v1.4.2 MAY be used in the following zones only:

1. **Before execution**

   * clarifying intent
   * structuring input
   * validating scope

2. **After execution**

   * reviewing trace completeness
   * understanding failure types
   * deciding stop / rerun / accept

No other zones are permitted.

---

## 3. Forbidden Zones (Hard Prohibition)

v1.4.2 MUST NOT be used:

* during live execution
* to "fix" or rewrite outputs
* to override CVF enforcement
* to justify boundary violations

Visuals, templates, or helpers must never be cited as a reason to bypass CVF rules.

---

## 4. Relationship to CVF Core

v1.4.2:

* references CVF core rules
* does not reinterpret them
* does not extend them

All authority remains with:

* CVF v1.3.1 core
* operator responsibility

---

## 5. Operator Accountability

Using v1.4.2 does **not**:

* reduce operator responsibility
* transfer decision ownership
* create shared accountability

All decisions remain traceable to the operator.

---

## 6. Removal Safety

CVF must remain fully valid if:

* v1.4.2 is partially used
* v1.4.2 is entirely removed

Any dependency that breaks this rule is a design failure.

---

## 7. Enforcement Statement

If a conflict arises between:

* CVF core rules
* v1.4.2 guidance

**CVF core rules always prevail**.

This document exists to prevent ambiguity, not to introduce new authority.
