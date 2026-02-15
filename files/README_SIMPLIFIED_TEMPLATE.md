# Controlled Vibe Framework (CVF)

> **Vibe coding có kiểm soát - không đi nhanh hơn, mà đi đúng hơn.**

[![Version](https://img.shields.io/badge/version-1.6.0-blue.svg)](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-176%20passing-brightgreen.svg)](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web)
[![Coverage](https://img.shields.io/badge/coverage-94%25-brightgreen.svg)](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web)

---

## 🎯 CVF Trong 30 Giây

CVF giúp bạn **kiểm soát AI coding** thông qua:

- ✅ **4-Phase Process** - Discovery → Design → Build → Review
- ✅ **Governance Toolkit** - Phase gates, risk control, authority matrix
- ✅ **124 Reusable Skills** - Across 12 domains
- ✅ **Web UI + Agent Platform** - No-code interface, multi-agent workflows

**Use CVF khi:**
- Bạn dùng AI (ChatGPT/Claude/Copilot) để code
- Bạn muốn AI code đúng hơn, an toàn hơn
- Bạn cần governance cho team/enterprise

---

## 🚀 Quick Start

### Option 1: Web UI (Recommended - 2 phút)

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install && npm run dev
```

→ Open http://localhost:3000

### Option 2: Core CVF (5 phút)

1. Đọc [Manifesto](v1.0/CVF_MANIFESTO.md)
2. Follow [4-Phase Process](v1.0/phases/)
3. Use [Governance Checklists](v1.0/governance/)

**→ [📖 Full Getting Started Guide](docs/GET_STARTED.md)**

---

## 💡 Vì Sao CVF?

### Vấn Đề: AI Coding Thiếu Kiểm Soát

Khi dùng AI để code mà không có framework:

- ❌ Code bạn không hiểu ("black box")
- ❌ Security vulnerabilities
- ❌ Technical debt tích tụ
- ❌ Không có documentation
- ❌ Team không consistent

### Giải Pháp: CVF's 4-Phase Control

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Phase A    │ →  │  Phase B    │ →  │  Phase C    │ →  │  Phase D    │
│  Discovery  │    │  Design     │    │  Build      │    │  Review     │
├─────────────┤    ├─────────────┤    ├─────────────┤    ├─────────────┤
│ YOU decide  │    │ YOU decide  │    │ AI executes │    │ YOU validate│
│ requirements│    │ architecture│    │ writes code │    │ approve/fix │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Outcome:** Code chất lượng, có kiểm soát, reusable

---

## 🎨 Features

### v1.6 Highlights ⭐

- 🤖 **AI Agent Chat** - Gemini, OpenAI, Anthropic
- 🎯 **Multi-Agent Workflow** - Orchestrator, Architect, Builder, Reviewer
- 🛠️ **8 Agent Tools** - Web search, code execute, calculator...
- 💾 **Chat History** - Persistent conversations
- 🔐 **Governance Toolkit** - Phase/role/risk control
- 📝 **50 Templates** → 📚 **124 Skills** - Bi-directional linking
- 🧪 **Self-UAT** - 1-click testing
- 🌐 **Bilingual** - Vietnamese/English

### Core Features (All Versions)

| Feature | Description |
|---------|-------------|
| **4-Phase Process** | Structured workflow từ idea → production |
| **Governance Model** | Phase gates, risk levels (R0-R3), authority matrix |
| **Skill Library** | 124 reusable skills across 12 domains |
| **Web UI** | No-code template builder + agent chat |
| **Python SDK** | Programmatic access to CVF |
| **CI/CD Templates** | GitHub Actions, GitLab CI |

---

## 📊 Who Uses CVF?

<table>
<tr>
<td width="33%" align="center">

### 👤 Solo Developers

"CVF giúp tôi code với AI<br>mà không lo bị lạc hướng"

[→ Solo Guide](docs/guides/solo-developer.md)

</td>
<td width="33%" align="center">

### 👥 Small Teams

"Team mình consistent hơn,<br>reuse được nhiều skills"

[→ Team Setup](docs/guides/team-setup.md)

</td>
<td width="33%" align="center">

### 🏢 Enterprise

"CVF cho governance đầy đủ<br>mà vẫn giữ được tốc độ"

[→ Enterprise](docs/guides/enterprise.md)

</td>
</tr>
</table>

---

## 🗺️ Choose Your Path

### 🚦 Bắt đầu từ đâu?

| Bạn là ai? | Recommended Path |
|-----------|------------------|
| 🆕 **Mới dùng AI coding** | [CVF Essentials](docs/GET_STARTED.md#-solo-developer---5-phút) → Hiểu 4 phases → Chạy 1 example |
| 💻 **Solo developer** | [Web UI](docs/tutorials/web-ui-setup.md) → Pick template → Build project |
| 👥 **Team lead** | [Team Setup](docs/guides/team-setup.md) → Governance → Collaboration |
| 🏢 **Enterprise** | [Enterprise Guide](docs/guides/enterprise.md) → Pilot → Scale |
| 🛠️ **Want to contribute** | [Developer Guide](docs/reference/developer-guide.md) → Pick issue → Submit PR |

**→ [📖 Comprehensive Getting Started Guide](docs/GET_STARTED.md)**

---

## 📚 Documentation

| Category | Links |
|----------|-------|
| **🎓 Learn** | [Core Philosophy](docs/concepts/core-philosophy.md) · [4-Phase Process](docs/concepts/4-phase-process.md) · [Governance](docs/concepts/governance-model.md) |
| **🚀 Build** | [First Project](docs/tutorials/first-project.md) · [Web UI](docs/tutorials/web-ui-setup.md) · [Agent Platform](docs/tutorials/agent-platform.md) |
| **📖 Reference** | [API](docs/reference/api/) · [CLI](docs/reference/cli/) · [Skill Spec](docs/reference/skill-spec.md) |
| **🧩 Skills** | [Skill Library](EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) - 124 skills across 12 domains |
| **⚙️ Tools** | [Python SDK](EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/) · [CI/CD](EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/ci-cd/) |

**Full docs:** [cvf.io/docs](https://cvf.io/docs) (coming soon) | [GitHub Wiki](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/wiki)

---

## 🏗️ Architecture

CVF có 3 lớp - chọn đúng lớp bạn cần:

```
┌─────────────────────────────────────────────────────────┐
│  🌐 PLATFORM (Layer 3)  — Web UI, Agent Chat, Dashboard │
│     v1.5, v1.6          — Reference implementation      │
│     → Use khi cần UI/demo                                │
├─────────────────────────────────────────────────────────┤
│  🛠️ TOOLS (Layer 2)      — Scoring, UAT, Validation      │
│     v1.3, governance/   — Python scripts, CI/CD         │
│     → Use khi cần automation                             │
├─────────────────────────────────────────────────────────┤
│  📖 CORE (Layer 1)       — Principles, Phases, Skills    │
│     v1.0, v1.1, v1.2    — Rules + Skill Library         │
│     → LUÔN cần. Bắt đầu từ đây.                         │
└─────────────────────────────────────────────────────────┘
```

**Read more:** [CVF Positioning](docs/CVF_POSITIONING.md)

---

## 🎯 Version Guide

**Confused about versions? Use this:**

- **v1.0** - Core baseline (simple, fast)
- **v1.1** - Extended control (input/output specs, multi-agent)
- **v1.2** - Skill governance (registry, risk model)
- **v1.3** - SDK & Tooling (Python, CLI, CI/CD)
- **v1.5** - Web UI (FROZEN, maintenance only)
- **v1.5.2** - Skill Library (124 skills, ACTIVE)
- **v1.6** ⭐ - Agent Platform (AI chat, multi-agent, governance)

**Which should you use?**

→ See: [Version Comparison](docs/VERSION_COMPARISON.md) | [Decision Tree](docs/cheatsheets/version-picker.md)

---

## 🧪 Examples

### Example 1: Simple Task Manager (v1.0)

```bash
# 1. Follow 4 phases
Phase A: Define requirements
Phase B: Design architecture  
Phase C: Let AI generate code
Phase D: Review & approve

# 2. Use checklist
v1.0/governance/PHASE_C_GATE.md
```

### Example 2: API Backend (v1.6 Web UI)

```bash
# 1. Start web UI
npm run dev

# 2. Templates → "API Backend"

# 3. Fill form:
- Database: PostgreSQL
- Auth: JWT
- Risk Level: R2

# 4. Export → Use with Claude/GPT

# 5. Validate with Self-UAT
```

### Example 3: Enterprise Project (v1.1 + v1.3)

```bash
# 1. Set governance policy
governance/toolkit/02_POLICY/master-policy.md

# 2. Define phases with contracts
v1.1/architecture/CONTRACT_SPECIFICATION.md

# 3. Use SDK for automation
python -m cvf.cli validate-skill my-skill.yaml

# 4. Integrate with CI/CD
.github/workflows/cvf-validation.yml
```

---

## 🌟 Testimonials

> "CVF transformed how our team uses AI. We're 40% faster but with better quality."
> — **Team Lead, SaaS Startup**

> "The governance toolkit gives us confidence to use AI in production."
> — **CTO, Enterprise Company**

> "Finally, a framework that respects both speed AND control."
> — **Solo Developer**

_(Want to share your story? [Submit testimonial](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues/new?template=testimonial.md))_

---

## 📈 Project Status

| Metric | Status |
|--------|--------|
| **Version** | 1.6.0 (Feb 2026) |
| **Stability** | Beta (production-ready architecture) |
| **Test Coverage** | 94% statements, 85% branches |
| **Skills** | 124 across 12 domains |
| **Active Development** | Yes - v1.6 improvements ongoing |
| **Community** | Growing - [Join us!](https://discord.gg/cvf) |

**Expert Assessment:** 9.2/10
- ✅ Solid architecture
- ✅ Strong governance model
- ✅ Good code quality
- ⚠️ Need more real-world validation
- ⚠️ Community building in progress

[→ Read Full Assessment](docs/CVF_V16_COMPARATIVE_REVIEW_2026-02-13.md)

---

## 🤝 Contributing

We welcome contributions!

**Ways to contribute:**
- 📖 Improve documentation
- 🐛 Report bugs
- ✨ Suggest features
- 🧩 Add new skills
- 🌐 Translate content
- 💬 Help in discussions

**Get started:**
1. Read [Contributing Guide](v1.0/CONTRIBUTING.md)
2. Check [Good First Issues](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
3. Join [Discord](https://discord.gg/cvf)

---

## 📞 Support & Community

### Get Help

- 🔍 **Search:** [Documentation](docs/GET_STARTED.md) | [FAQ](docs/faq.md)
- 💬 **Chat:** [Discord](https://discord.gg/cvf) - Fastest response
- 🐛 **Issues:** [GitHub Issues](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues)
- 📧 **Email:** support@cvf.io (for sensitive topics)

### Stay Updated

- ⭐ **Star this repo** to get updates
- 📰 **Follow:** [Blog](https://cvf.io/blog) | [Twitter](https://twitter.com/cvf_framework)
- 📢 **Changelog:** [CHANGELOG.md](CHANGELOG.md)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

Built with love by [@Blackbird081](https://github.com/Blackbird081) and [contributors](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/graphs/contributors).

Inspired by real-world challenges in AI-assisted development.

---

<div align="center">

### 🎯 Remember

**CVF không giúp bạn đi nhanh hơn.**<br>
**CVF giúp bạn không đi sai.**

[⭐ Star on GitHub](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF) · [📖 Get Started](docs/GET_STARTED.md) · [💬 Join Community](https://discord.gg/cvf)

</div>

---

*Last updated: February 13, 2026 | Version 1.6.0*
