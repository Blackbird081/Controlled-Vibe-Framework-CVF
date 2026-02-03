# Controlled Vibe Framework (CVF)

**Framework quản lý dự án theo tinh thần *vibe coding có kiểm soát*.**

> **Current Version:** v1.5.2 | **Latest:** CVF Web UI + Skill Library  
> **Assessment:** 9.40/10 ✅ (Jan 29, 2026)  
> **Last Updated:** Feb 03, 2026

---

## 🚀 Quick Start (3 Options)

### Option 1: Web UI (Easiest) ⭐ RECOMMENDED

```bash
cd EXTENSIONS/CVF_v1.5_UX_PLATFORM/cvf-web
npm install
npm run dev
# → http://localhost:3000
```

**Features:**
- 📋 31 templates across 7 categories
- 📝 Form-based input (không cần viết prompt)
- 🚦 3 Export Modes: Simple, With Rules, CVF Full Mode
- 🌐 Bilingual: Vietnamese/English

### Option 2: SDK (Developers)

```python
from cvf import Skill, SkillContract, RiskLevel

contract = SkillContract(
    id="email-classifier-v1",
    name="Email Classifier",
    risk_level=RiskLevel.R1,
    input_spec={"email": str},
    output_spec={"category": str, "confidence": float}
)

skill = Skill(contract)
result = skill.execute({"email": "Buy now!!!"})
```

### Option 3: Manual (Core Docs)

1. Đọc [v1.0/README.md](./v1.0/README.md)
2. Follow 4-phase process: A → B → C → D
3. Use governance checklists

---

## 📚 Chọn Phiên Bản

### Bảng Tham Chiếu Nhanh

| Bạn cần gì? | Phiên bản | Thư mục |
|-------------|:---------:|---------|
| Project nhỏ, nhanh, đơn giản | **v1.0** | [v1.0/](./v1.0/) |
| Người mới bắt đầu vibe coding | **v1.0** | [v1.0/](./v1.0/) |
| Kiểm soát input/output rõ ràng | **v1.1** | [v1.1/](./v1.1/) |
| Multi-agent, phân vai AI | **v1.1** | [v1.1/](./v1.1/) |
| Cần audit, trace đầy đủ | **v1.1** | [v1.1/](./v1.1/) |
| Skill/Capability governance | **v1.2** | [EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/](./EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/) |
| Agent-agnostic skill registry | **v1.2** | [EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/](./EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/) |
| SDK & CLI tools | **v1.3** | [EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/](./EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/) |
| Agent adapters (Claude/GPT) | **v1.3** | [EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/](./EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/) |
| CI/CD integration | **v1.3** | [EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/](./EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/) |
| 👤 Operator Manual | **v1.3.1** | [EXTENSIONS/CVF_v1.3.1_OPERATOR_EDITION/](./EXTENSIONS/CVF_v1.3.1_OPERATOR_EDITION/) |
| 🎨 End-user UX Layer | **v1.4** | [EXTENSIONS/CVF_v1.4_USAGE_LAYER/](./EXTENSIONS/CVF_v1.4_USAGE_LAYER/) |
| 🌐 **Web UI Platform** | **v1.5** | [EXTENSIONS/CVF_v1.5_UX_PLATFORM/](./EXTENSIONS/CVF_v1.5_UX_PLATFORM/) |
| 📋 **Skill Library (37 skills)** | **v1.5.2** | [EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/](./EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) |

---

## 📊 So Sánh Phiên Bản

| Tính năng | v1.0 | v1.1 | v1.2 | v1.3 | v1.5 | v1.5.2 |
|-----------|:----:|:----:|:----:|:----:|:----:|:------:|
| Triết lý core (Outcome > Code) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Phase-based (A→D) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Governance cơ bản | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| INPUT/OUTPUT spec | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agent Archetype + Lifecycle | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Skill Contract Spec | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Skill Registry Model | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Capability Risk Model (R0-R3) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Python SDK | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| CLI Tool (`cvf-validate`) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Agent Adapters (Claude/GPT) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| CI/CD Templates | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **🌐 Web UI** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **📋 Form-based Templates** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **🚦 3 Export Modes** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **📚 37 Skills Library** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🚦 CVF Export Modes (v1.5.2 NEW!)

Web UI hỗ trợ 3 chế độ xuất prompt:

| Mode | CVF Power | Mô tả |
|------|:---------:|-------|
| 📝 **Simple** | ~15% | Quick prompts, không có governance rules |
| ⚠️ **With Rules** | ~35% | +Stop conditions, guardrails |
| 🚦 **CVF Full Mode** | ~80% | 4-Phase protocol đầy đủ (Discovery → Design → Build → Review) |

**CVF Full Mode includes:**
- ✅ 4-Phase Process (A→B→C→D)
- ✅ Phase Gates (điều kiện chuyển phase)
- ✅ AI Role Constraints (Executor, Decision Maker, Quality Owner)
- ✅ Forbidden/Required Actions
- ✅ Scope Control

---

## 📋 Skill Library (v1.5.2)

**37 skills** across **4 domains**:

| Domain | Skills | Description |
|--------|:------:|-------------|
| 📣 Marketing & SEO | 9 | SEO Audit, Copywriting, CRO, Pricing... |
| 🎨 Product & UX | 8 | A/B Test, Accessibility, User Flow, Personas... |
| 🔐 Security & Compliance | 6 | API Security, GDPR, Privacy Policy, Incident Response... |
| 📁 Legacy (General) | 14 | Business Analysis, Technical Review, Content... |

[→ Xem chi tiết Skill Library](./EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/)

---

## 📁 Cấu Trúc Repository

```
Controlled-Vibe-Framework-CVF/
│
├── README.md                  ← Bạn đang ở đây
│
├── v1.0/                      ← Core Baseline (FROZEN)
│   ├── CVF_MANIFESTO.md
│   ├── phases/                ← 4-Phase Process (A→D)
│   ├── governance/            ← Checklists, Gates
│   └── ai/                    ← AI Role Spec
│
├── v1.1/                      ← Extended Control (FROZEN)
│   ├── QUICK_START.md
│   ├── architecture/
│   ├── agents/
│   └── execution/
│
├── EXTENSIONS/                ← All Extensions (v1.2+)
│   │
│   ├── CVF_v1.2_CAPABILITY_EXTENSION/
│   │   └── Skill Registry, Risk Model
│   │
│   ├── CVF_v1.3_IMPLEMENTATION_TOOLKIT/
│   │   └── SDK, CLI, Adapters, CI/CD
│   │
│   ├── CVF_v1.3.1_OPERATOR_EDITION/
│   │   └── Operator Manual
│   │
│   ├── CVF_v1.4_USAGE_LAYER/
│   │   └── Usage Layer Spec
│   │
│   ├── CVF_v1.5_UX_PLATFORM/            ⭐ NEW
│   │   ├── cvf-web/           ← Next.js Web App
│   │   ├── 20_WEB_INTERFACE/
│   │   ├── 21_TEMPLATE_LIBRARY/
│   │   └── 22_ANALYTICS/
│   │
│   └── CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/  ⭐ NEW
│       ├── marketing_seo/     ← 9 skills
│       ├── product_ux/        ← 8 skills
│       ├── security_compliance/ ← 6 skills
│       └── legacy/            ← 14 skills
│
└── docs/
    ├── QUICK_START_INTERNAL.md
    ├── CVF_FRAMEWORK_ASSESSMENT.md
    └── VERSION_COMPARISON.md
```

---

## 📖 Nguyên Tắc

- **v1.0 là baseline**, luôn hợp lệ, không thay đổi (FROZEN)
- **v1.1 là mở rộng opt-in**, không phá core v1.0 (FROZEN)
- **v1.2+ là EXTENSIONS**, mở rộng capability layer, agent-agnostic
- **Chọn phiên bản theo mức độ phức tạp** của project
- **Có thể bắt đầu với v1.0**, bật module v1.1/v1.2+ khi cần

---

## 🧭 Hướng Dẫn Theo Từng Phiên Bản

### v1.0 — Core (Đơn giản, Nhanh)

```
📂 v1.0/
├── README.md              ← Bắt đầu từ đây
├── CVF_MANIFESTO.md       ← Triết lý CVF
├── USAGE.md               ← Cách sử dụng
├── phases/
│   ├── PHASE_A_DISCOVERY.md
│   ├── PHASE_B_DESIGN.md
│   ├── PHASE_C_BUILD.md
│   └── PHASE_D_REVIEW.md
└── governance/
    ├── PROJECT_INIT_CHECKLIST.md
    └── PHASE_C_GATE.md
```

**Best for:** Project nhỏ, người mới bắt đầu, team không cần automation

### v1.1 — Extended Control

```
📂 v1.1/
├── QUICK_START.md         ← 5 phút để hiểu
├── MIGRATION_GUIDE.md     ← Từ v1.0 → v1.1
├── architecture/          ← Kiến trúc chi tiết
├── agents/                ← Agent archetypes
└── execution/             ← Execution spine
```

**Best for:** Multi-agent projects, cần audit/trace, production systems

### v1.5+ — Web UI & Skills

```
📂 EXTENSIONS/CVF_v1.5_UX_PLATFORM/cvf-web/
└── Run: npm install && npm run dev

📂 EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/
└── 37 skill files (.skill.md)
```

**Best for:** End users không biết code, teams cần template library

---

## 🎯 Triết Lý Cốt Lõi

| Nguyên tắc | Giải thích |
|------------|------------|
| **Outcome > Code** | Quan trọng là sản phẩm làm được gì |
| **Control without micromanagement** | Kiểm soát bằng cấu trúc, không can thiệp từng bước |
| **Decisions are first-class citizens** | Mọi quyết định phải được ghi lại |
| **AI là executor, không phải decision maker** | AI làm việc, user đánh giá |
| **Skills được thuần hóa, không được tự do** | AI phải follow rules (v1.2+) |

---

## 📈 What's New in v1.5.2

### 🌐 Web UI Features
- ✅ 31 form-based templates
- ✅ 7 categories (Business, Technical, Content, Research, Marketing, Product, Security)
- ✅ 3 export modes (Simple, With Rules, CVF Full Mode)
- ✅ Bilingual support (Vietnamese/English)
- ✅ AI quick links (ChatGPT, Claude, Gemini)

### 📚 Skill Library Additions
- ✅ Marketing & SEO (9 skills)
- ✅ Product & UX (8 skills)
- ✅ Security & Compliance (6 skills)

### 🚦 CVF Full Mode
- ✅ Complete 4-phase protocol in exported prompts
- ✅ AI Role Constraints embedded
- ✅ Phase gates and checklists

---

## 📄 License

MIT License

---

## 🤝 Đóng Góp

Xem [CONTRIBUTING.md](./v1.0/CONTRIBUTING.md) để biết cách đóng góp.

---

**CVF không giúp bạn đi nhanh hơn. CVF giúp bạn không đi sai.**

---

*Last Updated: 2026-02-03*  
*CVF v1.5.2 — [GitHub](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF)*
