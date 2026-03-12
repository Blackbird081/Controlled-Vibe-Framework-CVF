# CVF Skill Library — Upgrade Roadmap

> **Date:** 2026-02-22  
> **Baseline:** CVF Skill Library v1.5.2 (141 skills, 12 domains)  
> **Target:** CVF Skill Library v1.5.3 — Smart Search & Reasoning Engine  
> **Source:** [CVF vs UUPM Comparison](../assessments/CVF_VS_UUPM_COMPARISON_2026-02-22.md)

---

## 🎯 Vision

Nâng CVF Skill Library từ **static markdown collection** lên **intelligent skill platform** với:
1. **Search Engine** — Tìm skill bằng keyword (BM25 ranking)
2. **Reasoning Engine** — Auto-suggest skill chains theo ngành + task
3. **CSV Data Layer** — Structured metadata index
4. **Skill Planner CLI** — `python plan_skills.py --task "..."` ra Skill Execution Plan
5. **Cross-domain Discovery** — Tự link skills across domains

---

## 📊 Status Overview

| Sprint | Deliverable | Priority | Status |
|--------|-------------|----------|--------|
| Sprint 0 | Import 17 UUPM skills + fix counts | HIGH | ✅ DONE |
| Sprint 1 | `skills_index.csv` — metadata cho 141 skills | HIGH | ✅ DONE |
| Sprint 2 | `search_skills.py` — BM25 search engine | HIGH | ✅ DONE |
| Sprint 3 | `skill_reasoning.csv` — 50 industry reasoning rules | MEDIUM | ✅ DONE |
| Sprint 4 | `plan_skills.py` — AI Skill Planner | MEDIUM | ✅ DONE |
| Sprint 5 | Cross-domain search + web UI integration | LOW | ✅ DONE |
| Sprint 6 | `cvf-cli` package + npm distribution | LOW | ✅ DONE |

---

## ✅ Sprint 0: Import UUPM Skills — DONE

**Commit:** `6932546` (2026-02-22)

| Deliverable | Status |
|-------------|--------|
| 17 new skills từ UUPM (MIT) | ✅ |
| README count fix 131→141 | ✅ |
| CVF vs UUPM comparison doc | ✅ |
| product_ux: +6 skills | ✅ |
| web_development: +6 skills | ✅ |
| app_development: +3 skills | ✅ |
| marketing_seo: +2 skills | ✅ |

---

## ✅ Sprint 1: Skills Index (CSV Data Layer) — DONE

**Goal:** Tạo `skills_index.csv` — structured metadata cho tất cả 141 skills để search engine và reasoning engine có thể query.

**Location:** `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/data/skills_index.csv`

### Schema

```csv
skill_id,domain,skill_name,difficulty,risk_level,phases,keywords,description,file_path
```

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `skill_id` | string | Unique ID | `product_ux/ui_style_selection` |
| `domain` | enum | 12 domains | `product_ux` |
| `skill_name` | string | Human name | `UI Style Selection` |
| `difficulty` | enum | Easy/Medium/Advanced | `Medium` |
| `risk_level` | enum | R0/R1/R2/R3 | `R1` |
| `phases` | string | CVF phases (comma-sep) | `Discovery,Design` |
| `keywords` | string | Search keywords (comma-sep) | `style,ui,design,visual,theme` |
| `description` | string | 1-line mô tả | `Recommend UI style từ 67+ options` |
| `file_path` | string | Relative path | `product_ux/ui_style_selection.skill.md` |

### Script

```
tools/skill-index/
├── generate_index.py      # Parse .skill.md → extract metadata → write CSV
├── validate_index.py      # Check CSV vs actual files (no orphans, no missing)
└── README.md              # Usage docs
```

### `generate_index.py` Logic:

```python
# 1. Glob all .skill.md files
# 2. Parse each file:
#    - Title from H1
#    - Domain from metadata
#    - Difficulty from metadata  
#    - Risk Level from Governance Summary table
#    - Phases from Governance Summary table
#    - Keywords from: title words + domain + Mục đích section (nouns)
#    - Description from: first line of Mục đích
# 3. Write CSV sorted by domain → skill_name
# 4. Print stats: total skills, per-domain counts
```

### Acceptance Criteria

- [ ] CSV có đúng 141 rows (header + 141 data rows)
- [ ] Mỗi domain count match file count on disk
- [ ] `validate_index.py` pass (0 orphans, 0 missing)
- [ ] Keywords ≥ 3 per skill
- [ ] Tất cả file_path tồn tại thực
- [ ] UTF-8 encoding, Vietnamese diacritics preserved

### Estimated Time: 45 min

---

## ✅ Sprint 2: Search Engine (BM25) — DONE

**Goal:** Viết `search_skills.py` cho phép tìm kiếm skills bằng natural language query, trả về ranked results.

**Location:** `tools/skill-search/search_skills.py`

### Usage

```bash
# Tìm skill
python search_skills.py "landing page conversion"

# Kết quả:
# 🔍 Found 5 skills for "landing page conversion":
#
# 1. [95.2] marketing_seo/conversion_landing_optimizer
#    "Tối ưu landing page cho conversion rate"
#    Risk: R1 | Difficulty: Medium | Phases: Design, Build, Optimize
#
# 2. [87.3] web_development/07_landing_page_pattern
#    "Chọn optimal landing page structure từ 30+ patterns"
#    Risk: R0 | Difficulty: Easy | Phases: Discovery, Design
#
# 3. [72.1] marketing_seo/product_page_style_matcher
#    ...

# Tìm theo domain
python search_skills.py "security audit" --domain security_compliance

# Tìm theo risk level
python search_skills.py "design" --risk R0

# Tìm theo phase
python search_skills.py "deploy" --phase Deploy

# Output JSON
python search_skills.py "testing" --json
```

### BM25 Implementation

```python
# Dependencies: NONE (pure Python — no pip install needed)
#
# BM25 Parameters:
#   k1 = 1.5 (term frequency saturation)
#   b  = 0.75 (document length normalization)
#
# Searchable fields (weighted):
#   skill_name:  weight 3.0  (exact name match most important)
#   keywords:    weight 2.5  (curated keywords)
#   description: weight 2.0  (skill purpose)
#   domain:      weight 1.5  (domain matching)
#   phases:      weight 1.0  (phase matching)
#
# Process:
#   1. Load skills_index.csv → in-memory corpus
#   2. Tokenize query (lowercase, split, remove stopwords vi+en)
#   3. Score each skill using weighted BM25
#   4. Return top-N sorted by score
```

### File Structure

```
tools/skill-search/
├── search_skills.py       # Main search CLI
├── bm25.py                # BM25 scoring engine (pure Python)
├── stopwords.py            # Vietnamese + English stopwords
├── test_search.py          # Unit tests
└── README.md               # Usage docs
```

### Acceptance Criteria

- [ ] Zero external dependencies (pure Python stdlib + csv)
- [ ] Tìm "landing page" → return ≥ 2 relevant results
- [ ] Tìm "security" → top results from security_compliance domain  
- [ ] Tìm "font typography" → return typography_pairing skill
- [ ] `--domain` filter works
- [ ] `--risk` filter works  
- [ ] `--phase` filter works
- [ ] `--json` output valid JSON
- [ ] Response time < 100ms cho 141 skills
- [ ] UTF-8 / Vietnamese query support (`tối ưu conversion`)

### Estimated Time: 1.5 hours

---

## ✅ Sprint 3: Reasoning Engine (Industry Rules) — DONE

**Goal:** Tạo `skill_reasoning.csv` — khi user mô tả ngành/task, engine tự suggest skill chain đúng thứ tự theo CVF phases.

**Location:** `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/data/skill_reasoning.csv`

### Schema

```csv
industry,task_pattern,skill_chain,rationale
```

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `industry` | string | Vertical market | `Fintech` |
| `task_pattern` | string | Regex pattern match task description | `(dashboard\|analytics\|data viz)` |
| `skill_chain` | string | Ordered skill IDs (pipe-sep) | `product_ux/ui_style_selection\|web_development/06_chart_data_visualization\|product_ux/design_system_generator` |
| `rationale` | string | Tại sao chain này | `Fintech cần trust-focused style → data visualization → consistent design system` |

### Reasoning Rules (Target: 50 rules)

Chia theo industry verticals:

| Industry | # Rules | Example Task Patterns |
|----------|---------|----------------------|
| Fintech | 6 | dashboard, payment, banking, trading, crypto, insurance |
| Healthcare | 5 | patient portal, telemedicine, health records, pharmacy, fitness |
| E-commerce | 6 | product listing, cart, checkout, reviews, catalog, marketplace |
| SaaS B2B | 6 | dashboard, settings, onboarding, pricing, documentation, analytics |
| Education | 4 | LMS, course page, quiz, student portal |
| Beauty/Lifestyle | 3 | booking, portfolio, product showcase |
| Food/Restaurant | 3 | menu, ordering, delivery tracking |
| Real Estate | 3 | listing, virtual tour, agent profile |
| Gaming | 3 | leaderboard, store, profile |
| Travel | 3 | booking, itinerary, reviews |
| Media/News | 3 | article, feed, subscription |
| Generic | 5 | landing page, mobile app, redesign, audit, new project |

### Script: `tools/skill-search/reason_skills.py`

```bash
# Usage
python reason_skills.py "fintech dashboard"
# Output:
# 🧠 Industry detected: Fintech
# 📋 Recommended Skill Chain:
#
# Phase 1 (Discovery):
#   → industry_ui_reasoning (R1) — Design reasoning cho Fintech
#
# Phase 2 (Design):
#   → ui_style_selection (R1) — Chọn style phù hợp
#   → color_palette_generator (R1) — Generate color scheme
#   → typography_pairing (R0) — Chọn cặp font
#
# Phase 3 (Build):
#   → chart_data_visualization (R1) — Chọn chart types
#   → design_system_generator (R2) — Tạo design system
#   → react_performance_audit (R2) — Kiểm hiệu năng
#
# Phase 4 (Review):
#   → interaction_design_review (R1) — Audit UX
#   → dark_light_mode_audit (R1) — Check dark/light
#   → ui_pre_delivery_checklist (R1) — Final checklist
#
# 💡 Rationale: Fintech cần trust-focused design, data-dense UI,
#    performance-critical rendering

python reason_skills.py "beauty spa landing page"
# 🧠 Industry: Beauty/Lifestyle
# 📋 Skill Chain: ui_style → color_palette → landing_page_pattern
#    → conversion_landing_optimizer → product_page_style_matcher
```

### Acceptance Criteria

- [ ] ≥ 50 reasoning rules covering 12 industries
- [ ] Mỗi rule có skill_chain ≥ 2 skills
- [ ] Skill chains ordered by CVF phase (Discovery → Design → Build → Review)
- [ ] `reason_skills.py` detect industry from free-text query
- [ ] Fallback to "Generic" nếu không match industry
- [ ] Cross-domain skills trong 1 chain (product_ux + web_development + app_development)
- [ ] All skill_ids in chains tồn tại trong `skills_index.csv`

### Estimated Time: 2 hours

---

## ✅ Sprint 4: Skill Planner CLI — DONE

**Goal:** Combine search + reasoning → `plan_skills.py` nhận task description, output full Skill Execution Plan.

**Location:** `tools/skill-search/plan_skills.py`

### Usage

```bash
python plan_skills.py --task "Tạo e-commerce mobile app cho thời trang" --output plan.md
```

### Output: Skill Execution Plan (`plan.md`)

```markdown
# Skill Execution Plan

> **Task:** Tạo e-commerce mobile app cho thời trang
> **Industry:** E-commerce / Fashion
> **Generated:** 2026-02-22
> **Total Skills:** 12
> **Estimated Effort:** 3-5 days

---

## Phase: Discovery (2 skills)

### 1. Industry UI Reasoning
- **File:** app_development/industry_ui_reasoning.skill.md
- **Risk:** R1 | **Difficulty:** Medium
- **Purpose:** Xác định design direction cho Fashion E-commerce
- **Action:** Nhập ngành + sản phẩm → nhận style + color + anti-patterns

### 2. Landing Page Pattern
- **File:** web_development/07_landing_page_pattern.skill.md
- **Risk:** R0 | **Difficulty:** Easy
- **Purpose:** Chọn layout pattern phù hợp

---

## Phase: Design (4 skills)

### 3. UI Style Selection
...

## Phase: Build (4 skills)
...

## Phase: Review (2 skills)
...

---

## Dependencies
- Skill 3 depends on output of Skill 1
- Skill 5 depends on output of Skill 3 + 4

## Notes
- Fashion E-commerce: Prioritize visual quality, photography-heavy
- Mobile-first: Test trên 375px, 414px
```

### Script Logic

```python
# 1. Parse --task text
# 2. Load skill_reasoning.csv → match industry + task_pattern
# 3. Get skill_chain from matched rule
# 4. For each skill in chain:
#    a. Load metadata from skills_index.csv
#    b. Read skill file → extract "Mục đích" section
#    c. Group by CVF phase
# 5. Generate markdown plan
# 6. Write to --output file (or stdout)
```

### Options

```
--task TEXT       Task description (required)
--output FILE    Output file (default: stdout)
--format md|json Output format (default: md)
--max-skills N   Limit skill count (default: 15)
--phase PHASE    Filter to specific phase only
--verbose        Show reasoning details
```

### Acceptance Criteria

- [ ] Accepts free-text task description
- [ ] Outputs structured Skill Plan (md or json)
- [ ] Skills grouped by CVF phase
- [ ] Dependencies shown between skills
- [ ] Effort estimation included
- [ ] Handles Vietnamese input (`Tạo app thương mại điện tử`)
- [ ] Graceful fallback khi không match industry (use Generic rules)
- [ ] `--json` output valid JSON

### Estimated Time: 1.5 hours

---

## ✅ Sprint 5: Web UI Integration — DONE

**Goal:** Integrate search + reasoning vào cvf-web dashboard.

**Location:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/`

### Deliverables

| Deliverable | Status |
|-------------|--------|
| `src/lib/skill-search.ts` — BM25 TypeScript port (~280 lines) | ✅ |
| `src/lib/skill-planner.ts` — Reasoning + Planner engine (~260 lines) | ✅ |
| `src/components/SkillSearchBar.tsx` — Search UI with debounce | ✅ |
| `src/components/SkillPlanner.tsx` — Task → Skill Plan display | ✅ |
| `src/components/IndustryFilter.tsx` — Domain/Industry filter pills | ✅ |
| `src/components/SkillGraph.tsx` — Visual skill relationship graph | ✅ |
| `src/app/skills/search/page.tsx` — Full search page route | ✅ |
| `public/data/skills_index.csv` + `skill_reasoning.csv` | ✅ |
| 16 lib tests (skill-search) + 14 lib tests (skill-planner) | ✅ |
| 11 component tests (SkillSearch.test.tsx) | ✅ |
| **Total: 1412 tests pass (was 1371)** | ✅ |

### Implementation Plan

1. **Port BM25 sang TypeScript** — `src/lib/skill-search.ts`
2. **Load CSV data** — `public/data/skills_index.csv` + `skill_reasoning.csv`
3. **Search UI** — Real-time search with debounce (300ms)
4. **Planner UI** — Free-text input → card-based skill chain display
5. **Mobile responsive** — Works at 375px+

### Acceptance Criteria

- [ ] Search returns results < 200ms
- [ ] Planner shows visual skill chain
- [ ] Cross-domain linking visible
- [ ] Mobile responsive
- [ ] Existing tests still pass (1371+ tests)
- [ ] No performance regression (LCP < 2.5s)

### Estimated Time: 4 hours

---

## ✅ Sprint 6: CLI Package — DONE

**Goal:** Package CVF Skill Library as npm CLI tool.

**Location:** `tools/cvf-skills-cli/`

### Deliverables

| Deliverable | Status |
|-------------|--------|
| `bin/cvf-skills.js` — CLI entry point with arg parsing | ✅ |
| `src/bm25.js` — BM25 engine for Node.js (ESM) | ✅ |
| `src/data.js` — CSV parser + data loaders | ✅ |
| `src/commands.js` — search/plan/list/init commands | ✅ |
| `src/index.js` — Package exports | ✅ |
| `data/skills_index.csv` + `skill_reasoning.csv` bundled | ✅ |
| `src/commands.test.js` — 23 tests (node --test) | ✅ |
| `README.md` — Full documentation | ✅ |
| Vietnamese input normalization | ✅ |
| 6 AI platform init templates (copilot/cursor/claude/chatgpt/gemini/windsurf) | ✅ |
| Zero dependencies, Node >=18, ESM | ✅ |

```bash
# Usage examples
cvf-skills search "landing page"          # BM25 search
cvf-skills plan --task "fintech dashboard" # Skill Execution Plan
cvf-skills list                            # Show all domains
cvf-skills init copilot                    # Generate AI config
```

### Scope

- npm package with bin entry
- Bundles skills_index.csv + skill_reasoning.csv
- Search + Plan commands
- Init command generates AI-specific skill injection
- Supports: Copilot, Cursor, Claude, ChatGPT, Gemini, Windsurf

### Estimated Time: 6 hours (future sprint)

---

## 📐 Architecture Overview

```
CVF Skill Library v1.5.3
├── data/                          ← NEW: Structured data layer
│   ├── skills_index.csv           ← Sprint 1: Metadata for 141 skills
│   └── skill_reasoning.csv        ← Sprint 3: 50 industry reasoning rules
│
├── tools/skill-search/            ← NEW: Search & reasoning engine
│   ├── bm25.py                    ← Sprint 2: BM25 scoring (pure Python)
│   ├── stopwords.py               ← Sprint 2: vi+en stopwords
│   ├── search_skills.py           ← Sprint 2: Search CLI
│   ├── reason_skills.py           ← Sprint 3: Reasoning CLI
│   ├── plan_skills.py             ← Sprint 4: Planner CLI
│   ├── test_search.py             ← Sprint 2: Tests
│   └── README.md                  ← Sprint 2: Documentation
│
├── tools/skill-index/             ← NEW: Index management
│   ├── generate_index.py          ← Sprint 1: Parse .skill.md → CSV
│   ├── validate_index.py          ← Sprint 1: CSV ↔ file sync check
│   └── README.md                  ← Sprint 1: Documentation
│
├── tools/skill-validation/        ← EXISTING
│   ├── validate_skills.py
│   └── ...
│
├── EXTENSIONS/CVF_v1.5.2.../      ← EXISTING (141 skills)
│   ├── [12 domain folders]
│   ├── data/ → symlink to data/   ← Sprint 1: Data access
│   └── scripts/
│
└── cvf-web/src/lib/               ← Sprint 5: Web integration
    ├── skill-search.ts            ← BM25 TypeScript port
    └── skill-planner.ts           ← Plan generator
```

---

## 📊 Dependency Graph

```
Sprint 0 (DONE)
    │
    ↓
Sprint 1: skills_index.csv ─────┐
    │                            │
    ↓                            ↓
Sprint 2: search_skills.py   Sprint 3: skill_reasoning.csv
    │                            │
    └────────────┬───────────────┘
                 ↓
         Sprint 4: plan_skills.py
                 │
                 ↓
         Sprint 5: Web UI Integration
                 │
                 ↓
         Sprint 6: CLI Package (DONE)
```

**Critical Path:** Sprint 1 → Sprint 2 → Sprint 4  
**Parallel:** Sprint 3 can run alongside Sprint 2 (both depend on Sprint 1 only)

---

## ⏱️ Timeline

| Sprint | Est. Time | Dependencies | Priority |
|--------|-----------|--------------|----------|
| Sprint 1 | 45 min | Sprint 0 ✅ | **HIGH — Start now** |
| Sprint 2 | 1.5 hours | Sprint 1 | **HIGH** |
| Sprint 3 | 2 hours | Sprint 1 | **MEDIUM** (parallel with Sprint 2) |
| Sprint 4 | 1.5 hours | Sprint 2 + 3 | **MEDIUM** |
| Sprint 5 | 4 hours | Sprint 4 | ✅ DONE |
| Sprint 6 | 6 hours | Sprint 4 | ✅ DONE |
| **Total** | **~12 hours** | | |

**Execution order:** 1 → (2 ∥ 3) → 4 → 5 → 6

---

## 🏁 Success Criteria (Definition of Done)

### v1.5.3 Release Gate (Sprint 1-4 complete):

- [ ] `skills_index.csv` has 141 entries, validated
- [ ] `search_skills.py` finds relevant skills < 100ms
- [ ] `skill_reasoning.csv` has 50+ industry rules
- [ ] `plan_skills.py` generates actionable Skill Plans
- [ ] All tools are pure Python (no pip dependencies)
- [ ] All tools have `--help` and usage documentation
- [ ] Existing validate_skills.py still passes
- [ ] Unit tests for search engine pass
- [ ] Committed and pushed to GitHub

### Stretch Goals (Sprint 5-6):

- [x] Web UI search integrated
- [x] CLI package on npm
- [x] AI platform init support (Copilot, Cursor, Claude)

---

## 📝 Credits & Inspiration

- **UUPM Search Engine:** BM25 implementation pattern from [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- **UUPM Reasoning:** Industry-specific design rules concept from `ui-reasoning.csv`
- **UUPM Data Layer:** CSV-based structured data approach
- **CVF Governance:** Risk/Authority/Audit envelope unique to CVF

---

*CVF Skill Library Upgrade Roadmap | Created 2026-02-22 | Target: v1.5.3*
