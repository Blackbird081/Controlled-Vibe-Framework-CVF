# CVF Skill Library - Governance Layer

> **Version:** 1.6.2  
> **Status:** Active  
> **Location:** `governance/skill-library/`  
> **Last Updated:** Feb 18, 2026

---

## 📋 Overview

CVF Skill Governance là lớp kiểm soát hoàn chỉnh cho việc quản lý **Skill/Capability** trong hệ thống AI Agent. Module này:

- **Kiểm soát User Skills** (v1.5.2 SKILL_LIBRARY - 124 skills)
- **Kiểm soát Agent Skills** (v1.6 AGENT_PLATFORM - 20 tools)
- **Đánh giá rủi ro** (Risk Assessment) cho mỗi skill
- **Gán quyền hạn** (Authority Mapping) cho agent
- **Kiểm soát vòng đời** (Lifecycle Management)
- **Kiểm thử tuân thủ** (UAT Compliance Testing)

---

## 🎯 Core Principle

> **Agent AI không được cấp quyền dựa trên trí thông minh,**  
> **mà dựa trên mức độ kiểm soát và có thể audit được.**

---

## 📁 File Structure

```
governance/skill-library/
├── README.md                              # This file
├── INTEGRATION_ROADMAP.md                 # Implementation plan
│
├── specs/                                 # Governance specifications (9 files)
│   ├── CVF_SKILL_SPEC.md                  # Skill format specification
│   ├── CVF_RISK_AUTHORITY_MAPPING.md      # Risk Level → Agent Authority
│   ├── CVF_SKILL_RISK_AUTHORITY_LINK.md   # Skill ↔ Risk ↔ Authority binding
│   ├── CVF_AUTONOMOUS_EXTENSION.md        # Autonomous governance block
│   ├── SKILL_MAPPING_RECORD.md            # Template for skill records
│   ├── EXTERNAL_SKILL_INTAKE.md           # External skill import process
│   ├── SKILL_ADAPTATION_GUIDE.md          # CVF compliance adaptation
│   ├── SKILL_DEPRECATION_RULES.md         # Lifecycle & retirement
│   └── GOVERNANCE_DASHBOARD_DESIGN.md     # Dashboard UI specification
│
├── registry/                              # Skill governance records
│   ├── generate_user_skills.py            # 🔧 Script: generate .gov.md files
│   ├── validate_registry.py               # 🔧 Script: CI/CD validation
│   ├── import_skillsmp.py                 # 🔧 Script: import SkillsMP shortlist
│   ├── convert_shortlist_to_cvf.py        # 🔧 Script: shortlist → CVF skills
│   ├── inject_autonomous_extension.py     # 🔧 Script: add governance block
│   ├── generate_mapping_records.py        # 🔧 Script: mapping records
│   ├── run_external_intake.py             # 🔧 Script: end-to-end intake
│   ├── user-skills/                       # → v1.5.2 skills (124 .gov.md + INDEX)
│   │   ├── INDEX.md
│   │   ├── USR-001_*.gov.md
│   │   └── ...
│   ├── agent-skills/                      # → v1.6 tools (20 .gov.md + INDEX)
│       ├── INDEX.md
│       ├── AGT-001_web_search.gov.md
│       └── ... (AGT-001 to AGT-020)
│   ├── mapping-records/                   # Skill mapping records (per-skill)
│   │   ├── SKILL-<skill_id>.md
│   │   └── ...
│   └── external-sources/                  # External intake (shortlists)
│       └── skillsmp/                      # SkillsMP shortlist outputs
│           ├── skillsmp_shortlist.json
│           ├── skillsmp_shortlist.csv
│           └── skillsmp_shortlist.md
│
├── uat/                                   # UAT framework
│   ├── AGENT_AI_UAT_CVF_TEMPLATE.md       # UAT template
│   ├── SKILL_MAPPING_UAT_BINDING.md       # UAT ↔ Skill binding
│   ├── generate_uat_records.py            # 🔧 Script: per-skill UAT records
│   ├── score_uat.py                        # 🔧 Script: UAT scoring + reports
│   └── results/                           # UAT test results
│       ├── UAT-<skill_id>.md
│       └── ...
│   └── reports/                           # UAT score reports
│       ├── uat_score_report.json
│       ├── uat_score_report.csv
│       └── uat_score_report.md
│
└── examples/
    └── SK-001_CODE_REVIEW_ASSISTANT.md    # Complete example
```

---

## 🔐 Risk Levels (Canonical)

> ⚠️ **Note:** Governance layer extends v1.2 risk model (R0–R3) to include **R4 – Critical**.

| Level | Name | Description | Agent Authority |
|-------|------|-------------|-----------------|
| **R0** | Minimal | No real impact | Auto |
| **R1** | Low | Minor confusion, recoverable | Auto + Audit |
| **R2** | Medium | Business process impact | HITL Required |
| **R3** | High | Operational/legal risk | Suggest-only |
| **R4** | Critical | Severe/irreversible damage | Blocked |

---

## 🔄 Workflow

```
External Skill
     ↓
[1] EXTERNAL_SKILL_INTAKE.md    → Evaluate fit
     ↓
[2] SKILL_ADAPTATION_GUIDE.md   → Transform for CVF
     ↓
[3] SKILL_MAPPING_RECORD.md     → Document as source of truth
     ↓
[4] CVF_SKILL_RISK_AUTHORITY_LINK.md → Bind to governance
     ↓
[5] AGENT_AI_UAT_CVF_TEMPLATE.md → Test compliance
     ↓
[6] SKILL_DEPRECATION_RULES.md  → Ongoing lifecycle review
```

---

## 🔗 Relationship to CVF

### Dependencies
- Extends: `v1.2 CAPABILITY_EXTENSION` (risk model foundation)
- Complements: `v1.5.2 SKILL_LIBRARY_FOR_END_USERS` (user-facing skills)
- Integrates with: `v1.6 AGENT_PLATFORM` (agent execution)

### Position in Stack
```
CVF v1.6 Agent Platform
     ↑ executes
CVF_SKILL_LIBRARY (Governance)
     ↑ governs
CVF v1.5.2 Skill Library (Content)
```

---

## ⚠️ Non-Negotiable Rules

1. **No skill without mapping record** - Undocumented skills cannot execute
2. **Undefined authority = Forbidden** - Default deny policy
3. **UAT tests compliance, not capability** - Agent pass/fail based on governance
4. **Skills borrow authority** - CVF grants, CVF revokes
5. **Remove skills is maturity** - Deprecation is healthy

---

## 📊 Assessment Status

| Criterion | Score | Notes |
|-----------|-------|-------|
| Logic & Design | 9.5/10 | Strong governance foundation |
| Internal Consistency | 8/10 | Risk levels standardized |
| Completeness | 8.5/10 | Examples added |
| Actionability | 9/10 | Templates ready to use |
| **Overall** | **8.5/10** | Ready for CVF integration |

---

## 🚀 Status

- [x] Structure setup completed
- [x] User Skills registry (124 skills)
- [x] Agent Skills registry (20 tools)
- [x] UAT templates integrated
- [x] CI/CD auto-run registry validation
- [ ] Implement Dashboard in v1.3 Toolkit
- [x] Registry validation script (CI/CD)

---

## 🛠️ Scripts

### Generate User Skills Registry

```bash
cd governance/skill-library
python registry/generate_user_skills.py
```

Script tự động:
- Scan v1.5.2 SKILL_LIBRARY (124 skills, 12 domains)
- Generate `.gov.md` files với metadata chuẩn
- Assign Risk Level mặc định theo domain
- Tạo INDEX.md

**Output:** `registry/user-skills/USR-*.gov.md`

---

### Import Skills from SkillsMP (External Intake)

```bash
cd governance/skill-library
SKILLSMP_API_KEY="***" python registry/import_skillsmp.py --limit 50
```

Script tự động:
- Pull skills từ SkillsMP theo ưu tiên **App Development**
- Lọc theo các domain đã có trong CVF
- Chọn shortlist 50 skills và map về CVF domain

**Output:**
- `registry/external-sources/skillsmp/skillsmp_shortlist.json`
- `registry/external-sources/skillsmp/skillsmp_shortlist.csv`
- `registry/external-sources/skillsmp/skillsmp_shortlist.md`

---

### Run External Intake (End-to-End)

```bash
cd governance/skill-library
SKILLSMP_API_KEY="***" python registry/run_external_intake.py --limit 50 --per-category 50
```

Script tự động:
- Import shortlist → Convert → Inject Autonomous
- Generate mapping records + UAT records
- Validate skills + regenerate governance registry

---

### Convert SkillsMP Shortlist → CVF Skills

```bash
cd governance/skill-library
python registry/convert_shortlist_to_cvf.py --limit 50
```

Script tự động:
- Dedupe theo repo (ưu tiên mô tả tốt hơn)
- Tạo `.skill.md` chuẩn CVF theo domain
- Ghi mapping tại `skillsmp_to_cvf_map.md`

**Output:**
- `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/<domain>/*.skill.md`
- `registry/external-sources/skillsmp/skillsmp_to_cvf_map.md`

---

### Inject CVF Autonomous Extension (All Skills)

```bash
cd governance/skill-library
python registry/inject_autonomous_extension.py
```

Script tự động:
- Thêm Governance Summary + Constraints + Validation + UAT Binding
- Bảo đảm skill sẵn sàng cho autonomous execution

---

### Generate Skill Mapping Records

```bash
cd governance/skill-library
python registry/generate_mapping_records.py
```

Script tự động:
- Tạo mapping record cho từng skill
- Đồng bộ risk/authority từ governance block

---

### Generate UAT Records (Per Skill)

```bash
cd governance/skill-library
python uat/generate_uat_records.py
```

Script tự động:
- Tạo file UAT cho từng skill
- Seed test case theo domain
- Liên kết mapping record + risk level

---

### Score UAT & Export Reports

```bash
cd governance/skill-library
python uat/score_uat.py
```

Script tự động:
- Tự chấm điểm UAT theo rule
- Xuất report `.json/.csv/.md` để hiển thị trên UI

---

### Report Spec Metrics (Input Quality)

```bash
cd governance/skill-library
python registry/report_spec_metrics.py
```

Script tự động:
- Tính Spec Score/Quality cho toàn bộ `.skill.md`
- Xuất report `.json/.csv/.md` để dùng cho Domain Report (Spec Avg)
- Không chỉnh sửa nội dung skill gốc

---

### Validate Registry (CI/CD)

```bash
cd governance/skill-library
python registry/validate_registry.py
```

Script tự động:
- Check registry structure và required sections
- Verify source links tới `.skill.md`
- Đối chiếu count registry vs source skill library
- Validate INDEX.md counts

**Exit code:** `0` nếu pass, `1` nếu fail

---

### CI/CD Auto-Run

Registry validation tự chạy trong CI khi có thay đổi:
- `governance/skill-library/registry/**.py`
- `governance/skill-library/registry/**.md`
- `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/**.skill.md`

---

## 📚 Quick Links

### Registry Index
| Registry | Count | Link |
|----------|-------|------|
| User Skills | 124 | [INDEX.md](./registry/user-skills/INDEX.md) |
| Agent Skills | 20 | [INDEX.md](./registry/agent-skills/INDEX.md) |

### Mapping Records
| Type | Link |
|------|------|
| Skill Mapping Records | [mapping-records](./registry/mapping-records/) |

### UAT Records
| Type | Link |
|------|------|
| Per-skill UAT Results | [results](./uat/results/) |

### Specifications
| Document | Purpose |
|----------|---------|
| [CVF_SKILL_SPEC](./specs/CVF_SKILL_SPEC.md) | Define a valid skill |
| [CVF_AUTONOMOUS_EXTENSION](./specs/CVF_AUTONOMOUS_EXTENSION.md) | Mandatory governance block |
| [SKILL_MAPPING_RECORD](./specs/SKILL_MAPPING_RECORD.md) | Document a specific skill |
| [CVF_RISK_AUTHORITY_MAPPING](./specs/CVF_RISK_AUTHORITY_MAPPING.md) | Understand risk → authority |

### UAT
| Document | Purpose |
|----------|---------|
| [UAT Template](./uat/AGENT_AI_UAT_CVF_TEMPLATE.md) | Test agent compliance |
| [UAT Binding](./uat/SKILL_MAPPING_UAT_BINDING.md) | Skill ↔ UAT linkage |

---

*Agent làm việc trong hệ thống. Dashboard cho con người thấy hệ thống đó có còn đáng tin hay không.*
