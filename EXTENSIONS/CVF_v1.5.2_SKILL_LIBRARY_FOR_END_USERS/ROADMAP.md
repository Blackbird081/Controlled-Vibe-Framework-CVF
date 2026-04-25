# CVF Skill Library - Roadmap

> **CVF Skill Library v1.5.2**  
> **Last Updated:** 2026-04-26

---

## 📊 Tiến độ tổng quan — Canonicalized Portfolio (2026-04-26)

| Domain | Active | Legacy | Status |
|--------|--------|--------|--------|
| App Development | 8 | 35 | ✅ **CANONICALIZED** |
| Product & UX | 6+2 | 9 | ✅ **CANONICALIZED** |
| Marketing & SEO | 5 | 8 | ✅ **CANONICALIZED** |
| Web Development | 6 | 5 | ✅ **CANONICALIZED** |
| AI/ML Evaluation | 6 | 4 | ✅ **CANONICALIZED** |
| Security & Compliance | 4 | 4 | ✅ **CANONICALIZED** |
| Finance & Analytics | 4 | 11 | ✅ **CANONICALIZED** |
| HR & Operations | 5 | 0 | ✅ **CANONICALIZED** |
| Legal & Contracts | 5 | 2 | ✅ **CANONICALIZED** |
| Business Analysis | 4 | 2 | ✅ **CANONICALIZED** |
| Content Creation | 4 | 0 | ✅ **CANONICALIZED** |
| Technical Review | 3 | 0 | ✅ **CANONICALIZED** |
| **TỔNG** | **62 active** | **80 archived** | **Full Canonicalization Complete** |


---

## ✅ Phase 1: Marketing & SEO — COMPLETE

**Location:** `marketing_seo/`

| Skill | Description |
|-------|-------------|
| SEO Audit | Technical, On-page, Off-page SEO |
| Copywriting Evaluation | AIDA, power words, CTA |
| Landing Page CRO | Conversion rate optimization |
| Pricing Strategy Review | Value-based pricing |
| Content Quality Checklist | E-E-A-T evaluation |
| Competitor Analysis | SWOT framework |
| Email Campaign Review | Subject lines, benchmarks |
| Social Media Ad Review | Platform-specific optimization |
| Brand Voice Consistency | Voice attributes, tone matrix |

**Commit:** `227a960` (2026-02-03)

---

## ✅ Phase 2: Product & UX — COMPLETE

**Location:** `product_ux/`

| Skill | Description |
|-------|-------------|
| A/B Test Review | Hypothesis, statistical validity |
| Accessibility Audit | WCAG compliance |
| User Flow Analysis | Friction points, optimization |
| UX Heuristic Evaluation | Nielsen's 10 Heuristics |
| Feature Prioritization | RICE/ICE frameworks |
| User Persona Development | Data-driven personas |
| Error Handling UX | Message tone, recovery |
| Onboarding Experience Review | Time to value, dropoff |

**Commit:** `52d5097` (2026-02-03)

---

## ✅ Phase 3: Security & Compliance — COMPLETE

**Location:** `security_compliance/`

| Skill | Description |
|-------|-------------|
| API Security Checklist | OWASP Top 10 API |
| GDPR Compliance Review | EU data protection |
| Privacy Policy Audit | Regional requirements |
| Incident Response Plan | CSIRT roles, playbooks |
| Data Handling Review | Lifecycle management |
| Terms of Service Review | ToS coverage, fairness |

**Commit:** `4a29691` (2026-02-03)

---

## ✅ Phase 4: Finance & Analytics — CANONICALIZED

**Location:** `finance_analytics/`

| Skill | Description |
|-------|-------------|
| Finance Analysis System | Budget, statement, cash flow, KPI, and ROI analysis packet |
| Forecast & Scenario Review | Forecast, scenario, stress test, and threshold decision packet |
| Investment & Risk Due Diligence | Investment, vendor, project, and financial risk due diligence |
| Finance QA Checklist | Final QA for evidence, assumptions, risk language, and approval boundary |

Legacy micro-skills were moved to `finance_analytics/legacy/canonicalized_2026_04/`
with `.legacy.md` extensions so they are not indexed as active skills.

**Canonicalization:** 2026-04-26

---

## 🔧 Domain Refinement (Quality Pass 2)

**Mục tiêu:** Nâng chất lượng theo domain (ví dụ thực tế sâu hơn + liên kết `Related Skills` + consistency format + cross-domain flow).
**Trạng thái:** ✅ Completed (2026-02-07)

**Definition of Done (per domain):**
- Ví dụ thực tế rõ, có Input/Output mẫu thực tế (không placeholder)
- Related Skills liên kết theo flow thực tế trong domain
- Version History cập nhật đúng chuẩn
- Ngôn ngữ và cấu trúc đồng nhất

**Ưu tiên (batch theo domain):**
1. App Development
2. Marketing & SEO
3. Product & UX
4. Security & Compliance
5. Finance & Analytics
6. AI/ML Evaluation
7. Web Development
8. Business Analysis
9. Content Creation
10. Technical Review
11. HR & Operations
12. Legal & Contracts

| Domain | Skills | Status |
|--------|:------:|--------|
| App Development | 8 | ✅ Done |
| Marketing & SEO | 9 | ✅ Done |
| Product & UX | 8 | ✅ Done |
| Security & Compliance | 6 | ✅ Done |
| Finance & Analytics | 4 | ✅ Canonicalized |
| AI/ML Evaluation | 6 | ✅ Done |
| Web Development | 5 | ✅ Done |
| Business Analysis | 3 | ✅ Done |
| Content Creation | 3 | ✅ Done |
| Technical Review | 3 | ✅ Done |
| HR & Operations | 5 | ✅ Done |
| Legal & Contracts | 5 | ✅ Done |


---

## 🔗 Integration Status

| Integration | Status |
|-------------|--------|
| CVF Web UI Templates | ✅ 31 templates (23 new) |
| Skill Library Files | ✅ 62 active .skill.md files (80 archived in legacy/) |
| AI Quick Links | ✅ ChatGPT, Claude, Gemini |
| Export Functions | ✅ Clipboard, File export |

---

## ✅ Phase 6: UUPM Import — COMPLETE (2026-02-22)

**17 new skills** imported from [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT), adapted to CVF format:

| Domain | New Skills | Count |
|--------|-----------|:-----:|
| product_ux | UI Style Selection, Color Palette Generator, Typography Pairing, Design System Generator, Interaction Design Review, Dark/Light Mode Audit | +6 |
| web_development | Chart Data Visualization, Landing Page Pattern, Web ARIA Keyboard Audit, CSS Animation Performance, React Performance Audit, Icon System Review | +6 |
| app_development | Mobile Framework UI Guide, UI Pre-Delivery Checklist, Industry UI Reasoning | +3 |
| marketing_seo | Conversion Landing Optimizer, Product Page Style Matcher | +2 |

**Commit:** `6932546` (2026-02-22)

---

## ✅ Phase 7: Smart Tools — COMPLETE (2026-02-22)

| Tool | Location | Description |
|------|----------|-------------|
| `skills_index.csv` | `data/skills_index.csv` | Structured metadata for all 131 active skills |
| `generate_index.py` | `tools/skill-index/` | Parse .skill.md → CSV index |
| `search_skills.py` | `tools/skill-search/` | BM25 search engine (pure Python, < 10ms) |
| `reason_skills.py` | `tools/skill-search/` | Industry reasoning engine (50 rules, 12 industries) |
| `plan_skills.py` | `tools/skill-search/` | Skill Execution Plan generator |
| `skill_reasoning.csv` | `data/skill_reasoning.csv` | 50 industry → skill chain mappings |

### Usage:
```bash
# Search skills
python tools/skill-search/search_skills.py "landing page conversion"

# Get industry reasoning
python tools/skill-search/reason_skills.py "fintech dashboard"

# Generate execution plan
python tools/skill-search/plan_skills.py --task "e-commerce mobile app" --format md
```

---

## 📝 Credits

**Inspiration:** [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills)  
**UUPM Import:** [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT License)

**Transformation:** Skills được chuyển đổi sang CVF End User format với:
- Form Input fields
- Evaluation Checklists
- Common Failures analysis
- Practical Tips & Examples

---

## ✅ Automated Validation

- Script: `scripts/validate_skills.py`
- Index: `tools/skill-index/generate_index.py --validate`
- Status: ✅ Full portfolio canonicalized — 62 active skills, 80 archived — 2026-04-26

---

## ✅ Full Portfolio Canonicalization — COMPLETE (2026-04-26)

**Goal:** Reduce portfolio from 131 scattered skills to 62 high-quality canonical skills.
**Method:** For each domain, keep a numbered canonical set (01–NN) that covers the domain
lifecycle without tool lock-in. Move all vendor-specific, duplicate, or niche skills to
`legacy/superseded_2026_04/` with `.skill.legacy.md` extension.

| Domain | Before | After | Archived | Legacy folder |
| ------- | ------ | ----- | -------- | ------------- |
| app_development | 43 | 8 | 35 | `legacy/superseded_2026_04/` |
| product_ux | 17 | 6+2 | 9 | `legacy/superseded_2026_04/` |
| marketing_seo | 13 | 5 | 8 | `legacy/superseded_2026_04/` |
| web_development | 11 | 6 | 5 | `legacy/superseded_2026_04/` |
| ai_ml_evaluation | 10 | 6 | 4 | `legacy/superseded_2026_04/` |
| security_compliance | 8 | 4 | 4 | `legacy/superseded_2026_04/` |
| legal_contracts | 7 | 5 | 2 | `legacy/superseded_2026_04/` |
| business_analysis | 6 | 4 | 2 | `legacy/superseded_2026_04/` |
| content_creation | 4 | 4 | 0 | — |
| hr_operations | 5 | 5 | 0 | — |
| technical_review | 3 | 3 | 0 | — |
| finance_analytics | 4 | 4 | 11 | `legacy/canonicalized_2026_04/` |
| **TOTAL** | **131** | **62** | **80** | |

**Canonicalization date:** 2026-04-26

---

*CVF Skill Library v1.5.2 | [GitHub](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF)*
