# CVF Version Picker - Chọn Version Phù Hợp

> **🎯 Mục tiêu:** Giúp bạn chọn đúng CVF version trong 2 phút

---

## 🚦 Quick Decision Tree

```
                    Bắt đầu ở đây
                          │
                          ▼
              ┌───────────────────────┐
              │ Bạn muốn gì với CVF?  │
              └───────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐     ┌──────────┐
    │Learn CVF│      │Build Now│     │Production│
    │Concepts │      │(Web UI) │     │Deployment│
    └─────────┘      └─────────┘     └──────────┘
         │                │                │
         ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐     ┌──────────┐
    │  v1.0   │      │  v1.6   │     │v1.1+v1.3 │
    │  Core   │      │Agent UI │     │SDK+Tools │
    └─────────┘      └─────────┘     └──────────┘
```

---

## 📊 Version Comparison Table

| Feature | v1.0 | v1.1 | v1.2 | v1.3 | v1.5 | v1.6 |
|---------|:----:|:----:|:----:|:----:|:----:|:----:|
| **4-Phase Process** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Governance Basics** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Input/Output Specs** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Agent Archetypes** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Skill Registry** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Risk Model (R0-R3)** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Python SDK** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **CLI Tools** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **CI/CD Templates** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Web UI** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **AI Agent Chat** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Multi-Agent** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Governance Toolkit** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Self-UAT** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 Choose Based on Your Needs

### Scenario 1: Solo Developer, Học Lần Đầu

**Your Profile:**
- 👤 Làm việc 1 mình
- 🆕 Mới dùng AI coding
- 📚 Muốn hiểu concepts trước

**Recommended:** **v1.0 (Core)**

**Why:**
- ✅ Đơn giản nhất
- ✅ Tập trung vào principles
- ✅ Không cần setup gì
- ✅ Đọc docs + follow checklist là được

**Get Started:**
```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF/v1.0
cat CVF_MANIFESTO.md
```

**Next Steps:**
1. Đọc [CVF_MANIFESTO.md](../v1.0/CVF_MANIFESTO.md)
2. Follow [4-Phase Process](../v1.0/phases/)
3. Use [Checklists](../v1.0/governance/)
4. Build 1-2 small projects
5. Sau đó upgrade lên v1.1 nếu cần

---

### Scenario 2: Muốn Build Ngay, Có Web UI

**Your Profile:**
- 🚀 Muốn build ngay, ít đọc docs
- 🖥️ Prefer UI hơn CLI
- 🤖 Muốn chat với AI trong CVF
- 📋 Cần templates sẵn

**Recommended:** **v1.6 (Agent Platform)**

**Why:**
- ✅ Web UI đầy đủ tính năng
- ✅ 50 templates sẵn
- ✅ Chat trực tiếp với AI
- ✅ Multi-agent workflow
- ✅ Self-UAT testing
- ✅ Governance toolkit

**Get Started:**
```bash
npx create-cvf-app my-project
cd my-project
npm start
# Or use quick-start.sh script
```

**Ideal For:**
- MVPs, prototypes
- Learning by doing
- Solo dev hoặc small teams (2-3)
- Non-technical users

---

### Scenario 3: Team nhỏ (2-5 người)

**Your Profile:**
- 👥 Team 2-5 người
- 🔄 Cần collaboration
- 📝 Cần audit trails
- ✅ Cần approval workflows

**Recommended:** **v1.1 + v1.6**

**Why:**
- ✅ v1.1: Input/output contracts cho team
- ✅ v1.1: Agent archetypes (roles)
- ✅ v1.1: Execution spine (audit)
- ✅ v1.6: Web UI for collaboration

**Get Started:**
```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF

# Setup v1.6 Web UI
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install && npm run dev

# Study v1.1 architecture
cd ../../../v1.1
cat QUICK_START.md
```

**Team Roles:**
- 🎯 Owner: Phase A (requirements)
- 🎨 Architect: Phase B (design)
- 🤖 AI/Developer: Phase C (build)
- ✅ Reviewer: Phase D (validate)

---

### Scenario 4: Production/Enterprise

**Your Profile:**
- 🏢 Team >5 người hoặc enterprise
- 🔐 Cần governance nghiêm ngặt
- 🔄 Cần CI/CD integration
- 📊 Cần metrics & reporting
- ⚖️ Cần compliance (audit logs)

**Recommended:** **v1.1 + v1.2 + v1.3 + v1.6**

**Why:**
- ✅ v1.1: Contracts & execution spine
- ✅ v1.2: Skill governance, risk model
- ✅ v1.3: SDK, CLI, CI/CD templates
- ✅ v1.6: UI + governance toolkit

**Get Started:**
```bash
# 1. Set up full stack
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF

# 2. Configure governance
cd governance/toolkit
# Edit policies, risk levels, authority matrix

# 3. Set up SDK for automation
cd ../../EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/sdk
pip3 install -e .

# 4. Set up Web UI
cd ../../../EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install
cp .env.example .env
# Configure .env for production

# 5. Integrate CI/CD
cd ../../../EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/ci-cd
# Copy GitHub Actions / GitLab CI templates
```

**Must-Have:**
- [ ] Governance policies defined
- [ ] Risk levels per phase
- [ ] Approval workflows
- [ ] CI/CD integration
- [ ] Metrics dashboard

---

### Scenario 5: Advanced - Customize/Contribute

**Your Profile:**
- 🛠️ Muốn extend CVF
- 🧩 Build custom skills
- 🔌 Integrate với tools khác
- 💻 Familiar with code

**Recommended:** **Full Stack (all versions)**

**Study Path:**
1. **v1.0** - Understand core principles
2. **v1.1** - Learn architecture
3. **v1.2** - Skill system internals
4. **v1.3** - SDK architecture
5. **v1.6** - Platform architecture

**Resources:**
- [Developer Guide](../docs/reference/developer-guide.md)
- [Skill Spec](../docs/reference/skill-spec.md)
- [API Reference](../docs/reference/api/)
- [Contributing Guide](../v1.0/CONTRIBUTING.md)

---

## 🔄 Migration Paths

### From v1.0 → v1.1

**When to migrate:**
- Team grows from 1 → 2+ people
- Need input/output specs
- Need audit trails

**How:**
1. Keep v1.0 process
2. Add [contracts](../v1.1/architecture/CONTRACT_SPECIFICATION.md)
3. Define [agent archetypes](../v1.1/agents/)
4. Use [execution spine](../v1.1/execution/)

**Effort:** 2-4 hours

---

### From v1.1 → v1.6

**When to migrate:**
- Team comfortable with v1.1
- Want Web UI
- Want AI agent features

**How:**
1. Keep v1.1 architecture
2. Add [v1.6 Web UI](../EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/)
3. Map your workflows to templates
4. Train team on UI

**Effort:** 1 day

---

### From Manual → Automated (v1.3)

**When:**
- Team >3 people
- Doing repetitive tasks
- Need CI/CD

**How:**
1. Install [Python SDK](../EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/sdk/)
2. Write automation scripts
3. Add [CI/CD templates](../EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/ci-cd/)
4. Integrate with existing tools

**Effort:** 2-3 days

---

## 📏 Quick Sizing Guide

### By Team Size

| Team Size | Recommended Version |
|-----------|---------------------|
| 1 person | v1.0 or v1.6 |
| 2-3 people | v1.1 + v1.6 |
| 4-10 people | v1.1 + v1.3 + v1.6 |
| 10+ people | Full stack + custom |

### By Project Complexity

| Project Type | Recommended Version |
|--------------|---------------------|
| Learning/POC | v1.0 |
| Side project | v1.6 |
| Startup MVP | v1.6 |
| Production SaaS | v1.1 + v1.3 + v1.6 |
| Enterprise | Full stack |

### By Time Investment

| Available Time | Start With |
|----------------|-----------|
| 5 minutes | v1.6 (Web UI) |
| 30 minutes | v1.0 (Core docs) |
| 2 hours | v1.1 (Architecture) |
| 1 day | Full setup |

---

## 🎓 Learning Paths by Version

### v1.0 Learning Path (2-3 hours)

1. Read [Manifesto](../v1.0/CVF_MANIFESTO.md) - 15 mins
2. Understand [4 Phases](../v1.0/phases/) - 30 mins
3. Study [Governance](../v1.0/governance/) - 30 mins
4. Practice with 1 small project - 60 mins

**Output:** You understand CVF principles

---

### v1.1 Learning Path (4-6 hours)

1. Review v1.0 first
2. Read [QUICK_START](../v1.1/QUICK_START.md) - 20 mins
3. Study [Architecture](../v1.1/architecture/) - 60 mins
4. Learn [Agents](../v1.1/agents/) - 30 mins
5. Practice [Execution Spine](../v1.1/execution/) - 90 mins
6. Build 1 team project - 120 mins

**Output:** You can run controlled team projects

---

### v1.6 Learning Path (1-2 hours)

1. Run Web UI - 5 mins
2. Try 3-5 templates - 30 mins
3. Explore agent chat - 20 mins
4. Test Self-UAT - 15 mins
5. Build 1 real thing - 60 mins

**Output:** You can build with CVF UI

---

## ⚖️ Pros & Cons Summary

### v1.0 (Core)

**Pros:**
- ✅ Simple, easy to learn
- ✅ No dependencies
- ✅ Pure concepts
- ✅ Great for learning

**Cons:**
- ❌ Manual everything
- ❌ No tooling
- ❌ Limited for teams

**Best For:** Solo learners

---

### v1.1 (Extended)

**Pros:**
- ✅ Team-ready
- ✅ Contracts & specs
- ✅ Audit trails
- ✅ Agent archetypes

**Cons:**
- ❌ More complex
- ❌ Still mostly manual
- ❌ No UI

**Best For:** Small teams

---

### v1.6 (Platform)

**Pros:**
- ✅ Web UI (easy)
- ✅ AI chat built-in
- ✅ Templates ready
- ✅ Multi-agent
- ✅ Governance toolkit

**Cons:**
- ❌ Requires setup
- ❌ Node.js needed
- ❌ Heavier than core

**Best For:** Quick builders

---

## 🚀 Quick Recommendations

**Just tell me what to use!**

| If you are... | Use this |
|---------------|----------|
| Absolute beginner | **v1.6** (Web UI) |
| Want to learn deeply | **v1.0** (Core) |
| Solo developer | **v1.6** |
| Team of 2-5 | **v1.1 + v1.6** |
| Enterprise team | **Full stack** |
| Want to contribute | **Full stack** |
| In a hurry | **v1.6** |
| Love documentation | **v1.0** |

---

## ❓ Still Confused?

**Answer these 3 questions:**

1. **Do you want a UI?**
   - Yes → v1.6
   - No → v1.0 or v1.1

2. **Are you working with a team?**
   - Yes → v1.1 + v1.6
   - No → v1.0 or v1.6

3. **Need production-grade?**
   - Yes → Full stack
   - No → v1.6

**Still not sure?**
- 💬 [Ask on Discord](https://discord.gg/cvf)
- 📧 [Email us](mailto:support@cvf.io)
- 🐛 [Open issue](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues/new?template=question.md)

---

## 📋 Checklist Before You Choose

Before deciding, ask yourself:

- [ ] Đã đọc [Core Philosophy](../docs/concepts/core-philosophy.md)?
- [ ] Hiểu [4-Phase Process](../docs/concepts/4-phase-process.md)?
- [ ] Biết team size & complexity của project?
- [ ] Có time để setup không?
- [ ] Cần governance không?
- [ ] Có budget cho infrastructure không?

**If all yes → Go Full Stack**

**If mostly no → Start with v1.6**

---

<div align="center">

**Nhớ:** Bạn có thể bắt đầu đơn giản và upgrade sau!

[⬅️ Back to Get Started](../docs/GET_STARTED.md)

</div>
