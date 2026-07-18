# CVF Capability Delivery Direction Decision Framework

## Purpose

Decision framework for agents choosing between two delivery directions when a new
capability is needed across CVF and a concrete product simultaneously.

This is a **two-way framework** — neither direction is universally correct. The right
choice depends on which preconditions are already met.

## Scope / Applies To

- All agents deciding how to deliver a new capability that spans both a CVF layer and a concrete product
- All LHW absorption wave dispatch decisions
- All GC-018 authorizations for new CVF modules

Memory class: FULL

**Authored:** 2026-06-08  
**Status:** OPERATOR_CONFIRMED  

## Claim Boundary

- Decision logic is operator-confirmed governance guidance, not a universal algorithm
- Example application (Gap 4) is source-verified as of 2026-06-08
- Future agents should re-evaluate conditions at their point in time — do not apply cached verdicts

---

## The Two Directions

### Huong B — CVF First, Products Inherit

```
Identify capability gap
  → build generic CVF module (L2–L5)
  → product inherits from CVF layer
  → consistent abstraction from day 1
```

**When this is correct:** The building blocks already exist in CVF; only assembly
into a workflow chain is needed. The capability is domain-agnostic and well-understood.
A second consumer is already waiting. The abstraction boundary is clear before writing
any code.

Example: Wiring an existing CVF L5 adapter into a new workflow chain — the pieces are
proven; only the connection is new.

### Huong A — Product First, Absorb Later

```
Identify capability gap
  → build concrete product implementation first
  → run against real data, observe failure modes
  → pattern proven → GC-018 LHW absorption wave
  → CVF module written from observed evidence
```

**When this is correct:** CVF currently has no implementation of this capability at all.
The domain requires specific knowledge that cannot be abstracted before observing real
data. Building CVF module first would mean engineering for a hypothetical consumer.

Example: A new retrieval method that requires tuning against a specific corpus type —
the domain-specific parameters are unknown until real data is processed.

---

## Decision Checklist

Before choosing a direction, evaluate these conditions:

| Condition | Points to Huong B | Points to Huong A |
|---|---|---|
| CVF already has related building blocks | YES | NO — capability is new to CVF entirely |
| Abstraction boundary is clear without product evidence | YES | NO — domain knowledge required first |
| Second consumer already identified and waiting | YES | NO — only one product needs it now |
| Capability is domain-agnostic | YES | NO — domain-specific tuning required |
| Time to ship CVF module does NOT block the product | YES | NO — product is urgent, CVF overhead blocks |

**If most conditions point to Huong B:** build CVF module first.  
**If most conditions point to Huong A:** build product implementation first, then absorb.  
**Mixed:** operator decides; record the reasoning.

---

## Rationale: Why This Is a Two-Way Framework

Huong B produces consistent, reusable CVF layers and is the right default **when
preconditions are met**. The governance overhead (GC-018, blind-spot control, source
verification, work order, review) is intentional and appropriate for proven abstractions.

Huong A is correct when CVF does not yet have the capability and domain knowledge is
required to build it properly. Building a CVF module before evidence exists produces
speculative governance — rules and contracts tuned for a hypothetical consumer rather
than observed behavior. CVF's own philosophy states:
> *"If a defect pattern repeats, promote it into a written rule."*
The inverse: **do not write a governance rule before the behavior exists to govern.**

Neither direction is a shortcut. Huong A still requires a governed absorption wave
later. Huong B still requires Fast Lane or GC-018 for the product integration step.

---

## Absorption Trigger Conditions (Huong A path)

When a product implementation is ready to absorb into CVF, ALL of the following must be true:

1. **Shipped and stable** — running in production, not a prototype
2. **Evidence exists** — benchmark data, failure modes documented, edge cases known
3. **Second consumer identified** — at least one other product would use the abstraction
4. **Pattern is generalizable** — domain-specific details can be separated from core logic

When met: open GC-018 to dispatch an LHW absorption wave.

---

## Applied Example: Policy_Local Gap 4 (2026-06-08)

**Capability needed:** Semantic retrieval (embedding + vector search + hybrid RRF fusion).

**Condition evaluation:**

| Condition | Assessment |
|---|---|
| CVF has related building blocks | NO — CVF has no embedding or vector retrieval at all |
| Abstraction boundary is clear | NO — Vietnamese legal chunking, diacritic normalization, optimal chunk size unknown before corpus testing |
| Second consumer waiting | NO — only Policy_Local needs it now |
| Domain-agnostic | NO — Vietnamese legal domain-specific tuning required |
| CVF module build does NOT block product | NO — 2–3 weeks CVF overhead blocks Policy_Local delivery |

**Verdict: Huong A.** All five conditions point away from Huong B.

Operator confirmation (2026-06-08):
> "Chung ta se tien hanh Huong A: Policy_Local truoc → absorb len CVF sau"

**Absorption path (future):**
```
Policy_Local Gap 4 T1–T3 (proven, shipped)
    │
    ▼  trigger: 4 absorption conditions met
GC-018 dispatch: "CVF-LHW-EMBEDDING: local embedding hybrid retrieval"
    │
    ▼
CVF L2 RAG Pipeline module upgrade
  - embedder.ts → CVF L2 generic embedder contract
  - vec-store.ts → CVF L2 vector store adapter
  - RRF fusion → CVF retrieval standard
    │
    ▼
Future products (Policy_Finance, Policy_HR, ...) inherit from CVF L2
```

Do not open the GC-018 until Policy_Local T1–T3 is shipped and stable.

---

## What Policy_Local Has Already Proven (absorbable now via Huong B)

These patterns have evidence and a clear abstraction boundary — Huong B conditions met:

| Pattern | Source | CVF absorption target |
|---|---|---|
| 6-provider LLM adapter (OpenAI-compat + Anthropic + Gemini) | `api/llm/route.ts` | CVF L5 Adapter Hub |
| API key masked storage (DB persist, last-4 display) | `api/settings/route.ts` | CVF credential management standard |
| EC-02 date-aware disclosure (promulgation vs effective date) | `ec02-exception.md` | CVF governance rule candidate |
| RAG grounded system prompt pattern | `api/llm/route.ts` | CVF L2 RAG Pipeline |
| Per-query receipt with freshnessDisclosureApplied flag | `lib/search.ts` | CVF audit trail standard |

These can be absorbed in a future LHW wave without waiting for Gap 4.

---

## Guidance for Future Agents

When a request to "add X capability to CVF" arrives:

1. **Run the decision checklist** — do not assume Huong A or Huong B
2. **If Huong B:** verify building blocks exist in CVF before dispatching a new module build
3. **If Huong A:** build product first, record this decision and the gap reasons here
4. **Mixed/unclear:** surface to operator with the checklist filled out
5. **After Huong A product ships:** re-evaluate absorption trigger conditions before GC-018

The goal is CVF modules that reflect observed, proven behavior — not predicted behavior.
