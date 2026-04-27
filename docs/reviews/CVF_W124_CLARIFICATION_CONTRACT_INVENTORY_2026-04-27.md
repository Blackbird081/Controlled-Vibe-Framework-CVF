<!-- Memory class: SUMMARY_RECORD -->

# CVF W124-T1 Clarification Contract Inventory

> Date: 2026-04-27
> Wave: W124-T1
> Status: LOCKED — CP0 delivery

---

## 1. Feature Flag

`NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP`

- Default: `false` (rollout-safe)
- When `false`: `IntentEntry` and `QuickStart` behave exactly as W122 — weak confidence → guided browse only (no change)
- When `true`: weak-confidence responses trigger the bounded clarification loop before falling back to browse

---

## 2. Clarification Depth Limit

**Max clarification turns per session: 2**

After 2 unanswered clarification turns, routing ends in guided browse with an explicit
explanation. Auto-guessing a target is forbidden at any depth.

---

## 3. Clarification-Eligible Cases

These weak-confidence fallback reasons are eligible for a clarification question because
the router already has partial signal that can be made actionable with one targeted question.

| Fallback reason | Eligible | Clarification question strategy |
| --- | --- | --- |
| `weak_confidence` — no wizard template matched, VN/EN input | **YES** | Ask: what kind of work is the user doing? (phase disambiguation) |
| `weak_confidence` — phase known but risk/domain ambiguous | **YES** | Ask: is this for a small internal project or a customer-facing product? (risk disambiguation) |

### Clarification question design rules

1. Short — one sentence max
2. Answerable by a non-coder without CVF knowledge
3. Grounded in signals already present in the router result (`phase`, `riskLevel`)
4. Never uses internal CVF terminology (INTAKE/DESIGN/BUILD etc.) in user-facing text
5. Offers 2–4 concrete choice options (not free-form)
6. Does not imply CVF already knows the answer

---

## 4. Browse-Only Cases (No Clarification)

These fallback reasons must go directly to guided browse without a clarification turn:

| Fallback reason | Why browse-only |
| --- | --- |
| `unsupported_language` | Router cannot interpret the input at all; asking a clarification in an unknown language is unsafe |
| `empty_input` | No signal exists to build a question from; user must provide a description first |

---

## 5. Recovery Outcome Taxonomy

After clarification, exactly one of three outcomes applies:

| Outcome | Condition | Next action |
| --- | --- | --- |
| `route` | Clarification answer raised confidence to strong (suggestedTemplates > 0) | Route to trusted wizard starter path (identical to W122 strong-confidence path) |
| `browse` | Clarification answer did not improve confidence, or depth limit reached | Guided browse with explicit explanation of why route was not possible |
| `clarify` | Depth < 2 and confidence still weak but signal improved | Ask next clarification question (depth + 1) |

---

## 6. Trusted Routing Subset (Unchanged From W122)

Clarification recovery must only route to the **wizard-family (9 entries)**:

- strategy_analysis
- business_plan
- app_builder
- content_strategy
- seo_audit
- marketing_campaign
- security_assessment
- research_project
- system_design

No form-template routing. No guessed targets outside this list.

---

## 7. Rollback Contract

Flag flip `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=false` restores W122 behavior
exactly. No code revert needed.
