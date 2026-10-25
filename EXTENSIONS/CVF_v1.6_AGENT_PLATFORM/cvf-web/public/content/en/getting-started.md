# CVF — Get Started in 5 Minutes

> **🎯 Goal:** Help you understand and run your first CVF project in 5 minutes

---

## 🚦 Who Are You?

Choose the path that fits you:

<table>
<tr>
<td width="25%" align="center">

### 👤 Solo Dev

You want to learn CVF<br>for personal projects

**[→ Get Started](#-solo-developer---5-minutes)**

</td>
<td width="25%" align="center">

### 👥 Small Team

Team of 2-5 people<br>needing collaboration

**[→ Team Setup](#-small-team---15-minutes)**

</td>
<td width="25%" align="center">

### 🏢 Enterprise

Production deployment<br>with full governance

**[→ Enterprise](#-enterprise---30-minutes)**

</td>
<td width="25%" align="center">

### 🛠️ Contributor

Want to contribute<br>to CVF

**[→ Dev Guide](#%EF%B8%8F-contributors)**

</td>
</tr>
</table>

---

## 👤 Solo Developer - 5 Minutes

### Step 1: Understand What CVF Is (2 min read)

**CVF helps you control AI coding without micromanaging.**

#### The Problem CVF Solves

When you use AI (ChatGPT/Claude/Copilot) to code:

- ❌ AI writes code you don't understand
- ❌ Code lacks error handling
- ❌ Security vulnerabilities
- ❌ No documentation
- ❌ Technical debt accumulates

#### CVF Solution: 4-Phase Process

```
Phase A (Discovery)  →  Phase B (Design)  →  Phase C (Build)  →  Phase D (Review)
      ↓                       ↓                    ↓                    ↓
 Requirements            Architecture          AI Codes           You Validate
 YOU decide              YOU decide          AI executes         YOU approve/reject
```

**Golden rule:** AI is the executor, YOU are the decision maker.

### Step 2: Run Your First Example (3 min)

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

1. Click "Templates" → Choose "Simple Todo App"
2. Fill form → Click "Generate"
3. See 4-phase breakdown
4. Export prompt to use with AI

#### Option B: Manual (Core CVF)

Read and follow along with:

- v1.0/USAGE.md — How to use CVF core
- v1.0/phases/ — Details for each phase

### Step 3: Choose Your Next Step

After running your first example:

- 📖 **Go deeper:** Core Philosophy
- 🎯 **Build a real project:** Tutorial: Your First Project
- 🧩 **Use Skills:** Skill Library Guide
- ❓ **Have questions:** Troubleshooting

---

## 👥 Small Team - 15 Minutes

### Prerequisites

- Node.js 18+
- Git
- 2-5 team members

### Step 1: Setup (5 min)

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

### Step 2: Team Onboarding (5 min)

**Share with the team:**

1. **Roles in CVF:**
   - 🎯 **Project Owner:** Decides requirements (Phase A)
   - 🎨 **Architect:** Designs solution (Phase B)
   - 🤖 **AI Executor:** Generates code (Phase C)
   - ✅ **Reviewer:** Validates quality (Phase D)

2. **Workflow:**

   ```
   Owner defines → Architect designs → AI builds → Reviewer validates
   ```

3. **Tools:**
   - Web UI: Templates & Skills
   - Governance Toolkit: Phase gates, risk control
   - Skill Library: 124 reusable skills

### Step 3: First Team Project (5 min)

**Run a sample project together:**

1. Owner: Pick a template (e.g., "API Backend")
2. Architect: Customize design requirements
3. AI: Generate code using exported prompt
4. Reviewer: Use CVF checklist to validate

**Checklist location:** governance/toolkit/

### Next Steps for Teams

- 📋 Team Collaboration Guide
- 🔐 Governance Setup
- 🔄 CI/CD Integration
- 📊 Track Metrics

---

## 🏢 Enterprise - 30 Minutes

### Phase 1: Assessment (10 min)

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

**Read:** Enterprise Guide

### Phase 2: Pilot Setup (10 min)

**Start small — 1 team, 1 project:**

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

### Phase 3: Measure & Scale (10 min)

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

- 🏢 Enterprise Deployment
- 🔐 Security & Compliance
- 📊 Governance Dashboard
- 🎓 Training Materials

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

- Read: CONTRIBUTING.md
- Code style: Contributing Guide
- Skill creation: Custom Skills Tutorial

### Get Help

- 💬 Discord — Real-time chat
- 🐛 GitHub Issues
- 📧 Email: <contribute@cvf.io>

---

## 🗺️ Learning Paths

### Path 1: Core Concepts (1-2 hours)

1. Core Philosophy - 15 mins
2. 4-Phase Process - 20 mins
3. Governance Model - 25 mins
4. Skill System - 20 mins

### Path 2: Hands-On Tutorials (2-4 hours)

1. First Project - 30 mins
2. Using Web UI - 45 mins
3. Agent Platform - 60 mins
4. Custom Skills - 90 mins

### Path 3: Deep Dives (ongoing)

- Governance Toolkit — Comprehensive
- Skill Library — 124 skills
- Version History — Evolution
- Architecture — Technical specs

---

## 🆘 Need Help?

### Quick Answers

**"Which version should I use?"**
→ See: Version Picker

**"Setup not working?"**
→ See: Troubleshooting

**"Don't understand governance?"**
→ See: Governance 101

**"Can't find the right skill?"**
→ See: Skill Browser

### Support Channels

1. 🔍 Search Documentation
2. 📚 Troubleshooting
3. 🐛 Browse Issues on GitHub
4. 💬 Ask on Discord
5. ✉️ Email Support

**Response Times:**

- Discord: Usually <2 hours
- GitHub: Usually <24 hours
- Email: Usually <48 hours

---

## 📚 Comprehensive Docs

| Category | Topics |
|----------|--------|
| **Guides** | Solo Dev · Team · Enterprise |
| **Tutorials** | First Project · Web UI · Agent Platform |
| **Concepts** | Philosophy · Phases · Governance |
| **Reference** | Skills · Risk Model · Version History |
| **Cheatsheets** | Versions · Troubleshooting |

---

## 🎯 What's Next?

After getting started, here are recommended next steps:

**For Solo Devs:**
→ Build Your First Real Project

**For Teams:**
→ Set Up Team Collaboration

**For Enterprise:**
→ Plan Your Pilot Program

**For Contributors:**
→ Pick Your First Issue on GitHub

---

**CVF doesn't help you go faster.**
**CVF helps you avoid going wrong.**

---

*Last updated: February 2026 · Version: 1.6.0*

<!-- Text Encoding Exception: pre-existing localized text and symbols are retained; this repair changes only navigation or Markdown structure. -->
