# CVF Skill Library vs UI UX Pro Max — So sánh chi tiết & Mục tiêu nâng cấp

> **Date:** 2026-02-22  
> **Purpose:** Benchmark CVF Skill Library vs UUPM để xác định roadmap nâng cấp  
> **UUPM Repo:** [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)  
> **License:** MIT

---

## 1. Tổng quan hai hệ thống

| Tiêu chí | CVF Skill Library | UI UX Pro Max (UUPM) |
|---|---|---|
| **Mục đích** | Governance framework cho AI skills | Design intelligence cho AI code gen |
| **Dạng sản phẩm** | Full-stack web app + markdown skills | CLI tool + skill files (prompt injection) |
| **Tổng skills/rules** | **141 skills** (12 domains) | **67 styles + 96 palettes + 57 fonts + 100 rules + 99 UX guidelines** |
| **Ngôn ngữ** | TypeScript + Python | Python 80.6%, TypeScript 18% |
| **Data format** | Markdown files (.skill.md) | CSV databases + Python search engine |
| **Distribution** | Web UI (vibcode.netlify.app) | npm CLI (`uipro-cli`) + 15 AI platforms |
| **Search** | ✅ BM25 search engine (Python + TypeScript + CLI) | ✅ BM25 ranking + regex matching |
| **Reasoning** | ✅ 50 reasoning rules + auto skill planning | ✅ 100 industry reasoning rules |
| **Coverage** | 12 domains (business → AI/ML) | Chỉ UI/UX design |
| **Governance** | ✅ Risk/Authority/Audit per skill | ❌ Không có governance layer |
| **i18n** | ✅ Vietnamese + English | ❌ English only |

---

## 2. Điểm mạnh UUPM mà CVF chưa có

### 2.1 Search Engine (BM25)

UUPM có script `search.py` sử dụng BM25 ranking để tìm kiếm đa domain song song:

```bash
python3 search.py "fintech dashboard" --domain style    # Tìm UI style
python3 search.py "beauty spa" --design-system           # Sinh complete design system
```

→ ✅ **CVF đã có:** `search_skills.py` (Python BM25) + `skill-search.ts` (TypeScript web) + `cvf-skills search` (CLI) — index 141 skills, field-weighted search, Vietnamese normalization.

### 2.2 Reasoning Engine (Industry Rules)

UUPM có `ui-reasoning.csv` với 100 rules ánh xạ:

```
Industry → Recommended Pattern + Style Priority + Color Mood + Typography + Effects + Anti-patterns
```

→ ✅ **CVF đã có:** `skill_reasoning.csv` (50 rules, 12 industries) + `reason_skills.py` + `skill-planner.ts` — auto-detect industry, suggest skill chain theo CVF phases.

### 2.3 CSV Data Layer

| UUPM CSV Files | Records | CVF Equivalent |
|---|---|---|
| `styles.csv` | 68 styles | Covered by `ui_style_selection.skill.md` |
| `colors.csv` | 96 palettes | Covered by `color_palette_generator.skill.md` |
| `typography.csv` | 57 pairings | Covered by `typography_pairing.skill.md` |
| `charts.csv` | 25 types | Covered by `chart_data_visualization.skill.md` |
| `landing.csv` | 30 patterns | Covered by `landing_page_pattern.skill.md` |
| `products.csv` | 96 product types | Covered by `product_page_style_matcher.skill.md` |
| `ui-reasoning.csv` | 100 rules | ✅ `skill_reasoning.csv` (50 rules, 12 industries) |
| `ux-guidelines.csv` | ~99 rules | Covered by multiple skill files |

→ ✅ **CVF đã có:** `skills_index.csv` metadata cho 141 skills (ID, domain, risk_level, difficulty, keywords, phases, description, file_path).

### 2.4 CLI Distribution

UUPM: `npm i -g uipro-cli` → `uipro init --ai copilot` (15 platforms)

→ ✅ **CVF đã có:** `cvf-skills` CLI (`tools/cvf-skills-cli/`) — search, plan, list, init commands. Supports 6 AI platforms: Copilot, Cursor, Claude, ChatGPT, Gemini, Windsurf.

### 2.5 Pre-Delivery Checklist (Embedded in Skill)

UUPM nhúng checklist trực tiếp trong skill:
- No emojis as icons (dùng SVG)
- `cursor-pointer` trên clickable elements
- Hover states 150-300ms smooth
- Light mode contrast 4.5:1
- Responsive: 375px, 768px, 1024px, 1440px

→ **CVF đã có** checklist trong mỗi skill, nhưng chưa có **runtime validation**.

---

## 3. Điểm mạnh CVF mà UUPM không có

| Feature | CVF | UUPM |
|---|---|---|
| **Governance envelope per skill** | ✅ Risk Level, Authority Mapping, Audit Hooks | ❌ |
| **Skill Classification** (Assistive/Advisory/Executable/Analytical) | ✅ | ❌ |
| **UAT framework** | ✅ Per-skill UAT records | ❌ |
| **Lifecycle management** (deprecation rules) | ✅ | ❌ |
| **External intake pipeline** | ✅ 6-step governance process | ❌ |
| **Web dashboard** | ✅ Domain Report, Spec Quality scoring | ❌ |
| **Multi-domain coverage** (12 domains) | ✅ Business, Legal, HR, Finance, AI/ML... | ❌ Only UI/UX |
| **Bilingual (vi/en)** | ✅ | ❌ |

---

## 4. Skills đã import từ UUPM (17 skills mới)

### 4.1 Domain: `product_ux` (+6 skills)

| # | Skill ID | Tên | Nguồn UUPM |
|---|---|---|---|
| 1 | `ui_style_selection` | Chọn UI Style theo ngành | `styles.csv` (68 styles) + `ui-reasoning.csv` |
| 2 | `color_palette_generator` | Sinh bảng màu theo sản phẩm | `colors.csv` (96 palettes) |
| 3 | `typography_pairing` | Chọn cặp font phù hợp | `typography.csv` (57 pairings) |
| 4 | `design_system_generator` | Sinh complete design system | `--design-system` workflow |
| 5 | `interaction_design_review` | Đánh giá tương tác UX | `ux-guidelines.csv` (Touch & Interaction) |
| 6 | `dark_light_mode_audit` | Kiểm tra dark/light mode | Common Rules Light/Dark Mode |

### 4.2 Domain: `web_development` (+6 skills)

| # | Skill ID | Tên | Nguồn UUPM |
|---|---|---|---|
| 7 | `chart_data_visualization` | Chọn biểu đồ dữ liệu | `charts.csv` (25 chart types) |
| 8 | `landing_page_pattern` | Chọn pattern landing page | `landing.csv` (30 patterns) |
| 9 | `web_aria_keyboard_audit` | Kiểm tra ARIA & keyboard | `web-interface.csv` |
| 10 | `css_animation_performance` | Đánh giá animation/perf | `ux-guidelines.csv` (Animation) |
| 11 | `react_performance_audit` | Kiểm tra hiệu năng React | `react-performance.csv` |
| 12 | `icon_system_review` | Đánh giá hệ thống icon | `icons.csv` + Common Rules |

### 4.3 Domain: `app_development` (+3 skills)

| # | Skill ID | Tên | Nguồn UUPM |
|---|---|---|---|
| 13 | `mobile_framework_ui_guide` | Hướng dẫn UI cho mobile | `stacks/` (10 frameworks) |
| 14 | `ui_pre_delivery_checklist` | Checklist trước ship UI | Pre-Delivery Checklist |
| 15 | `industry_ui_reasoning` | Reasoning theo ngành | `ui-reasoning.csv` (100 rules) |

### 4.4 Domain: `marketing_seo` (+2 skills)

| # | Skill ID | Tên | Nguồn UUPM |
|---|---|---|---|
| 16 | `conversion_landing_optimizer` | Tối ưu conversion landing | `landing.csv` (Conversion patterns) |
| 17 | `product_page_style_matcher` | Matching style cho sản phẩm | `products.csv` (96 types) |

---

## 5. Tác động

| Metric | Trước | Sau |
|---|---|---|
| **Total skills** | 124 | **141** |
| **product_ux** | 14 | **20** |
| **web_development** | 5 | **11** |
| **app_development** | 41 | **44** |
| **marketing_seo** | 11 | **13** |

---

## 6. Roadmap nâng cấp (Priority Order)

| # | Action | Priority | Status |
|---|---|---|---|
| 1 | ✅ Import 17 skills từ UUPM → CVF format | **HIGH** | **DONE** |
| 2 | Fix README count 131→141 | **HIGH** | **DONE** |
| 3 | ✅ Tạo `skills_index.csv` — metadata cho 141 skills | **HIGH** | **DONE** |
| 4 | ✅ Viết `search_skills.py` — BM25 search engine | **HIGH** | **DONE** |
| 5 | ✅ Tạo `skill_reasoning.csv` — 50 rules, 12 industries | **MEDIUM** | **DONE** |
| 6 | ✅ Viết `plan_skills.py --task "..."` → Skill Plan | **MEDIUM** | **DONE** |
| 7 | ✅ Cross-domain search (TypeScript + Web UI) | **MEDIUM** | **DONE** |
| 8 | ✅ Build `cvf-skills` CLI package (6 AI platforms) | **LOW** | **DONE** |
| 9 | ✅ Intent detection trong cvf-web UI | **LOW** | **DONE** |

> ✅ **10/10 roadmap items hoàn thành.** All gaps from UUPM comparison have been addressed.

---

## 7. Credits

Skills adapted from [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) under MIT License.  
Original author: [nextlevelbuilder](https://github.com/nextlevelbuilder)
