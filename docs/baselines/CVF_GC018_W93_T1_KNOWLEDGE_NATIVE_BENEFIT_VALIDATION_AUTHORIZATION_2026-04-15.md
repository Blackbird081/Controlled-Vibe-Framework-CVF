# GC-018 Continuation Candidate — W93-T1 Knowledge-Native Non-Coder Benefit Validation

Memory class: SUMMARY_RECORD

> Date: 2026-04-15
> Tranche: W93-T1
> Class: VALIDATION_EVIDENCE / NON_CODER_VALUE / KNOWLEDGE_NATIVE_BENEFIT
> Prerequisite status: Gate 1 MET (W90-T1); Gate 2 MET (W91-T1); Gate 3 MET (W92-T1)

---

## Authorization Statement

W93-T1 is authorized to proceed.

All prerequisites are met:
- Gates 1–3 MET (W90/W91/W92 CLOSED DELIVERED)
- Measurement standard: `CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md` §8
- Trusted subset prerequisite: 4 templates all TRUSTED_FOR_VALUE_PROOF (confirmed by W91-T1)

---

## Pre-Benchmark Finding: Knowledge-Native Stack Is Not Wired Into Execute

Before any run begins, a code inspection finding must be recorded:

The CVF knowledge-native stack (W71–W82) delivers compiled knowledge artifacts via:
- `/api/governance/knowledge/compile` (operator surface)
- `src/lib/server/knowledge-governance.ts` (contract wrappers)

**However, these artifacts are never injected into `executeAI()`.** In `src/lib/ai/providers.ts:358`:
```
const systemPrompt = CVF_SYSTEM_PROMPT;
```
`CVF_SYSTEM_PROMPT` is a static string. No knowledge context is passed in from any governance layer. The execute route (`/api/execute`) does not accept or forward a knowledge context parameter.

**Conclusion of pre-benchmark inspection:** In the current CVF system, there is NO "with knowledge-native" execution path for non-coders. The knowledge-native stack affects operator/governance surfaces only.

---

## Scope

**Goal:** Measure whether injecting domain knowledge into the AI system prompt (simulating what the knowledge-native stack could provide if wired) improves non-coder output quality for the 4 frozen templates.

**Controlled variable:**
- Condition A: Standard `CVF_SYSTEM_PROMPT` — "without knowledge-native" (current CVF execute behavior)
- Condition B: `CVF_SYSTEM_PROMPT` + domain knowledge block — "with knowledge-native (simulated)"

**NOT in scope:**
- Wiring knowledge injection into the governed execute path (that is W93 follow-up work if PROVEN)
- Multi-provider comparisons
- Template changes

---

## Frozen Template Set (4 templates per measurement standard §8.1)

| # | Template | W91-T1 Baseline Score |
|---|---|---|
| 1 | `app_builder_wizard` | 8/8 |
| 2 | `business_strategy_wizard` | 8/8 |
| 3 | `research_project_wizard` | 8/8 |
| 4 | `system_design_wizard` | 8/8 |

---

## Domain Knowledge Packets (Frozen — Condition B)

### app_builder_wizard
```
DOMAIN KNOWLEDGE (CVF knowledge-native context):
- Recommended stack for Windows non-coder desktop apps: Python + customtkinter + SQLite + PyInstaller
- GitHub Desktop (GUI, no CLI) for version control — accessible for non-coders
- Common user pain points: packaging/installation complexity, no-terminal setup
- SQLite: zero-config, file-based, offline-first — ideal for personal expense tracker
- PyInstaller packages Python app into single .exe — no Python install needed by end user
- customtkinter provides modern UI over tkinter with dark/light mode built in
```

### business_strategy_wizard
```
DOMAIN KNOWLEDGE (CVF knowledge-native context):
- Vietnam e-commerce 2025: Shopee highest GMV, TikTok Shop growing 40%/yr for fashion
- Typical offline retail setup cost Vietnam: 80–150M VND (rent deposit + fitout + inventory)
- Break-even for offline retail: typically 12–18 months for mid-range fashion
- Online warehouse upgrade (better shelving, label printer, packing station): 20–40M VND
- Shopee fulfillment logistics: Shopee Express allows same-day dispatch up to 100 orders/day
- TikTok Shop live selling: high conversion rate for impulsive fashion purchases (25–35% CR on live)
- Key risk for offline: fixed rent cost during slow months; online has variable COGS
```

### research_project_wizard
```
DOMAIN KNOWLEDGE (CVF knowledge-native context):
- Vietnam Gen Z (18–25): 3–4h/day avg social media, TikTok primary platform
- Common survey tools: Google Forms (free), Typeform (freemium), SurveyMonkey (paid)
- Snowball sampling effective for student cohorts; simple random harder without student registry access
- Typical survey completion rate for Vietnamese students: 60–70% if distributed via class channels
- Research ethics Vietnam: no IRB requirement for non-sensitive surveys, but anonymity pledge standard
- Common Gen Z purchase decision drivers in literature: peer reviews > influencer > brand content
- SPSS and Google Sheets adequate for 200-respondent analysis (no R/Python needed)
```

### system_design_wizard
```
DOMAIN KNOWLEDGE (CVF knowledge-native context):
- Firebase Realtime Database: free tier supports 100 concurrent connections — adequate for 100 drivers
- GeoFire library: open-source, works with Firebase for geospatial queries (find drivers within radius)
- Vietnam tier-2 city context: 60–70% of rides likely cash payment — defer Stripe to Phase 2
- Firebase Cloud Messaging (FCM): free, reliable push notifications iOS + Android
- React Native with Expo: 1-codebase iOS+Android, manageable for 2-developer team in 3 months
- AWS Lambda cold start risk for ride-matching: consider Firebase Functions (simpler for small team)
- Supabase as PostgreSQL alternative: managed, generous free tier, real-time subscriptions built in
```

---

## Execution Rules

1. Provider: Alibaba / qwen3-max (same as W91-T1)
2. Temperature: 0.7 (same as W91-T1)
3. Max tokens: 2048
4. 4 templates × 2 conditions = 8 runs per session
5. Frozen inputs: same canonical input packets as W91-T1 (from GC-018 W91 authorization)
6. Scoring: same 4-dimension rubric (Actionability/Specificity/Completeness/Governance-Safe Usefulness)

---

## Required Conclusion Statement (per measurement standard §8.2)

Must end with exactly one of:
- `knowledge-native benefit PROVEN for non-coder output`
- `knowledge-native benefit NOT PROVEN yet`
- `knowledge-native benefit MIXED / template-dependent`

Supported by rubric deltas and evidence excerpts, not narrative preference.

---

## Tranche Boundary

- Starts: this document
- Code changes: NONE — documentation-only tranche with live API evidence
- Ends: post-run assessment + GC-026 sync + handoff update

---

*Authorization filed: 2026-04-15 — W93-T1 Knowledge-Native Non-Coder Benefit Validation*
