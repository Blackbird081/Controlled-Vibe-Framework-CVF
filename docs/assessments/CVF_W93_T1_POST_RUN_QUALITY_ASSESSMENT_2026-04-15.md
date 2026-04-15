# W93-T1 Post-Run Quality Assessment

Memory class: SUMMARY_RECORD

> Date: 2026-04-15
> Tranche: W93-T1
> Class: VALIDATION_EVIDENCE / NON_CODER_VALUE / KNOWLEDGE_NATIVE_BENEFIT
> Authorization: CVF_GC018_W93_T1_KNOWLEDGE_NATIVE_BENEFIT_VALIDATION_AUTHORIZATION_2026-04-15.md
> Status: CLOSED DELIVERED

---

## Required Conclusion Statement

> **knowledge-native benefit MIXED / template-dependent**

---

## Pre-Benchmark Finding (Code Inspection)

The CVF knowledge-native stack (W71–W82) does NOT inject into the execute path:
- `src/lib/ai/providers.ts:358`: `const systemPrompt = CVF_SYSTEM_PROMPT;` — static string, no knowledge injection
- `/api/governance/knowledge/compile` produces compiled artifacts but they are never passed to `executeAI()`
- Non-coders submitting templates via `/api/execute` receive NO knowledge-native augmentation in the current system

This is a confirmed architecture gap. "With knowledge-native" in this tranche = simulated injection via enriched system prompt (domain knowledge packets frozen in GC-018 authorization).

---

## Run Summary

- Provider: Alibaba / qwen3-max (all 8 runs — zero fallbacks)
- Conditions: A = standard CVF system prompt, B = CVF system prompt + domain knowledge packet
- 4 templates × 2 conditions = 8 runs

| Run | Template | Condition | Model | Latency | Size |
|---|---|---|---|---|---|
| T1-A | app_builder_wizard | WITHOUT | qwen3-max | 42,940ms | 5,269 chars |
| T1-B | app_builder_wizard | WITH | qwen3-max | 42,695ms | 5,187 chars |
| T2-A | business_strategy_wizard | WITHOUT | qwen3-max | 49,271ms | 5,534 chars |
| T2-B | business_strategy_wizard | WITH | qwen3-max | 37,294ms | 5,132 chars |
| T7-A | research_project_wizard | WITHOUT | qwen3-max | 49,399ms | 6,709 chars |
| T7-B | research_project_wizard | WITH | qwen3-max | 43,943ms | 6,197 chars |
| T9-A | system_design_wizard | WITHOUT | qwen3-max | 41,865ms | 4,964 chars |
| T9-B | system_design_wizard | WITH | qwen3-max | 34,872ms | 4,937 chars |

---

## Rubric Scores (4 dimensions × 0–2 each)

| Template | Condition | A | S | C | G | Total | Delta |
|---|---|---|---|---|---|---|---|
| app_builder_wizard | A — WITHOUT | 2 | 1 | 2 | 1 | **6/8** | — |
| app_builder_wizard | B — WITH | 2 | 2 | 2 | 2 | **8/8** | **+2** |
| business_strategy_wizard | A — WITHOUT | 2 | 2 | 2 | 2 | **8/8** | — |
| business_strategy_wizard | B — WITH | 2 | 2 | 2 | 2 | **8/8** | 0 |
| research_project_wizard | A — WITHOUT | 2 | 2 | 2 | 2 | **8/8** | — |
| research_project_wizard | B — WITH | 2 | 2 | 2 | 2 | **8/8** | 0 |
| system_design_wizard | A — WITHOUT | 2 | 2 | 2 | 2 | **8/8** | — |
| system_design_wizard | B — WITH | 2 | 2 | 2 | 2 | **8/8** | 0 |

A=Actionability, S=Specificity, C=Completeness, G=Governance-Safe Usefulness

---

## Detailed Evidence by Template

### T1 — app_builder_wizard | Delta: +2

**Condition A (WITHOUT):**
- Recommended Bubble.io + Nativefier for "offline Windows desktop app"
- Critical issue: Bubble.io is a cloud SaaS — data is NOT stored locally despite the output claiming "Your data NEVER leaves your computer (Bubble stores it locally in your browser)" — factually incorrect
- Recommended "Ignore 'Not Secure' warning" — bad security guidance for a non-coder
- S=1: recommendation doesn't match offline constraint; G=1: misleading data privacy claim, unsafe security guidance

**Condition B (WITH):**
- Recommended Python + customtkinter + SQLite + PyInstaller (exactly the domain knowledge packet)
- SQLite = file-based, truly local, no server; PyInstaller = .exe, no Python needed
- Data locality claims are accurate; no unsafe guidance
- S=2: matches offline + Windows + non-coder constraints perfectly; G=2: no misleading claims

**Evidence excerpt (B):**
> "You'll use Python (easy to read/write) + customtkinter (modern-looking app interface) + SQLite (simple built-in database). Then package it into a single .exe file anyone can run."

**Finding:** Domain knowledge injection prevented a technically incorrect tech recommendation. The model without domain knowledge chose a cloud-based no-code tool (Bubble.io) that contradicts the offline requirement. With domain knowledge, it chose the correct offline-native stack.

---

### T2 — business_strategy_wizard | Delta: 0

**Condition A:** VND cost estimates (80-100M VND offline setup, 6-9 months break-even), Shopee/TikTok specifics. Score: 8/8
**Condition B:** More precise figures (80-150M VND setup, 12-18 months break-even, 25-35% TikTok live CR) — directly from domain knowledge packet. Score: 8/8

**Finding:** Condition B output is more precisely calibrated (cites industry-standard Vietnam e-commerce figures), but the rubric cannot differentiate "accurate 8/8" from "more accurate 8/8" — both outputs are at ceiling.

---

### T7 — research_project_wizard | Delta: 0

**Condition A:** 10-question survey, interview guide, 3-month Gantt, SPSS + NVivo analysis mention. Score: 8/8
**Condition B:** Adds specific tools (Google Forms, Otter.ai for transcription, SPSS for analysis), names specific universities (UEH, RMIT Vietnam), mentions VND incentive amounts (20k-50k VND e-vouchers), cites 60-70% completion rate for student surveys. Score: 8/8

**Finding:** Condition B is operationally more grounded (actionable tool names, specific recruitment channels, VND incentive amounts). Both score 8/8 — ceiling effect obscures the practical improvement in Condition B.

---

### T9 — system_design_wizard | Delta: 0

**Condition A:** AWS-centric stack (DynamoDB, Lambda, Amazon Location Service, Firebase for real-time), ~$122/month cost estimate. Score: 8/8

**Condition B:** Firebase-centric stack (Firebase Realtime DB + GeoFire + Firebase Cloud Functions), cash-first payment (explicitly citing Vietnam tier-2 context: 60-70% cash rides), React Native + Expo. Cost: **$0/month** for MVP vs $122/month in Condition A. Score: 8/8

**Finding:** Condition B recommends a substantially cheaper and simpler stack ($0/month vs $122/month) that better fits the "low budget, 2 developers, 3 months" constraints. GeoFire is specifically suited for the geospatial driver-matching requirement. However, both outputs score 8/8 — the rubric doesn't capture cost efficiency delta.

---

## Rubric Delta Summary

| Template | Delta | Nature of change |
|---|---|---|
| T1 app_builder_wizard | **+2** | Prevented incorrect tech choice (cloud→offline-native) |
| T2 business_strategy_wizard | 0 | More precise figures; rubric at ceiling |
| T7 research_project_wizard | 0 | More actionable tool names; rubric at ceiling |
| T9 system_design_wizard | 0 | Better tech stack ($0 vs $122/mo); rubric at ceiling |

---

## Gate 4 Determination

**Gate 4 criterion (per measurement standard):** explicit conclusion = PROVEN / NOT PROVEN YET / MIXED

**Conclusion: `knowledge-native benefit MIXED / template-dependent`**

### What this means

**Where knowledge injection DEMONSTRABLY helps (T1):**
Knowledge injection prevented a governance-safety failure — the model without domain knowledge recommended a cloud SaaS (Bubble.io) for an offline-required app, including a false claim about data privacy. With domain knowledge, it chose the correct offline-native stack. This is a **floor-correction effect**: knowledge prevents incorrect recommendations when the correct approach requires specific domain expertise.

**Where knowledge injection has UNDETECTABLE rubric impact (T2, T7, T9):**
The baseline model (without knowledge) already produces 8/8 outputs on these templates — the rubric is at ceiling. Domain knowledge injection made outputs more precise (better-calibrated VND figures, named tools, cheaper tech stacks) but these sub-ceiling improvements are not measurable on the 0–8 rubric.

### Limitations of this validation

1. **Ceiling effect:** 3 of 4 "without" baselines already score 8/8. Detecting improvement requires a lower-baseline scenario — templates with more domain-specific traps where the generic model fails.
2. **Simulation vs. actual injection:** This tranche used simulated knowledge injection (system prompt enrichment). The CVF knowledge-native stack (W71-W82) is not wired into `/api/execute`. Actual integration may produce different results.
3. **Sample size:** 4 templates. A broader set including technical domains (security, database design) where domain knowledge traps are more common would yield stronger signal.

### Implication for future work

The knowledge-native benefit IS real for cases where domain expertise prevents incorrect recommendations (T1 pattern). To prove PROVEN rather than MIXED, future validation should:
1. Wire knowledge-native injection into `/api/execute` (close the architecture gap)
2. Use templates with specific domain-knowledge traps (e.g., security patterns, compliance requirements)
3. Design scenarios where baseline scores sub-6 to reveal the full improvement range

---

## Tranche Closeout

- **W93-T1 status:** CLOSED DELIVERED 2026-04-15
- **Gate 4:** MIXED / template-dependent (architecture gap + ceiling effect documented)
- **Next tranche:** W94-T1 — Risk Visibility (Fast Lane GC-021 per roadmap)
- **GC-026 sync:** Filed separately

---

*Assessment filed: 2026-04-15 — W93-T1 Knowledge-Native Non-Coder Benefit Validation*
