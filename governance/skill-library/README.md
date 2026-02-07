# CVF Skill Library - Governance Layer

> **Version:** 1.2.0  
> **Status:** Active  
> **Location:** `governance/skill-library/`  
> **Last Updated:** Feb 07, 2026

---

## 📋 Overview

CVF Skill Governance là lớp kiểm soát hoàn chỉnh cho việc quản lý **Skill/Capability** trong hệ thống AI Agent. Module này:

- **Kiểm soát User Skills** (v1.5.2 SKILL_LIBRARY - 69 skills)
- **Kiểm soát Agent Skills** (v1.6 AGENT_PLATFORM - 8 tools)
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
├── specs/                                 # Governance specifications (8 files)
│   ├── CVF_SKILL_SPEC.md                  # Skill format specification
│   ├── CVF_RISK_AUTHORITY_MAPPING.md      # Risk Level → Agent Authority
│   ├── CVF_SKILL_RISK_AUTHORITY_LINK.md   # Skill ↔ Risk ↔ Authority binding
│   ├── SKILL_MAPPING_RECORD.md            # Template for skill records
│   ├── EXTERNAL_SKILL_INTAKE.md           # External skill import process
│   ├── SKILL_ADAPTATION_GUIDE.md          # CVF compliance adaptation
│   ├── SKILL_DEPRECATION_RULES.md         # Lifecycle & retirement
│   └── GOVERNANCE_DASHBOARD_DESIGN.md     # Dashboard UI specification
│
├── registry/                              # Skill governance records
│   ├── generate_user_skills.py            # 🔧 Script: generate .gov.md files
│   ├── validate_registry.py               # 🔧 Script: CI/CD validation
│   ├── user-skills/                       # → v1.5.2 skills (69 .gov.md + INDEX)
│   │   ├── INDEX.md
│   │   ├── USR-001_*.gov.md
│   │   └── ...
│   └── agent-skills/                      # → v1.6 tools (8 .gov.md + INDEX)
│       ├── INDEX.md
│       ├── AGT-001_web_search.gov.md
│       └── ...
│
├── uat/                                   # UAT framework
│   ├── AGENT_AI_UAT_CVF_TEMPLATE.md       # UAT template
│   ├── SKILL_MAPPING_UAT_BINDING.md       # UAT ↔ Skill binding
│   └── results/                           # UAT test results
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
- [x] User Skills registry (69 skills)
- [x] Agent Skills registry (8 tools)
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
- Scan v1.5.2 SKILL_LIBRARY (69 skills, 12 domains)
- Generate `.gov.md` files với metadata chuẩn
- Assign Risk Level mặc định theo domain
- Tạo INDEX.md

**Output:** `registry/user-skills/USR-*.gov.md`

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
| User Skills | 69 | [INDEX.md](./registry/user-skills/INDEX.md) |
| Agent Skills | 8 | [INDEX.md](./registry/agent-skills/INDEX.md) |

### Specifications
| Document | Purpose |
|----------|---------|
| [CVF_SKILL_SPEC](./specs/CVF_SKILL_SPEC.md) | Define a valid skill |
| [SKILL_MAPPING_RECORD](./specs/SKILL_MAPPING_RECORD.md) | Document a specific skill |
| [CVF_RISK_AUTHORITY_MAPPING](./specs/CVF_RISK_AUTHORITY_MAPPING.md) | Understand risk → authority |

### UAT
| Document | Purpose |
|----------|---------|
| [UAT Template](./uat/AGENT_AI_UAT_CVF_TEMPLATE.md) | Test agent compliance |
| [UAT Binding](./uat/SKILL_MAPPING_UAT_BINDING.md) | Skill ↔ UAT linkage |

---

*Agent làm việc trong hệ thống. Dashboard cho con người thấy hệ thống đó có còn đáng tin hay không.*
