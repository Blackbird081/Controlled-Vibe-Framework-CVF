# Controlled Vibe Framework (CVF)

> **Controlled vibe coding — not faster, but smarter.**

🇬🇧 English | [🇻🇳 Tiếng Việt](docs/GET_STARTED.md)

[![Version](https://img.shields.io/badge/version-1.6.2-blue.svg)](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/releases)
[![License](https://img.shields.io/badge/license-CC%20BY--NC--ND%204.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-1111%2B%20passing-brightgreen.svg)](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web)
[![Coverage](https://img.shields.io/badge/coverage-95.6%25-brightgreen.svg)](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web)
[![Agent Skills](https://img.shields.io/badge/agent%20skills-20-blue.svg)](governance/skill-library/registry/agent-skills/INDEX.md)

---

## 🎯 CVF In 30 Seconds

CVF helps you **control AI coding** through:

- ✅ **4-Phase Process** - Discovery → Design → Build → Review
- ✅ **Governance Toolkit** - Phase gates, risk control, authority matrix
- ✅ **124 Reusable Skills** - Across 12 domains
- ✅ **20 Agent Tools** - RAG, Data Viz, Agentic Loop, Browser Auto, MCP, Workflow Hooks, Scientific Research, Agent Teams & more
- ✅ **Web UI + Agent Platform** - No-code interface, multi-agent workflows

**Use CVF when:**
- You use AI (ChatGPT / Claude / Copilot) for coding
- You want AI to code **correctly and safely**
- You need governance for your team or enterprise

---

## 🚀 Quick Start

### Option 1: Web UI (Recommended — 2 minutes)

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install && npm run dev
```

→ Open http://localhost:3000

### Option 2: Core CVF (5 minutes)

1. Read the [Manifesto](v1.0/CVF_MANIFESTO.md)
2. Follow the [4-Phase Process](v1.0/phases/)
3. Use the [Governance Checklists](v1.0/governance/)

**→ [📖 Full Getting Started Guide](docs/GET_STARTED.md)**

---

## 💡 Why CVF?

### The Problem: Uncontrolled AI Coding

When using AI to code without a framework:

- ❌ Code you don't understand ("black box")
- ❌ Security vulnerabilities
- ❌ Accumulated technical debt
- ❌ No documentation
- ❌ Inconsistent team output

### The Solution: CVF's 4-Phase Control

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Phase A    │ →  │  Phase B    │ →  │  Phase C    │ →  │  Phase D    │
│  Discovery  │    │  Design     │    │  Build      │    │  Review     │
├─────────────┤    ├─────────────┤    ├─────────────┤    ├─────────────┤
│ YOU decide  │    │ YOU decide  │    │ AI executes │    │ YOU validate│
│ requirements│    │ architecture│    │ writes code │    │ approve/fix │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Outcome:** Quality code, controlled process, reusable artifacts

---

## 🎨 Features

### v1.6 Highlights ⭐

- 🤖 **AI Agent Chat** - Gemini, OpenAI, Anthropic
- 🎯 **Multi-Agent Workflow** - Orchestrator, Architect, Builder, Reviewer
- 🛠️ **20 Agent Tools** - Web search, code execute, RAG retrieval, data viz, doc parser, agentic loop, browser automation, MCP connector, workflow hooks, scientific research, document converter, agent teams, progressive loader, analytics dashboard
- 💾 **Chat History** - Persistent conversations
- 🔐 **Governance Toolkit** - Phase/role/risk control (R0–R3)
- 📝 **50 Templates** → 📚 **124 Skills** - Bi-directional linking
- 🧪 **Self-UAT** - 1-click testing
- 🌐 **Bilingual** - Vietnamese/English
- 📱 **Mobile Responsive** - Touch-optimized UI with bottom nav & swipe gestures

### Core Features (All Versions)

| Feature | Description |
|---------|-------------|
| **4-Phase Process** | Structured workflow from idea to production |
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

"CVF helps me code with AI<br>without losing direction"

[→ Solo Guide](docs/guides/solo-developer.md)

</td>
<td width="33%" align="center">

### 👥 Small Teams

"Our team is more consistent<br>and we reuse many skills"

[→ Team Setup](docs/guides/team-setup.md)

</td>
<td width="33%" align="center">

### 🏢 Enterprise

"CVF gives us full governance<br>while maintaining velocity"

[→ Enterprise](docs/guides/enterprise.md)

</td>
</tr>
</table>

---

## 🗺️ Choose Your Path

| Who are you? | Recommended Path |
|-----------|------------------|
| 🆕 **New to AI coding** | [CVF Essentials](docs/GET_STARTED.md#-solo-developer---5-phút) → Learn 4 phases → Run 1 example |
| 💻 **Solo developer** | [Web UI](docs/tutorials/web-ui-setup.md) → Pick template → Build project |
| 👥 **Team lead** | [Team Setup](docs/guides/team-setup.md) → Governance → Collaboration |
| 🏢 **Enterprise** | [Enterprise Guide](docs/guides/enterprise.md) → Pilot → Scale |
| 🛠️ **Want to contribute** | [Contributing Guide](v1.0/CONTRIBUTING.md) → Pick issue → Submit PR |

**→ [📖 Comprehensive Getting Started Guide](docs/GET_STARTED.md)**

---

## 📚 Documentation

| Category | Links |
|----------|-------|
| **🎓 Learn** | [Core Philosophy](docs/concepts/core-philosophy.md) · [4-Phase Process](docs/concepts/4-phase-process.md) · [Governance](docs/concepts/governance-model.md) |
| **🚀 Build** | [First Project](docs/tutorials/first-project.md) · [Web UI](docs/tutorials/web-ui-setup.md) · [Agent Platform](docs/tutorials/agent-platform.md) |
| **📖 Reference** | [Skills](docs/concepts/skill-system.md) · [Risk Model](docs/concepts/risk-model.md) · [Version History](docs/concepts/version-evolution.md) |
| **🧩 Skills** | [Skill Library](EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) - 124 skills across 12 domains |
| **🤖 Agent Skills** | [20 Agent Tools](governance/skill-library/registry/agent-skills/INDEX.md) · [Usage Guide v1](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/content/en/using-agentic-skills.md) · [Usage Guide v2](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/content/en/using-new-skills-v2.md) · [Agentic Patterns](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/content/en/agentic-patterns.md) |
| **⚙️ Tools** | [Python SDK](EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/) · [Governance Toolkit](governance/) |

**Full docs:** [vibcode.netlify.app/docs](https://vibcode.netlify.app/docs) | [GitHub Wiki](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/wiki)

---

## 🏗️ Architecture

CVF has 3 layers + reference implementations:

```
┌─────────────────────────────────────────────────────────┐
│  🌐 PLATFORM (Layer 3)  — Web UI, Agent Chat, Dashboard │
│     v1.6                — Production runtime             │
│     → Use when you need UI/demo                           │
├─────────────────────────────────────────────────────────┤
│  🛠️ TOOLS (Layer 2)      — Scoring, UAT, Validation      │
│     v1.3, governance/   — Python scripts, CI/CD         │
│     → Use when you need automation                        │
├─────────────────────────────────────────────────────────┤
│  📖 CORE (Layer 1)       — Principles, Phases, Skills    │
│     v1.0, v1.1, v1.2    — Rules + Skill Library         │
│     → Always needed. Start here.                          │
└─────────────────────────────────────────────────────────┘

📘 Reference Implementations (controlled extensions):
  • CVF Toolkit Reference    — Governance engine example (TypeScript)
  • CVF Starter Template     — Express server template example
  → Use as learning resources when building new projects
```

**Read more:** [CVF Positioning](docs/CVF_POSITIONING.md)

---

## 🎯 Version Guide

**Confused about versions? Use this:**

- **v1.0** - Core baseline (simple, fast)
- **v1.1** - Extended control (input/output specs, multi-agent)
- **v1.2** - Skill governance (registry, risk model)
- **v1.3** - SDK & Tooling (Python, CLI, CI/CD)
- **v1.5** - UX & End-User orientation (FROZEN)
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
| **Version** | 1.6.2 (Feb 2026) |
| **Stability** | Beta - Production-ready architecture, docs improvements ongoing |
| **Test Coverage** | 95.6% statements, 1111+ tests passing |
| **Skills** | 124 skills across 12 domains + 20 agent tools |
| **Active Development** | Yes - v1.6 + agentic skills + documentation |
| **Community** | Building — Discord coming soon |

**Current Status:** 8.7/10 ([independent assessment](docs/CVF_INDEPENDENT_ASSESSMENT_2026-02-16.md))
- ✅ **Excellent:** Technical quality (9/10), Governance toolkit (9/10), Bilingual (9/10), Testing (9/10)
- ✅ **Good:** Core framework, Architecture, 124 skills + 20 agent tools
- 🟡 **Improving:** Documentation, Usability
- ⏳ **Pending:** Real-world validation, Community, npm/PyPI packages

[→ Get Started](docs/GET_STARTED.md)

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
3. Star this repo and watch for community updates

---

## 📞 Support & Community

### Get Help

- 🔍 **Search:** [Documentation](docs/GET_STARTED.md) | [Troubleshooting](docs/cheatsheets/troubleshooting.md)
- 💬 **Chat:** Discord (coming soon)
- 🐛 **Issues:** [GitHub Issues](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues)
- 📧 **Email:** Coming soon

### Stay Updated

- ⭐ **Star this repo** to get updates
- 📢 **Follow development** via [CHANGELOG.md](CHANGELOG.md)
- 📢 **Changelog:** [CHANGELOG.md](CHANGELOG.md)

---

## 📄 License

**CC BY-NC-ND 4.0** — [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0](LICENSE)

- ✅ Read, share — allowed
- ❌ Commercial use — not allowed
- ❌ Modify and redistribute — not allowed

> The entire repository (including v1.0, v1.1, v1.2+, EXTENSIONS/, docs/, governance/, tools/) is licensed under CC BY-NC-ND 4.0.

---

## 🙏 Acknowledgments

Built with love by [@Blackbird081](https://github.com/Blackbird081) and [contributors](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/graphs/contributors).

Inspired by real-world challenges in AI-assisted development.

---

<div align="center">

### 🎯 Remember

**CVF doesn't help you go faster.**<br>
**CVF helps you avoid going wrong.**

[⭐ Star on GitHub](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF) · [📖 Get Started](docs/GET_STARTED.md) · [💬 Join Community](https://discord.gg/cvf)

</div>

---

*Last updated: February 18, 2026 | Version 1.6.2 | [Documentation](docs/GET_STARTED.md)*
