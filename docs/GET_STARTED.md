# CVF - Bắt Đầu Trong 5 Phút

[🇬🇧 English guides](guides/) | 🇻🇳 Tiếng Việt

> **🎯 Mục tiêu:** Giúp bạn hiểu và chạy được CVF project đầu tiên trong 5 phút

---

## 🚦 Bạn Là Ai?

Chọn đường đi phù hợp với bạn:

<table>
<tr>
<td width="25%" align="center">

### 👤 Solo Dev

Bạn muốn học CVF<br>cho dự án cá nhân

**[→ Bắt đầu](#-solo-developer---5-phút)**

</td>
<td width="25%" align="center">

### 👥 Small Team

Team 2-5 người<br>cần collaboration

**[→ Team Setup](#-small-team---15-phút)**

</td>
<td width="25%" align="center">

### 🏢 Enterprise

Production deployment<br>với governance đầy đủ

**[→ Enterprise](#-enterprise---30-phút)**

</td>
<td width="25%" align="center">

### 🛠️ Contributor

Muốn contribute<br>vào CVF

**[→ Dev Guide](#-contributors)**

</td>
</tr>
</table>

---

## 👤 Solo Developer - 5 Phút

### Step 1: Hiểu CVF Là Gì (2 phút đọc)

**CVF giúp bạn kiểm soát AI coding mà không cần micromanage.**

#### Vấn Đề CVF Giải Quyết

Khi bạn dùng AI (ChatGPT/Claude/Copilot) để code:

- ❌ AI viết code bạn không hiểu
- ❌ Code thiếu error handling
- ❌ Security vulnerabilities
- ❌ Không có documentation
- ❌ Technical debt tích tụ

#### CVF Solution: 4-Phase Process

```
Phase A (Discovery)  →  Phase B (Design)  →  Phase C (Build)  →  Phase D (Review)
      ↓                       ↓                    ↓                    ↓
 Requirements            Architecture          AI Codes           You Validate
 YOU decide              YOU decide          AI executes         YOU approve/reject
```

**Nguyên tắc vàng:** AI là executor, BẠN là decision maker.

### Step 2: Chạy Ví Dụ Đầu Tiên (3 phút)

#### Option A: Web UI (Recommended)

```bash
# Clone repo
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF

# Start web UI
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install
npm run dev

# Open browser: http://localhost:3000
```

**What to try:**
1. Click "Templates" → Chọn "Simple Todo App"
2. Fill form → Click "Generate"
3. See 4-phase breakdown
4. Export prompt to use with AI

#### Option B: Manual (Core CVF)

Đọc file này và làm theo:
- [v1.0/USAGE.md](../v1.0/USAGE.md) - Cách dùng CVF core
- [v1.0/phases/](../v1.0/phases/) - Chi tiết từng phase

### Step 3: Chọn Bước Tiếp Theo

Sau khi chạy được ví dụ đầu tiên:

- 📖 **Hiểu sâu hơn:** [Core Philosophy](concepts/core-philosophy.md)
- 🎯 **Build project thật:** [Tutorial: Your First Project](tutorials/first-project.md)
- 🧩 **Dùng Skills:** [Skill Library Guide](../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/README.md)
- ❓ **Có câu hỏi:** [Troubleshooting](cheatsheets/troubleshooting.md)

---

## 👥 Small Team - 15 Phút

### Prerequisites

- Node.js 18+
- Git
- 2-5 team members

### Step 1: Setup (5 phút)

```bash
# 1. Clone repo
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF

# 2. Install dependencies
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env - add API keys if needed

# 4. Start server
npm run dev
```

### Step 2: Team Onboarding (5 phút)

**Share với team:**

1. **Roles trong CVF:**
   - 🎯 **Project Owner:** Quyết định requirements (Phase A)
   - 🎨 **Architect:** Design solution (Phase B)
   - 🤖 **AI Executor:** Generate code (Phase C)
   - ✅ **Reviewer:** Validate quality (Phase D)

2. **Workflow:**
   ```
   Owner defines → Architect designs → AI builds → Reviewer validates
   ```

3. **Tools:**
   - Web UI: Templates & Skills
   - Governance Toolkit: Phase gates, risk control
   - Skill Library: 124 reusable skills

### Step 3: First Team Project (5 phút)

**Run a sample project together:**

1. Owner: Pick a template (e.g., "API Backend")
2. Architect: Customize design requirements
3. AI: Generate code using exported prompt
4. Reviewer: Use CVF checklist to validate

**Checklist location:** [governance/toolkit/](../governance/toolkit/)

### Next Steps for Teams

- 📋 [Team Collaboration Guide](guides/team-setup.md)
- 🔐 [Governance Setup](concepts/governance-model.md)
- 🔄 [CI/CD Integration](../EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/)
- 📊 [Track Metrics](guides/team-setup.md#metrics)

---

## 🏢 Enterprise - 30 Phút

### Phase 1: Assessment (10 phút)

**Evaluate if CVF fits your needs:**

✅ **Good Fit:**
- Using AI for development already
- Need governance & control
- Want reusable skill library
- Need audit trails

❌ **Not Yet:**
- Don't use AI coding
- Pure waterfall process
- No bandwidth for new tools

**Read:** [Enterprise Guide](guides/enterprise.md)

### Phase 2: Pilot Setup (10 phút)

**Start small - 1 team, 1 project:**

```bash
# 1. Set up infrastructure
# - Deploy web UI to internal server
# - Configure SSO/SAML if needed
# - Set up PostgreSQL for persistence

# 2. Configure governance
# - Edit governance/toolkit/02_POLICY/master-policy.md
# - Set risk levels per phase
# - Define approval workflows

# 3. Train pilot team
# - Run CVF workshop (2 hours)
# - Assign roles
# - Start first project
```

### Phase 3: Measure & Scale (10 phút)

**Key Metrics:**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Code Quality | 20% ↑ | SonarQube scores |
| Security Issues | 30% ↓ | Vulnerability scans |
| Dev Velocity | 15% ↑ | Story points/sprint |
| AI Code Reuse | 40%+ | Skill usage analytics |

**Scaling:**
1. Pilot success → Expand to 3 teams
2. 3 teams success → Company-wide rollout
3. Continuous improvement based on metrics

### Enterprise Resources

- 🏢 [Enterprise Deployment](guides/enterprise.md#deployment)
- 🔐 [Security & Compliance](guides/enterprise.md#security)
- 📊 [Governance Dashboard](../governance/toolkit/)
- 🎓 [Training Materials](guides/enterprise.md#training)

---

## 🛠️ Contributors

### Want to Contribute?

**We welcome:**
- 📖 Documentation improvements
- 🐛 Bug fixes
- ✨ New features
- 🧩 New skills for library
- 🌐 Translations

### Quick Start

```bash
# 1. Fork & clone
git clone https://github.com/YOUR_USERNAME/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF

# 2. Create branch
git checkout -b feature/your-feature-name

# 3. Make changes

# 4. Run tests
npm test

# 5. Submit PR
git push origin feature/your-feature-name
# Then create PR on GitHub
```

### Contribution Guidelines

- Read: [CONTRIBUTING.md](../v1.0/CONTRIBUTING.md)
- Code style: [Contributing Guide](../v1.0/CONTRIBUTING.md)
- Skill creation: [Custom Skills Tutorial](tutorials/custom-skills.md)

### Get Help

- 💬 [Discord](https://discord.gg/cvf) - Real-time chat
- 🐛 [GitHub Issues](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues)
- 📧 Email: contribute@cvf.io

---

## 🗺️ Learning Paths

### Path 1: Core Concepts (1-2 hours)

1. [Core Philosophy](concepts/core-philosophy.md) - 15 mins
2. [4-Phase Process](concepts/4-phase-process.md) - 20 mins
3. [Governance Model](concepts/governance-model.md) - 25 mins
4. [Skill System](concepts/skill-system.md) - 20 mins

### Path 2: Hands-On Tutorials (2-4 hours)

1. [First Project](tutorials/first-project.md) - 30 mins
2. [Using Web UI](tutorials/web-ui-setup.md) - 45 mins
3. [Agent Platform](tutorials/agent-platform.md) - 60 mins
4. [Custom Skills](tutorials/custom-skills.md) - 90 mins

### Path 3: Deep Dives (ongoing)

- [Governance Toolkit](../governance/toolkit/) - Comprehensive
- [Skill Library](../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) - 124 skills
- [Version History](concepts/version-evolution.md) - Evolution
- [Architecture](CVF_ARCHITECTURE_DIAGRAMS.md) - Technical specs

---

## 🆘 Need Help?

### Quick Answers

**"Which version should I use?"**
→ See: [Version Picker](cheatsheets/version-picker.md)

**"Setup not working?"**
→ See: [Troubleshooting](cheatsheets/troubleshooting.md)

**"Don't understand governance?"**
→ See: [Governance 101](concepts/governance-model.md)

**"Can't find the right skill?"**
→ See: [Skill Browser](../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/)

### Support Channels

1. 🔍 [Search Documentation](GET_STARTED.md)
2. 📚 [Troubleshooting](cheatsheets/troubleshooting.md)
3. 🐛 [Browse Issues](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues)
4. 💬 [Ask on Discord](https://discord.gg/cvf)
5. ✉️ [Email Support](mailto:support@cvf.io)

**Response Times:**
- Discord: Usually <2 hours
- GitHub: Usually <24 hours
- Email: Usually <48 hours

---

## 📚 Comprehensive Docs

| Category | Link |
|----------|------|
| **Guides** | [Solo Dev](guides/solo-developer.md) · [Team](guides/team-setup.md) · [Enterprise](guides/enterprise.md) |
| **Tutorials** | [First Project](tutorials/first-project.md) · [Web UI](tutorials/web-ui-setup.md) · [Agent](tutorials/agent-platform.md) |
| **Concepts** | [Philosophy](concepts/core-philosophy.md) · [Phases](concepts/4-phase-process.md) · [Governance](concepts/governance-model.md) |
| **Reference** | [Skills](concepts/skill-system.md) · [Risk Model](concepts/risk-model.md) · [Version History](concepts/version-evolution.md) |
| **Cheatsheets** | [Versions](cheatsheets/version-picker.md) · [Troubleshoot](cheatsheets/troubleshooting.md) |

---

## 🌏 Languages

This guide is bilingual (🇬🇧/🇻🇳). Guides and tutorials are in English with Vietnamese navigation links.

---

## 🎯 What's Next?

After getting started, here are recommended next steps:

**For Solo Devs:**
→ [Build Your First Real Project](tutorials/first-project.md)

**For Teams:**
→ [Set Up Team Collaboration](guides/team-setup.md)

**For Enterprise:**
→ [Plan Your Pilot Program](guides/enterprise.md#pilot)

**For Contributors:**
→ [Pick Your First Issue](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

---

<div align="center">

**CVF không giúp bạn đi nhanh hơn.**<br>
**CVF giúp bạn không đi sai.**

[⭐ Star on GitHub](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF) · [📖 Full Docs](https://cvf.io/docs) · [💬 Join Discord](https://discord.gg/cvf)

</div>

---

*Last updated: February 2026 · Version: 1.6.0*
