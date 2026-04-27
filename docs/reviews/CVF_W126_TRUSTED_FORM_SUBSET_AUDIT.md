# W126 Trusted Form Subset Audit

> Date: 2026-04-27
> Auditor: W126-T1 implementation session
> Status: APPROVED FOR W126 ROUTING
> Corpus size: 44 form templates (excl. 9 wizard-family)
> Trusted subset size: 8

---

## Purpose

This audit selects the trusted form-template subset eligible for intent-first routing in W126.
The selection must be explicit, bounded, and reviewable. No form may be added to the trusted
subset without a new audit entry and commit.

Inclusion criteria:
1. Noncoder-legible activation — the form's purpose is clear from plain-language input
2. Unambiguous intent signal — intent keywords map cleanly to this form, not to a wizard
3. Safe for non-coders — no dangerous operations, no legal/compliance expert requirement
4. Distinct from wizard family — wizard should not already serve this intent better

---

## Full Form Corpus (44 templates, excl. 9 wizards)

| Template ID | Category | Trusted? | Reason |
|---|---|---|---|
| `email_template` | content | ✅ TRUSTED | Clear, common, noncoder-legible, no wizard covers it |
| `documentation` | content | ✅ TRUSTED | "Document this process" is distinct from content-strategy wizard |
| `competitor_review` | business | ✅ TRUSTED | "Analyze my competitors" — no wizard covers structured comparison |
| `risk_assessment` | business | ✅ TRUSTED | "Identify risks for X" — distinct from security-assessment wizard |
| `user_persona` | product | ✅ TRUSTED | "Create user persona" — wizard covers product design broadly, form is specific |
| `feature_prioritization` | product | ✅ TRUSTED | "Which features to build first" — no wizard covers this directly |
| `pricing_strategy` | business | ✅ TRUSTED | "Help me with pricing" — distinct domain, no wizard covers it |
| `strategy_analysis` | business | ✅ TRUSTED | "Analyze this strategy decision" — distinct from building new strategy (wizard) |
| `accessibility_audit` | technical | ❌ EXCLUDED | Requires code/design artifact to audit; coder-facing |
| `api_design` | technical | ❌ EXCLUDED | Coder-only; requires technical spec knowledge |
| `api_security` | security | ❌ EXCLUDED | Coder-only; security-assessment wizard preferred |
| `app_builder_complete` | development | ❌ EXCLUDED | Wizard family (app-builder wizard wins) |
| `app_requirements_spec` | development | ❌ EXCLUDED | Wizard family (app-builder wizard wins) |
| `architecture_design` | technical | ❌ EXCLUDED | system-design wizard covers this intent |
| `architecture_review` | technical | ❌ EXCLUDED | Coder-facing review artifact needed |
| `auto_documentation` | content | ❌ EXCLUDED | Ambiguous activation; unclear from plain input |
| `brand_voice` | marketing | ❌ EXCLUDED | content-strategy or marketing-campaign wizard wins |
| `build_my_app` | development | ❌ EXCLUDED | app-builder wizard wins |
| `cli_tool_spec` | development | ❌ EXCLUDED | Coder-facing; requires CLI knowledge |
| `code_review` | development | ❌ EXCLUDED | Coder-only; requires code artifact |
| `content_quality` | content | ❌ EXCLUDED | content-strategy wizard covers quality assessment |
| `copywriting_evaluation` | content | ❌ EXCLUDED | content-strategy wizard covers this |
| `data_analysis` | data | ❌ EXCLUDED | data-analysis wizard wins |
| `data_handling` | technical | ❌ EXCLUDED | Ambiguous activation; technical context required |
| `email_campaign` | marketing | ❌ EXCLUDED | marketing-campaign wizard wins |
| `error_handling_ux` | product | ❌ EXCLUDED | product-design wizard covers; technical context needed |
| `gdpr_compliance` | legal | ❌ EXCLUDED | Legal expert context required; not noncoder-safe |
| `incident_response` | security | ❌ EXCLUDED | R3 risk; requires operational authority |
| `individual_skills_folder` | development | ❌ EXCLUDED | CVF-internal; not noncoder-legible |
| `landing_page_cro` | marketing | ❌ EXCLUDED | marketing-campaign wizard wins |
| `non_coder_debug` | development | ❌ EXCLUDED | Requires technical debugging context |
| `onboarding_review` | product | ❌ EXCLUDED | Ambiguous (product vs HR onboarding) |
| `privacy_policy_audit` | legal | ❌ EXCLUDED | Legal expert context required |
| `project_init_checklist` | development | ❌ EXCLUDED | CVF-internal / coder-facing |
| `seo_audit` | marketing | ❌ EXCLUDED | marketing-campaign wizard preferred; technical context |
| `social_ad_review` | marketing | ❌ EXCLUDED | marketing-campaign wizard wins |
| `tos_review` | legal | ❌ EXCLUDED | Legal expert context required |
| `user_flow_analysis` | product | ❌ EXCLUDED | product-design wizard covers; UX artifact needed |
| `ux_heuristic_evaluation` | product | ❌ EXCLUDED | product-design wizard covers; UX artifact needed |
| `vibe_logic_mapping` | development | ❌ EXCLUDED | CVF-internal; not noncoder-legible |
| `vibe_to_spec` | development | ❌ EXCLUDED | CVF-internal; not noncoder-legible |
| `vibe_workflow_folder` | development | ❌ EXCLUDED | CVF-internal; not noncoder-legible |
| `web_build_handoff` | development | ❌ EXCLUDED | Coder-facing handoff artifact |
| `web_ux_redesign_system` | product | ❌ EXCLUDED | Coder-facing; system-design wizard preferred |

---

## Trusted Subset Detail (8 forms)

### 1. `email_template`

- **Label:** 📧 Email Template
- **Activation signals:** "email", "draft email", "write email", "email to", "follow-up email", "viết email", "thư", "draft an email"
- **Wizard wins when:** User describes a full content or marketing strategy (not a specific email task)
- **Safety:** R0/R1 — no dangerous operations

### 2. `documentation`

- **Label:** 📄 Documentation
- **Activation signals:** "document", "documentation", "SOP", "how-to guide", "process doc", "tài liệu", "quy trình", "handoff doc", "viết tài liệu"
- **Wizard wins when:** User says "content strategy", "research report", or asks for a campaign not a doc
- **Safety:** R0 — write/draft operation

### 3. `competitor_review`

- **Label:** 🔍 Competitor Review
- **Activation signals:** "competitor", "competition", "competitive analysis", "compare competitors", "đối thủ", "phân tích đối thủ", "competitive landscape"
- **Wizard wins when:** User says "business strategy" broadly without competitor focus
- **Safety:** R0/R1 — analysis/read operation

### 4. `risk_assessment`

- **Label:** ⚠️ Risk Assessment
- **Activation signals:** "risk assessment", "assess risks", "identify risks", "risk analysis", "rủi ro", "phân tích rủi ro", "đánh giá rủi ro"
- **Wizard wins when:** User says "security assessment" or "penetration test" (security-assessment wizard wins)
- **Safety:** R1 — analysis operation; security-specific excluded via ambiguity boundary

### 5. `user_persona`

- **Label:** 👤 User Persona
- **Activation signals:** "user persona", "target audience", "customer profile", "người dùng mục tiêu", "persona", "buyer persona", "ideal customer"
- **Wizard wins when:** User says "product design" broadly or "design my app"
- **Safety:** R0 — research/draft operation

### 6. `feature_prioritization`

- **Label:** 📋 Feature Prioritization
- **Activation signals:** "prioritize features", "feature prioritization", "which features", "feature list", "ưu tiên tính năng", "roadmap priorities", "what to build first"
- **Wizard wins when:** User says "build my app" or "design my product" (app-builder/product-design wizard wins)
- **Safety:** R0/R1 — planning operation

### 7. `pricing_strategy`

- **Label:** 💰 Pricing Strategy
- **Activation signals:** "pricing", "price my product", "how to price", "pricing model", "giá bán", "chiến lược giá", "pricing strategy"
- **Wizard wins when:** User says "business strategy" broadly without pricing focus
- **Safety:** R0/R1 — strategic analysis

### 8. `strategy_analysis`

- **Label:** 📊 Strategy Analysis
- **Activation signals:** "analyze this strategy", "strategic analysis", "strategy evaluation", "phân tích chiến lược", "evaluate decision", "đánh giá chiến lược", "analyze a decision"
- **Wizard wins when:** User says "help me build a business strategy" (business-strategy wizard wins) or "design a strategy"
- **Safety:** R0/R1 — analysis operation

---

## Routing Precedence (CP2 Contract)

```
1. wizard-family route   (detectIntent suggestedTemplates.length > 0)
2. trusted form route    (routeToTrustedForm match — W126)
3. clarification loop    (weak_confidence + isClarificationEligible)
4. guided browse         (depth limit reached or ineligible)
```

Wizard always wins on collision. Form routing only activates when no wizard matched.

---

## Exclusion Permanence

The following categories are permanently excluded from W126 trusted routing:
- CVF-internal templates (`vibe_*`, `individual_skills_folder`, `project_init_checklist`)
- Legal/compliance templates (`gdpr_compliance`, `privacy_policy_audit`, `tos_review`)
- R3 operational templates (`incident_response`)
- Coder-only templates (code review, API, architecture, accessibility, CLI)
- Wizard-duplicate templates (templates whose intent is already covered by a wizard)

Any expansion beyond 8 forms requires a new audit entry in this file.
